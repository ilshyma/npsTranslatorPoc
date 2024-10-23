import {
  getPendingRows,
  markAsDone,
  writeDataToSheet,
} from "./google/googleSheets";
import { translateText } from "./openai/openAiTranslate";
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
        const translatedText = await translateText(
          text,
          process.env.TARGET_LANGUAGE ?? "ru"
        );
        logger.debug(`Original: ${text}, Translated: ${translatedText}`);

        await writeDataToSheet(rowIndex, translatedText || "not_found");

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
