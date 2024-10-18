import {
  getPendingRows,
  markAsDone,
  writeDataToSheet,
} from "./googleSheets";
import { translateText } from "./googleTranslate";
import dotenv from "dotenv";

dotenv.config();

// Updated processSheet function using PendingRow interface
async function processSheet() {
  try {
    // Read pending rows (with both rowIndex and text)
    const rows = await getPendingRows();
    console.log(`Amount of rows to handle: ${rows.length}`);

    for (const row of rows) {
      const { rowIndex, text } = row; // Destructure rowIndex and text from each PendingRow

      console.log(`Processing row: ${rowIndex}, Text: "${text}"`);

      // Translate the text
      const translatedText = await translateText(text, "ru"); // Translate to Russian (change as needed)

      console.log(`Original: ${text}, Translated: ${translatedText}`);

      // Write the translated text back to the sheet (in the second column, B)
      await writeDataToSheet(rowIndex, translatedText ?? "not_found");

      // Mark the row as done in the status column (C)
      await markAsDone(rowIndex);
    }

    console.log("Translation process completed.");
  } catch (error) {
    console.error("Error processing sheet:", error);
  }
}

processSheet();
