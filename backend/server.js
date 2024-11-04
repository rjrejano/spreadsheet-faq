const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// Load Google Sheets credentials from file path specified in environment variables
const googleSheetsCredentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH;
const credentials = JSON.parse(fs.readFileSync(googleSheetsCredentialsPath));
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

// OpenAI API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Helper function to get response from OpenAI API
async function getOpenAIResponse(prompt) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', // Updated to use the newer chat model
        messages: [
          { role: 'system', content: 'You are a helpful assistant that can analyze spreadsheet data and answer questions based on it.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating answer from OpenAI:', error.response?.data || error.message);
    throw new Error('Failed to generate answer');
  }
}

// Endpoint to retrieve data from Google Sheets
let sheetData = []; // Global variable to store sheet data
app.post('/api/sheet', async (req, res) => {
  const { url } = req.body;

  const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!sheetIdMatch) {
    return res.status(400).json({ error: 'Invalid Google Sheets URL' });
  }
  const spreadsheetId = sheetIdMatch[1];

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet', // Adjust the range if needed
    });

    const rows = response.data.values;
    if (rows && rows.length > 0) {
      sheetData = rows; // Store data for use in AI processing
      res.json({ data: rows });
    } else {
      res.json({ message: 'No data found in the spreadsheet.' });
    }
  } catch (error) {
    console.error('Error retrieving spreadsheet data:', error);
    res.status(500).json({ error: 'Failed to retrieve spreadsheet data' });
  }
});

// Endpoint to process questions and generate answers with OpenAI
app.post('/api/ask', async (req, res) => {
  const { question } = req.body;

  if (!sheetData || sheetData.length === 0) {
    return res.status(400).json({ error: 'No spreadsheet data available. Please submit a valid Google Sheets URL first.' });
  }

  try {
    // Format the sheet data as a context for the AI model
    const sheetContent = sheetData.map(row => row.join('\t')).join('\n');
    const prompt = `
    Here is some data from a spreadsheet:\n\n${sheetContent}\n\nBased on the data, please answer the following question:\n\n${question}
    `;

    // Get the answer from OpenAI
    const answer = await getOpenAIResponse(prompt);
    res.json({ answer });
  } catch (error) {
    console.error('Error generating answer:', error);
    res.status(500).json({ error: 'Failed to generate answer' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
