import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import path from "path";
import dotenv from "dotenv";
import { sleep } from "../utils/utils";
import { PendingRow } from "./models/PendingRow";
import logger from "../logger";

dotenv.config();

const keyFilePath = path.join(__dirname, "../../credentials/credentials.json");

const auth = new GoogleAuth({
  keyFile: keyFilePath,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const spreadsheetId = process.env.GOOGLE_SHEET_ID || "";
const spreadsheetName = process.env.GOOGLE_SHEET_NAME || "";
const columnForSrcText = process.env.SOURCE_COLUMN || "A";
const columnForTranstate = process.env.TARGET_COLUMN || "B";
const columnForSentiment = process.env.SENTIMENT_COLUMN || "C";
const columnForStatus = process.env.STATUS_COLUMN || "D";

// Get pending rows
export async function getPendingRows(): Promise<PendingRow[]> {
  const rangeSrcText = `${spreadsheetName}!${columnForSrcText}:${columnForSrcText}`;
  const rangeStatus = `${spreadsheetName}!${columnForStatus}:${columnForStatus}`;

  try {
    const [responseA, responseC] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId, range: rangeSrcText }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: rangeStatus }),
    ]);

    const sourceValues = responseA.data.values || [];
    const statusValues = responseC.data.values || [];

    const pendingRows: PendingRow[] = sourceValues
      .map((row, index) => ({ rowIndex: index + 1, text: row[0] }))
      .filter((row, index) => statusValues[index]?.[0] !== "done");

    return pendingRows;
  } catch (error) {
    logger.error("Error retrieving pending rows:", error);
    throw error;
  }
}

/**
 * Write translation and sentiment to separate columns
 */
export async function writeTranslationAndSentiment(
  rowIndex: number,
  textTranslationValue: string,
  sentimentValue: string
) {
  const rangeTranslation = `${spreadsheetName}!${columnForTranstate}${rowIndex}`;
  const rangeSentiment = `${spreadsheetName}!${columnForSentiment}${rowIndex}`;

  try {
    // Update translation column
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: rangeTranslation,
      valueInputOption: "RAW",
      requestBody: {
        values: [[textTranslationValue]],
      },
    });
    await sleep(500);
    logger.info(
      `${rangeTranslation} updated with translation: ${textTranslationValue}`
    );

    // Update sentiment column
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: rangeSentiment,
      valueInputOption: "RAW",
      requestBody: {
        values: [[sentimentValue]],
      },
    });
    logger.info(`${rangeSentiment} updated with sentiment: ${sentimentValue}`);
    await sleep(500);
  } catch (error) {
    logger.error("Error writing translation and sentiment to sheet:", error);
  }
}

/**
 * Mark row as done in status column
 */
export async function markAsDone(rowIndex: number) {
  await writeDataToColumn(rowIndex, "done", columnForStatus);
}

/**
 * Write data to a specified column (single value)
 */
export async function writeDataToColumn(
  rowIndex: number,
  value: string,
  column: string
) {
  const range = `${spreadsheetName}!${column}${rowIndex}`;

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: [[value]],
      },
    });
    logger.info(`${range} updated with value: ${value}`);
    await sleep();
  } catch (error) {
    logger.error("Error writing data to column:", error);
  }
}
