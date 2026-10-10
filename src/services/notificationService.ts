import { requireSupabaseClient } from '../lib/supabase'

export async function fetchNotifications(userId: string) {
  const client = requireSupabaseClient()
  const { data, error } = await client.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const client = requireSupabaseClient()
  const { error } = await client.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('id', notificationId)
  if (error) throw new Error(error.message)
}
