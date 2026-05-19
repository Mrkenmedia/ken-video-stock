import * as fs from 'fs';
import * as path from 'path';

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      
      const equalsIdx = trimmed.indexOf('=');
      if (equalsIdx !== -1) {
        const key = trimmed.substring(0, equalsIdx).trim();
        let val = trimmed.substring(equalsIdx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        val = val.replace(/\\n/g, '\n');
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.error('Error loading env file:', e);
}

async function testSpecificFile() {
  try {
    const { drive } = await import('./src/lib/google');
    const demoId = '1FUQSB8NTcDQClKQ3x-FPxnP38bCe0ek2';
    
    console.log(`Testing Google Drive API access for file ID: ${demoId}`);
    
    console.log('Fetching file metadata...');
    const meta = await drive.files.get({
      fileId: demoId,
      fields: 'mimeType,size,name',
    });
    console.log('Metadata success:', meta.data);
    
    console.log('Fetching file media stream...');
    const media = await drive.files.get(
      {
        fileId: demoId,
        alt: 'media',
      },
      {
        responseType: 'stream',
      }
    );
    console.log('Media fetch success! Status:', media.status, 'Headers:', media.headers);
  } catch (error: any) {
    console.error('ERROR during testing:', error.message || error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testSpecificFile();
