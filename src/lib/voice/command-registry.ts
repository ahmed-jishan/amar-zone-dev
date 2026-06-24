// ─── SelfSync Voice — Command Registry ────────────────────────────────────
// Maps parsed intents to store actions and generates responses.
// Now supports both legacy keyword-based intents AND AI-powered commands.
// ──────────────────────────────────────────────────────────────────────────

import type { ParsedIntent, CommandResult, AiCommand } from './types'
import { useTaskStore } from '@/lib/store/taskStore'
import { useNamazStore } from '@/features/namaz/store/namazStore'
import { usePrefsStore } from '@/features/namaz/store/prefsStore'
import { useMoneyStore } from '@/features/money/store/moneyStore'
import { useHealthStore } from '@/features/health/store/healthStore'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { useNotesStore } from '@/features/notes/store/notesStore'
import { generateId } from '@/lib/utils/helpers'

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY COMMAND EXECUTOR (for keyword-based intent-parser)
// ═══════════════════════════════════════════════════════════════════════════

export function executeCommand(intent: ParsedIntent): CommandResult {
  const lang = intent.language

  // ── Destructive commands (blocked) ──
  if (intent.isDestructive) {
    return {
      success: false,
      message: "I can't perform destructive actions by voice. Please use the app settings for data management.",
      messageBn: 'আমি ভয়েসের মাধ্যমে ধ্বংসাত্মক কাজ করতে পারি না। দয়া করে ডেটা ম্যানেজমেন্টের জন্য অ্যাপ সেটিংস ব্যবহার করুন।',
      error: 'destructive_action_blocked',
    }
  }

  // ── Low confidence → ask for clarification ──
  if (intent.confidence < 0.5) {
    return {
      success: false,
      message: "I didn't quite understand that. Try saying 'help' to see what I can do.",
      messageBn: 'আমি বুঝতে পারিনি। আমি কী করতে পারি তা জানতে "সাহায্য" বলুন।',
      error: 'low_confidence',
    }
  }

  switch (intent.intent) {
    // ═══════════════════════════════════════════════════════════════
    // NAMAZ ACTIONS
    // ═══════════════════════════════════════════════════════════════
    case 'log_prayer': {
      const { prayer, status } = intent.entities
      if (!prayer || !status) {
        return { success: false, message: 'Please specify which prayer and status.', messageBn: 'কোন নামাজ এবং কী অবস্থা তা বলুন।', error: 'missing_params' }
      }
      const today = new Date().toISOString().split('T')[0]
      const prayerName = prayer as 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'
      // Map "done", "complete", "completed" → "prayed"
      const normalizedStatus = (status === 'done' || status === 'complete' || status === 'completed') ? 'prayed' : status
      const prayerStatus = normalizedStatus as 'prayed' | 'missed' | 'qaza'
      useNamazStore.getState().updatePrayerStatus(today, prayerName, prayerStatus)
      const statusText = normalizedStatus === 'prayed' ? 'prayed' : normalizedStatus === 'missed' ? 'missed' : 'marked as qaza'
      const statusTextBn = normalizedStatus === 'prayed' ? 'পড়েছেন' : normalizedStatus === 'missed' ? 'পড়েননি' : 'কাজা হিসেবে চিহ্নিত'
      return {
        success: true,
        message: `${prayer} has been ${statusText}.`,
        messageBn: `${prayer} ${statusTextBn}।`,
        action: 'update_prayer',
      }
    }

    case 'set_jamat':
    case 'set_azan': {
      const { prayer, time } = intent.entities
      if (!prayer || !time) {
        return { success: false, message: 'Please specify which prayer and time.', messageBn: 'কোন নামাজ এবং কত সময় বলুন।', error: 'missing_params' }
      }
      const prayerKey = prayer.toLowerCase() as 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
      const type = intent.intent === 'set_jamat' ? 'jamat' : 'azan'
      const prefs = usePrefsStore.getState()
      const current = prefs.prayerTimePreferences[prayerKey]
      if (current) {
        const updates = type === 'jamat'
          ? { jamatMode: 'fixed' as const, jamatFixedTime: time }
          : { azanMode: 'fixed' as const, azanFixedTime: time }
        prefs.updatePrayerTimePreference(prayerKey, updates)
      }
      return {
        success: true,
        message: `${prayer} ${type} has been set to ${time}.`,
        messageBn: `${prayer} ${type === 'jamat' ? 'জামাত' : 'আযান'} ${time} এ সেট করা হয়েছে।`,
        action: 'update_prayer_config',
      }
    }

    case 'next_prayer': {
      return {
        success: true,
        message: 'Check the Namaz tab for your next prayer time.',
        messageBn: 'পরবর্তী নামাজের সময় জানতে নামাজ ট্যাবে দেখুন।',
        action: 'navigate_namaz',
      }
    }

    case 'prayer_streak': {
      const records = useNamazStore.getState().records
      let streak = 0
      const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const
      type PrayerN = typeof prayerNames[number]
      for (let i = 0; i < 365; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const date = d.toISOString().split('T')[0]
        const rec = records.find((r) => r.date === date)
        if (rec && prayerNames.every((p) => (rec.prayers as any)[p] === 'prayed' || (rec.prayers as any)[p] === 'qaza')) {
          streak++
        } else break
      }
      return {
        success: true,
        message: `Your current prayer streak is ${streak} day${streak !== 1 ? 's' : ''}.`,
        messageBn: `আপনার বর্তমান নামাজের streak ${streak} দিন।`,
        action: 'show_streak',
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // TASK ACTIONS (LEGACY)
    // ═══════════════════════════════════════════════════════════════
    case 'add_task': {
      const { taskTitle, priority } = intent.entities
      if (!taskTitle) {
        return { success: false, message: 'Please tell me the task name.', messageBn: 'টাস্কের নাম বলুন।', error: 'missing_params' }
      }
      useTaskStore.getState().addTask({
        title: taskTitle,
        priority: (priority as any) || 'medium',
        category: 'personal',
        status: 'inbox',
        completed: false,
        recurring: 'none',
        energyLevel: 'medium',
        tags: [],
        subtasks: [],
        notes: '',
        timeEstimate: 0,
        goalId: undefined,
      })
      return {
        success: true,
        message: `Task "${taskTitle}" has been added.`,
        messageBn: `"${taskTitle}" টাস্কটি যোগ করা হয়েছে।`,
        action: 'add_task',
      }
    }

    case 'complete_task': {
      const { taskTitle } = intent.entities
      if (!taskTitle) {
        return { success: false, message: 'Which task would you like to mark as done?', messageBn: 'কোন টাস্কটি শেষ করতে চান?', error: 'missing_params' }
      }
      const tasks = useTaskStore.getState().tasks
      const match = tasks.find(
        (t) => t.title.toLowerCase().includes(taskTitle.toLowerCase()) && !t.completed
      )
      if (match) {
        useTaskStore.getState().toggleComplete(match.id)
        return {
          success: true,
          message: `"${match.title}" has been marked as done.`,
          messageBn: `"${match.title}" শেষ হিসেবে চিহ্নিত করা হয়েছে।`,
          action: 'complete_task',
        }
      }
      return {
        success: false,
        message: `Couldn't find an incomplete task matching "${taskTitle}".`,
        messageBn: `"${taskTitle}" এর সাথে মিলে এমন কোনো অসম্পূর্ণ টাস্ক পাওয়া যায়নি।`,
        error: 'task_not_found',
      }
    }

    case 'list_tasks': {
      const tasks = useTaskStore.getState().tasks
      const today = new Date().toISOString().split('T')[0]
      const todayTasks = tasks.filter(
        (t) => t.dueDate === today || t.createdAt.startsWith(today)
      )
      const pending = todayTasks.filter((t) => !t.completed)
      if (pending.length === 0) {
        return {
          success: true,
          message: 'You have no pending tasks for today. Great job!',
          messageBn: 'আজকের জন্য কোনো পেন্ডিং টাস্ক নেই। দারুণ!',
          action: 'list_tasks',
        }
      }
      return {
        success: true,
        message: `You have ${pending.length} task${pending.length !== 1 ? 's' : ''} for today. Check the Tasks tab for details.`,
        messageBn: `আজকের জন্য আপনার ${pending.length} টি টাস্ক আছে। বিস্তারিত জানতে টাস্ক ট্যাবে দেখুন।`,
        action: 'list_tasks',
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // MONEY ACTIONS
    // ═══════════════════════════════════════════════════════════════
    case 'add_expense': {
      const { amount, note, category } = intent.entities
      if (!amount) {
        return { success: false, message: 'Please tell me the amount.', messageBn: 'পরিমাণটি বলুন।', error: 'missing_params' }
      }
      useMoneyStore.getState().addTransaction({
        type: 'expense',
        amount,
        category: (category as any) || 'other',
        note: note || 'Voice expense',
        date: new Date().toISOString().split('T')[0],
        walletId: undefined,
        tags: [],
        isRecurring: false,
      })
      return {
        success: true,
        message: `${amount} taka expense has been added${note ? ` for ${note}` : ''}.`,
        messageBn: `${amount} টাকা খরচ যোগ করা হয়েছে${note ? ` ${note} এর জন্য` : ''}।`,
        action: 'add_expense',
      }
    }

    case 'add_income': {
      const { amount, note } = intent.entities
      if (!amount) {
        return { success: false, message: 'Please tell me the amount.', messageBn: 'পরিমাণটি বলুন।', error: 'missing_params' }
      }
      useMoneyStore.getState().addTransaction({
        type: 'income',
        amount,
        category: 'salary',
        note: note || 'Voice income',
        date: new Date().toISOString().split('T')[0],
        walletId: undefined,
        tags: [],
        isRecurring: false,
      })
      return {
        success: true,
        message: `${amount} taka income has been added.`,
        messageBn: `${amount} টাকা আয় যোগ করা হয়েছে।`,
        action: 'add_income',
      }
    }

    case 'check_balance': {
      const wallets = useMoneyStore.getState().wallets
      const total = wallets.reduce((sum, w) => sum + w.balance, 0)
      return {
        success: true,
        message: `Your total balance is ${total.toLocaleString()} taka.`,
        messageBn: `আপনার মোট ব্যালেন্স ${total.toLocaleString()} টাকা।`,
        action: 'show_balance',
      }
    }

    case 'month_summary': {
      const month = new Date().toISOString().slice(0, 7)
      const summary = useMoneyStore.getState().getMonthSummary(month)
      return {
        success: true,
        message: `This month: Income ${summary.income.toLocaleString()} taka, Expense ${summary.expense.toLocaleString()} taka, Balance ${summary.balance.toLocaleString()} taka.`,
        messageBn: `এই মাসে: আয় ${summary.income.toLocaleString()} টাকা, খরচ ${summary.expense.toLocaleString()} টাকা, ব্যালেন্স ${summary.balance.toLocaleString()} টাকা।`,
        action: 'show_summary',
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // HEALTH ACTIONS
    // ═══════════════════════════════════════════════════════════════
    case 'log_weight': {
      const { weight } = intent.entities
      if (!weight) {
        return { success: false, message: 'Please tell me your weight in kg.', messageBn: 'আপনার ওজন কেজিতে বলুন।', error: 'missing_params' }
      }
      const healthStore = useHealthStore.getState()
      healthStore.setWeight(weight)
      const record = healthStore.calculateAndSave()
      if (record) {
        return {
          success: true,
          message: `Weight logged: ${weight} kg. Your BMI is ${record.bmi}.`,
          messageBn: `ওজন লগ করা হয়েছে: ${weight} কেজি। আপনার BMI ${record.bmi}।`,
          action: 'log_weight',
        }
      }
      return { success: false, message: 'Could not save weight record.', messageBn: 'ওজন রেকর্ড সংরক্ষণ করা যায়নি।', error: 'save_failed' }
    }

    case 'check_bmi': {
      const history = useHealthStore.getState().history
      if (history.length === 0) {
        return { success: true, message: 'No BMI records yet. Log your weight to get started.', messageBn: 'কোনো BMI রেকর্ড নেই। শুরু করতে আপনার ওজন লগ করুন।', action: 'no_data' }
      }
      const latest = history[0]
      return {
        success: true,
        message: `Your latest BMI is ${latest.bmi} (${latest.category}).`,
        messageBn: `আপনার সর্বশেষ BMI ${latest.bmi} (${latest.category})।`,
        action: 'show_bmi',
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════
    case 'navigate': {
      const { target } = intent.entities
      const route = target ? `/${target}` : '/home'
      return {
        success: true,
        message: `Navigating to ${target || 'home'}...`,
        messageBn: `${target || 'হোম'} এ যাচ্ছি...`,
        action: 'navigate',
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // SYSTEM
    // ═══════════════════════════════════════════════════════════════
    case 'greeting': {
      const hour = new Date().getHours()
      let timeGreeting = 'Assalamu Alaikum!'
      let timeGreetingBn = 'আসসালামু আলাইকুম!'
      if (hour < 12) { timeGreeting = 'Good morning! Assalamu Alaikum!'; timeGreetingBn = 'সুপ্রভাত! আসসালামু আলাইকুম!' }
      else if (hour < 17) { timeGreeting = 'Good afternoon! Assalamu Alaikum!'; timeGreetingBn = 'শুভ অপরাহ্ন! আসসালামু আলাইকুম!' }
      else { timeGreeting = 'Good evening! Assalamu Alaikum!'; timeGreetingBn = 'শুভ সন্ধ্যা! আসসালামু আলাইকুম!' }
      return {
        success: true,
        message: `${timeGreeting} How can I help you?`,
        messageBn: `${timeGreetingBn} আমি কীভাবে সাহায্য করতে পারি?`,
        action: 'greeting',
      }
    }

    case 'help': {
      return {
        success: true,
        message: 'I can help with: prayers (log Fajr, set jamat), tasks (add task, mark done), money (add expense, check balance), health (log weight), and navigation (go to tasks). Try saying any of these!',
        messageBn: 'আমি সাহায্য করতে পারি: নামাজ (ফজর পড়েছি, জামাত সেট), টাস্ক (নতুন টাস্ক, শেষ), মানি (খরচ যোগ, ব্যালেন্স), স্বাস্থ্য (ওজন লগ), এবং নেভিগেশন (টাস্কে যাও)। এইগুলো বলার চেষ্টা করুন!',
        action: 'show_help',
      }
    }

    case 'stop_listening': {
      return {
        success: true,
        message: 'Voice command closed.',
        messageBn: 'ভয়েস কমান্ড বন্ধ করা হয়েছে।',
        action: 'stop',
      }
    }

    case 'status': {
      return {
        success: true,
        message: 'Check your Home tab for your complete wellness score and insights.',
        messageBn: 'আপনার সম্পূর্ণ ওয়েলনেস স্কোর এবং ইনসাইটের জন্য হোম ট্যাবে দেখুন।',
        action: 'show_status',
      }
    }

    default:
      return {
        success: false,
        message: "I didn't understand that command. Say 'help' to see what I can do.",
        messageBn: 'আমি কমান্ডটি বুঝতে পারিনি। "সাহায্য" বলে দেখুন আমি কী করতে পারি।',
        error: 'unknown_intent',
      }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AI COMMAND EXECUTOR (for Groq-powered intent extraction)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute an AI-generated command.
 * Reuses existing store actions — no duplicate business logic.
 * Supports all 15 AI action types.
 */
export function executeAiCommand(command: AiCommand): CommandResult {
  const lang = command.language || 'en'

  switch (command.action) {
    // ═══════════════════════════════════════════════════════════════
    // TASK ACTIONS
    // ═══════════════════════════════════════════════════════════════

    case 'create_task': {
      if (!command.title) {
        return {
          success: false,
          message: "Please tell me the task name.",
          messageBn: 'টাস্কের নাম বলুন।',
          error: 'missing_title',
        }
      }

      // Resolve date keywords to actual dates
      let dueDate: string | undefined
      if (command.date) {
        const resolved = resolveDateKeyword(command.date)
        if (resolved) dueDate = resolved
      }

      useTaskStore.getState().addTask({
        title: command.title,
        priority: command.priority || 'medium',
        category: (command.category || 'personal') as any,
        status: 'inbox',
        completed: false,
        recurring: 'none',
        energyLevel: 'medium',
        tags: [],
        subtasks: [],
        notes: command.description || '',
        timeEstimate: 0,
        goalId: undefined,
        dueDate,
      })

      const dateStr = command.date ? ` for ${command.date}` : ''
      const timeStr = command.time ? ` at ${command.time}` : ''
      return {
        success: true,
        message: `Task "${command.title}" has been created${dateStr}${timeStr}.`,
        messageBn: `"${command.title}" টাস্কটি তৈরি করা হয়েছে${command.date ? ` ${command.date} এর জন্য` : ''}${command.time ? ` ${command.time} টায়` : ''}।`,
        action: 'create_task',
      }
    }

    case 'update_task': {
      if (!command.existingTitle) {
        return {
          success: false,
          message: "Which task would you like to update?",
          messageBn: 'কোন টাস্কটি আপডেট করতে চান?',
          error: 'missing_existing_title',
        }
      }

      const tasks = useTaskStore.getState().tasks
      const match = findTaskByTitle(tasks, command.existingTitle)
      if (!match) {
        return {
          success: false,
          message: `Couldn't find a task matching "${command.existingTitle}".`,
          messageBn: `"${command.existingTitle}" এর সাথে মিলে এমন কোনো টাস্ক পাওয়া যায়নি।`,
          error: 'task_not_found',
        }
      }

      const updates: Record<string, any> = {}
      if (command.updatedTitle) updates.title = command.updatedTitle
      if (command.updatedDescription) updates.notes = command.updatedDescription
      if (command.priority) updates.priority = command.priority
      if (command.date) {
        const resolved = resolveDateKeyword(command.date)
        if (resolved) updates.dueDate = resolved
      }

      if (Object.keys(updates).length === 0) {
        return {
          success: false,
          message: "What would you like to update?",
          messageBn: 'আপনি কী আপডেট করতে চান?',
          error: 'no_updates',
        }
      }

      useTaskStore.getState().updateTask(match.id, updates)

      return {
        success: true,
        message: `Task "${command.existingTitle}" has been updated.`,
        messageBn: `"${command.existingTitle}" টাস্কটি আপডেট করা হয়েছে।`,
        action: 'update_task',
      }
    }

    case 'delete_task': {
      if (!command.existingTitle) {
        return {
          success: false,
          message: "Which task would you like to delete?",
          messageBn: 'কোন টাস্কটি ডিলিট করতে চান?',
          error: 'missing_existing_title',
        }
      }

      const tasks = useTaskStore.getState().tasks
      const match = findTaskByTitle(tasks, command.existingTitle)
      if (!match) {
        return {
          success: false,
          message: `Couldn't find a task matching "${command.existingTitle}".`,
          messageBn: `"${command.existingTitle}" এর সাথে মিলে এমন কোনো টাস্ক পাওয়া যায়নি।`,
          error: 'task_not_found',
        }
      }

      useTaskStore.getState().deleteTask(match.id)

      return {
        success: true,
        message: `Task "${match.title}" has been deleted.`,
        messageBn: `"${match.title}" টাস্কটি ডিলিট করা হয়েছে।`,
        action: 'delete_task',
      }
    }

    case 'complete_task': {
      if (!command.existingTitle) {
        return {
          success: false,
          message: "Which task would you like to mark as done?",
          messageBn: 'কোন টাস্কটি শেষ করতে চান?',
          error: 'missing_existing_title',
        }
      }

      const tasks = useTaskStore.getState().tasks
      const match = findTaskByTitle(tasks, command.existingTitle)
      if (!match) {
        return {
          success: false,
          message: `Couldn't find a task matching "${command.existingTitle}".`,
          messageBn: `"${command.existingTitle}" এর সাথে মিলে এমন কোনো টাস্ক পাওয়া যায়নি।`,
          error: 'task_not_found',
        }
      }

      useTaskStore.getState().toggleComplete(match.id)

      return {
        success: true,
        message: `Task "${match.title}" has been marked as done.`,
        messageBn: `"${match.title}" শেষ হিসেবে চিহ্নিত করা হয়েছে।`,
        action: 'complete_task',
      }
    }

    case 'show_tasks': {
      const tasks = useTaskStore.getState().tasks
      const today = new Date().toISOString().split('T')[0]
      const todayTasks = tasks.filter(
        (t) => t.dueDate === today || t.createdAt.startsWith(today)
      )
      const pending = todayTasks.filter((t) => !t.completed)
      if (pending.length === 0) {
        return {
          success: true,
          message: 'You have no pending tasks for today. Great job!',
          messageBn: 'আজকের জন্য কোনো পেন্ডিং টাস্ক নেই। দারুণ!',
          action: 'show_tasks',
        }
      }
      return {
        success: true,
        message: `You have ${pending.length} task${pending.length !== 1 ? 's' : ''} for today. Check the Tasks tab for details.`,
        messageBn: `আজকের জন্য আপনার ${pending.length} টি টাস্ক আছে। বিস্তারিত জানতে টাস্ক ট্যাবে দেখুন।`,
        action: 'show_tasks',
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // NOTE ACTIONS
    // ═══════════════════════════════════════════════════════════════

    case 'create_note': {
      if (!command.title) {
        return {
          success: false,
          message: "Please tell me the note title.",
          messageBn: 'নোটের শিরোনাম বলুন।',
          error: 'missing_title',
        }
      }

      useNotesStore.getState().addNote('text', {
        title: command.title,
        category: 'personal',
        tags: [],
        body: command.description || '',
      })

      return {
        success: true,
        message: `Note "${command.title}" has been created.`,
        messageBn: `"${command.title}" নোটটি তৈরি করা হয়েছে।`,
        action: 'create_note',
      }
    }

    case 'update_note': {
      if (!command.existingTitle) {
        return {
          success: false,
          message: "Which note would you like to update?",
          messageBn: 'কোন নোটটি আপডেট করতে চান?',
          error: 'missing_existing_title',
        }
      }

      const notes = useNotesStore.getState().notes
      const match = notes.find(
        (n) => n.title.toLowerCase().includes(command.existingTitle!.toLowerCase())
      )
      if (!match) {
        return {
          success: false,
          message: `Couldn't find a note matching "${command.existingTitle}".`,
          messageBn: `"${command.existingTitle}" এর সাথে মিলে এমন কোনো নোট পাওয়া যায়নি।`,
          error: 'note_not_found',
        }
      }

      const updates: Record<string, any> = {}
      if (command.updatedTitle) updates.title = command.updatedTitle
      if (command.updatedDescription) updates.body = command.updatedDescription

      useNotesStore.getState().updateNote(match.id, updates)

      return {
        success: true,
        message: `Note "${command.existingTitle}" has been updated.`,
        messageBn: `"${command.existingTitle}" নোটটি আপডেট করা হয়েছে।`,
        action: 'update_note',
      }
    }

    case 'delete_note': {
      if (!command.existingTitle) {
        return {
          success: false,
          message: "Which note would you like to delete?",
          messageBn: 'কোন নোটটি ডিলিট করতে চান?',
          error: 'missing_existing_title',
        }
      }

      const notes = useNotesStore.getState().notes
      const match = notes.find(
        (n) => n.title.toLowerCase().includes(command.existingTitle!.toLowerCase())
      )
      if (!match) {
        return {
          success: false,
          message: `Couldn't find a note matching "${command.existingTitle}".`,
          messageBn: `"${command.existingTitle}" এর সাথে মিলে এমন কোনো নোট পাওয়া যায়নি।`,
          error: 'note_not_found',
        }
      }

      useNotesStore.getState().deleteNote(match.id)

      return {
        success: true,
        message: `Note "${match.title}" has been deleted.`,
        messageBn: `"${match.title}" নোটটি ডিলিট করা হয়েছে।`,
        action: 'delete_note',
      }
    }

    case 'open_notes': {
      return {
        success: true,
        message: 'Opening notes...',
        messageBn: 'নোটস খুলছি...',
        action: 'navigate_notes',
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // FOCUS MODE ACTIONS
    // ═══════════════════════════════════════════════════════════════

    case 'start_focus_mode': {
      return {
        success: true,
        message: command.title
          ? `Focus mode started for "${command.title}". Stay focused!`
          : 'Focus mode started! Stay focused!',
        messageBn: command.title
          ? `"${command.title}" এর জন্য ফোকাস মোড চালু হয়েছে। ফোকাসড থাকুন!`
          : 'ফোকাস মোড চালু হয়েছে! ফোকাসড থাকুন!',
        action: 'start_focus_mode',
      }
    }

    case 'stop_focus_mode': {
      return {
        success: true,
        message: 'Focus mode stopped. Great work!',
        messageBn: 'ফোকাস মোড বন্ধ হয়েছে। দারুণ কাজ!',
        action: 'stop_focus_mode',
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // NAVIGATION ACTIONS
    // ═══════════════════════════════════════════════════════════════

    case 'open_calculator': {
      return {
        success: true,
        message: 'Opening calculator...',
        messageBn: 'ক্যালকুলেটর খুলছি...',
        action: 'navigate_calculator',
      }
    }

    case 'open_tasks': {
      return {
        success: true,
        message: 'Going to tasks...',
        messageBn: 'টাস্কসে যাচ্ছি...',
        action: 'navigate_tasks',
      }
    }

    case 'open_dashboard': {
      return {
        success: true,
        message: 'Going to dashboard...',
        messageBn: 'ড্যাশবোর্ডে যাচ্ছি...',
        action: 'navigate_dashboard',
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // CONVERSATION ACTION
    // ═══════════════════════════════════════════════════════════════

    case 'conversation': {
      const response = command.response || command.responseBn || "I'm here to help. What would you like to do?"
      const responseBn = command.responseBn || command.response || 'আমি সাহায্য করতে এখানে আছি। আপনি কী করতে চান?'
      return {
        success: true,
        message: response,
        messageBn: responseBn,
        action: 'conversation',
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // NEW NAVIGATION ACTIONS
    // ═══════════════════════════════════════════════════════════════

    case 'navigate_home': {
      return {
        success: true,
        message: 'Going to home...',
        messageBn: 'হোমে যাচ্ছি...',
        action: 'navigate_home',
      }
    }

    case 'navigate_money': {
      return {
        success: true,
        message: 'Opening money section...',
        messageBn: 'মানি সেকশন খুলছি...',
        action: 'navigate_money',
      }
    }

    case 'navigate_namaz': {
      return {
        success: true,
        message: 'Opening prayer section...',
        messageBn: 'নামাজ সেকশন খুলছি...',
        action: 'navigate_namaz',
      }
    }

    case 'navigate_settings': {
      return {
        success: true,
        message: 'Opening settings...',
        messageBn: 'সেটিংস খুলছি...',
        action: 'navigate_settings',
      }
    }

    case 'navigate_products': {
      return {
        success: true,
        message: 'Opening products...',
        messageBn: 'প্রোডাক্টস খুলছি...',
        action: 'navigate_products',
      }
    }

    case 'navigate_offers': {
      return {
        success: true,
        message: 'Showing offers...',
        messageBn: 'অফার দেখাচ্ছি...',
        action: 'navigate_offers',
      }
    }

    case 'navigate_checkout': {
      return {
        success: true,
        message: 'Opening checkout...',
        messageBn: 'চেকআউট খুলছি...',
        action: 'navigate_checkout',
      }
    }

    case 'search_products': {
      const query = command.title || ''
      return {
        success: true,
        message: query 
          ? `Searching for "${query}"...`
          : 'Opening search...',
        messageBn: query 
          ? `"${query}" অনুসন্ধান করছি...`
          : 'অনুসন্ধান খুলছি...',
        action: 'search_products',
      }
    }

    case 'show_featured_collection': {
      return {
        success: true,
        message: 'Opening featured collection...',
        messageBn: 'ফিচার্ড কালেকশন খুলছি...',
        action: 'show_featured_collection',
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // UNKNOWN ACTION
    // ═══════════════════════════════════════════════════════════════

    case 'unknown':
    default: {
      return {
        success: false,
        message: "I didn't quite understand that. Try again with a clear command.",
        messageBn: 'আমি ঠিক বুঝতে পারিনি। আবার একটু স্পষ্ট করে বলুন।',
        error: 'unknown_action',
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Find a task by matching the title (case-insensitive, partial match).
 */
function findTaskByTitle(tasks: any[], searchTitle: string): any | undefined {
  const lower = searchTitle.toLowerCase()
  return tasks.find(
    (t) => t.title.toLowerCase().includes(lower) && !t.completed
  ) || tasks.find(
    (t) => t.title.toLowerCase().includes(lower)
  )
}

/**
 * Resolve date keywords ("today", "tomorrow", "আজ", "আগামীকাল") to ISO date strings.
 */
function resolveDateKeyword(keyword: string): string | undefined {
  const lower = keyword.toLowerCase().trim()
  const today = new Date()
  const todayISO = today.toISOString().split('T')[0]

  if (lower === 'today' || lower === 'আজ') return todayISO

  if (lower === 'tomorrow' || lower === 'আগামীকাল') {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  if (lower === 'day after tomorrow' || lower === 'পরশু') {
    const dayAfter = new Date(today)
    dayAfter.setDate(dayAfter.getDate() + 2)
    return dayAfter.toISOString().split('T')[0]
  }

  // If it looks like an ISO date already, return it
  if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) return lower

  return undefined
}