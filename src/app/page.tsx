'use client';

import { useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';

const COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

export default function Home() {
  const { tasks, loading, fetchTasks, subscribeToTasks } = useTaskStore();

  useEffect(() => {
    fetchTasks();
    const unsubscribe = subscribeToTasks();
    return () => unsubscribe();
  }, [fetchTasks, subscribeToTasks]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans overflow-hidden relative">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/40 via-zinc-950 to-zinc-950" />

      <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col">
        <header className="mb-10 pt-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">
            SyncBoard
          </h1>
          <p className="text-zinc-400 mt-2 font-medium">Fluxo de trabalho fluído e em tempo real.</p>
        </header>

        <div className="flex items-start gap-6 overflow-x-auto pb-8 h-[calc(100vh-180px)] custom-scrollbar">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((task) => task.status === col.id);

            return (
              <div
                key={col.id}
                className="w-[340px] flex-shrink-0 flex flex-col max-h-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-3 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-4 px-2 pt-1">
                  <h2 className="font-semibold text-zinc-200 tracking-wide text-sm uppercase">
                    {col.label}
                  </h2>
                  <span className="bg-zinc-800/80 text-zinc-400 text-xs px-2.5 py-1 rounded-md font-medium border border-zinc-700/50">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 overflow-y-auto px-1 pb-2 min-h-[100px]">
                  {loading && tasks.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-4">Carregando...</p>
                  ) : columnTasks.length === 0 ? (
                    <p className="text-xs text-zinc-600 text-center py-4 border border-dashed border-zinc-800 rounded-lg">
                      Nenhuma tarefa
                    </p>
                  ) : (
                    columnTasks.map((task) => (
                      <div
                        key={task.id}
                        className="group bg-zinc-800/60 p-4 rounded-xl border border-zinc-700/50 shadow-sm hover:border-zinc-500 hover:bg-zinc-800 transition-all duration-200"
                      >
                        <h3 className="font-medium text-sm text-zinc-100">{task.title}</h3>
                        {task.description && (
                          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}