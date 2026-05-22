"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { motion, AnimatePresence, useDragControls, useMotionValue, useSpring } from "framer-motion";
import {
  X,
  Minus,
  Maximize2,
  Calculator,
  History,
  Trash2,
  Pin,
  PinOff,
  Copy,
  Check,
  RotateCcw,
  Search,
  FunctionSquare,
  Trash,
  GripHorizontal,
  Delete,
  Binary,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ─── Utility ─────────────────────────────────────────────────────────────────
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const formatNumber = (num: number | string): string => {
  if (typeof num === "string") {
    const parsed = parseFloat(num);
    if (isNaN(parsed)) return num;
    num = parsed;
  }
  if (Math.abs(num) > 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
    return num.toExponential(6);
  }
  return parseFloat(num.toPrecision(12)).toLocaleString("en-US", {
    maximumFractionDigits: 8,
  });
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  pinned: boolean;
}

interface CalculatorPosition {
  x: number;
  y: number;
}

interface CalculatorStore {
  isOpen: boolean;
  isMinimized: boolean;
  isScientific: boolean;
  isBinary: boolean;
  position: CalculatorPosition;
  history: HistoryItem[];
  memory: number;
  open: () => void;
  close: () => void;
  toggle: () => void;
  minimize: () => void;
  maximize: () => void;
  toggleScientific: () => void;
  toggleBinary: () => void;
  setPosition: (pos: CalculatorPosition) => void;
  addHistory: (item: Omit<HistoryItem, "id" | "timestamp">) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
  togglePin: (id: string) => void;
  setMemory: (val: number) => void;
  memoryAdd: (val: number) => void;
  memorySubtract: (val: number) => void;
  memoryClear: () => void;
}

// ─── Zustand Store ───────────────────────────────────────────────────────────
const useCalculatorStore = create<CalculatorStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      isMinimized: false,
      isScientific: false,
      isBinary: false,
      position: { x: 0, y: 0 },
      history: [],
      memory: 0,
      open: () => set({ isOpen: true, isMinimized: false }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen, isMinimized: false })),
      minimize: () => set({ isMinimized: true }),
      maximize: () => set({ isMinimized: false }),
      toggleScientific: () =>
        set((s) => ({ isScientific: !s.isScientific, isBinary: false })),
      toggleBinary: () => set((s) => ({ isBinary: !s.isBinary, isScientific: false })),
      setPosition: (pos) => set({ position: pos }),
      addHistory: (item) =>
        set((s) => ({
          history: [
            {
              ...item,
              id: generateId(),
              timestamp: Date.now(),
              pinned: false,
            },
            ...s.history,
          ].slice(0, 200),
        })),
      removeHistory: (id) =>
        set((s) => ({ history: s.history.filter((h) => h.id !== id) })),
      clearHistory: () => set({ history: [] }),
      togglePin: (id) =>
        set((s) => ({
          history: s.history.map((h) =>
            h.id === id ? { ...h, pinned: !h.pinned } : h
          ),
        })),
      setMemory: (val) => set({ memory: val }),
      memoryAdd: (val) => set((s) => ({ memory: s.memory + val })),
      memorySubtract: (val) => set((s) => ({ memory: s.memory - val })),
      memoryClear: () => set({ memory: 0 }),
    }),
    {
      name: "amar-zone-calculator-v2",
      partialize: (state) => ({
        position: state.position,
        history: state.history,
        memory: state.memory,
        isScientific: state.isScientific,
        isBinary: state.isBinary,
      }),
    }
  )
);

// ─── Math Engine ─────────────────────────────────────────────────────────────
class MathEngine {
  private degMode = false;

  setDegMode(mode: boolean) {
    this.degMode = mode;
  }

  private toRad(deg: number): number {
    return this.degMode ? (deg * Math.PI) / 180 : deg;
  }

