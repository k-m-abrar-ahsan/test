const express = require("express");
const { google } = require("googleapis");
const axios = require("axios");
const app = express();

app.use(express.json());
const PORT = process.env.PORT || 3000;

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
if (!process.env.GOOGLE_CREDENTIALS) {
  throw new Error("GOOGLE_CREDENTIALS is not defined. Please set it in Render.");
}

const spreadsheetId = "1LyLycT6mXu87ib6BLDC_Tzxg4CbADH7K9heguyU6rl8/edit?gid=485606227#gid=485606227";
const sheetName = "VisaData";

// Handle webhook
app.post("/webhook", async (req, res) => {
  const body = req.body;
  const message = body.message?.body?.toLowerCase() || "";
  const sender = body.message?.from;

  console.log("Incoming message:", message);

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const result = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:D`,
  });

  const rows = result.data.values;

  let response = "Sorry, I couldn't find visa details for that query.";

  for (const row of rows) {
    const [country, visaType, cost, requirements] = row;
    if (
      message.includes(country.toLowerCase()) &&
      message.includes(visaType.toLowerCase())
    ) {
      response = `Visa Info:\nCountry: ${country}\nType: ${visaType}\nCost: ${cost}\nRequirements: ${requirements}`;
      break;
    }
  }

  // Send message back using UltraMsg
  await axios.post(`https://api.ultramsg.com/instanceID/messages/chat`, {
    token: "YOUR_ULTRAMSG_TOKEN",
    to: sender,
    body: response,
  });

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
