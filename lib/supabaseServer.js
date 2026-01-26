// lib/supabaseServer.js
// Server-side Supabase client (SSR, API routes)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

// Client pour les API routes avec service role (admin)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Alias pour compatibilité
export const supabaseServer = supabaseAdmin

// Client pour SSR avec cookies (authentification utilisateur)
export function createServerSupabaseClient(context) {
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Gérer les cookies côté serveur si nécessaire
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
