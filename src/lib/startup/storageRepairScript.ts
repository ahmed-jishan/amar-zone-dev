export const storageRepairScript = `
(function () {
  try {
    if (!window.localStorage) return;
    var nowIso = new Date().toISOString();
    var nowMs = Date.now();
    var isObj = function (v) { return v && typeof v === 'object' && !Array.isArray(v); };
    var asArray = function (v) { return Array.isArray(v) ? v : []; };
    var read = function (key) {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (_) { localStorage.removeItem(key); return null; }
    };
    var write = function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
    };
    var validDateString = function (v) {
      return typeof v === 'string' && !Number.isNaN(Date.parse(v));
    };
    var validDateNumber = function (v) {
      return typeof v === 'number' && Number.isFinite(v) && !Number.isNaN(new Date(v).getTime());
    };
    var safeNumber = function (v, fallback) {
      return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
    };
    var persistState = function (key) {
      var store = read(key);
      if (!isObj(store)) return null;
      if (!isObj(store.state)) store.state = {};
      return store;
    };

    var notes = read('az-notes');
    if (notes !== null) {
      write('az-notes', asArray(notes).filter(isObj).map(function (note, i) {
        var createdAt = validDateNumber(note.createdAt) ? note.createdAt : nowMs;
        return Object.assign({}, note, {
          id: typeof note.id === 'string' ? note.id : 'note_repaired_' + nowMs + '_' + i,
          type: typeof note.type === 'string' ? note.type : 'text',
          title: typeof note.title === 'string' && note.title.trim() ? note.title : 'Untitled note',
          tags: asArray(note.tags),
          pinned: Boolean(note.pinned),
          createdAt: createdAt,
          updatedAt: validDateNumber(note.updatedAt) ? note.updatedAt : createdAt
        });
      }));
    }

    var health = read('az-health');
    if (health !== null) {
      write('az-health', asArray(health).filter(isObj).filter(function (r) {
        return typeof r.bmi === 'number' && Number.isFinite(r.bmi);
      }).map(function (r, i) {
        return Object.assign({}, r, {
          id: typeof r.id === 'string' ? r.id : 'bmi_repaired_' + nowMs + '_' + i,
          date: validDateNumber(r.date) ? r.date : nowMs
        });
      }));
    }

    var tasksStore = read('selfsync-tasks');
    if (isObj(tasksStore)) {
      var taskState = isObj(tasksStore.state) ? tasksStore.state : {};
      taskState.tasks = asArray(taskState.tasks).filter(isObj).map(function (task, i) {
        var createdAt = validDateString(task.createdAt) ? task.createdAt : nowIso;
        return Object.assign({}, task, {
          id: typeof task.id === 'string' ? task.id : 'task_repaired_' + nowMs + '_' + i,
          title: typeof task.title === 'string' && task.title.trim() ? task.title : 'Untitled task',
          status: typeof task.status === 'string' ? task.status : 'inbox',
          priority: typeof task.priority === 'string' ? task.priority : 'medium',
          completed: Boolean(task.completed),
          completedDates: asArray(task.completedDates).filter(function (d) { return typeof d === 'string'; }),
          createdAt: createdAt,
          updatedAt: validDateString(task.updatedAt) ? task.updatedAt : createdAt,
          sessions: asArray(task.sessions),
          reminders: asArray(task.reminders),
          dependencies: asArray(task.dependencies)
        });
      });
      tasksStore.state = taskState;
      write('selfsync-tasks', tasksStore);
    }

    var moneyStore = persistState('selfsync-money-v2');
    if (moneyStore) {
      var money = moneyStore.state;
      money.transactions = asArray(money.transactions).filter(isObj).map(function (t, i) {
        var date = typeof t.date === 'string' && t.date ? t.date : nowIso.slice(0, 10);
        return Object.assign({}, t, {
          id: typeof t.id === 'string' ? t.id : 'txn_repaired_' + nowMs + '_' + i,
          type: t.type === 'income' ? 'income' : 'expense',
          amount: safeNumber(t.amount, 0),
          date: date,
          createdAt: validDateString(t.createdAt) ? t.createdAt : date + 'T00:00:00.000Z',
          status: typeof t.status === 'string' ? t.status : 'completed'
        });
      });
      money.loans = asArray(money.loans).filter(isObj).map(function (loan, i) {
        return Object.assign({}, loan, {
          id: typeof loan.id === 'string' ? loan.id : 'loan_repaired_' + nowMs + '_' + i,
          personName: typeof loan.personName === 'string' ? loan.personName : 'Unnamed',
          amount: safeNumber(loan.amount, 0),
          currentBalance: safeNumber(loan.currentBalance, safeNumber(loan.amount, 0)),
          entries: asArray(loan.entries),
          settled: Boolean(loan.settled),
          reminderEnabled: Boolean(loan.reminderEnabled)
        });
      });
      money.budgets = asArray(money.budgets).filter(isObj).map(function (b) {
        return Object.assign({}, b, {
          month: typeof b.month === 'string' ? b.month : nowIso.slice(0, 7),
          salary: safeNumber(b.salary, 0),
          budgets: isObj(b.budgets) ? b.budgets : {}
        });
      });
      money.savingsGoals = asArray(money.savingsGoals).filter(isObj).map(function (g, i) {
        return Object.assign({}, g, {
          id: typeof g.id === 'string' ? g.id : 'goal_repaired_' + nowMs + '_' + i,
          title: typeof g.title === 'string' ? g.title : 'Savings goal',
          targetAmount: safeNumber(g.targetAmount, 0),
          currentAmount: safeNumber(g.currentAmount, 0)
        });
      });
      money.wallets = asArray(money.wallets).filter(isObj).map(function (w, i) {
        return Object.assign({}, w, {
          id: typeof w.id === 'string' ? w.id : 'wallet_repaired_' + nowMs + '_' + i,
          name: typeof w.name === 'string' ? w.name : 'Wallet',
          balance: safeNumber(w.balance, 0),
          currency: typeof w.currency === 'string' ? w.currency : 'BDT'
        });
      });
      if (money.wallets.length === 0) {
        money.wallets = [{ id: 'default', name: 'Cash', type: 'cash', balance: 0, currency: 'BDT', color: '#10b981', icon: 'Cash', isDefault: true }];
      }
      money.subscriptions = asArray(money.subscriptions).filter(isObj);
      money.insights = asArray(money.insights).filter(isObj);
      money.categoryLimits = asArray(money.categoryLimits).filter(isObj);
      money.recurringTemplates = asArray(money.recurringTemplates).filter(isObj);
      money.assets = asArray(money.assets).filter(isObj);
      money.netWorthHistory = asArray(money.netWorthHistory).filter(isObj);
      money.selectedWalletId = typeof money.selectedWalletId === 'string' ? money.selectedWalletId : money.wallets[0].id;
      moneyStore.state = money;
      write('selfsync-money-v2', moneyStore);
    }

    var namazStore = persistState('selfsync-namaz');
    if (namazStore) {
      namazStore.state.records = asArray(namazStore.state.records).filter(isObj);
      if (!isObj(namazStore.state.settings)) namazStore.state.settings = {};
      write('selfsync-namaz', namazStore);
    }

    var aiStore = persistState('selfsync-ai-v1');
    if (aiStore) {
      aiStore.state.insights = asArray(aiStore.state.insights).filter(isObj);
      aiStore.state.patterns = asArray(aiStore.state.patterns).filter(isObj);
      if (!isObj(aiStore.state.scores)) aiStore.state.scores = null;
      if (!isObj(aiStore.state.dailyBrief)) aiStore.state.dailyBrief = null;
      aiStore.state.lastComputed = safeNumber(aiStore.state.lastComputed, null);
      write('selfsync-ai-v1', aiStore);
    }

    var settingsStore = persistState('selfsync-settings');
    if (settingsStore) {
      var categories = settingsStore.state.notificationCategories;
      settingsStore.state.notificationCategories = Object.assign(
        { tasks: true, money: true, namaz: true, system: true },
        isObj(categories) ? categories : {}
      );
      settingsStore.state.quietHoursStart = typeof settingsStore.state.quietHoursStart === 'string' ? settingsStore.state.quietHoursStart : '22:00';
      settingsStore.state.quietHoursEnd = typeof settingsStore.state.quietHoursEnd === 'string' ? settingsStore.state.quietHoursEnd : '06:00';
      write('selfsync-settings', settingsStore);
    }

    ['selfsync-money-v2', 'selfsync-namaz', 'selfsync-ai-v1', 'selfsync-settings'].forEach(function (key) {
      var value = read(key);
      if (value !== null && !isObj(value)) localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('[SelfSync] Startup storage repair skipped:', error);
  }
})();`;
