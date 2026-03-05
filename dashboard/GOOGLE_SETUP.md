# Google Cloud Setup for ETS WIG Hub Dashboard

Follow these steps to configure Google Cloud so the dashboard can read from and write to your ETS WIG Hub spreadsheet.

---

## 1. Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Click the project dropdown at the top and select **New Project**
3. Name it `ets-wig-hub` (or similar) and click **Create**
4. Make sure the new project is selected in the dropdown

## 2. Enable the Google Sheets API

1. In the left sidebar, go to **APIs & Services > Library**
2. Search for **Google Sheets API**
3. Click it and press **Enable**

## 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **+ CREATE CREDENTIALS > OAuth client ID**
3. If prompted, configure the **OAuth consent screen** first:
   - Choose **Internal** (if using Google Workspace) or **External**
   - Fill in app name: `ETS WIG Hub`
   - Add your email as support email and developer contact
   - On the Scopes page, add: `https://www.googleapis.com/auth/spreadsheets`
   - Save and go back to Credentials
4. Select application type: **Web application**
5. Name: `ETS WIG Hub Dashboard`
6. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (for local development)
   - Your production URL (e.g., `https://your-org.github.io` or `https://your-app.vercel.app`)
7. Click **Create**
8. Copy the **Client ID** (looks like `123456789-abc.apps.googleusercontent.com`)

## 4. Create an API Key

1. Go to **APIs & Services > Credentials**
2. Click **+ CREATE CREDENTIALS > API key**
3. Click **Restrict key** to secure it:
   - Under **API restrictions**, select **Restrict key**
   - Choose **Google Sheets API** from the dropdown
   - Under **Application restrictions**, select **HTTP referrers**
   - Add: `http://localhost:5173/*` and your production URL
4. Click **Save**
5. Copy the **API key**

## 5. Get Your Spreadsheet ID

1. Open your ETS WIG Hub Google Sheet
2. The URL looks like: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Copy the `SPREADSHEET_ID` portion from the URL

## 6. Configure the Dashboard

1. In the `dashboard/` directory, copy the example env file:

   ```bash
   cp .env.example .env
   ```

2. Fill in the values:

   ```
   VITE_SHEET_ID=your_spreadsheet_id_here
   VITE_GOOGLE_CLIENT_ID=your_oauth_client_id_here
   VITE_GOOGLE_API_KEY=your_api_key_here
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 and sign in with your Google account

## 7. Share the Spreadsheet

Make sure the Google Sheet is shared with all team members who will use the dashboard. They need at least **Editor** access to use the write-back features (updating scores, commitments, attendance, etc.).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Sign in" button does nothing | Check that the Client ID is correct in `.env` and the origin is in the authorized JavaScript origins |
| "Sheets API error: 403" | Ensure the Sheets API is enabled and the API key is not restricted to the wrong referrer |
| "Sheets API error: 404" | Check the Spreadsheet ID in `.env` — it should be the long string from the URL, not the sheet name |
| "Sheets write error: 403" | The signed-in user needs Editor access to the spreadsheet |
| OAuth consent screen shows "unverified" | Normal for internal/testing apps. Click "Continue" to proceed. For production, submit for Google verification. |
