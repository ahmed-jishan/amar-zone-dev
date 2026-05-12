// app/(tabs)/namaz/components/DuaView/index.tsx
'use client';

import { useState, useEffect } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import DuaCategoryList from './DuaCategoryList';
import DuaCard from './DuaCard';

// Dua data structure
export interface DuaItem {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference?: string;
}

export interface DuaCategory {
  id: string;
  name: string;
  nameBn: string;
  duas: DuaItem[];
}

// Sample duas (you can expand or fetch from API later)
const duaCategories: DuaCategory[] = [
  {
    id: 'morning',
    name: 'Morning',
    nameBn: 'সকালের দু‘আ',
    duas: [
      {
        id: 'morning1',
        arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ',
        transliteration: 'Asbahna wa asbahal mulku lillah',
        translation: 'আমরা সকাল করলাম এবং সমগ্র রাজত্ব আল্লাহর জন্য সকাল করল।',
        reference: 'মুসলিম',
      },
      {
        id: 'morning2',
        arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا',
        transliteration: 'Allahumma bika asbahna wa bika amsayna',
        translation: 'হে আল্লাহ, তোমারই সাহায্যে আমরা সকাল করি এবং তোমারই সাহায্যে সন্ধ্যা করি।',
      },
    ],
  },
  {
    id: 'evening',
    name: 'Evening',
    nameBn: 'সন্ধ্যার দু‘আ',
    duas: [
      {
        id: 'evening1',
        arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
        transliteration: 'Amsayna wa amsal mulku lillah',
        translation: 'আমরা সন্ধ্যা করলাম এবং সমগ্র রাজত্ব আল্লাহর জন্য সন্ধ্যা করল।',
      },
    ],
  },
  {
    id: 'travel',
    name: 'Travel',
    nameBn: 'ভ্রমণের দু‘আ',
    duas: [
      {
        id: 'travel1',
        arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا',
        transliteration: 'Subhanalladhi sakhkhara lana hadha',
        translation: 'পবিত্র তিনি যিনি আমাদের এ বাহনকে বশীভূত করে দিয়েছেন।',
      },
    ],
  },
  {
    id: 'food',
    name: 'Eating & Drinking',
    nameBn: 'খাবার-পানারের দু‘আ',
    duas: [
      {
        id: 'food1',
        arabic: 'بِسْمِ اللَّهِ',
        transliteration: 'Bismillah',
        translation: 'আল্লাহর নামে শুরু করছি।',
      },
      {
        id: 'food2',
        arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا',
        transliteration: 'Alhamdulillahil-ladhi at\'amana wa saqana',
        translation: 'সকল প্রশংসা আল্লাহর যিনি আমাদের খাবার ও পানীয় দান করেছেন।',
      },
    ],
  },
  {
    id: 'sleep',
    name: 'Sleeping',
    nameBn: 'ঘুমানোর দু‘আ',
    duas: [
      {
        id: 'sleep1',
        arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
        transliteration: 'Bismika Allahumma amutu wa ahya',
        translation: 'হে আল্লাহ, তোমার নামেই মরি এবং বাঁচি।',
      },
    ],
  },
  {
    id: 'waking',
    name: 'Waking Up',
    nameBn: 'জাগরণের দু‘আ',
    duas: [
      {
        id: 'wake1',
        arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا',
        transliteration: 'Alhamdulillahil-ladhi ahyana ba\'da ma amatana',
        translation: 'সকল প্রশংসা আল্লাহর যিনি আমাদের মৃত্যুর পর পুনরায় জীবিত করলেন।',
      },
    ],
  },
  {
    id: 'stress',
    name: 'Anxiety & Grief',
    nameBn: 'দুঃখ-চিন্তার দু‘আ',
    duas: [
      {
        id: 'stress1',
        arabic: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
        transliteration: 'La ilaha illa anta subhanaka inni kuntu minaz-zalimin',
        translation: 'তুমি ছাড়া কোনো ইলাহ নেই, তুমি পবিত্র, নিশ্চয়ই আমি অত্যাচারীদের অন্তর্ভুক্ত ছিলাম।',
      },
    ],
  },
  {
    id: 'jannah',
    name: 'Paradise & Hell',
    nameBn: 'জান্নাত-জাহান্নাম',
    duas: [
      {
        id: 'jannah1',
        arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً',
        transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan',
        translation: 'হে আমাদের রব, দুনিয়াতে কল্যাণ দাও এবং আখিরাতেও কল্যাণ দাও।',
      },
    ],
  },
];

export default function DuaView() {
  const [activeCategoryId, setActiveCategoryId] = useState(duaCategories[0].id);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [readStatus, setReadStatus] = useState<Record<string, boolean>>({});

  // Load read status from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('duaReadStatus');
    if (saved) setReadStatus(JSON.parse(saved));
  }, []);

  const toggleRead = (duaId: string) => {
    const newStatus = { ...readStatus, [duaId]: !readStatus[duaId] };
    setReadStatus(newStatus);
    localStorage.setItem('duaReadStatus', JSON.stringify(newStatus));
  };

  const activeCategory = duaCategories.find(c => c.id === activeCategoryId)!;
  const activeDuas = activeCategory.duas;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <BookOpen className="text-emerald-700" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">দু‘আ ও যিকির</h2>
            <p className="text-emerald-600 text-sm">প্রতিদিনের দু‘আ সমূহ</p>
          </div>
        </div>
      </div>

      {/* Category Selector: Tabs on desktop, Dropdown on mobile */}
      <div className="relative">
        {/* Desktop Tabs (hidden on mobile) */}
        <div className="hidden md:flex gap-2 flex-wrap border-b border-emerald-100 pb-2">
          {duaCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-4 py-2 rounded-t-lg transition-all ${
                activeCategoryId === cat.id
                  ? 'bg-emerald-100 text-emerald-800 font-semibold border-b-2 border-emerald-600'
                  : 'text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              {cat.nameBn}
            </button>
          ))}
        </div>

        {/* Mobile Dropdown */}
        <div className="md:hidden">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex justify-between items-center px-4 py-2 bg-white/70 rounded-xl border border-emerald-200 text-emerald-800"
          >
            <span>{activeCategory.nameBn}</span>
            <ChevronDown size={18} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-emerald-100 z-30 overflow-hidden">
              {duaCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategoryId(cat.id);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-emerald-800 hover:bg-emerald-50 transition"
                >
                  {cat.nameBn}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dua Cards List */}
      <div className="space-y-4">
        {activeDuas.map(dua => (
          <DuaCard
            key={dua.id}
            dua={dua}
            isRead={readStatus[dua.id] || false}
            onToggleRead={() => toggleRead(dua.id)}
          />
        ))}
        {activeDuas.length === 0 && (
          <div className="text-center py-8 text-emerald-500">এই ক্যাটাগরিতে কোনো দু‘আ নেই।</div>
        )}
      </div>
    </div>
  );
}