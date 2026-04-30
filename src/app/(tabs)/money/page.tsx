// 'use client'
// import { useState, useMemo } from 'react'
// import { Plus, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, ChevronRight, X, Check, Clock } from 'lucide-react'
// import { useMoneyStore } from '@/lib/store/moneyStore'
// import { monthISO, todayISO, formatCurrency } from '@/lib/utils/helpers'
// import type { Transaction, Loan, ExpenseCategory, TransactionType } from '@/lib/types'
// import { generateId } from '@/lib/utils/helpers'

// const EXPENSE_CATEGORIES: ExpenseCategory[] = [
//   'food','transport','utilities','health','education','entertainment','shopping','rent','other'
// ]

// const CATEGORY_META: Record<string, { icon: string; color: string }> = {
//   food:          { icon: '🍛', color: '#f97316' },
//   transport:     { icon: '🚌', color: '#3b82f6' },
//   utilities:     { icon: '💡', color: '#eab308' },
//   health:        { icon: '❤️', color: '#ef4444' },
//   education:     { icon: '📚', color: '#8b5cf6' },
//   entertainment: { icon: '🎬', color: '#ec4899' },
//   shopping:      { icon: '🛍️', color: '#06b6d4' },
//   rent:          { icon: '🏠', color: '#10b981' },
//   salary:        { icon: '💰', color: '#22c55e' },
//   freelance:     { icon: '💻', color: '#6366f1' },
//   'other-income':{ icon: '📈', color: '#14b8a6' },
//   other:         { icon: '📦', color: '#94a3b8' },
// }

// type Tab = 'overview' | 'transactions' | 'loans'

// export default function MoneyPage() {
//   const { transactions, loans, addTransaction, deleteTransaction, addLoan, settleLoan, deleteLoan, getMonthSummary } = useMoneyStore()
//   const [tab, setTab] = useState<Tab>('overview')
//   const [showAddTxn, setShowAddTxn] = useState(false)
//   const [showAddLoan, setShowAddLoan] = useState(false)

//   const currentMonth = monthISO()
//   const summary = getMonthSummary(currentMonth)

//   const monthTxns = useMemo(() =>
//     transactions
//       .filter(t => t.date.startsWith(currentMonth))
//       .sort((a, b) => b.date.localeCompare(a.date)),
//     [transactions, currentMonth]
//   )

//   const activeLoans = loans.filter(l => !l.settled)
//   const totalLoanGiven = activeLoans.filter(l => l.direction === 'given').reduce((s, l) => s + l.amount, 0)
//   const totalLoanTaken = activeLoans.filter(l => l.direction === 'taken').reduce((s, l) => s + l.amount, 0)

//   const spendingByCategory = useMemo(() => {
//     const map: Record<string, number> = {}
//     monthTxns.filter(t => t.type === 'expense').forEach(t => {
//       map[t.category] = (map[t.category] || 0) + t.amount
//     })
//     return Object.entries(map).sort((a, b) => b[1] - a[1])
//   }, [monthTxns])

//   return (
//     <div className="money-page">
//       {/* Header */}
//       <div className="money-header">
//         <div className="money-header-top">
//           <div>
//             <p className="money-label">এই মাসের হিসাব</p>
//             <h1 className="money-balance">{formatCurrency(summary.balance)}</h1>
//           </div>
//           <button className="money-add-btn" onClick={() => setShowAddTxn(true)}>
//             <Plus size={20} />
//           </button>
//         </div>

//         {/* Income / Expense pills */}
//         <div className="money-pills">
//           <div className="money-pill money-pill--income">
//             <ArrowUpRight size={14} />
//             <span>{formatCurrency(summary.income)}</span>
//             <span className="money-pill-label">আয়</span>
//           </div>
//           <div className="money-pill money-pill--expense">
//             <ArrowDownRight size={14} />
//             <span>{formatCurrency(summary.expense)}</span>
//             <span className="money-pill-label">খরচ</span>
//           </div>
//         </div>

//         {/* Progress bar */}
//         {summary.income > 0 && (
//           <div className="money-progress-wrap">
//             <div className="money-progress-track">
//               <div
//                 className="money-progress-fill"
//                 style={{ width: `${Math.min(100, (summary.expense / summary.income) * 100)}%` }}
//               />
//             </div>
//             <span className="money-progress-pct">
//               {Math.round((summary.expense / summary.income) * 100)}% খরচ হয়েছে
//             </span>
//           </div>
//         )}
//       </div>

//       {/* Tabs */}
//       <div className="money-tabs">
//         {(['overview','transactions','loans'] as Tab[]).map(t => (
//           <button
//             key={t}
//             className={`money-tab ${tab === t ? 'money-tab--active' : ''}`}
//             onClick={() => setTab(t)}
//           >
//             {t === 'overview' ? 'সারসংক্ষেপ' : t === 'transactions' ? 'লেনদেন' : 'ধার'}
//           </button>
//         ))}
//       </div>

//       {/* Tab Content */}
//       <div className="money-content">

//         {/* ── OVERVIEW ── */}
//         {tab === 'overview' && (
//           <div className="fade-in">
//             <p className="section-title">ক্যাটাগরি অনুযায়ী খরচ</p>
//             {spendingByCategory.length === 0 ? (
//               <div className="empty-state">
//                 <Wallet size={40} strokeWidth={1.2} />
//                 <p>এই মাসে কোনো খরচ নেই</p>
//               </div>
//             ) : (
//               <div className="category-list">
//                 {spendingByCategory.map(([cat, amt]) => {
//                   const meta = CATEGORY_META[cat] || CATEGORY_META.other
//                   const pct = summary.expense > 0 ? (amt / summary.expense) * 100 : 0
//                   return (
//                     <div key={cat} className="category-row">
//                       <div className="category-icon" style={{ background: meta.color + '22' }}>
//                         <span>{meta.icon}</span>
//                       </div>
//                       <div className="category-info">
//                         <div className="category-top">
//                           <span className="category-name">{cat}</span>
//                           <span className="category-amt">{formatCurrency(amt)}</span>
//                         </div>
//                         <div className="category-bar-track">
//                           <div
//                             className="category-bar-fill"
//                             style={{ width: `${pct}%`, background: meta.color }}
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>
//             )}

//             {/* Loan summary card */}
//             {activeLoans.length > 0 && (
//               <div className="loan-summary-card" onClick={() => setTab('loans')}>
//                 <div className="loan-summary-row">
//                   <span className="loan-summary-label">দিয়েছি</span>
//                   <span className="loan-given">{formatCurrency(totalLoanGiven)}</span>
//                 </div>
//                 <div className="loan-summary-divider" />
//                 <div className="loan-summary-row">
//                   <span className="loan-summary-label">নিয়েছি</span>
//                   <span className="loan-taken">{formatCurrency(totalLoanTaken)}</span>
//                 </div>
//                 <ChevronRight size={16} className="loan-summary-arrow" />
//               </div>
//             )}
//           </div>
//         )}

//         {/* ── TRANSACTIONS ── */}
//         {tab === 'transactions' && (
//           <div className="fade-in">
//             <div className="txn-header">
//               <p className="section-title">সব লেনদেন</p>
//               <button className="add-small-btn" onClick={() => setShowAddTxn(true)}>
//                 <Plus size={14} /> যোগ করুন
//               </button>
//             </div>
//             {monthTxns.length === 0 ? (
//               <div className="empty-state">
//                 <TrendingUp size={40} strokeWidth={1.2} />
//                 <p>কোনো লেনদেন নেই</p>
//               </div>
//             ) : (
//               <div className="txn-list">
//                 {monthTxns.map((t, i) => {
//                   const meta = CATEGORY_META[t.category] || CATEGORY_META.other
//                   return (
//                     <div key={t.id} className="txn-row slide-up" style={{ animationDelay: `${i * 30}ms` }}>
//                       <div className="txn-icon" style={{ background: meta.color + '22' }}>
//                         <span>{meta.icon}</span>
//                       </div>
//                       <div className="txn-info">
//                         <span className="txn-cat">{t.note || t.category}</span>
//                         <span className="txn-date">{t.date}</span>
//                       </div>
//                       <div className="txn-right">
//                         <span className={`txn-amt ${t.type === 'income' ? 'txn-amt--income' : 'txn-amt--expense'}`}>
//                           {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
//                         </span>
//                         <button className="txn-delete" onClick={() => deleteTransaction(t.id)}>
//                           <X size={12} />
//                         </button>
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>
//             )}
//           </div>
//         )}

