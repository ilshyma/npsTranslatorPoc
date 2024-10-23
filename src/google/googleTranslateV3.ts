import { v3 } from '@google-cloud/translate';
import path from 'path';
import dotenv from 'dotenv';
import logger from '../logger';

dotenv.config();

// Path to your credentials.json file
const keyFilePath = path.join(__dirname, "../../credentials/credentials.json");

// Set up the Google Cloud Translation API client
const translateClient = new v3.TranslationServiceClient({ keyFilename: keyFilePath });

// Function to translate text using v3 API
export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  // Input validation
  if (typeof text !== 'string' || text.trim() === '') {
    logger.error('Invalid text provided for translation.');
    return '';
  }

  if (typeof targetLanguage !== 'string' || targetLanguage.trim() === '') {
    logger.error('Invalid target language specified.');
    return '';
  }

  logger.info(`Translating text: "${text}" to language: "${targetLanguage}"`);

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID; // Ensure this is set in your .env file
  const location = 'global'; // Default location, can be changed if needed

  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [text],
    mimeType: 'text/plain', // Mime type of the content
    targetLanguageCode: targetLanguage,
  };

  try {
    // Making the API request to translate text
    const [response] = await translateClient.translateText(request);

    // Check if response contains translations
    if (response.translations && response.translations.length > 0) {
      const translatedText = response.translations[0].translatedText;
      logger.info(`Translated Text: ${translatedText}`);
      return translatedText ?? '';
    } else {
      logger.warn('No translations found in the response.');
      return '';
    }
  } catch (error) {
    // Improved error handling
    if (error instanceof Error) {
      logger.error(`Error during translation: ${error.message}`);
    } else {
      logger.error('Unexpected error during translation:', error);
    }
    return '';
  }
}