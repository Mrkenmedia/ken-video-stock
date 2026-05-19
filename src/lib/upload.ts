import { drive } from '@/lib/google';
import { getYouTubeService } from '@/lib/youtube';
import { Readable } from 'stream';

export async function uploadToDrive(file: File, folderId?: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const stream = Readable.from(buffer);
  
  const response = await drive.files.create({
    requestBody: {
      name: file.name,
      parents: folderId ? [folderId] : undefined,
      mimeType: file.type || 'video/mp4',
    },
    media: {
      mimeType: file.type || 'video/mp4',
      body: stream,
    },
    fields: 'id',
  });
  
  if (response.data.id) {
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  }

  return response.data.id!;
}

export async function uploadToYouTube(file: File, title: string, subtitle: string) {
  const youtube = await getYouTubeService();
  const buffer = Buffer.from(await file.arrayBuffer());
  
  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: title ? `${title} - Demo` : file.name,
        description: subtitle || 'Demo footage from MrKen Media',
        tags: ['MrKen Media', 'stock footage', 'demo'],
      },
      status: {
        privacyStatus: 'unlisted', 
      },
    },
    media: {
      body: Readable.from(buffer),
    },
  });
  
  return response.data.id ?? null;
}
