import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const keyFilePath = path.join(__dirname, "../credentials/credentials.json");

// Set up Google Auth
const auth = new GoogleAuth({
  keyFile: keyFilePath,
  scopes: ["https://www.googleapis.com/auth/cloud-translation"],
});

// Initialize the Google Translate API client
const translate = google.translate({ version: "v2", auth });

// Define interfaces to match the expected API response structure
interface Translation {
  translatedText: string;
  detectedSourceLanguage: string;
}

interface TranslationsListResponse {
  data: {
    data: {
      translations: Translation[];
    };
  };
}

// Utility function for logging
function logResponse(response: any) {
  console.log("API Response:", JSON.stringify(response, null, 2));
}

// Function to translate text
export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  // Input validation
  if (typeof text !== "string" || text.trim() === "") {
    console.error("Invalid text provided for translation.");
    return "";
  }

  if (typeof targetLanguage !== "string" || targetLanguage.trim() === "") {
    console.error("Invalid target language specified.");
    return "";
  }

  console.log(`Translating text: "${text}" to language: "${targetLanguage}"`);

  try {
    const res = (await translate.translations.list({
      q: [text], // Pass text as an array
      target: targetLanguage,
    })) as unknown as TranslationsListResponse; // Cast the response to your defined interface

    // Log the full response for debugging
    // logResponse(res);

    // Check if the response contains translations
    if (
      res.data &&
      res.data.data.translations &&
      res.data.data.translations.length > 0
    ) {
      const translatedText = res.data.data.translations[0].translatedText; // Access translated text
      console.log(`Translated Text: ${translatedText}`);
      return translatedText;
    } else {
      console.warn("No translations found in the response.");
      return "";
    }
  } catch (error) {
    // Improved error handling
    if (error instanceof Error) {
      console.error(`Error during translation: ${error.message}`);
    } else {
      console.error("Unexpected error during translation:", error);
    }
    return ""; // Return an empty string on error
  }
}
