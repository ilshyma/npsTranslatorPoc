import {
  getPendingRows,
  markAsDone,
  writeTranslationAndSentiment,
} from "./google/googleSheets";
import { translateAndAnalyzeText } from "./openai/openAiTranslate";
// import { translateText } from "./google/googleTranslateV3";
import dotenv from "dotenv";
import { sleep } from "./utils/utils";
import logger from "./logger";

dotenv.config();

async function processSheet() {
  try {
    const rows = await getPendingRows();
    logger.info(`Amount of rows to handle: ${rows.length}`);

    for (const row of rows) {
      const { rowIndex, text } = row;

      logger.info(`Processing row: ${rowIndex}, Text: "${text}"`);

      try {
        // Call the new translation function that also performs sentiment analysis
        const { translatedText, sentiment } = await translateAndAnalyzeText(
          text,
          process.env.TARGET_LANGUAGE ?? "ru",
          process.env.SOURCE_LANGUAGE ?? "az"
        );

        logger.debug(
          `Original: ${text}, Translated: ${translatedText}, Sentiment: ${sentiment}`
        );

        // Write the translated text and optionally the sentiment to the sheet
        await writeTranslationAndSentiment(
          rowIndex,
          translatedText || "not_found",
          sentiment || "unknown"
        );

        await markAsDone(rowIndex);
        logger.info(`Row ${rowIndex} marked as done.`);
      } catch (error) {
        logger.error(`Error translating or updating row ${rowIndex}: ${error}`);
      }
    }

    logger.info("Translation process completed.");
  } catch (error) {
    logger.error(`Error processing sheet: ${error}`);
  }
}

processSheet();
