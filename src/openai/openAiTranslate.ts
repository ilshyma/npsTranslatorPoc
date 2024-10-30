import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import logger from '../logger';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function translateAndAnalyzeText(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<{ translatedText: string | null; sentiment: string | null }> {
  let retries = 2;

  while (retries >= 0) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Translate the following text${sourceLanguage ? ` from ${sourceLanguage}` : ''} to ${targetLanguage} and analyze its sentiment as either "positive," "negative," or "neutral". Respond in this format:\n\nTranslation: <translated text>\nSentiment: <sentiment>`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
      });

      const responseText = response.choices?.[0]?.message?.content || null;

      if (!responseText) {
        throw new Error("Received an empty or null response from the API");
      }

      // Parsing the response text for translation and sentiment
      const translationMatch = responseText.match(/Translation:\s*(.*)/i);
      const sentimentMatch = responseText.match(/Sentiment:\s*(positive|negative|neutral)/i);

      const translatedText = translationMatch ? translationMatch[1].trim() : null;
      const sentiment = sentimentMatch ? sentimentMatch[1].trim() : null;

      return { translatedText, sentiment };
    } catch (error) {
      logger.error('Error translating and analyzing text:', error);

      if (retries === 0) {
        throw new Error('Translation and analysis failed after multiple attempts');
      }

      await sleep(5000); // Wait 5 seconds before retrying
      retries--;
    }
  }

  return { translatedText: null, sentiment: null };
}