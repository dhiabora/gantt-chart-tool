import React, { useEffect, useMemo, useRef, useState } from 'react';

// --- Icons (Inline SVG to avoid dependency issues) ---
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7v14"/></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const IconChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const IconChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const IconLayout = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/></svg>;

// --- Utility Functions ---
const formatDate = (date) => date.toISOString().split('T')[0];
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const diffDays = (d1, d2) => Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
// 月単位ナビ用
const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date, n) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + n);
  return result;
};
const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const App = () => {
  const STORAGE_KEY = 'gantt_state_v1';
  const LEGACY_TASKS_KEY = 'gantt_tasks_v1';

  const defaultProjects = [{ id: 'p_default', name: 'デフォルト' }];

  const defaultTasks = [
    { id: '1', projectId: 'p_default', name: '要件定義', assignee: '田中', start: '2026-03-01', end: '2026-03-10', progress: 100, color: '#3b82f6' },
    { id: '2', projectId: 'p_default', name: 'デザイン制作', assignee: '佐藤', start: '2026-03-11', end: '2026-03-25', progress: 60, color: '#6366f1' },
    { id: '3', projectId: 'p_default', name: 'フロント開発', assignee: '鈴木', start: '2026-03-20', end: '2026-04-15', progress: 20, color: '#10b981' },
    { id: '4', projectId: 'p_default', name: 'バックエンド開発', assignee: '高橋', start: '2026-03-25', end: '2026-04-30', progress: 0, color: '#f59e0b' },
  ];

  const loadStateFromLocalStorage = () => {
    if (typeof window === 'undefined') {
      return { projects: defaultProjects, tasks: defaultTasks, activeProjectId: defaultProjects[0]?.id };
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const rawProjects = Array.isArray(parsed?.projects) ? parsed.projects : defaultProjects;
        const rawTasks = Array.isArray(parsed?.tasks) ? parsed.tasks : defaultTasks;
        const desiredActiveProjectId = String(parsed?.activeProjectId ?? rawProjects[0]?.id ?? defaultProjects[0]?.id);

        const projects = rawProjects
          .filter(Boolean)
          .map((p) => ({ id: String(p.id ?? ''), name: String(p.name ?? '') }))
          .filter((p) => p.id && p.name);

        const fallbackProjectId = projects[0]?.id ?? 'p_default';
        const activeProjectId = projects.some((p) => p.id === desiredActiveProjectId) ? desiredActiveProjectId : fallbackProjectId;

        return {
          projects,
          tasks: rawTasks
            .filter(Boolean)
            .map((t) => ({
              id: String(t.id ?? ''),
              projectId: String(t.projectId ?? fallbackProjectId ?? 'p_default'),
              name: String(t.name ?? ''),
              assignee: String(t.assignee ?? ''),
              start: String(t.start ?? ''),
              end: String(t.end ?? ''),
              progress: Number.isFinite(Number(t.progress)) ? Number(parseInt(t.progress, 10) || 0) : 0,
              color: String(t.color ?? '#3b82f6'),
            }))
            .filter((t) => t.id && t.projectId && t.name && t.start && t.end),
          activeProjectId,
        };
      }

      // 以前の保存形式（タスク配列のみ）からの移行
      const legacyRaw = window.localStorage.getItem(LEGACY_TASKS_KEY);
      if (legacyRaw) {
        const parsedTasks = JSON.parse(legacyRaw);
        if (Array.isArray(parsedTasks)) {
          return {
            projects: defaultProjects,
            tasks: parsedTasks
              .filter(Boolean)
              .map((t) => ({
                id: String(t.id ?? ''),
                projectId: 'p_default',
                name: String(t.name ?? ''),
                assignee: String(t.assignee ?? ''),
                start: String(t.start ?? ''),
                end: String(t.end ?? ''),
                progress: Number.isFinite(Number(t.progress)) ? Number(parseInt(t.progress, 10) || 0) : 0,
                color: String(t.color ?? '#3b82f6'),
              }))
              .filter((t) => t.id && t.projectId && t.name && t.start && t.end),
            activeProjectId: 'p_default',
          };
        }
      }

      return { projects: defaultProjects, tasks: defaultTasks, activeProjectId: 'p_default' };
    } catch {
      return { projects: defaultProjects, tasks: defaultTasks, activeProjectId: 'p_default' };
    }
  };

  // --- State ---
  const [initialState] = useState(() => loadStateFromLocalStorage());

  const [projects, setProjects] = useState(initialState.projects);
  const [tasks, setTasks] = useState(initialState.tasks);
  const [activeProjectId, setActiveProjectId] = useState(initialState.activeProjectId);

  // 表示は月単位・デフォルト2026年1月
  const [viewStart, setViewStart] = useState(() => getFirstDayOfMonth(new Date(2026, 0, 1)));
  const daysToShow = useMemo(() => getDaysInMonth(viewStart), [viewStart]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isProjectRenameOpen, setIsProjectRenameOpen] = useState(false);
  const [taskFormMode, setTaskFormMode] = useState('create'); // 'create' | 'edit'
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTask, setNewTask] = useState({ name: '', assignee: '', start: formatDate(new Date()), end: formatDate(addDays(new Date(), 7)), progress: 0, color: '#3b82f6' });
  const [newProjectName, setNewProjectName] = useState('');
  const [renameProjectName, setRenameProjectName] = useState('');

  const chartRef = useRef(null);
  const dragTaskRef = useRef(null);

  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
  const weekendBg = '#f1f5f9'; // 薄いグレー（休日が分かりやすいように）

  // プロジェクト/タスク更新のたびに LocalStorage に保存
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects, tasks, activeProjectId }));
    } catch {
      // 保存失敗時は握りつぶし（ユーザー体験を壊さない）
    }
  }, [projects, tasks, activeProjectId]);

  const handleTaskDragStart = (e, task) => {
    // 左クリックのみ（ボタンプロパティがある場合）
    if (typeof e.button === 'number' && e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    if (!chartRef.current) return;

    const rect = chartRef.current.getBoundingClientRect();
    const chartWidth = rect.width || 1;
    const dayWidth = chartWidth / daysToShow;

    // ドラッグ開始時のタスク情報（移動中はこれを基準に再計算）
    dragTaskRef.current = {
      id: task.id,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      originalStart: task.start,
      originalEnd: task.end,
      dayWidth,
      lastDeltaDays: null,
    };

    const cleanup = () => {
      dragTaskRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    const onMove = (ev) => {
      const drag = dragTaskRef.current;
      if (!drag || ev.pointerId !== drag.pointerId) return;

      const deltaX = ev.clientX - drag.startClientX;
      const deltaDays = Math.round(deltaX / drag.dayWidth);
      if (deltaDays === drag.lastDeltaDays) return;
      drag.lastDeltaDays = deltaDays;

      const originalStartDate = new Date(drag.originalStart);
      const originalEndDate = new Date(drag.originalEnd);
      const nextStart = formatDate(addDays(originalStartDate, deltaDays));
      const nextEnd = formatDate(addDays(originalEndDate, deltaDays));

      setTasks((prev) =>
        prev.map((t) => (t.id === drag.id ? { ...t, start: nextStart, end: nextEnd } : t))
      );
    };

    const onUp = (ev) => {
      const drag = dragTaskRef.current;
      if (!drag || ev.pointerId !== drag.pointerId) return;
      cleanup();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  // --- Computed ---
  const timelineDates = useMemo(() => Array.from({ length: daysToShow }, (_, i) => addDays(viewStart, i)), [viewStart, daysToShow]);

  const visibleTasks = useMemo(
    () => tasks.filter((t) => t.projectId === activeProjectId),
    [tasks, activeProjectId]
  );

  const openCreateTaskModal = () => {
    setTaskFormMode('create');
    setEditingTaskId(null);
    setNewTask({
      name: '',
      assignee: '',
      start: formatDate(new Date()),
      end: formatDate(addDays(new Date(), 7)),
      progress: 0,
      color: '#3b82f6',
    });
    setIsFormOpen(true);
  };

  const openEditTaskModal = (task) => {
    setTaskFormMode('edit');
    setEditingTaskId(task.id);
    setNewTask({
      name: task.name,
      assignee: task.assignee,
      start: task.start,
      end: task.end,
      progress: task.progress,
      color: task.color,
    });
    setIsFormOpen(true);
  };

  const openCreateProjectModal = () => {
    setNewProjectName('');
    setIsProjectFormOpen(true);
  };

  const openRenameProjectModal = () => {
    const current = projects.find((p) => p.id === activeProjectId);
    setRenameProjectName(current?.name ?? '');
    setIsProjectRenameOpen(true);
  };

  const saveProject = (e) => {
    e.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;

    const id = Date.now().toString();
    setProjects((prev) => [...prev, { id, name }]);
    setActiveProjectId(id);
    setIsProjectFormOpen(false);
  };

  const saveProjectRename = (e) => {
    e.preventDefault();
    const name = renameProjectName.trim();
    if (!name) return;

    setProjects((prev) => prev.map((p) => (p.id === activeProjectId ? { ...p, name } : p)));
    setIsProjectRenameOpen(false);
  };

  const saveTask = (e) => {
    e.preventDefault();

    if (taskFormMode === 'create') {
      setTasks((prev) => [
        ...prev,
        { ...newTask, id: Date.now().toString(), projectId: activeProjectId },
      ]);
    } else {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTaskId
            ? {
                ...t,
                name: newTask.name,
                assignee: newTask.assignee,
                start: newTask.start,
                end: newTask.end,
                // progress/color も維持（フォームに出していない場合でも正しい値が残る）
                progress: parseInt(newTask.progress, 10) || 0,
                color: newTask.color || t.color,
              }
            : t
        )
      );
    }

    setIsFormOpen(false);
  };

  const updateProgress = (id, val) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, progress: parseInt(val, 10) || 0 } : t)));

  const getBarStyle = (task) => {
    const start = new Date(task.start);
    const end = new Date(task.end);
    const offset = diffDays(viewStart, start);
    const duration = diffDays(start, end) + 1;
    if (offset + duration < 0 || offset > daysToShow) return { display: 'none' };
    return {
      position: 'absolute',
      zIndex: 2,
      left: `${(offset / daysToShow) * 100}%`,
      width: `${(duration / daysToShow) * 100}%`,
      backgroundColor: task.color,
      height: '32px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px',
      color: 'white',
      fontSize: '10px',
      fontWeight: 'bold',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    };
  };

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <IconLayout /> プロジェクト管理
            </h1>
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>プロジェクト</span>
              <select
                value={activeProjectId}
                onChange={(e) => setActiveProjectId(e.target.value)}
                style={{ padding: '8px', borderRadius: '5px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                onClick={openCreateProjectModal}
                style={{ background: 'white', color: '#2563eb', border: '1px solid #2563eb', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                プロジェクト追加
              </button>
              <button
                onClick={openRenameProjectModal}
                style={{ background: 'white', color: '#0f766e', border: '1px solid #0f766e', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                名前変更
              </button>
            </div>
          </div>
          <button onClick={openCreateTaskModal} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <IconPlus /> タスク追加
          </button>
        </div>

        {/* Gantt Container */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* Navigation（月単位・年/月選択） */}
          <div style={{ padding: '15px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fdfdfd', flexWrap: 'wrap' }}>
            <button onClick={() => setViewStart(getFirstDayOfMonth(addMonths(viewStart, -1)))} style={{ border: '1px solid #e2e8f0', background: 'white', padding: '5px', borderRadius: '5px', cursor: 'pointer' }} title="前月"><IconChevronLeft /></button>
            <button onClick={() => setViewStart(getFirstDayOfMonth(new Date()))} style={{ border: '1px solid #e2e8f0', background: 'white', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>今月</button>
            <button onClick={() => setViewStart(getFirstDayOfMonth(addMonths(viewStart, 1)))} style={{ border: '1px solid #e2e8f0', background: 'white', padding: '5px', borderRadius: '5px', cursor: 'pointer' }} title="翌月"><IconChevronRight /></button>
            <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>表示:</span>
            <select
              value={viewStart.getFullYear()}
              onChange={(e) => setViewStart(getFirstDayOfMonth(new Date(Number(e.target.value), viewStart.getMonth(), 1)))}
              style={{ padding: '6px 8px', borderRadius: '5px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
            >
              {Array.from({ length: 11 }, (_, i) => 2022 + i).map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
            <select
              value={viewStart.getMonth()}
              onChange={(e) => setViewStart(getFirstDayOfMonth(new Date(viewStart.getFullYear(), Number(e.target.value), 1)))}
              style={{ padding: '6px 8px', borderRadius: '5px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                <option key={m} value={m - 1}>{m}月</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', overflowX: 'auto' }}>
            {/* Sidebar */}
            <div style={{ width: '300px', flexShrink: 0, borderRight: '1px solid #e2e8f0', backgroundColor: 'white' }}>
              <div style={{ height: '40px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 15px', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>
                タスク（{projects.find((p) => p.id === activeProjectId)?.name ?? ''}）
              </div>
              {visibleTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => openEditTaskModal(t)}
                  style={{ height: '80px', borderBottom: '1px solid #f1f5f9', padding: '10px 15px', display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>担当: {t.assignee} | {t.progress}%</div>
                  <input
                    type="range"
                    value={t.progress}
                    onChange={(e) => updateProgress(t.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{ width: '100%', marginTop: '5px', accentColor: '#2563eb' }}
                  />
                </div>
              ))}
            </div>

            {/* Chart Area */}
            <div ref={chartRef} style={{ flexGrow: 1, minWidth: '800px', position: 'relative' }}>
              {/* Timeline Header */}
              <div style={{ height: '40px', display: 'flex', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                {timelineDates.map((d, i) => (
                  <div key={i} style={{ flex: 1, borderRight: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: isWeekend(d) ? '#94a3b8' : '#64748b', backgroundColor: isWeekend(d) ? weekendBg : 'transparent' }}>
                    {d.getDate()}
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div style={{ position: 'relative' }}>
                {/* 休日（週末）列の薄いグレー背景 */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none', zIndex: 0 }}>
                  {timelineDates.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        backgroundColor: isWeekend(d) ? weekendBg : 'transparent',
                      }}
                    />
                  ))}
                </div>
                {/* Vertical Lines */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none', zIndex: 1 }}>
                  {timelineDates.map((_, i) => <div key={i} style={{ flex: 1, borderRight: '1px solid #f1f5f9' }} />)}
                </div>
                {/* Bars */}
                {visibleTasks.map(t => (
                  <div key={t.id} style={{ height: '80px', borderBottom: '1px solid #f1f5f9', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{ ...getBarStyle(t), cursor: 'grab' }}
                      onPointerDown={(e) => handleTaskDragStart(e, t)}
                      role="button"
                      aria-label="タスク開始日をドラッグで移動"
                      tabIndex={-1}
                    >
                      {/* progress 表示のためのオーバーレイ（バー本体を薄めすぎない） */}
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.10)', width: `${t.progress}%` }} />
                      <span style={{ position: 'relative', zIndex: 1 }}>{t.progress > 0 && `${t.progress}%`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {isProjectFormOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120 }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <h2 style={{ marginTop: 0 }}>新規プロジェクト追加</h2>
              <form onSubmit={saveProject} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                  type="text"
                  placeholder="プロジェクト名"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  style={{ padding: '8px', borderRadius: '5px', border: '1px solid #e2e8f0' }}
                />
                <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>追加する</button>
                <button type="button" onClick={() => setIsProjectFormOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>キャンセル</button>
              </form>
            </div>
          </div>
        )}
        {isProjectRenameOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120 }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <h2 style={{ marginTop: 0 }}>プロジェクト名の変更</h2>
              <form onSubmit={saveProjectRename} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                  type="text"
                  placeholder="新しいプロジェクト名"
                  required
                  value={renameProjectName}
                  onChange={(e) => setRenameProjectName(e.target.value)}
                  style={{ padding: '8px', borderRadius: '5px', border: '1px solid #e2e8f0' }}
                />
                <button type="submit" style={{ backgroundColor: '#0f766e', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>更新する</button>
                <button type="button" onClick={() => setIsProjectRenameOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>キャンセル</button>
              </form>
            </div>
          </div>
        )}
        {isFormOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <h2 style={{ marginTop: 0 }}>{taskFormMode === 'create' ? '新規タスク追加' : 'タスク編集'}</h2>
              <form onSubmit={saveTask} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input type="text" placeholder="タスク名" required value={newTask.name} onChange={e => setNewTask({...newTask, name: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #e2e8f0' }} />
                <input type="text" placeholder="担当者" value={newTask.assignee} onChange={e => setNewTask({...newTask, assignee: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #e2e8f0' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="date" value={newTask.start} onChange={e => setNewTask({...newTask, start: e.target.value})} style={{ flex: 1, padding: '8px', border: '1px solid #e2e8f0' }} />
                  <input type="date" value={newTask.end} onChange={e => setNewTask({...newTask, end: e.target.value})} style={{ flex: 1, padding: '8px', border: '1px solid #e2e8f0' }} />
                </div>
                <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{taskFormMode === 'create' ? '追加する' : '更新する'}</button>
                <button type="button" onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>キャンセル</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;