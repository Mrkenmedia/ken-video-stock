import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Readable } from 'stream';
import { drive } from '@/lib/google';
import { getYouTubeService } from '@/lib/youtube';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const title = form.get('title')?.toString() || '';
    const subtitle = form.get('subtitle')?.toString() || '';
    const videoFile = form.get('videoFile') as File | null;
    const demoFile = form.get('demoFile') as File | null;
    const uploadToYouTube = form.get('uploadToYouTube') === 'true';

    // Thư mục mặc định nếu không cấu hình env (bạn có thể thay đổi sau)
    const MP4_FOLDER_ID = process.env.DRIVE_MP4_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || '';
    const MOV_FOLDER_ID = process.env.DRIVE_MOV_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || '';

    if (!videoFile) {
      return NextResponse.json({ error: 'File video gốc là bắt buộc' }, { status: 400 });
    }

    const uploadToDrive = async (file: File, folderId: string) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const stream = Readable.from(buffer);
      const response = await drive.files.create({
        requestBody: {
          name: file.name,
          parents: folderId ? [folderId] : undefined, // Nếu không có folderId, upload vào root
          mimeType: file.type || 'video/mp4',
        },
        media: {
          mimeType: file.type || 'video/mp4',
          body: stream,
        },
        fields: 'id',
      });
      
      // Chia sẻ file công khai để ai cũng xem được (bắt buộc cho Storefront)
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
    };

    const isMp4 = videoFile.name.toLowerCase().endsWith('.mp4');
    const folderToUse = isMp4 ? MP4_FOLDER_ID : MOV_FOLDER_ID;
    
    // Upload file gốc
    const videoDriveId = await uploadToDrive(videoFile, folderToUse);
    
    // Upload file demo lên drive (nếu có)
    let demoDriveId: string | null = null;
    if (demoFile) {
      demoDriveId = await uploadToDrive(demoFile, folderToUse);
    }

    // Tùy chọn upload YouTube
    let youtubeDemoId: string | null = null;
    if (uploadToYouTube && demoFile) {
      try {
        const youtube = await getYouTubeService();
        const demoBuffer = Buffer.from(await demoFile.arrayBuffer());
        
        const response = await youtube.videos.insert({
          part: ['snippet', 'status'],
          requestBody: {
            snippet: {
              title: title ? `${title} - Demo` : demoFile.name,
              description: subtitle || 'Demo footage from MrKen Media',
              tags: ['MrKen Media', 'stock footage', 'demo'],
            },
            status: {
              privacyStatus: 'unlisted', // unlisted để ẩn khỏi channel public, nhưng vẫn nhúng được
            },
          },
          media: {
            body: Readable.from(demoBuffer),
          },
        });
        youtubeDemoId = response.data.id ?? null;
      } catch (ytError: any) {
        console.error('Lỗi upload YouTube:', ytError?.message || ytError);
        // Không return error để quy trình vẫn hoàn thành, ta sẽ trả về ID YouTube null
      }
    }

    return NextResponse.json({
      success: true,
      mp4Id: isMp4 ? videoDriveId : null,
      movId: !isMp4 ? videoDriveId : null,
      demoDriveId: demoDriveId,
      youtubeDemoId: youtubeDemoId,
    });
  } catch (error: any) {
    console.error('Lỗi upload product media:', error);
    return NextResponse.json({ error: error?.message || 'Upload thất bại' }, { status: 500 });
  }
}
