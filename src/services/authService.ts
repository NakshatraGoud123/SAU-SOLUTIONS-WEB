import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { UserProfile, UserRole } from '../types'

export interface AuthPayload {
  name: string
  email: string
  password: string
  role?: UserRole
}

export interface AuthResult {
  success: boolean
  message: string
  profile?: UserProfile | null
}

function asFriendlyMessage(message: string) {
  if (message.toLowerCase().includes('invalid login')) return 'Invalid email or password.'
  if (message.toLowerCase().includes('user already registered')) return 'An account with this email already exists.'
  if (message.toLowerCase().includes('email')) return 'Please enter a valid email address.'
  if (message.toLowerCase().includes('password')) return 'Password must be at least 6 characters.'
  if (message.toLowerCase().includes('profiles')) return 'Your account profile is not available yet. Please try again shortly.'
  return 'Unable to complete authentication. Please try again.'
}

export async function loginWithEmail(payload: Pick<AuthPayload, 'email' | 'password'>): Promise<AuthResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Sign-in is unavailable because the Supabase connection is not configured.' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  })

  if (error || !data.user) {
    return {
      success: false,
      message: asFriendlyMessage(error?.message ?? 'Login failed.'),
    }
  }

  try {
    const profile = await getCurrentProfile()

    return {
      success: true,
      message: 'Welcome back!',
      profile,
    }
  } catch (profileError) {
    console.error('Could not load the signed-in profile.', profileError)
    await supabase.auth.signOut()
    return { success: false, message: 'You signed in, but your profile could not be loaded. Please try again later.' }
  }
}

export async function registerWithEmail(payload: AuthPayload): Promise<AuthResult> {
  const role = payload.role === 'partner' ? 'partner' : 'customer'
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Registration is unavailable because the Supabase connection is not configured.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.name,
        role,
      },
    },
  })

  if (error || !data.user) {
    return {
      success: false,
      message: asFriendlyMessage(error?.message ?? 'Registration failed.'),
    }
  }

  if (!data.session) {
    return {
      success: true,
      message: 'Check your email to confirm your SAU account before signing in.',
      profile: null,
    }
  }

  try {
    const profile = await getCurrentProfile()
    if (!profile) throw new Error('Profile creation did not complete.')
    return {
      success: true,
      message: 'Your SAU account is ready.',
      profile,
    }
  } catch (profileError) {
    console.error('Account was created but the profile could not be loaded.', profileError)
    return { success: false, message: 'Your account was created, but the profile could not be loaded. Please contact support.' }
  }
}

export async function resetPassword(email: string) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Password reset is unavailable because the Supabase connection is not configured.' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) {
    return {
      success: false,
      message: asFriendlyMessage(error.message),
    }
  }

  return {
    success: true,
    message: 'Password reset instructions were sent to your email.',
  }
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  if (!supabase) return null

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)

  return data as UserProfile | null
}

export async function getSession() {
  if (!supabase) return { data: { session: null }, error: new Error('Supabase is not configured.') }
  return supabase.auth.getSession()
}

export function onAuthStateChange(callback: Parameters<NonNullable<typeof supabase>['auth']['onAuthStateChange']>[0]) {
  if (!supabase) {
    return {
      data: {
        subscription: {
          unsubscribe: () => undefined,
        },
      },
    }
  }

  return supabase.auth.onAuthStateChange(callback)
}

export async function logout() {
  if (!supabase) return { success: false, message: 'Sign-out is unavailable because Supabase is not configured.' }

  const { error } = await supabase.auth.signOut()

  if (error) {
    return {
      success: false,
      message: asFriendlyMessage(error.message),
    }
  }

  return {
    success: true,
    message: 'You have been signed out.',
  }
}
