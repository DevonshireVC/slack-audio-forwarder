# Slack Audio Forwarder

This Slack app automatically forwards audio files from a designated intake channel to one or more destination channels. It is built with Node.js and the Slack Bolt framework. The app listens for the `file_shared` event, checks whether the shared file is an audio type, and re‑uploads the audio file to the configured destination channels. Duplicate forwarding and loops are prevented.

## Features

- Listens for Slack `file_shared` events.
- Detects audio files by mimetype, filetype, or extension (mp3, m4a, wav, aac, ogg, opus).
- Processes files only when they are shared in a configured intake channel.
- Re‑uploads audio files to one or more destination channels.
- Ignores files uploaded by the bot itself and deduplicates based on file ID.
- No interactive commands or user input required.

## Setup

### 1. Create a Slack App

1. Go to [Slack API](https://api.slack.com/apps) and create a new app.
2. Under **OAuth & Permissions** add the following **Bot Token Scopes**:
   - `channels:read`
   - `channels:history`
   - `files:read`
   - `files:write`
   - `chat:write`
   - For private channels, also include:
     - `groups:read`
     - `groups:history`
     - `groups:write`
3. Install the app to your workspace and copy the **Bot User OAuth Token** (starts with `xoxb-`).
4. Invite the bot to your intake channel and all destination channels using `/invite @YourBot`.

### 2. Set up Event Subscriptions

1. In your Slack app settings, open **Event Subscriptions**.
2. Enable events and set the **Request URL** to your deployed endpoint on Render: `https://<YOUR-RENDER-URL>/slack/events`.
3. Subscribe to the **Bot Event** `file_shared`.

### 3. Configure Environment Variables

The app relies on the following environment variables. On Render, add these via the **Environment** tab. For local development, create a `.env` file.

- `SLACK_SIGNING_SECRET`: Found under **Basic Information** of your Slack app.
- `SLACK_BOT_TOKEN`: Your bot user OAuth token from the Slack app installation.
- `INTAKE_CHANNEL_ID`: The channel ID of the intake channel (e.g., `C1234567890`).
- `DESTINATION_CHANNEL_IDS`: Comma‑separated list of destination channel IDs (e.g., `C1111111111,C2222222222`).
- `PORT`: The port the app listens on (default is `3000`).

An example template is provided in `.env.example`.

## Deployment on Render

1. Create a new **Web Service** on [Render](https://render.com/) and connect it to this GitHub repository.
2. Choose **Docker** as the environment. The included `Dockerfile` installs dependencies and starts the app.
3. Set the port to `3000`.
4. Add the environment variables listed above.
5. Deploy the service. Note the generated URL (e.g., `https://your-app.onrender.com`). Use `https://your-app.onrender.com/slack/events` as the Request URL in Slack.

## Running Locally

1. Clone this repository.

   ```bash
   git clone https://github.com/<your-username>/slack-audio-forwarder.git
   cd slack-audio-forwarder
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and fill in your Slack credentials and channel IDs.

4. Start the app:

   ```bash
   npm start
   ```

The app will run on `http://localhost:3000`. Use `http://localhost:3000/slack/events` as your Request URL for local testing.
