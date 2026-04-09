// app/api/admin/upload/route.ts
//
// Receives a multipart form upload, validates, uploads to Garage S3,
// returns the public URL and key. Protected by Basic Auth middleware.

import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3 }                from '@/server/lib/s3';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file     = formData.get('file') as File | null;
    const folder   = (formData.get('folder') as string | null) ?? 'products';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer   = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;

    const result = await uploadToS3(buffer, mimeType, folder, file.name);

    return NextResponse.json({
      url:  result.url,
      key:  result.key,
      name: file.name,
      size: file.size,
      type: mimeType,
    });

  } catch (err: any) {
    console.error('[upload] Error:', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Upload failed' },
      { status: 500 }
    );
  }
}