  evaluate(expr: string): { result: number | null; error: string | null } {
    try {
      // Sanitize and prepare expression
      let sanitized = expr
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-")
        .replace(/\^/g, "**")
        .replace(/π/gi, "Math.PI")
        .replace(/e(?![a-zA-Z])/g, "Math.E")
        .replace(/√\(/g, "Math.sqrt(")
        .replace(/√(\d+\.?\d*)/g, "Math.sqrt($1)")
        .replace(/log\(/g, "Math.log10(")
        .replace(/ln\(/g, "Math.log(")
        .replace(/sin\(/g, `Math.sin(${this.degMode ? "(Math.PI/180)*" : ""}`)
        .replace(/cos\(/g, `Math.cos(${this.degMode ? "(Math.PI/180)*" : ""}`)
        .replace(/tan\(/g, `Math.tan(${this.degMode ? "(Math.PI/180)*" : ""}`)
        .replace(/asin\(/g, `Math.asin(${this.degMode ? "" : ""}`)
        .replace(/acos\(/g, `Math.acos(${this.degMode ? "" : ""}`)
        .replace(/atan\(/g, `Math.atan(${this.degMode ? "" : ""}`)
        .replace(/abs\(/g, "Math.abs(")
        .replace(/floor\(/g, "Math.floor(")
        .replace(/ceil\(/g, "Math.ceil(")
        .replace(/round\(/g, "Math.round(")
        .replace(/fact\(/g, "ctx.factorial(")
        .replace(/%/g, "/100");

      // Handle factorial
      const factorial = (n: number): number => {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
      };

      // Safe evaluation with Function constructor
      const func = new Function("Math", "ctx", `return (${sanitized})`);
      const result = func(Math, { factorial });

      if (!isFinite(result) || isNaN(result)) {
        return { result: null, error: "Invalid result" };
      }

      return { result, error: null };
    } catch (err) {
      return { result: null, error: "Invalid expression" };
    }
  }
}

const mathEngine = new MathEngine();

// ─── Button Config ───────────────────────────────────────────────────────────
interface CalcButton {
  label: string;
  value: string;
  type: "number" | "operator" | "function" | "action" | "scientific";
  icon?: React.ReactNode;
  span?: number;
  scientific?: boolean;
}

const BASIC_BUTTONS: CalcButton[][] = [
  [
    { label: "C", value: "clear", type: "action" },
    { label: "( )", value: "paren", type: "function" },
    { label: "%", value: "%", type: "operator" },
    { label: "÷", value: "/", type: "operator" },
  ],
  [
    { label: "7", value: "7", type: "number" },
    { label: "8", value: "8", type: "number" },
    { label: "9", value: "9", type: "number" },
    { label: "×", value: "*", type: "operator" },
  ],
  [
    { label: "4", value: "4", type: "number" },
    { label: "5", value: "5", type: "number" },
    { label: "6", value: "6", type: "number" },
    { label: "−", value: "-", type: "operator" },
  ],
  [
    { label: "1", value: "1", type: "number" },
    { label: "2", value: "2", type: "number" },
    { label: "3", value: "3", type: "number" },
    { label: "+", value: "+", type: "operator" },
  ],
  [
    { label: "0", value: "0", type: "number", span: 2 },
    { label: ".", value: ".", type: "number" },
    { label: "=", value: "equals", type: "action" },
  ],
];

const SCIENTIFIC_BUTTONS: CalcButton[][] = [
  [
    { label: "sin", value: "sin(", type: "scientific" },
    { label: "cos", value: "cos(", type: "scientific" },
    { label: "tan", value: "tan(", type: "scientific" },
    { label: "π", value: "π", type: "scientific" },
  ],
  [
    { label: "log", value: "log(", type: "scientific" },
    { label: "ln", value: "ln(", type: "scientific" },
    { label: "√", value: "√(", type: "scientific" },
    { label: "x²", value: "^2", type: "scientific" },
  ],
  [
    { label: "xʸ", value: "^", type: "scientific" },
    { label: "e", value: "e", type: "scientific" },
    { label: "|x|", value: "abs(", type: "scientific" },
    { label: "n!", value: "fact(", type: "scientific" },
  ],
];


const MEMORY_BUTTONS: CalcButton[] = [
  { label: "MC", value: "mc", type: "action" },
  { label: "MR", value: "mr", type: "action" },
  { label: "M+", value: "m+", type: "action" },
  { label: "M−", value: "m-", type: "action" },
];

const HEX_BUTTONS: CalcButton[] = [
  { label: "A", value: "A", type: "number" },
  { label: "B", value: "B", type: "number" },
  { label: "C", value: "C", type: "number" },
  { label: "D", value: "D", type: "number" },
  { label: "E", value: "E", type: "number" },
  { label: "F", value: "F", type: "number" },
];

// ─── Binary Mode Helpers ────────────────────────────────────────────────────
type BinaryBase = "BIN" | "DEC" | "OCT" | "HEX";

const BINARY_BASES: BinaryBase[] = ["BIN", "DEC", "OCT", "HEX"];

const baseToRadix: Record<BinaryBase, number> = {
  BIN: 2,
  DEC: 10,
  OCT: 8,
  HEX: 16,
};

const isValidDigitForBase = (char: string, base: BinaryBase) => {
  if (!char) return false;
  const upper = char.toUpperCase();
  switch (base) {
    case "BIN":
      return upper === "0" || upper === "1";
    case "DEC":
      return /[0-9]/.test(upper);
    case "OCT":
      return /[0-7]/.test(upper);
    case "HEX":
      return /[0-9A-F]/.test(upper);
    default:
      return false;
  }
};

const parseBaseValue = (value: string, base: BinaryBase): bigint | number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const negative = trimmed.startsWith("-");
  const raw = negative ? trimmed.slice(1) : trimmed;
  if (!raw) return null;
  const sanitized = raw.replace(/\s+/g, "").toUpperCase();
  if (base === "DEC") {
    if (!/^\d*(\.\d*)?$/.test(sanitized)) return null;
    if (sanitized === "" || sanitized === ".") return null;
    const parsed = Number.parseFloat(sanitized);
    if (Number.isNaN(parsed)) return null;
    return negative ? -parsed : parsed;
  }

  for (const ch of sanitized) {
    if (!isValidDigitForBase(ch, base)) return null;
  }
  const prefix = base === "BIN" ? "0b" : base === "OCT" ? "0o" : base === "HEX" ? "0x" : "";
  try {
    const parsed = BigInt(prefix + sanitized);
    return negative ? -parsed : parsed;
  } catch {
    return null;
  }
};

const formatDecimalNumber = (value: number) => {
  const normalized = Object.is(value, -0) ? 0 : value;
  let text = normalized.toString();
  if (text.includes("e")) {
    text = normalized.toFixed(8);
  }
  if (text.includes(".")) {
    text = text.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  }
  return text;
};

const convertDecimalToBase = (value: number, base: BinaryBase, precision = 8) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) return "Error";
  const negative = value < 0;
  const absValue = Math.abs(value);
  const radix = baseToRadix[base];
  const intPart = Math.floor(absValue);
  let frac = absValue - intPart;
  const intText = intPart.toString(radix).toUpperCase();
  if (frac === 0) return negative ? `-${intText}` : intText;
  let fracText = "";
  let count = 0;
  while (frac > 0 && count < precision) {
    frac *= radix;
    const digit = Math.floor(frac);
    fracText += digit.toString(radix).toUpperCase();
    frac -= digit;
    count += 1;
  }
  const combined = `${intText}.${fracText}`;
  return negative ? `-${combined}` : combined;
};

const formatBaseValue = (value: bigint | number, base: BinaryBase) => {
  if (typeof value === "number") {
    if (base === "DEC") {
      return formatDecimalNumber(value);
    }
    return convertDecimalToBase(value, base);
  }
  const negative = value < 0n;
  const absValue = negative ? -value : value;
  const formatted = absValue.toString(baseToRadix[base]).toUpperCase();
  return negative ? `-${formatted}` : formatted;
};

const evaluateDecimalExpression = (expr: string) => {
  const tokens: Array<{ type: "number" | "operator" | "paren"; value: number | string }> = [];
  const input = expr.replace(/\s+/g, "");
  if (!input) return { result: null as number | null, error: "Empty expression" };

  let i = 0;
  let prev: "start" | "operator" | "lparen" | "number" | "rparen" = "start";

  const pushNumber = (digits: string, negative: boolean) => {
    if (!/^\d*(\.\d*)?$/.test(digits) || digits === "" || digits === ".") return false;
    const parsed = Number.parseFloat(digits);
    if (Number.isNaN(parsed)) return false;
    tokens.push({ type: "number", value: negative ? -parsed : parsed });
    return true;
  };

  while (i < input.length) {
    const ch = input[i];
    if (ch === "(") {
      tokens.push({ type: "paren", value: "(" });
      prev = "lparen";
      i += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "paren", value: ")" });
      prev = "rparen";
      i += 1;
      continue;
    }
    if ("+-*/%".includes(ch)) {
      const isUnary = ch === "-" && (prev === "start" || prev === "operator" || prev === "lparen");
      if (isUnary) {
        const next = input[i + 1];
        if (next === "(") {
          tokens.push({ type: "number", value: 0 });
          tokens.push({ type: "operator", value: "-" });
          prev = "operator";
          i += 1;
          continue;
        }
        let j = i + 1;
        let digits = "";
        let dotSeen = false;
        while (j < input.length) {
          const candidate = input[j];
          if (candidate === ".") {
            if (dotSeen) break;
            dotSeen = true;
            digits += candidate;
            j += 1;
            continue;
          }
          if (!/[0-9]/.test(candidate)) break;
          digits += candidate;
          j += 1;
        }
        if (!digits) return { result: null, error: "Invalid expression" };
        if (!pushNumber(digits, true)) return { result: null, error: "Invalid number" };
        prev = "number";
        i = j;
        continue;
      }

      tokens.push({ type: "operator", value: ch });
      prev = "operator";
      i += 1;
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      let j = i;
      let digits = "";
      let dotSeen = false;
      while (j < input.length) {
        const candidate = input[j];
        if (candidate === ".") {
          if (dotSeen) break;
          dotSeen = true;
          digits += candidate;
          j += 1;
          continue;
        }
        if (!/[0-9]/.test(candidate)) break;
        digits += candidate;
        j += 1;
      }
      if (!pushNumber(digits, false)) return { result: null, error: "Invalid number" };
      prev = "number";
      i = j;
      continue;
    }

    return { result: null, error: "Invalid character" };
  }

  const output: Array<number | string> = [];
  const ops: string[] = [];
  const precedence: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2 };

  for (const token of tokens) {
    if (token.type === "number") {
      output.push(token.value as number);
      continue;
    }
    if (token.type === "operator") {
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top === "(") break;
        if (precedence[top] >= precedence[token.value as string]) {
          output.push(ops.pop() as string);
        } else {
          break;
        }
      }
      ops.push(token.value as string);
      continue;
    }
    if (token.value === "(") {
      ops.push(token.value as string);
      continue;
    }
    if (token.value === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") {
        output.push(ops.pop() as string);
      }
      if (!ops.length) return { result: null, error: "Mismatched parentheses" };
      ops.pop();
    }
  }

  while (ops.length) {
    const op = ops.pop() as string;
    if (op === "(") return { result: null, error: "Mismatched parentheses" };
    output.push(op);
  }

  const stack: number[] = [];
  for (const token of output) {
    if (typeof token === "number") {
      stack.push(token);
      continue;
    }
    if (stack.length < 2) return { result: null, error: "Invalid expression" };
    const b = stack.pop() as number;
    const a = stack.pop() as number;
    if ((token === "/" || token === "%") && b === 0) {
      return { result: null, error: "Division by zero" };
    }
    switch (token) {
      case "+":
        stack.push(a + b);
        break;
      case "-":
        stack.push(a - b);
        break;
      case "*":
        stack.push(a * b);
        break;
      case "/":
        stack.push(a / b);
        break;
      case "%":
        stack.push(a % b);
        break;
    }
  }

  if (stack.length !== 1) return { result: null, error: "Invalid expression" };
  return { result: stack[0], error: null };
};

const evaluateBaseExpression = (expr: string, base: BinaryBase) => {
  if (base === "DEC") {
    return evaluateDecimalExpression(expr);
  }
  const tokens: Array<{ type: "number" | "operator" | "paren"; value: string }> = [];
  const input = expr.replace(/\s+/g, "");
  if (!input) return { result: null as bigint | null, error: "Empty expression" };

  let i = 0;
  let prev: "start" | "operator" | "lparen" | "number" | "rparen" = "start";

  const pushNumber = (digits: string, negative: boolean) => {
    const parsed = parseBaseValue((negative ? "-" : "") + digits, base);
    if (parsed === null) return false;
    tokens.push({ type: "number", value: parsed.toString() });
    return true;
  };

  while (i < input.length) {
    const ch = input[i];
    if (ch === "(") {
      tokens.push({ type: "paren", value: "(" });
      prev = "lparen";
      i += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "paren", value: ")" });
      prev = "rparen";
      i += 1;
      continue;
    }
    if ("+-*/%".includes(ch)) {
      const isUnary = ch === "-" && (prev === "start" || prev === "operator" || prev === "lparen");
      if (isUnary) {
        const next = input[i + 1];
        if (next === "(") {
          tokens.push({ type: "number", value: "0" });
          tokens.push({ type: "operator", value: "-" });
          prev = "operator";
          i += 1;
          continue;
        }
        let j = i + 1;
        let digits = "";
        while (j < input.length && isValidDigitForBase(input[j], base)) {
          digits += input[j].toUpperCase();
          j += 1;
        }
        if (!digits) return { result: null, error: "Invalid expression" };
        if (!pushNumber(digits, true)) return { result: null, error: "Invalid number" };
        prev = "number";
        i = j;
        continue;
      }

      tokens.push({ type: "operator", value: ch });
      prev = "operator";
      i += 1;
      continue;
    }

    if (isValidDigitForBase(ch, base)) {
      let j = i;
      let digits = "";
      while (j < input.length && isValidDigitForBase(input[j], base)) {
        digits += input[j].toUpperCase();
        j += 1;
      }
      if (!pushNumber(digits, false)) return { result: null, error: "Invalid number" };
      prev = "number";
      i = j;
      continue;
    }

    return { result: null, error: "Invalid character" };
  }

  const output: Array<string> = [];
  const ops: string[] = [];
  const precedence: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2 };

  for (const token of tokens) {
    if (token.type === "number") {
      output.push(token.value);
      continue;
    }
    if (token.type === "operator") {
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top === "(") break;
        if (precedence[top] >= precedence[token.value]) {
          output.push(ops.pop() as string);
        } else {
          break;
        }
      }
      ops.push(token.value);
      continue;
    }
    if (token.value === "(") {
      ops.push(token.value);
      continue;
    }
    if (token.value === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") {
        output.push(ops.pop() as string);
      }
      if (!ops.length) return { result: null, error: "Mismatched parentheses" };
      ops.pop();
    }
  }

  while (ops.length) {
    const op = ops.pop() as string;
    if (op === "(") return { result: null, error: "Mismatched parentheses" };
    output.push(op);
  }

  const stack: bigint[] = [];
  for (const token of output) {
    if (!"+-*/%".includes(token)) {
      stack.push(BigInt(token));
      continue;
    }
    if (stack.length < 2) return { result: null, error: "Invalid expression" };
    const b = stack.pop() as bigint;
    const a = stack.pop() as bigint;
    if ((token === "/" || token === "%") && b === 0n) {
      return { result: null, error: "Division by zero" };
    }
    switch (token) {
      case "+":
        stack.push(a + b);
        break;
      case "-":
        stack.push(a - b);
        break;
      case "*":
        stack.push(a * b);
        break;
      case "/":
        stack.push(a / b);
        break;
      case "%":
        stack.push(a % b);
        break;
    }
  }

  if (stack.length !== 1) return { result: null, error: "Invalid expression" };
  return { result: stack[0], error: null };
};

