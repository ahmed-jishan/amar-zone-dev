// src/app/(tabs)/tasks/page.tsx
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Plus, X, Check, Clock, Play, Pause, RotateCcw, ChevronRight,
  ChevronDown, Flame, Zap, Target, BookOpen, Layers,
  Calendar, Flag, MoreHorizontal, Trophy, Star, Sparkles,
  GripVertical, CheckCircle2, Circle, Timer, AlarmClock,
  TrendingUp, Award, Edit3, Trash2, Archive, RotateCcw as RestoreIcon
} from 'lucide-react'
import { useSettingsStore } from '@/lib/store/settingsStore'

// ─── TYPES ───────────────────────────────────────────────
type TaskMode = 'daily' | 'project' | 'learning'
type TaskStatus = 'pending' | 'inprogress' | 'done'
type Priority = 'low' | 'medium' | 'high'

interface SubTask {
  id: string
  title: string
  done: boolean
}

interface TaskEntry {
  id: string
  date: string
  note: string
  minutesSpent?: number
}

interface Task {
  id: string
  mode: TaskMode
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  timerMinutes: number
  totalPomodoroSessions: number
  completedSessions: number
  subTasks: SubTask[]
  entries: TaskEntry[]
  xp: number
  streak: number
  createdAt: string
  dueDate?: string
  completedAt?: string
  color: string
  category?: string
  goalDays?: number
  startDate?: string
}

// ─── CONSTANTS ───────────────────────────────────────────
const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f97316','#10b981','#3b82f6','#eab308','#ef4444']
const MODE_META = {
  daily:    { labelBn: 'ডেইলি', labelEn: 'Daily', icon: '⚡', color: '#6366f1' },
  project:  { labelBn: 'প্রজেক্ট', labelEn: 'Project', icon: '🎯', color: '#f97316' },
  learning: { labelBn: 'লার্নিং', labelEn: 'Learning', icon: '📚', color: '#10b981' },
}
const PRIORITY_META = {
  low:    { labelBn: 'লো', labelEn: 'Low', color: '#64748b', dot: '○' },
  medium: { labelBn: 'মিডিয়াম', labelEn: 'Medium', color: '#f59e0b', dot: '◐' },
  high:   { labelBn: 'হাই', labelEn: 'High', color: '#ef4444', dot: '●' },
}
const STATUS_META = {
  pending:    { labelBn: 'অপেক্ষমান', labelEn: 'Pending', color: '#64748b', icon: '○' },
  inprogress: { labelBn: 'চলমান', labelEn: 'In Progress', color: '#f59e0b', icon: '◑' },
  done:       { labelBn: 'সমাপ্ত', labelEn: 'Done', color: '#10b981', icon: '●' },
}
const XP_REWARDS = { subtask: 10, session: 25, complete: 100, streak: 50 }

// ─── HELPERS ─────────────────────────────────────────────
const gid = () => `${Date.now()}-${Math.random().toString(36).slice(2,9)}`
const today = () => new Date().toISOString().split('T')[0]
const fmt = (n: number) => String(n).padStart(2,'0')

function calcProgress(t: Task): number {
  if (t.mode === 'daily') {
    if (t.subTasks.length === 0) return t.status === 'done' ? 100 : t.status === 'inprogress' ? 40 : 0
    return Math.round((t.subTasks.filter(s=>s.done).length / t.subTasks.length) * 100)
  }
  if (t.mode === 'project') {
    const sub = t.subTasks.length > 0 ? (t.subTasks.filter(s=>s.done).length / t.subTasks.length) * 50 : 0
    const sess = t.totalPomodoroSessions > 0 ? (t.completedSessions / t.totalPomodoroSessions) * 50 : 0
    return Math.min(100, Math.round(sub + sess))
  }
  if (!t.goalDays) return t.status === 'done' ? 100 : 0
  return Math.min(100, Math.round((t.entries.length / t.goalDays) * 100))
}

// ─── STORE (with XP reverse logic) ───────────────────────
function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('az-tasks-v3')
      if (raw) setTasks(JSON.parse(raw))
    } catch {}
    setReady(true)
  }, [])

  const save = useCallback((next: Task[]) => {
    setTasks(next)
    localStorage.setItem('az-tasks-v3', JSON.stringify(next))
  }, [])

  const add = (t: Omit<Task,'id'|'createdAt'|'xp'|'streak'|'completedSessions'|'entries'|'totalPomodoroSessions'>) =>
    save([{ ...t, id: gid(), createdAt: new Date().toISOString(), xp: 0, streak: 0, completedSessions: 0, totalPomodoroSessions: t.mode === 'project' ? 8 : 4, entries: [] }, ...tasks])

  const update = (id: string, patch: Partial<Task>) =>
    save(tasks.map(t => t.id === id ? { ...t, ...patch } : t))

  const remove = (id: string) => save(tasks.filter(t => t.id !== id))

  const toggleSub = (tid: string, sid: string) => {
    const task = tasks.find(t => t.id === tid)
    if (!task) return
    const subTasks = task.subTasks.map(s => s.id === sid ? { ...s, done: !s.done } : s)
    const xpChange = subTasks.find(s => s.id === sid)?.done ? XP_REWARDS.subtask : -XP_REWARDS.subtask
    update(tid, { subTasks, xp: task.xp + xpChange })
  }

  const completeSession = (tid: string) => {
    const task = tasks.find(t => t.id === tid)
    if (!task) return
    const completedSessions = task.completedSessions + 1
    const xp = task.xp + XP_REWARDS.session
    update(tid, { completedSessions, xp, status: 'inprogress' })
  }

  const addEntry = (tid: string, note: string, minutes: number) => {
    const task = tasks.find(t => t.id === tid)
    if (!task) return
    const entry: TaskEntry = { id: gid(), date: today(), note, minutesSpent: minutes }
    update(tid, { entries: [...task.entries, entry], status: 'inprogress' })
  }

  // XP handling: add when marking done, remove when undoing
  const setStatus = (tid: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === tid)
    if (!task) return
    let xpChange = 0
    if (newStatus === 'done' && task.status !== 'done') {
      xpChange = XP_REWARDS.complete
    } else if (newStatus !== 'done' && task.status === 'done') {
      xpChange = -XP_REWARDS.complete
    }
    const updateData: Partial<Task> = { status: newStatus, xp: task.xp + xpChange }
    if (newStatus === 'done') updateData.completedAt = new Date().toISOString()
    else if (task.status === 'done') updateData.completedAt = undefined
    update(tid, updateData)
  }

  const restoreTask = (tid: string) => {
    const task = tasks.find(t => t.id === tid)
    if (!task) return
    update(tid, { status: 'pending', completedAt: undefined })
  }

  return { tasks, ready, add, update, remove, toggleSub, completeSession, addEntry, setStatus, restoreTask }
}

// ─── TIMER HOOK ───────────────────────────────────────────
function usePomodoro(initialMinutes: number, onDone: () => void) {
  const [secs, setSecs] = useState(initialMinutes * 60)
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<'work'|'break'>('work')
  const ref = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            clearInterval(ref.current)
            setRunning(false)
            if (phase === 'work') onDone()
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else clearInterval(ref.current)
    return () => clearInterval(ref.current)
  }, [running, phase, onDone])

  const start  = () => setRunning(true)
  const pause  = () => setRunning(false)
  const reset  = (mins = initialMinutes) => { setRunning(false); setSecs(mins * 60) }
  const switchPhase = (p: 'work'|'break') => { setPhase(p); reset(p === 'work' ? initialMinutes : 5) }

  return { mins: Math.floor(secs/60), secs: secs%60, totalSecs: secs, running, phase, start, pause, reset, switchPhase }
}

