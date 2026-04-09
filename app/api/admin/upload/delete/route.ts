// app/api/admin/upload/delete/route.ts
//
// Deletes a Garage S3 object by key or full URL.
// Called when an image is removed from the form before the product is saved.

import { NextRequest, NextResponse } from 'next/server';
import { deleteFromS3, urlToKey }    from '@/server/lib/s3';
import { z }                         from 'zod';

const bodySchema = z.object({
  key: z.string().optional(),
  url: z.string().optional(),
}).refine(d => d.key || d.url, { message: 'Provide key or url' });

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { key, url } = parsed.data;

  // Resolve key from URL if not provided directly
  const resolvedKey = key ?? (url ? urlToKey(url) : null);

  if (!resolvedKey) {
    return NextResponse.json(
      { error: 'Could not resolve S3 key from provided url' },
      { status: 400 }
    );
  }

  try {
    await deleteFromS3(resolvedKey);
    return NextResponse.json({ success: true, key: resolvedKey });
  } catch (err: any) {
    console.error('[upload/delete] Error:', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Delete failed' },
      { status: 500 }
    );
  }
}