//         {/* ── LOANS ── */}
//         {tab === 'loans' && (
//           <div className="fade-in">
//             <div className="txn-header">
//               <p className="section-title">ধার তালিকা</p>
//               <button className="add-small-btn" onClick={() => setShowAddLoan(true)}>
//                 <Plus size={14} /> যোগ করুন
//               </button>
//             </div>
//             {activeLoans.length === 0 ? (
//               <div className="empty-state">
//                 <Clock size={40} strokeWidth={1.2} />
//                 <p>কোনো ধার নেই</p>
//               </div>
//             ) : (
//               <div className="txn-list">
//                 {activeLoans.map((l, i) => (
//                   <div key={l.id} className="loan-row slide-up" style={{ animationDelay: `${i * 30}ms` }}>
//                     <div className={`loan-dir-badge ${l.direction === 'given' ? 'loan-dir--given' : 'loan-dir--taken'}`}>
//                       {l.direction === 'given' ? 'দিয়েছি' : 'নিয়েছি'}
//                     </div>
//                     <div className="txn-info">
//                       <span className="txn-cat">{l.personName}</span>
//                       {l.dueDate && <span className="txn-date">ডেডলাইন: {l.dueDate}</span>}
//                       {l.note && <span className="txn-date">{l.note}</span>}
//                     </div>
//                     <div className="txn-right">
//                       <span className={l.direction === 'given' ? 'loan-given' : 'loan-taken'}>
//                         {formatCurrency(l.amount)}
//                       </span>
//                       <div className="loan-actions">
//                         <button className="loan-settle" onClick={() => settleLoan(l.id)} title="মিটিয়ে দিন">
//                           <Check size={12} />
//                         </button>
//                         <button className="txn-delete" onClick={() => deleteLoan(l.id)}>
//                           <X size={12} />
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Add Transaction Modal */}
//       {showAddTxn && <AddTransactionModal onClose={() => setShowAddTxn(false)} onAdd={addTransaction} />}
//       {showAddLoan && <AddLoanModal onClose={() => setShowAddLoan(false)} onAdd={addLoan} />}

//       <style>{moneyStyles}</style>
//     </div>
//   )
// }

// /* ─── Add Transaction Modal ─────────────────────────────────────────── */
// function AddTransactionModal({ onClose, onAdd }: {
//   onClose: () => void
//   onAdd: (t: Omit<Transaction, 'id'>) => void
// }) {
//   const [type, setType] = useState<TransactionType>('expense')
//   const [amount, setAmount] = useState('')
//   const [category, setCategory] = useState<string>('food')
//   const [note, setNote] = useState('')
//   const [date, setDate] = useState(todayISO())

//   const incomeCategories = ['salary','freelance','other-income']
//   const cats = type === 'income' ? incomeCategories : EXPENSE_CATEGORIES

//   const handleSubmit = () => {
//     if (!amount || isNaN(Number(amount))) return
//     onAdd({
//       type,
//       amount: Number(amount),
//       category: category as ExpenseCategory,
//       note,
//       date,
//       isRecurring: false,
//     })
//     onClose()
//   }

//   return (
//     <div className="modal-backdrop" onClick={onClose}>
//       <div className="modal-sheet" onClick={e => e.stopPropagation()}>
//         <div className="modal-handle" />
//         <h2 className="modal-title">নতুন লেনদেন</h2>

//         {/* Type toggle */}
//         <div className="type-toggle">
//           <button className={`type-btn ${type === 'expense' ? 'type-btn--active-exp' : ''}`} onClick={() => { setType('expense'); setCategory('food') }}>
//             <ArrowDownRight size={15} /> খরচ
//           </button>
//           <button className={`type-btn ${type === 'income' ? 'type-btn--active-inc' : ''}`} onClick={() => { setType('income'); setCategory('salary') }}>
//             <ArrowUpRight size={15} /> আয়
//           </button>
//         </div>

//         {/* Amount */}
//         <div className="amount-input-wrap">
//           <span className="amount-symbol">৳</span>
//           <input
//             className="amount-input"
//             type="number"
//             placeholder="০"
//             value={amount}
//             onChange={e => setAmount(e.target.value)}
//             autoFocus
//           />
//         </div>

//         {/* Category */}
//         <div className="cat-grid">
//           {cats.map(c => {
//             const meta = CATEGORY_META[c] || CATEGORY_META.other
//             return (
//               <button
//                 key={c}
//                 className={`cat-chip ${category === c ? 'cat-chip--active' : ''}`}
//                 style={category === c ? { background: meta.color + '33', borderColor: meta.color } : {}}
//                 onClick={() => setCategory(c)}
//               >
//                 <span>{meta.icon}</span> {c}
//               </button>
//             )
//           })}
//         </div>

//         <input className="modal-input" placeholder="নোট (ঐচ্ছিক)" value={note} onChange={e => setNote(e.target.value)} />
//         <input className="modal-input" type="date" value={date} onChange={e => setDate(e.target.value)} />

//         <button className="modal-submit" onClick={handleSubmit}>সংরক্ষণ করুন</button>
//       </div>
//       <style>{modalStyles}</style>
//     </div>
//   )
// }

// /* ─── Add Loan Modal ─────────────────────────────────────────────────── */
// function AddLoanModal({ onClose, onAdd }: {
//   onClose: () => void
//   onAdd: (l: Omit<Loan, 'id'>) => void
// }) {
//   const [direction, setDirection] = useState<'given' | 'taken'>('given')
//   const [personName, setPersonName] = useState('')
//   const [amount, setAmount] = useState('')
//   const [dueDate, setDueDate] = useState('')
//   const [note, setNote] = useState('')

//   const handleSubmit = () => {
//     if (!personName || !amount || isNaN(Number(amount))) return
//     onAdd({
//       personName,
//       amount: Number(amount),
//       direction,
//       date: todayISO(),
//       dueDate: dueDate || undefined,
//       note: note || undefined,
//       settled: false,
//     })
//     onClose()
//   }

//   return (
//     <div className="modal-backdrop" onClick={onClose}>
//       <div className="modal-sheet" onClick={e => e.stopPropagation()}>
//         <div className="modal-handle" />
//         <h2 className="modal-title">ধার যোগ করুন</h2>

//         <div className="type-toggle">
//           <button className={`type-btn ${direction === 'given' ? 'type-btn--active-inc' : ''}`} onClick={() => setDirection('given')}>
//             দিয়েছি
//           </button>
//           <button className={`type-btn ${direction === 'taken' ? 'type-btn--active-exp' : ''}`} onClick={() => setDirection('taken')}>
//             নিয়েছি
//           </button>
//         </div>

//         <input className="modal-input" placeholder="কার সাথে?" value={personName} onChange={e => setPersonName(e.target.value)} autoFocus />

//         <div className="amount-input-wrap">
//           <span className="amount-symbol">৳</span>
//           <input className="amount-input" type="number" placeholder="০" value={amount} onChange={e => setAmount(e.target.value)} />
//         </div>

//         <input className="modal-input" type="date" placeholder="শেষ তারিখ" value={dueDate} onChange={e => setDueDate(e.target.value)} />
//         <input className="modal-input" placeholder="নোট (ঐচ্ছিক)" value={note} onChange={e => setNote(e.target.value)} />

//         <button className="modal-submit" onClick={handleSubmit}>সংরক্ষণ করুন</button>
//       </div>
//       <style>{modalStyles}</style>
//     </div>
//   )
// }

// /* ─── Styles ─────────────────────────────────────────────────────────── */
// const moneyStyles = `
// .money-page { min-height: 100%; display: flex; flex-direction: column; }

// .money-header {
//   background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
//   padding: 24px 20px 28px;
//   color: white;
//   position: relative;
//   overflow: hidden;
// }
// .money-header::before {
//   content: '';
//   position: absolute;
//   top: -60px; right: -60px;
//   width: 200px; height: 200px;
//   border-radius: 50%;
//   background: rgba(99,102,241,0.15);
// }
// .money-header::after {
//   content: '';
//   position: absolute;
//   bottom: -40px; left: -40px;
//   width: 150px; height: 150px;
//   border-radius: 50%;
//   background: rgba(16,185,129,0.1);
// }

// .money-header-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; position: relative; z-index: 1; }
// .money-label { font-size: 12px; opacity: 0.7; margin-bottom: 4px; letter-spacing: 0.5px; }
// .money-balance { font-size: 36px; font-weight: 700; letter-spacing: -1px; }

// .money-add-btn {
//   width: 42px; height: 42px;
//   border-radius: 50%;
//   background: rgba(255,255,255,0.15);
//   backdrop-filter: blur(10px);
//   border: 1px solid rgba(255,255,255,0.2);
//   color: white;
//   display: flex; align-items: center; justify-content: center;
//   cursor: pointer;
//   transition: transform 0.2s, background 0.2s;
// }
// .money-add-btn:active { transform: scale(0.92); background: rgba(255,255,255,0.25); }

// .money-pills { display: flex; gap: 12px; position: relative; z-index: 1; margin-bottom: 16px; }
// .money-pill {
//   display: flex; align-items: center; gap: 6px;
//   padding: 8px 14px;
//   border-radius: 100px;
//   font-size: 13px; font-weight: 600;
//   backdrop-filter: blur(10px);
// }
// .money-pill--income { background: rgba(16,185,129,0.2); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.3); }
// .money-pill--expense { background: rgba(239,68,68,0.2); color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }
// .money-pill-label { opacity: 0.8; font-weight: 400; }