// ─── Ripple Effect Component ─────────────────────────────────────────────────
function RippleButton({
  children,
  onClick,
  className,
  active = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  active?: boolean;
  disabled?: boolean;
}) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }
    onClick?.();
  };

  return (
    <motion.button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "relative overflow-hidden select-none transition-all duration-150",
        "active:scale-95",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute rounded-full bg-white/20 pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}
    </motion.button>
  );
}

// ─── History Panel ───────────────────────────────────────────────────────────
function HistoryPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { history, removeHistory, clearHistory, togglePin } = useCalculatorStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredHistory = useMemo(() => {
    let items = history;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (h) =>
          h.expression.toLowerCase().includes(q) ||
          h.result.toLowerCase().includes(q)
      );
    }
    // Sort: pinned first, then by timestamp
    return [...items].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.timestamp - a.timestamp;
    });
  }, [history, searchQuery]);

  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: HistoryItem[] } = {};
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.setDate(now.getDate() - 1)).toDateString();

    filteredHistory.forEach((item) => {
      const date = new Date(item.timestamp).toDateString();
      let label = date;
      if (date === today) label = "Today";
      else if (date === yesterday) label = "Yesterday";
      else label = new Date(item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });
    return groups;
  }, [filteredHistory]);

  const handleCopy = async (result: string, id: string) => {
    try {
      await navigator.clipboard.writeText(result);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = result;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-[9999]"
          >
            <div className="h-full bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <History className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">History</h3>
                      <p className="text-white/40 text-xs">{history.length} calculations</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {history.length > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={clearHistory}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                        title="Clear all history"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-white/10 text-white/60 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search calculations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                  />
                </div>
              </div>

              {/* Content */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
                {Object.keys(groupedHistory).length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-64 text-white/30"
                  >
                    <History className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">No calculations yet</p>
                    <p className="text-xs mt-1">Your history will appear here</p>
                  </motion.div>
                ) : (
                  Object.entries(groupedHistory).map(([date, items]) => (
                    <div key={date}>
                      <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3 px-1">
                        {date}
                      </h4>
                      <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                          {items.map((item) => (
                            <motion.div
                              key={item.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95, x: 50 }}
                              transition={{ duration: 0.2 }}
                              className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-xl p-3.5 transition-all cursor-pointer"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-white/50 text-sm font-mono truncate">
                                    {item.expression}
                                  </p>
                                  <p className="text-white text-lg font-semibold mt-1 font-mono">
                                    {item.result}
                                  </p>
                                  <p className="text-white/20 text-xs mt-1">
                                    {new Date(item.timestamp).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePin(item.id);
                                    }}
                                    className={cn(
                                      "p-1.5 rounded-lg transition-colors",
                                      item.pinned
                                        ? "bg-amber-500/20 text-amber-400"
                                        : "hover:bg-white/10 text-white/40"
                                    )}
                                  >
                                    {item.pinned ? (
                                      <Pin className="w-3.5 h-3.5" />
                                    ) : (
                                      <PinOff className="w-3.5 h-3.5" />
                                    )}
                                  </motion.button>
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(item.result, item.id);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-colors"
                                  >
                                    {copiedId === item.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </motion.button>
                                  <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeHistory(item.id);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </motion.button>
                                </div>
                              </div>
                              {item.pinned && (
                                <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-amber-500/60 rounded-r-full" />
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Calculator Component ───────────────────────────────────────────────
export default function CalculatorModal() {
  const store = useCalculatorStore();
  const {
    isOpen,
    isMinimized,
    isScientific,
    isBinary,
    position,
    memory,
    addHistory,
    setPosition,
    minimize,
    maximize,
    toggleScientific,
    toggleBinary,
    memoryAdd,
    memorySubtract,
    memoryClear,
    setMemory,
  } = store;

  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [degMode, setDegMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [parenCount, setParenCount] = useState(0);
  const [binaryDisplay, setBinaryDisplay] = useState("0");
  const [binaryExpression, setBinaryExpression] = useState("");
  const [binaryError, setBinaryError] = useState<string | null>(null);
  const [binaryBase, setBinaryBase] = useState<BinaryBase>("BIN");
  const [binaryUndoStack, setBinaryUndoStack] = useState<string[]>([]);
  const [binaryRedoStack, setBinaryRedoStack] = useState<string[]>([]);
  const [modalScale, setModalScale] = useState(1);
  const [dragBounds, setDragBounds] = useState({ left: 0, top: 0, right: 0, bottom: 0 });
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const activeDisplay = isBinary ? binaryDisplay : display;
  const activeExpression = isBinary ? binaryExpression : expression;
  const activeError = isBinary ? binaryError : error;

  const binaryConversions = useMemo(() => {
    const parsed = parseBaseValue(binaryDisplay, binaryBase);
    if (parsed === null) {
      return { BIN: "--", DEC: "--", OCT: "--", HEX: "--" };
    }
    return {
      BIN: formatBaseValue(parsed, "BIN"),
      DEC: formatBaseValue(parsed, "DEC"),
      OCT: formatBaseValue(parsed, "OCT"),
      HEX: formatBaseValue(parsed, "HEX"),
    };
  }, [binaryDisplay, binaryBase]);

  const displayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Motion values for smooth dragging
  const x = useMotionValue(position.x || 0);
  const y = useMotionValue(position.y || 0);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  useEffect(() => {
    x.set(position.x || 0);
    y.set(position.y || 0);
  }, [position.x, position.y, x, y]);

  useEffect(() => {
    if (!isOpen || position.x !== 0 || position.y !== 0) return;
    const width = 360;
    const height = 520;
    const centeredX = Math.max(16, (window.innerWidth - width) / 2);
    const centeredY = Math.max(16, (window.innerHeight - height) / 2);
    setPosition({ x: centeredX, y: centeredY });
  }, [isOpen, position.x, position.y, setPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const updateScale = () => {
      if (!contentRef.current) return;
      const width = contentRef.current.offsetWidth || 360;
      const height = contentRef.current.scrollHeight || 520;
      const viewportWidth = window.visualViewport?.width || window.innerWidth;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const bottomNav = document.querySelector('.bottom-nav') as HTMLElement | null;
      const bottomOffset = bottomNav?.getBoundingClientRect().height || 0;
      const availableWidth = Math.max(0, viewportWidth - 24);
      const availableHeight = Math.max(0, viewportHeight - 24 - bottomOffset);
      const scaleX = availableWidth / width;
      const scaleY = availableHeight / height;
      const nextScale = Math.min(1, scaleX, scaleY);
      setModalScale(Number.isFinite(nextScale) ? nextScale : 1);
    };

    const requestScaleUpdate = () => {
      requestAnimationFrame(updateScale);
    };

    requestScaleUpdate();
    window.addEventListener("resize", requestScaleUpdate);
    window.visualViewport?.addEventListener("resize", requestScaleUpdate);

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }
    resizeObserverRef.current = new ResizeObserver(() => requestScaleUpdate());
    if (contentRef.current) {
      resizeObserverRef.current.observe(contentRef.current);
    }

    return () => {
      window.removeEventListener("resize", requestScaleUpdate);
      window.visualViewport?.removeEventListener("resize", requestScaleUpdate);
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, [isOpen, isScientific, isBinary]);

  useEffect(() => {
    if (!isOpen) return;

    const updateBounds = () => {
      if (!containerRef.current || !contentRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.visualViewport?.width || window.innerWidth;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const bottomNav = document.querySelector('.bottom-nav') as HTMLElement | null;
      const bottomOffset = bottomNav?.getBoundingClientRect().height || 0;
      const width = rect.width * modalScale;
      const height = (contentRef.current.scrollHeight || rect.height) * modalScale;
      const overflowX = width * 0.2;
      const overflowY = height * 0.2;
      setDragBounds({
        left: -overflowX,
        top: -overflowY,
        right: Math.max(-overflowX, viewportWidth - width + overflowX),
        bottom: Math.max(-overflowY, viewportHeight - bottomOffset - height + overflowY),
      });
    };

    updateBounds();
    window.addEventListener("resize", updateBounds);
    window.visualViewport?.addEventListener("resize", updateBounds);
    return () => {
      window.removeEventListener("resize", updateBounds);
      window.visualViewport?.removeEventListener("resize", updateBounds);
    };
  }, [isOpen, modalScale]);

  useEffect(() => {
    if (!isOpen) return;
    const clampedX = Math.min(Math.max(dragBounds.left, x.get()), dragBounds.right);
    const clampedY = Math.min(Math.max(dragBounds.top, y.get()), dragBounds.bottom);
    if (clampedX !== x.get()) x.set(clampedX);
    if (clampedY !== y.get()) y.set(clampedY);
  }, [isOpen, dragBounds, x, y]);

  // Auto-scroll display
  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollLeft = displayRef.current.scrollWidth;
    }
  }, [display, expression]);

  // Preview calculation
  useEffect(() => {
    if (expression && !error && !isBinary) {
      const { result, error: err } = mathEngine.evaluate(expression);
      if (result !== null && !err) {
        setPreview(formatNumber(result));
      } else {
        setPreview("");
      }
    } else {
      setPreview("");
    }
  }, [expression, error, isBinary]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || isMinimized) return;

      const key = e.key;

      if (isBinary) {
        if (key === "Escape") {
          store.close();
          return;
        }
        if (key === "Enter" || key === "=") {
          e.preventDefault();
          handleBinaryEquals();
          return;
        }
        if (key === "Backspace") {
          e.preventDefault();
          handleBinaryBackspace();
          return;
        }
        if (key === "(" || key === ")") {
          e.preventDefault();
          handleBinaryParen(key);
          return;
        }
        if (["+", "-", "*", "/", "%"].includes(key)) {
          e.preventDefault();
          const displayValue = key === "*" ? "×" : key === "/" ? "÷" : key === "-" ? "−" : key;
          handleBinaryInput(displayValue, key);
          return;
        }
        if (isValidDigitForBase(key, binaryBase)) {
          e.preventDefault();
          handleBinaryInput(key.toUpperCase());
          return;
        }
        return;
      }

      if (key === "Escape") {
        store.close();
        return;
      }

      if (key === "Enter" || key === "=") {
        e.preventDefault();
        handleEquals();
        return;
      }

      if (key === "Backspace") {
        e.preventDefault();
        handleBackspace();
        return;
      }

      if (key === "c" || key === "C") {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleCopy();
          return;
        }
      }

      if (key === "v" || key === "V") {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          navigator.clipboard.readText().then((text) => {
            const num = parseFloat(text);
            if (!isNaN(num)) {
              pushUndo();
              if (display === "0" || display === "Error") {
                setDisplay(text);
                setExpression(text);
              } else {
                setDisplay((prev) => prev + text);
                setExpression((prev) => prev + text);
              }
            }
          });
          return;
        }
      }

      if (/[0-9.]/.test(key)) {
        e.preventDefault();
        handleInput(key);
        return;
      }

      if (["+", "-", "*", "/", "%", "(", ")", "^"].includes(key)) {
        e.preventDefault();
        handleInput(key === "*" ? "×" : key === "/" ? "÷" : key, key);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isMinimized, display, expression, isBinary, binaryBase]);

  // Save position on drag end
  const handleDragEnd = useCallback(
    () => {
      const width = containerRef.current?.offsetWidth || 360;
      const height = containerRef.current?.offsetHeight || 520;
      const newX = x.get();
      const newY = y.get();
      const clampedX = Math.max(0, Math.min(window.innerWidth - width, newX));
      const clampedY = Math.max(0, Math.min(window.innerHeight - height, newY));
      setPosition({ x: clampedX, y: clampedY });
    },
    [setPosition, x, y]
  );

  const pushUndo = () => {
    setUndoStack((prev) => [...prev.slice(-20), expression]);
    setRedoStack([]);
  };

  const pushBinaryUndo = () => {
    setBinaryUndoStack((prev) => [...prev.slice(-20), binaryExpression]);
    setBinaryRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const prev = undoStack[undoStack.length - 1];
      setRedoStack((r) => [...r, expression]);
      setExpression(prev);
      setDisplay(prev || "0");
      setUndoStack((s) => s.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const next = redoStack[redoStack.length - 1];
      setUndoStack((u) => [...u, expression]);
      setExpression(next);
      setDisplay(next || "0");
      setRedoStack((r) => r.slice(0, -1));
    }
  };

  const handleBinaryUndo = () => {
    if (binaryUndoStack.length > 0) {
      const prev = binaryUndoStack[binaryUndoStack.length - 1];
      setBinaryRedoStack((r) => [...r, binaryExpression]);
      setBinaryExpression(prev);
      setBinaryDisplay(prev || "0");
      setBinaryUndoStack((s) => s.slice(0, -1));
    }
  };

  const handleBinaryRedo = () => {
    if (binaryRedoStack.length > 0) {
      const next = binaryRedoStack[binaryRedoStack.length - 1];
      setBinaryUndoStack((u) => [...u, binaryExpression]);
      setBinaryExpression(next);
      setBinaryDisplay(next || "0");
      setBinaryRedoStack((r) => r.slice(0, -1));
    }
  };

  const normalizeDisplayExpression = (value: string) =>
    value.replace(/,/g, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");

  const isOperator = (value: string) => ["+", "-", "*", "/", "%", "^"] .includes(value);

  const getLastNumberSegment = (value: string) => {
    const parts = value.split(/[^0-9.]/);
    return parts[parts.length - 1] || "";
  };

  const handleInput = (value: string, rawValue = value) => {
    const lastChar = expression.slice(-1);

    if (rawValue === ".") {
      const segment = getLastNumberSegment(expression);
      if (segment.includes(".")) return;
    }

    if (isOperator(rawValue)) {
      if (!expression && rawValue !== "-") return;
      if (isOperator(lastChar)) {
        pushUndo();
        setError(null);
        setDisplay((prev) => prev.slice(0, -1) + value);
        setExpression((prev) => prev.slice(0, -1) + rawValue);
        return;
      }
    }

    if (!expression && rawValue === "-") {
      pushUndo();
      setError(null);
      setDisplay("−");
      setExpression("-");
      return;
    }

    pushUndo();
    setError(null);

    if (display === "Error" || display === "0") {
      if (value === ".") {
        setDisplay("0.");
        setExpression(rawValue === value ? "0." : "0." + rawValue);
      } else if (/[0-9]/.test(value)) {
        setDisplay(value);
        setExpression(rawValue);
      } else {
        setDisplay("0" + value);
        setExpression("0" + rawValue);
      }
    } else {
      setDisplay((prev) => prev + value);
      setExpression((prev) => prev + rawValue);
    }
  };

  const handleBinaryInput = (displayValue: string, rawValue = displayValue) => {
    const normalized = rawValue.toUpperCase();
    const lastChar = binaryExpression.slice(-1);

    if (normalized === ".") {
      if (binaryBase !== "DEC") return;
      const segment = getLastNumberSegment(binaryExpression);
      if (segment.includes(".")) return;
    }

    if (isOperator(normalized)) {
      if (!binaryExpression && normalized !== "-") return;
      if (isOperator(lastChar)) {
        pushBinaryUndo();
        setBinaryError(null);
        setBinaryDisplay((prev) => prev.slice(0, -1) + displayValue);
        setBinaryExpression((prev) => prev.slice(0, -1) + normalized);
        return;
      }
    }

    if (!binaryExpression && normalized === "-") {
      pushBinaryUndo();
      setBinaryError(null);
      setBinaryDisplay("-");
      setBinaryExpression("-");
      return;
    }

    if (!isOperator(normalized)) {
      const isDecimalPoint = normalized === ".";
      if (isDecimalPoint && binaryBase !== "DEC") return;
      if (!isDecimalPoint && !isValidDigitForBase(normalized, binaryBase)) return;
    }

    if (binaryDisplay === "0" || binaryDisplay === "Error") {
      if (isOperator(normalized)) return;
      pushBinaryUndo();
      setBinaryError(null);
      if (normalized === ".") {
        setBinaryDisplay("0.");
        setBinaryExpression("0.");
      } else {
        setBinaryDisplay(displayValue);
        setBinaryExpression(normalized);
      }
      return;
    }

    pushBinaryUndo();
    setBinaryError(null);
    setBinaryDisplay((prev) => prev + displayValue);
    setBinaryExpression((prev) => prev + normalized);
  };

  const handleBinaryParen = (value: "(" | ")") => {
    if (!binaryExpression && value === ")") return;
    if (value === ")" && isOperator(binaryExpression.slice(-1))) return;
    pushBinaryUndo();
    setBinaryError(null);
    setBinaryDisplay((prev) => (prev === "0" ? value : prev + value));
    setBinaryExpression((prev) => (prev === "" || prev === "0" ? value : prev + value));
  };

  const handleBackspace = () => {
    if (isBinary) {
      handleBinaryBackspace();
      return;
    }
    pushUndo();
    if (display === "Error") {
      setDisplay("0");
      setExpression("");
      return;
    }
    if (display.length <= 1) {
      setDisplay("0");
      setExpression("");
    } else {
      const newDisplay = display.slice(0, -1);
      setDisplay(newDisplay);
      setExpression(normalizeDisplayExpression(newDisplay));
    }
  };

  const handleBinaryBackspace = () => {
    if (binaryDisplay === "Error") {
      setBinaryDisplay("0");
      setBinaryExpression("");
      setBinaryError(null);
      return;
    }
    if (!binaryExpression || binaryDisplay.length <= 1) {
      pushBinaryUndo();
      setBinaryDisplay("0");
      setBinaryExpression("");
      setBinaryError(null);
      return;
    }
    pushBinaryUndo();
    const newDisplay = binaryDisplay.slice(0, -1);
    const newExpression = binaryExpression.slice(0, -1);
    setBinaryDisplay(newDisplay || "0");
    setBinaryExpression(newExpression);
  };

  const handleClear = () => {
    if (isBinary) {
      handleBinaryClear();
      return;
    }
    pushUndo();
    setDisplay("0");
    setExpression("");
    setError(null);
    setPreview("");
    setParenCount(0);
  };

  const handleBinaryClear = () => {
    pushBinaryUndo();
    setBinaryDisplay("0");
    setBinaryExpression("");
    setBinaryError(null);
  };

  const handleParen = () => {
    pushUndo();
    const lastChar = expression.slice(-1);
    const openCount = (expression.match(/\(/g) || []).length;
    const closeCount = (expression.match(/\)/g) || []).length;

    if (openCount > closeCount && /[0-9)\]]/.test(lastChar)) {
      handleInput(")");
      setParenCount((c) => c - 1);
    } else {
      handleInput("(");
      setParenCount((c) => c + 1);
    }
  };

  const handleEquals = () => {
    if (!expression) return;

    // Auto-close parentheses
    let finalExpr = expression;
    const openCount = (expression.match(/\(/g) || []).length;
    const closeCount = (expression.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      finalExpr += ")".repeat(openCount - closeCount);
    }

    const { result, error: evalError } = mathEngine.evaluate(finalExpr);

    if (evalError || result === null) {
      setError(evalError || "Error");
      setDisplay("Error");
      return;
    }

    const formattedResult = formatNumber(result);
    addHistory({
      expression: finalExpr,
      result: formattedResult,
      pinned: false,
    });

    setDisplay(formattedResult);
    setExpression(String(result));
    setPreview("");
    setError(null);
    setParenCount(0);
  };

  const handleBinaryEquals = () => {
    if (!binaryExpression) return;
    const { result, error: evalError } = evaluateBaseExpression(binaryExpression, binaryBase);

    if (evalError || result === null) {
      setBinaryError(evalError || "Error");
      setBinaryDisplay("Error");
      return;
    }

    const formatted = formatBaseValue(result as bigint | number, binaryBase);
    addHistory({
      expression: binaryExpression,
      result: formatted,
      pinned: false,
    });

    setBinaryDisplay(formatted);
    setBinaryExpression(formatted);
    setBinaryError(null);
  };

  const handleBinaryBaseChange = (base: BinaryBase) => {
    if (base === binaryBase) return;
    const parsed = parseBaseValue(binaryDisplay, binaryBase);
    setBinaryBase(base);

    if (parsed === null) {
      setBinaryError(null);
      return;
    }

    const formatted = formatBaseValue(parsed, base);
    setBinaryDisplay(formatted);
    setBinaryExpression(formatted);
    setBinaryError(null);
  };

  const handleMemory = (action: string) => {
    const currentVal = parseFloat(expression) || 0;
    switch (action) {
      case "mc":
        memoryClear();
        break;
      case "mr":
        pushUndo();
        setDisplay(String(memory));
        setExpression(String(memory));
        break;
      case "m+":
        memoryAdd(currentVal);
        break;
      case "m-":
        memorySubtract(currentVal);
        break;
    }
  };

  const handleCopy = async () => {
    const textToCopy = activeDisplay === "Error" ? activeExpression : activeDisplay;
    try {
      await navigator.clipboard.writeText(textToCopy.replace(/,/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = textToCopy.replace(/,/g, "");
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleScientific = (value: string) => {
    pushUndo();
    setError(null);
    if (display === "0" || display === "Error") {
      setDisplay(value);
      setExpression(value);
    } else {
      setDisplay((prev) => prev + value);
      setExpression((prev) => prev + value);
    }
  };

  const handleButtonPress = (btn: CalcButton) => {
    if (isBinary) {
      switch (btn.value) {
        case "clear":
          handleBinaryClear();
          break;
        case "equals":
          handleBinaryEquals();
          break;
        case "backspace":
          handleBinaryBackspace();
          break;
        case "(":
          handleBinaryParen("(");
          break;
        case ")":
          handleBinaryParen(")");
          break;
        default:
          handleBinaryInput(btn.label, btn.value);
      }
      return;
    }

    switch (btn.value) {
      case "clear":
        handleClear();
        break;
      case "paren":
        handleParen();
        break;
      case "equals":
        handleEquals();
        break;
      case "mc":
      case "mr":
      case "m+":
      case "m-":
        handleMemory(btn.value);
        break;
      default:
        if (btn.type === "scientific") {
          handleScientific(btn.value);
        } else {
          handleInput(btn.label, btn.value);
        }
    }
  };

  // Button styling
  const getButtonStyle = (btn: CalcButton) => {
    const base = "h-12 sm:h-14 rounded-2xl text-base sm:text-lg font-medium transition-all duration-150 flex items-center justify-center";

    if (btn.type === "number") {
      return cn(
        base,
        "bg-white/[0.06] hover:bg-white/[0.12] text-white",
        "border border-white/[0.04] hover:border-white/[0.08]",
        "shadow-sm hover:shadow-md hover:shadow-white/5"
      );
    }

    if (btn.type === "operator") {
      return cn(
        base,
        "bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300",
        "border border-indigo-500/20 hover:border-indigo-500/30",
        "shadow-sm hover:shadow-md hover:shadow-indigo-500/10"
      );
    }

    if (btn.type === "action") {
      if (btn.label === "=") {
        return cn(
          base,
          "bg-indigo-500 hover:bg-indigo-400 text-white",
          "shadow-lg shadow-indigo-500/25 hover:shadow-indigo-400/30",
          "border border-indigo-400/30"
        );
      }
      if (btn.label === "C") {
        return cn(
          base,
          "bg-red-500/15 hover:bg-red-500/25 text-red-300",
          "border border-red-500/20 hover:border-red-500/30"
        );
      }
      return cn(
        base,
        "bg-white/[0.06] hover:bg-white/[0.12] text-white/70",
        "border border-white/[0.04]"
      );
    }

    if (btn.type === "scientific") {
      return cn(
        base,
        "bg-white/[0.04] hover:bg-white/[0.08] text-white/60 text-sm",
        "border border-white/[0.03] hover:border-white/[0.06]"
      );
    }

    return base;
  };

  if (!isOpen) {
    return (
      <>
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => store.open()}
          className="fixed bottom-6 right-6 z-[10010] w-14 h-14 rounded-2xl bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center backdrop-blur-xl border border-indigo-400/20 pointer-events-auto"
          style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        >
          <Calculator className="w-6 h-6" />
          <motion.div
            className="absolute inset-0 rounded-2xl bg-indigo-400/20 pointer-events-none"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.button>
        <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            ref={containerRef}
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            drag
            dragControls={dragControls}
            dragMomentum={false}
            dragElastic={0.05}
            dragConstraints={dragBounds}
            onDragEnd={handleDragEnd}
            style={{
              x: springX,
              y: springY,
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 10020,
              width: "min(360px, calc(100vw - 1.5rem))",
              transformOrigin: "top left",
              scale: modalScale,
            }}
            className="select-none"
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-indigo-500/20 rounded-[2rem] blur-xl opacity-50" />

            <div
              ref={contentRef}
              className="relative bg-slate-950/90 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden"
            >
              {/* Top gradient line */}
              <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

              {/* Header / Drag Handle */}
              <div
                className="flex items-center justify-between px-4 pt-3 pb-2 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="flex items-center gap-2">
                  <GripHorizontal className="w-4 h-4 text-white/20" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleScientific}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      isScientific
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "hover:bg-white/10 text-white/40"
                    )}
                    title="Scientific mode"
                  >
                    <FunctionSquare className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleBinary}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      isBinary
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "hover:bg-white/10 text-white/40"
                    )}
                    title="Binary mode"
                  >
                    <Binary className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setHistoryOpen(true)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-colors"
                    title="History"
                  >
                    <History className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={minimize}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 transition-colors"
                    title="Minimize"
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => store.close()}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Display */}
              <div className="px-4 pb-3 sm:px-5">
                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.05]">
                  {/* Expression */}
                  <div
                    ref={displayRef}
                    className="text-right text-white/40 text-sm font-mono min-h-[20px] overflow-x-auto whitespace-nowrap scrollbar-hide"
                  >
                    {activeExpression || "\u00A0"}
                  </div>
                  {/* Main display */}
                  <div className="text-right mt-1">
                    <motion.div
                      key={activeDisplay}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "text-4xl font-light tracking-tight font-mono truncate",
                        activeError ? "text-red-400" : "text-white"
                      )}
                    >
                      {activeDisplay}
                    </motion.div>
                  </div>
                  {/* Preview */}
                  <AnimatePresence>
                    {preview && !activeError && !isBinary && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-right text-indigo-400/60 text-sm font-mono mt-1"
                      >
                        = {preview}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* Memory indicator */}
                  {!isBinary && memory !== 0 && (
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className="text-[10px] text-amber-400/60 uppercase tracking-wider font-medium">
                        M {formatNumber(memory)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {isBinary && (
                <div className="px-4 pb-2 sm:px-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {BINARY_BASES.map((base) => (
                      <button
                        key={base}
                        onClick={() => handleBinaryBaseChange(base)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors",
                          base === binaryBase
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            : "bg-white/[0.04] text-white/40 border border-white/[0.05] hover:bg-white/[0.08]"
                        )}
                      >
                        {base}
                      </button>
                    ))}
                  </div>
                  {binaryBase === "HEX" && (
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {HEX_BUTTONS.map((btn) => (
                        <RippleButton
                          key={btn.label}
                          onClick={() => handleBinaryInput(btn.label, btn.value)}
                          className={getButtonStyle(btn)}
                        >
                          {btn.label}
                        </RippleButton>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {BINARY_BASES.map((base) => (
                      <div
                        key={base}
                        className="bg-white/[0.03] border border-white/[0.05] rounded-lg px-2.5 py-1.5"
                      >
                        <div className="text-[9px] text-white/30 uppercase tracking-wider">
                          {base}
                        </div>
                        <div className="text-xs text-white/70 font-mono truncate">
                          {binaryConversions[base]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scientific Panel */}
              <AnimatePresence>
                {isScientific && !isBinary && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-2">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">
                          Scientific
                        </span>
                        <button
                          onClick={() => setDegMode(!degMode)}
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-md transition-colors",
                            degMode
                              ? "bg-indigo-500/20 text-indigo-400"
                              : "bg-white/5 text-white/30"
                          )}
                        >
                          {degMode ? "DEG" : "RAD"}
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {SCIENTIFIC_BUTTONS.map((row, i) => (
                          <div key={i} className="grid grid-cols-4 gap-1.5">
                            {row.map((btn) => (
                              <RippleButton
                                key={btn.label}
                                onClick={() => handleButtonPress(btn)}
                                className={getButtonStyle(btn)}
                              >
                                {btn.label}
                              </RippleButton>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Memory Buttons */}
              <div className="px-4 pb-2">
                <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                  {MEMORY_BUTTONS.map((btn) => (
                    <RippleButton
                      key={btn.label}
                      onClick={() => handleButtonPress(btn)}
                      className={cn(
                        "h-8 sm:h-9 rounded-xl text-xs font-medium",
                        "bg-white/[0.03] hover:bg-white/[0.06] text-white/50",
                        "border border-white/[0.03]",
                        isBinary && "opacity-40",
                        memory === 0 &&
                          (btn.value === "mr" || btn.value === "mc") &&
                          "opacity-40"
                      )}
                      disabled={
                        isBinary ||
                        (memory === 0 &&
                          (btn.value === "mr" || btn.value === "mc"))
                      }
                    >
                      {btn.label}
                    </RippleButton>
                  ))}
                </div>
              </div>

              {/* Main Keypad */}
              <div className="p-4 pt-2 space-y-1">
                {BASIC_BUTTONS.map((row, i) => (
                  <div key={i} className="grid grid-cols-4 gap-1 sm:gap-1.5">
                    {row.map((btn) => (
                      <RippleButton
                        key={btn.label}
                        onClick={() => handleButtonPress(btn)}
                        disabled={
                          isBinary &&
                          ((btn.type === "number" &&
                            !isValidDigitForBase(btn.value, binaryBase)) ||
                            (btn.value === "." && binaryBase !== "DEC"))
                        }
                        className={cn(
                          getButtonStyle(btn),
                          btn.span === 2 && "col-span-2",
                          isBinary &&
                            ((btn.type === "number" &&
                              !isValidDigitForBase(btn.value, binaryBase)) ||
                              (btn.value === "." && binaryBase !== "DEC")) &&
                            "opacity-40"
                        )}
                      >
                        {btn.label}
                      </RippleButton>
                    ))}
                  </div>
                ))}
              </div>

              {/* Bottom toolbar */}
              <div className="flex items-center justify-between px-5 pb-4 pt-1">
                <div className="flex items-center gap-1">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={isBinary ? handleBinaryUndo : handleUndo}
                    disabled={isBinary ? binaryUndoStack.length === 0 : undoStack.length === 0}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors"
                    title="Undo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={isBinary ? handleBinaryRedo : handleRedo}
                    disabled={isBinary ? binaryRedoStack.length === 0 : redoStack.length === 0}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors"
                    title="Redo"
                  >
                    <RotateCcw className="w-3.5 h-3.5 scale-x-[-1]" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleBackspace}
                    disabled={activeDisplay === "0" && !activeExpression}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors"
                    title="Backspace"
                  >
                    <Delete className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/70 text-xs transition-all border border-white/[0.04]"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized State */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-6 right-6 z-[9999]"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={maximize}
              className="flex items-center gap-3 px-5 py-3 bg-slate-950/90 backdrop-blur-2xl rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50 text-white"
            >
              <Calculator className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-medium">{activeDisplay}</span>
              <Maximize2 className="w-4 h-4 text-white/40" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Panel */}
      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
}