// ─── TRANSLATIONS ─────────────────────────────────────────
function useTranslations() {
  const { language } = useSettingsStore()
  const isBn = language === 'bn'
  const t = useMemo(() => ({
    focusBoard: isBn ? 'ফোকাস বোর্ড' : 'Focus Board',
    myTasks: isBn ? 'আমার কাজ' : 'My Tasks',
    total: isBn ? 'মোট' : 'Total',
    active: isBn ? 'চলমান' : 'Active',
    done: isBn ? 'সমাপ্ত' : 'Done',
    xp: 'XP',
    todayDone: isBn ? 'আজকের অগ্রগতি' : "Today's progress",
    noTasks: isBn ? 'কোনো কাজ নেই' : 'No tasks',
    noTasksSub: isBn ? 'নতুন কাজ যোগ করুন' : 'Add your first task',
    addTask: isBn ? 'টাস্ক যোগ করুন' : 'Add Task',
    all: 'All',
    newTask: isBn ? 'নতুন কাজ' : 'New Task',
    editTask: isBn ? 'কাজ সম্পাদনা' : 'Edit Task',
    taskTitle: isBn ? 'শিরোনাম *' : 'Title *',
    description: isBn ? 'বর্ণনা' : 'Description',
    category: isBn ? 'ক্যাটাগরি' : 'Category',
    priority: isBn ? 'প্রাধান্য' : 'Priority',
    timerMinutes: isBn ? 'ফোকাস টাইমার (মিনিট)' : 'Focus timer (min)',
    dueDate: isBn ? 'শেষ তারিখ' : 'Due date',
    goalDays: isBn ? 'লক্ষ্য: কত দিন?' : 'Goal: how many days?',
    subtasks: isBn ? 'সাবটাস্ক' : 'Subtasks',
    addSubtask: isBn ? 'সাবটাস্ক যোগ করুন...' : 'Add subtask...',
    create: isBn ? 'তৈরি করুন' : 'Create',
    save: isBn ? 'সংরক্ষণ করুন' : 'Save',
    cancel: isBn ? 'বাতিল' : 'Cancel',
    hideTimer: isBn ? 'টাইমার লুকান' : 'Hide timer',
    focusTimer: isBn ? 'ফোকাস টাইমার' : 'Focus timer',
    work: 'Work',
    break: 'Break',
    focus: isBn ? 'ফোকাস' : 'Focus',
    logProgress: isBn ? 'অগ্রগতি লগ করুন' : 'Log progress',
    logWhat: isBn ? 'আজ কী করলেন?' : 'What did you do today?',
    minutes: isBn ? 'মিনিট' : 'Minutes',
    log: isBn ? 'সেভ করুন' : 'Save',
    goal: isBn ? 'লক্ষ্য' : 'Goal',
    days: isBn ? 'দিন' : 'days',
    edit: isBn ? 'সম্পাদনা' : 'Edit',
    delete: isBn ? 'মুছে ফেলুন' : 'Delete',
    markDone: isBn ? 'সম্পন্ন করুন' : 'Mark done',
    history: isBn ? 'ইতিহাস' : 'History',
    restore: isBn ? 'পুনরুদ্ধার' : 'Restore',
    completed: isBn ? 'সমাপ্ত কাজ' : 'Completed tasks',
    noCompleted: isBn ? 'কোনো সমাপ্ত কাজ নেই' : 'No completed tasks',
    rewardSubtask: isBn ? 'সাবটাস্ক সম্পন্ন!' : 'Subtask done!',
    rewardSession: isBn ? 'সেশন সম্পূর্ণ!' : 'Session complete!',
    rewardComplete: isBn ? '🏆 কাজ শেষ!' : '🏆 Task done!',
    rewardProgress: isBn ? 'অগ্রগতি সংরক্ষিত!' : 'Progress logged!',
  }), [isBn])
  return { t, language: isBn ? 'bn' : 'en' }
}

