const { App, ExpressReceiver, LogLevel } = require('@slack/bolt');
const axios = require('axios');

const port = process.env.PORT || 3000;
const signingSecret = process.env.SLACK_SIGNING_SECRET;
const botToken = process.env.SLACK_BOT_TOKEN;

const intakeChannel = process.env.INTAKE_CHANNEL_ID;
const destinationChannelIds = (process.env.DESTINATION_CHANNEL_IDS || '')
  .split(',')
  .map(id => id.trim())
  .filter(Boolean);

// In-memory cache of processed file IDs to prevent double-processing
const processedFiles = new Set();

const receiver = new ExpressReceiver({
  signingSecret,
  endpoints: {
    '/slack/events': '/slack/events'
  }
});

const app = new App({
  token: botToken,
  receiver,
  logLevel: LogLevel.INFO
});

function isAudioFile(file) {
  const audioMIMEs = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/aac',
    'audio/ogg',
    'audio/x-m4a',
    'audio/mp4',
    'audio/webm',
    'audio/opus'
  ];
  const audioExtensions = ['mp3', 'm4a', 'wav', 'aac', 'ogg', 'opus'];

  const mime = file.mimetype || '';
  const filetype = file.filetype || '';
  const name = file.name ? file.name.toLowerCase() : '';

  const isMimeAudio = audioMIMEs.includes(mime);
  const isTypeAudio = filetype.startsWith('mp') || ['wav','aac','ogg','opus'].includes(filetype);
  const isExtAudio = audioExtensions.some(ext => name.endsWith('.' + ext));

  return isMimeAudio || isTypeAudio || isExtAudio;
}

app.event('file_shared', async ({ event, client, context }) => {
  try {
    const { file_id } = event;
    if (!file_id || processedFiles.has(file_id)) {
      return;
    }

    // Fetch full file info
    const fileInfo = await client.files.info({ file: file_id });
    const file = fileInfo.file;

    // Ignore files uploaded by this bot
    if (file.user === context.botUserId) {
      return;
    }

    // Determine channel
    const channel = event.channel_id || (file.channels && file.channels[0]);
    if (!channel || channel !== intakeChannel) {
      return;
    }

    // Only continue if the file is an audio file
    if (!isAudioFile(file)) {
      return;
    }

    processedFiles.add(file_id);

    // Download file from Slack using url_private
    const url = file.url_private;
    const headers = { Authorization: `Bearer ${botToken}` };
    const response = await axios.get(url, { headers, responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    // Forward to each destination channel
    for (const dest of destinationChannelIds) {
      try {
        await client.files.uploadV2({
          channels: dest,
          file: buffer,
          filename: file.name,
          title: file.title || file.name,
          initial_comment: `Forwarded from <#${intakeChannel}>`
        });
      } catch (err) {
        console.error(`Error uploading to ${dest}:`, err);
      }
    }
  } catch (error) {
    console.error('Error handling file_shared event:', error);
  }
});

(async () => {
  await app.start(port);
  console.log(`Slack audio forwarder app is running on port ${port}`);
})();