// .money-progress-wrap { position: relative; z-index: 1; }
// .money-progress-track { height: 4px; background: rgba(255,255,255,0.15); border-radius: 999px; overflow: hidden; }
// .money-progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #6ee7b7, #ef4444); transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }
// .money-progress-pct { font-size: 11px; opacity: 0.6; margin-top: 6px; display: block; }

// .money-tabs { display: flex; padding: 12px 16px 0; gap: 4px; background: rgb(var(--bg)); border-bottom: 1px solid rgb(var(--border)); }
// .money-tab { padding: 8px 16px; border-radius: 8px 8px 0 0; font-size: 13px; font-weight: 500; color: rgb(var(--muted)); cursor: pointer; border: none; background: transparent; transition: all 0.2s; }
// .money-tab--active { color: rgb(var(--brand)); background: rgb(var(--card)); border-bottom: 2px solid rgb(var(--brand)); }

// .money-content { flex: 1; padding: 16px; background: rgb(var(--bg)); }

// .section-title { font-size: 12px; font-weight: 600; color: rgb(var(--muted)); letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px; }

// .category-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
// .category-row { display: flex; align-items: center; gap: 12px; }
// .category-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
// .category-info { flex: 1; }
// .category-top { display: flex; justify-content: space-between; margin-bottom: 5px; }
// .category-name { font-size: 13px; color: rgb(var(--fg)); text-transform: capitalize; }
// .category-amt { font-size: 13px; font-weight: 600; color: rgb(var(--fg)); }
// .category-bar-track { height: 3px; background: rgb(var(--border)); border-radius: 999px; overflow: hidden; }
// .category-bar-fill { height: 100%; border-radius: 999px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }

// .loan-summary-card {
//   display: flex; align-items: center; gap: 16px;
//   background: rgb(var(--card));
//   border: 1px solid rgb(var(--border));
//   border-radius: 16px; padding: 16px;
//   cursor: pointer; margin-top: 8px;
//   transition: transform 0.15s;
// }
// .loan-summary-card:active { transform: scale(0.98); }
// .loan-summary-row { flex: 1; }
// .loan-summary-label { font-size: 11px; color: rgb(var(--muted)); display: block; margin-bottom: 2px; }
// .loan-summary-divider { width: 1px; height: 32px; background: rgb(var(--border)); }
// .loan-summary-arrow { color: rgb(var(--muted)); }

// .txn-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
// .add-small-btn {
//   display: flex; align-items: center; gap: 4px;
//   font-size: 12px; font-weight: 500;
//   color: rgb(var(--brand));
//   background: rgb(var(--brand) / 0.1);
//   border: none; border-radius: 8px; padding: 6px 10px; cursor: pointer;
// }

// .txn-list { display: flex; flex-direction: column; gap: 8px; }
// .txn-row, .loan-row {
//   display: flex; align-items: center; gap: 12px;
//   background: rgb(var(--card));
//   border: 1px solid rgb(var(--border));
//   border-radius: 14px; padding: 12px;
//   transition: transform 0.15s;
// }
// .txn-row:active, .loan-row:active { transform: scale(0.98); }

// .txn-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
// .txn-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
// .txn-cat { font-size: 14px; font-weight: 500; color: rgb(var(--fg)); text-transform: capitalize; }
// .txn-date { font-size: 11px; color: rgb(var(--muted)); }
// .txn-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
// .txn-amt { font-size: 14px; font-weight: 700; }
// .txn-amt--income { color: #10b981; }
// .txn-amt--expense { color: #ef4444; }
// .txn-delete {
//   width: 22px; height: 22px; border-radius: 6px;
//   background: rgba(239,68,68,0.1); color: #ef4444;
//   border: none; display: flex; align-items: center; justify-content: center; cursor: pointer;
// }

// .loan-dir-badge { font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 8px; flex-shrink: 0; }
// .loan-dir--given { background: rgba(16,185,129,0.15); color: #10b981; }
// .loan-dir--taken { background: rgba(239,68,68,0.15); color: #ef4444; }
// .loan-given { color: #10b981; font-weight: 700; font-size: 14px; }
// .loan-taken { color: #ef4444; font-weight: 700; font-size: 14px; }
// .loan-actions { display: flex; gap: 4px; }
// .loan-settle {
//   width: 22px; height: 22px; border-radius: 6px;
//   background: rgba(16,185,129,0.15); color: #10b981;
//   border: none; display: flex; align-items: center; justify-content: center; cursor: pointer;
// }

// .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 48px 0; color: rgb(var(--muted)); }
// .empty-state p { font-size: 14px; }

// .fade-in { animation: fadeIn 0.25s ease-out; }
// .slide-up { animation: slideUp 0.3s ease-out both; }

// @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
// @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
// `

// const modalStyles = `
// .modal-backdrop {
//   position: fixed; inset: 0; z-index: 200;
//   background: rgba(0,0,0,0.6);
//   backdrop-filter: blur(6px);
//   display: flex; align-items: flex-end; justify-content: center;
//   animation: fadeIn 0.2s ease-out;
// }
// .modal-sheet {
//   width: 100%; max-width: 480px;
//   background: rgb(var(--bg));
//   border-radius: 24px 24px 0 0;
//   padding: 12px 20px 40px;
//   animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
//   max-height: 90vh; overflow-y: auto;
// }
// .modal-handle { width: 40px; height: 4px; background: rgb(var(--border)); border-radius: 999px; margin: 0 auto 16px; }
// .modal-title { font-size: 18px; font-weight: 700; color: rgb(var(--fg)); margin-bottom: 20px; }

// .type-toggle { display: flex; gap: 8px; margin-bottom: 16px; }
// .type-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border-radius: 12px; border: 1.5px solid rgb(var(--border)); background: rgb(var(--card)); color: rgb(var(--muted)); font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
// .type-btn--active-exp { background: rgba(239,68,68,0.15); border-color: #ef4444; color: #ef4444; }
// .type-btn--active-inc { background: rgba(16,185,129,0.15); border-color: #10b981; color: #10b981; }

// .amount-input-wrap { display: flex; align-items: center; gap: 8px; background: rgb(var(--card)); border: 1.5px solid rgb(var(--border)); border-radius: 16px; padding: 12px 16px; margin-bottom: 16px; }
// .amount-symbol { font-size: 24px; font-weight: 700; color: rgb(var(--muted)); }
// .amount-input { flex: 1; font-size: 28px; font-weight: 700; background: transparent; border: none; outline: none; color: rgb(var(--fg)); }

// .cat-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
// .cat-chip { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 999px; border: 1.5px solid rgb(var(--border)); background: rgb(var(--card)); color: rgb(var(--fg)); font-size: 12px; cursor: pointer; transition: all 0.2s; text-transform: capitalize; }
// .cat-chip--active { font-weight: 600; }

// .modal-input { display: block; width: 100%; background: rgb(var(--card)); border: 1.5px solid rgb(var(--border)); border-radius: 12px; padding: 12px 14px; color: rgb(var(--fg)); font-size: 14px; outline: none; margin-bottom: 12px; transition: border-color 0.2s; }
// .modal-input:focus { border-color: rgb(var(--brand)); }

// .modal-submit { width: 100%; padding: 14px; border-radius: 14px; background: rgb(var(--brand)); color: white; font-size: 16px; font-weight: 600; border: none; cursor: pointer; margin-top: 4px; transition: transform 0.15s, opacity 0.15s; }
// .modal-submit:active { transform: scale(0.97); opacity: 0.9; }
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// @keyframes slideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
// `


'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Plus, ArrowUpRight, ArrowDownRight, ChevronRight,
  X, Check, Clock, Pencil, History, PlusCircle,
  MinusCircle, Archive, RefreshCw, TrendingUp, Wallet,
  Sparkles, AlertCircle
} from 'lucide-react'

// ====================== TYPES ======================
type TransactionType = 'income' | 'expense'
type ExpenseCategory = 'food' | 'transport' | 'utilities' | 'health' | 'education' | 'entertainment' | 'shopping' | 'rent' | 'other'
type IncomeCategory = 'salary' | 'freelance' | 'other-income'

interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: ExpenseCategory | IncomeCategory
  note?: string
  date: string
  isRecurring?: boolean
}

interface LoanEntry {
  id: string
  date: string
  amount: number
  type: 'added' | 'repaid'
  note?: string
  balanceAfter: number
}

interface Loan {
  id: string
  personName: string
  direction: 'given' | 'taken'
  initialAmount: number
  currentBalance: number
  entries: LoanEntry[]
  date: string
  dueDate?: string
  settled: boolean
  settledDate?: string
  note?: string
}

// ====================== HELPERS ======================
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const todayISO = () => new Date().toISOString().split('T')[0]
const monthISO = () => new Date().toISOString().slice(0, 7)

