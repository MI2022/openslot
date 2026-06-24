import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.json();
  const { rows } = body as {
    rows: { day_of_week: number; start_time: string; end_time: string }[];
  };

  const { error: deleteError } = await supabaseAdmin
    .from('availability')
    .delete()
    .gte('day_of_week', 0);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from('availability')
      .insert(rows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
