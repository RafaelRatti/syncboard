import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  position: number;
  created_at: string;
  user_id: string; // Nova coluna adicionada
}

interface TaskStore {
  tasks: Task[];
  user: any | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  subscribeToTasks: () => () => void;
  addTask: (title: string, description: string) => Promise<void>;
  updateTask: (taskId: string, title: string, description: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTasksOrder: (newTasks: Task[]) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  user: null,
  loading: false,

  // Verifica se o usuário está logado e escuta mudanças na sessão
  checkAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user || null });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user || null });
      if (session?.user) {
        get().fetchTasks(); // Se logar, busca as tarefas dele
      } else {
        set({ tasks: [] }); // Se deslogar, limpa o quadro
      }
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  fetchTasks: async () => {
    const user = get().user;
    if (!user) return; // Só busca se estiver logado

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
    const user = get().user;
    if (!user) return;

    const { error } = await supabase
      .from('tasks')
      .insert([
        {
          title,
          description: description || null,
          status: 'todo',
          position: get().tasks.filter(t => t.status === 'todo').length,
          user_id: user.id, // Vincula a tarefa ao usuário logado!
        },
      ]);

    if (error) console.error('Erro ao criar tarefa:', error);
  },

  updateTask: async (taskId: string, title: string, description: string) => {
    const previousTasks = get().tasks;
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
    set({ tasks: previousTasks.filter((t) => t.id !== taskId) });

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
      console.error('Erro ao deletar tarefa:', error);
      set({ tasks: previousTasks });
    }
  },

  updateTasksOrder: async (newTasks: Task[]) => {
    const previousTasks = get().tasks;
    const user = get().user;
    if (!user) return;

    set({ tasks: newTasks });

    const payload = newTasks.map(({ id, title, description, status, position }) => ({
      id,
      title,
      description,
      status,
      position,
      user_id: user.id, // O upsert precisa de todos os dados não-nulos
    }));

    const { error } = await supabase.from('tasks').upsert(payload);

    if (error) {
      console.error('Erro ao reordenar tarefas:', error);
      set({ tasks: previousTasks });
    }
  },
}));