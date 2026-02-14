import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aporhmggvjufgonidwnv.supabase.co'
const supabaseAnonKey = 'sb_publishable_qt1f9Ym007GsJBB0nRclqg_VIEvKgXP'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)