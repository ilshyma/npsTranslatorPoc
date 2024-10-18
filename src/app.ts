import {
  isAlreadyDone,
  markAsDone,
  readDataFromSheet,
  writeDataToSheet,
} from "./googleSheets";
import { translateText } from "./googleTranslate";
import dotenv from "dotenv";

dotenv.config();

async function processSheet() {
  try {
    // Read data from Google Sheets (e.g., from column A)
    const rows = await readDataFromSheet();
    console.log(`Amount of rows: ${rows.length}`);

    for (const [index, row] of rows.entries()) {
      // Check if the translation is already done
      if (!(await isAlreadyDone(index + 1))) {
        // Ensure the function returns a Promise
        const textToTranslate = row[0]; // Assuming the first column has the text

        // Translate the text
        const translatedText = await translateText(textToTranslate, "ru"); // Translate to <XX>

        console.log(
          `Original: ${textToTranslate}, Translated: ${translatedText}`
        );

        // Write the translated text back to the sheet (in the second column, B)
        await writeDataToSheet(index + 1, translatedText ?? "not_found"); // Row index starts from 1 in Sheets API
        await markAsDone(index + 1);
      } else {
        console.log(
          `Skipping row ${index + 1} as it is already marked as done.`
        );
      }
    }

    console.log("Translation process completed.");
  } catch (error) {
    console.error("Error processing sheet:", error);
  }
}

processSheet();
