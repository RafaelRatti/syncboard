'use client';

import { useEffect, useState } from 'react';
import { useTaskStore, Task } from '@/store/useTaskStore';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCorners } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

const COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

// --- COMPONENTES AUXILIARES ---

// 1. Interface (visual) do Card com botões de Editar/Excluir
function TaskCardUI({
  task,
  isDragging,
  onEdit,
  onDelete,
}: {
  task: Task;
  isDragging?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}) {
  return (
    <div
      className={`group bg-zinc-800/60 p-4 rounded-xl border ${
        isDragging ? 'border-zinc-500 shadow-xl scale-105 opacity-90' : 'border-zinc-700/50 shadow-sm'
      } transition-all duration-200 cursor-grab active:cursor-grabbing hover:border-zinc-500 hover:bg-zinc-800 relative`}
    >
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-medium text-sm text-zinc-100 break-words">{task.title}</h3>
        
        {/* Ações (Editar/Excluir) - Só aparecem no hover e não no fantasma (isDragging) */}
        {!isDragging && onEdit && onDelete && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onPointerDown={(e) => e.stopPropagation()} // Impede o drag
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-1 text-zinc-400 hover:text-zinc-100 transition-colors rounded hover:bg-zinc-700"
              title="Editar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()} // Impede o drag
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="p-1 text-zinc-400 hover:text-red-400 transition-colors rounded hover:bg-red-400/10"
              title="Excluir"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg>
            </button>
          </div>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-zinc-400 mt-2 leading-relaxed pointer-events-none break-words whitespace-pre-wrap">
          {task.description}
        </p>
      )}
    </div>
  );
}

// 2. O wrapper Draggable
function TaskCard({ task, onEdit, onDelete }: { task: Task; onEdit: (t: Task) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={isDragging ? 'opacity-30' : ''}>
      <TaskCardUI task={task} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

// 3. A Coluna Droppable
function Column({ col, tasks, loading, onEdit, onDelete }: { col: any; tasks: Task[]; loading: boolean; onEdit: (t: Task) => void; onDelete: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
  });

  return (
    <div className={`w-[340px] flex-shrink-0 flex flex-col max-h-full bg-zinc-900/50 backdrop-blur-sm border transition-colors duration-200 rounded-2xl p-3 shadow-2xl ${
      isOver ? 'border-zinc-500 bg-zinc-800/30' : 'border-zinc-800'
    }`}>
      <div className="flex justify-between items-center mb-4 px-2 pt-1">
        <h2 className="font-semibold text-zinc-200 tracking-wide text-sm uppercase">{col.label}</h2>
        <span className="bg-zinc-800/80 text-zinc-400 text-xs px-2.5 py-1 rounded-md font-medium border border-zinc-700/50">
          {tasks.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex flex-col gap-3 overflow-y-auto px-1 pb-2 flex-1 min-h-[150px]">
        {loading && tasks.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">Carregando...</p>
        ) : tasks.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-4 border border-dashed border-zinc-800 rounded-lg">
            Arraste tarefas para cá
          </p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />)
        )}
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

export default function Home() {
  const { tasks, loading, fetchTasks, subscribeToTasks, addTask, moveTask, updateTask, deleteTask } = useTaskStore();
  
  // Estados do modal
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null); // Novo estado

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
    const unsubscribe = subscribeToTasks();
    return () => unsubscribe();
  }, [fetchTasks, subscribeToTasks]);

  // Ações da interface
  const handleOpenNewTask = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setIsOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setIsOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      await deleteTask(taskId);
    }
  };

  // Envio do formulário (serve para criar ou atualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTask) {
      await updateTask(editingTask.id, title, description);
    } else {
      await addTask(title, description);
    }
    
    setIsOpen(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;
    const task = tasks.find((t) => t.id === taskId);

    if (task && task.status !== newStatus) {
      moveTask(taskId, newStatus);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans overflow-hidden relative">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/40 via-zinc-950 to-zinc-950" />

      <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col">
        <header className="mb-10 pt-4 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">
              SyncBoard
            </h1>
            <p className="text-zinc-400 mt-1 font-medium">Fluxo de trabalho fluído e em tempo real.</p>
          </div>

          <button
            onClick={handleOpenNewTask}
            className="bg-zinc-100 hover:bg-white text-zinc-900 font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-lg hover:shadow-zinc-700/20 active:scale-95"
          >
            + Nova Tarefa
          </button>
        </header>

        <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex items-start gap-6 overflow-x-auto pb-8 h-[calc(100vh-180px)] custom-scrollbar">
            {COLUMNS.map((col) => {
              const columnTasks = tasks.filter((task) => task.status === col.id);
              return (
                <Column 
                  key={col.id} 
                  col={col} 
                  tasks={columnTasks} 
                  loading={loading} 
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeTask ? <TaskCardUI task={activeTask} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">
              {editingTask ? 'Editar Tarefa' : 'Criar Nova Tarefa'}
            </h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Título</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Refatorar componente de Header"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Descrição</label>
                <textarea
                  rows={4}
                  placeholder="Detalhes opcionais sobre a tarefa..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-zinc-100 hover:bg-white text-zinc-900 font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-md"
                >
                  {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}