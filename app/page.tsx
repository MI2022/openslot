import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data, error } = await supabase.from('meeting_types').select()
  console.log('Supabase result:', data)
  console.log('Supabase error:', error)

  return (
    <main>
      <p>{error ? `DB error: ${error.message}` : 'DB connected'}</p>
    </main>
  )
}
