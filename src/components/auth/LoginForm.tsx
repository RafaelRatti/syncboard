'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface LoginFormProps {
  onSwitchMode: () => void;
}

export default function LoginForm({ onSwitchMode }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Tradutor de erros nativos do Supabase para PT-BR
  const translateError = (msg: string) => {
    if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('Email not confirmed')) return 'E-mail não confirmado. Verifique sua caixa de entrada.';
    if (msg.includes('rate limit')) return 'Muitas tentativas. Tente novamente mais tarde.';
    return 'Ocorreu um erro inesperado. Tente novamente.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (authError) {
      setError(translateError(authError.message));
    }
    setLoading(false);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500 mb-2">SyncBoard</h1>
        <p className="text-sm text-zinc-400">Acesse seu quadro para continuar.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-6 text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">E-mail</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors" placeholder="seu@email.com" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Senha</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors" placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg hover:shadow-zinc-700/20 active:scale-95 mt-2 disabled:opacity-50">
          {loading ? 'Aguarde...' : 'Entrar'}
        </button>
      </form>

      <p className="text-center text-xs text-zinc-500 mt-6">
        Não tem uma conta?{' '}
        <button type="button" onClick={onSwitchMode} className="text-zinc-300 hover:text-white underline decoration-zinc-600 underline-offset-4">
          Cadastre-se
        </button>
      </p>
    </div>
  );
}