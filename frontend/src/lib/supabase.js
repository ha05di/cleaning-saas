import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nocctoqxfoympzfvbmge.supabase.co";
const supabaseAnonKey = "sb_publishable_QQKMLRrFTg1bnfg9Atuz7Q_hCB2dqZT";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);