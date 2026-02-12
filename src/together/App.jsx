import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
} from "firebase/firestore";
import {
  StepBack,
  Crown,
  LogOut,
  User,
  CheckCircle,
  AlertTriangle,
  History,
  Home,
  Hash,
  Layers,
  Sparkles,
  Trophy,
  Users,
  RefreshCw,
  Hand,
  X,
  BookOpen,
  Info,
  DoorOpen,
  Trash2,
  RotateCcw,
  FileText,
  Badge,
  Shield,
  Zap,
  ArrowRight,
  Gift,
  Hammer,
  Loader,
  Handshake,
  Copy,
  Play,
} from "lucide-react";
import CoverImage from "./assets/together_cover.png";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "together-game";
const GAME_ID = "23";
const TG_ROOM_KEY = "together_game_roomId";

// --- Constants ---

const COLORS = {
  MAGENTA: {
    id: "M",
    label: "Magenta",
    bg: "bg-pink-600",
    border: "border-pink-400",
    text: "text-white",
    ring: "ring-pink-500",
  },
  LEMON: {
    id: "L",
    label: "Lemon",
    bg: "bg-yellow-400",
    border: "border-yellow-200",
    text: "text-yellow-900",
    ring: "ring-yellow-400",
  },
};

// Teams for 4 or 6 players
const TEAMS = [
  {
    id: "A",
    name: "Team Magenta",
    color: "text-pink-400",
    bg: "bg-pink-900/30",
    border: "border-pink-500/50",
    badgeBg: "bg-pink-900",
  },
  {
    id: "B",
    name: "Team Lemon",
    color: "text-yellow-400",
    bg: "bg-yellow-900/30",
    border: "border-yellow-500/50",
    badgeBg: "bg-yellow-900",
  },
  {
    id: "C",
    name: "Team Cyan",
    color: "text-cyan-400",
    bg: "bg-cyan-900/30",
    border: "border-cyan-500/50",
    badgeBg: "bg-cyan-900",
  },
];

// --- Goal Definitions ---
const GOAL_DB = [
  // --- TIER 1: The Basics (2-3 Points) ---
  // Easy to obtain, keeps the game moving.
  {
    id: "run_3",
    text: "Run of 3",
    points: 2,
    type: "RUN",
    count: 3,
    desc: "Collect any 3 sequential cards (e.g., 5, 6, 7). Colors can be mixed.",
  },
  {
    id: "set_3",
    text: "3 of a Kind",
    points: 2,
    type: "SET",
    count: 3,
    desc: "Collect 3 cards of the same number. Colors can be mixed.",
  },
  {
    id: "pair_1s",
    text: "Paired 1s",
    points: 2, // Was 2. Fair (only 2 cards needed).
    type: "EXACT_SET",
    val: 1,
    count: 2,
    desc: "Collect two cards showing the number 1.",
  },
  {
    id: "odd_colors",
    text: "Odd Color Pair",
    points: 2, // LOWERED from 3. It only requires 2 cards.
    type: "ODD_COLORS",
    desc: "Collect two Odd-numbered cards: one must be Lemon and one Magenta.",
  },
  {
    id: "sum_18_3",
    text: "Sum of 18",
    points: 3,
    type: "SUM",
    count: 3,
    target: 18,
    desc: "Collect 3 cards that add up to exactly 18.",
  },
  {
    id: "low_sum_6",
    text: "Low Sum 6",
    points: 3,
    type: "SUM",
    count: 3,
    target: 6,
    desc: "Collect 3 cards that add up to exactly 6.",
  },
  {
    id: "arith_pair",
    text: "Arithmetic Pair",
    points: 3, // LOWERED from 4. It's just 2 cards.
    type: "ARITHMETIC_PAIR",
    desc: "Collect a Lemon card (X) and a Magenta card (Y) where (Y = X + 3).",
  },
  {
    id: "two_pairs",
    text: "Two Pairs",
    points: 3,
    type: "TWO_PAIRS",
    desc: "Collect two pairs of numbers (e.g., two 3s and two 8s). Colors can be mixed.",
  },

  // --- TIER 2: Intermediate (3-4 Points) ---
  // Requires holding specific cards or larger sets.
  {
    id: "run_4_mixed",
    text: "Run of 4",
    points: 3, // REPLACED 'arith_trip' (duplicate).
    type: "RUN",
    count: 4,
    desc: "Collect any 4 sequential cards (e.g., 2, 3, 4, 5). Colors can be mixed.",
  },
  {
    id: "run_3_blue",
    text: "Lemon Run",
    points: 3,
    type: "RUN",
    count: 3,
    specificColor: "L",
    desc: "Collect 3 sequential cards that are all Lemon.",
  },
  {
    id: "set_6s",
    text: "Set of 6's",
    points: 3, // Specific number set is harder than generic set.
    type: "EXACT_SET",
    val: 6,
    count: 3,
    desc: "Collect three cards showing the number 6.",
  },
  {
    id: "set_odd",
    text: "Odd Set",
    points: 3,
    type: "SET_PARITY",
    count: 3,
    parity: "ODD",
    desc: "Collect 3 cards of the same number, where that number is Odd.",
  },
  {
    id: "set_even",
    text: "Even Set",
    points: 3,
    type: "SET_PARITY",
    count: 3,
    parity: "EVEN",
    desc: "Collect 3 cards of the same number, where that number is Even.",
  },
  {
    id: "even_blues",
    text: "Even Lemons",
    points: 3,
    type: "COLOR_PARITY",
    count: 3,
    color: "L",
    parity: "EVEN",
    desc: "Collect 3 Lemon cards that are all Even numbers.",
  },
  {
    id: "odd_magentas",
    text: "Odd Magentas",
    points: 3,
    type: "COLOR_PARITY",
    count: 3,
    color: "M",
    parity: "ODD",
    desc: "Collect 3 Magenta cards that are all Odd numbers.",
  },
  {
    id: "run_low",
    text: "Low Run",
    points: 4, // BUMPED from 3. Specific sequence is harder than generic.
    type: "EXACT_SEQ",
    seq: [1, 2, 3, 4],
    desc: "Collect the exact sequence 1, 2, 3, 4. Colors can be mixed.",
  },
  {
    id: "run_high",
    text: "High Run",
    points: 4, // BUMPED from 3.
    type: "EXACT_SEQ",
    seq: [5, 6, 7, 8],
    desc: "Collect the exact sequence 5, 6, 7, 8. Colors can be mixed.",
  },
  {
    id: "run_odd",
    text: "Odd Run",
    points: 4,
    type: "EXACT_SEQ",
    seq: [3, 5, 7],
    desc: "Collect the exact sequence 3, 5, 7. Colors can be mixed.",
  },
  {
    id: "set_4",
    text: "4 of a Kind",
    points: 4,
    type: "SET",
    count: 4,
    desc: "Collect 4 cards of the same number. Colors can be mixed.",
  },
  {
    id: "full_house",
    text: "Full House",
    points: 4,
    type: "FULL_HOUSE",
    desc: "Collect a Set of 3 and a Pair (e.g., three 5s and two 8s).",
  },
  {
    id: "mixed_pair",
    text: "Mixed Pairs",
    points: 4,
    type: "MIXED_PAIRS",
    desc: "Collect one Pair of Lemon cards and one Pair of Magenta cards.",
  },
  {
    id: "blue_odds",
    text: "Lemon Odds",
    points: 4,
    type: "COLOR_PARITY",
    count: 4,
    color: "L",
    parity: "ODD",
    desc: "Collect 4 Lemon cards that are all Odd numbers.",
  },
  {
    id: "mag_evens",
    text: "Magenta Evens",
    points: 4,
    type: "COLOR_PARITY",
    count: 4,
    color: "M",
    parity: "EVEN",
    desc: "Collect 4 Magenta cards that are all Even numbers.",
  },
  {
    id: "sum_10_blue",
    text: "Lemon 10",
    points: 4,
    type: "SUM_COLOR",
    count: 3,
    target: 10,
    color: "L",
    desc: "Collect 3 Lemon cards that add up to exactly 10.",
  },
  {
    id: "sum_20_mag",
    text: "Magenta 20",
    points: 4, // LOWERED from 5. Similar difficulty to Lemon 10.
    type: "SUM_COLOR",
    count: 3,
    target: 20,
    color: "M",
    desc: "Collect 3 Magenta cards that add up to exactly 20.",
  },
  {
    id: "even_sum_14",
    text: "Even Sum 14",
    points: 4,
    type: "SUM_PARITY",
    count: 3,
    target: 14,
    parity: "EVEN",
    desc: "Collect 3 Even-numbered cards that add up to exactly 14.",
  },
  {
    id: "odd_sum_15",
    text: "Odd Sum 15",
    points: 4,
    type: "SUM_PARITY",
    count: 3,
    target: 15,
    parity: "ODD",
    desc: "Collect 3 Odd-numbered cards that add up to exactly 15.",
  },
  {
    id: "doubler",
    text: "Doubler",
    points: 4,
    type: "DOUBLER_SUM",
    desc: "Collect 3 cards where two of the same color add up to the number on the other color card.",
  },
  {
    id: "blue_low",
    text: "Lemon Low",
    points: 4,
    type: "COLOR_RANGE",
    count: 4,
    color: "L",
    max: 4,
    desc: "Collect 4 Lemon cards with numbers 4 or lower.",
  },
  {
    id: "mag_high",
    text: "Magenta High",
    points: 4,
    type: "COLOR_RANGE",
    count: 4,
    color: "M",
    min: 5,
    desc: "Collect 4 Magenta cards with numbers 5 or higher.",
  },
  {
    id: "tri_color_set_3",
    text: "Color Set (3's)",
    points: 4,
    type: "SPECIFIC_SET_MIXED",
    val: 3,
    countL: 2,
    countM: 1,
    desc: "Collect three 3s: exactly two must be Lemon and one must be Magenta.",
  },
  {
    id: "sum_12_tri",
    text: "Unique Sum 12",
    points: 4, // LOWERED from 5. Many combos exist (1+3+8, 1+4+7, etc).
    type: "SUM_DIFF",
    count: 3,
    target: 12,
    desc: "Collect 3 cards with different numbers that add up to exactly 12.",
  },

  // --- TIER 3: Hard (5 Points) ---
  // High risk, clogs hand, or very specific.
  {
    id: "run_5",
    text: "Run of 5",
    points: 5, // BUMPED from 4. 5 sequential cards is very hard in a 6-card hand.
    type: "RUN",
    count: 5,
    desc: "Collect any 5 sequential cards (e.g., 2, 3, 4, 5, 6). Colors can be mixed.",
  },
  {
    id: "run_4_col",
    text: "Color Run 4",
    points: 5, // BUMPED from 3. 4 Seq AND Same Color is hard.
    type: "RUN",
    count: 4,
    sameColor: true,
    desc: "Collect 4 sequential cards that share the same color.",
  },
  {
    id: "set_4_8s",
    text: "Four 8s",
    points: 5,
    type: "EXACT_SET",
    val: 8,
    count: 4,
    desc: "Collect four cards showing the number 8.",
  },
  {
    id: "four_sum_28",
    text: "Four 7s",
    points: 5, // RENAMED. Lowered from 6. Effectively "Four 7s".
    type: "EXACT_SET",
    val: 7,
    count: 4,
    desc: "Collect four cards showing the number 7.",
  },
  {
    id: "pure_blue",
    text: "Pure Lemon",
    points: 4,
    type: "PURE_COLOR",
    count: 5,
    color: "L",
    desc: "Collect any 5 Lemon cards, regardless of number.",
  },
  {
    id: "pure_mag",
    text: "Pure Magenta",
    points: 4,
    type: "PURE_COLOR",
    count: 5,
    color: "M",
    desc: "Collect any 5 Magenta cards, regardless of number.",
  },
  {
    id: "sum_25_4",
    text: "Sum of 25",
    points: 5,
    type: "SUM",
    count: 4,
    target: 25,
    desc: "Collect 4 cards that add up to exactly 25.",
  },
  {
    id: "color_run_4",
    text: "Split Color Run",
    points: 5,
    type: "COLOR_SPLIT_RUN",
    desc: "Collect a run of 4 cards: the lower two must be Lemon and the higher two Magenta.",
  },
  {
    id: "high_pairs",
    text: "High Pairs",
    points: 5,
    type: "SPECIFIC_PAIRS",
    vals: [7, 8],
    desc: "Collect a pair of 7s and a pair of 8s.",
  },
  {
    id: "max_min",
    text: "Max/Min Pairs",
    points: 5, // LOWERED from 6. Same difficulty as High Pairs.
    type: "SPECIFIC_PAIRS",
    vals: [1, 8],
    desc: "Collect a pair of 1s and a pair of 8s.",
  },
  {
    id: "blue_even_run",
    text: "Lemon Even Run",
    points: 5, // LOWERED from 6. 3 cards is hard, but not 6-points hard.
    type: "RUN_COLOR_PARITY",
    color: "L",
    parity: "EVEN",
    desc: "Collect 3 Lemon cards that form an Even sequence (2, 4, 6 or 4, 6, 8).",
  },
  {
    id: "mag_odd_set",
    text: "Magenta Odd Set",
    points: 5,
    type: "SET_PARITY_COLOR",
    count: 3,
    parity: "ODD",
    color: "M",
    desc: "Collect 3 Magenta cards of the same Odd number.",
  },

  // --- TIER 4: Elite (6 Points) ---
  // Extremely specific requirements.
  {
    id: "all_four_7s",
    text: "Four Split color 7s",
    points: 6, // BUMPED from 5. Harder than generic Four 7s.
    type: "ALL_FOUR_7S",
    desc: "Collect four 7s: exactly two must be Lemon and two must be Magenta.",
  },
  {
    id: "odd_full_house_blue",
    text: "Odd Lemon House",
    points: 6,
    type: "FULL_HOUSE_COLOR_PARITY",
    color: "L",
    parity: "ODD",
    desc: "Collect a Full House (Set of 3 + Pair) using only Odd-numbered Lemon cards.",
  },
];