const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '৳০'
  return `৳${amount.toLocaleString('en-BD')}`
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'food', 'transport', 'utilities', 'health', 'education', 'entertainment', 'shopping', 'rent', 'other'
]

const CATEGORY_META: Record<string, { icon: string; color: string; label: string }> = {
  food:           { icon: '🍛', color: '#f97316', label: 'খাবার' },
  transport:      { icon: '🚌', color: '#3b82f6', label: 'যানবাহন' },
  utilities:      { icon: '💡', color: '#eab308', label: 'বিল' },
  health:         { icon: '❤️', color: '#ef4444', label: 'স্বাস্থ্য' },
  education:      { icon: '📚', color: '#8b5cf6', label: 'শিক্ষা' },
  entertainment:  { icon: '🎬', color: '#ec4899', label: 'বিনোদন' },
  shopping:       { icon: '🛍️', color: '#06b6d4', label: 'কেনাকাটা' },
  rent:           { icon: '🏠', color: '#10b981', label: 'ভাড়া' },
  salary:         { icon: '💰', color: '#22c55e', label: 'বেতন' },
  freelance:      { icon: '💻', color: '#6366f1', label: 'ফ্রিল্যান্স' },
  'other-income': { icon: '📈', color: '#14b8a6', label: 'অন্যান্য আয়' },
  other:          { icon: '📦', color: '#94a3b8', label: 'অন্যান্য' },
}

type Tab = 'overview' | 'transactions' | 'loans'

// ====================== LOCAL STORE ======================
function useMoneyStore() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const storedTx = localStorage.getItem('money_transactions')
    const storedLoans = localStorage.getItem('money_loans')
    let parsedLoans: Loan[] = []
    if (storedLoans) {
      const rawLoans = JSON.parse(storedLoans)
      parsedLoans = rawLoans.map((loan: any) => {
        if (loan.currentBalance !== undefined && loan.entries) return loan as Loan
        const oldAmount = loan.amount || 0
        return {
          ...loan, initialAmount: oldAmount,
          currentBalance: loan.settled ? 0 : oldAmount,
          entries: [{ id: generateId(), date: loan.date || todayISO(), amount: oldAmount, type: 'added', balanceAfter: loan.settled ? 0 : oldAmount, note: 'প্রাথমিক ধার' }]
        } as Loan
      })
    }
    if (storedTx) setTransactions(JSON.parse(storedTx))
    if (parsedLoans.length) setLoans(parsedLoans)
    setIsHydrated(true)
  }, [])

  useEffect(() => { if (isHydrated) localStorage.setItem('money_transactions', JSON.stringify(transactions)) }, [transactions, isHydrated])
  useEffect(() => { if (isHydrated) localStorage.setItem('money_loans', JSON.stringify(loans)) }, [loans, isHydrated])

  const addTransaction = (txn: Omit<Transaction, 'id'>) => setTransactions(prev => [{ ...txn, id: generateId() }, ...prev])
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id))

  const addLoan = (loan: Omit<Loan, 'id' | 'entries' | 'currentBalance'> & { initialAmount: number }) => {
    setLoans(prev => [{
      ...loan, id: generateId(), currentBalance: loan.initialAmount, settled: false,
      entries: [{ id: generateId(), date: loan.date, amount: loan.initialAmount, type: 'added', balanceAfter: loan.initialAmount, note: 'প্রাথমিক ধার' }]
    }, ...prev])
  }

  const addLoanEntry = (loanId: string, amountChange: number, note: string, date: string) => {
    setLoans(prev => prev.map(loan => {
      if (loan.id !== loanId || loan.settled) return loan
      const newBalance = loan.currentBalance + amountChange
      if (newBalance < 0) return loan
      const newEntry: LoanEntry = { id: generateId(), date, amount: Math.abs(amountChange), type: amountChange < 0 ? 'repaid' : 'added', note, balanceAfter: newBalance }
      const updated = { ...loan, currentBalance: newBalance, entries: [...loan.entries, newEntry] }
      if (newBalance === 0) { updated.settled = true; (updated as any).settledDate = date }
      return updated
    }))
  }

  const updateLoanDetails = (loanId: string, updates: Partial<Pick<Loan, 'personName' | 'dueDate' | 'note'>>) =>
    setLoans(prev => prev.map(l => l.id === loanId ? { ...l, ...updates } : l))

  const deleteLoan = (id: string) => setLoans(prev => prev.filter(l => l.id !== id))
  const reactivateLoan = (id: string) => setLoans(prev => prev.map(l => l.id === id ? { ...l, settled: false, settledDate: undefined } : l))

  const getMonthSummary = (month: string) => {
    const t = transactions.filter(t => t.date.startsWith(month))
    const income = t.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = t.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { income, expense, balance: income - expense }
  }

  return { transactions, loans, addTransaction, deleteTransaction, addLoan, addLoanEntry, updateLoanDetails, deleteLoan, reactivateLoan, getMonthSummary, isHydrated }
}

