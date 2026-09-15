import { createClient } from '@supabase/supabase-js';

// Acessando as variáveis de ambiente públicas no Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Criando e exportando o cliente
export const supabase = createClient(supabaseUrl, supabaseKey);