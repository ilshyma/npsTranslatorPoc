import { GoogleSpreadsheet } from 'google-spreadsheet';
import { Translate } from '@google-cloud/translate/build/src/v2';
import { GoogleAuth } from 'google-auth-library';
import * as dotenv from 'dotenv';
import path = require('path');

// Load environment variables
dotenv.config();

// Google Translate client
const translate = new Translate({ projectId: process.env.GOOGLE_PROJECT_ID });

// Load the Google credentials
const credsPath = path.join(__dirname, '../', process.env.GOOGLE_APPLICATION_CREDENTIALS!);

const auth = new GoogleAuth({
  keyFile: credsPath,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Create the GoogleSpreadsheet instance with both spreadsheetId and auth
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, auth);

export { doc, translate };