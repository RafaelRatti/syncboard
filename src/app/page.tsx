'use client';

import { useEffect, useState } from 'react';
import { useTaskStore, Task } from '@/store/useTaskStore';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCorners } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/lib/supabase';

import LoginForm from '@/components/auth/LoginForm';
import SignUpForm from '@/components/auth/SignUpForm';

const COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

const TAG_COLORS: Record<string, string> = {
  'Urgente': 'bg-red-500/10 text-red-500 border-red-500/20',
  'Bug': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Feature': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Melhoria': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const TAG_OPTIONS = [
  { value: '', label: 'Sem tag' },
  { value: 'Urgente', label: 'Urgente' },
  { value: 'Bug', label: 'Bug' },
  { value: 'Feature', label: 'Feature' },
  { value: 'Melhoria', label: 'Melhoria' },
];

// --- COMPONENTES AUXILIARES DO KANBAN ---

function TaskCardUI({ task, isDragging, onEdit, onDelete }: { task: Task; isDragging?: boolean; onEdit?: (task: Task) => void; onDelete?: (taskId: string) => void; }) {
  return (
    <div className={`group bg-zinc-800/60 p-4 rounded-xl border ${isDragging ? 'border-zinc-500 shadow-xl scale-105 opacity-90' : 'border-zinc-700/50 shadow-sm'} transition-colors duration-200 cursor-grab active:cursor-grabbing hover:border-zinc-500 hover:bg-zinc-800 relative`}>
      {task.tag && (
        <div className="mb-3">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${TAG_COLORS[task.tag] || 'bg-zinc-700/50 text-zinc-300 border-zinc-600'}`}>{task.tag}</span>
        </div>
      )}
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-medium text-sm text-zinc-100 break-words">{task.title}</h3>
        {!isDragging && onEdit && onDelete && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1 text-zinc-400 hover:text-zinc-100 transition-colors rounded hover:bg-zinc-700" title="Editar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
            </button>
            <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-1 text-zinc-400 hover:text-red-400 transition-colors rounded hover:bg-red-400/10" title="Excluir">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg>
            </button>
          </div>
        )}
      </div>
      {task.description && <p className="text-xs text-zinc-400 mt-2 leading-relaxed pointer-events-none break-words whitespace-pre-wrap">{task.description}</p>}
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete }: { task: Task; onEdit: (t: Task) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { task } });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={isDragging ? 'opacity-30' : ''}>
      <TaskCardUI task={task} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function Column({ col, tasks, loading, onEdit, onDelete }: { col: any; tasks: Task[]; loading: boolean; onEdit: (t: Task) => void; onDelete: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div className={`w-[340px] flex-shrink-0 flex flex-col max-h-full bg-zinc-900/50 backdrop-blur-sm border transition-colors duration-200 rounded-2xl p-3 shadow-2xl ${isOver ? 'border-zinc-500 bg-zinc-800/30' : 'border-zinc-800'}`}>
      <div className="flex justify-between items-center mb-4 px-2 pt-1">
        <h2 className="font-semibold text-zinc-200 tracking-wide text-sm uppercase">{col.label}</h2>
        <span className="bg-zinc-800/80 text-zinc-400 text-xs px-2.5 py-1 rounded-md font-medium border border-zinc-700/50">{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className="flex flex-col gap-3 overflow-y-auto px-1 pb-2 flex-1 min-h-[150px]">
        {loading && tasks.length === 0 ? <p className="text-xs text-zinc-500 text-center py-4">Carregando...</p> : tasks.length === 0 ? <p className="text-xs text-zinc-600 text-center py-4 border border-dashed border-zinc-800 rounded-lg">Arraste tarefas para cá</p> : (
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />)}
          </SortableContext>
        )}
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

export default function Home() {
  const { user, checkAuth, logout, tasks, loading, fetchTasks, subscribeToTasks, addTask, updateTask, deleteTask, updateTasksOrder, updateProfile } = useTaskStore();
  
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Estados do Kanban
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Estados do Perfil
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false); // Novo estado
  const [profileName, setProfileName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [resetSent, setResetSent] = useState(false); // Estado de envio de senha

  useEffect(() => { checkAuth(); }, [checkAuth]);
  useEffect(() => {
    if (user) { const unsubscribe = subscribeToTasks(); return () => unsubscribe(); }
  }, [user, subscribeToTasks]);

  const handleOpenNewTask = () => { setEditingTask(null); setTitle(''); setDescription(''); setTag(''); setIsTagMenuOpen(false); setIsOpen(true); };
  const handleEditTask = (task: Task) => { setEditingTask(task); setTitle(task.title); setDescription(task.description || ''); setTag(task.tag || ''); setIsTagMenuOpen(false); setIsOpen(true); };
  const handleDeleteClick = (taskId: string) => setTaskToDelete(taskId);
  const confirmDelete = async () => { if (taskToDelete) { await deleteTask(taskToDelete); setTaskToDelete(null); } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (editingTask) await updateTask(editingTask.id, title, description, tag); 
    else await addTask(title, description, tag);
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
    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    let newTasks = [...tasks];
    let newStatus = activeTask.status;
    const isOverColumn = COLUMNS.some((c) => c.id === overId);

    if (isOverColumn) {
      newStatus = overId;
      newTasks = newTasks.map((t) => (t.id === activeId ? { ...t, status: newStatus } : t));
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
        newTasks = newTasks.map((t) => (t.id === activeId ? { ...t, status: newStatus } : t));
        const columnTasks = newTasks.filter((t) => t.status === newStatus).sort((a, b) => a.position - b.position);
        const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
        const newIndex = columnTasks.findIndex((t) => t.id === overId);
        const reorderedColumnTasks = arrayMove(columnTasks, oldIndex, newIndex);
        newTasks = newTasks.map((t) => {
          const reorderedTask = reorderedColumnTasks.find((rt) => rt.id === t.id);
          if (reorderedTask) return { ...t, position: reorderedColumnTasks.indexOf(reorderedTask) };
          return t;
        });
      }
    }

    const finalTasks = COLUMNS.map((col) => {
      const colTasks = newTasks.filter((t) => t.status === col.id).sort((a, b) => a.position - b.position);
      return colTasks.map((t, index) => ({ ...t, position: index }));
    }).flat();

    updateTasksOrder(finalTasks);
  };

  // --- Lógica do Perfil ---
  const userEmail = user?.email || '';
  // Fallback: Nome > Parte do Email > 'Usuário'
  const defaultUserName = user?.user_metadata?.full_name || userEmail.split('@')[0] || 'Usuário';

  const handleOpenProfile = () => {
    setProfileName(user?.user_metadata?.full_name || '');
    setIsEditingProfile(false); // Garante que abre bloqueado
    setResetSent(false);
    setIsProfileOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    await updateProfile(profileName);
    setIsUpdatingProfile(false);
    setIsEditingProfile(false); // Bloqueia novamente após salvar
  };

  const handleResetPassword = async () => {
    if (userEmail) {
      await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/`,
      });
      setResetSent(true);
      setTimeout(() => setResetSent(false), 4000);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/40 via-zinc-950 to-zinc-950" />
        {isLoginMode ? <LoginForm onSwitchMode={() => setIsLoginMode(false)} /> : <SignUpForm onSwitchMode={() => setIsLoginMode(true)} />}
      </main>
    );
  }

  const getInitials = (name: string, email: string) => {
    const target = name && name !== email.split('@')[0] ? name : email;
    const parts = target.split(/[\s._-]/);
    if (parts.length > 1 && parts[1].length > 0) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return target.substring(0, 2).toUpperCase();
  };
  const initials = getInitials(defaultUserName, userEmail);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans overflow-hidden relative">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/40 via-zinc-950 to-zinc-950" />

      <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col">
        <header className="mb-10 pt-4 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">SyncBoard</h1>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleOpenProfile} className="flex items-center gap-3 group text-left mr-2">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold group-hover:border-zinc-500 group-hover:bg-zinc-700 transition-colors shadow-sm">
                {initials}
              </div>
              <div className="hidden sm:block max-w-[150px]">
                <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
                  {defaultUserName}
                </p>
                <p className="text-xs text-zinc-500 transition-colors truncate">{userEmail}</p>
              </div>
            </button>
            <div className="w-px h-8 bg-zinc-800 mx-1"></div>
            <button onClick={logout} className="text-zinc-400 hover:text-red-400 text-sm font-medium transition-colors px-2">Sair</button>
            <button onClick={handleOpenNewTask} className="bg-zinc-100 hover:bg-white text-zinc-900 font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-lg hover:shadow-zinc-700/20 active:scale-95 ml-2">
              + Nova Tarefa
            </button>
          </div>
        </header>

        <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex items-start gap-6 overflow-x-auto pb-8 h-[calc(100vh-180px)] custom-scrollbar">
            {COLUMNS.map((col) => {
              const columnTasks = tasks.filter((task) => task.status === col.id).sort((a, b) => a.position - b.position);
              return <Column key={col.id} col={col} tasks={columnTasks} loading={loading} onEdit={handleEditTask} onDelete={handleDeleteClick} />;
            })}
          </div>
          <DragOverlay>
            {activeTask ? <TaskCardUI task={activeTask} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* MODAL DE PERFIL */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Meu Perfil</h2>
              <button onClick={() => setIsProfileOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <div className="flex justify-center mb-2">
                 <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-2xl shadow-sm">
                    {initials}
                 </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  required 
                  disabled={!isEditingProfile}
                  value={isEditingProfile ? profileName : (user?.user_metadata?.full_name || 'Não informado')} 
                  onChange={(e) => setProfileName(e.target.value)} 
                  className={`w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors ${
                    isEditingProfile 
                    ? 'bg-zinc-800/80 border border-zinc-700/80 text-zinc-100 focus:border-zinc-400' 
                    : 'bg-zinc-800/30 border border-transparent text-zinc-300 cursor-default'
                  }`} 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">E-mail</label>
                <input type="email" disabled value={userEmail} className="w-full bg-zinc-800/30 border border-transparent rounded-xl px-3 py-2.5 text-sm text-zinc-400 cursor-default" />
              </div>

              {/* Botões do Modal */}
              <div className="mt-4 pt-4 border-t border-zinc-800/80">
                {!isEditingProfile ? (
                  <div className="flex flex-col gap-3">
                    <button type="button" onClick={() => setIsEditingProfile(true)} className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm active:scale-95">
                      Editar Informações
                    </button>
                    <button type="button" onClick={handleResetPassword} disabled={resetSent} className="w-full bg-transparent hover:bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50">
                      {resetSent ? 'E-mail enviado!' : 'Redefinir Senha'}
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => { setIsEditingProfile(false); setProfileName(user?.user_metadata?.full_name || ''); }} className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors">Cancelar</button>
                    <button type="submit" disabled={isUpdatingProfile} className="bg-zinc-100 hover:bg-white text-zinc-900 font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-md disabled:opacity-50">
                      {isUpdatingProfile ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Criação/Edição e Modal de Exclusão permanecem iguais... */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">{editingTask ? 'Editar Tarefa' : 'Criar Nova Tarefa'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Título</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors" />
              </div>
              <div className="relative">
                <label className="block text-xs font-medium text-zinc-400 mb-1">Tag (Opcional)</label>
                <div className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors cursor-pointer flex justify-between items-center" onClick={() => setIsTagMenuOpen(!isTagMenuOpen)}>
                  <span className="flex items-center gap-2">
                    {tag ? <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${TAG_COLORS[tag]}`}>{tag}</span> : <span className="text-zinc-500">Selecione uma tag</span>}
                  </span>
                  <svg className={`w-4 h-4 text-zinc-400 transition-transform ${isTagMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                {isTagMenuOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-zinc-800 border border-zinc-700/80 rounded-xl shadow-xl overflow-hidden p-1">
                    {TAG_OPTIONS.map((option) => (
                      <div key={option.value} className="px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-700/50 cursor-pointer rounded-lg transition-colors flex items-center" onClick={() => { setTag(option.value); setIsTagMenuOpen(false); }}>
                        {option.value ? <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${TAG_COLORS[option.value]}`}>{option.label}</span> : <span className="text-zinc-400">Sem tag</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Descrição</label>
                <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors resize-none" />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors">Cancelar</button>
                <button type="submit" className="bg-zinc-100 hover:bg-white text-zinc-900 font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-md">{editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 text-center">
            <h2 className="text-xl font-bold text-zinc-100 mb-2">Excluir Tarefa</h2>
            <p className="text-sm text-zinc-400 mb-6">Tem certeza que deseja excluir esta tarefa? Essa ação não pode ser desfeita.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setTaskToDelete(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-md">Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}