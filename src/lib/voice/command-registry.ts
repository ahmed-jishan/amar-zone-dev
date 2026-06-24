// ─── SelfSync Voice — Command Registry ────────────────────────────────────
// Maps parsed intents to store actions and generates responses.

import type { ParsedIntent, CommandResult } from './types'
import { useTaskStore } from '@/lib/store/taskStore'
import { useNamazStore } from '@/features/namaz/store/namazStore'
import { usePrefsStore } from '@/features/namaz/store/prefsStore'
import { useMoneyStore } from '@/features/money/store/moneyStore'
import { useHealthStore } from '@/features/health/store/healthStore'
import { useSettingsStore } from '@/features/settings/store/settingsStore'
import { generateId } from '@/lib/utils/helpers'

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
      // Return a helpful message — actual next prayer time would need prayer times context
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
    // TASK ACTIONS
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