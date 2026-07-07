'use client'

import { useState, useCallback } from 'react'
import { BookOpen, ChevronDown, Gem, Scale, Calculator, Clock, FileText } from 'lucide-react'

const SECTIONS = [
  {
    id: 'zakat-obligation',
    icon: BookOpen,
    title: 'যাকাত ফরজ হওয়ার শর্তাবলী',
    titleEn: 'Conditions for Zakat Obligation',
    content: `যাকাত ফরজ হওয়ার জন্য নিম্নলিখিত শর্তগুলো পূরণ হতে হবে:

১. সম্পদ পূর্ণ এক বছর গচ্ছিত থাকা (Hawl)
২. সম্পদ নিসাব পরিমাণ হওয়া
৩. সম্পদ প্রয়োজনাতিরিক্ত হওয়া
৪. সম্পদ হালাল উপায়ে অর্জিত হওয়া`,
    contentEn: `Zakat becomes obligatory when:
1. Wealth has been in possession for one lunar year (Hawl)
2. Wealth reaches the Nisab threshold
3. Wealth is beyond basic needs
4. Wealth is acquired through halal means`,
  },
  {
    id: 'nisab-explanation',
    icon: Scale,
    title: 'নিসাব কী এবং কিভাবে নির্ধারণ করা হয়?',
    titleEn: 'What is Nisab & How is it Calculated?',
    content: `নিসাব হলো যাকাত ফরজ হওয়ার জন্য নির্ধারিত ন্যূনতম সম্পদের পরিমাণ।

ইসলামিক স্কলারদের ঐকমত্য অনুযায়ী:

✨ সোনার নিসাব:
• ৭.৫ ভরি (৮৭.৪৮ গ্রাম)
• বর্তমান বাজার মূল্য × ৮৭.৪৮ গ্রাম

✨ রূপার নিসাব:
• ৫২.৫ ভরি (৬১২.৩৬ গ্রাম)
• বর্তমান বাজার মূল্য × ৬১২.৩৬ গ্রাম

আপনি চাইলে সোনা বা রূপা - যেকোনো একটি নিসাব পদ্ধতি বেছে নিতে পারেন। রূপার নিসাব সাধারণত কম হওয়ায় এটি অধিক সংখ্যক মানুষের জন্য যাকাত ফরজ করে, যা আরও সতর্কতামূলক পন্থা।`,
    contentEn: `Nisab is the minimum amount of wealth that makes Zakat obligatory.

According to Islamic scholarly consensus:

✨ Gold Nisab:
• 7.5 Vori (87.48 grams)
• Current market price × 87.48 grams

✨ Silver Nisab:
• 52.5 Vori (612.36 grams)
• Current market price × 612.36 grams

You can choose either the Gold or Silver Nisab method. The Silver Nisab is lower, making Zakat obligatory for more people — a more cautious approach.`,
  },
  {
    id: 'zakat-calculation',
    icon: Calculator,
    title: 'যাকাত হিসাবের নিয়ম',
    titleEn: 'How Zakat is Calculated',
    content: `যাকাত হিসাব করা হয় নিম্নলিখিত নিয়মে:

মোট সম্পদ = নগদ অর্থ + ব্যাংক ব্যালেন্স + স্বর্ণের মূল্য + রূপার মূল্য + ব্যবসায়িক সম্পদ

নিট সম্পদ = মোট সম্পদ - দায়-দেনা

যদি নিট সম্পদ ≥ নিসাব পরিমাণ হয়, তাহলে:

যাকাত = নিট সম্পদ × ২.৫% (১/৪০ অংশ)`,
    contentEn: `Zakat is calculated as follows:

Total Assets = Cash + Bank Balance + Gold Value + Silver Value + Business Assets

Net Wealth = Total Assets - Liabilities

If Net Wealth ≥ Nisab threshold, then:

Zakat Due = Net Wealth × 2.5% (1/40th)`,
  },
  {
    id: 'gold-rules',
    icon: Gem,
    title: 'স্বর্ণ ও রূপার যাকাত নিয়ম',
    titleEn: 'Zakat Rules for Gold & Silver',
    content: `স্বর্ণ ও রূপার যাকাতের ক্ষেত্রে নিম্নলিখিত নিয়ম প্রযোজ্য:

• স্বর্ণের নিসাব: ৭.৫ ভরি (৮৭.৪৮ গ্রাম)
• ব্যবহার করা হোক বা না হোক - নিসাব পরিমাণ স্বর্ণ থাকলে যাকাত দিতে হবে
• অলঙ্কার, গহনা, বা বুলিয়ন - সব ধরনের স্বর্ণই যাকাতের অন্তর্ভুক্ত
• খাঁটি স্বর্ণ (২৪K) ও মিশ্র স্বর্ণের ক্ষেত্রে প্রকৃত স্বর্ণের পরিমাণ বিবেচনা করা হয়

ইমাম আবু হানিফা (রহ.) এর মতে, ব্যবহারের জন্য রাখা স্বর্ণালঙ্কারেও যাকাত ফরজ।`,
    contentEn: `Key rules for Gold & Silver Zakat:

• Gold Nisab: 7.5 Vori (87.48 grams)
• Zakat applies whether it's used or not
• All forms included: jewelry, ornaments, bullion
• For mixed gold, only the pure gold content is considered

According to Imam Abu Hanifah (RA), Zakat is obligatory on gold jewelry kept for use as well.`,
  },
  {
    id: 'timing',
    icon: Clock,
    title: 'যাকাত আদায়ের সময়',
    titleEn: 'When to Pay Zakat',
    content: `• যাকাত প্রত্যেক চন্দ্র বছরে একবার ফরজ
• সম্পদ পূর্ণ এক বছর গচ্ছিত থাকার পর যাকাত দিতে হবে
• আপনি আপনার যাকাতের বছর নির্ধারণ করে প্রতি বছর নির্দিষ্ট সময়ে যাকাত দিতে পারেন
• রমজান মাসে যাকাত দেওয়া অধিক সাওয়াবের কারণ হলেও যেকোনো সময় দেওয়া যায়`,
    contentEn: `• Zakat is obligatory once every lunar year
• Pay after wealth has been in your possession for one full year
• You can set a Zakat anniversary date
• Ramadan is a blessed time to pay, but any time is acceptable`,
  },
  {
    id: 'disclaimer',
    icon: FileText,
    title: 'গুরুত্বপূর্ণ সতর্কতা',
    titleEn: 'Important Notice',
    content: `এই ক্যালকুলেটরটি আপনার দেওয়া তথ্যের ভিত্তিতে একটি আনুমানিক যাকাতের পরিমাণ প্রদান করে। জটিল আর্থিক অবস্থার জন্য একজন যোগ্য ইসলামিক স্কলারের পরামর্শ নিন।

যাকাত একটি ইবাদত, তাই এটি নির্ভুলভাবে আদায় করা গুরুত্বপূর্ণ। আপনার স্থানীয় বাজার মূল্য ব্যবহার করে হিসাব করা অধিক নির্ভুল হবে।`,
    contentEn: `This calculator provides an estimated Zakat amount based on the information you provided. For complex financial situations, please consult a qualified Islamic scholar.

Zakat is an act of worship, so accurate calculation is important. Using your local market prices will give more precise results.`,
  },
]

