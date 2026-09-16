import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

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
  addTask: (title: string, description: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: string) => Promise<void>;
  updateTask: (taskId: string, title: string, description: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,

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

  subscribeToTasks: () => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          useTaskStore.getState().fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  addTask: async (title: string, description: string) => {
    const { error } = await supabase
      .from('tasks')
      .insert([
        {
          title,
          description: description || null,
          status: 'todo',
          position: get().tasks.length,
        },
      ]);

    if (error) {
      console.error('Erro ao criar tarefa:', error);
    }
  },

  moveTask: async (taskId: string, newStatus: string) => {
    const previousTasks = get().tasks;
    set({
      tasks: previousTasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      ),
    });

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      console.error('Erro ao mover tarefa:', error);
      set({ tasks: previousTasks });
    }
  },

  updateTask: async (taskId: string, title: string, description: string) => {
    const previousTasks = get().tasks;
    
    // Atualização Otimista na Interface
    set({
      tasks: previousTasks.map((t) =>
        t.id === taskId ? { ...t, title, description } : t
      ),
    });

    const { error } = await supabase
      .from('tasks')
      .update({ title, description: description || null })
      .eq('id', taskId);

    if (error) {
      console.error('Erro ao atualizar tarefa:', error);
      set({ tasks: previousTasks });
    }
  },

  deleteTask: async (taskId: string) => {
    const previousTasks = get().tasks;
    
    // Atualização Otimista na Interface
    set({
      tasks: previousTasks.filter((t) => t.id !== taskId),
    });

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Erro ao deletar tarefa:', error);
      set({ tasks: previousTasks });
    }
  },
}));