// --- Helper Functions ---

const shuffle = (array) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

// Generates 64 cards: 4 sets of 1-8 Magenta, 4 sets of 1-8 Lemon
const generateDeck = () => {
  let deck = [];
  for (let s = 0; s < 4; s++) {
    for (let n = 1; n <= 8; n++) {
      deck.push({ id: `M-${s}-${n}`, color: "M", value: n });
      deck.push({ id: `L-${s}-${n}`, color: "L", value: n });
    }
  }
  return shuffle(deck);
};

const Logo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Handshake size={12} className="text-pink-600" />
    <span className="text-[10px] font-black tracking-widest text-pink-600 uppercase">
      TOGETHER
    </span>
  </div>
);

const LogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Handshake size={22} className="text-pink-600" />
    <span className="text-[20px] font-black tracking-widest text-pink-600 uppercase">
      TOGETHER
    </span>
  </div>
);

// --- VALIDATION ENGINE ---
const validateGoal = (cards, goal) => {
  if (!cards || cards.length === 0) return false;
  const vals = cards.map((c) => c.value).sort((a, b) => a - b);
  const colors = cards.map((c) => c.color);
  // M or L
  const sum = vals.reduce((a, b) => a + b, 0);
  switch (goal.type) {
    case "RUN":
      if (cards.length !== goal.count) return false;
      for (let i = 0; i < vals.length - 1; i++)
        if (vals[i] + 1 !== vals[i + 1]) return false;
      if (goal.sameColor && !colors.every((c) => c === colors[0])) return false;
      if (goal.specificColor && !colors.every((c) => c === goal.specificColor))
        return false;
      return true;
    case "EXACT_SEQ":
      if (cards.length !== goal.seq.length) return false;
      return vals.every((v, i) => v === goal.seq[i]);
    case "SET":
      if (cards.length !== goal.count) return false;
      return vals.every((v) => v === vals[0]);
    case "TWO_PAIRS":
      if (cards.length !== 4) return false;
      // vals sorted: x,x, y,y
      return vals[0] === vals[1] && vals[2] === vals[3] && vals[1] !== vals[2];
    case "FULL_HOUSE":
      if (cards.length !== 5) return false;
      // x,x,x,y,y OR x,x,y,y,y
      const countA = vals.filter((v) => v === vals[0]).length;
      const countB = vals.filter((v) => v === vals[4]).length;
      return (countA === 3 && countB === 2) || (countA === 2 && countB === 3);

    case "SET_PARITY":
      if (cards.length !== goal.count) return false;
      if (!vals.every((v) => v === vals[0])) return false;
      return goal.parity === "ODD" ? vals[0] % 2 !== 0 : vals[0] % 2 === 0;
    case "EXACT_SET":
      if (cards.length !== goal.count) return false;
      return vals.every((v) => v === goal.val);
    case "COLOR_PARITY":
      if (cards.length !== goal.count) return false;
      if (!colors.every((c) => c === goal.color)) return false;
      return goal.parity === "ODD"
        ? vals.every((v) => v % 2 !== 0)
        : vals.every((v) => v % 2 === 0);
    case "COLOR_RANGE":
      if (cards.length !== goal.count) return false;
      if (!colors.every((c) => c === goal.color)) return false;
      if (goal.max) return vals.every((v) => v <= goal.max);
      if (goal.min) return vals.every((v) => v >= goal.min);
      return false;
    case "MIXED_PAIRS":
      if (cards.length !== 4) return false;
      // Need 1 Lemon Pair and 1 Magenta Pair
      const lemons = cards.filter((c) => c.color === "L").map((c) => c.value);
      const magentas = cards.filter((c) => c.color === "M").map((c) => c.value);
      if (lemons.length !== 2 || magentas.length !== 2) return false;
      // Check pairs: since sorted by val doesn't sort by color, we filter
      return lemons[0] === lemons[1] && magentas[0] === magentas[1];
    case "PURE_COLOR":
      if (cards.length !== goal.count) return false;
      return colors.every((c) => c === goal.color);
    case "SUM":
      if (cards.length !== goal.count) return false;
      return sum === goal.target;
    case "SUM_COLOR":
      if (cards.length !== goal.count) return false;
      if (!colors.every((c) => c === goal.color)) return false;
      return sum === goal.target;
    case "SUM_PARITY":
      if (cards.length !== goal.count) return false;
      if (sum !== goal.target) return false;
      const isOdd = goal.parity === "ODD";
      return vals.every((v) => (v % 2 !== 0) === isOdd);
    case "SUM_DIFF":
      if (cards.length !== goal.count) return false;
      if (sum !== goal.target) return false;
      // All must be different
      return new Set(vals).size === vals.length;
    case "DOUBLER_SUM":
      if (cards.length !== 3) return false;
      // Two cards of same color sum to rank of third.
      // cards = [A, B, C]
      for (let i = 0; i < 3; i++) {
        const target = cards[i];
        const others = cards.filter((_, idx) => idx !== i);
        if (
          others[0].color === others[1].color &&
          others[0].value + others[1].value === target.value
        ) {
          return true;
        }
      }
      return false;
    case "COLOR_SPLIT_RUN":
      // 1. Must be exactly 4 cards
      if (cards.length !== 4) return false;

      // 2. Must be a sequential run (e.g., 4,5,6,7)
      // Note: vals is already sorted in the main function scope
      for (let i = 0; i < vals.length - 1; i++) {
        if (vals[i] + 1 !== vals[i + 1]) return false;
      }

      // 3. Sort cards explicitly by value to check color order
      // (We sort the card objects themselves, not just values)
      const sortedCards = [...cards].sort((a, b) => a.value - b.value);

      // 4. Check Colors: Lowest 2 must be Lemon (L), Highest 2 must be Magenta (M)
      const c1 = sortedCards[0].color; // Lowest card
      const c2 = sortedCards[1].color; // 2nd Lowest
      const c3 = sortedCards[2].color; // 2nd Highest
      const c4 = sortedCards[3].color; // Highest card

      // REMOVED INVALID "Prompt..." LINE HERE
      return c1 === "L" && c2 === "L" && c3 === "M" && c4 === "M";
    case "SPECIFIC_PAIRS": // High Pairs / Max Min
      if (cards.length !== 4) return false;
      // vals sorted x,x,y,y
      if (vals[0] !== vals[1] || vals[2] !== vals[3]) return false;
      return vals[0] === goal.vals[0] && vals[2] === goal.vals[1]; // goal.vals must be sorted [low, high]

    case "ODD_COLORS":
      if (cards.length !== 2) return false;
      if (vals.some((v) => v % 2 === 0)) return false;
      // Must be odd
      return colors.includes("L") && colors.includes("M");
    case "ALL_FOUR_7S":
      if (cards.length !== 4) return false;
      if (!vals.every((v) => v === 7)) return false;
      const cL = colors.filter((c) => c === "L").length;
      const cM = colors.filter((c) => c === "M").length;
      return cL === 2 && cM === 2;
    case "ARITHMETIC_PAIR":
      if (cards.length !== 2) return false;
      // L and M, Y = X+3 where Y is M and X is L
      const cardL = cards.find((c) => c.color === "L");
      const cardM = cards.find((c) => c.color === "M");
      if (!cardL || !cardM) return false;
      return cardM.value === cardL.value + 3;
    case "FULL_HOUSE_COLOR_PARITY":
      if (cards.length !== 5) return false;
      if (!colors.every((c) => c === goal.color)) return false;
      const isOddFH = goal.parity === "ODD";
      if (!vals.every((v) => (v % 2 !== 0) === isOddFH)) return false;
      // Check FH
      const countA2 = vals.filter((v) => v === vals[0]).length;
      const countB2 = vals.filter((v) => v === vals[4]).length;
      return (
        (countA2 === 3 && countB2 === 2) || (countA2 === 2 && countB2 === 3)
      );
    case "RUN_COLOR_PARITY": // Lemon-Even Run (2,4,6 etc)
      if (cards.length !== 3) return false;
      if (!colors.every((c) => c === goal.color)) return false;
      const isOddRun = goal.parity === "ODD";
      if (!vals.every((v) => (v % 2 !== 0) === isOddRun)) return false;
      // Check gap of 2
      return vals[1] === vals[0] + 2 && vals[2] === vals[1] + 2;
    case "SET_PARITY_COLOR":
      if (cards.length !== goal.count) return false;
      if (!colors.every((c) => c === goal.color)) return false;
      if (!vals.every((v) => v === vals[0])) return false;
      const isOddSet = goal.parity === "ODD";
      return (vals[0] % 2 !== 0) === isOddSet;
    case "SPECIFIC_SET_MIXED": // Tri-Color Set (3s)
      if (cards.length !== 3) return false;
      if (!vals.every((v) => v === goal.val)) return false;
      const countL_S = colors.filter((c) => c === "L").length;
      const countM_S = colors.filter((c) => c === "M").length;
      return countL_S === goal.countL && countM_S === goal.countM;
    default:
      return false;
  }
};

// --- Components ---

const FloatingBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black" />
    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-pink-600/30 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-yellow-400/30 rounded-full blur-3xl animate-pulse delay-700" />
  </div>
);