// ─── MAIN PAGE ────────────────────────────────────────────
export default function TasksPage() {
  const { t, language } = useTranslations()
  const { theme } = useSettingsStore()
  const store = useTaskStore()
  const [activeMode, setActiveMode] = useState<TaskMode|'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [openTask, setOpenTask] = useState<string|null>(null)
  const [timerTask, setTimerTask] = useState<string|null>(null)
  const [reward, setReward] = useState<{xp:number, msg:string}|null>(null)
  const [editTask, setEditTask] = useState<Task|null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [systemDark, setSystemDark] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => setSystemDark(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const resolvedThemeClass = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  const showReward = (xp: number, msg: string) => {
    setReward({ xp, msg })
    setTimeout(() => setReward(null), 2400)
  }

  const filtered = useMemo(() => {
    let tasks = store.tasks
    if (activeMode !== 'all') tasks = tasks.filter(x => x.mode === activeMode)
    // separate active vs completed for current view (history toggle)
    if (showHistory) {
      return tasks.filter(t => t.status === 'done').sort((a,b) => (b.completedAt||'').localeCompare(a.completedAt||''))
    } else {
      return tasks.filter(t => t.status !== 'done').sort((a,b) => {
        const order = { high:0, medium:1, low:2 }
        if (a.priority !== b.priority) return order[a.priority] - order[b.priority]
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }
  }, [store.tasks, activeMode, showHistory])

  const stats = useMemo(() => ({
    total:    store.tasks.length,
    done:     store.tasks.filter(t => t.status === 'done').length,
    inprog:   store.tasks.filter(t => t.status === 'inprogress').length,
    totalXP:  store.tasks.reduce((s,t) => s + t.xp, 0),
  }), [store.tasks])

  const todayDone = store.tasks.filter(t => t.mode === 'daily' && t.status === 'done' && t.completedAt?.startsWith(today())).length
  const dailyTotal = store.tasks.filter(t => t.mode === 'daily').length

  if (!store.ready) return <div className="tk-loading"><Sparkles size={20}/>Loading...</div>

  return (
    <div className={`tk-root ${resolvedThemeClass}`}>
      <div className="tk-header">
        <div className="tk-header-bg"/>
        <div className="tk-header-orb tk-orb1"/>
        <div className="tk-header-orb tk-orb2"/>
        <div className="tk-header-inner">
          <div className="tk-header-top">
            <div>
              <p className="tk-eyebrow"><Zap size={10} style={{display:'inline',marginRight:4}}/>{t.focusBoard}</p>
              <h1 className="tk-title">{t.myTasks}</h1>
            </div>
            <button className="tk-fab" onClick={()=>setShowAdd(true)}><Plus size={22} strokeWidth={2.5}/></button>
          </div>

          <div className="tk-stats">
            <div className="tk-stat"><span className="tk-stat-num">{stats.total}</span><span className="tk-stat-lbl">{t.total}</span></div>
            <div className="tk-stat-sep"/>
            <div className="tk-stat"><span className="tk-stat-num" style={{color:'#f59e0b'}}>{stats.inprog}</span><span className="tk-stat-lbl">{t.active}</span></div>
            <div className="tk-stat-sep"/>
            <div className="tk-stat"><span className="tk-stat-num" style={{color:'#10b981'}}>{stats.done}</span><span className="tk-stat-lbl">{t.done}</span></div>
            <div className="tk-stat-sep"/>
            <div className="tk-stat"><span className="tk-stat-num" style={{color:'#c9a84c'}}><Star size={11} style={{display:'inline',marginRight:2}}/>{stats.totalXP}</span><span className="tk-stat-lbl">{t.xp}</span></div>
          </div>

          {dailyTotal > 0 && (
            <div className="tk-today-prog">
              <div className="tk-prog-bar"><div className="tk-prog-fill" style={{width:`${Math.round((todayDone/dailyTotal)*100)}%`}}/></div>
              <span className="tk-prog-label">{t.todayDone} {todayDone}/{dailyTotal}</span>
            </div>
          )}
        </div>
      </div>

      <div className="tk-mode-tabs">
        {(['all','daily','project','learning'] as const).map(m => (
          <button key={m} className={`tk-mode-tab ${activeMode===m?'tk-mode-tab--on':''}`} onClick={()=>setActiveMode(m)}>
            {m==='all' ? t.all : MODE_META[m][language==='bn'?'labelBn':'labelEn']}
            {activeMode===m && <span className="tk-mode-ind"/>}
          </button>
        ))}
        <button className={`tk-mode-tab ${showHistory?'tk-mode-tab--on':''}`} onClick={()=>setShowHistory(!showHistory)}>
          {t.history}
          {showHistory && <span className="tk-mode-ind"/>}
        </button>
      </div>

      <div className="tk-body">
        {filtered.length === 0 ? (
          <div className="tk-empty">
            <div className="tk-empty-icon"><Target size={40} strokeWidth={1}/></div>
            <p className="tk-empty-title">{showHistory ? t.noCompleted : t.noTasks}</p>
            <p className="tk-empty-sub">{showHistory ? '' : t.noTasksSub}</p>
            {!showHistory && <button className="tk-empty-btn" onClick={()=>setShowAdd(true)}><Plus size={14}/> {t.addTask}</button>}
          </div>
        ) : (
          <div className="tk-list">
            {filtered.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                index={i}
                isOpen={openTask === task.id}
                isTimerOpen={timerTask === task.id}
                onToggle={() => setOpenTask(openTask===task.id ? null : task.id)}
                onTimerToggle={() => setTimerTask(timerTask===task.id ? null : task.id)}
                onToggleSub={(sid: string) => {
                  store.toggleSub(task.id, sid)
                  showReward(XP_REWARDS.subtask, t.rewardSubtask+' +'+XP_REWARDS.subtask+' XP')
                }}
                onCompleteSession={() => {
                  store.completeSession(task.id)
                  showReward(XP_REWARDS.session, t.rewardSession+' +'+XP_REWARDS.session+' XP')
                }}
                onStatusChange={(s: TaskStatus) => store.setStatus(task.id, s)}
                onAddEntry={(note: string, mins: number) => {
                  store.addEntry(task.id, note, mins)
                  showReward(20, t.rewardProgress+' +20 XP')
                }}
                onEdit={() => setEditTask(task)}
                onDelete={() => store.remove(task.id)}
                onRestore={() => store.restoreTask(task.id)}
                isHistory={showHistory}
                t={t}
                language={language as 'bn' | 'en'}
              />
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddTaskModal onClose={()=>setShowAdd(false)} onAdd={store.add} t={t} language={language as 'bn' | 'en'}/>}
      {editTask && <EditTaskModal task={editTask} onClose={()=>setEditTask(null)} onSave={(patch: Partial<Task>)=>{store.update(editTask.id,patch);setEditTask(null)}} t={t} language={language as 'bn' | 'en'}/>}
      {reward && <RewardToast xp={reward.xp} msg={reward.msg}/>}
      <style>{CSS}</style>
    </div>
  )
}

// ─── TASK CARD ────────────────────────────────────────────
interface TaskCardProps {
  task: Task
  index: number
  isOpen: boolean
  isTimerOpen: boolean
  onToggle: () => void
  onTimerToggle: () => void
  onToggleSub: (sid: string) => void
  onCompleteSession: () => void
  onStatusChange: (s: TaskStatus) => void
  onAddEntry: (note: string, mins: number) => void
  onEdit: () => void
  onDelete: () => void
  onRestore: () => void
  isHistory: boolean
  t: any
  language: 'bn' | 'en'
}

function TaskCard({ task, index, isOpen, isTimerOpen, onToggle, onTimerToggle, onToggleSub, onCompleteSession, onStatusChange, onAddEntry, onEdit, onDelete, onRestore, isHistory, t, language }: TaskCardProps) {
  const progress = calcProgress(task)
  const isDone = task.status === 'done'
  const meta = MODE_META[task.mode]
  const pMeta = PRIORITY_META[task.priority]
  const [entryNote, setEntryNote] = useState('')
  const [entryMins, setEntryMins] = useState('')
  const [showEntryForm, setShowEntryForm] = useState(false)
  const modeLabel = language==='bn' ? meta.labelBn : meta.labelEn
  const priorityLabel = language==='bn' ? pMeta.labelBn : pMeta.labelEn

  const handlePomodoroDone = useCallback(() => {
    onCompleteSession()
  }, [onCompleteSession])

  const timer = usePomodoro(task.timerMinutes, handlePomodoroDone)

  return (
    <div className={`tk-card ${isDone ? 'tk-card--done' : ''} tk-card--${task.mode}`}
      style={{ animationDelay:`${index*40}ms`, '--task-color':task.color } as any}>
      <div className="tk-card-top" onClick={onToggle}>
        <div className="tk-card-left">
          {!isHistory && (
            <button className={`tk-check ${isDone?'tk-check--done':''}`}
              onClick={e=>{ e.stopPropagation(); if(!isDone) onStatusChange('done'); else onStatusChange('pending') }}
              style={{'--tc':task.color} as any}>
              {isDone ? <Check size={14} strokeWidth={3}/> : <Circle size={14}/>}
            </button>
          )}
          <div className="tk-card-info">
            <div className="tk-card-head">
              <span className="tk-card-mode-badge" style={{background:task.color+'20',color:task.color,border:`1px solid ${task.color}30`}}>
                {meta.icon} {modeLabel}
              </span>
              <span className="tk-priority-dot" style={{color:pMeta.color}} title={priorityLabel}>{pMeta.dot}</span>
            </div>
            <h3 className={`tk-card-title ${isDone?'tk-title--done':''}`}>{task.title}</h3>
            {task.category && <span className="tk-category">#{task.category}</span>}
          </div>
        </div>
        <div className="tk-card-right">
          <span className="tk-xp-badge"><Star size={9}/> {task.xp}</span>
          {!isHistory && <ChevronDown size={14} className={`tk-chevron ${isOpen?'tk-chevron--open':''}`}/>}
        </div>
      </div>

      <div className="tk-card-prog-wrap">
        <div className="tk-card-prog-track"><div className="tk-card-prog-fill" style={{width:`${progress}%`, background:task.color}}/></div>
        <span className="tk-card-prog-pct" style={{color:task.color}}>{progress}%</span>
      </div>

      {!isHistory && task.mode !== 'daily' && task.totalPomodoroSessions > 0 && (
        <div className="tk-sessions">
          {Array.from({length:task.totalPomodoroSessions}).map((_,i)=>(
            <span key={i} className={`tk-session-dot ${i<task.completedSessions?'tk-session-dot--done':''}`}
              style={i<task.completedSessions?{background:task.color}:{}}/>
          ))}
          <span className="tk-session-label">{task.completedSessions}/{task.totalPomodoroSessions} sessions</span>
        </div>
      )}

      {isOpen && !isHistory && (
        <div className="tk-card-body tk-expand">
          <div className="tk-status-row">
            {(['pending','inprogress','done'] as TaskStatus[]).map((s: TaskStatus)=>{
              const sMeta = STATUS_META[s]
              const sLabel = language==='bn' ? sMeta.labelBn : sMeta.labelEn
              return (
                <button key={s} className={`tk-status-btn ${task.status===s?'tk-status-btn--on':''}`}
                  style={task.status===s?{background:sMeta.color+'22',borderColor:sMeta.color,color:sMeta.color}:{}}
                  onClick={()=>onStatusChange(s)}>
                  {sMeta.icon} {sLabel}
                </button>
              )
            })}
          </div>
          {task.description && <p className="tk-desc">{task.description}</p>}
          {task.subTasks.length > 0 && (
            <div className="tk-subtasks">
              <p className="tk-sub-title">{t.subtasks}</p>
              {task.subTasks.map((s: SubTask)=>(
                <button key={s.id} className={`tk-subtask-row ${s.done?'tk-subtask--done':''}`} onClick={()=>onToggleSub(s.id)}>
                  <span className="tk-subtask-check" style={s.done?{background:task.color,borderColor:task.color}:{}}>
                    {s.done && <Check size={9} strokeWidth={3}/>}
                  </span>
                  <span className="tk-subtask-text">{s.title}</span>
                </button>
              ))}
            </div>
          )}
          <div className="tk-timer-section">
            <button className="tk-timer-toggle" onClick={e=>{e.stopPropagation();onTimerToggle()}}>
              <Timer size={13}/> {isTimerOpen ? t.hideTimer : t.focusTimer}
              <ChevronRight size={12} className={`tk-chevron ${isTimerOpen?'tk-chevron--open':''}`}/>
            </button>
            {isTimerOpen && (
              <div className="tk-timer tk-expand">
                <div className="tk-timer-phase-row">
                  <button className={`tk-phase-btn ${timer.phase==='work'?'tk-phase--on':''}`} onClick={()=>timer.switchPhase('work')}>{t.work}</button>
                  <button className={`tk-phase-btn ${timer.phase==='break'?'tk-phase--on':''}`} onClick={()=>timer.switchPhase('break')}>{t.break}</button>
                </div>
                <div className="tk-timer-circle-wrap">
                  <svg viewBox="0 0 100 100" className="tk-timer-svg">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6"/>
                    <circle cx="50" cy="50" r="42" fill="none" stroke={task.color} strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${2*Math.PI*42}`} strokeDashoffset={`${2*Math.PI*42*(1-(timer.totalSecs/(task.timerMinutes*60)))}`}
                      style={{transition:'stroke-dashoffset 1s linear',transform:'rotate(-90deg)',transformOrigin:'50% 50%'}}/>
                  </svg>
                  <div className="tk-timer-display">
                    <span className="tk-timer-time">{fmt(timer.mins)}:{fmt(timer.secs)}</span>
                    <span className="tk-timer-phase-lbl">{timer.phase === 'work' ? t.focus : t.break}</span>
                  </div>
                </div>
                <div className="tk-timer-controls">
                  {!timer.running
                    ? <button className="tk-timer-btn tk-timer-btn--play" onClick={timer.start} style={{background:task.color}}><Play size={16} fill="white"/></button>
                    : <button className="tk-timer-btn tk-timer-btn--pause" onClick={timer.pause}><Pause size={16}/></button>
                  }
                  <button className="tk-timer-btn tk-timer-btn--reset" onClick={()=>timer.reset()}><RotateCcw size={15}/></button>
                </div>
              </div>
            )}
          </div>
          {(task.mode === 'learning' || task.mode === 'project') && (
            <div className="tk-log-section">
              <div className="tk-log-header"><p className="tk-sub-title">{t.logProgress}</p><button className="tk-log-add-btn" onClick={()=>setShowEntryForm(!showEntryForm)}><Plus size={11}/> {t.log}</button></div>
              {showEntryForm && (
                <div className="tk-log-form tk-expand">
                  <textarea className="tk-log-textarea" placeholder={t.logWhat} value={entryNote} onChange={e=>setEntryNote(e.target.value)} rows={2}/>
                  <div className="tk-log-form-row">
                    <input className="tk-log-mins-inp" type="number" placeholder={t.minutes} value={entryMins} onChange={e=>setEntryMins(e.target.value)} min="1"/>
                    <button className="tk-log-submit" style={{background:task.color}} onClick={()=>{if(!entryNote.trim()) return; onAddEntry(entryNote.trim(), Number(entryMins)||0); setEntryNote(''); setEntryMins(''); setShowEntryForm(false)}}>{t.log}</button>
                  </div>
                </div>
              )}
              {task.entries.length > 0 && (
                <div className="tk-log-list">
                  {[...task.entries].reverse().slice(0,4).map(e=>(
                    <div key={e.id} className="tk-log-entry"><span className="tk-log-date">{e.date}</span><span className="tk-log-note">{e.note}</span>{e.minutesSpent && <span className="tk-log-mins">{e.minutesSpent}m</span>}</div>
                  ))}
                  {task.entries.length > 4 && <p className="tk-log-more">+{task.entries.length-4} more entries</p>}
                </div>
              )}
              {task.goalDays && (
                <div className="tk-goal-prog"><span className="tk-goal-label">{t.goal}: {task.entries.length}/{task.goalDays} {t.days}</span><div className="tk-goal-track"><div className="tk-goal-fill" style={{width:`${Math.min(100,(task.entries.length/task.goalDays)*100)}%`, background:task.color}}/></div></div>
              )}
            </div>
          )}
          <div className="tk-card-actions">
            <button className="tk-action-btn tk-action-edit" onClick={onEdit}><Edit3 size={12}/> {t.edit}</button>
            <button className="tk-action-btn tk-action-del" onClick={onDelete}><Trash2 size={12}/> {t.delete}</button>
            {!isDone && <button className="tk-action-btn tk-action-done" style={{background:task.color+'22',borderColor:task.color,color:task.color}} onClick={()=>onStatusChange('done')}><CheckCircle2 size={12}/> {t.markDone}</button>}
          </div>
        </div>
      )}
      {isHistory && (
        <div className="tk-card-actions" style={{padding:'8px 14px 14px'}}>
          <button className="tk-action-btn tk-action-react" onClick={onRestore}><RestoreIcon size={12}/> {t.restore}</button>
          <button className="tk-action-btn tk-action-del" onClick={onDelete}><Trash2 size={12}/> {t.delete}</button>
        </div>
      )}
    </div>
  )
}

// ─── REWARD TOAST ─────────────────────────────────────────
function RewardToast({ xp, msg }: { xp: number; msg: string }) {
  return (
    <div className="tk-reward">
      <div className="tk-reward-particles">
        {[...Array(8)].map((_,i)=><span key={i} className="tk-particle" style={{'--angle':`${i*45}deg`,'--dist':`${32+Math.random()*16}px`, background:['#6366f1','#f59e0b','#10b981','#ec4899'][i%4]} as any}/>)}
      </div>
      <Trophy size={18} style={{color:'#f59e0b'}}/>
      <span className="tk-reward-msg">{msg}</span>
    </div>
  )
}

// ─── ADD TASK MODAL ───────────────────────────────────────
function AddTaskModal({ onClose, onAdd, t, language }: any) {
  const [mode, setMode] = useState<TaskMode>('daily')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [timerMins, setTimerMins] = useState(25)
  const [color, setColor] = useState(COLORS[0])
  const [category, setCategory] = useState('')
  const [goalDays, setGoalDays] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [subTaskText, setSubTaskText] = useState('')
  const [subTasks, setSubTasks] = useState<SubTask[]>([])

  const addSub = () => { if (!subTaskText.trim()) return; setSubTasks([...subTasks, { id: gid(), title: subTaskText.trim(), done: false }]); setSubTaskText('') }
  const submit = () => { if (!title.trim()) return; onAdd({ mode, title: title.trim(), description: desc||undefined, priority, timerMinutes: timerMins, color, category: category||undefined, goalDays: goalDays?Number(goalDays):undefined, dueDate: dueDate||undefined, subTasks, status: 'pending' as TaskStatus }); onClose() }

  const modeLabel = (m: TaskMode) => language==='bn' ? MODE_META[m].labelBn : MODE_META[m].labelEn
  return (
    <div className="mo-backdrop" onClick={onClose}>
      <div className="mo-sheet" onClick={e=>e.stopPropagation()}>
        <div className="mo-notch"/><div className="mo-head"><h2 className="mo-title">{t.newTask}</h2><button className="mo-close" onClick={onClose}><X size={16}/></button></div>
        <div className="mo-mode-row">{(['daily','project','learning'] as TaskMode[]).map(m=>(<button key={m} className={`mo-mode-btn ${mode===m?'mo-mode-btn--on':''}`} style={mode===m?{background:MODE_META[m].color+'22',borderColor:MODE_META[m].color,color:MODE_META[m].color}:{}} onClick={()=>setMode(m)}>{MODE_META[m].icon} {modeLabel(m)}</button>))}</div>
        <p className="mo-mode-desc">{language==='bn' ? (mode==='daily'?'প্রতিদিনের রুটিন':mode==='project'?'বড় লক্ষ্য, ছোট ধাপ':'দক্ষতা ও কোর্স'):MODE_META[mode].labelEn}</p>
        <div className="mo-color-row">{COLORS.map(c=>(<button key={c} className={`mo-color-dot ${color===c?'mo-color-dot--on':''}`} style={{background:c,boxShadow:color===c?`0 0 0 2px rgba(0,0,0,0.3), 0 0 0 4px ${c}`:''}} onClick={()=>setColor(c)}/>))}</div>
        <input className="mo-inp" placeholder={t.taskTitle} value={title} onChange={e=>setTitle(e.target.value)} autoFocus/>
        <input className="mo-inp" placeholder={t.category} value={category} onChange={e=>setCategory(e.target.value)}/>
        <textarea className="mo-inp mo-textarea" placeholder={t.description} value={desc} onChange={e=>setDesc(e.target.value)} rows={2}/>
        <div className="mo-row-label">{t.priority}</div>
        <div className="mo-priority-row">{(['low','medium','high'] as Priority[]).map((p: Priority)=>{const pl = language==='bn'?PRIORITY_META[p].labelBn:PRIORITY_META[p].labelEn; return (<button key={p} className={`mo-priority-btn ${priority===p?'mo-priority-btn--on':''}`} style={priority===p?{background:PRIORITY_META[p].color+'22',borderColor:PRIORITY_META[p].color,color:PRIORITY_META[p].color}:{}} onClick={()=>setPriority(p)}>{PRIORITY_META[p].dot} {pl}</button>)})}</div>
        <div className="mo-row-label">{t.timerMinutes}</div>
        <div className="mo-timer-row">{ [15,25,30,45,60].map(m=>(<button key={m} className={`mo-timer-chip ${timerMins===m?'mo-timer-chip--on':''}`} style={timerMins===m?{background:color+'22',borderColor:color,color:color}:{}} onClick={()=>setTimerMins(m)}>{m}m</button>))}</div>
        <input className="mo-inp" type="date" placeholder={t.dueDate} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>
        {(mode==='learning'||mode==='project') && <input className="mo-inp" type="number" placeholder={t.goalDays} value={goalDays} onChange={e=>setGoalDays(e.target.value)}/>}
        <div className="mo-row-label">{t.subtasks}</div>
        <div className="mo-subtask-add"><input className="mo-inp mo-sub-inp" placeholder={t.addSubtask} value={subTaskText} onChange={e=>setSubTaskText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSub()}/><button className="mo-sub-add-btn" onClick={addSub} style={{background:color}}><Plus size={14}/></button></div>
        {subTasks.map((s: SubTask,i)=>(<div key={s.id} className="mo-subtask-item"><span className="mo-subtask-dot" style={{background:color}}/><span>{s.title}</span><button onClick={()=>setSubTasks(subTasks.filter((_,j)=>j!==i))}><X size={11}/></button></div>))}
        <button className="mo-submit" style={{background:`linear-gradient(135deg,${color},${color}cc)`}} onClick={submit}>{t.create}</button>
      </div>
    </div>
  )
}

// ─── EDIT TASK MODAL ──────────────────────────────────────
function EditTaskModal({ task, onClose, onSave, t, language }: any) {
  const [title, setTitle] = useState(task.title)
  const [desc, setDesc] = useState(task.description||'')
  const [priority, setPriority] = useState(task.priority)
  const [color, setColor] = useState(task.color)
  const [dueDate, setDueDate] = useState(task.dueDate||'')
  const [category, setCategory] = useState(task.category||'')
  const [timerMins, setTimerMins] = useState(task.timerMinutes)
  const [goalDays, setGoalDays] = useState(task.goalDays?.toString()||'')
  const [subTasks, setSubTasks] = useState(task.subTasks||[])
  const [newSubText, setNewSubText] = useState('')
  const addSub = () => { if (!newSubText.trim()) return; setSubTasks([...subTasks, { id: gid(), title: newSubText.trim(), done: false }]); setNewSubText('') }
  const toggleSubDone = (id: string) => setSubTasks(subTasks.map((s: SubTask)=>s.id===id?{...s,done:!s.done}:s))
  const removeSub = (id: string) => setSubTasks(subTasks.filter((s: SubTask)=>s.id!==id))

  return (
    <div className="mo-backdrop" onClick={onClose}>
      <div className="mo-sheet" onClick={e=>e.stopPropagation()}>
        <div className="mo-notch"/><div className="mo-head"><h2 className="mo-title">{t.editTask}</h2><button className="mo-close" onClick={onClose}><X size={16}/></button></div>
        <div className="mo-color-row">{COLORS.map(c=>(<button key={c} className={`mo-color-dot ${color===c?'mo-color-dot--on':''}`} style={{background:c,boxShadow:color===c?`0 0 0 2px rgba(0,0,0,0.3), 0 0 0 4px ${c}`:''}} onClick={()=>setColor(c)}/>))}</div>
        <input className="mo-inp" placeholder={t.taskTitle} value={title} onChange={e=>setTitle(e.target.value)}/>
        <input className="mo-inp" placeholder={t.category} value={category} onChange={e=>setCategory(e.target.value)}/>
        <textarea className="mo-inp mo-textarea" placeholder={t.description} value={desc} onChange={e=>setDesc(e.target.value)} rows={2}/>
        <div className="mo-row-label">{t.priority}</div>
        <div className="mo-priority-row">{(['low','medium','high'] as Priority[]).map((p: Priority)=>{const pl = language==='bn'?PRIORITY_META[p].labelBn:PRIORITY_META[p].labelEn; return (<button key={p} className={`mo-priority-btn ${priority===p?'mo-priority-btn--on':''}`} style={priority===p?{background:PRIORITY_META[p].color+'22',borderColor:PRIORITY_META[p].color,color:PRIORITY_META[p].color}:{}} onClick={()=>setPriority(p)}>{PRIORITY_META[p].dot} {pl}</button>)})}</div>
        <div className="mo-row-label">{t.timerMinutes}</div>
        <div className="mo-timer-row">{ [15,25,30,45,60].map(m=>(<button key={m} className={`mo-timer-chip ${timerMins===m?'mo-timer-chip--on':''}`} style={timerMins===m?{background:color+'22',borderColor:color,color:color}:{}} onClick={()=>setTimerMins(m)}>{m}m</button>))}</div>
        <input className="mo-inp" type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/>
        {(task.mode==='learning'||task.mode==='project') && <input className="mo-inp" type="number" placeholder={t.goalDays} value={goalDays} onChange={e=>setGoalDays(e.target.value)}/>}
        <div className="mo-row-label">{t.subtasks}</div>
        <div className="mo-subtask-add"><input className="mo-inp mo-sub-inp" placeholder={t.addSubtask} value={newSubText} onChange={e=>setNewSubText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSub()}/><button className="mo-sub-add-btn" onClick={addSub} style={{background:color}}><Plus size={14}/></button></div>
        {subTasks.map((s: SubTask)=>(<div key={s.id} className="mo-subtask-item" style={{opacity:s.done?0.6:1}}><button className="tk-subtask-check" onClick={()=>toggleSubDone(s.id)} style={s.done?{background:color,borderColor:color,width:18,height:18,borderRadius:4,border:'none',marginRight:6}:{width:18,height:18,borderRadius:4,border:'1.5px solid #2a3d55',background:'transparent',marginRight:6}}>{s.done && <Check size={10}/>}</button><span style={{flex:1}}>{s.title}</span><button onClick={()=>removeSub(s.id)}><X size={11}/></button></div>))}
        <button className="mo-submit" style={{background:`linear-gradient(135deg,${color},${color}cc)`}} onClick={()=>{ onSave({title,description:desc||undefined,priority,color,dueDate:dueDate||undefined,category:category||undefined,timerMinutes:timerMins,goalDays:goalDays?Number(goalDays):undefined,subTasks}); onClose() }}>{t.save}</button>
      </div>
    </div>
  )
}

// ─── CSS (same as before, but with dark mode support from settings) ──
const CSS = `
:root {
  --tk-bg: rgb(var(--bg)); --tk-surface: rgb(var(--card)); --tk-border: rgb(var(--border));
  --tk-text: rgb(var(--fg)); --tk-text-muted: rgb(var(--muted)); --tk-accent: #6366f1;
}
.dark { --tk-bg: #080c14; --tk-surface: #0f1520; --tk-border: #1a2535; --tk-text: #e0e8f4; --tk-text-muted: #556677; --tk-accent: #6366f1; }
.light { --tk-bg: #f8fafc; --tk-surface: #ffffff; --tk-border: #e2e8f0; --tk-text: #0f172a; --tk-text-muted: #64748b; --tk-accent: #6366f1; }

.tk-root { min-height:100%; background:var(--tk-bg); color:var(--tk-text); font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; display:flex; flex-direction:column; }
.tk-loading { display:flex; align-items:center; justify-content:center; height:100vh; background:var(--tk-bg); gap:8px; }
.tk-header { position:relative; overflow:hidden; }
.tk-header-bg { position:absolute; inset:0; background:radial-gradient(ellipse 90% 70% at 40% 0%,#1a1f38 0%,var(--tk-bg) 70%); }
.tk-header-orb { position:absolute; border-radius:50%; filter:blur(50px); pointer-events:none; }
.tk-orb1 { width:200px; height:200px; top:-80px; right:-40px; background:radial-gradient(circle,#6366f118,transparent 70%); }
.tk-orb2 { width:160px; height:160px; bottom:-60px; left:-30px; background:radial-gradient(circle,#8b5cf612,transparent 70%); }
.tk-header-inner { position:relative; z-index:1; padding:28px 20px 20px; }
.tk-header-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
.tk-eyebrow { font-size:10px; letter-spacing:1.8px; text-transform:uppercase; color:var(--tk-accent); opacity:.8; margin-bottom:5px; }
.tk-title { font-size:30px; font-weight:800; color:white; letter-spacing:-1px; }
.tk-fab { width:46px; height:46px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:white; box-shadow:0 4px 20px #6366f140; transition:transform .2s; }
.tk-fab:active { transform:scale(.92); }
.tk-stats { display:flex; align-items:center; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:14px; padding:12px 16px; margin-bottom:14px; }
.tk-stat { display:flex; flex-direction:column; align-items:center; flex:1; gap:2px; }
.tk-stat-num { font-size:18px; font-weight:800; color:white; letter-spacing:-.5px; }
.tk-stat-lbl { font-size:10px; color:#8899aa; text-transform:uppercase; letter-spacing:.5px; }
.tk-stat-sep { width:1px; height:28px; background:rgba(255,255,255,.08); }
.tk-today-prog { margin-top:4px; }
.tk-prog-bar { height:4px; background:rgba(255,255,255,.08); border-radius:999px; overflow:hidden; margin-bottom:5px; }
.tk-prog-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,#6366f1,#8b5cf6); transition:width 1s cubic-bezier(.34,1.3,.64,1); }
.tk-prog-label { font-size:11px; color:#8899aa; }
.tk-mode-tabs { display:flex; gap:0; background:#0d1018; border-bottom:1px solid #1a2030; padding:0 16px; position:sticky; top:0; z-index:10; overflow-x:auto; }
.tk-mode-tab { position:relative; padding:12px 14px; font-size:12px; font-weight:500; color:#556677; background:transparent; border:none; cursor:pointer; white-space:nowrap; transition:color .2s; }
.tk-mode-tab--on { color:#a5b4fc; }
.tk-mode-ind { position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:60%; height:2px; border-radius:999px; background:linear-gradient(90deg,#6366f1,#8b5cf6); animation:modeIndIn .25s cubic-bezier(.34,1.56,.64,1); }
@keyframes modeIndIn { from{width:0;opacity:0} to{width:60%;opacity:1} }
.tk-body { flex:1; padding:14px; }
.tk-list { display:flex; flex-direction:column; gap:10px; }
.tk-empty { display:flex; flex-direction:column; align-items:center; padding:60px 20px; gap:10px; }
.tk-empty-icon { color:#2a3d55; }
.tk-empty-title { font-size:16px; font-weight:600; color:#3a5566; }
.tk-empty-sub { font-size:13px; color:#2a3d55; }
.tk-empty-btn { display:flex; align-items:center; gap:6px; padding:10px 20px; border-radius:12px; background:#6366f122; border:1px solid #6366f140; color:#a5b4fc; font-weight:600; cursor:pointer; margin-top:8px; }
.tk-card { background:var(--tk-surface); border:1px solid var(--tk-border); border-radius:18px; overflow:hidden; animation:tkSlide .35s ease-out both; transition:border-color .2s; border-left:3px solid var(--task-color,#6366f1); }
.tk-card:hover { border-color:#2a3d66; }
.tk-card--done { opacity:.7; }
@keyframes tkSlide { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
.tk-card-top { display:flex; align-items:center; justify-content:space-between; padding:14px 14px 8px; cursor:pointer; gap:10px; }
.tk-card-left { display:flex; align-items:flex-start; gap:10px; flex:1; min-width:0; }
.tk-check { width:26px; height:26px; border-radius:8px; border:1.5px solid #3a5566; background:transparent; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:all .2s; color:#6a7788; }
.tk-check--done { background:var(--tc,#6366f1) !important; border-color:var(--tc,#6366f1) !important; color:white !important; }
.tk-card-info { flex:1; min-width:0; }
.tk-card-head { display:flex; align-items:center; gap:6px; margin-bottom:4px; flex-wrap:wrap; }
.tk-card-mode-badge { font-size:10px; font-weight:600; padding:2px 7px; border-radius:6px; }
.tk-card-title { font-size:14px; font-weight:600; color:var(--tk-text); margin-bottom:3px; }
.tk-title--done { text-decoration:line-through; opacity:.6; }
.tk-category { font-size:10px; color:#6a7788; }
.tk-xp-badge { display:flex; align-items:center; gap:3px; font-size:10px; font-weight:600; color:#c9a84c; background:#c9a84c12; border:1px solid #c9a84c25; border-radius:6px; padding:2px 7px; }
.tk-chevron { color:#4a6688; transition:transform .25s cubic-bezier(.34,1.56,.64,1); }
.tk-chevron--open { transform:rotate(180deg); }
.tk-card-prog-wrap { display:flex; align-items:center; gap:8px; padding:0 14px 10px; }
.tk-card-prog-track { flex:1; height:3px; background:#1a2535; border-radius:999px; overflow:hidden; }
.tk-card-prog-fill { height:100%; border-radius:999px; transition:width .8s cubic-bezier(.34,1.1,.64,1); }
.tk-card-prog-pct { font-size:10px; font-weight:600; min-width:28px; text-align:right; }
.tk-sessions { display:flex; align-items:center; gap:4px; padding:0 14px 10px; flex-wrap:wrap; }
.tk-session-dot { width:8px; height:8px; border-radius:50%; background:#1a2535; border:1px solid #2a3d55; }
.tk-session-dot--done { border:none; }
.tk-session-label { font-size:10px; color:#6a7788; margin-left:4px; }
.tk-card-body { padding:0 14px 14px; display:flex; flex-direction:column; gap:12px; }
.tk-expand { animation:tkExpand .2s ease-out; }
@keyframes tkExpand { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
.tk-status-row { display:flex; gap:6px; }
.tk-status-btn { flex:1; font-size:11px; font-weight:500; padding:6px 4px; border-radius:8px; border:1px solid #1a2535; background:#0a1018; color:#6a7788; cursor:pointer; }
.tk-desc { font-size:13px; color:#8a9aaa; line-height:1.5; background:#0a1018; border:1px solid #1a2535; border-radius:10px; padding:10px; }
.tk-subtasks { display:flex; flex-direction:column; gap:6px; }
.tk-sub-title { font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#4a6688; margin-bottom:4px; }
.tk-subtask-row { display:flex; align-items:center; gap:8px; padding:8px 10px; background:#0a1018; border:1px solid #1a2535; border-radius:10px; cursor:pointer; }
.tk-subtask-row:hover { background:#0f1828; }
.tk-subtask--done .tk-subtask-text { text-decoration:line-through; opacity:.5; }
.tk-subtask-check { width:18px; height:18px; border-radius:5px; border:1.5px solid #4a6688; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:white; background:transparent; }
.tk-subtask-text { font-size:13px; color:#9ab0c0; flex:1; text-align:left; }
.tk-timer-section { margin-top:4px; }
.tk-timer-toggle { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:500; color:#6a7788; background:#0a1018; border:1px solid #1a2535; border-radius:10px; padding:8px 12px; cursor:pointer; width:100%; }
.tk-timer { background:#0a1018; border:1px solid #1a2535; border-radius:14px; padding:16px; display:flex; flex-direction:column; align-items:center; gap:12px; margin-top:8px; }
.tk-timer-phase-row { display:flex; gap:6px; }
.tk-phase-btn { padding:5px 14px; border-radius:8px; font-size:11px; font-weight:600; border:1px solid #1a2535; background:transparent; color:#6a7788; cursor:pointer; }
.tk-phase-btn.tk-phase--on { background:#1a2535; color:#b8c8d8; }
.tk-timer-circle-wrap { position:relative; width:110px; height:110px; }
.tk-timer-svg { position:absolute; inset:0; width:100%; height:100%; }
.tk-timer-display { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.tk-timer-time { font-size:22px; font-weight:800; color:white; font-variant-numeric:tabular-nums; letter-spacing:-1px; }
.tk-timer-phase-lbl { font-size:10px; color:#6a7788; }
.tk-timer-controls { display:flex; gap:10px; }
.tk-timer-btn { width:42px; height:42px; border-radius:50%; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform .15s; }
.tk-timer-btn:active { transform:scale(.9); }
.tk-timer-btn--play { color:white; }
.tk-timer-btn--pause { background:#1a2535; color:#9ab0c0; }
.tk-timer-btn--reset { background:#1a2535; color:#9ab0c0; }
.tk-log-section { margin-top:4px; }
.tk-log-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.tk-log-add-btn { display:flex; align-items:center; gap:4px; font-size:11px; color:var(--tk-accent); background:#6366f112; border:1px solid #6366f130; border-radius:8px; padding:4px 10px; cursor:pointer; }
.tk-log-form { display:flex; flex-direction:column; gap:8px; margin-bottom:10px; }
.tk-log-textarea { background:#0f1828; border:1.5px solid #1a2535; border-radius:10px; padding:10px; color:var(--tk-text); font-size:13px; resize:none; width:100%; box-sizing:border-box; }
.tk-log-textarea:focus { border-color:#6366f140; outline:none; }
.tk-log-form-row { display:flex; gap:8px; }
.tk-log-mins-inp { flex:1; background:#0f1828; border:1.5px solid #1a2535; border-radius:8px; padding:8px 10px; color:var(--tk-text); font-size:13px; }
.tk-log-submit { padding:8px 16px; border-radius:8px; border:none; color:white; font-weight:600; cursor:pointer; }
.tk-log-list { display:flex; flex-direction:column; gap:4px; }
.tk-log-entry { display:flex; align-items:center; gap:8px; padding:8px 10px; background:#0a1018; border:1px solid #1a2535; border-radius:8px; font-size:12px; }
.tk-log-date { color:#6a7788; min-width:80px; flex-shrink:0; }
.tk-log-note { flex:1; color:#9ab0c0; }
.tk-log-mins { color:var(--tk-accent); font-weight:600; flex-shrink:0; }
.tk-log-more { font-size:11px; color:#4a6688; text-align:center; margin-top:4px; }
.tk-goal-prog { margin-top:8px; }
.tk-goal-label { font-size:11px; color:#6a7788; display:block; margin-bottom:5px; }
.tk-goal-track { height:4px; background:#1a2535; border-radius:999px; overflow:hidden; }
.tk-goal-fill { height:100%; border-radius:999px; transition:width .8s cubic-bezier(.34,1.1,.64,1); }
.tk-card-actions { display:flex; gap:6px; padding-top:4px; border-top:1px solid #1a2535; }
.tk-action-btn { display:flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px; font-size:11px; font-weight:500; cursor:pointer; border:1px solid; transition:opacity .15s; background:transparent; }
.tk-action-edit { border-color:#1a2535; color:#6a88aa; }
.tk-action-del { border-color:#2a1010; color:#aa6666; }
.tk-action-done { border-color:var(--task-color); color:var(--task-color); }
.tk-action-react { border-color:#2a5a3a; color:#66aa88; }
.tk-reward { position:fixed; bottom:90px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:8px; background:linear-gradient(135deg,#0f2030,#0a1828); border:1px solid #6366f140; border-radius:999px; padding:10px 20px; z-index:500; white-space:nowrap; animation:rewardIn .4s cubic-bezier(.34,1.56,.64,1); }
.tk-reward-msg { font-size:13px; font-weight:600; color:white; }
@keyframes rewardIn { from{transform:translateX(-50%) translateY(20px) scale(.8);opacity:0} to{transform:translateX(-50%) translateY(0) scale(1);opacity:1} }
.tk-reward-particles { position:absolute; inset:0; pointer-events:none; }
.tk-particle { position:absolute; top:50%; left:50%; width:5px; height:5px; border-radius:50%; animation:particleFly .6s ease-out both; }
@keyframes particleFly { 0%{transform:translate(-50%,-50%) rotate(var(--angle)) translateX(0); opacity:1} 100%{transform:translate(-50%,-50%) rotate(var(--angle)) translateX(var(--dist)); opacity:0} }
.mo-backdrop { position:fixed; inset:0; z-index:300; background:rgba(0,0,0,.7); backdrop-filter:blur(8px); display:flex; align-items:flex-end; justify-content:center; animation:moFade .2s ease-out; }
.mo-sheet { width:100%; max-width:480px; background:linear-gradient(180deg,#0f1520 0%,#0a1018 100%); border:1px solid #1a2535; border-bottom:none; border-radius:24px 24px 0 0; padding:8px 20px 48px; max-height:90vh; overflow-y:auto; animation:moSlide .32s cubic-bezier(.32,1.5,.6,1); }
.mo-notch { width:36px; height:4px; background:#1e2d40; border-radius:999px; margin:10px auto 18px; }
.mo-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
.mo-title { font-size:18px; font-weight:700; color:white; }
.mo-close { width:32px; height:32px; border-radius:10px; background:#1a2535; border:1px solid #243040; color:#8899aa; display:flex; align-items:center; justify-content:center; cursor:pointer; }
.mo-mode-row { display:flex; gap:8px; margin-bottom:6px; }
.mo-mode-btn { flex:1; padding:9px 6px; border-radius:10px; border:1.5px solid #1a2535; background:#0f1520; color:#6a7788; font-size:12px; font-weight:600; cursor:pointer; }
.mo-mode-desc { font-size:11px; color:#4a5a6a; margin-bottom:14px; }
.mo-color-row { display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
.mo-color-dot { width:24px; height:24px; border-radius:50%; border:none; cursor:pointer; transition:transform .15s; }
.mo-color-dot:active { transform:scale(.88); }
.mo-color-dot--on { transform:scale(1.1); }
.mo-inp { display:block; width:100%; background:#0f1520; border:1.5px solid #1a2535; border-radius:12px; padding:12px 14px; color:white; font-size:14px; outline:none; margin-bottom:10px; box-sizing:border-box; }
.mo-inp:focus { border-color:#6366f140; }
.mo-textarea { resize:none; font-family:inherit; }
.mo-row-label { font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#4a5a6a; margin-bottom:8px; }
.mo-priority-row, .mo-timer-row { display:flex; gap:6px; margin-bottom:14px; flex-wrap:wrap; }
.mo-priority-btn, .mo-timer-chip { padding:7px 12px; border-radius:8px; border:1.5px solid #1a2535; background:#0f1520; color:#6a7788; font-size:12px; font-weight:600; cursor:pointer; }
.mo-subtask-add { display:flex; gap:8px; margin-bottom:8px; }
.mo-sub-inp { flex:1; margin-bottom:0 !important; }
.mo-sub-add-btn { width:42px; border-radius:10px; border:none; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
.mo-subtask-item { display:flex; align-items:center; gap:8px; padding:7px 10px; background:#0a1018; border:1px solid #1a2535; border-radius:8px; font-size:13px; color:#9ab0c0; margin-bottom:6px; }
.mo-subtask-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.mo-submit { width:100%; padding:14px; border-radius:14px; color:white; font-size:15px; font-weight:700; border:none; cursor:pointer; margin-top:8px; transition:transform .15s; }
.mo-submit:active { transform:scale(.97); opacity:.9; }
@keyframes moFade { from{opacity:0} to{opacity:1} }
@keyframes moSlide { from{transform:translateY(80px);opacity:0} to{transform:translateY(0);opacity:1} }

/* Polished light palette */
.tk-root.light {
  --tk-light-bg: #f6f8fc;
  --tk-light-surface: #ffffff;
  --tk-light-surface-soft: #f8fafc;
  --tk-light-border: #dbe3ef;
  --tk-light-text: #0f172a;
  --tk-light-text-soft: #475569;
  --tk-light-text-dim: #64748b;
  --tk-light-accent-soft: #eef2ff;
  --tk-light-accent-border: #c7d2fe;
}

.tk-root.light {
  background: var(--tk-light-bg);
  color: var(--tk-light-text);
}

.tk-root.light .tk-header-bg {
  background: radial-gradient(ellipse 90% 70% at 40% 0%, #dfe8ff 0%, var(--tk-light-bg) 72%);
}

.tk-root.light .tk-title,
.tk-root.light .tk-stat-num,
.tk-root.light .tk-timer-time,
.tk-root.light .tk-reward-msg,
.tk-root.light .mo-title,
.tk-root.light .tk-card-title,
.tk-root.light .tk-subtask-text,
.tk-root.light .tk-log-note {
  color: var(--tk-light-text);
}

.tk-root.light .tk-stats,
.tk-root.light .tk-mode-tabs,
.tk-root.light .tk-status-btn,
.tk-root.light .tk-desc,
.tk-root.light .tk-subtask-row,
.tk-root.light .tk-timer-toggle,
.tk-root.light .tk-timer,
.tk-root.light .tk-log-textarea,
.tk-root.light .tk-log-mins-inp,
.tk-root.light .tk-log-entry,
.tk-root.light .tk-reward,
.tk-root.light .mo-sheet,
.tk-root.light .mo-close,
.tk-root.light .mo-mode-btn,
.tk-root.light .mo-inp,
.tk-root.light .mo-priority-btn,
.tk-root.light .mo-timer-chip,
.tk-root.light .mo-subtask-item {
  background: var(--tk-light-surface);
}

.tk-root.light .tk-stats,
.tk-root.light .tk-mode-tabs,
.tk-root.light .tk-status-btn,
.tk-root.light .tk-desc,
.tk-root.light .tk-subtask-row,
.tk-root.light .tk-timer-toggle,
.tk-root.light .tk-timer,
.tk-root.light .tk-log-textarea,
.tk-root.light .tk-log-mins-inp,
.tk-root.light .tk-log-entry,
.tk-root.light .tk-reward,
.tk-root.light .mo-sheet,
.tk-root.light .mo-close,
.tk-root.light .mo-mode-btn,
.tk-root.light .mo-inp,
.tk-root.light .mo-priority-btn,
.tk-root.light .mo-timer-chip,
.tk-root.light .mo-subtask-item,
.tk-root.light .tk-card-prog-track,
.tk-root.light .tk-session-dot,
.tk-root.light .tk-goal-track,
.tk-root.light .tk-card-actions,
.tk-root.light .tk-action-edit,
.tk-root.light .tk-action-del,
.tk-root.light .tk-check,
.tk-root.light .tk-subtask-check {
  border-color: var(--tk-light-border);
}

.tk-root.light .tk-card-prog-track,
.tk-root.light .tk-session-dot,
.tk-root.light .tk-goal-track,
.tk-root.light .tk-timer-btn--pause,
.tk-root.light .tk-timer-btn--reset,
.tk-root.light .tk-phase-btn.tk-phase--on,
.tk-root.light .mo-close,
.tk-root.light .tk-mode-tabs {
  background: var(--tk-light-surface-soft);
}

.tk-root.light .tk-mode-tab,
.tk-root.light .tk-category,
.tk-root.light .tk-session-label,
.tk-root.light .tk-phase-btn,
.tk-root.light .tk-log-date,
.tk-root.light .tk-goal-label,
.tk-root.light .tk-prog-label,
.tk-root.light .tk-empty-sub,
.tk-root.light .tk-empty-title,
.tk-root.light .tk-card-prog-pct,
.tk-root.light .tk-timer-phase-lbl,
.tk-root.light .mo-row-label,
.tk-root.light .mo-mode-desc,
.tk-root.light .mo-close,
.tk-root.light .tk-sub-title,
.tk-root.light .tk-log-more,
.tk-root.light .tk-chevron,
.tk-root.light .tk-log-date,
.tk-root.light .tk-log-note,
.tk-root.light .tk-stat-lbl,
.tk-root.light .tk-action-edit {
  color: var(--tk-light-text-soft);
}

.tk-root.light .tk-mode-tab--on,
.tk-root.light .tk-check,
.tk-root.light .tk-subtask-check,
.tk-root.light .tk-phase-btn.tk-phase--on,
.tk-root.light .mo-mode-btn,
.tk-root.light .mo-priority-btn,
.tk-root.light .mo-timer-chip {
  color: #334155;
}

.tk-root.light .tk-empty-btn,
.tk-root.light .tk-log-add-btn {
  background: var(--tk-light-accent-soft);
  border-color: var(--tk-light-accent-border);
  color: #4338ca;
}

.tk-root.light .tk-subtask-row:hover,
.tk-root.light .tk-log-textarea,
.tk-root.light .tk-log-mins-inp,
.tk-root.light .tk-desc,
.tk-root.light .tk-status-btn,
.tk-root.light .tk-timer-toggle {
  background: #f8fbff;
}

.tk-root.light .mo-sheet {
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.tk-root.light .tk-reward {
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  border-color: #c7d2fe;
}

.tk-root.light .tk-action-del { color: #b91c1c; }
`

// export const dynamic = 'force-dynamic'