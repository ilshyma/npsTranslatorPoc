import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import logger from '../logger';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function translateText(text: string, targetLanguage: string): Promise<string | null> {
  let retries = 2;

  while (retries >= 0) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Translate the following text to ${targetLanguage}:`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
      });

      const translatedText = response.choices[0].message.content;
      return translatedText;
    } catch (error) {
      logger.error('Error translating text:', error);

      if (retries === 0) {
        throw new Error('Translation failed after multiple attempts');
      }

      await sleep(5000); // Wait 5 seconds before retrying
      retries--;
    }
  }

  return null;
}