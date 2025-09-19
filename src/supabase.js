// src/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// OAuth sign in functions
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export const signInWithGitHub = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

// Traditional email/password auth (backup option)
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Profile management
export const getUserProfile = async () => {
  const user = await getCurrentUser()
  if (!user) return { data: null, error: 'No user' }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { data, error }
}

export const updateUserProfile = async (updates) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('No user logged in')

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  return { data, error }
}

// Score management functions
export const saveBestScore = async (levelId, score) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  // First try to get existing score
  const { data: existing } = await supabase
    .from('user_scores')
    .select('best_score, total_attempts')
    .eq('user_id', user.id)
    .eq('level_id', levelId)
    .single()

  if (existing) {
    // Update if this is a better score
    if (score < existing.best_score) {
      const { data, error } = await supabase
        .from('user_scores')
        .update({ 
          best_score: score, 
          total_attempts: existing.total_attempts + 1 
        })
        .eq('user_id', user.id)
        .eq('level_id', levelId)
      return { data, error }
    } else {
      // Just update attempt count
      const { data, error } = await supabase
        .from('user_scores')
        .update({ total_attempts: existing.total_attempts + 1 })
        .eq('user_id', user.id)
        .eq('level_id', levelId)
      return { data, error }
    }
  } else {
    // Insert new score
    const { data, error } = await supabase
      .from('user_scores')
      .insert({
        user_id: user.id,
        user_email: user.email,
        level_id: levelId,
        best_score: score,
        total_attempts: 1
      })
    return { data, error }
  }
}

export const getBestScore = async (levelId) => {
  const user = await getCurrentUser()
  if (!user) return { data: null, error: null }

  const { data, error } = await supabase
    .from('user_scores')
    .select('best_score, total_attempts')
    .eq('user_id', user.id)
    .eq('level_id', levelId)
    .single()

  return { data, error }
}

export const getAllUserScores = async () => {
  const user = await getCurrentUser()
  if (!user) return { data: [], error: null }

  const { data, error } = await supabase
    .from('user_scores')
    .select('*')
    .eq('user_id', user.id)
    .order('level_id')

  return { data, error }
}

// Leaderboard functions
export const getGlobalLeaderboard = async (levelId, limit = 10) => {
  const { data, error } = await supabase
    .from('user_scores')
    .select(`
      best_score,
      user_profiles!inner(display_name, avatar_url)
    `)
    .eq('level_id', levelId)
    .order('best_score', { ascending: true })
    .limit(limit)

  return { data, error }
}