import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import path from "path";
import dotenv from "dotenv";

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


// Read data from the first column (A)
export async function readDataFromSheet() {
  const range = `${spreadsheetName}!${columnForSrcText}:${columnForSrcText}`; // Use the correct sheet name here
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return response.data.values || [];
  } catch (error) {
    console.error("Error reading data from sheet:", error);
    throw error; // Rethrow the error for handling in the caller
  }
}

export async function isAlreadyDone(rowIndex: number): Promise<boolean> {
    const range = `${spreadsheetName}!${columnForStatus}${rowIndex}`; // Specify the range for the status column
    
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
  
      const statusValue = response.data.values?.[0]?.[0]; // Get the status value from the response
  
      // Return true if the status is "done", otherwise return false
      return statusValue === 'done';
    } catch (error) {
      console.error("Error checking status in sheet:", error);
      throw error; // Rethrow the error for handling in the caller
    }
  }


export async function markAsDone(
    rowIndex: number,
  ) {
    writeDataToSheet(rowIndex, 'done', columnForStatus);
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
    console.log(`${columnForEdit}${rowIndex} updated with text: ${textValue}`);
  } catch (error) {
    console.error("Error writing data to sheet:", error);
  }
}
