'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SignUpFormProps {
  onSwitchMode: () => void;
}

export default function SignUpForm({ onSwitchMode }: SignUpFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const translateError = (msg: string) => {
    if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado.';
    if (msg.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
    if (msg.includes('rate limit')) return 'Muitas tentativas. Tente novamente mais tarde.';
    return 'Ocorreu um erro ao criar a conta. Tente novamente.';
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validação da senha
    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Verifique e tente novamente.');
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: name // Salva o nome do usuário no banco
        }
      }
    });
    
    if (authError) {
      setError(translateError(authError.message));
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="mx-auto w-12 h-12 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Verifique seu e-mail</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Enviamos um link de confirmação para <br/>
            <span className="text-zinc-200 font-medium">{email}</span>
          </p>
          <button onClick={onSwitchMode} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm">
            Voltar para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500 mb-2">Criar Conta</h1>
        <p className="text-sm text-zinc-400">Cadastre-se para criar seu quadro.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-6 text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSignUp} className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Nome Completo</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors" placeholder="Nome completo" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">E-mail</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors" placeholder="seu@email.com" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Senha</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors" placeholder="Mínimo de 6 caracteres" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Confirme a Senha</label>
          <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors" placeholder="Repita sua senha" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg hover:shadow-zinc-700/20 active:scale-95 mt-3 disabled:opacity-50">
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>

      <p className="text-center text-xs text-zinc-500 mt-6">
        Já tem uma conta?{' '}
        <button type="button" onClick={onSwitchMode} className="text-zinc-300 hover:text-white underline decoration-zinc-600 underline-offset-4">
          Entrar
        </button>
      </p>
    </div>
  );
}