// ====================== MAIN PAGE ======================
export default function MoneyPage() {
  const store = useMoneyStore()
  const { transactions, loans, addTransaction, deleteTransaction, addLoan, addLoanEntry, updateLoanDetails, deleteLoan, reactivateLoan, getMonthSummary, isHydrated } = store
  const [tab, setTab] = useState<Tab>('overview')
  const [showAddTxn, setShowAddTxn] = useState(false)
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState<{ loan: Loan; type: 'add' | 'repay' } | null>(null)
  const [showEditModal, setShowEditModal] = useState<Loan | null>(null)

  const currentMonth = monthISO()
  const summary = getMonthSummary(currentMonth)
  const spendPct = summary.income > 0 ? Math.min(100, (summary.expense / summary.income) * 100) : 0

  const monthTxns = useMemo(() =>
    transactions.filter(t => t.date.startsWith(currentMonth)).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, currentMonth])

  const activeLoans = loans.filter(l => !l.settled)
  const completedLoans = loans.filter(l => l.settled)
  const totalLoanGiven = activeLoans.filter(l => l.direction === 'given').reduce((s, l) => s + (l.currentBalance || 0), 0)
  const totalLoanTaken = activeLoans.filter(l => l.direction === 'taken').reduce((s, l) => s + (l.currentBalance || 0), 0)

  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    monthTxns.filter(t => t.type === 'expense').forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [monthTxns])

  if (!isHydrated) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#080a0e', color: '#c9a84c', fontFamily: 'system-ui', gap: 8 }}>
      <Sparkles size={16} /> লোড হচ্ছে...
    </div>
  )

  return (
    <div className="mp-root">
      {/* ── HERO HEADER ─────────────────────────────────────── */}
      <div className="mp-hero">
        <div className="mp-hero-bg" />
        <div className="mp-hero-orb mp-hero-orb1" />
        <div className="mp-hero-orb mp-hero-orb2" />

        <div className="mp-hero-inner">
          <div className="mp-hero-top">
            <div>
              <p className="mp-hero-eyebrow">
                <Sparkles size={10} style={{ display: 'inline', marginRight: 5 }} />
                {new Date().toLocaleString('bn-BD', { month: 'long', year: 'numeric' })}
              </p>
              <div className="mp-hero-balance-wrap">
                <span className="mp-hero-currency">৳</span>
                <span className={`mp-hero-balance ${summary.balance < 0 ? 'mp-balance-neg' : ''}`}>
                  {Math.abs(summary.balance).toLocaleString('en-BD')}
                </span>
              </div>
              <p className="mp-hero-sublabel">{summary.balance < 0 ? 'ঘাটতি' : 'নেট ব্যালেন্স'}</p>
            </div>
            <button className="mp-fab" onClick={() => setShowAddTxn(true)} aria-label="লেনদেন যোগ করুন">
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </div>

          {/* Stat pills */}
          <div className="mp-stat-row">
            <div className="mp-stat mp-stat--income">
              <div className="mp-stat-icon"><ArrowUpRight size={13} /></div>
              <div>
                <p className="mp-stat-label">আয়</p>
                <p className="mp-stat-val">{formatCurrency(summary.income)}</p>
              </div>
            </div>
            <div className="mp-stat-sep" />
            <div className="mp-stat mp-stat--expense">
              <div className="mp-stat-icon"><ArrowDownRight size={13} /></div>
              <div>
                <p className="mp-stat-label">খরচ</p>
                <p className="mp-stat-val">{formatCurrency(summary.expense)}</p>
              </div>
            </div>
          </div>

          {/* Spend progress */}
          {summary.income > 0 && (
            <div className="mp-progress-wrap">
              <div className="mp-progress-track">
                <div className="mp-progress-fill" style={{ width: `${spendPct}%` }} />
                <div className="mp-progress-glow" style={{ left: `${spendPct}%` }} />
              </div>
              <div className="mp-progress-labels">
                <span>{Math.round(spendPct)}% খরচ হয়েছে</span>
                <span className={spendPct > 90 ? 'mp-warn' : ''}>{spendPct > 90 ? '⚠ সীমার কাছাকাছি' : `${formatCurrency(summary.income - summary.expense)} বাকি`}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TAB BAR ─────────────────────────────────────────── */}
      <div className="mp-tabbar">
        {(['overview', 'transactions', 'loans'] as Tab[]).map(t => (
          <button key={t} className={`mp-tab ${tab === t ? 'mp-tab--on' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? 'সারাংশ' : t === 'transactions' ? 'লেনদেন' : `ধার${activeLoans.length > 0 ? ` (${activeLoans.length})` : ''}`}
            {tab === t && <span className="mp-tab-indicator" />}
          </button>
        ))}
      </div>

      {/* ── CONTENT ─────────────────────────────────────────── */}
      <div className="mp-body">

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="mp-fade">
            {spendingByCategory.length === 0 ? (
              <EmptyPlaceholder icon={<Wallet size={36} strokeWidth={1} />} text="এই মাসে কোনো খরচ নেই" sub="লেনদেন যোগ করতে উপরের + বাটন চাপুন" />
            ) : (
              <div className="mp-section">
                <p className="mp-section-title">ক্যাটাগরি ব্রেকডাউন</p>
                <div className="mp-cat-list">
                  {spendingByCategory.map(([cat, amt], i) => {
                    const m = CATEGORY_META[cat] || CATEGORY_META.other
                    const pct = summary.expense > 0 ? (amt / summary.expense) * 100 : 0
                    return (
                      <div key={cat} className="mp-cat-row" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="mp-cat-icon" style={{ background: m.color + '18', border: `1px solid ${m.color}30` }}>
                          {m.icon}
                        </div>
                        <div className="mp-cat-info">
                          <div className="mp-cat-head">
                            <span className="mp-cat-name">{m.label}</span>
                            <span className="mp-cat-amt">{formatCurrency(amt)}</span>
                          </div>
                          <div className="mp-cat-track">
                            <div className="mp-cat-bar" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${m.color}cc, ${m.color})` }} />
                          </div>
                          <span className="mp-cat-pct">{Math.round(pct)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Loan summary */}
            {(activeLoans.length > 0 || completedLoans.length > 0) && (
              <div className="mp-loan-summary" onClick={() => setTab('loans')}>
                <div className="mp-loan-summary-inner">
                  <div className="mp-loan-col">
                    <span className="mp-loan-col-label">দিয়েছি (বাকি)</span>
                    <span className="mp-loan-col-val mp-given">{formatCurrency(totalLoanGiven)}</span>
                  </div>
                  <div className="mp-loan-summary-div" />
                  <div className="mp-loan-col">
                    <span className="mp-loan-col-label">নিয়েছি (বাকি)</span>
                    <span className="mp-loan-col-val mp-taken">{formatCurrency(totalLoanTaken)}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="mp-loan-arrow" />
              </div>
            )}
          </div>
        )}

        {/* TRANSACTIONS */}
        {tab === 'transactions' && (
          <div className="mp-fade">
            <div className="mp-list-header">
              <p className="mp-section-title">এই মাসের লেনদেন</p>
              <button className="mp-add-chip" onClick={() => setShowAddTxn(true)}>
                <Plus size={12} /> যোগ করুন
              </button>
            </div>
            {monthTxns.length === 0 ? (
              <EmptyPlaceholder icon={<TrendingUp size={36} strokeWidth={1} />} text="কোনো লেনদেন নেই" sub="প্রথম লেনদেন যোগ করুন" />
            ) : (
              <div className="mp-txn-list">
                {monthTxns.map((t, i) => {
                  const m = CATEGORY_META[t.category] || CATEGORY_META.other
                  return (
                    <div key={t.id} className="mp-txn-card" style={{ animationDelay: `${i * 35}ms` }}>
                      <div className="mp-txn-icon" style={{ background: m.color + '15', border: `1px solid ${m.color}25` }}>
                        {m.icon}
                      </div>
                      <div className="mp-txn-info">
                        <span className="mp-txn-title">{t.note || m.label}</span>
                        <span className="mp-txn-meta">{t.date} · {m.label}</span>
                      </div>
                      <div className="mp-txn-right">
                        <span className={`mp-txn-amt ${t.type === 'income' ? 'mp-inc' : 'mp-exp'}`}>
                          {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                        </span>
                        <button className="mp-del-btn" onClick={() => deleteTransaction(t.id)} aria-label="মুছুন"><X size={11} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* LOANS */}
        {tab === 'loans' && (
          <div className="mp-fade">
            <div className="mp-list-header">
              <p className="mp-section-title">চলমান ধার</p>
              <button className="mp-add-chip" onClick={() => setShowLoanModal(true)}>
                <Plus size={12} /> নতুন ধার
              </button>
            </div>
            {activeLoans.length === 0 ? (
              <EmptyPlaceholder icon={<Clock size={36} strokeWidth={1} />} text="কোনো চলমান ধার নেই" sub="নতুন ধার যোগ করুন" />
            ) : (
              <div className="mp-txn-list">
                {activeLoans.map((l, i) => (
                  <LoanCard key={l.id} loan={l} index={i}
                    onShowHistory={() => { setSelectedLoan(l); setShowHistoryModal(true) }}
                    onAddPayment={() => setShowPaymentModal({ loan: l, type: 'repay' })}
                    onAddExtra={() => setShowPaymentModal({ loan: l, type: 'add' })}
                    onEdit={() => setShowEditModal(l)}
                    onDelete={() => deleteLoan(l.id)}
                  />
                ))}
              </div>
            )}

            {completedLoans.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div className="mp-list-header">
                  <p className="mp-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Archive size={12} /> সমাপ্ত ধার
                  </p>
                </div>
                <div className="mp-txn-list mp-txn-list--dim">
                  {completedLoans.map((l, i) => (
                    <LoanCard key={l.id} loan={l} index={i} isCompleted
                      onShowHistory={() => { setSelectedLoan(l); setShowHistoryModal(true) }}
                      onReactivate={() => reactivateLoan(l.id)}
                      onDelete={() => deleteLoan(l.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ──────────────────────────────────────────── */}
      {showAddTxn && <AddTransactionModal onClose={() => setShowAddTxn(false)} onAdd={addTransaction} />}
      {showLoanModal && <AddLoanModal onClose={() => setShowLoanModal(false)} onAdd={addLoan} />}
      {showHistoryModal && selectedLoan && <LoanHistoryModal loan={selectedLoan} onClose={() => setShowHistoryModal(false)} />}
      {showPaymentModal && (
        <LoanEntryModal loan={showPaymentModal.loan} type={showPaymentModal.type}
          onClose={() => setShowPaymentModal(null)}
          onSubmit={(amount, note, date) => { addLoanEntry(showPaymentModal.loan.id, showPaymentModal.type === 'repay' ? -amount : amount, note, date); setShowPaymentModal(null) }}
        />
      )}
      {showEditModal && (
        <EditLoanModal loan={showEditModal} onClose={() => setShowEditModal(null)}
          onSave={(updates) => { updateLoanDetails(showEditModal.id, updates); setShowEditModal(null) }}
        />
      )}

      <style>{CSS}</style>
    </div>
  )
}

// ====================== LOAN CARD ======================
function LoanCard({ loan, index, onShowHistory, onAddPayment, onAddExtra, onEdit, onDelete, onReactivate, isCompleted = false }:
  { loan: Loan; index: number; onShowHistory: () => void; onAddPayment?: () => void; onAddExtra?: () => void; onEdit?: () => void; onDelete: () => void; onReactivate?: () => void; isCompleted?: boolean }) {
  const bal = loan.currentBalance ?? loan.initialAmount ?? 0
  const init = loan.initialAmount ?? bal
  const repaidPct = init > 0 ? Math.min(100, ((init - bal) / init) * 100) : 0
  const isOverdue = !isCompleted && loan.dueDate && loan.dueDate < todayISO()

  return (
    <div className={`mp-loan-card ${isCompleted ? 'mp-loan-card--done' : ''}`} style={{ animationDelay: `${index * 40}ms` }}>
      <div className="mp-loan-top">
        <div className="mp-loan-left">
          <div className={`mp-loan-badge ${loan.direction === 'given' ? 'mp-badge-given' : 'mp-badge-taken'}`}>
            {loan.direction === 'given' ? '↑ দিয়েছি' : '↓ নিয়েছি'}
          </div>
          <div>
            <p className="mp-loan-name">{loan.personName}</p>
            {loan.dueDate && (
              <p className={`mp-loan-due ${isOverdue ? 'mp-loan-due--over' : ''}`}>
                {isOverdue && <AlertCircle size={10} style={{ display: 'inline', marginRight: 3 }} />}
                {loan.dueDate}
              </p>
            )}
            {loan.note && <p className="mp-loan-note">{loan.note}</p>}
          </div>
        </div>
        <div className="mp-loan-right">
          <span className={`mp-loan-bal ${loan.direction === 'given' ? 'mp-given' : 'mp-taken'}`}>{formatCurrency(bal)}</span>
          <span className="mp-loan-init">মূল: {formatCurrency(init)}</span>
        </div>
      </div>

      {/* Repaid progress */}
      {!isCompleted && init > 0 && (
        <div className="mp-loan-prog">
          <div className="mp-loan-prog-track">
            <div className="mp-loan-prog-fill" style={{ width: `${repaidPct}%`, background: loan.direction === 'given' ? '#10b981' : '#ef4444' }} />
          </div>
          <span className="mp-loan-prog-pct">{Math.round(repaidPct)}% শোধ</span>
        </div>
      )}

      {/* Actions */}
      <div className="mp-loan-actions">
        <button className="mp-action-btn mp-action-hist" onClick={onShowHistory}><History size={12} /><span>ইতিহাস</span></button>
        {!isCompleted && (<>
          <button className="mp-action-btn mp-action-rep" onClick={onAddPayment}><MinusCircle size={12} /><span>শোধ</span></button>
          <button className="mp-action-btn mp-action-add" onClick={onAddExtra}><PlusCircle size={12} /><span>আরো</span></button>
          <button className="mp-action-btn mp-action-edit" onClick={onEdit}><Pencil size={12} /></button>
        </>)}
        {isCompleted && <button className="mp-action-btn mp-action-react" onClick={onReactivate}><RefreshCw size={12} /><span>পুনরায়</span></button>}
        <button className="mp-action-btn mp-action-del" onClick={onDelete}><X size={12} /></button>
      </div>
    </div>
  )
}

// ====================== EMPTY STATE ======================
function EmptyPlaceholder({ icon, text, sub }: { icon: React.ReactNode; text: string; sub?: string }) {
  return (
    <div className="mp-empty">
      <div className="mp-empty-icon">{icon}</div>
      <p className="mp-empty-text">{text}</p>
      {sub && <p className="mp-empty-sub">{sub}</p>}
    </div>
  )
}

// ====================== MODALS ======================
function ModalShell({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="mo-backdrop" onClick={onClose}>
      <div className="mo-sheet" onClick={e => e.stopPropagation()}>
        <div className="mo-notch" />
        <div className="mo-head">
          <h2 className="mo-title">{title}</h2>
          <button className="mo-close" onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function AddTransactionModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Omit<Transaction, 'id'>) => void }) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string>('food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO())
  const cats = type === 'income' ? ['salary', 'freelance', 'other-income'] : EXPENSE_CATEGORIES

  const handleSubmit = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return
    onAdd({ type, amount: Number(amount), category: category as ExpenseCategory, note, date, isRecurring: false })
    onClose()
  }

  return (
    <ModalShell onClose={onClose} title="নতুন লেনদেন">
      <div className="mo-type-row">
        <button className={`mo-type ${type === 'expense' ? 'mo-type--exp' : ''}`} onClick={() => { setType('expense'); setCategory('food') }}>
          <ArrowDownRight size={14} /> খরচ
        </button>
        <button className={`mo-type ${type === 'income' ? 'mo-type--inc' : ''}`} onClick={() => { setType('income'); setCategory('salary') }}>
          <ArrowUpRight size={14} /> আয়
        </button>
      </div>

      <div className={`mo-amount-box ${type === 'income' ? 'mo-amount-box--inc' : 'mo-amount-box--exp'}`}>
        <span className="mo-amount-sign">৳</span>
        <input className="mo-amount-inp" type="number" placeholder="০" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
      </div>

      <div className="mo-cats">
        {cats.map(c => {
          const m = CATEGORY_META[c] || CATEGORY_META.other
          return (
            <button key={c} className={`mo-cat ${category === c ? 'mo-cat--on' : ''}`}
              style={category === c ? { background: m.color + '25', borderColor: m.color, color: m.color } : {}}
              onClick={() => setCategory(c)}>
              {m.icon} {m.label}
            </button>
          )
        })}
      </div>

      <input className="mo-inp" placeholder="নোট (ঐচ্ছিক)" value={note} onChange={e => setNote(e.target.value)} />
      <input className="mo-inp" type="date" value={date} onChange={e => setDate(e.target.value)} />
      <button className={`mo-submit ${type === 'income' ? 'mo-submit--inc' : 'mo-submit--exp'}`} onClick={handleSubmit}>সংরক্ষণ করুন</button>
    </ModalShell>
  )
}

function AddLoanModal({ onClose, onAdd }: { onClose: () => void; onAdd: (l: any) => void }) {
  const [direction, setDirection] = useState<'given' | 'taken'>('given')
  const [personName, setPersonName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [note, setNote] = useState('')
  const handleSubmit = () => {
    if (!personName || !amount || isNaN(Number(amount))) return
    onAdd({ personName, direction, initialAmount: Number(amount), date: todayISO(), dueDate: dueDate || undefined, note: note || undefined })
    onClose()
  }
  return (
    <ModalShell onClose={onClose} title="নতুন ধার">
      <div className="mo-type-row">
        <button className={`mo-type ${direction === 'given' ? 'mo-type--inc' : ''}`} onClick={() => setDirection('given')}>↑ দিয়েছি</button>
        <button className={`mo-type ${direction === 'taken' ? 'mo-type--exp' : ''}`} onClick={() => setDirection('taken')}>↓ নিয়েছি</button>
      </div>
      <input className="mo-inp" placeholder="কার সাথে?" value={personName} onChange={e => setPersonName(e.target.value)} autoFocus />
      <div className="mo-amount-box mo-amount-box--neutral">
        <span className="mo-amount-sign">৳</span>
        <input className="mo-amount-inp" type="number" placeholder="০" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <input className="mo-inp" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
      <input className="mo-inp" placeholder="নোট (ঐচ্ছিক)" value={note} onChange={e => setNote(e.target.value)} />
      <button className="mo-submit mo-submit--neu" onClick={handleSubmit}>সংরক্ষণ করুন</button>
    </ModalShell>
  )
}

function LoanHistoryModal({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} title={`${loan.personName} — ইতিহাস`}>
      <div className="mo-history-stats">
        <div className="mo-hstat"><span>মূল ধার</span><strong>{formatCurrency(loan.initialAmount)}</strong></div>
        <div className="mo-hstat"><span>বর্তমান বাকি</span><strong className={loan.direction === 'given' ? 'mp-given' : 'mp-taken'}>{formatCurrency(loan.currentBalance)}</strong></div>
        <div className="mo-hstat"><span>স্থিতি</span><strong>{loan.settled ? <span className="mp-badge-done">সমাপ্ত ✓</span> : <span className="mp-badge-active">চলমান</span>}</strong></div>
      </div>
      <div className="mo-history-list">
        {(loan.entries || []).map(e => (
          <div key={e.id} className="mo-history-row">
            <div className="mo-hist-left">
              <span className={`mo-hist-type ${e.type === 'added' ? 'mo-hist-add' : 'mo-hist-rep'}`}>
                {e.type === 'added' ? '+' : '−'}{formatCurrency(e.amount)}
              </span>
              <span className="mo-hist-note">{e.note || (e.type === 'added' ? 'যোগ' : 'শোধ')}</span>
            </div>
            <div className="mo-hist-right">
              <span className="mo-hist-date">{e.date}</span>
              <span className="mo-hist-bal">বাকি {formatCurrency(e.balanceAfter)}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="mo-submit mo-submit--neu" onClick={onClose}>বন্ধ করুন</button>
    </ModalShell>
  )
}

function LoanEntryModal({ loan, type, onClose, onSubmit }: { loan: Loan; type: 'add' | 'repay'; onClose: () => void; onSubmit: (a: number, n: string, d: string) => void }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISO())
  const isRepay = type === 'repay'
  const handleSubmit = () => { if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return; onSubmit(Number(amount), note, date) }
  return (
    <ModalShell onClose={onClose} title={`${isRepay ? 'শোধ করুন' : 'আরো ধার'} — ${loan.personName}`}>
      <div className="mo-info-pill">বর্তমান বাকি: <strong>{formatCurrency(loan.currentBalance)}</strong></div>
      <div className={`mo-amount-box ${isRepay ? 'mo-amount-box--exp' : 'mo-amount-box--inc'}`}>
        <span className="mo-amount-sign">৳</span>
        <input className="mo-amount-inp" type="number" placeholder="০" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
      </div>
      {isRepay && <p className="mo-hint">সর্বোচ্চ শোধ: {formatCurrency(loan.currentBalance)}</p>}
      <input className="mo-inp" placeholder="নোট" value={note} onChange={e => setNote(e.target.value)} />
      <input className="mo-inp" type="date" value={date} onChange={e => setDate(e.target.value)} />
      <button className={`mo-submit ${isRepay ? 'mo-submit--exp' : 'mo-submit--inc'}`} onClick={handleSubmit}>{isRepay ? 'শোধ করুন' : 'যোগ করুন'}</button>
    </ModalShell>
  )
}

function EditLoanModal({ loan, onClose, onSave }: { loan: Loan; onClose: () => void; onSave: (u: Partial<Pick<Loan, 'personName' | 'dueDate' | 'note'>>) => void }) {
  const [personName, setPersonName] = useState(loan.personName)
  const [dueDate, setDueDate] = useState(loan.dueDate || '')
  const [note, setNote] = useState(loan.note || '')
  return (
    <ModalShell onClose={onClose} title="তথ্য সম্পাদনা">
      <input className="mo-inp" placeholder="নাম" value={personName} onChange={e => setPersonName(e.target.value)} />
      <input className="mo-inp" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
      <input className="mo-inp" placeholder="নোট" value={note} onChange={e => setNote(e.target.value)} />
      <button className="mo-submit mo-submit--neu" onClick={() => { onSave({ personName, dueDate: dueDate || undefined, note: note || undefined }); onClose() }}>সংরক্ষণ করুন</button>
    </ModalShell>
  )
}

// ====================== CSS ======================
const CSS = `
/* ─── Root ─────────────────────────────────────────────── */
.mp-root {
  min-height: 100%;
  background: #080c14;
  color: #e8eaf0;
  font-family: 'Siyam Rupali', 'Noto Sans Bengali', system-ui, sans-serif;
  display: flex; flex-direction: column;
}

/* ─── Hero ─────────────────────────────────────────────── */
.mp-hero {
  position: relative; overflow: hidden;
  padding: 0 0 0;
  background: #080c14;
}
.mp-hero-bg {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, #1a2340 0%, #080c14 70%);
}
.mp-hero-orb {
  position: absolute; border-radius: 50%;
  filter: blur(50px); pointer-events: none;
}
.mp-hero-orb1 { width: 220px; height: 220px; top: -80px; right: -60px; background: radial-gradient(circle, #c9a84c18, transparent 70%); }
.mp-hero-orb2 { width: 180px; height: 180px; bottom: -60px; left: -40px; background: radial-gradient(circle, #6366f118, transparent 70%); }

.mp-hero-inner { position: relative; z-index: 1; padding: 28px 20px 24px; }

.mp-hero-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; }

.mp-hero-eyebrow {
  font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;
  color: #c9a84c; opacity: 0.85; margin-bottom: 8px;
}

.mp-hero-balance-wrap { display: flex; align-items: baseline; gap: 4px; }
.mp-hero-currency { font-size: 22px; font-weight: 300; color: #8899aa; margin-top: 4px; }
.mp-hero-balance { font-size: 42px; font-weight: 800; color: #f0f4ff; letter-spacing: -2px; line-height: 1; }
.mp-balance-neg { color: #ff6b7a; }

.mp-hero-sublabel { font-size: 12px; color: #556677; margin-top: 4px; }

.mp-fab {
  width: 46px; height: 46px; border-radius: 50%;
  background: linear-gradient(135deg, #c9a84c, #e8c56a);
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #080c14;
  box-shadow: 0 4px 20px #c9a84c40;
  transition: transform 0.2s, box-shadow 0.2s;
  flex-shrink: 0;
}
.mp-fab:active { transform: scale(0.92); box-shadow: 0 2px 10px #c9a84c30; }

/* stat pills */
.mp-stat-row {
  display: flex; align-items: center;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; padding: 14px 16px;
  gap: 0; margin-bottom: 16px;
  backdrop-filter: blur(10px);
}
.mp-stat { display: flex; align-items: center; gap: 10px; flex: 1; }
.mp-stat-sep { width: 1px; height: 32px; background: rgba(255,255,255,0.1); margin: 0 16px; }
.mp-stat-icon {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
}
.mp-stat--income .mp-stat-icon { background: #10b98120; color: #10b981; }
.mp-stat--expense .mp-stat-icon { background: #ef444420; color: #ef4444; }
.mp-stat-label { font-size: 10px; color: #667788; letter-spacing: 0.5px; text-transform: uppercase; }
.mp-stat-val { font-size: 15px; font-weight: 700; color: #e0e8f0; }

/* progress */
.mp-progress-wrap { }
.mp-progress-track { height: 5px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: visible; position: relative; }
.mp-progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #10b981, #c9a84c, #ef4444); transition: width 1s cubic-bezier(0.34,1.3,0.64,1); }
.mp-progress-glow { position: absolute; top: 50%; transform: translate(-50%, -50%); width: 10px; height: 10px; border-radius: 50%; background: #c9a84c; box-shadow: 0 0 8px #c9a84c; transition: left 1s cubic-bezier(0.34,1.3,0.64,1); }
.mp-progress-labels { display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: #667788; }
.mp-warn { color: #f59e0b !important; }

/* ─── Tab bar ───────────────────────────────────────────── */
.mp-tabbar {
  display: flex; gap: 0;
  background: #0d1018;
  border-bottom: 1px solid #1a2030;
  padding: 0 16px;
  position: sticky; top: 0; z-index: 10;
}
.mp-tab {
  position: relative; padding: 14px 18px;
  font-size: 13px; font-weight: 500; color: #445566;
  background: transparent; border: none; cursor: pointer;
  transition: color 0.2s;
  white-space: nowrap;
}
.mp-tab--on { color: #c9a84c; }
.mp-tab-indicator {
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 70%; height: 2px; border-radius: 999px;
  background: linear-gradient(90deg, #c9a84c, #e8c56a);
  animation: indicatorSlide 0.25s ease-out;
}
@keyframes indicatorSlide { from { width: 0; opacity: 0; } to { width: 70%; opacity: 1; } }

/* ─── Body ──────────────────────────────────────────────── */
.mp-body { flex: 1; padding: 16px; overflow-y: auto; }

.mp-section { margin-bottom: 16px; }
.mp-section-title {
  font-size: 11px; font-weight: 600; letter-spacing: 1.2px;
  text-transform: uppercase; color: #445566; margin-bottom: 14px;
}
.mp-list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }

/* ─── Category breakdown ────────────────────────────────── */
.mp-cat-list { display: flex; flex-direction: column; gap: 12px; }
.mp-cat-row {
  display: flex; align-items: center; gap: 12px;
  animation: mpSlide 0.4s ease-out both;
}
.mp-cat-icon {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 19px; flex-shrink: 0;
}
.mp-cat-info { flex: 1; }
.mp-cat-head { display: flex; justify-content: space-between; margin-bottom: 6px; }
.mp-cat-name { font-size: 13px; color: #c8d4e0; }
.mp-cat-amt { font-size: 13px; font-weight: 700; color: #e8eaf0; }
.mp-cat-track { height: 3px; background: #1a2030; border-radius: 999px; overflow: hidden; margin-bottom: 3px; }
.mp-cat-bar { height: 100%; border-radius: 999px; transition: width 0.8s cubic-bezier(0.34,1.1,0.64,1); }
.mp-cat-pct { font-size: 10px; color: #445566; }

/* ─── Loan summary card ─────────────────────────────────── */
.mp-loan-summary {
  display: flex; align-items: center; gap: 12px;
  background: linear-gradient(135deg, #0f1520, #141e2e);
  border: 1px solid #1e2d44;
  border-radius: 18px; padding: 16px 18px;
  cursor: pointer; margin-top: 20px;
  transition: transform 0.15s, border-color 0.2s;
}
.mp-loan-summary:active { transform: scale(0.98); }
.mp-loan-summary:hover { border-color: #2a3d55; }
.mp-loan-summary-inner { display: flex; flex: 1; gap: 0; }
.mp-loan-col { flex: 1; }
.mp-loan-col-label { font-size: 11px; color: #445566; display: block; margin-bottom: 4px; }
.mp-loan-col-val { font-size: 16px; font-weight: 700; }
.mp-loan-summary-div { width: 1px; background: #1e2d44; margin: 0 16px; }
.mp-loan-arrow { color: #445566; }

/* ─── Txn + Loan lists ──────────────────────────────────── */
.mp-txn-list { display: flex; flex-direction: column; gap: 8px; }
.mp-txn-list--dim { opacity: 0.6; }

.mp-txn-card {
  display: flex; align-items: center; gap: 12px;
  background: #0f1520; border: 1px solid #1a2535;
  border-radius: 16px; padding: 13px 14px;
  transition: transform 0.15s, border-color 0.2s;
  animation: mpSlide 0.35s ease-out both;
}
.mp-txn-card:active { transform: scale(0.98); border-color: #2a3d55; }
.mp-txn-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 19px; flex-shrink: 0; }
.mp-txn-info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.mp-txn-title { font-size: 14px; font-weight: 500; color: #c8d4e0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-txn-meta { font-size: 11px; color: #445566; }
.mp-txn-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.mp-txn-amt { font-size: 14px; font-weight: 800; letter-spacing: -0.3px; }
.mp-inc { color: #34d399; }
.mp-exp { color: #f87171; }
.mp-given { color: #34d399; }
.mp-taken { color: #f87171; }

.mp-del-btn {
  width: 22px; height: 22px; border-radius: 6px;
  background: #1e1018; color: #664444; border: 1px solid #2a1820;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.15s, color 0.15s;
}
.mp-del-btn:hover { background: #2a1020; color: #f87171; }

.mp-add-chip {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600;
  color: #c9a84c; background: #c9a84c18;
  border: 1px solid #c9a84c30; border-radius: 20px;
  padding: 6px 12px; cursor: pointer; transition: background 0.15s;
}
.mp-add-chip:hover { background: #c9a84c25; }

/* ─── Loan Card ─────────────────────────────────────────── */
.mp-loan-card {
  background: #0f1520; border: 1px solid #1a2535;
  border-radius: 18px; padding: 16px;
  animation: mpSlide 0.35s ease-out both;
  transition: border-color 0.2s;
}
.mp-loan-card--done { border-style: dashed; }
.mp-loan-card:hover { border-color: #2a3d55; }

.mp-loan-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.mp-loan-left { display: flex; align-items: flex-start; gap: 10px; }
.mp-loan-right { text-align: right; }

.mp-loan-badge {
  font-size: 10px; font-weight: 700; padding: 3px 8px;
  border-radius: 6px; white-space: nowrap; flex-shrink: 0; margin-top: 2px;
  letter-spacing: 0.3px;
}
.mp-badge-given { background: #10b98118; color: #34d399; border: 1px solid #10b98130; }
.mp-badge-taken { background: #ef444418; color: #f87171; border: 1px solid #ef444430; }
.mp-badge-done { background: #10b98120; color: #34d399; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.mp-badge-active { background: #f59e0b20; color: #fbbf24; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }

.mp-loan-name { font-size: 15px; font-weight: 600; color: #c8d4e0; }
.mp-loan-due { font-size: 11px; color: #556677; margin-top: 2px; }
.mp-loan-due--over { color: #f87171 !important; }
.mp-loan-note { font-size: 11px; color: #445566; margin-top: 2px; }
.mp-loan-bal { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; display: block; }
.mp-loan-init { font-size: 11px; color: #445566; display: block; margin-top: 2px; }

.mp-loan-prog { margin-bottom: 12px; }
.mp-loan-prog-track { height: 3px; background: #1a2030; border-radius: 999px; overflow: hidden; margin-bottom: 4px; }
.mp-loan-prog-fill { height: 100%; border-radius: 999px; transition: width 0.8s cubic-bezier(0.34,1.1,0.64,1); }
.mp-loan-prog-pct { font-size: 10px; color: #445566; }

.mp-loan-actions { display: flex; gap: 6px; }
.mp-action-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 10px; border-radius: 8px; border: none;
  font-size: 11px; font-weight: 500; cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;
}
.mp-action-btn:active { transform: scale(0.94); opacity: 0.8; }
.mp-action-hist { background: #1a2535; color: #667788; }
.mp-action-rep  { background: #1e1018; color: #f87171; }
.mp-action-add  { background: #0e1e18; color: #34d399; }
.mp-action-edit { background: #101828; color: #60a5fa; }
.mp-action-react{ background: #1e1808; color: #fbbf24; }
.mp-action-del  { background: #1e1018; color: #f87171; margin-left: auto; }

/* ─── Empty ─────────────────────────────────────────────── */
.mp-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 56px 0; color: #2a3d55;
}
.mp-empty-icon { opacity: 0.5; }
.mp-empty-text { font-size: 15px; color: #3a5066; font-weight: 500; }
.mp-empty-sub { font-size: 12px; color: #2a3d55; }

/* ─── Fade/slide animations ─────────────────────────────── */
.mp-fade { animation: mpFade 0.3s ease-out; }
@keyframes mpFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes mpSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* ─── Modal ─────────────────────────────────────────────── */
.mo-backdrop {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(4,7,12,0.85);
  backdrop-filter: blur(8px);
  display: flex; align-items: flex-end; justify-content: center;
  animation: mpFade 0.2s ease-out;
}
.mo-sheet {
  width: 100%; max-width: 480px;
  background: linear-gradient(180deg, #0f1520 0%, #0a1018 100%);
  border: 1px solid #1a2535;
  border-bottom: none;
  border-radius: 24px 24px 0 0;
  padding: 8px 20px 48px;
  max-height: 92vh; overflow-y: auto;
  animation: moSlide 0.35s cubic-bezier(0.32,1.5,0.6,1);
}
@keyframes moSlide { from { transform: translateY(80px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.mo-notch { width: 36px; height: 4px; background: #1e2d40; border-radius: 999px; margin: 10px auto 18px; }
.mo-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.mo-title { font-size: 18px; font-weight: 700; color: #dde8f4; }
.mo-close {
  width: 32px; height: 32px; border-radius: 10px;
  background: #1a2535; border: 1px solid #243040;
  color: #556677; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.15s;
}
.mo-close:hover { background: #243040; color: #c8d4e0; }

.mo-type-row { display: flex; gap: 8px; margin-bottom: 16px; }
.mo-type {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 11px; border-radius: 12px;
  border: 1.5px solid #1a2535; background: #0f1520;
  color: #445566; font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.mo-type--exp { background: #1e101820; border-color: #f87171; color: #f87171; }
.mo-type--inc { background: #0e1e1820; border-color: #34d399; color: #34d399; }

.mo-amount-box {
  display: flex; align-items: center; gap: 8px;
  border-radius: 16px; padding: 14px 18px; margin-bottom: 16px;
  border: 1.5px solid;
}
.mo-amount-box--exp { background: #1e101812; border-color: #f8717130; }
.mo-amount-box--inc { background: #0e1e1812; border-color: #34d39930; }
.mo-amount-box--neutral { background: #0f1828; border-color: #1e2d40; }

.mo-amount-sign { font-size: 22px; font-weight: 300; color: #445566; }
.mo-amount-inp {
  flex: 1; font-size: 30px; font-weight: 800;
  background: transparent; border: none; outline: none;
  color: #e8eaf0; letter-spacing: -1px;
}

.mo-cats { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 16px; }
.mo-cat {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 12px; border-radius: 999px;
  border: 1.5px solid #1a2535; background: #0f1520;
  color: #667788; font-size: 12px; font-weight: 500; cursor: pointer;
  transition: all 0.15s;
}
.mo-cat--on { font-weight: 700; }

.mo-inp {
  display: block; width: 100%;
  background: #0f1520; border: 1.5px solid #1a2535;
  border-radius: 12px; padding: 13px 15px;
  color: #c8d4e0; font-size: 14px; outline: none;
  margin-bottom: 10px; transition: border-color 0.2s;
  box-sizing: border-box;
}
.mo-inp:focus { border-color: #c9a84c60; }

.mo-submit {
  width: 100%; padding: 15px; border-radius: 14px;
  font-size: 15px; font-weight: 700; border: none; cursor: pointer;
  margin-top: 6px; transition: transform 0.15s, opacity 0.15s;
  letter-spacing: 0.3px;
}
.mo-submit:active { transform: scale(0.97); opacity: 0.88; }
.mo-submit--exp { background: linear-gradient(135deg, #c0392b, #e74c3c); color: white; }
.mo-submit--inc { background: linear-gradient(135deg, #0d9e6f, #10b981); color: white; }
.mo-submit--neu { background: linear-gradient(135deg, #c9a84c, #e8c56a); color: #080c14; }

.mo-info-pill { font-size: 13px; color: #667788; background: #0f1828; border: 1px solid #1a2535; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; }
.mo-hint { font-size: 11px; color: #f87171; margin-top: -6px; margin-bottom: 12px; }

.mo-history-stats {
  display: flex; justify-content: space-between;
  background: #0f1828; border: 1px solid #1a2535; border-radius: 14px;
  padding: 14px; margin-bottom: 16px; gap: 8px;
}
.mo-hstat { display: flex; flex-direction: column; gap: 4px; }
.mo-hstat span { font-size: 11px; color: #445566; }
.mo-hstat strong { font-size: 14px; color: #c8d4e0; }

.mo-history-list { max-height: 320px; overflow-y: auto; margin-bottom: 16px; display: flex; flex-direction: column; gap: 1px; }
.mo-history-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 11px 12px; border-radius: 10px; background: #0f1520;
  border: 1px solid #141e2e;
}
.mo-history-row:not(:last-child) { margin-bottom: 4px; }
.mo-hist-left { display: flex; flex-direction: column; gap: 3px; }
.mo-hist-right { text-align: right; display: flex; flex-direction: column; gap: 3px; }
.mo-hist-type { font-size: 14px; font-weight: 700; }
.mo-hist-add { color: #34d399; }
.mo-hist-rep { color: #f87171; }
.mo-hist-note { font-size: 11px; color: #445566; }
.mo-hist-date { font-size: 11px; color: #445566; }
.mo-hist-bal { font-size: 12px; color: #667788; font-weight: 500; }
`
// CSS variables (for reference, already inlined)
// CSS variables
