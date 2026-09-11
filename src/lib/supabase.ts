import { createClient } from '@supabase/supabase-js'

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL) as string | undefined
const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string | undefined

const supabaseUrl = rawUrl ? rawUrl.trim().replace(/\/+$/, '') : ''
const supabaseAnonKey = rawAnonKey ? rawAnonKey.trim() : ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing Supabase client environment variables in .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

