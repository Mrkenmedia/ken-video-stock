import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

let youtubeClient: any | null = null;

export async function getYouTubeService() {
  if (youtubeClient) return youtubeClient;

  if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET || !process.env.YOUTUBE_REFRESH_TOKEN) {
    throw new Error('Thiếu cấu hình YouTube credentials trong .env.local');
  }

  const auth = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET
  );

  auth.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
  });

  youtubeClient = google.youtube({ version: 'v3', auth });
  return youtubeClient;
}
