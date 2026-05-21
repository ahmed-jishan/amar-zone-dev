"use client";

import React, { useState, useRef, useEffect } from "react";
import { Modal } from "@/components/shared/Modal";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface ContributeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  goalName?: string;
}

export default function ContributeModal({ open, onClose, onSubmit, goalName }: ContributeModalProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d.]/g, "");
    setAmount(val);
    setError("");
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseFloat(amount);
    if (!amount || isNaN(num)) {
      setError("Please enter a valid amount.");
      return;
    }
    if (num <= 0) {
      setError("Amount must be positive.");
      return;
    }
    setError("");
    onSubmit(num);
    setAmount("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <AnimatePresence>
      {open && (
        <Modal open={open} onClose={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={clsx(
              "relative w-full max-w-xs sm:max-w-sm p-6 rounded-2xl shadow-xl border border-white/10",
              "bg-gradient-to-br from-white/10 to-black/60 backdrop-blur-lg",
              "flex flex-col gap-4 items-center",
              "transition-all duration-300",
              "dark:bg-gradient-to-br dark:from-[#23272f]/80 dark:to-[#10121a]/90"
            )}
            onClick={e => e.stopPropagation()}
          >
            <form
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-3"
            >
              <h2 className="text-lg font-bold text-center text-white mb-2">
                Contribute to {goalName ? <span className="text-primary-400">{goalName}</span> : "Goal"}
              </h2>
              <div className="relative w-full">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="decimal"
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-lg text-white",
                    "focus:outline-none focus:ring-2 focus:ring-primary-400",
                    error && "border-red-400 focus:ring-red-400"
                  )}
                  aria-label="Contribution amount"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 select-none pointer-events-none">৳</span>
              </div>
              {error && (
                <div className="text-red-400 text-sm text-center animate-pulse">{error}</div>
              )}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-semibold text-lg transition-all shadow-md active:scale-95"
                disabled={!amount || !!error}
              >
                Contribute
              </button>
              <button
                type="button"
                className="w-full py-2 rounded-xl bg-white/10 text-white/70 text-sm mt-1 hover:bg-white/20 transition-all"
                onClick={onClose}
              >
                Cancel
              </button>
            </form>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
}
