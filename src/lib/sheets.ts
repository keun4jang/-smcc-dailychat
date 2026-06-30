import "server-only";
import { google } from "googleapis";

function getAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) return null;

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function appendSheetRow(sheetName: string, values: (string | number | null | undefined)[]) {
  try {
    const auth = getAuth();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    if (!auth || !spreadsheetId) return;

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values.map((v) => (v ?? "").toString())],
      },
    });
  } catch (error) {
    console.error(`Sheets append failed for ${sheetName}:`, error);
  }
}