const EventModal = ({ event, onClose, currentUserId }) => {
  if (!event) return null;
  const { type, actorName, data, actorId, targetId } = event;
  const isTeammate = currentUserId === targetId;
  const isActor = currentUserId === actorId;

  // Don't show modal to the person who did the action (except specific confirmations if needed, but per request "to all others")
  // However, for trades, we show receiver (teammate) a specific modal.
  if (isActor) return null;

  let content = null;
  let title = "";
  let icon = null;
  switch (type) {
    case "GOAL_CHANGE":
      title = "Goal Changed";
      icon = <RefreshCw className="text-purple-400" size={32} />;
      content = (
        <div className="flex flex-col gap-4">
          <div className="text-center text-slate-300">
            <span className="font-bold text-white">{actorName}</span> changed{" "}
            {data.goalType === "PERSONAL" ? "their" : "the"}{" "}
            <span className="font-bold text-purple-400">
              {data.goalType === "PERSONAL" ? "Personal" : "Public"}
            </span>{" "}
            Goal!
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="opacity-60 scale-75 origin-right">
              <GoalCard goal={data.oldGoal} small />
              <div className="text-center text-xs mt-1 text-slate-500">OLD</div>
            </div>
            <ArrowRight className="text-slate-500" />
            <div className="scale-90 origin-left">
              <GoalCard goal={data.newGoal} small />
              <div className="text-center text-xs mt-1 text-green-400">NEW</div>
            </div>
          </div>
        </div>
      );
      break;
    case "GOAL_CLAIM":
      title = "Goal Completed!";
      icon = <Trophy className="text-yellow-400" size={32} />;
      content = (
        <div className="flex flex-col gap-4 items-center">
          <div className="text-center text-slate-300">
            <span className="font-bold text-white">{actorName}</span> completed{" "}
            {data.goalType === "PERSONAL" ? "their" : "the"}{" "}
            <span className="font-bold text-yellow-400">{data.goalType}</span>{" "}
            goal!
          </div>
          <GoalCard goal={data.goal} />
          <div className="flex gap-1 justify-center bg-slate-800/50 p-2 rounded-xl mt-2">
            {data.cards.map((c, idx) => (
              <Card key={idx} card={c} tiny />
            ))}
          </div>
        </div>
      );
      break;

    case "TRADE":
      if (isTeammate) {
        title = "Trade Received";
        icon = <Gift className="text-blue-400" size={32} />;
        content = (
          <div className="flex flex-col gap-4 items-center">
            <div className="text-center text-slate-300">
              <span className="font-bold text-white">{actorName}</span> sent you
              cards!
            </div>
            <div className="flex gap-2 justify-center">
              {data.cards.map((c, idx) => (
                <Card key={idx} card={c} small />
              ))}
            </div>
          </div>
        );
      } else {
        title = "Trade Occurred";
        icon = <Hand className="text-blue-400" size={32} />;
        content = (
          <div className="flex flex-col gap-4 items-center">
            <div className="text-center text-slate-300 text-lg">
              <span className="font-bold text-white">{actorName}</span> gave{" "}
              <span className="font-bold text-blue-400">
                {data.count} card{data.count > 1 ? "s" : ""}
              </span>{" "}
              to <span className="font-bold text-white">{data.targetName}</span>
              .
            </div>
          </div>
        );
      }
      break;

    default:
      return null;
  }

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 animate-in fade-in duration-300 pointer-events-none">
      <div className="bg-slate-900/95 border-2 border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative pointer-events-auto transform transition-all scale-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white"
        >
          <X size={24} />
        </button>
        <div className="flex flex-col items-center">
          <div className="mb-4 bg-slate-800 p-3 rounded-full border border-slate-700">
            {icon}
          </div>
          <h3 className="text-2xl font-black text-white mb-4">{title}</h3>
          {content}
          <button
            onClick={onClose}
            className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

const LeaveConfirmModal = ({
  onConfirmLeave,
  onConfirmLobby,
  onCancel,
  isHost,
  inGame,
}) => (
  <div className="fixed inset-0 z-200 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
      <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
      <h3 className="text-xl font-bold text-white mb-2">Leave Game?</h3>
      <p className="text-slate-400 mb-6">
        {inGame
          ? "Leaving now will disrupt the game!"
          : "You will be removed from the lobby."}
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onCancel}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Stay (Cancel)
        </button>
        {isHost && inGame && (
          <button
            onClick={onConfirmLobby}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Home size={18} /> Return Everyone to Lobby
          </button>
        )}
        <button
          onClick={onConfirmLeave}
          className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} />{" "}
          {isHost && inGame ? "End Game for All" : "Leave Room"}
        </button>
      </div>
    </div>
  </div>
);

const InfoModal = ({ goal, onClose }) => (
  <div
    className="fixed inset-0 z-100 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200"
    onClick={onClose}
  >
    <div
      className="bg-slate-900 border-2 border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-500 hover:text-white"
      >
        <X size={24} />
      </button>

      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-2">
          <Info size={32} className="text-pink-400" />
        </div>

        <h3 className="text-2xl font-black text-white">{goal.text}</h3>

        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 w-full">
          <p className="text-slate-300 font-medium text-lg leading-relaxed">
            {goal.desc || "No description available."}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Trophy className="text-yellow-400" size={20} />
          <span className="text-xl font-bold text-yellow-400">
            {goal.points} Points
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl mt-4 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  </div>
);

