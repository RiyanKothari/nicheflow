import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmF1bHQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY4MjExMzEwNiwiZXhwIjoyMDAwMDAwMDAwfQ.xXy9-oZ1T_-Z_0S_oD1o-W_2_Q_wX_z_w_Z_w_w_Z_w' // Let's use the actual local key if available

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