export default function IslamicEducationCard() {
  const [openSection, setOpenSection] = useState<string | null>('zakat-obligation')

  const toggleSection = useCallback((id: string) => {
    setOpenSection(prev => prev === id ? null : id)
  }, [])

  return (
    <div className="zk-card zk-education-card">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={18} className="text-[var(--zk-green)]" />
        <h3 className="text-sm font-bold text-[var(--zk-text)]">
          ইসলামিক যাকাত শিক্ষা
        </h3>
        <span className="text-[10px] text-[var(--zk-muted)] ml-auto">Islamic Zakat Guide</span>
      </div>

      <div className="space-y-2">
        {SECTIONS.map((section) => {
          const isOpen = openSection === section.id
          const Icon = section.icon
          return (
            <div key={section.id} className="zk-education-item">
              <button
                onClick={() => toggleSection(section.id)}
                className="zk-education-header"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-[var(--zk-accent)]" />
                  <span className="text-xs font-semibold text-[var(--zk-text)]">
                    {section.title}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`zk-chevron text-[var(--zk-muted)] ${isOpen ? 'zk-chevron-open' : ''}`}
                />
              </button>

              <div className={`zk-collapse ${isOpen ? 'zk-collapse-open' : ''}`}>
                <div className="zk-collapse-inner">
                  {isOpen && <div className="zk-education-body">
                    <div className="text-xs text-[var(--zk-muted)] leading-relaxed whitespace-pre-line">
                      {section.title === section.titleEn ? section.content : (
                        <>
                          <p className="mb-2">{section.content}</p>
                          <hr className="my-2 border-[var(--zk-border)]" />
                          <p className="text-[10px] text-[var(--zk-muted)] opacity-70 italic">{section.contentEn}</p>
                        </>
                      )}
                    </div>
                  </div>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