const ReportCard = ({ completedGoals, onClose }) => {
  // Sort goals by team
  const sortedGoals = [...completedGoals].sort((a, b) =>
    a.teamId.localeCompare(b.teamId),
  );
  return (
    <div className="fixed inset-0 z-200 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <FileText className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-black text-white">Game Report Card</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {TEAMS.map((team) => {
            const teamGoals = sortedGoals.filter((g) => g.teamId === team.id);
            if (teamGoals.length === 0) return null;

            return (
              <div
                key={team.id}
                className={`border-l-4 ${team.border} pl-6 py-2`}
              >
                <h3 className={`text-xl font-black mb-4 ${team.color}`}>
                  {team.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamGoals.map((g, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-white text-lg">
                            {g.goal.text}
                          </div>
                          <div className="text-xs text-slate-400">
                            Completed by {g.playerName}
                          </div>
                        </div>
                        <div className="bg-yellow-400/10 text-yellow-400 font-bold px-2 py-1 rounded text-xs border border-yellow-400/20">
                          +{g.points} pts
                        </div>
                      </div>

                      {/* Mini Cards Used */}
                      <div className="flex gap-1 justify-center bg-slate-900/50 p-2 rounded-lg">
                        {g.cards.map((c, cIdx) => (
                          <Card key={cIdx} card={c} tiny />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800 text-center bg-slate-800/30 rounded-b-2xl">
          <button
            onClick={onClose}
            className="bg-white text-slate-900 font-bold px-8 py-3 rounded-xl hover:scale-105 transition-transform"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

const Card = ({ card, onClick, selected, small, disabled, tiny }) => {
  if (!card)
    return (
      <div
        className={`border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/50 ${
          small ? "w-10 h-14" : "w-20 h-28"
        }`}
      ></div>
    );
  const theme = card.color === "M" ? COLORS.MAGENTA : COLORS.LEMON;
  if (tiny) {
    return (
      <div
        className={`w-6 h-8 rounded flex items-center justify-center text-xs font-black ${theme.bg} ${theme.text} border border-white/20 shadow-sm`}
      >
        {card.value}
      </div>
    );
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        relative rounded-xl font-black flex flex-col items-center justify-center transition-all shadow-lg select-none
        ${
          small
            ? "w-12 h-16 text-xl"
            : "w-20 h-28 md:w-24 md:h-32 text-4xl md:text-5xl"
        }
        ${theme.bg} ${theme.text} ${theme.border} border-b-4
        ${selected ? `ring-2 ring-white -translate-y-2 z-10 scale-105` : ""}
        ${
          disabled
            ? "opacity-40 cursor-not-allowed grayscale-[0.3]"
            : "hover:brightness-110 cursor-pointer active:scale-95"
        }
      `}
    >
      <span>{card.value}</span>
      {!small && (
        <>
          <span className="absolute top-1 left-2 text-[10px] opacity-70">
            {theme.id}
          </span>
          <span className="absolute bottom-1 right-2 text-[10px] opacity-70 rotate-180">
            {theme.id}
          </span>
        </>
      )}
    </button>
  );
};

const GoalCard = ({
  goal,
  isPublic,
  isPersonal,
  completed,
  onClick,
  selected,
  small,
}) => (
  <div
    onClick={onClick}
    className={`
      relative rounded-xl border flex flex-col items-center justify-center text-center overflow-hidden transition-all
      ${
        completed
          ? "bg-green-900/40 border-green-500 opacity-60"
          : isPublic
            ? "bg-indigo-900/60 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            : "bg-slate-800 border-slate-600"
      }
      ${selected ? "ring-2 ring-white scale-105 z-20" : ""}
      ${
        small
          ? "w-24 h-16 p-1"
          : "w-full h-full min-h-[100px] p-2 hover:bg-slate-700 cursor-pointer"
      }
    `}
  >
    {isPublic && !small && (
      <div className="absolute top-0 inset-x-0 bg-indigo-600 text-[9px] font-bold text-white uppercase tracking-widest py-0.5">
        Public Goal
      </div>
    )}
    {isPersonal && !small && (
      <div className="absolute top-0 inset-x-0 bg-pink-600 text-[9px] font-bold text-white uppercase tracking-widest py-0.5">
        My Goal
      </div>
    )}

    <div className="flex-1 flex items-center justify-center px-1">
      <p
        className={`text-white font-bold ${
          small
            ? "text-[9px] leading-tight line-clamp-2"
            : "text-xs md:text-sm leading-tight"
        }`}
      >
        {goal?.text || "???"}
      </p>
    </div>

    {!small && (
      <div className="mt-1 flex items-center gap-1 bg-black/40 px-2 rounded-full">
        <Trophy size={10} className="text-yellow-400" />
        <span className="text-yellow-400 font-bold text-xs">
          {goal?.points} pts
        </span>
      </div>
    )}

    {completed && (
      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
        <CheckCircle
          className="text-green-500 drop-shadow-lg"
          size={small ? 20 : 32}
        />
      </div>
    )}
  </div>
);

// --- UPDATED SPLASH SCREEN (Zoom Effect + Button Timer) ---
const SplashScreen = ({ onStart }) => {
  const [hasSession, setHasSession] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [mounted, setMounted] = useState(false); // New state for image animation

  useEffect(() => {
    // 1. Trigger image zoom-out animation immediately
    setMounted(true);

    // 2. Check session
    const saved = localStorage.getItem("TG_ROOM_KEY");
    setHasSession(!!saved);

    // 3. Timer: Wait 2 seconds before showing the button
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-end pb-20 md:justify-center md:pb-0 font-sans overflow-hidden">
      
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div 
          className={`w-full h-full bg-cover bg-center transition-transform duration-[2000ms] ease-out ${
            mounted ? "scale-100" : "scale-130"
          }`}
          style={{ backgroundImage: `url(${CoverImage})` }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        
        {/* Big Logo Title (Kept exactly as requested) */}
        

        {/* Pulsing Action Button with Slide-In Logic */}
        <div 
          className={`transform transition-all duration-1000 ease-out ${
            showButton ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
          }`}
        >
          <button
            onClick={onStart}
            className="group relative px-12 py-5 bg-pink-600/20 hover:bg-pink-600/40 border border-pink-500/50 hover:border-pink-400 text-pink-300 font-black text-2xl tracking-widest rounded-none transform transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] backdrop-blur-md overflow-hidden"
          >
            {/* Animated Scanline overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-400/10 to-transparent translate-y-[-100%] animate-[scan_2s_infinite_linear]" />
            
            <span className="relative z-10 flex items-center gap-3 animate-pulse">
              {hasSession ? (
                <>
                  <RotateCcw className="animate-spin-slow" /> RESUME
                </>
              ) : (
                <>
                  <Play /> PLAY
                </>
              )}
            </span>
          </button>
        </div>

      </div>

      {/* CSS for scanline animation */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
      `}</style>
    </div>
  );
};

// --- Main Game Component ---

export default function TogetherGame() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("splash");

  const [roomCodeInput, setRoomCodeInput] = useState("");
  // Initialize roomId from localStorage if available to persist session
  const [roomId, setRoomId] = useState(
    () => localStorage.getItem(TG_ROOM_KEY) || "",
  );
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  // Local UI State
  const [selectedCards, setSelectedCards] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewingGoal, setViewingGoal] = useState(null);
  // Event Modal State
  const [activeEvent, setActiveEvent] = useState(null);
  const [lastProcessedEventId, setLastProcessedEventId] = useState(0);

  // --- NEW STATE: Context Menu Control ---
  const [activeGoalMenu, setActiveGoalMenu] = useState(null); // 'PERSONAL' | 'PUBLIC' | null
  const [activePartnerId, setActivePartnerId] = useState(null); // ID of partner clicked

  //read and fill global name
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem("gameHub_playerName") || "",
  );
  //set global name for all game
  useEffect(() => {
    if (playerName) localStorage.setItem("gameHub_playerName", playerName);
  }, [playerName]);

  // Auth Init
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    onAuthStateChanged(auth, setUser);
  }, []);

  // 3. NEW FUNCTION: Handle Splash Button Click
  const handleSplashStart = () => {
    const savedRoomId = localStorage.getItem("TG_ROOM_KEY");

    if (savedRoomId) {
      // Resume: Set the room ID, which triggers the existing logic to connect
      setRoomId(savedRoomId);
      // We switch to 'menu' briefly; if the connection works,
      // the existing listener will auto-switch to 'lobby' or 'game'
      setView("menu");
    } else {
      // New Game: Just go to menu
      setView("menu");
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists() && doc.data()[GAME_ID]?.maintenance)
        setIsMaintenance(true);
      else setIsMaintenance(false);
    });
    return () => unsub();
  }, []);

  // Room Sync & Event Listener
  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (!data.players.some((p) => p.id === user.uid)) {
            setRoomId("");
            localStorage.removeItem(TG_ROOM_KEY);
            setView("menu");
            setError("You were removed.");
            return;
          }

          setGameState(data);
          setView(data.status === "lobby" ? "lobby" : "game");

          // Handle Events Logic
          if (data.lastEvent && data.lastEvent.id !== lastProcessedEventId) {
            setLastProcessedEventId(data.lastEvent.id);
            // Only show modal if user is not the actor (unless specific logic applies later)
            // But we filter inside the modal component for cleaner state logic
            setActiveEvent(data.lastEvent);
          }
        } else {
          setRoomId("");
          localStorage.removeItem(TG_ROOM_KEY);
          setView("menu");
          setError("Room ended.");
        }
      },
    );
    return () => unsub();
  }, [roomId, user, lastProcessedEventId]);

  // --- Actions ---

  const toggleReady = async () => {
    if (!gameState || !user) return;
    const updatedPlayers = gameState.players.map((p) =>
      p.id === user.uid ? { ...p, ready: !p.ready } : p,
    );
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players: updatedPlayers },
    );
  };

  const createRoom = async () => {
    if (!playerName) return setError("Name required");
    setLoading(true);
    const chars = "123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";
    let newId = "";
    for (let i = 0; i < 6; i++) {
      newId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const initialData = {
      roomId: newId,
      hostId: user.uid,
      status: "lobby",
      players: [
        { id: user.uid, name: playerName, teamId: "A", hand: [], ready: false },
      ],
      logs: [],
      completedGoals: [],
      lastEvent: null, // Init lastEvent
    };
    await setDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
      initialData,
    );
    setRoomId(newId);
    localStorage.setItem(TG_ROOM_KEY, newId);
    setView("lobby");
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCodeInput || !playerName) return setError("Enter Code and Name");
    setLoading(true);
    const ref = doc(
      db,
      "artifacts",
      APP_ID,
      "public",
      "data",
      "rooms",
      roomCodeInput,
    );
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      setLoading(false);
      return setError("Room not found");
    }
    const data = snap.data();
    if (data.status !== "lobby") {
      setLoading(false);
      return setError("Game in progress");
    }
    if (data.players.length >= 6) {
      setLoading(false);
      return setError("Room full");
    }

    const pCount = data.players.length;
    let teamId = "A";
    if (pCount === 1) teamId = "B";
    if (pCount === 2) teamId = "A";
    if (pCount === 3) teamId = "B";

    const newPlayers = [
      ...data.players,
      { id: user.uid, name: playerName, teamId: null, hand: [], ready: false },
    ];
    await updateDoc(ref, { players: newPlayers });
    setRoomId(roomCodeInput);
    localStorage.setItem(TG_ROOM_KEY, roomCodeInput);
    setLoading(false);
  };

  const copyToClipboard = () => {
    const textToCopy = gameState.roomId;

    // Logic to show the popup and hide it after 2 seconds
    const handleSuccess = () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);

      // Keep your existing global feedback if needed
      if (triggerFeedback)
        triggerFeedback("neutral", "COPIED!", "", CheckCircle);
    };

    try {
      navigator.clipboard.writeText(textToCopy);
      handleSuccess();
    } catch (e) {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = textToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      handleSuccess();
    }
  };

  const startGame = async () => {
    const pCount = gameState.players.length;
    if (pCount !== 4 && pCount !== 6) {
      alert("Strictly 4 or 6 players required.");
      return;
    }

    const players = [...gameState.players];
    const teamsInPlay = pCount === 4 ? ["A", "B"] : ["A", "B", "C"];

    players.forEach((p, i) => {
      if (pCount === 4) p.teamId = i % 2 === 0 ? "A" : "B";
      else p.teamId = i % 3 === 0 ? "A" : i % 3 === 1 ? "B" : "C";
      p.hand = [];
      p.score = 0;
      p.ready = false;
    });
    const deck = generateDeck();
    const goalDeck = shuffle([...GOAL_DB]); // Clone and shuffle, removed 3x generation
    const market = [deck.pop(), deck.pop(), deck.pop()];
    const publicGoal = goalDeck.pop();
    players.forEach((p, i) => {
      const count = i === 0 ? 1 : i === 1 ? 2 : 3;
      for (let k = 0; k < count; k++) p.hand.push(deck.pop());
      p.personalGoal = goalDeck.pop();
    });
    // Initialize teamScores only for active teams
    const initialTeamScores = {};
    teamsInPlay.forEach((tid) => {
      initialTeamScores[tid] = { goals: 0, points: 0 };
    });

    // CHANGE: logic for turnPhase
    // First player checks limit if applicable, otherwise PLAYING (flexible order)
    const firstPlayer = players[0];
    const initialPhase =
      firstPlayer.hand.length > 6 ? "CHECK_LIMIT" : "PLAYING";

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        players,
        deck,
        market,
        goalDeck,
        publicGoal,
        turnIndex: 0,
        turnPhase: initialPhase, // Set based on hand size
        cardsDrawn: 0,
        tradesPerformed: 0,
        goalChanged: false,
        teamScores: initialTeamScores,
        completedGoals: [],
        lastEvent: { id: Date.now(), type: "GAME_START", actorName: "System" },
        logs: [
          { id: Date.now(), text: "Game Started! Good Luck.", type: "neutral" },
        ],
      },
    );
  };

  const leaveRoom = async () => {
    if (!roomId || !user) return;
    const roomRef = doc(
      db,
      "artifacts",
      APP_ID,
      "public",
      "data",
      "rooms",
      roomId,
    );
    try {
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const data = snap.data();

        // 1. HOST LEAVES: Destroy Room
        if (data.hostId === user.uid) {
          await deleteDoc(roomRef);
        } else {
          // 2. GUEST LEAVES: Fix Index Logic
          const leavingPlayerIndex = data.players.findIndex(
            (p) => p.id === user.uid,
          );
          const newPlayers = data.players.filter((p) => p.id !== user.uid);

          if (newPlayers.length === 0) {
            await deleteDoc(roomRef);
          } else {
            // --- FIX START ---
            let newTurnIndex = data.turnIndex;
            let shouldResetTurnVars = false;

            if (leavingPlayerIndex < data.turnIndex) {
              // Someone BEFORE the active player left. Shift index down 1 to keep focus on the same player.
              newTurnIndex = Math.max(0, data.turnIndex - 1);
            } else if (leavingPlayerIndex === data.turnIndex) {
              // The ACTIVE player left. The turn passes to the person who slid into this slot.
              // We must reset turn variables so the new player doesn't inherit "2 cards drawn" state.
              shouldResetTurnVars = true;
            }

            // Safety: If index is out of bounds (e.g., last player left), wrap to 0
            if (newTurnIndex >= newPlayers.length) {
              newTurnIndex = 0;
            }

            const updates = {
              players: newPlayers,
              turnIndex: newTurnIndex,
              logs: arrayUnion({
                id: Date.now(),
                text: `${playerName} left the game.`,
                type: "danger",
              }),
            };

            // If the active player left, reset the turn phase for the next person
            if (shouldResetTurnVars && newPlayers.length > 0) {
              const nextPlayer = newPlayers[newTurnIndex];
              updates.turnPhase =
                nextPlayer.hand.length > 6 ? "CHECK_LIMIT" : "PLAYING";
              updates.cardsDrawn = 0;
              updates.tradesPerformed = 0;
              updates.goalChanged = false;
            }

            await updateDoc(roomRef, updates);
            // --- FIX END ---
          }
        }
      }
    } catch (e) {
      console.error("Error leaving room", e);
    }
    setRoomId("");
    localStorage.removeItem(TG_ROOM_KEY);
    setView("menu");
    setGameState(null);
    setShowLeaveConfirm(false);
  };

  const resetToLobby = async () => {
    if (!gameState || gameState.hostId !== user.uid) return;
    const players = gameState.players.map((p) => ({
      ...p,
      hand: [],
      ready: false,
      score: 0,
      personalGoal: null,
    }));
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        players,
        deck: [],
        market: [],
        goalDeck: [],
        publicGoal: null,
        logs: [],
        teamScores: {},
        completedGoals: [],
        turnIndex: 0,
        lastEvent: null,
      },
    );
    setShowLeaveConfirm(false);
  };

  const restartGame = async () => {
    await startGame();
  };

  const kickPlayer = async (pid) => {
    if (!gameState || gameState.hostId !== user.uid) return;
    const players = gameState.players.filter((p) => p.id !== pid);
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players },
    );
  };

  const handleDiscard = async (card) => {
    const pIndex = gameState.players.findIndex((p) => p.id === user.uid);
    const p = gameState.players[pIndex];

    const newHand = p.hand.filter((c) => c.id !== card.id);
    const updates = {};
    updates[`players`] = [...gameState.players];
    updates[`players`][pIndex].hand = newHand;

    // RECYCLE: Add discarded card to bottom of deck (beginning of array if we pop from end)
    updates[`deck`] = [card, ...gameState.deck];

    // CHANGE: If hand is valid, go to PLAYING
    if (newHand.length <= 6) {
      updates.turnPhase = "PLAYING";
    }

    updates.logs = arrayUnion({
      id: Date.now(),
      text: `${p.name} discarded a card (Recycled).`,
      type: "neutral",
    });
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      updates,
    );
  };

  const handleDraw = async (sourceIdx) => {
    // CHANGE: Check if max drawn
    if (gameState.cardsDrawn >= 2) {
      alert("You have already drawn 2 cards this turn.");
      return;
    }

    const pIndex = gameState.players.findIndex((p) => p.id === user.uid);
    const p = gameState.players[pIndex];
    let card;
    let updates = {
      players: [...gameState.players],
      deck: [...gameState.deck],
      market: [...gameState.market],
    };
    if (sourceIdx === -1) {
      card = updates.deck.pop();
    } else {
      card = updates.market[sourceIdx];
      updates.market[sourceIdx] =
        updates.deck.length > 0 ? updates.deck.pop() : null;
    }

    updates.players[pIndex].hand.push(card);
    const newCount = gameState.cardsDrawn + 1;
    updates.cardsDrawn = newCount;
    let msg =
      sourceIdx === -1 ? "drew from deck" : `took ${card.value} from market`;
    updates.logs = arrayUnion({
      id: Date.now(),
      text: `${p.name} ${msg}.`,
      type: "neutral",
    });

    // CHANGE: Do NOT auto switch phase. Stay in PLAYING.
    // If we were in PLAYING, we stay there.
    // If we were in CHECK_LIMIT (shouldn't happen because draw is disabled then), logic handles it.

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      updates,
    );
  };

  const handleChangeGoal = async (type) => {
    if (gameState.goalChanged) {
      alert("You can only change a goal once per turn.");
      return;
    }

    const pIndex = gameState.players.findIndex((p) => p.id === user.uid);
    const p = gameState.players[pIndex];
    const updates = {
      players: [...gameState.players],
      goalDeck: [...gameState.goalDeck],
      publicGoal: gameState.publicGoal,
    };
    let oldGoal;
    let newGoal;
    if (type === "PERSONAL") {
      oldGoal = p.personalGoal;
      // RECYCLE: Skipped goal goes to bottom
      updates.goalDeck.unshift(oldGoal);
      newGoal = updates.goalDeck.pop();
      updates.players[pIndex].personalGoal = newGoal;
    } else {
      oldGoal = gameState.publicGoal;
      // RECYCLE: Skipped goal goes to bottom
      updates.goalDeck.unshift(oldGoal);
      newGoal = updates.goalDeck.pop();
      updates.publicGoal = newGoal;
    }

    updates.goalChanged = true;
    updates.logs = arrayUnion({
      id: Date.now(),
      text: `${p.name} changed the ${
        type === "PERSONAL" ? "Personal" : "Public"
      } Goal.`,
      type: "neutral",
    });
    // EVENT MODAL UPDATE
    updates.lastEvent = {
      id: Date.now(),
      type: "GOAL_CHANGE",
      actorId: user.uid,
      actorName: p.name,
      data: {
        oldGoal: oldGoal,
        newGoal: newGoal,
        goalType: type,
      },
    };
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      updates,
    );
  };

  const handleClaimGoal = async (targetType) => {
    const pIndex = gameState.players.findIndex((p) => p.id === user.uid);
    const p = gameState.players[pIndex];
    const goal =
      targetType === "PERSONAL" ? p.personalGoal : gameState.publicGoal;
    if (!validateGoal(selectedCards, goal)) {
      alert("Invalid selection for this goal!");
      return;
    }

    const updates = {
      players: [...gameState.players],
      goalDeck: [...gameState.goalDeck],
      teamScores: { ...gameState.teamScores },
      deck: [...gameState.deck],
    };
    const usedIds = selectedCards.map((c) => c.id);
    updates.players[pIndex].hand = p.hand.filter(
      (c) => !usedIds.includes(c.id),
    );
    // RECYCLE: Used cards go to bottom of deck
    updates.deck = [...selectedCards, ...updates.deck];

    const teamId = p.teamId;
    updates.teamScores[teamId].goals += 1;
    updates.teamScores[teamId].points += goal.points;

    // RECORD: Report Card entry
    const achievement = {
      id: Date.now(),
      teamId: teamId,
      playerName: p.name,
      goal: goal,
      cards: selectedCards,
      points: goal.points,
    };
    updates.completedGoals = arrayUnion(achievement);

    if (targetType === "PERSONAL") {
      updates.players[pIndex].personalGoal = updates.goalDeck.pop();
    } else {
      updates.publicGoal = updates.goalDeck.pop();
    }

    let logType = "success";
    let logText = `${p.name} claimed ${goal.text} (+${goal.points}pts)!`;

    if (updates.teamScores[teamId].goals >= 8) {
      updates.status = "finished";
      logText = `GAME OVER! ${
        TEAMS.find((t) => t.id === teamId).name
      } completed 8 goals!`;
    }

    updates.logs = arrayUnion({ id: Date.now(), text: logText, type: logType });
    // EVENT MODAL UPDATE
    updates.lastEvent = {
      id: Date.now(),
      type: "GOAL_CLAIM",
      actorId: user.uid,
      actorName: p.name,
      data: {
        goal: goal,
        cards: selectedCards,
        goalType: targetType,
      },
    };
    setSelectedCards([]);

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      updates,
    );
  };

  const handleTrade = async (partnerId) => {
    if (gameState.tradesPerformed >= 2) {
      alert("Max 2 cards per turn.");
      return;
    }
    if (selectedCards.length !== 1 && selectedCards.length !== 2) {
      alert("Select 1 or 2 cards.");
      return;
    }
    if (gameState.tradesPerformed + selectedCards.length > 2) {
      alert("Can only trade 2 total.");
      return;
    }

    const pIndex = gameState.players.findIndex((p) => p.id === user.uid);
    const partnerIdx = gameState.players.findIndex((p) => p.id === partnerId);
    const partner = gameState.players[partnerIdx];

    const updates = { players: [...gameState.players] };
    const tradeIds = selectedCards.map((c) => c.id);
    updates.players[pIndex].hand = updates.players[pIndex].hand.filter(
      (c) => !tradeIds.includes(c.id),
    );
    updates.players[partnerIdx].hand.push(...selectedCards);

    updates.tradesPerformed = gameState.tradesPerformed + selectedCards.length;
    updates.logs = arrayUnion({
      id: Date.now(),
      text: `${gameState.players[pIndex].name} gave ${selectedCards.length} card(s) to ${gameState.players[partnerIdx].name}.`,
      type: "neutral",
    });
    // EVENT MODAL UPDATE
    updates.lastEvent = {
      id: Date.now(),
      type: "TRADE",
      actorId: user.uid,
      actorName: gameState.players[pIndex].name,
      targetId: partnerId,
      targetName: partner.name,
      data: {
        count: selectedCards.length,
        cards: selectedCards, // Sent so teammate can see them
        targetName: partner.name, // Ensure this is present
      },
    };

    setSelectedCards([]);
    // Close context menu if open
    setActivePartnerId(null);

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      updates,
    );
  };

  const endTurn = async () => {
    // CHANGE: Strict check before passing
    if (gameState.cardsDrawn < 2) {
      alert("You must draw 2 cards before passing your turn.");
      return;
    }

    const nextIndex = (gameState.turnIndex + 1) % gameState.players.length;
    const nextPlayer = gameState.players[nextIndex];

    // CHANGE: Next phase logic
    const nextPhase = nextPlayer.hand.length > 6 ? "CHECK_LIMIT" : "PLAYING";

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        turnIndex: nextIndex,
        turnPhase: nextPhase,
        cardsDrawn: 0,
        tradesPerformed: 0,
        goalChanged: false,
        logs: arrayUnion({
          id: Date.now(),
          text: `Turn passed to ${nextPlayer.name}`,
          type: "neutral",
        }),
      },
    );
  };

  // --- Render ---

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <LogoBig />
        <div className="bg-orange-500/10 p-8 rounded-2xl border border-orange-500/30">
          <Hammer
            size={64}
            className="text-orange-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
          <p className="text-gray-400">
            The bond is broken. Take some time to rescue your friendship.
          </p>
        </div>
        <div className="h-8"></div>
        <a href={import.meta.env.BASE_URL}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-center pb-12 animate-pulse">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900/50 rounded-full border border-indigo-500/20 text-indigo-300 font-bold tracking-widest text-sm uppercase backdrop-blur-sm">
                <Sparkles size={16} /> Visit Gamehub...Try our other releases...{" "}
                <Sparkles size={16} />
              </div>
            </div>
          </div>
        </a>
        <Logo />
      </div>
    );
  }

  // RECONNECTING STATE
  if (!user)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-pink-500 animate-pulse">
        Alliance Awakens...
      </div>
    );

  // RECONNECTING STATE
  if (roomId && !gameState && !error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4">
        <FloatingBackground />
        <div className="bg-zinc-900/80 backdrop-blur p-8 rounded-2xl border border-zinc-700 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <Loader size={48} className="text-pink-500 animate-spin" />
          <div className="text-center">
            <h2 className="text-xl font-bold">Reconnecting...</h2>
            <p className="text-zinc-400 text-sm">Resuming your session</p>
          </div>
        </div>
      </div>
    );
  }

  // 4. CHANGE: Add Splash Screen Render Condition
  if (view === "splash") {
    return <SplashScreen onStart={handleSplashStart} />;
  }

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-y-auto font-sans">
        <FloatingBackground />

        {/* --- START OF BACK BUTTON --- */}
        <nav className="absolute top-0 left-0 w-full p-4 z-50">
          <a
            href={import.meta.env.BASE_URL}
            className="flex items-center gap-2 text-pink-800 rounded-lg 
			font-bold shadow-md hover:text-pink-400 transition-colors w-fit animate-pulse"
          >
            {/* Arrow Icon */}
            <StepBack />
            <span>Back to Gamehub</span>
          </a>
        </nav>
        {/* --- END OF BACK BUTTON --- */}

        {/* Guide Modal in Menu */}
        {showGuide && (
          <div className="fixed inset-0 bg-black/90 z-200 flex items-center justify-center p-4">
            <div className="bg-slate-900 max-w-3xl w-full max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700 shadow-2xl relative flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-pink-600 p-2 rounded-xl">
                    <BookOpen className="text-white" size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight">
                    Code of Conduct
                  </h2>
                </div>
                <button
                  onClick={() => setShowGuide(false)}
                  className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors border border-slate-700 hover:bg-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-10 text-slate-300">
                {/* Section 1: Introduction */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                      <Shield className="text-pink-500" /> The Basics
                    </h3>
                    <p className="leading-relaxed text-lg">
                      Together is a <strong>cooperative team game</strong>. You
                      are paired with the player sitting opposite you. Your goal
                      is to complete specific patterns called{" "}
                      <strong>Goal Cards</strong> faster than the other teams.
                    </p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-inner">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-16 bg-pink-600 rounded-lg border-2 border-pink-400"></div>
                      <div className="w-12 h-16 bg-yellow-400 rounded-lg border-2 border-yellow-200"></div>
                      <div className="text-sm font-bold text-slate-400">
                        The Deck has numbers <strong>1-8</strong> in two colors:{" "}
                        <span className="text-pink-400">Magenta</span> &{" "}
                        <span className="text-yellow-400">Lemon</span>.
                      </div>
                    </div>
                    <div className="text-xs bg-slate-900 p-3 rounded-lg text-slate-400">
                      <strong>Winning Condition:</strong> The game ends when a
                      team claims <strong>8 Goals</strong>. The team with the
                      highest score wins!
                    </div>
                  </div>
                </section>
                <hr className="border-slate-800" />
                {/* Section 2: Turn Structure - UPDATED TEXT FOR FLEXIBLE TURNS */}
                <section>
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <RotateCcw className="text-blue-400" /> Turn Structure
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Step 1 */}
                    <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl group-hover:opacity-20 transition-opacity">
                        1
                      </div>
                      <h4 className="font-bold text-white text-lg mb-2">
                        Cleanup
                      </h4>
                      <p className="text-sm">
                        If you start your turn with{" "}
                        <strong>more than 6 cards</strong>, you must discard
                        down to 6 before doing anything else.
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl group-hover:opacity-20 transition-opacity">
                        2
                      </div>
                      <h4 className="font-bold text-white text-lg mb-2">
                        Actions (Any Order)
                      </h4>
                      <p className="text-sm">
                        You can Draw, Trade, or Claim goals in any order. BUT
                        you <strong>MUST draw 2 cards</strong> before passing.
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl group-hover:opacity-20 transition-opacity">
                        3
                      </div>
                      <h4 className="font-bold text-white text-lg mb-2">
                        Pass
                      </h4>
                      <p className="text-sm">
                        Once you have drawn your 2 cards and finished your
                        moves, <strong>Pass</strong> the turn.
                      </p>
                    </div>
                  </div>
                </section>
                <hr className="border-slate-800" />

                {/* Section 3: Actions */}
                <section>
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Zap className="text-yellow-400" /> Valid Actions
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="bg-green-500/20 p-3 rounded-lg text-green-400 shrink-0">
                        <CheckCircle size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">
                          Claim a Goal
                        </h4>
                        <p className="text-sm text-slate-400">
                          Select cards from your hand that match your{" "}
                          <strong>Personal Goal</strong> or the shared{" "}
                          <strong>Public Goal</strong>. If valid, you score
                          points and get a new goal.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="bg-blue-500/20 p-3 rounded-lg text-blue-400 shrink-0">
                        <Hand size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">
                          Trade Cards
                        </h4>
                        <p className="text-sm text-slate-400">
                          Give 1 or 2 cards from your hand to your partner. You
                          cannot receive cards, only give.
                          <strong>Limit:</strong> Max 2 cards traded per turn.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="bg-purple-500/20 p-3 rounded-lg text-purple-400 shrink-0">
                        <RefreshCw size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">
                          Cycle Goal
                        </h4>
                        <p className="text-sm text-slate-400">
                          Once per turn, you can discard your current Personal
                          Goal or the Public Goal and draw a new one. Use this
                          if a goal seems impossible!
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 4: Communication */}
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-4 items-center">
                  <div className="bg-red-500/20 p-2 rounded-full text-red-400">
                    <AlertTriangle size={24} />
                  </div>
                  <p className="text-sm font-medium text-red-200">
                    <strong>Communication Rule:</strong> You strictly cannot
                    talk about the specific numbers or colors in your hand. You
                    CAN say "I need high cards" or "I can help with that goal,"
                    but not "I have a Magenta 5."
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-800 bg-slate-900 sticky bottom-0 text-center">
                <button
                  onClick={() => setShowGuide(false)}
                  className="bg-white text-slate-900 font-bold py-4 px-12 rounded-xl hover:scale-105 transition-transform shadow-xl"
                >
                  Got It, Let's Play!
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="z-10 bg-slate-900/80 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl w-full max-w-md shadow-2xl flex flex-col gap-6 my-auto">
          <div className="text-center">
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-12 h-12 bg-pink-600 rounded-xl rotate-3 flex items-center justify-center shadow-lg shadow-pink-500/20">
                <Hash className="text-white" size={24} />
              </div>
              <div className="w-12 h-12 bg-yellow-400 rounded-xl -rotate-6 flex items-center justify-center shadow-lg shadow-yellow-400/20">
                <Sparkles className="text-yellow-900" size={24} />
              </div>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-1">
              TOGETHER
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              UNITED WE STAND
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl text-center text-sm font-bold">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase ml-1">
                Your Name
              </label>
              <input
                className="w-full bg-slate-950/50 border border-slate-700 focus:border-pink-500 p-4 rounded-xl text-white font-bold outline-none transition-all placeholder:text-slate-600"
                placeholder="Enter Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>

            <button
              onClick={createRoom}
              disabled={loading}
              className="w-full bg-linear-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white p-4 rounded-xl font-black shadow-lg shadow-pink-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Crown size={20} /> CREATE CO-OPERATION
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500 font-bold">
                  Or Join
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="w-full sm:flex-1 bg-slate-950/50 border border-slate-700 focus:border-yellow-400 p-4 rounded-xl text-white font-mono uppercase outline-none placeholder:text-slate-600"
                placeholder="ROOM CODE"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              />
              <button
                onClick={joinRoom}
                disabled={loading}
                className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-300 text-yellow-900 px-8 py-4 rounded-xl font-black shadow-lg shadow-yellow-900/20 active:scale-95 transition-all"
              >
                JOIN
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center justify-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold mt-2"
          >
            <BookOpen size={16} /> Code of Conduct
          </button>
        </div>
        <div className="absolute bottom-4 text-slate-600 text-xs text-center">
          Inspired by Duos. A tribute game.
          <br />
          Developed by <strong>RAWFID K SHUVO</strong>. Visit{" "}
          <a
            href={import.meta.env.BASE_URL}
            //target="_blank"
            rel="noopener noreferrer"
            className="text-pink-500 underline hover:text-pink-600"
          >
            GAMEHUB
          </a>{" "}
          for more games.
        </div>
      </div>
    );
  }

  // Common UI check for non-menu views
  const isMyTurn = gameState?.players[gameState.turnIndex]?.id === user?.uid;
  const myPlayer = gameState?.players.find((p) => p.id === user?.uid);
  const myTeam = TEAMS.find((t) => t.id === myPlayer?.teamId);
  const partner = gameState?.players.find(
    (p) => p.teamId === myPlayer?.teamId && p.id !== user?.uid,
  );

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    const count = gameState.players.length;
    const canStart = count === 4 || count === 6;

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative">
        <FloatingBackground />
        <LogoBig />
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onCancel={() => setShowLeaveConfirm(false)}
            onConfirmLeave={leaveRoom}
            onConfirmLobby={() => {
              resetToLobby();
              setShowLeaveConfirm(false);
            }}
            isHost={isHost}
            inGame={false}
          />
        )}
        <div className="z-10 w-full max-w-4xl bg-slate-900/90 backdrop-blur p-8 rounded-3xl border border-slate-700 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            {/* Grouping Title and Copy Button together on the left */}
            <div>
              <h2 className="text-lg md:text-xl text-pink-500 font-bold uppercase">
                Co-ops Code
              </h2>

              {/* Flex container to align ID and Button side-by-side */}
              <div className="flex items-center gap-3 mt-1">
                <div className="text-2xl md:text-3xl font-mono text-white font-black">
                  {gameState.roomId}
                </div>

                {/* 2. Container set to relative for positioning the popup */}
                <div className="relative">
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                  >
                    {/* Optional: Change icon to checkmark when copied */}
                    {isCopied ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>

                  {/* 3. The Copied Popup */}
                  {isCopied && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-pink-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg animate-fade-in-up whitespace-nowrap">
                      Copied!
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-xl transition-colors"
            >
              <LogOut size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {gameState.players.map((p, i) => {
              // Predict Team
              const teamId =
                count === 4
                  ? i % 2 === 0
                    ? "A"
                    : "B"
                  : i % 3 === 0
                    ? "A"
                    : i % 3 === 1
                      ? "B"
                      : "C";
              const team = TEAMS.find((t) => t.id === teamId);

              return (
                <div
                  key={p.id}
                  className={`bg-slate-800 border-2 ${
                    team ? team.border : "border-slate-700"
                  } p-4 rounded-2xl flex items-center justify-between gap-4`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                        team ? team.bg : "bg-slate-700"
                      } ${team ? team.color : "text-slate-400"}`}
                    >
                      {p.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-lg flex items-center gap-2">
                        <User size={16} className="text-slate-400" />
                        {p.name}
                        {gameState.hostId === p.id && (
                          <Crown size={14} className="text-yellow-400" />
                        )}
                      </div>
                      <div
                        className={`text-xs font-bold uppercase flex items-center gap-2 mt-1 ${
                          team ? team.color : "text-slate-500"
                        }`}
                      >
                        <Users size={14} />
                        {team ? team.name : "Waiting..."}
                      </div>
                    </div>
                  </div>
                  {isHost && p.id !== user.uid && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      className="text-slate-600 hover:text-red-500 transition-colors"
                      title="Kick Player"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              );
            })}
            {Array.from({
              length: Math.max(0, (count < 4 ? 4 : 6) - count),
            }).map((_, i) => (
              <div
                key={i}
                className="border-2 border-dashed border-slate-800 rounded-2xl p-4 flex items-center justify-center text-slate-700 font-bold"
              >
                Waiting for Player...
              </div>
            ))}
          </div>

          {isHost ? (
            <button
              onClick={startGame}
              disabled={!canStart}
              className={`w-full py-6 rounded-2xl font-black text-2xl tracking-widest shadow-xl transition-all ${
                canStart
                  ? "bg-green-600 hover:bg-green-500 text-white hover:scale-[1.02]"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              {canStart
                ? "START TOGETHER"
                : `WAITING FOR ${count < 4 ? "4" : "4 or 6"} PLAYERS`}
            </button>
          ) : (
            <div className="text-center py-8 bg-slate-900/50 rounded-2xl animate-pulse text-slate-500 font-bold">
              Waiting for Host to start...
            </div>
          )}
        </div>
        <Logo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const activePlayer = gameState.players[gameState.turnIndex];
    const isHost = gameState.hostId === user.uid;
    const allGuestsReady = gameState.players
      .filter((p) => p.id !== gameState.hostId)
      .every((p) => p.ready);

    // Win Screen
    if (gameState.status === "finished") {
      const winnerId = Object.keys(gameState.teamScores).reduce((a, b) =>
        gameState.teamScores[a].points > gameState.teamScores[b].points ? a : b,
      );
      const winnerTeam = TEAMS.find((t) => t.id === winnerId);

      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white font-sans relative">
          <FloatingBackground />

          {/* --- MODALS --- */}
          {showReport && (
            <ReportCard
              completedGoals={gameState.completedGoals || []}
              onClose={() => setShowReport(false)}
            />
          )}

          {/* FIX: Set inGame={true} so Host sees the "Return to Lobby" button in this modal */}
          {showLeaveConfirm && (
            <LeaveConfirmModal
              onConfirmLeave={leaveRoom}
              onConfirmLobby={() => {
                resetToLobby();
                setShowLeaveConfirm(false);
              }}
              onCancel={() => setShowLeaveConfirm(false)}
              isHost={isHost}
              inGame={true}
            />
          )}

          {/* --- TOP BAR (Fixed) --- */}
          <div className="fixed top-0 left-0 right-0 bg-slate-900 border-b border-slate-800 p-2 md:p-4 flex items-center justify-between shadow-md z-40 backdrop-blur-md bg-opacity-90">
            <div className="flex gap-2 md:gap-4 overflow-x-auto">
              {TEAMS.map((t) => {
                if (!gameState.teamScores[t.id]) return null;
                if (gameState.players.length === 4 && t.id === "C") return null;
                const score = gameState.teamScores[t.id];
                const isMyTeam = myPlayer?.teamId === t.id;
                return (
                  <div
                    key={t.id}
                    className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-1 rounded-lg border ${
                      myPlayer?.teamId === t.id
                        ? t.border
                        : "border-transparent"
                    }`}
                  >
                    <span
                      className={`font-black text-xs md:text-sm uppercase ${t.color}`}
                    >
                      {t.name}
                    </span>
                    <div className="flex gap-2 text-xs font-bold text-slate-400">
                      <span>{score.goals}/8 Goals</span>
                      {isMyTeam && <span>{score.points} Pts</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGuide(true)}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-800"
                title="How to Play"
              >
                <BookOpen size={20} />
              </button>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className={`p-2 rounded-full ${
                  showLogs
                    ? "bg-slate-800 text-white"
                    : "text-slate-500 hover:bg-slate-800"
                }`}
              >
                <History size={20} />
              </button>
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="p-2 rounded-full text-red-500 hover:bg-red-900/20"
                title="Leave Game"
              >
                <DoorOpen size={20} />
              </button>
            </div>
          </div>

          {/* --- LOGS OVERLAY --- */}
          {showLogs && (
            <div className="fixed top-16 md:top-20 right-4 w-72 max-h-64 bg-slate-900/95 backdrop-blur shadow-2xl rounded-xl border border-slate-700 z-50 flex flex-col overflow-hidden">
              <div className="bg-slate-800 p-2 text-xs font-bold text-slate-400 uppercase border-b border-slate-700">
                Game Log
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {gameState.logs
                  .slice()
                  .reverse()
                  .map((l) => (
                    <div
                      key={l.id}
                      className={`text-xs p-2 rounded ${
                        l.type === "success"
                          ? "bg-green-900/30 text-green-400 border border-green-900/50"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {l.text}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* --- GUIDE MODAL --- */}
          {showGuide && (
            <div className="fixed inset-0 bg-black/90 z-200 flex items-center justify-center p-4 text-left">
              <div className="bg-slate-900 max-w-3xl w-full max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700 p-6 relative">
                <button
                  onClick={() => setShowGuide(false)}
                  className="absolute top-4 right-4 text-slate-500"
                >
                  <X />
                </button>
                <h2 className="text-2xl font-bold mb-4 text-white">
                  Game Rules
                </h2>
                <p className="text-slate-400">See main menu for full rules.</p>
              </div>
            </div>
          )}

          {/* --- MAIN CONTENT --- */}
          <div className="z-10 bg-slate-900/80 backdrop-blur p-8 rounded-3xl border border-slate-700 shadow-2xl max-w-2xl w-full mt-20">
            <Trophy
              size={80}
              className="text-yellow-400 mb-6 mx-auto animate-bounce"
            />
            <h1 className="text-6xl font-black mb-2">
              {winnerTeam.name} Wins!
            </h1>
            <div className="grid grid-cols-2 gap-8 my-8">
              {TEAMS.map((t) => {
                if (!gameState.teamScores[t.id]) return null;
                return (
                  <div
                    key={t.id}
                    className={`bg-slate-800 p-6 rounded-2xl border ${t.border}`}
                  >
                    <h2 className={`text-2xl font-bold ${t.color}`}>
                      {t.name}
                    </h2>
                    <div className="text-4xl font-black mt-2">
                      {gameState.teamScores[t.id].points} pts
                    </div>
                    <div className="text-sm text-slate-400">
                      {gameState.teamScores[t.id].goals} goals
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowReport(true)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl mb-8 border border-slate-600 transition-colors flex items-center justify-center gap-2"
            >
              <FileText size={20} /> View Game Report Card
            </button>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className={`px-3 py-1 rounded-full text-sm border flex items-center gap-2 ${
                    p.ready
                      ? "border-green-500 bg-green-900/20 text-green-300"
                      : "border-gray-700 bg-gray-800 text-gray-400"
                  }`}
                >
                  {p.name} {p.ready && <CheckCircle size={12} />}
                </div>
              ))}
            </div>

            {/* Bottom Actions - Host Controls */}
            {isHost ? (
              <div className="flex gap-4">
                <button
                  onClick={restartGame}
                  disabled={!allGuestsReady}
                  className={`flex-1 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-transform ${
                    allGuestsReady
                      ? "bg-green-600 hover:bg-green-500 text-white hover:scale-105"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <RotateCcw size={20} /> Restart Game
                </button>
                <button
                  onClick={resetToLobby}
                  disabled={!allGuestsReady}
                  className={`flex-1 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-transform ${
                    allGuestsReady
                      ? "bg-blue-600 hover:bg-blue-500 text-white hover:scale-105"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <Home size={20} /> Return to Lobby
                </button>
              </div>
            ) : !myPlayer.ready ? (
              <button
                onClick={toggleReady}
                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-transform animate-pulse"
              >
                Ready for Next Game
              </button>
            ) : (
              <div className="text-green-400 font-bold animate-pulse border border-green-500/30 bg-green-900/10 p-4 rounded-xl">
                Waiting for Host...
              </div>
            )}
          </div>
        </div>
      );
    }

    // --- HELPER FOR GOAL OVERLAY ---
    const GoalOverlay = ({ type, goal }) => (
      <div
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-2 rounded-xl animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4 items-center justify-center">
          {/* CLAIM BUTTON */}
          <button
            onClick={() => {
              handleClaimGoal(type);
              setActiveGoalMenu(null);
            }}
            disabled={selectedCards.length === 0}
            className="flex flex-col items-center justify-center gap-1 group text-green-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-green-300 transition-colors"
            title="Claim Goal (Select Cards First)"
          >
            <div className="bg-green-900/40 p-2 rounded-full border border-green-500/50 group-hover:scale-110 transition-transform">
              <CheckCircle size={20} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider">
              Done
            </span>
          </button>

          {/* CHANGE BUTTON */}
          <button
            onClick={() => {
              handleChangeGoal(type);
              setActiveGoalMenu(null);
            }}
            disabled={gameState.goalChanged}
            className="flex flex-col items-center justify-center gap-1 group text-purple-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-purple-300 transition-colors"
            title="Cycle Goal"
          >
            <div className="bg-purple-900/40 p-2 rounded-full border border-purple-500/50 group-hover:scale-110 transition-transform">
              <RefreshCw size={20} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider">
              Change
            </span>
          </button>
        </div>

        {/* INFO BUTTON */}
        <button
          onClick={() => {
            setViewingGoal(goal);
            setActiveGoalMenu(null);
          }}
          className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white transition-colors mt-1 bg-white/5 px-2 py-0.5 rounded-full"
        >
          <Info size={10} /> Details
        </button>

        {/* CLOSE MENU */}
        <button
          onClick={() => setActiveGoalMenu(null)}
          className="absolute top-1 right-1 text-slate-500 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    );

    return (
      <div
        className="min-h-screen bg-slate-950 flex flex-col font-sans relative overflow-x-hidden overflow-y-auto text-slate-200"
        onClick={() => {
          setActiveGoalMenu(null);
          setActivePartnerId(null);
        }}
      >
        <FloatingBackground />

        {/* Info Modal */}
        {viewingGoal && (
          <InfoModal goal={viewingGoal} onClose={() => setViewingGoal(null)} />
        )}

        {/* Event Notification Modal */}
        <EventModal
          event={activeEvent}
          onClose={() => setActiveEvent(null)}
          currentUserId={user.uid}
        />

        {/* Guide Modal (Game) - POPULATED */}
        {showGuide && (
          <div className="fixed inset-0 bg-black/90 z-200 flex items-center justify-center p-4">
            <div className="bg-slate-900 max-w-3xl w-full max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700 shadow-2xl relative flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-pink-600 p-2 rounded-xl">
                    <BookOpen className="text-white" size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight">
                    Code of Conduct
                  </h2>
                </div>
                <button
                  onClick={() => setShowGuide(false)}
                  className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors border border-slate-700 hover:bg-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-10 text-slate-300">
                {/* Section 1: Introduction */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                      <Shield className="text-pink-500" /> The Basics
                    </h3>
                    <p className="leading-relaxed text-lg">
                      Together is a <strong>cooperative team game</strong>. You
                      are paired with the player sitting opposite you. Your goal
                      is to complete specific patterns called{" "}
                      <strong>Goal Cards</strong> faster than the other teams.
                    </p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-inner">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-16 bg-pink-600 rounded-lg border-2 border-pink-400"></div>
                      <div className="w-12 h-16 bg-yellow-400 rounded-lg border-2 border-yellow-200"></div>
                      <div className="text-sm font-bold text-slate-400">
                        The Deck has numbers <strong>1-8</strong> in two colors:{" "}
                        <span className="text-pink-400">Magenta</span> &{" "}
                        <span className="text-yellow-400">Lemon</span>.
                      </div>
                    </div>
                    <div className="text-xs bg-slate-900 p-3 rounded-lg text-slate-400">
                      <strong>Winning Condition:</strong> The game ends when a
                      team claims <strong>8 Goals</strong>. The team with the
                      highest score wins!
                    </div>
                  </div>
                </section>
                <hr className="border-slate-800" />
                {/* Section 2: Turn Structure - UPDATED TEXT FOR FLEXIBLE TURNS */}
                <section>
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <RotateCcw className="text-blue-400" /> Turn Structure
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Step 1 */}
                    <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl group-hover:opacity-20 transition-opacity">
                        1
                      </div>
                      <h4 className="font-bold text-white text-lg mb-2">
                        Cleanup
                      </h4>
                      <p className="text-sm">
                        If you start your turn with{" "}
                        <strong>more than 6 cards</strong>, you must discard
                        down to 6 before doing anything else.
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl group-hover:opacity-20 transition-opacity">
                        2
                      </div>
                      <h4 className="font-bold text-white text-lg mb-2">
                        Actions (Any Order)
                      </h4>
                      <p className="text-sm">
                        You can Draw, Trade, or Claim goals in any order. BUT
                        you <strong>MUST draw 2 cards</strong> before passing.
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl group-hover:opacity-20 transition-opacity">
                        3
                      </div>
                      <h4 className="font-bold text-white text-lg mb-2">
                        Pass
                      </h4>
                      <p className="text-sm">
                        Once you have drawn your 2 cards and finished your
                        moves, <strong>Pass</strong> the turn.
                      </p>
                    </div>
                  </div>
                </section>
                <hr className="border-slate-800" />
                {/* Section 3: Actions */}
                <section>
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Zap className="text-yellow-400" /> Valid Actions
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="bg-green-500/20 p-3 rounded-lg text-green-400 shrink-0">
                        <CheckCircle size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">
                          Claim a Goal
                        </h4>
                        <p className="text-sm text-slate-400">
                          Select cards from your hand that match your{" "}
                          <strong>Personal Goal</strong> or the shared{" "}
                          <strong>Public Goal</strong>. If valid, you score
                          points and get a new goal.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="bg-blue-500/20 p-3 rounded-lg text-blue-400 shrink-0">
                        <Hand size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">
                          Trade Cards
                        </h4>
                        <p className="text-sm text-slate-400">
                          Give 1 or 2 cards from your hand to your partner. You
                          cannot receive cards, only give.
                          <strong>Limit:</strong> Max 2 cards traded per turn.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="bg-purple-500/20 p-3 rounded-lg text-purple-400 shrink-0">
                        <RefreshCw size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">
                          Cycle Goal
                        </h4>
                        <p className="text-sm text-slate-400">
                          Once per turn, you can discard your current Personal
                          Goal or the Public Goal and draw a new one. Use this
                          if a goal seems impossible!
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
                {/* Section 4: Communication */}
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-4 items-center">
                  <div className="bg-red-500/20 p-2 rounded-full text-red-400">
                    <AlertTriangle size={24} />
                  </div>
                  <p className="text-sm font-medium text-red-200">
                    <strong>Communication Rule:</strong> You strictly cannot
                    talk about the specific numbers or colors in your hand. You
                    CAN say "I need high cards" or "I can help with that goal,"
                    but not "I have a Magenta 5."
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-800 bg-slate-900 sticky bottom-0 text-center">
                <button
                  onClick={() => setShowGuide(false)}
                  className="bg-white text-slate-900 font-bold py-4 px-12 rounded-xl hover:scale-105 transition-transform shadow-xl"
                >
                  Got It, Let's Play!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leave Confirmation Modal */}
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirmLeave={leaveRoom}
            onConfirmLobby={() => {
              resetToLobby();
              setShowLeaveConfirm(false);
            }}
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={isHost}
            inGame={true}
          />
        )}

        {/* Top Bar: Scores */}
        <div className="bg-slate-900 border-b border-slate-800 p-2 md:p-4 flex items-center justify-between shadow-md z-160 sticky top-0 backdrop-blur-md bg-opacity-90">
          <div className="flex gap-2 md:gap-4 overflow-x-auto">
            {TEAMS.map((t) => {
              if (!gameState.teamScores[t.id]) return null;
              if (gameState.players.length === 4 && t.id === "C") return null;
              const score = gameState.teamScores[t.id];
              const isActive = activePlayer.teamId === t.id;
              const isMyTeam = myPlayer?.teamId === t.id;
              return (
                <div
                  key={t.id}
                  className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-1 rounded-lg border ${
                    isActive
                      ? t.bg + " " + t.border
                      : "bg-transparent border-transparent"
                  }`}
                >
                  <span
                    className={`font-black text-xs md:text-sm uppercase ${t.color}`}
                  >
                    {t.name}
                  </span>
                  <div className="flex gap-2 text-xs font-bold text-slate-400">
                    <span>{score.goals}/8 Goals</span>
                    {isMyTeam && <span>{score.points} Pts</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGuide(true)}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-800"
              title="How to Play"
            >
              <BookOpen size={20} />
            </button>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`p-2 rounded-full ${
                showLogs
                  ? "bg-pink-900 text-pink-400"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              <History size={20} />
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 rounded-full text-red-500 hover:bg-red-900/20"
              title="Leave Game"
            >
              <DoorOpen size={20} />
            </button>
          </div>
        </div>

        {/* Logs Overlay */}
        {showLogs && (
          <div className="fixed top-16 right-4 w-64 max-h-60 bg-gray-900/95 border border-gray-700 rounded-xl z-155 overflow-y-auto p-2 shadow-2xl">
            <div className="bg-slate-800 p-2 text-xs font-bold text-slate-400 uppercase border-b border-slate-700">
              Game Log
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {gameState.logs
                .slice()
                .reverse()
                .map((l) => (
                  <div
                    key={l.id}
                    className={`text-xs p-2 rounded ${
                      l.type === "success"
                        ? "bg-green-900/30 text-green-400 border border-green-900/50"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {l.text}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Main Area */}
        <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-2 md:p-4 gap-2 z-10">
          {/* Opponents Row */}
          <div className="overflow-x-auto pb-2 min-h-[100px]">
            <div className="flex justify-center gap-2 md:gap-4 w-fit mx-auto px-4">
              {gameState.players.map((p, i) => {
                if (p.id === user.uid) return null;
                const isTurn = gameState.turnIndex === i;
                const pTeam = TEAMS.find((t) => t.id === p.teamId);
                const isPartner = p.teamId === myPlayer.teamId;

                // Partner Interaction Logic
                const showPartnerInteraction =
                  activePartnerId === p.id &&
                  isMyTurn &&
                  isPartner &&
                  selectedCards.length > 0 &&
                  selectedCards.length <= 2;

                return (
                  <div
                    key={p.id}
                    className={`relative flex flex-col items-center min-w-[80px] transition-all ${
                      isTurn ? "scale-105 opacity-100" : "opacity-70"
                    }`}
                  >
                    {/* GIVE BUTTON OVERLAY */}
                    {showPartnerInteraction && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrade(p.id);
                        }}
                        className="absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg hover:bg-blue-500 animate-in zoom-in duration-200 flex items-center gap-1 ring-2 ring-white"
                      >
                        <Gift size={14} /> GIVE
                      </button>
                    )}

                    <div
                      className={`relative w-10 h-10 rounded-full border-2 ${
                        isTurn
                          ? "border-white ring-2 ring-blue-500"
                          : pTeam.border
                      } bg-slate-800 flex items-center justify-center font-bold text-sm shadow-md cursor-pointer`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // If selected cards, toggle give menu for partner
                        if (
                          isPartner &&
                          isMyTurn &&
                          selectedCards.length > 0 &&
                          selectedCards.length <= 2
                        ) {
                          setActivePartnerId(
                            activePartnerId === p.id ? null : p.id,
                          );
                        }
                      }}
                    >
                      {p.name[0]}
                      <div
                        className={`absolute -bottom-1 px-1.5 py-0.5 rounded text-[7px] font-black uppercase text-white ${pTeam.bg.replace(
                          "/30",
                          "",
                        )}`}
                      >
                        {pTeam.name.split(" ")[1]}
                      </div>
                    </div>
                    {/* Player Name */}
                    <span className="text-[9px] font-bold text-slate-400 mt-1 max-w-[70px] truncate">
                      {p.name}
                    </span>

                    {/* Public Goal Info (Opponent) */}
                    <div className="mt-1 w-20 scale-90 origin-top">
                      <GoalCard
                        goal={p.personalGoal}
                        small
                        isPersonal
                        onClick={() => setViewingGoal(p.personalGoal)}
                      />
                    </div>

                    <div className="mt-1 flex -space-x-1">
                      {Array.from({ length: Math.min(5, p.hand.length) }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className="w-2.5 h-3 bg-slate-700 rounded border border-slate-500"
                          />
                        ),
                      )}
                      {p.hand.length > 5 && (
                        <div className="w-2.5 h-3 bg-red-500 rounded border border-slate-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center Board */}
          <div className="flex-1 bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800 shadow-xl p-4 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-6 mb-4 md:mb-0 relative">
            {/* REMOVED Turn Indicator from here */}

            {/* Public Goal - Reduced size */}
            <div className="flex flex-col w-32 h-24 md:w-48 md:h-32 shrink-0">
              <div className="text-center text-[10px] font-bold text-slate-500 mb-1 uppercase">
                Public Goal
              </div>

              {/* WRAPPER FIX: relative is now here, not on the parent */}
              <div className="relative flex-1 w-full h-full">
                {gameState.publicGoal ? (
                  <>
                    <GoalCard
                      goal={gameState.publicGoal}
                      isPublic
                      selected={activeGoalMenu === "PUBLIC"}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isMyTurn && gameState.turnPhase === "PLAYING") {
                          setActiveGoalMenu(
                            activeGoalMenu === "PUBLIC" ? null : "PUBLIC",
                          );
                        } else {
                          setViewingGoal(gameState.publicGoal);
                        }
                      }}
                    />
                    {activeGoalMenu === "PUBLIC" && (
                      <GoalOverlay type="PUBLIC" goal={gameState.publicGoal} />
                    )}
                  </>
                ) : (
                  <div className="h-full border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center text-slate-600">
                    Empty
                  </div>
                )}
              </div>
            </div>

            {/* Market & Deck */}
            <div className="flex flex-col items-center gap-2 mt-2 md:mt-0">
              <div className="flex gap-2">
                {gameState.market.map((c, i) => (
                  <Card
                    key={i}
                    card={c}
                    small
                    // Allow drawing in PLAYING phase if limit not met
                    disabled={
                      !isMyTurn ||
                      gameState.turnPhase === "CHECK_LIMIT" ||
                      gameState.cardsDrawn >= 2
                    }
                    onClick={() => handleDraw(i)}
                  />
                ))}
              </div>
              <button
                onClick={() => handleDraw(-1)}
                disabled={
                  !isMyTurn ||
                  gameState.turnPhase === "CHECK_LIMIT" ||
                  gameState.cardsDrawn >= 2
                }
                className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-300 text-sm font-bold hover:bg-slate-700 active:scale-95 disabled:opacity-50 transition-all shadow-lg"
              >
                <Layers size={16} /> Draw Blind
              </button>
            </div>
          </div>

          {/* Player Area */}
          <div className="bg-slate-900 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] p-4 pt-14 border-t border-slate-800 relative mt-auto">
            {/* Player Identity Badge */}
            <div className="absolute top-0 left-0 bg-slate-800 border-b border-r border-slate-700 rounded-br-2xl px-4 py-2 flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${myTeam.bg} ${myTeam.color}`}
              >
                {myPlayer.name[0]}
              </div>
              <div>
                <div className="text-white font-bold text-sm leading-none">
                  {myPlayer.name}
                </div>
                <div
                  className={`text-[10px] uppercase font-black tracking-wider ${myTeam.color}`}
                >
                  {myTeam.name}
                </div>
              </div>
            </div>

            {/* PASS BUTTON (Replaces Action Bar) */}
            {isMyTurn && gameState.turnPhase === "PLAYING" && (
              <button
                onClick={endTurn}
                disabled={gameState.cardsDrawn < 2}
                className="absolute top-4 right-4 bg-slate-700 text-white px-6 py-2 rounded-xl font-bold shadow hover:bg-slate-600 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                PASS{" "}
                {gameState.cardsDrawn < 2 && (
                  <span className="text-[10px] opacity-70">
                    (Draw {2 - gameState.cardsDrawn} more)
                  </span>
                )}
                <ArrowRight size={16} />
              </button>
            )}

            <div className="flex flex-col md:flex-row gap-4 items-end">
              {/* Personal Goal */}
              {/* REMOVED fixed heights here to allow the Turn indicator to stack nicely */}
              <div className="relative w-28 md:w-36 shrink-0 self-center md:self-end mb-4 md:mb-0 flex flex-col gap-2">
                {/* --- MOVED: Turn Indicator --- */}
                <div className="mb-2 text-center md:text-left">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Current Turn
                  </div>
                  <div
                    className={`text-lg font-black animate-bounce  ${
                      TEAMS.find((t) => t.id === activePlayer.teamId).color
                    }`}
                  >
                    {isMyTurn ? "YOUR TURN" : activePlayer.name}
                  </div>
                  {isMyTurn && (
                    <div className="text-[10px] font-bold bg-slate-800 text-blue-400 border border-blue-900/50 px-2 py-1 rounded-full mt-1 inline-block shadow-lg animate-pulse">
                      {gameState.turnPhase === "CHECK_LIMIT"
                        ? "Discard down to 6"
                        : gameState.cardsDrawn < 2
                          ? `Draw ${2 - gameState.cardsDrawn} more`
                          : "Actions or Pass"}
                    </div>
                  )}
                </div>

                {/* --- My Goal --- */}
                {/* WRAPPER FIX: Added a relative div to constrain the overlay only to the card */}
                <div className="relative w-full flex-1 min-h-[100px]">
                  {myPlayer.personalGoal ? (
                    <>
                      <GoalCard
                        goal={myPlayer.personalGoal}
                        isPersonal
                        selected={activeGoalMenu === "PERSONAL"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isMyTurn && gameState.turnPhase === "PLAYING") {
                            setActiveGoalMenu(
                              activeGoalMenu === "PERSONAL" ? null : "PERSONAL",
                            );
                          } else {
                            setViewingGoal(myPlayer.personalGoal);
                          }
                        }}
                      />
                      {activeGoalMenu === "PERSONAL" && (
                        <GoalOverlay
                          type="PERSONAL"
                          goal={myPlayer.personalGoal}
                        />
                      )}
                    </>
                  ) : (
                    <div className="h-full bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-500 font-bold border-2 border-dashed border-slate-700">
                      Completed!
                    </div>
                  )}
                </div>
              </div>

              {/* Hand - INCREASED PADDING TO REVEAL DISCARD BUTTON */}
              <div className="flex-1 overflow-x-auto pb-4 pt-16 px-2 w-full min-h-[200px]">
                <div className="flex gap-2 items-end w-fit mx-auto">
                  {myPlayer.hand
                    .sort((a, b) => a.value - b.value)
                    .map((c) => (
                      <div
                        key={c.id}
                        className="relative group shrink-0 w-20 h-28 md:w-24 md:h-32"
                      >
                        {isMyTurn && gameState.turnPhase === "CHECK_LIMIT" && (
                          <button
                            onClick={() => handleDiscard(c)}
                            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full opacity-100 z-50 shadow-xl animate-pulse border-2 border-slate-900"
                          >
                            DISCARD
                          </button>
                        )}
                        <div className="w-full h-full">
                          <Card
                            card={c}
                            selected={selectedCards.some(
                              (sc) => sc.id === c.id,
                            )}
                            disabled={
                              !isMyTurn ||
                              (gameState.turnPhase !== "PLAYING" &&
                                gameState.turnPhase !== "CHECK_LIMIT")
                            }
                            onClick={() => {
                              if (gameState.turnPhase === "PLAYING") {
                                if (selectedCards.some((sc) => sc.id === c.id))
                                  setSelectedCards(
                                    selectedCards.filter(
                                      (sc) => sc.id !== c.id,
                                    ),
                                  );
                                else setSelectedCards([...selectedCards, c]);
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Logo />
      </div>
    );
  }

  return null;
}
