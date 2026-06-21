'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Hand, Droplets, Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import { triggerHaptic, vibrateBrowser } from '@/lib/native/haptics';

interface WuduStep {
  id: string;
  labelBn: string;
  labelEn: string;
  icon: React.ReactNode;
  detailsBn: string;
  detailsEn: string;
}

const WUDU_STEPS: WuduStep[] = [
  {
    id: 'niyyah',
    labelBn: 'নিয়ত',
    labelEn: 'Niyyah (Intention)',
    icon: <Hand size={18} />,
    detailsBn: 'ওযুর নিয়ত করুন — মানসিক প্রস্তুতি',
    detailsEn: 'Make intention for wudu — mental preparation',
  },
  {
    id: 'wash-hands',
    labelBn: 'হাত ধোয়া',
    labelEn: 'Wash Hands',
    icon: <Droplets size={18} />,
    detailsBn: 'ডান হাত দিয়ে শুরু করুন, ৩ বার',
    detailsEn: 'Start with right hand, 3 times',
  },
  {
    id: 'mouth',
    labelBn: 'কুলি করা',
    labelEn: 'Rinse Mouth',
    icon: <Droplets size={18} />,
    detailsBn: 'তিনবার কুলি করুন',
    detailsEn: 'Rinse mouth 3 times',
  },
  {
    id: 'nose',
    labelBn: 'নাক পরিষ্কার',
    labelEn: 'Clean Nose',
    icon: <Droplets size={18} />,
    detailsBn: 'ডান হাতে পানি নিয়ে নাকে দিন, বাম দিয়ে পরিষ্কার করুন — ৩ বার',
    detailsEn: 'Sniff water, blow out with left hand — 3 times',
  },
  {
    id: 'face',
    labelBn: 'মুখ ধোয়া',
    labelEn: 'Wash Face',
    icon: <Sparkles size={18} />,
    detailsBn: 'কান থেকে কান, কপাল থেকে থুতনি — ৩ বার',
    detailsEn: 'From ears to ears, forehead to chin — 3 times',
  },
  {
    id: 'arms',
    labelBn: 'হাত ধোয়া',
    labelEn: 'Wash Arms',
    icon: <Hand size={18} />,
    detailsBn: 'ডান হাত কনুই পর্যন্ত — ৩ বার, তারপর বাম',
    detailsEn: 'Right arm to elbow — 3 times, then left',
  },
  {
    id: 'head',
    labelBn: 'মাথা মাসেহ',
    labelEn: 'Wipe Head',
    icon: <Sparkles size={18} />,
    detailsBn: 'ভেজা হাতে মাথা মাসেহ করুন — ১ বার',
    detailsEn: 'Wipe head with wet hands — once',
  },
  {
    id: 'ears',
    labelBn: 'কান মাসেহ',
    labelEn: 'Wipe Ears',
    icon: <Sparkles size={18} />,
    detailsBn: 'দুই কান মাসেহ করুন',
    detailsEn: 'Wipe both ears',
  },
  {
    id: 'feet',
    labelBn: 'পা ধোয়া',
    labelEn: 'Wash Feet',
    icon: <Droplets size={18} />,
    detailsBn: 'ডান পা টাখনু পর্যন্ত — ৩ বার, তারপর বাম',
    detailsEn: 'Right foot to ankle — 3 times, then left',
  },
];

interface WuduTimerProps {
  language: 'bn' | 'en';
  onClose: () => void;
}

export default function WuduTimer({ language, onClose }: WuduTimerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  const current = WUDU_STEPS[currentStep];
  const isLastStep = currentStep >= WUDU_STEPS.length - 1;

  const handleNext = () => {
    triggerHaptic('medium');
    vibrateBrowser(10);

    const newCompleted = new Set(completed);
    newCompleted.add(current.id);
    setCompleted(newCompleted);

    if (isLastStep) {
      setIsComplete(true);
      triggerHaptic('success');
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleReset = () => {
    triggerHaptic('light');
    setCurrentStep(0);
    setCompleted(new Set());
    setIsComplete(false);
  };

  const progress = ((currentStep + (isComplete ? 1 : 0)) / WUDU_STEPS.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-2xl nz-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Droplets size={18} className="text-emerald-600" />
          <h3 className="text-base font-bold nz-text">
            {language === 'bn' ? 'ওযু টাইমার' : 'Wudu Timer'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l8 8M11 3l-8 8" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          className="h-full bg-emerald-500"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>

      <div className="p-5">
        {isComplete ? (
          /* Completion screen */
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center py-6 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
              <CheckCircle size={32} />
            </div>
            <h4 className="text-xl font-bold nz-text">
              {language === 'bn' ? 'ওযু সম্পন্ন! 🎉' : 'Wudu Complete! 🎉'}
            </h4>
            <p className="mt-2 text-sm nz-muted max-w-xs">
              {language === 'bn'
                ? 'আপনার ওযু সম্পন্ন হয়েছে। এখন নামাজের জন্য প্রস্তুত!'
                : 'Your wudu is complete. Ready for prayer!'}
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              {language === 'bn' ? 'আবার শুরু করুন' : 'Start Again'}
            </button>
          </motion.div>
        ) : (
          /* Step display */
          <div className="space-y-5">
            {/* Step counter */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold nz-muted">
                {language === 'bn'
                  ? `ধাপ ${currentStep + 1} / ${WUDU_STEPS.length}`
                  : `Step ${currentStep + 1} of ${WUDU_STEPS.length}`}
              </span>
              <div className="flex gap-1">
                {WUDU_STEPS.map((step, i) => (
                  <div
                    key={step.id}
                    className={`h-1.5 w-4 rounded-full transition-all ${
                      completed.has(step.id)
                        ? 'bg-emerald-500'
                        : i === currentStep
                          ? 'bg-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Current step */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="rounded-2xl bg-emerald-50/70 p-6 text-center dark:bg-emerald-900/20"
              >
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
                    {current.icon}
                  </div>
                </div>
                <h4 className="text-lg font-bold nz-text">
                  {language === 'bn' ? current.labelBn : current.labelEn}
                </h4>
                <p className="mt-2 text-sm nz-muted">
                  {language === 'bn' ? current.detailsBn : current.detailsEn}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                {language === 'bn' ? 'পুনরায়' : 'Restart'}
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                {isLastStep
                  ? (language === 'bn' ? 'সম্পন্ন ✅' : 'Complete ✅')
                  : (language === 'bn' ? 'পরবর্তী ধাপ' : 'Next Step')}
                <ArrowRight size={16} />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}