import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { handleError } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    await authenticate(req);
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ message: 'Storage not configured' }, { status: 500 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${crypto.randomUUID()}.${file.name.split('.').pop()}`;
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase.storage.from('chat-attachments').upload(filename, buffer, { contentType: file.type, upsert: true });
    const publicUrl = supabase.storage.from('chat-attachments').getPublicUrl(filename).data.publicUrl;

    return NextResponse.json({ filename, originalname: file.name, size: file.size, mimetype: file.type, path: publicUrl });
  } catch (err) { return handleError(err, '/api/upload'); }
}
