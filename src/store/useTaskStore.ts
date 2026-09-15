import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

// Tipo idêntico à tabela 'tasks' que criamos no Supabase
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  position: number;
  created_at: string;
}

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  subscribeToTasks: () => () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  loading: false,

  // Busca inicial das tarefas do Supabase
  fetchTasks: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('position', { ascending: true });

    if (!error && data) {
      set({ tasks: data, loading: false });
    } else {
      set({ loading: false });
    }
  },

  // Inscrição no Realtime (atualiza no navegador sem F5)
  subscribeToTasks: () => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          // Quando qualquer alteração ocorrer no banco, recarrega a lista
          useTaskStore.getState().fetchTasks();
        }
      )
      .subscribe();

    // Retorna a função de cleanup pra cancelar a inscrição quando desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  },
}));