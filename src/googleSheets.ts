import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import path from "path";
import dotenv from "dotenv";
import { sleep } from "./utils";
import { deprecate } from "util";
import { PendingRow } from "./PendingRow";

dotenv.config();

const keyFilePath = path.join(__dirname, "../credentials/credentials.json");

const auth = new GoogleAuth({
  keyFile: keyFilePath,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const spreadsheetId = process.env.GOOGLE_SHEET_ID;
const spreadsheetName = process.env.GOOGLE_SHEET_NAME;
const columnForSrcText = process.env.SOURCE_COLUMN;
const columnForTranstate = process.env.TARGET_COLUMN;
const columnForStatus = process.env.STATUS_COLUMN;

// Read data from the first column (A) and check corresponding status in column C
export async function getPendingRows(): Promise<PendingRow[]> {
  const rangeA = `${spreadsheetName}!${columnForSrcText}:${columnForSrcText}`; // Column A range
  const rangeC = `${spreadsheetName}!${columnForStatus}:${columnForStatus}`; // Column C range

  try {
    // Read values from both ranges
    const [responseA, responseC] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: rangeA,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: rangeC,
      }),
    ]);

    const sourceValues = responseA.data.values || [];
    const statusValues = responseC.data.values || [];

    // Filter to get only the rows where the status in column C is not "done"
    const pendingRows: PendingRow[] = sourceValues
      .map((row, index) => ({ rowIndex: index + 1, text: row[0] })) // Add row index and text to each row
      .filter((row, index) => {
        const statusValue = statusValues[index]?.[0];
        return statusValue !== "done"; // Check if status is not "done"
      });

    return pendingRows; // Return the array of pending rows with their index and text
  } catch (error) {
    console.error("Error retrieving pending rows:", error);
    throw error; // Rethrow the error for handling in the caller
  }
}

/**
 * @deprecated
 */
// Read data from the first column (A)
export async function readDataFromSheet() {
  const range = `${spreadsheetName}!${columnForSrcText}:${columnForSrcText}`; // Use the correct sheet name here
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    await sleep(2000);
    return response.data.values || [];
  } catch (error) {
    console.error("Error reading data from sheet:", error);
    throw error; // Rethrow the error for handling in the caller
  }
}

/**
 * @deprecated
 */
export async function isAlreadyDone(rowIndex: number): Promise<boolean> {
  const range = `${spreadsheetName}!${columnForStatus}${rowIndex}`; // Specify the range for the status column

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const statusValue = response.data.values?.[0]?.[0]; // Get the status value from the response

    // Return true if the status is "done", otherwise return false
    await sleep();
    return statusValue === "done";
  } catch (error) {
    console.error("Error checking status in sheet:", error);
    throw error; // Rethrow the error for handling in the caller
  }
}

export async function markAsDone(rowIndex: number) {
  writeDataToSheet(rowIndex, "done", columnForStatus);
  await sleep();
}

// Write text to the column
export async function writeDataToSheet(
  rowIndex: number,
  textValue: string,
  column?: string
) {
  const columnForEdit = column ?? columnForTranstate;
  const range = `${spreadsheetName}!${columnForEdit}${rowIndex}`; // Write to the column

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: [[textValue]],
      },
    });
    await sleep();
    console.log(`${columnForEdit}${rowIndex} updated with text: ${textValue}`);
  } catch (error) {
    console.error("Error writing data to sheet:", error);
  }
}
