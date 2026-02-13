import React, { useState, useEffect, useRef } from "react";
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
  increment,
  collection,
} from "firebase/firestore";
import {
  Play,
  Package,
  Siren,
  ShieldCheck,
  AlertOctagon,
  Coins,
  LogOut,
  History,
  BookOpen,
  X,
  Crown,
  User,
  RotateCcw,
  Home,
  CheckCircle,
  Briefcase,
  Box,
  Cpu,
  Zap,
  Skull,
  Cross,
  Utensils,
  Hammer,
  ShoppingBag,
  TrendingUp,
  Eye,
  Handshake,
  Ghost,
  Lock,
  Flag,
  Bomb,
  Scan,
  BadgeDollarSign,
  Layers,
  Info,
  Clock,
  Calendar,
  FileText,
  CreditCard,
  ChevronRight,
  TrendingDown,
  Trash,
  Sparkle,
  Sparkles,
  Copy,
  Loader,
  Shirt,
  Flame,
  ChessKing,
  StepBack,
} from "lucide-react";
import CoverImage from "./assets/contraband_cover.png";

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

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "contraband-game";
const GAME_ID = "12";
// --- Game Constants ---
const STARTING_COINS = 500;
const BANK_LOAN = 500;

const ROLES = {
  DIPLOMAT: {
    id: "DIPLOMAT",
    name: "Diplomat",
    desc: "Pay 50% less fines.",
    icon: Flag,
    color: "text-blue-400",
  },
  YAKUZA: {
    id: "YAKUZA",
    name: "Yakuza",
    desc: "+20% value for Contraband.",
    icon: Ghost,
    color: "text-purple-400",
  },
  SNITCH: {
    id: "SNITCH",
    name: "Snitch",
    desc: "Earn $100 whenever another player is fined.",
    icon: Eye,
    color: "text-yellow-400",
  },
  MERCHANT: {
    id: "MERCHANT",
    name: "Merchant",
    desc: "+20% value for Legal Goods.",
    icon: Briefcase,
    color: "text-emerald-400",
  },
};

const EVENTS = {
  NORMAL: {
    id: "NORMAL",
    name: "Market Stable",
    desc: "Business as usual.",
    multiplier: 1,
    target: null,
  },
  WAR: {
    id: "WAR",
    name: "War Zone",
    desc: "Weapons value x2.",
    multiplier: 2,
    target: ["WEAPON_1", "WEAPON_2"],
  },
  PANDEMIC: {
    id: "PANDEMIC",
    name: "Pandemic",
    desc: "Meds & Rations value x2.",
    multiplier: 2,
    target: [
      "MEDS",
      "FOOD",
      "ROYAL_2_FOOD",
      "ROYAL_3_FOOD",
      "ROYAL_2_MEDS",
      "ROYAL_3_MEDS",
    ],
  },
  // --- NEW EVENTS ---
  INDUSTRIAL_REV: {
    id: "INDUSTRIAL_REV",
    name: "Industrial Boom",
    desc: "Uniforms & Machinery value x2.",
    multiplier: 2,
    target: [
      "TEXTILE",
      "PARTS",
      "ROYAL_2_TEXTILE",
      "ROYAL_3_TEXTILE",
      "ROYAL_2_PARTS",
    ],
  },
  RECESSION: {
    id: "RECESSION",
    name: "Market Recession",
    desc: "Contraband value -20%.",
    multiplier: 0.8,
    target: "ALL_ILLEGAL", // Special keyword we will handle
  },
  DEFLATION: {
    id: "DEFLATION",
    name: "Deflation",
    desc: "Legal Goods value -20%.",
    multiplier: 0.8,
    target: "ALL_LEGAL", // Special keyword we will handle
  },
  // ------------------
  CRACKDOWN: {
    id: "CRACKDOWN",
    name: "Police Crackdown",
    desc: "All Fines Double.",
    multiplier: 2,
    target: "ALL_FINES",
  },
  FREE_TRADE: {
    id: "FREE_TRADE",
    name: "Free Trade",
    desc: "All Fines Halved.",
    multiplier: 0.5,
    target: "ALL_FINES",
  },
};

const SHOP_ITEMS = {
  POCKETS: {
    id: "POCKETS",
    name: "Deep Pockets",
    desc: "Hand Size +1 (Immediate Draw)",
    cost: 300,
    icon: Briefcase,
  },
  EXPANDED: {
    id: "EXPANDED",
    name: "Crate Extension",
    desc: "Load up to 5 cards",
    cost: 500,
    icon: Box,
  },
  CONCEAL: {
    id: "CONCEAL",
    name: "Hidden Compartment",
    desc: "One highest value illegal item is safe per inspection",
    cost: 400,
    icon: Lock,
  },
  SCANNER: {
    id: "SCANNER",
    name: "X-Ray Scanner",
    desc: "As Inspector, reveal 1 random card per crate",
    cost: 400,
    icon: Scan,
  },
};

const GOODS = {
  // --- LEGAL GOODS ---
  FOOD: {
    id: "FOOD",
    name: "Rations",
    val: 200,
    penalty: 200,
    type: "LEGAL",
    icon: Utensils,
    color: "text-green-200",
    kingBonus: 1000,
    queenBonus: 600,
  },
  MEDS: {
    id: "MEDS",
    name: "Medkits",
    val: 300,
    penalty: 200,
    type: "LEGAL",
    icon: Cross,
    color: "text-green-300",
    kingBonus: 1500,
    queenBonus: 900,
  },
  TEXTILE: {
    id: "TEXTILE",
    name: "Uniforms",
    val: 300,
    penalty: 200,
    type: "LEGAL",
    icon: Shirt,
    color: "text-green-400",
    kingBonus: 1500,
    queenBonus: 900,
  },
  PARTS: {
    id: "PARTS",
    name: "Machinery",
    val: 400,
    penalty: 200,
    type: "LEGAL",
    icon: Hammer,
    color: "text-green-500",
    kingBonus: 2000,
    queenBonus: 1200,
  },

  // --- CONTRABAND ---
  WEAPON_1: {
    id: "WEAPON_1",
    name: "Laser Gun",
    val: 600,
    penalty: 400,
    type: "ILLEGAL",
    icon: Sparkle,
    color: "text-red-200",
  },
  WEAPON_2: {
    id: "WEAPON_2",
    name: "Plasma Rifle",
    val: 700,
    penalty: 400,
    type: "ILLEGAL",
    icon: Zap,
    color: "text-red-300",
  },
  CHIP: {
    id: "CHIP",
    name: "Neural Chip",
    val: 800,
    penalty: 400,
    type: "ILLEGAL",
    icon: Cpu,
    color: "text-red-400",
  },
  SPICE: {
    id: "SPICE",
    name: "Red Dust",
    val: 900,
    penalty: 400,
    type: "ILLEGAL",
    icon: Flame,
    color: "text-red-500",
  },

  // --- ROYAL GOODS (Contraband that counts as Legal for Bonuses) ---
  ROYAL_2_FOOD: {
    id: "ROYAL_2_FOOD",
    name: "Ambrosia",
    val: 400,
    penalty: 300,
    type: "ILLEGAL",
    icon: Utensils,
    color: "text-cyan-200",
    legalType: "FOOD",
    legalCount: 2,
  },
  ROYAL_2_MEDS: {
    id: "ROYAL_2_MEDS",
    name: "Panacea Vial",
    val: 600,
    penalty: 400,
    type: "ILLEGAL",
    icon: Cross,
    color: "text-cyan-300",
    legalType: "MEDS", // Counts as Meds
    legalCount: 2, // Counts as 3 Meds
  },
  ROYAL_2_TEXTILE: {
    id: "ROYAL_2_TEXTILE",
    name: "Neo-Silk",
    val: 600,
    penalty: 400,
    type: "ILLEGAL",
    icon: Shirt,
    color: "text-cyan-400",
    legalType: "TEXTILE",
    legalCount: 2,
  },
  ROYAL_2_PARTS: {
    id: "ROYAL_2_PARTS",
    name: "Quantum Gear",
    val: 800,
    penalty: 400,
    type: "ILLEGAL",
    icon: Hammer,
    color: "text-cyan-500",
    legalType: "PARTS",
    legalCount: 2,
  },
  ROYAL_3_FOOD: {
    id: "ROYAL_3_FOOD",
    name: "Nectar of Gods",
    val: 600,
    penalty: 400,
    type: "ILLEGAL",
    icon: Utensils,
    color: "text-yellow-200",
    legalType: "FOOD",
    legalCount: 3,
  },
  ROYAL_3_MEDS: {
    id: "ROYAL_3_MEDS",
    name: "Phoenix Serum",
    val: 900,
    penalty: 400,
    type: "ILLEGAL",
    icon: Cross,
    color: "text-yellow-300",
    legalType: "MEDS", // Counts as Meds
    legalCount: 3, // Counts as 3 Meds
  },
  ROYAL_3_TEXTILE: {
    id: "ROYAL_3_TEXTILE",
    name: "Astral Velvet",
    val: 900,
    penalty: 400,
    type: "ILLEGAL",
    icon: Shirt,
    color: "text-yellow-400",
    legalType: "TEXTILE",
    legalCount: 3,
  },
  // --- SPECIAL ---
  TRAP: {
    id: "TRAP",
    name: "Booby Trap",
    val: 0,
    penalty: 0,
    type: "TRAP",
    icon: Bomb,
    color: "text-orange-400",
    desc: "If opened: Inspector pays $200",
  },
};

const ContrabandLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Package size={12} className="text-emerald-400" />
    <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
      CONTRABAND
    </span>
  </div>
);

const ContrabandLogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Package size={20} className="text-emerald-400" />
    <span className="text-[20px] font-black tracking-widest text-emerald-400 uppercase">
      CONTRABAND
    </span>
  </div>
);

// Deck Template - Scaled for Player Count AND Game Length
const generateDeck = (playerCount, gameLength = "SHORT") => {
  let deck = [];

  // CHANGE: Apply multiplier only if game is LONG *AND* there are more than 4 players
  const multiplier = gameLength === "LONG" && playerCount > 4 ? 1.5 : 1;

  // Base counts per player (Balanced for game length)
  const counts = {
    MEDS: 8 * playerCount * multiplier,
    FOOD: 6 * playerCount * multiplier,
    PARTS: 6 * playerCount * multiplier,
    TEXTILE: 4 * playerCount * multiplier,

    WEAPON_1: 4 * playerCount * multiplier,
    WEAPON_2: 4 * playerCount * multiplier,
    CHIP: 2 * playerCount * multiplier,
    SPICE: 2 * playerCount * multiplier,

    // Royal Goods
    ROYAL_2_MEDS: 2 * multiplier,
    ROYAL_2_FOOD: 2 * multiplier,
    ROYAL_2_TEXTILE: 2 * multiplier,
    ROYAL_2_PARTS: 2 * multiplier,
    ROYAL_3_MEDS: 2 * multiplier,
    ROYAL_3_FOOD: 2 * multiplier,
    ROYAL_3_TEXTILE: 2 * multiplier,
  };

  // Add standard cards
  Object.entries(counts).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) deck.push(type);
  });

  // Add Traps (1 per player * multiplier)
  for (let i = 0; i < playerCount; i++) deck.push("TRAP");

  return deck;
};

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

// Helper: Draw a card but prevent more than 1 Trap in hand
const drawSafeCard = (deck, currentHand) => {
  if (deck.length === 0) return null;
  let rejected = [];
  let card = null;
  const hasTrap = currentHand.includes("TRAP");
  while (deck.length > 0) {
    let candidate = deck.pop();
    if (candidate === "TRAP" && hasTrap) {
      rejected.push(candidate);
    } else {
      card = candidate;
      break;
    }
  }
  if (rejected.length > 0) deck.unshift(...rejected);
  return card;
};

// Helper: Assign random roles
const assignRandomRoles = (players) => {
  const rolesKeys = Object.keys(ROLES);
  const pool = [...rolesKeys];
  while (pool.length < players.length) pool.push(...rolesKeys);
  const shuffledRoles = shuffle(pool);
  return players.map((p, i) => ({ ...p, role: ROLES[shuffledRoles[i]].id }));
};

// Helper to update detailed round stats with RICH transactions
const getUpdatedStats = (currentStats, playerId, updates) => {
  const playerStats = currentStats[playerId] || {
    income: 0,
    expense: 0,
    transactions: [],
    role: "",
    isInspector: false,
    marketItems: [],
    roleBonus: 0,
    eventImpact: 0, // Initialize new field
  };

  const newTransactions = updates.transaction
    ? [...(playerStats.transactions || []), updates.transaction]
    : playerStats.transactions || [];
  const newMarketItems = updates.marketItem
    ? [...(playerStats.marketItems || []), updates.marketItem]
    : playerStats.marketItems || [];

  return {
    ...currentStats,
    [playerId]: {
      ...playerStats,
      ...updates,
      income: (playerStats.income || 0) + (updates.income || 0),
      expense: (playerStats.expense || 0) + (updates.expense || 0),
      roleBonus: (playerStats.roleBonus || 0) + (updates.roleBonus || 0),
      // Aggregate the event impact
      eventImpact: (playerStats.eventImpact || 0) + (updates.eventImpact || 0),
      transactions: newTransactions,
      marketItems: newMarketItems,
    },
  };
};

// --- Sub-Components ---

const FloatingBackground = ({ isShaking }) => (
  <div
    className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${
      isShaking ? "animate-shake bg-red-900/20" : ""
    }`}
  >
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-yellow-900/20 via-gray-950 to-black" />
    <div className="absolute top-0 left-0 w-full h-full opacity-10">
      {[...Array(20)].map((_, i) => {
        const fruitKeys = Object.keys(GOODS);
        const Icon = GOODS[fruitKeys[i % fruitKeys.length]].icon;
        return (
          <div
            key={i}
            className="absolute animate-float text-white/60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${10 + Math.random() * 20}s`,
              transform: `scale(${0.5 + Math.random()})`,
            }}
          >
            <Icon size={32} />
          </div>
        );
      })}
    </div>
    <style>{`
      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(10deg); }
      }
      .animate-float { animation: float infinite ease-in-out; }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
    `}</style>
  </div>
);

const CardIcon = ({ typeId, size = 12 }) => {
  const info = GOODS[typeId];
  if (!info) return null;
  return <info.icon size={size} className={info.color} />;
};

const ReportCard = ({ players, roundData, isFinal }) => {
  // 1. Add "STASH" to the initial active tab logic if preferred, or keep FINAL
  const [activeTab, setActiveTab] = useState(
    isFinal ? "FINAL" : Math.max(0, roundData.length - 1),
  );

  // 2. Update Tabs to include STASH
  const tabs = isFinal
    ? ["FINAL", "STASH", ...roundData.map((_, i) => `ROUND ${i + 1}`)]
    : [];

  // --- NEW: Helper to render the detailed Stash View ---
  const renderStashView = () => {
    // Sort players by final score for display order
    const sortedPlayers = [...players].sort(
      (a, b) => b.finalScore - a.finalScore,
    );

    return (
      <div className="flex flex-row gap-4 p-6 bg-zinc-900/50 overflow-x-auto pb-8 snap-x">
        {sortedPlayers.map((p, i) => {
          // Categorize and Count Items
          const legal = [];
          const royal = [];
          const royalTwo = [];
          const royalThree = [];
          const contraband = [];

          const counts = {};
          p.stash.forEach((id) => {
            counts[id] = (counts[id] || 0) + 1;
          });

          Object.entries(counts).forEach(([id, qty]) => {
            const item = GOODS[id];
            if (!item) return;

            const entry = { ...item, qty };

            if (item.id.startsWith("ROYAL_")) {
              royal.push(entry);
            }
            if (item.id.startsWith("ROYAL_2")) {
              royalTwo.push(entry);
            } else if (item.id.startsWith("ROYAL_3")) {
              royalThree.push(entry);
            } else if (item.type === "ILLEGAL") {
              contraband.push(entry);
            } else if (item.type === "LEGAL") {
              legal.push(entry);
            }
          });

          return (
            <div
              key={p.id}
              // CHANGED: Reduced width to 320px (standard card size)
              className={`flex flex-col w-[320px] shrink-0 bg-zinc-800 rounded-xl border snap-center ${
                i === 0
                  ? "border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                  : "border-zinc-700"
              } overflow-hidden`}
            >
              {/* Player Header */}
              <div className="p-3 bg-black/20 w-full flex flex-row justify-between items-center border-b border-zinc-700">
                <div>
                  <div className="font-bold text-md text-white">{p.name}</div>
                </div>
                {i === 0 && (
                  <div className="flex items-center gap-1 text-yellow-500 text-[10px] font-bold uppercase tracking-wider bg-yellow-900/20 px-2 py-1 rounded border border-yellow-500/20">
                    <Crown size={10} /> Winner
                  </div>
                )}
              </div>

              {/* Exports Section - CHANGED: Removed Grid, now just Flex Column */}
              <div className="flex-1 p-3 flex flex-col gap-4">
                {/* Section 1: Exports Inventory */}
                <div className="space-y-3 flex-1">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-700 pb-1">
                    Exports Manifest
                  </h4>

                  {/* Legal Goods */}
                  {legal.length > 0 && (
                    <div>
                      <span className="text-[9px] text-emerald-500 font-bold uppercase mb-1 block">
                        Legal Goods
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {legal.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-1 bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[10px] text-emerald-100"
                          >
                            <item.icon size={10} /> {item.name}{" "}
                            <span className="font-mono opacity-60">
                              x{item.qty}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Royal Goods */}
                  {royal.length > 0 && (
                    <div>
                      <span className="text-[9px] text-yellow-500 font-bold uppercase mb-1 block">
                        Royal Goods
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {royalThree.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-1 bg-yellow-900/20 px-1.5 py-0.5 rounded border border-yellow-500/20 text-[10px] text-yellow-100"
                          >
                            <item.icon size={10} /> {item.name}{" "}
                            <span className="font-mono opacity-60">
                              x{item.qty}
                            </span>
                          </div>
                        ))}
                        {royalTwo.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-1 bg-cyan-900/20 px-1.5 py-0.5 rounded border border-cyan-500/20 text-[10px] text-cyan-100"
                          >
                            <item.icon size={10} /> {item.name}{" "}
                            <span className="font-mono opacity-60">
                              x{item.qty}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contraband */}
                  {contraband.length > 0 && (
                    <div>
                      <span className="text-[9px] text-red-500 font-bold uppercase mb-1 block">
                        Contraband
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {contraband.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-1 bg-red-900/20 px-1.5 py-0.5 rounded border border-red-500/20 text-[10px] text-red-100"
                          >
                            <item.icon size={10} /> {item.name}{" "}
                            <span className="font-mono opacity-60">
                              x{item.qty}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {legal.length === 0 &&
                    royal.length === 0 &&
                    contraband.length === 0 && (
                      <div className="text-zinc-600 italic text-xs">
                        No goods exported.
                      </div>
                    )}
                </div>

                {/* Section 2: King/Queen Bonuses */}
                <div className="bg-black/20 -mx-3 -mb-3 p-3 border-t border-zinc-700 mt-auto">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    Titles & Honors
                  </h4>
                  {p.kqDetails && p.kqDetails.length > 0 ? (
                    <div className="space-y-1 mb-3">
                      {p.kqDetails.map((detail, idx) => {
                        const isKing = detail.includes("King");
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 p-1.5 rounded ${isKing ? "bg-yellow-500/10" : "bg-pink-500/10"}`}
                          >
                            {isKing ? (
                              <Crown size={12} className="text-yellow-400" />
                            ) : (
                              <ChessKing size={12} className="text-pink-400" />
                            )}
                            <span
                              className={`text-[10px] font-bold ${isKing ? "text-yellow-200" : "text-pink-200"}`}
                            >
                              {detail}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-zinc-600 italic text-[10px] mb-3">
                      No titles awarded.
                    </div>
                  )}

                  {/* Total Bonus Cash Display */}
                  <div className="flex justify-between items-center border-t border-zinc-700 pt-2">
                    <span className="text-[10px] text-zinc-500 uppercase">
                      Bonus Payout
                    </span>
                    <span
                      className={`font-mono font-bold ${p.kqIncome > 0 ? "text-yellow-400 text-sm" : "text-zinc-600 text-xs"}`}
                    >
                      +${p.kqIncome}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTable = (data, isFinalView) => {
    let displayData = [];

    if (isFinalView) {
      displayData = players.map((p) => {
        let stashBonus = 0;

        // Accumulators
        let totalRoleBonus = 0;
        let bonusBreakdown = [];

        let totalEventImpact = 0;
        let eventBreakdown = [];

        let totalInspectionNet = 0;
        let inspectionBreakdown = [];

        let totalMarketSpend = 0;
        let marketBreakdown = [];

        // King/Queen Data SAFE ACCESS
        const kqIncome = p.kqIncome || 0;
        const kqDetails = p.kqDetails || [];
        const stash = p.stash || [];

        // Aggregate per-round stats
        roundData.forEach((r, i) => {
          const rStats = r.stats[p.id];
          if (rStats) {
            // 1. Role Bonus
            if (rStats.roleBonus > 0) {
              totalRoleBonus += rStats.roleBonus;
              bonusBreakdown.push(
                `R${i + 1} (${ROLES[rStats.role]?.name}): +$${rStats.roleBonus}`,
              );
            }

            // 2. Event Impact
            if (rStats.eventImpact && rStats.eventImpact !== 0) {
              totalEventImpact += rStats.eventImpact;
              eventBreakdown.push(
                `R${i + 1} (${r.event?.name}): ${
                  rStats.eventImpact > 0 ? "+" : ""
                }$${rStats.eventImpact}`,
              );
            }

            // 3. Black Market Purchases
            if (rStats.marketItems && rStats.marketItems.length > 0) {
              rStats.marketItems.forEach((itemId) => {
                const item = SHOP_ITEMS[itemId];
                if (item) {
                  totalMarketSpend += item.cost;
                  marketBreakdown.push(
                    `R${i + 1}: ${item.name} (-$${item.cost})`,
                  );
                }
              });
            }

            // 4. Inspection Impact
            const inspectionLabels = [
              "Fine Paid",
              "Fine Collected",
              "Bribe Paid",
              "Bribe Accepted",
              "Bribe Returned",
              "Trap Exploded",
              "Trap Reward",
              "Wrongful Search",
              "Clean Bonus",
            ];

            if (rStats.transactions) {
              rStats.transactions.forEach((t) => {
                if (inspectionLabels.includes(t.label)) {
                  totalInspectionNet += t.amount;
                  if (Math.abs(t.amount) > 0) {
                    let label = t.label;
                    if (label === "Fine Paid") label = "Fined";
                    if (label === "Fine Collected") label = "Fine Coll.";
                    if (label === "Trap Exploded") label = "Trap Hit";
                    if (label === "Wrongful Search") label = "Clean";

                    inspectionBreakdown.push(
                      `R${i + 1}: ${label} (${t.amount > 0 ? "+" : ""}${
                        t.amount
                      })`,
                    );
                  }
                }
              });
            }
          }
        });

        // 1. SAFE STASH CALCULATION
        const stashTotal = stash.reduce(
          (acc, c) => acc + (GOODS[c]?.val || 0), // ?.val prevents crash on invalid ID
          0,
        );

        // 2. SAFE TOTAL CALCULATION
        const total = Math.floor(p.coins - BANK_LOAN + kqIncome);

        return {
          id: p.id,
          name: p.name,
          role: p.role,
          cash: p.coins,
          stashVal: stashTotal,

          bonus: Math.floor(totalRoleBonus),
          bonusDetails: bonusBreakdown,

          eventBonus: totalEventImpact,
          eventDetails: eventBreakdown,

          inspectionNet: totalInspectionNet,
          inspectionDetails: inspectionBreakdown,

          marketCost: totalMarketSpend,
          marketDetails: marketBreakdown,

          kqIncome: kqIncome,
          kqDetails: kqDetails,

          loan: -BANK_LOAN,
          total,
          isWinner: false,
        };
      });

      displayData.sort((a, b) => b.total - a.total);
      if (displayData.length > 0) displayData[0].isWinner = true;
    } else {
      // Existing Round View Logic
      const roundIdx =
        typeof activeTab === "string"
          ? parseInt(activeTab.split(" ")[1]) - 1
          : activeTab;

      const roundEntry = Array.isArray(roundData)
        ? roundData[
            activeTab === "FINAL" || activeTab === "STASH"
              ? 0
              : typeof activeTab === "number"
                ? activeTab
                : parseInt(activeTab.split(" ")[1]) - 1
          ]
        : null;
      const stats = roundEntry ? roundEntry.stats : null;
      const roundEvent = roundEntry ? roundEntry.event : null;

      if (!stats)
        return (
          <div className="p-12 text-center text-zinc-500 italic">
            No Data Available
          </div>
        );

      displayData = Object.keys(stats).map((pid) => {
        const pStat = stats[pid];
        const pName = players.find((pl) => pl.id === pid)?.name || "Unknown";
        return {
          id: pid,
          name: pName,
          role: pStat.role,
          isInspector: pStat.isInspector,
          marketItems: pStat.marketItems || [],
          roleBonus: pStat.roleBonus || 0,
          eventImpact: pStat.eventImpact || 0,
          transactions: pStat.transactions || [],
          income: pStat.income,
          expense: pStat.expense,
          net: pStat.income - pStat.expense,
          activeEvent: roundEvent,
        };
      });
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900/50 text-xs uppercase text-zinc-500 font-bold tracking-wider">
              <th className="px-6 py-3 border-b border-zinc-800">Agent</th>
              {isFinalView ? (
                <>
                  <th className="px-6 py-3 border-b border-zinc-800 text-right">
                    Cash
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800 text-right text-emerald-300">
                    Stash
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800 text-right text-purple-400">
                    Insp. Impact
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800 text-right text-orange-400">
                    Black Market
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800 text-right text-yellow-400">
                    Role Bonus
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800 text-right text-blue-400">
                    Event Impact
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800 text-right text-yellow-200">
                    King/Queen
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800 text-right text-red-400">
                    Loan
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800 text-right text-white">
                    Final Score
                  </th>
                </>
              ) : (
                <>
                  <th className="px-6 py-3 border-b border-zinc-800">
                    Event Impact
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800">Market</th>
                  <th className="px-6 py-3 border-b border-zinc-800">
                    Role Bonus
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800 w-1/3">
                    Activity Log
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800 text-right">
                    Net Change
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-sm">
            {displayData.map((d, i) => {
              const RoleIcon = ROLES[d.role]?.icon;
              const RoleColor = ROLES[d.role]?.color;
              if (isFinalView) {
                return (
                  <tr
                    key={d.id}
                    className={`group hover:bg-zinc-800/30 transition-colors ${
                      d.isWinner ? "bg-emerald-900/10" : ""
                    }`}
                  >
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-[10px] ${d.isWinner ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-500"}`}
                        >
                          {i + 1}
                        </div>
                        <span
                          className={`font-medium ${d.isWinner ? "text-white" : "text-zinc-400"}`}
                        >
                          {d.name}
                        </span>
                        {d.isWinner && (
                          <Crown size={14} className="text-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-400 align-top">
                      ${d.cash}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-300 align-top">
                      ${d.stashVal}
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex flex-col items-end">
                        <span
                          className={`font-mono ${d.inspectionNet > 0 ? "text-purple-400" : d.inspectionNet < 0 ? "text-red-400" : "text-zinc-600"}`}
                        >
                          {d.inspectionNet > 0 ? "+" : ""}
                          {d.inspectionNet}
                        </span>
                        {d.inspectionDetails.map((det, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] text-zinc-500 whitespace-nowrap"
                          >
                            {det}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex flex-col items-end">
                        <span
                          className={`font-mono ${d.marketCost > 0 ? "text-orange-400" : "text-zinc-600"}`}
                        >
                          -${d.marketCost}
                        </span>
                        {d.marketDetails.map((det, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] text-zinc-500 whitespace-nowrap"
                          >
                            {det}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-yellow-400">
                          +{d.bonus}
                        </span>
                        {d.bonusDetails.map((det, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] text-zinc-500 whitespace-nowrap"
                          >
                            {det}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex flex-col items-end">
                        <span
                          className={`font-mono ${d.eventBonus > 0 ? "text-blue-400" : d.eventBonus < 0 ? "text-red-400" : "text-zinc-600"}`}
                        >
                          {d.eventBonus > 0 ? "+" : ""}
                          {d.eventBonus}
                        </span>
                        {d.eventDetails.map((det, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] text-zinc-500 whitespace-nowrap"
                          >
                            {det}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex flex-col items-end">
                        <span
                          className={`font-mono ${d.kqIncome > 0 ? "text-yellow-200" : "text-zinc-600"}`}
                        >
                          {d.kqIncome > 0 ? "+" : ""}
                          {d.kqIncome}
                        </span>
                        {d.kqDetails.map((det, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] text-zinc-500 whitespace-nowrap"
                          >
                            {det}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-red-400 align-top">
                      {d.loan}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-white text-lg align-top">
                      ${d.total}
                    </td>
                  </tr>
                );
              } else {
                return (
                  <tr key={d.id} className="group hover:bg-zinc-800/30">
                    <td className="px-6 py-4 align-top">
                      <div className="font-medium text-white mb-1">
                        {d.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-500 mb-2">
                        {d.isInspector ? (
                          <Siren size={12} className="text-red-500" />
                        ) : (
                          <RoleIcon
                            size={12}
                            className={RoleColor ?? "text-zinc-400"}
                          />
                        )}
                        {d.isInspector ? "Inspector" : ROLES[d.role]?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {d.activeEvent && (
                        <div className="text-xs text-zinc-400 mb-1">
                          <div className="font-bold text-zinc-300">
                            {d.activeEvent.name}
                          </div>
                        </div>
                      )}
                      {d.eventImpact !== 0 ? (
                        <span
                          className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${d.eventImpact > 0 ? "text-emerald-400 bg-emerald-900/20" : "text-red-400 bg-red-900/20"}`}
                        >
                          {d.eventImpact > 0 ? "+" : ""}
                          {d.eventImpact}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {d.marketItems.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {d.marketItems.map((item, idx) => {
                            const S = SHOP_ITEMS[item];
                            return (
                              <div
                                key={idx}
                                className="text-xs text-zinc-400 flex items-center gap-1"
                              >
                                <ShoppingBag size={10} /> {S?.name}{" "}
                                <span className="text-red-400">
                                  -${S?.cost}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-zinc-600 italic text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {d.roleBonus > 0 ? (
                        <span className="text-yellow-400 font-mono text-xs">
                          +${d.roleBonus}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-2">
                        {d.transactions.length === 0 ? (
                          <span className="text-zinc-600 italic text-xs">
                            No activity.
                          </span>
                        ) : (
                          d.transactions.map((t, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col text-xs border-b border-zinc-800 pb-1 last:border-0"
                            >
                              <div className="flex justify-between w-full">
                                <span className="text-zinc-300 font-bold">
                                  {t.label}
                                </span>
                                <span
                                  className={`font-mono ${t.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}
                                >
                                  {t.amount >= 0 ? "+" : ""}
                                  {t.amount}
                                </span>
                              </div>
                              {t.items && t.items.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {t.items.map((c, ci) => (
                                    <div
                                      key={ci}
                                      className="bg-black/40 p-0.5 rounded border border-zinc-700"
                                      title={GOODS[c]?.name}
                                    >
                                      <CardIcon typeId={c} size={10} />
                                    </div>
                                  ))}
                                </div>
                              )}
                              {t.detail && (
                                <div className="text-[10px] text-zinc-500 mt-0.5">
                                  {t.detail}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold align-top">
                      <span
                        className={
                          d.net >= 0 ? "text-emerald-400" : "text-red-400"
                        }
                      >
                        {d.net >= 0 ? "+" : ""}
                        {d.net}
                      </span>
                    </td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden shadow-2xl mb-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-900/30 rounded-lg border border-emerald-500/20">
            <FileText className="text-emerald-500" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Mission Report</h3>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">
              {isFinal ? "Final Operation Audit" : "Round Summary"}
            </p>
          </div>
        </div>
      </div>

      {isFinal && (
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-bold transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "text-emerald-400 border-b-2 border-emerald-500 bg-emerald-900/10"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Conditionally Render Stash View or Table */}
      {isFinal && activeTab === "STASH"
        ? renderStashView()
        : renderTable(roundData, isFinal && activeTab === "FINAL")}
    </div>
  );
};

const StashModal = ({ stash, onClose }) => (
  <div className="fixed inset-0 bg-black/90 z-160 flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 max-w-lg w-full shadow-2xl flex flex-col max-h-[80vh]">
      <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Briefcase className="text-emerald-500" /> Stash ({stash.length})
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-2">
        {stash.length === 0 ? (
          <div className="col-span-4 text-center text-zinc-500 py-8 italic">
            Your stash is empty.
          </div>
        ) : (
          stash.map((cId, i) => {
            const info = GOODS[cId];
            if (!info) return null;
            const isIllegal = info.type === "ILLEGAL";
            return (
              <div
                key={i}
                className={`p-2 rounded border flex flex-col items-center gap-1 ${
                  isIllegal
                    ? "bg-red-900/10 border-red-900/30"
                    : "bg-emerald-900/10 border-emerald-900/30"
                }`}
              >
                <info.icon size={24} className={info.color} />
                <span className={`text-[10px] font-bold ${info.color}`}>
                  {info.name}
                </span>
                <span className="text-[9px] text-zinc-500">${info.val}</span>
              </div>
            );
          })
        )}
      </div>
      <div className="mt-4 pt-2 border-t border-zinc-800 text-center text-xs text-zinc-500">
        Total Base Value: $
        {stash.reduce((acc, c) => acc + (GOODS[c]?.val || 0), 0)}
      </div>
    </div>
  </div>
);

const OpponentStashModal = ({ player, onClose }) => {
  if (!player) return null;
  const stash = player.stash || [];

  // Calculate stats for the header
  const legalCount = stash.filter((id) => GOODS[id]?.type === "LEGAL").length;
  const unknownCount = stash.length - legalCount;

  return (
    <div className="fixed inset-0 bg-black/90 z-160 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 max-w-lg w-full shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <User size={20} className="text-zinc-400" />
              {player.name}'s Cargo
            </h3>
            <div className="text-xs text-zinc-500 mt-1">
              Visible:{" "}
              <span className="text-emerald-400">{legalCount} Legal</span> •
              Suspicious:{" "}
              <span className="text-red-400">{unknownCount} Unknown</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {stash.length === 0 ? (
            <div className="text-center text-zinc-500 py-12 italic border-2 border-dashed border-zinc-800 rounded-xl">
              Cargo Hold Empty
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {stash.map((cId, i) => {
                const info = GOODS[cId];
                // Logic: Only show face if strictly LEGAL.
                // Traps, Royal Goods, and Contraband are hidden.
                const isVisible = info && info.type === "LEGAL";

                return (
                  <div key={i} className="flex justify-center">
                    <Card typeId={cId} small={true} faceDown={!isVisible} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800 text-center">
          <div className="text-xs text-zinc-600 uppercase tracking-widest">
            Official Public Record
          </div>
        </div>
      </div>
    </div>
  );
};

const Card = ({ typeId, small, selected, onClick, faceDown }) => {
  const info = GOODS[typeId];
  if (!info) return null;
  const Icon = info.icon;

  const isIllegal = info.type === "ILLEGAL";
  const isTrap = info.type === "TRAP";
  // New check for Royal Goods
  const isRoyal = typeId.startsWith("ROYAL_");

  if (faceDown) {
    return (
      <div
        className={`
        relative shrink-0 rounded-xl border-2 border-zinc-700 bg-zinc-800 
        flex flex-col items-center justify-center shadow-lg
        ${small ? "w-10 h-14" : "w-20 h-32"}
      `}
      >
        <div className="opacity-20">
          <Package size={small ? 16 : 32} />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative shrink-0 rounded-xl border-2 flex flex-col items-center justify-between shadow-lg transition-all 
        ${
          selected
            ? "ring-4 ring-yellow-400 -translate-y-2 z-10 scale-105"
            : "hover:-translate-y-1"
        }
        ${
          // Priority Order: Trap -> Royal -> Illegal -> Legal
          isTrap
            ? "bg-orange-950/50 border-orange-600/50"
            : isRoyal
              ? "bg-purple-950/50 border-purple-500/50" // Purple for Royal Goods
              : isIllegal
                ? "bg-red-950/30 border-red-900/50"
                : "bg-emerald-950/30 border-emerald-900/50"
        }
        ${small ? "w-12 h-16 p-1" : "w-24 h-36 md:w-32 md:h-44 p-2 md:p-3"}
        ${onClick ? "cursor-pointer" : ""}
      `}
    >
      <div className="w-full flex justify-between items-start">
        <span
          className={`font-black ${
            small ? "text-[8px]" : "text-xs"
          } text-zinc-500`}
        >
          {isTrap ? "TRAP" : isRoyal ? "ROYAL" : isIllegal ? "!!" : "OK"}
        </span>
        <Icon size={small ? 10 : 16} className={info.color} />
      </div>

      <div className="flex flex-col items-center gap-1">
        <Icon
          size={small ? 16 : 32}
          className={`${info.color} drop-shadow-md`}
        />
        {!small && (
          <span
            className={`text-[10px] uppercase font-bold text-center leading-tight ${info.color}`}
          >
            {info.name}
          </span>
        )}
      </div>

      {!small && (
        <div className="w-full bg-black/40 rounded p-1 text-[8px] text-zinc-400 text-center leading-tight">
          {isTrap ? (
            "Inspector pays fine"
          ) : (
            <>
              val: {info.val} <br /> fine: {info.penalty}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const calculateKingQueenBonuses = (players) => {
  const legalTypes = ["MEDS", "FOOD", "PARTS", "TEXTILE"];
  const bonuses = {};

  players.forEach((p) => {
    bonuses[p.id] = { income: 0, details: [] };
  });

  legalTypes.forEach((type) => {
    const counts = players.map((p) => {
      let count = 0;
      // FIX: Safe array access + Safe item lookup
      (p.stash || []).forEach((itemId) => {
        const item = GOODS[itemId];
        if (!item) return; // Skip invalid items to prevent crash

        if (item.id === type) count += 1;
        if (item.legalType === type) count += item.legalCount || 0;
      });
      return { id: p.id, count, name: p.name };
    });

    counts.sort((a, b) => b.count - a.count);

    if (counts.length === 0) return; // Safety check

    const kingCount = counts[0].count;
    if (kingCount === 0) return;

    const kings = counts.filter((c) => c.count === kingCount);
    const queens = counts.filter((c) => c.count < kingCount && c.count > 0);

    const queenCount = queens.length > 0 ? queens[0].count : 0;
    const actualQueens = queens.filter((c) => c.count === queenCount);

    const kBonusVal = GOODS[type]?.kingBonus || 0; // Safe access
    const qBonusVal = GOODS[type]?.queenBonus || 0; // Safe access

    kings.forEach((k) => {
      bonuses[k.id].income += kBonusVal;
      bonuses[k.id].details.push(
        `King of ${GOODS[type]?.name} (+${kBonusVal})`,
      );
    });

    if (kings.length === 1 && actualQueens.length > 0) {
      actualQueens.forEach((q) => {
        bonuses[q.id].income += qBonusVal;
        bonuses[q.id].details.push(
          `Queen of ${GOODS[type]?.name} (+${qBonusVal})`,
        );
      });
    }
  });

  return bonuses;
};

const LeaveConfirmModal = ({ onConfirm, onCancel, isHost, onLobby }) => (
  <div className="fixed inset-0 bg-black/90 z-200 flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2">
        {isHost ? "Disband Operation?" : "Abandon Cargo?"}
      </h3>
      <p className="text-zinc-400 mb-6 text-sm">
        {isHost
          ? "You are the Host. Leaving will close the checkpoint and kick all players."
          : "Leaving now will forfeit your progress."}
      </p>
      <div className="flex flex-col gap-3">
        {isHost && onLobby && (
          <button
            onClick={onLobby}
            className="bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Home size={18} /> Return Everyone to Lobby
          </button>
        )}
        <button
          onClick={onConfirm}
          className="bg-red-900/80 hover:bg-red-800 text-red-200 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 border border-red-900"
        >
          <LogOut size={18} /> {isHost ? "Destroy Room & Exit" : "Leave Game"}
        </button>
        <button
          onClick={onCancel}
          className="text-zinc-500 hover:text-white py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-160 flex items-center justify-center pointer-events-none p-4">
    <div
      className={`
      flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl border-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] 
      transform transition-all animate-in fade-in zoom-in slide-in-from-bottom-5 duration-300 backdrop-blur-xl
      ${
        type === "success"
          ? "bg-emerald-900/90 border-emerald-500 text-emerald-100"
          : ""
      }
      ${type === "danger" ? "bg-red-900/90 border-red-500 text-red-100" : ""}
      ${
        type === "neutral" ? "bg-zinc-800/90 border-zinc-500 text-zinc-100" : ""
      }
      ${
        type === "bribe"
          ? "bg-yellow-900/90 border-yellow-500 text-yellow-100"
          : ""
      }
    `}
    >
      {Icon && (
        <div className="mb-4 p-4 bg-black/30 rounded-full border-2 border-white/20 shadow-xl">
          <Icon size={48} className="animate-bounce" />
        </div>
      )}
      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-widest text-center drop-shadow-lg mb-2">
        {message}
      </h2>
      {subtext && (
        <p className="text-xl md:text-2xl font-bold opacity-90 tracking-wide text-center">
          {subtext}
        </p>
      )}
    </div>
  </div>
);

const ShopModal = ({ isOpen, onClose, player, onBuy }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/90 z-100 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-yellow-600/30 shadow-2xl overflow-hidden">
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-yellow-500 flex items-center gap-2">
            <ShoppingBag /> Black Market
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-white font-mono flex items-center gap-1 bg-zinc-800 px-3 py-1 rounded-full">
              <Coins size={14} className="text-yellow-500" /> ${player.coins}
            </span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-full"
            >
              <X className="text-zinc-400" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(SHOP_ITEMS).map((item) => {
            const hasItem = player.upgrades?.includes(item.id);
            const canAfford = player.coins >= item.cost;
            return (
              <div
                key={item.id}
                className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 flex flex-col justify-between group hover:border-yellow-500/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-black/50 rounded-lg text-yellow-500">
                    <item.icon size={24} />
                  </div>
                  <span className="text-sm font-mono text-zinc-400">
                    ${item.cost}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-white mb-1">
                  {item.name}
                </h3>
                <p className="text-xs text-zinc-400 mb-4 h-8">{item.desc}</p>
                <button
                  onClick={() => onBuy(item)}
                  disabled={hasItem || !canAfford}
                  className={`w-full py-2 rounded font-bold text-sm transition-all
                    ${
                      hasItem
                        ? "bg-zinc-700 text-zinc-500 cursor-default"
                        : canAfford
                          ? "bg-yellow-600 hover:bg-yellow-500 text-black shadow-lg shadow-yellow-900/20"
                          : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    }`}
                >
                  {hasItem ? "OWNED" : canAfford ? "BUY" : "TOO POOR"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const LogViewer = ({ logs, onClose }) => (
  <div className="fixed top-16 right-4 w-64 max-h-60 bg-gray-900/95 border border-gray-700 rounded-xl z-155 overflow-y-auto p-2 shadow-2xl">
    <div className="bg-zinc-900 w-full md:max-w-md h-full md:h-[70vh] rounded-none md:rounded-xl flex flex-col border-none md:border border-zinc-700 shadow-2xl">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <History size={18} className="text-emerald-500" /> Operation Logs
        </h3>
        <button
          onClick={onClose}
          className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700"
        >
          <X className="text-zinc-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {[...logs].reverse().map((log, i) => (
          <div
            key={i}
            className={`text-xs md:text-sm p-3 rounded border-l-2 ${
              log.type === "danger"
                ? "bg-red-900/10 border-red-500 text-red-300"
                : log.type === "success"
                  ? "bg-green-900/10 border-green-500 text-green-300"
                  : log.type === "bribe"
                    ? "bg-yellow-900/10 border-yellow-500 text-yellow-300"
                    : "bg-zinc-800/50 border-zinc-600 text-zinc-400"
            }`}
          >
            <span className="opacity-50 mr-2 font-mono">
              [
              {new Date(parseInt(log.id)).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
              ]
            </span>
            {log.text}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const RulesModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-150 flex items-center justify-center p-0 md:p-4 animate-in fade-in">
    <div className="bg-zinc-900 md:rounded-2xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-hidden border-none md:border border-emerald-500/30 flex flex-col shadow-2xl">
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wider">
          <BookOpen className="text-emerald-500" /> Smuggler's Guide
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400"
        >
          <X />
        </button>
      </div>

      <div className="p-6 overflow-y-auto text-zinc-300 space-y-8 scrollbar-thin scrollbar-thumb-zinc-700">
        {/* Intro */}
        <section className="text-center space-y-2">
          <h3 className="text-3xl font-black text-emerald-400 uppercase tracking-widest">
            The Goal
          </h3>
          <p className="text-lg text-zinc-400">
            Amass the biggest fortune. Money is earned by smuggling goods and
            collecting fines. The player with the highest total value (Cash +
            Stash Bonus) when the deck runs out wins.
          </p>
        </section>

        {/* Game Loop */}
        <section className="grid md:grid-cols-3 gap-4">
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
            <h4 className="font-bold text-yellow-500 mb-2 flex items-center gap-2">
              <ShoppingBag size={16} /> 1. The Market
            </h4>
            <p className="text-sm">
              Buy illegal upgrades from the Black Market. Deep pockets, crate
              extensions, and scanners can turn the tide.
            </p>
          </div>
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
            <h4 className="font-bold text-emerald-500 mb-2 flex items-center gap-2">
              <Package size={16} /> 2. Load & Bluff
            </h4>
            <p className="text-sm">
              Pack up to 3 cards. You must declare a legal good type. You can
              lie. You can also attach a cash <strong>Bribe</strong> to tempt
              the Inspector.
            </p>
          </div>
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
            <h4 className="font-bold text-red-500 mb-2 flex items-center gap-2">
              <Siren size={16} /> 3. Inspection
            </h4>
            <p className="text-sm">
              The Inspector chooses to <strong>PASS</strong> or{" "}
              <strong>OPEN</strong>. If passed, you sell goods immediately. If
              opened and caught lying, you pay a fine!
            </p>
          </div>
        </section>

        {/* Inspection Details */}
        <section className="bg-zinc-800/30 p-5 rounded-xl border border-zinc-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" /> Inspection Mechanics
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <ul className="space-y-2">
              <li className="flex gap-2">
                <span className="text-green-400 font-bold min-w-[60px]">
                  PASS:
                </span>{" "}
                Smuggler keeps goods & earns full value immediately.
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-400 font-bold min-w-[60px]">
                  BRIBE:
                </span>{" "}
                If Inspector accepts bribe, crate passes. Inspector keeps bribe.
              </li>
              <li className="flex gap-2">
                <span className="text-orange-400 font-bold min-w-[60px]">
                  TRAP:
                </span>{" "}
                If opened crate has a{" "}
                <span className="text-orange-500 font-bold">Booby Trap</span>,
                Inspector pays $200 fine!
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex gap-2">
                <span className="text-red-400 font-bold min-w-[60px]">
                  BUSTED:
                </span>{" "}
                If opened & lying (or contraband): Smuggler pays fine. Illegal
                goods seized.
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold min-w-[60px]">
                  CLEAN:
                </span>{" "}
                If opened & telling truth: Inspector pays fine to Smuggler for
                wasting time.
              </li>
            </ul>
          </div>
        </section>

        {/* Roles */}
        <section>
          <h3 className="text-xl font-bold text-white mb-4">Player Roles</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2 font-bold text-blue-400 mb-1">
                <Flag size={16} /> Diplomat
              </div>
              <div className="text-xs text-zinc-400">
                Pays 50% less fines when caught.
              </div>
            </div>
            <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2 font-bold text-purple-400 mb-1">
                <Ghost size={16} /> Yakuza
              </div>
              <div className="text-xs text-zinc-400">
                +20% immediate value for Illegal goods.
              </div>
            </div>
            <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
              <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1">
                <Briefcase size={16} /> Merchant
              </div>
              <div className="text-xs text-zinc-400">
                +20% immediate value for Legal goods.
              </div>
            </div>
            <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-2 font-bold text-yellow-400 mb-1">
                <Eye size={16} /> Snitch
              </div>
              <div className="text-xs text-zinc-400">
                Get $100 whenever someone else is fined.
              </div>
            </div>
          </div>
        </section>

        {/* --- NEW SECTION: BLACK MARKET ITEMS --- */}
        <section>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShoppingBag className="text-yellow-500" /> Black Market Items
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.values(SHOP_ITEMS).map((item) => (
              <div
                key={item.id}
                className="p-3 bg-zinc-800/50 border border-yellow-600/20 rounded-lg flex flex-col gap-1"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 font-bold text-yellow-500">
                    <item.icon size={16} /> {item.name}
                  </div>
                  <span className="text-xs font-mono text-zinc-300 bg-black/40 px-2 py-0.5 rounded border border-zinc-700">
                    ${item.cost}
                  </span>
                </div>
                <div className="text-xs text-zinc-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>
        {/* --------------------------------------- */}

        {/* Events */}
        <section>
          <h3 className="text-xl font-bold text-white mb-4">Global Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-3 p-2 bg-zinc-800 rounded">
              <Bomb size={16} className="text-red-500" />{" "}
              <span>
                <strong>War Zone:</strong> Weapons and Machinery sell for 2x
                value.
              </span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-zinc-800 rounded">
              <Skull size={16} className="text-purple-500" />{" "}
              <span>
                <strong>Pandemic:</strong> Meds and Foods sell for 2x value.
              </span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-zinc-800 rounded">
              <Siren size={16} className="text-blue-500" />{" "}
              <span>
                <strong>Crackdown:</strong> All fines are doubled.
              </span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-zinc-800 rounded">
              <TrendingUp size={16} className="text-green-500" />{" "}
              <span>
                <strong>Free Trade:</strong> All fines are halved.
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
);

// --- UPDATED SPLASH SCREEN (With Loading Indicator) ---
const SplashScreen = ({ onStart }) => {
  const [hasSession, setHasSession] = useState(false);

  // State 1: Image is downloaded and ready to show
  const [isLoaded, setIsLoaded] = useState(false);
  // State 2: Button is ready to slide in (after zoom)
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // 1. Check Session immediately
    const saved = localStorage.getItem("contraband_roomId");
    setHasSession(!!saved);

    // 2. Preload the image
    const img = new Image();
    img.src = CoverImage;

    img.onload = () => {
      // Image is downloaded. Start the show.
      setIsLoaded(true);

      // Start the 2-second timer for the button *after* image loads
      setTimeout(() => {
        setShowButton(true);
      }, 2000);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-end pb-20 md:justify-center md:pb-0 font-sans overflow-hidden">
      {/* --- NEW: LOADING INDICATOR --- */}
      {/* This shows only while the image is NOT loaded yet */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-emerald-500/50">
          <Loader size={48} className="animate-spin mb-4" />
          <div className="font-mono text-xs tracking-[0.3em] animate-pulse">
            INITIALIZING SYSTEM...
          </div>
        </div>
      )}

      {/* Background Image Container */}
      {/* Opacity 0 -> 100 ensures a smooth fade-in once loaded */}
      <div
        className={`absolute inset-0 z-0 overflow-hidden transition-opacity duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"}`}
      >
        <div
          className={`w-full h-full bg-cover bg-center transition-transform duration-[2000ms] ease-out ${
            isLoaded ? "scale-100" : "scale-130"
          }`}
          style={{ backgroundImage: `url(${CoverImage})` }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        {/* Pulsing Action Button */}
        <div
          className={`transform transition-all duration-1000 ease-out ${
            showButton
              ? "translate-y-0 opacity-100"
              : "translate-y-32 opacity-0"
          }`}
        >
          <button
            onClick={onStart}
            className="group relative px-12 py-5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 font-black text-2xl tracking-widest rounded-none transform transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] backdrop-blur-md overflow-hidden"
          >
            {/* Animated Scanline overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent translate-y-[-100%] animate-[scan_2s_infinite_linear]" />

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
      <div className="absolute bottom-4 text-slate-600 text-xs text-center">
        Inspired by Sheriff of Nottingham. A tribute game.
        <br />
        Developed by <strong>RAWFID K SHUVO</strong>.
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
      `}</style>
    </div>
  );
};

// --- Main Component ---
export default function ContrabandGame() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("splash");

  const [roomId, setRoomId] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);

  // UI States
  const [showRules, setShowRules] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showStash, setShowStash] = useState(false);
  // ... inside ContrabandGame component
  const [opponentStashId, setOpponentStashId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Interaction States
  const [selectedCards, setSelectedCards] = useState([]);
  const [declaredType, setDeclaredType] = useState("FOOD");
  const [bribeAmount, setBribeAmount] = useState(0);
  const [lastBribeUpdate, setLastBribeUpdate] = useState(0);

  //read and fill global name
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem("gameHub_playerName") || "",
  );
  //set global name for all game
  useEffect(() => {
    if (playerName) localStorage.setItem("gameHub_playerName", playerName);
  }, [playerName]);

  // --- Auth & Listener ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 3. NEW FUNCTION: Handle Splash Button Click
  const handleSplashStart = () => {
    const savedRoomId = localStorage.getItem("contraband_roomId");

    if (savedRoomId) {
      setLoading(true);
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

  // --- Session Restoration ---
  // useEffect(() => {
  //   const savedRoomId = localStorage.getItem("contraband_roomId");
  //   if (savedRoomId) {
  //     setRoomId(savedRoomId);
  //   }
  // }, []);

  // --- Inside ContrabandGame component ---

  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (!data.players?.some((p) => p.id === user.uid)) {
            setRoomId("");
            setView("menu");
            localStorage.removeItem("contraband_roomId");
            setError("Connection Lost or Room Closed.");
            return;
          }
          setGameState(data);
          if (data.status === "lobby") setView("lobby");
          else setView("game");

          // --- UPDATED LOGIC HERE ---
          if (
            data.feedbackTrigger &&
            data.feedbackTrigger.id !== gameState?.feedbackTrigger?.id
          ) {
            // Check if this feedback is restricted to a specific user
            const isVisible =
              !data.feedbackTrigger.visibleTo ||
              data.feedbackTrigger.visibleTo === user.uid;

            if (isVisible) {
              setFeedback(data.feedbackTrigger);
              setTimeout(() => setFeedback(null), 3000);
            }
          }
          // --------------------------
        } else {
          setRoomId("");
          setView("menu");
          localStorage.removeItem("contraband_roomId");
          setError("Room Closed.");
        }
      },
    );
    return () => unsub();
  }, [roomId, user, gameState?.feedbackTrigger?.id]); // Ensure dependencies are correct

  // --- Helpers ---
  const me = gameState?.players.find((p) => p.id === user?.uid) || {};
  const isInspector =
    gameState?.players[gameState?.inspectorIndex]?.id === user?.uid;
  const isHost = gameState?.hostId === user?.uid;
  const currentEvent = gameState?.marketEvent
    ? EVENTS[gameState.marketEvent.id]
    : EVENTS.NORMAL;

  const totalRounds =
    gameState?.inspectorOrder?.length || gameState?.players.length || 0;

  useEffect(() => {
    if (me.loadedCrate && me.loadedCrate.bribe !== undefined) {
      setBribeAmount(me.loadedCrate.bribe);
    }
  }, [me.loadedCrate]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists() && doc.data()[GAME_ID]?.maintenance)
        setIsMaintenance(true);
      else setIsMaintenance(false);
    });
    return () => unsub();
  }, []);

  // --- Game Actions ---
  const createRoom = async () => {
    if (!playerName.trim()) return setError("Codename required.");
    setLoading(true);
    const chars = "123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";
    let newRoomId = "";
    for (let i = 0; i < 6; i++) {
      newRoomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const initialData = {
      roomId: newRoomId,
      hostId: user.uid,
      gameLength: "SHORT", // Default
      status: "lobby",
      players: [
        {
          id: user.uid,
          name: playerName,
          coins: STARTING_COINS,
          hand: [],
          stash: [],
          upgrades: [],
          role: null,
          loadedCrate: null,
          ready: false,
        },
      ],
      deck: [],
      inspectorIndex: 0,
      turnState: "IDLE",
      marketEvent: EVENTS.NORMAL,
      logs: [],
      currentRound: 1,
      inspectorOrder: [],
      roundHistory: [],
      currentRoundStats: {},
    };
    await setDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", newRoomId),
      initialData,
    );
    localStorage.setItem("contraband_roomId", newRoomId);
    setRoomId(newRoomId);
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCodeInput || !playerName) return setError("Missing Info.");
    setLoading(true);
    try {
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
      if (!snap.exists()) throw new Error("Room not found.");
      if (snap.data().status !== "lobby") throw new Error("Game in progress.");
      if (snap.data().players.length >= 6) throw new Error("Full.");

      const newPlayer = {
        id: user.uid,
        name: playerName,
        coins: STARTING_COINS,
        hand: [],
        stash: [],
        upgrades: [],
        role: null,
        loadedCrate: null,
        ready: false,
      };
      await updateDoc(ref, { players: arrayUnion(newPlayer) });
      localStorage.setItem("contraband_roomId", roomCodeInput);
      setRoomId(roomCodeInput);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const leaveRoom = async () => {
    if (!roomId) return;
    const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data.hostId === user.uid) {
          await deleteDoc(ref);
        } else {
          const updatedPlayers = data.players.filter((p) => p.id !== user.uid);
          await updateDoc(ref, { players: updatedPlayers });
        }
      }
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("contraband_roomId");
    setRoomId("");
    setView("menu");
    setShowLeaveConfirm(false);
  };

  const kickPlayer = async (playerId) => {
    if (!isHost || !roomId) return;
    const updatedPlayers = gameState.players.filter((p) => p.id !== playerId);
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players: updatedPlayers },
    );
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

  const returnToLobby = async () => {
    const resetPlayers = gameState.players.map((p) => ({
      ...p,
      coins: STARTING_COINS,
      hand: [],
      stash: [],
      upgrades: [],
      role: null,
      loadedCrate: null,
      ready: false,
    }));
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        players: resetPlayers,
        logs: [],
        deck: [],
        turnState: "IDLE",
        winner: null,
        feedbackTrigger: null,
        marketEvent: EVENTS.NORMAL,
        currentRound: 1,
        inspectorOrder: [],
        roundHistory: [],
        currentRoundStats: {},
      },
    );
    setShowLeaveConfirm(false);
  };

  const startGame = async () => {
    if (gameState.players.length < 3) return setError("Need 3+ Players.");
    const deck = shuffle(
      generateDeck(gameState.players.length, gameState.gameLength),
    );

    // HANDLE GAME LENGTH
    let inspectorOrder = gameState.players.map((_, i) => i);
    if (gameState.gameLength === "LONG") {
      // Double the order: [0, 1, 2, 0, 1, 2]
      inspectorOrder = [...inspectorOrder, ...inspectorOrder];
    }
    inspectorOrder = shuffle(inspectorOrder); // Shuffle who goes when

    const firstInspectorIdx = inspectorOrder[0]; // Get the index
    const firstInspectorId = gameState.players[firstInspectorIdx].id;
    const initialRoundStats = {};

    let players = assignRandomRoles(gameState.players);

    // --- CHANGE: Force Inspector role to null ---
    players[firstInspectorIdx].role = null;

    players = players.map((p) => {
      const hand = [];
      const handSize = 6;
      for (let j = 0; j < handSize; j++) {
        const card = drawSafeCard(deck, hand);
        if (card) hand.push(card);
      }

      initialRoundStats[p.id] = {
        role: p.role, // This will now be null for inspector
        isInspector: p.id === firstInspectorId,
        income: 0,
        expense: 0,
        transactions: [],
      };

      return {
        ...p,
        hand,
        coins: STARTING_COINS,
        stash: [],
        upgrades: [],
        loadedCrate: null,
        ready: false,
      };
    });

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        players,
        deck,
        inspectorOrder,
        inspectorIndex: firstInspectorIdx,
        currentRound: 1,
        currentRoundStats: initialRoundStats,
        roundHistory: [],
        turnState: "SHOPPING",
        marketEvent: EVENTS.NORMAL,
        logs: [
          {
            id: Date.now().toString(),
            text: "Market Open. Roles Assigned.",
            type: "neutral",
          },
        ],
      },
    );
  };

  const toggleReady = async () => {
    const players = gameState.players.map((p) =>
      p.id === user.uid ? { ...p, ready: !p.ready } : p,
    );

    // LOGIC 1: End of Market Phase
    if (
      gameState.status === "playing" &&
      gameState.turnState === "SHOPPING" &&
      players.every((p) => p.ready)
    ) {
      players.forEach((p) => (p.ready = false));
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          turnState: "LOADING",
          logs: arrayUnion({
            id: Date.now().toString(),
            text: "Loading Phase Begun.",
            type: "neutral",
          }),
        },
      );
      return;
    }

    // LOGIC 2: End of Round Summary (NEW)
    if (
      gameState.status === "playing" &&
      gameState.turnState === "ROUND_SUMMARY"
    ) {
      // If everyone is ready, proceed
      if (players.every((p) => p.ready)) {
        // Trigger the next round logic
        await startNextRound();
        return;
      }
    }

    // Standard ready toggle update
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players },
    );
  };

  const buyItem = async (item) => {
    if (me.coins < item.cost) return;
    let updatedDeck = [...gameState.deck];

    // Update stats
    let stats = getUpdatedStats(gameState.currentRoundStats, user.uid, {
      expense: item.cost,
      marketItem: item.id,
    });

    const players = gameState.players.map((p) => {
      if (p.id === user.uid) {
        let newHand = [...p.hand];
        if (item.id === "POCKETS" && updatedDeck.length > 0) {
          const card = drawSafeCard(updatedDeck, newHand);
          if (card) newHand.push(card);
        }
        return {
          ...p,
          hand: newHand,
          coins: p.coins - item.cost,
          upgrades: [...(p.upgrades || []), item.id],
        };
      }
      return p;
    });
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players, deck: updatedDeck, currentRoundStats: stats },
    );
  };

  const updateBribe = async () => {
    if (Date.now() - lastBribeUpdate < 2000) return;
    const newAmount = parseInt(bribeAmount);
    if (isNaN(newAmount) || newAmount < 0) return;
    const currentBribe = me.loadedCrate?.bribe || 0;
    const diff = newAmount - currentBribe;
    if (me.coins - diff < 0) return;
    setLastBribeUpdate(Date.now());
    const players = gameState.players.map((p) => {
      if (p.id === user.uid) {
        return {
          ...p,
          coins: p.coins - diff,
          loadedCrate: { ...p.loadedCrate, bribe: newAmount },
        };
      }
      return p;
    });
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players },
    );
  };

  const loadCrate = async () => {
    const maxCards = me.upgrades?.includes("EXPANDED") ? 5 : 4;
    if (selectedCards.length === 0 || selectedCards.length > maxCards) return;
    const bribeVal = Math.max(0, parseInt(bribeAmount) || 0);
    if (bribeVal > 0 && bribeVal > me.coins) return;
    const myIdx = gameState.players.findIndex((p) => p.id === user.uid);
    const players = [...gameState.players];
    const hand = [...players[myIdx].hand];
    const crateCards = [];
    [...selectedCards]
      .sort((a, b) => b - a)
      .forEach((idx) => {
        crateCards.push(hand[idx]);
        hand.splice(idx, 1);
      });
    players[myIdx].hand = hand;
    players[myIdx].coins -= bribeVal;
    players[myIdx].loadedCrate = {
      cards: crateCards,
      declaration: declaredType,
      bribe: bribeVal,
    };
    const inspectorId = players[gameState.inspectorIndex].id;
    const allLoaded = players.every(
      (p) => p.id === inspectorId || p.loadedCrate !== null,
    );
    let update = { players };
    if (allLoaded) {
      update.turnState = "INSPECTING";
      update.logs = arrayUnion({
        id: Date.now().toString(),
        text: "Inspection Phase.",
        type: "neutral",
      });
    }
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      update,
    );
    setSelectedCards([]);
    setBribeAmount(0);
  };

  const inspectCrate = async (targetId, action) => {
    const inspector = gameState.players[gameState.inspectorIndex];
    const players = [...gameState.players];
    const targetIdx = players.findIndex((p) => p.id === targetId);
    const inspectorIdx = players.findIndex((p) => p.id === inspector.id);
    const target = players[targetIdx];
    if (!target.loadedCrate) return;

    const inspectorHasScanner = inspector.upgrades?.includes("SCANNER");
    const targetHasConceal = target.upgrades?.includes("CONCEAL");
    const snitchBonus = players.filter(
      (p) => p.role === "SNITCH" && p.id !== target.id,
    );

    let stats = { ...gameState.currentRoundStats };

    // --- HELPER 1: Calculate Sales Event Bonus (UPDATED) ---
    const calculateSaleStats = (items) => {
      let total = 0;
      let impact = 0;
      items.forEach((c) => {
        const itemInfo = GOODS[c];
        if (!itemInfo) return;

        let base = itemInfo.val;
        let final = base;

        // Check 1: Is this specific item ID targeted? (War, Pandemic, Ind. Rev)
        const isIdMatch = Array.isArray(currentEvent.target)
          ? currentEvent.target.includes(c)
          : currentEvent.target === c;

        // Check 2: Is the category targeted? (Recession, Deflation)
        const isCategoryMatch =
          (currentEvent.target === "ALL_ILLEGAL" &&
            itemInfo.type === "ILLEGAL") ||
          (currentEvent.target === "ALL_LEGAL" && itemInfo.type === "LEGAL");

        if (isIdMatch || isCategoryMatch) {
          final = Math.floor(base * currentEvent.multiplier);
        }

        total += final;
        impact += final - base;
      });
      return { total, impact };
    };

    // --- HELPER 2: Calculate Fine Event Impact ---
    const calculateFineStats = (items, isSmugglerPaying) => {
      let baseFine = items.reduce((sum, c) => sum + GOODS[c].penalty, 0);
      let roleSavings = 0;

      // Diplomat Fix: Only apply discount if Smuggler is PAYING
      if (isSmugglerPaying && target.role === "DIPLOMAT") {
        roleSavings = baseFine * 0.5;
        baseFine *= 0.5;
      }

      let finalFine = baseFine;
      if (currentEvent.id === "CRACKDOWN") finalFine *= 2;
      if (currentEvent.id === "FREE_TRADE") finalFine *= 0.5;

      const eventImpact = baseFine - finalFine;
      return { finalFine, roleSavings, eventImpact };
    };

    // --- HELPER 3: Apply Merchant/Yakuza bonuses ---
    const applyGoodsBonus = (pIdx, items) => {
      const p = players[pIdx];
      let bonus = 0;
      if (p.role === "MERCHANT") {
        const legalItems = items.filter((c) => GOODS[c].type === "LEGAL");
        const val = legalItems.reduce((acc, c) => acc + (GOODS[c].val || 0), 0);
        bonus = Math.floor(val * 0.2);
      } else if (p.role === "YAKUZA") {
        const illegalItems = items.filter((c) => GOODS[c].type === "ILLEGAL");
        const val = illegalItems.reduce(
          (acc, c) => acc + (GOODS[c].val || 0),
          0,
        );
        bonus = Math.floor(val * 0.2);
      }

      if (bonus > 0) {
        players[pIdx].coins += bonus;
        players[pIdx].coins = Math.floor(players[pIdx].coins);
        stats = getUpdatedStats(stats, p.id, {
          income: bonus,
          roleBonus: bonus,
          transaction: {
            label: `${ROLES[p.role].name} Bonus`,
            amount: bonus,
            detail: "Role ability triggered",
          },
        });
      }
    };

    // --- REST OF LOGIC (Unchanged) ---
    if (action === "PEEK") {
      if (target.loadedCrate.scanned) return;
      const randomCard =
        target.loadedCrate.cards[
          Math.floor(Math.random() * target.loadedCrate.cards.length)
        ];
      const updatedPlayers = [...players];
      updatedPlayers[targetIdx].loadedCrate = {
        ...updatedPlayers[targetIdx].loadedCrate,
        scanned: true,
      };
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: updatedPlayers,
          logs: arrayUnion({
            id: Date.now().toString(),
            text: `Inspector used scanner in ${target.name}'s crate!`,
            type: "neutral",
          }),
          feedbackTrigger: {
            id: Date.now(),
            type: "neutral",
            message: "SCAN RESULT",
            subtext: `Found: ${GOODS[randomCard].name}`,
            visibleTo: inspector.id,
          },
        },
      );
      return;
    }

    let logs = [];
    let fb = null;

    if (action === "PASS" || action === "ACCEPT_BRIBE") {
      const bribe = target.loadedCrate.bribe || 0;
      if (action === "ACCEPT_BRIBE" && bribe > 0) {
        players[inspectorIdx].coins += bribe;
        logs.push({
          id: Date.now().toString(),
          text: `Inspector accepted $${bribe} bribe from ${target.name}.`,
          type: "bribe",
        });

        stats = getUpdatedStats(stats, inspector.id, {
          income: bribe,
          transaction: {
            label: "Bribe Accepted",
            amount: bribe,
            detail: `From ${target.name}`,
          },
        });
        stats = getUpdatedStats(stats, target.id, {
          expense: bribe,
          transaction: {
            label: "Bribe Paid",
            amount: -bribe,
            detail: `To ${inspector.name}`,
          },
        });
      } else {
        players[targetIdx].coins += bribe;
        logs.push({
          id: Date.now().toString(),
          text: `Inspector passed ${target.name}.`,
          type: "success",
        });
        stats = getUpdatedStats(stats, inspector.id, {
          transaction: {
            label: "Pass Decision",
            amount: 0,
            detail: `Passed ${target.name}`,
          },
        });
        if (bribe > 0)
          stats = getUpdatedStats(stats, target.id, {
            income: bribe,
            transaction: { label: "Bribe Returned", amount: bribe },
          });
      }

      // SALES CALCULATION (Uses new Helper 1)
      const { total: saleValue, impact } = calculateSaleStats(
        target.loadedCrate.cards,
      );
      players[targetIdx].coins += saleValue;

      stats = getUpdatedStats(stats, target.id, {
        income: saleValue,
        eventImpact: impact,
        transaction: {
          label: "Goods Sold",
          amount: saleValue,
          items: target.loadedCrate.cards,
          detail:
            impact !== 0
              ? `Event Impact: ${impact > 0 ? "+" : ""}$${impact}`
              : "",
        },
      });

      players[targetIdx].stash.push(...target.loadedCrate.cards);
      applyGoodsBonus(targetIdx, target.loadedCrate.cards);
    } else if (action === "OPEN") {
      const bribe = target.loadedCrate.bribe || 0;
      players[targetIdx].coins += bribe;
      if (bribe > 0)
        stats = getUpdatedStats(stats, target.id, {
          income: bribe,
          transaction: { label: "Bribe Returned", amount: bribe },
        });

      const cards = target.loadedCrate.cards;
      const declared = target.loadedCrate.declaration;

      const hasTrap = cards.includes("TRAP");
      if (hasTrap) {
        players[inspectorIdx].coins -= 200;
        players[targetIdx].coins += 200;

        stats = getUpdatedStats(stats, inspector.id, {
          expense: 200,
          transaction: {
            label: "Trap Exploded",
            amount: -200,
            detail: "Booby Trap triggered",
          },
        });
        stats = getUpdatedStats(stats, target.id, {
          income: 200,
          transaction: {
            label: "Trap Reward",
            amount: 200,
            detail: "Inspector triggered trap",
          },
        });

        const remainingCards = cards.filter((c) => c !== "TRAP");
        // SALES CALCULATION (Survivors)
        const { total: saleValue, impact } = calculateSaleStats(remainingCards);
        players[targetIdx].coins += saleValue;

        stats = getUpdatedStats(stats, target.id, {
          income: saleValue,
          eventImpact: impact,
          transaction: {
            label: "Survivors Sold",
            amount: saleValue,
            items: remainingCards,
            detail:
              impact !== 0
                ? `Event Impact: ${impact > 0 ? "+" : ""}$${impact}`
                : "",
          },
        });
        players[targetIdx].stash.push(...remainingCards);
        applyGoodsBonus(targetIdx, remainingCards);

        logs.push({
          id: Date.now().toString(),
          text: `BOOM! Booby Trap! Inspector pays $200.`,
          type: "danger",
        });
        fb = {
          id: Date.now(),
          type: "danger",
          message: "BOOBY TRAP!",
          subtext: "Inspector blown up.",
        };
      } else {
        let illegalCards = cards.filter(
          (c) => GOODS[c].type === "ILLEGAL" || c !== declared,
        );

        if (targetHasConceal && illegalCards.length > 0) {
          illegalCards.sort((a, b) => GOODS[a].val - GOODS[b].val);
          const savedCard = illegalCards.pop();
          logs.push({
            id: Date.now().toString(),
            text: `${target.name}'s Hidden Compartment saved an item!`,
            type: "neutral",
          });
        }

        if (illegalCards.length === 0) {
          // CLEAN - Calculate Fine & Impact
          const { finalFine: penalty, eventImpact } = calculateFineStats(
            cards,
            false,
          );

          players[inspectorIdx].coins -= penalty;
          players[targetIdx].coins += penalty;

          stats = getUpdatedStats(stats, inspector.id, {
            expense: penalty,
            transaction: {
              label: "Wrongful Search",
              amount: -penalty,
              detail: "Paid compensation",
            },
          });
          stats = getUpdatedStats(stats, target.id, {
            income: penalty,
            eventImpact: eventImpact,
            transaction: {
              label: "Clean Bonus",
              amount: penalty,
              detail: "Compensation received",
            },
          });

          const { total: saleValue, impact: saleImpact } =
            calculateSaleStats(cards);
          players[targetIdx].coins += saleValue;

          stats = getUpdatedStats(stats, target.id, {
            income: saleValue,
            eventImpact: saleImpact,
            transaction: {
              label: "Goods Sold",
              amount: saleValue,
              items: cards,
              detail:
                saleImpact !== 0
                  ? `Event Impact: ${saleImpact > 0 ? "+" : ""}$${saleImpact}`
                  : "",
            },
          });

          players[targetIdx].stash.push(...cards);
          applyGoodsBonus(targetIdx, cards);

          logs.push({
            id: Date.now().toString(),
            text: `CLEAN! Inspector pays $${penalty} fine.`,
            type: "danger",
          });
          fb = {
            id: Date.now(),
            type: "danger",
            message: "CLEAN",
            subtext: "Inspector pays fine.",
          };
        } else {
          // BUSTED
          let seized = [];
          let kept = [];

          cards.forEach((c) => {
            if (illegalCards.includes(c)) {
              seized.push(c);
              const idx = illegalCards.indexOf(c);
              if (idx > -1) illegalCards.splice(idx, 1);
            } else {
              kept.push(c);
            }
          });

          // Calculate Fine on Seized items
          const { finalFine, roleSavings, eventImpact } = calculateFineStats(
            seized,
            true,
          );

          players[targetIdx].coins -= finalFine;
          players[inspectorIdx].coins += finalFine;

          stats = getUpdatedStats(stats, target.id, {
            expense: finalFine,
            roleBonus: roleSavings,
            eventImpact: eventImpact,
            transaction: {
              label: "Fine Paid",
              amount: -finalFine,
              detail: `Seized: ${seized.length} items`,
            },
          });
          stats = getUpdatedStats(stats, inspector.id, {
            income: finalFine,
            transaction: {
              label: "Fine Collected",
              amount: finalFine,
              items: seized,
            },
          });

          const { total: saleValue, impact: saleImpact } =
            calculateSaleStats(kept);
          players[targetIdx].coins += saleValue;

          if (saleValue > 0)
            stats = getUpdatedStats(stats, target.id, {
              income: saleValue,
              eventImpact: saleImpact,
              transaction: {
                label: "Kept Goods Sold",
                amount: saleValue,
                items: kept,
                detail:
                  saleImpact !== 0
                    ? `Event Impact: ${saleImpact > 0 ? "+" : ""}$${saleImpact}`
                    : "",
              },
            });

          players[targetIdx].stash.push(...kept);
          applyGoodsBonus(targetIdx, kept);

          snitchBonus.forEach((s) => {
            const sIdx = players.findIndex((pl) => pl.id === s.id);
            if (sIdx > -1) {
              players[sIdx].coins += 100;
              stats = getUpdatedStats(stats, s.id, {
                income: 100,
                roleBonus: 100,
                transaction: {
                  label: "Snitch Reward",
                  amount: 100,
                  detail: `${target.name} busted`,
                },
              });
            }
          });

          logs.push({
            id: Date.now().toString(),
            text: `BUSTED! ${target.name} pays $${finalFine}. ${seized.length} items seized.`,
            type: "success",
          });
          fb = {
            id: Date.now(),
            type: "success",
            message: "BUSTED",
            subtext: `Contraband Seized!`,
          };
        }
      }
    }

    players[targetIdx].loadedCrate = null;
    const pending = players.filter(
      (p) => p.id !== inspector.id && p.loadedCrate !== null,
    );

    if (pending.length === 0) {
      const historyEntry = {
        stats: stats,
        event: currentEvent || EVENTS.NORMAL,
      };
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          logs: arrayUnion(...logs),
          currentRoundStats: stats,
          roundHistory: arrayUnion(historyEntry),
          turnState: "ROUND_SUMMARY",
          feedbackTrigger: fb,
        },
      );
    } else {
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          logs: arrayUnion(...logs),
          currentRoundStats: stats,
          feedbackTrigger: fb,
        },
      );
    }
  };

  const startNextRound = async () => {
    const nextRound = gameState.currentRound + 1;

    // --- SCENARIO A: GAME OVER ---
    if (nextRound > totalRounds) {
      // 1. CALCULATE BONUSES HERE
      const kqBonuses = calculateKingQueenBonuses(gameState.players);

      // 2. APPLY BONUSES TO PLAYERS
      const finalScores = gameState.players
        .map((p) => {
          const bonusData = kqBonuses[p.id];
          // Add Cash + Stash + Bonus - Loan
          // Note: We don't add Stash Value to 'coins' here, just calculate final score.
          // The UI adds coins + stash + bonus separately.
          // However, for the 'winner' logic, we need the total.

          const stashTotal = p.stash.reduce(
            (acc, c) => acc + (GOODS[c]?.val || 0),
            0,
          );
          const finalTotal = Math.floor(
            p.coins + stashTotal - BANK_LOAN + bonusData.income,
          );

          return {
            ...p,
            finalScore: finalTotal, // Used for sorting winner
            kqDetails: bonusData.details, // IMPORTANT: Save details for UI
            kqIncome: bonusData.income, // IMPORTANT: Save income for UI
            ready: false,
          };
        })
        .sort((a, b) => b.finalScore - a.finalScore);

      // 3. SAVE TO DB
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: finalScores,
          status: "finished",
          turnState: "IDLE",
          winner: finalScores[0].name,
          feedbackTrigger: {
            id: Date.now(),
            type: "success",
            message: "GAME OVER",
            subtext: `${finalScores[0].name} wins!`,
          },
        },
      );
      return;
    }

    // --- SCENARIO B: SETUP NEXT ROUND ---
    let nextInspectorIndex = gameState.inspectorOrder[nextRound - 1];
    let deck = [...gameState.deck];

    // Generate Event
    const eventKeys = Object.keys(EVENTS);
    const randomEventKey =
      eventKeys[Math.floor(Math.random() * eventKeys.length)];
    const nextEvent = EVENTS[randomEventKey];

    // Assign Roles & Hands
    let playersWithRoles = assignRandomRoles(gameState.players);

    // Force Inspector role to null
    playersWithRoles[nextInspectorIndex].role = null;

    const nextInspectorId = playersWithRoles[nextInspectorIndex].id;

    const nextRoundStats = {};
    playersWithRoles.forEach((p) => {
      nextRoundStats[p.id] = {
        role: p.role,
        isInspector: p.id === nextInspectorId,
        income: 0,
        expense: 0,
        transactions: [],
        marketItems: [],
        roleBonus: 0,
      };
    });

    const nextPlayers = playersWithRoles.map((p) => {
      const hand = [...p.hand];
      const limit = p.upgrades?.includes("POCKETS") ? 7 : 6;
      while (hand.length < limit && deck.length > 0) {
        const card = drawSafeCard(deck, hand);
        if (card) hand.push(card);
      }
      return { ...p, hand, loadedCrate: null, ready: false };
    });

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players: nextPlayers,
        deck,
        inspectorIndex: nextInspectorIndex,
        currentRound: nextRound,
        currentRoundStats: nextRoundStats,
        roundHistory: arrayUnion({
          stats: gameState.currentRoundStats,
          event: gameState.marketEvent || EVENTS.NORMAL,
        }),
        turnState: "SHOPPING",
        marketEvent: nextEvent,
        logs: arrayUnion({
          id: Date.now().toString(),
          text: `Round ${nextRound} Started. Event: ${nextEvent.name}`,
          type: "neutral",
        }),
      },
    );
  };

  const finishRound = async (players, stats, logs, fb, event) => {
    // 1. Commit the results of the current round to history
    const historyEntry = { stats: stats, event: event || EVENTS.NORMAL };

    // 2. Determine if Game Over or Next Round
    const nextRound = gameState.currentRound + 1;

    // --- SCENARIO A: GAME OVER ---
    if (nextRound > inspectorOrder.length) {
      const kqBonuses = calculateKingQueenBonuses(players);

      const finalScores = players
        .map((p) => {
          const bonusData = kqBonuses[p.id] || { income: 0, details: [] }; // Safety fallback

          // SAFE STASH CALCULATION
          const stashTotal = (p.stash || []).reduce(
            (acc, c) => acc + (GOODS[c]?.val || 0), // ?.val is crucial here
            0,
          );

          const finalTotal = Math.floor(p.coins - BANK_LOAN + bonusData.income);

          return {
            ...p,
            finalScore: finalTotal,
            kqDetails: bonusData.details,
            kqIncome: bonusData.income,
            ready: false,
          };
        })
        .sort((a, b) => b.finalScore - a.finalScore);

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: finalScores,
          logs: arrayUnion(...logs),
          currentRoundStats: stats,
          roundHistory: arrayUnion(historyEntry),
          status: "finished", // Game Over State
          turnState: "IDLE",
          winner: finalScores[0].name,
          feedbackTrigger: {
            id: Date.now(),
            type: "success",
            message: "GAME OVER",
            subtext: `${finalScores[0].name} wins!`,
          },
        },
      );
      return;
    }

    // --- SCENARIO B: NEXT ROUND (Automatic) ---
    // Prepare next round data immediately using the updated 'players' array
    let nextInspectorIndex = gameState.inspectorOrder[nextRound - 1];
    let deck = [...gameState.deck];

    // Generate Event
    const eventKeys = Object.keys(EVENTS);
    const randomEventKey =
      eventKeys[Math.floor(Math.random() * eventKeys.length)];
    const nextEvent = EVENTS[randomEventKey];

    // Assign Roles & Hands
    const playersWithRoles = assignRandomRoles(players);
    const nextInspectorId = playersWithRoles[nextInspectorIndex].id;

    const nextRoundStats = {};
    playersWithRoles.forEach((p) => {
      nextRoundStats[p.id] = {
        role: p.role,
        isInspector: p.id === nextInspectorId,
        income: 0,
        expense: 0,
        transactions: [],
        marketItems: [],
        roleBonus: 0,
      };
    });

    const nextPlayers = playersWithRoles.map((p) => {
      const hand = [...p.hand];
      const limit = p.upgrades?.includes("POCKETS") ? 7 : 6;
      while (hand.length < limit && deck.length > 0) {
        const card = drawSafeCard(deck, hand);
        if (card) hand.push(card);
      }
      return { ...p, hand, loadedCrate: null, ready: false };
    });

    // Update Doc to skip straight to Shopping
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players: nextPlayers,
        deck,
        inspectorIndex: nextInspectorIndex,
        currentRound: nextRound,
        currentRoundStats: nextRoundStats,
        roundHistory: arrayUnion(historyEntry),
        turnState: "SHOPPING", // Directly to shop
        marketEvent: nextEvent,
        logs: arrayUnion(...logs, {
          id: Date.now().toString(),
          text: `Round ${nextRound} Started. Event: ${nextEvent.name}`,
          type: "neutral",
        }),
        feedbackTrigger: fb, // Show the result of the inspection that just finished
      },
    );
  };

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <ContrabandLogoBig />
        <div className="bg-orange-500/10 p-8 rounded-2xl border border-orange-500/30">
          <Hammer
            size={64}
            className="text-orange-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
          <p className="text-gray-400">
            Border crossing closed. Inspections are paused.
          </p>
        </div>
        {/* Add Spacing Between Boxes */}
        <div className="h-8"></div>

        {/* Clickable Second Card */}
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
        <ContrabandLogo />
      </div>
    );
  }

  if (!user)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-green-500 animate-pulse">
        Moving Shipments...
      </div>
    );

  // RECONNECTING STATE
  if (roomId && !gameState && !error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4">
        <FloatingBackground />
        <div className="bg-zinc-900/80 backdrop-blur p-8 rounded-2xl border border-zinc-700 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <Loader size={48} className="text-green-500 animate-spin" />
          <div className="text-center">
            <h2 className="text-xl font-bold">Reconnecting...</h2>
            <p className="text-zinc-400 text-sm">Resuming your session</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Render ---

  // 4. CHANGE: Add Splash Screen Render Condition
  if (view === "splash") {
    return <SplashScreen onStart={handleSplashStart} />;
  }

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <FloatingBackground />
        {/* --- START OF BACK BUTTON --- */}
        <nav className="absolute top-0 left-0 w-full p-4 z-50">
          <a
            href={import.meta.env.BASE_URL}
            className="flex items-center gap-2 text-emerald-800 rounded-lg 
			font-bold shadow-md hover:text-emerald-400 transition-colors w-fit animate-pulse"
          >
            {/* Arrow Icon */}
            <StepBack />
            <span>Back to Gamehub</span>
          </a>
        </nav>
        {/* --- END OF BACK BUTTON --- */}

        {showRules && <RulesModal onClose={() => setShowRules(false)} />}

        <div className="z-10 text-center mb-10">
          <Package
            size={64}
            className="text-emerald-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-linear-to-b from-emerald-400 to-green-700 tracking-widest">
            CONTRABAND
          </h1>
          <p className="text-white-400/60 tracking-[0.3em] uppercase mt-2">
            Black Market Edition
          </p>
        </div>
        <div className="bg-zinc-900/80 backdrop-blur border border-emerald-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm">
              {error}
            </div>
          )}
          <input
            className="w-full bg-black/50 border border-zinc-600 p-3 rounded mb-4 text-white placeholder-zinc-500 focus:border-emerald-500 outline-none"
            placeholder="Alias"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-600 p-4 rounded font-bold mb-4 flex items-center justify-center gap-2 transition-all"
          >
            <ShieldCheck size={20} /> Create Syndicate
          </button>
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 min-w-0 bg-black/50 border border-zinc-600 p-3 rounded text-white placeholder-zinc-500 uppercase tracking-wider"
              placeholder="CODE"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="bg-zinc-800 hover:bg-zinc-700 px-6 rounded font-bold shrink-0"
            >
              Join
            </button>
          </div>
          <button
            onClick={() => setShowRules(true)}
            className="w-full text-center text-zinc-500 hover:text-white text-sm mt-2 flex items-center justify-center gap-2"
          >
            <BookOpen size={14} /> Smuggler's Guide
          </button>
        </div>
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative">
        <FloatingBackground />
        <ContrabandLogoBig />

        {showLeaveConfirm && (
          <LeaveConfirmModal
            isHost={isHost}
            onConfirm={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
          />
        )}

        <div className="z-10 w-full max-w-lg bg-zinc-900/90 backdrop-blur p-8 rounded-2xl border border-emerald-900/50 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg md:text-xl text-green-500 font-bold uppercase">
                Station:
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
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg animate-fade-in-up whitespace-nowrap">
                      Copied!
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-red-900/50 rounded text-red-400"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="space-y-2 mb-8">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-zinc-800/50 p-3 rounded border border-zinc-700/50"
              >
                <span className="font-bold flex items-center gap-2">
                  <User
                    size={14}
                    className={
                      p.id === user.uid ? "text-emerald-500" : "text-zinc-500"
                    }
                  />
                  {p.name}{" "}
                  {p.id === gameState.hostId && (
                    <Crown size={14} className="text-yellow-500" />
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-xs">Waiting</span>
                  {/* KICK BUTTON - Only for Host, cannot kick self */}
                  {gameState.hostId === user.uid && p.id !== user.uid && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      className="p-1.5 bg-zinc-700 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 rounded transition-colors"
                      title="Kick Player"
                    >
                      <Trash size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {gameState.hostId === user.uid && (
            <div className="flex justify-center mb-4">
              <div className="bg-zinc-800 p-1 rounded-lg flex items-center">
                <button
                  onClick={() =>
                    updateDoc(
                      doc(
                        db,
                        "artifacts",
                        APP_ID,
                        "public",
                        "data",
                        "rooms",
                        roomId,
                      ),
                      { gameLength: "SHORT" },
                    )
                  }
                  className={`px-4 py-2 rounded text-xs font-bold transition-all ${gameState.gameLength === "SHORT" ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  SHORT (1x)
                </button>
                <button
                  onClick={() =>
                    updateDoc(
                      doc(
                        db,
                        "artifacts",
                        APP_ID,
                        "public",
                        "data",
                        "rooms",
                        roomId,
                      ),
                      { gameLength: "LONG" },
                    )
                  }
                  className={`px-4 py-2 rounded text-xs font-bold transition-all ${gameState.gameLength === "LONG" ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  LONG (2x)
                </button>
              </div>
            </div>
          )}

          {/* Show Length to everyone */}
          <div className="text-center text-xs text-zinc-500 mb-4 uppercase tracking-widest">
            Game Length: {gameState.gameLength || "SHORT"}
          </div>
          {gameState.hostId === user.uid && (
            <button
              onClick={startGame}
              disabled={gameState.players.length < 3}
              className="w-full py-4 bg-emerald-700 hover:bg-emerald-600 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {gameState.players.length < 3
                ? "Need 3+ Players"
                : "Start Smuggling"}
            </button>
          )}
        </div>
        <ContrabandLogo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const inspector = gameState.players[gameState.inspectorIndex];
    const guestsReady = gameState.players
      .filter((p) => p.id !== gameState.hostId)
      .every((p) => p.ready);
    const shopDisabled = me.ready || gameState.turnState !== "SHOPPING";

    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden font-sans">
        <FloatingBackground />

        {feedback && (
          <FeedbackOverlay
            type={feedback.type}
            message={feedback.message}
            subtext={feedback.subtext}
            icon={
              feedback.type === "danger"
                ? Siren
                : feedback.type === "bribe"
                  ? Handshake
                  : AlertOctagon
            }
          />
        )}
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
        {showLogs && (
          <LogViewer logs={gameState.logs} onClose={() => setShowLogs(false)} />
        )}
        {showLeaveConfirm && (
          <LeaveConfirmModal
            isHost={isHost}
            onLobby={returnToLobby}
            onConfirm={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
          />
        )}
        {showStash && (
          <StashModal
            stash={me.stash || []}
            onClose={() => setShowStash(false)}
          />
        )}
        {opponentStashId && (
          <OpponentStashModal
            player={gameState.players.find((p) => p.id === opponentStashId)}
            onClose={() => setOpponentStashId(null)}
          />
        )}
        <ShopModal
          isOpen={showShop}
          onClose={() => setShowShop(false)}
          player={me}
          onBuy={buyItem}
        />

        {/* --- Top Bar --- */}
        <div className="h-16 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between px-4 z-50 backdrop-blur-md sticky top-0 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col">
              <span className="text-xs text-zinc-500 uppercase tracking-widest">
                Event
              </span>
              <span className="text-sm font-bold text-yellow-500 flex items-center gap-1">
                {currentEvent.id === "WAR" && <Bomb size={14} />}
                {currentEvent.id === "PANDEMIC" && <Skull size={14} />}
                {currentEvent.id === "CRACKDOWN" && <Siren size={14} />}
                {currentEvent.name}
              </span>
            </div>
            <div className="bg-black/40 px-3 py-1 rounded-full border border-zinc-700 flex items-center gap-2">
              <Coins size={14} className="text-yellow-500" />
              <span className="font-mono font-bold">${me.coins}</span>
            </div>
            {/* Round Counter */}
            <div className="text-xs text-zinc-500 bg-black/50 px-2 py-1 rounded border border-zinc-800 flex items-center gap-1">
              <Calendar size={14} />
              <span>
                {gameState.currentRound}/{totalRounds}
              </span>
            </div>
            {/* Deck Counter */}
            <div className="text-xs text-zinc-500 bg-black/50 px-2 py-1 rounded border border-zinc-800 flex items-center gap-1">
              <div className="w-2 h-3 bg-zinc-600 rounded-sm"></div>
              {gameState.deck.length}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Removed Shop Icon Button from Header */}
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`p-2 rounded-full ${
                showLogs
                  ? "bg-green-900 text-green-400"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              <History size={20} />
            </button>
            <button
              onClick={() => setShowRules(true)}
              className="p-2 hover:bg-zinc-800 rounded text-zinc-400"
            >
              <BookOpen size={20} />
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-red-900/50 rounded text-red-400"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* --- Game Area --- */}
        <div className="flex-1 p-4 flex flex-col items-center relative z-10 max-w-6xl mx-auto w-full gap-6">
          {/* Status Banner */}
          <div className="flex items-center justify-center gap-4">
            <div
              className={`px-6 py-2 rounded-full border flex items-center gap-2 shadow-lg ${
                gameState.turnState === "INSPECTING"
                  ? "bg-red-900/30 border-red-500 text-red-200"
                  : "bg-emerald-900/30 border-emerald-500 text-emerald-200"
              }`}
            >
              {gameState.turnState === "SHOPPING" ? (
                <ShoppingBag size={18} />
              ) : gameState.turnState === "LOADING" ? (
                <Package size={18} />
              ) : gameState.turnState === "ROUND_SUMMARY" ? (
                <FileText size={18} />
              ) : (
                <Siren size={18} />
              )}
              <span className="font-bold tracking-wide">
                {gameState.turnState === "SHOPPING"
                  ? "MARKET PHASE"
                  : gameState.turnState === "LOADING"
                    ? "LOAD CRATES"
                    : gameState.turnState === "ROUND_SUMMARY"
                      ? "ROUND REPORT"
                      : `INSPECTOR: ${inspector.name}`}
              </span>
            </div>
          </div>

          {/* Main Game Grid (Always Visible) */}
          <div
            className={`flex gap-3 justify-center flex-wrap w-full transition-opacity duration-500 ${
              gameState.status === "finished"
                ? "opacity-20 pointer-events-none"
                : "opacity-100"
            }`}
          >
            {gameState.players.map((p) => {
              if (p.id === user.uid) return null;

              const isInsp = p.id === inspector.id;

              // --- CHANGE 1: Determine Icon (Siren for Inspector, Role for others) ---
              let StatusIcon = User;
              let iconColor = "text-zinc-500";
              let StatusName = "Player";

              if (isInsp) {
                StatusIcon = Siren;
                iconColor = "text-red-500 animate-pulse"; // Added pulse for visibility
                StatusName = "Inspector";
              } else if (p.role) {
                StatusIcon = ROLES[p.role].icon;
                iconColor = ROLES[p.role].color;
                StatusName = ROLES[p.role].name;
              }
              // -----------------------------------------------------------------------

              return (
                <div
                  key={p.id}
                  className={`relative bg-zinc-900/90 p-3 rounded-xl border-2 w-32 transition-all flex flex-col items-center ${
                    isInsp
                      ? "border-red-500 shadow-[0_0_16px_rgba(239,68,68,0.3)]"
                      : "border-zinc-700 shadow-[0_0_16px_rgba(34,197,94,0.3)]"
                  } ${p.loadedCrate ? "bg-zinc-800" : ""}`}
                >
                  {/* Top Right Icon */}
                  <div className="relative flex flex-col items-center pt-4">
                    {/* Status */}
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-70 text-[9px]">
                      <StatusIcon size={12} className={iconColor} />
                      <span className="uppercase animate-pulse tracking-tight">
                        {StatusName}
                      </span>
                    </div>

                    {/* User icon */}
                    <User
                      size={24}
                      className={isInsp ? "text-red-500" : "text-zinc-600"}
                    />

                    {/* Name */}
                    <span
                      className={`font-bold text-xs truncate w-full text-center mt-1 ${
                        isInsp ? "text-red-200" : "text-zinc-400"
                      }`}
                    >
                      {p.name}
                    </span>
                    <button
                      onClick={() => setOpponentStashId(p.id)}
                      className="mt-auto pt-2 w-full"
                    >
                      <div className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded text-[10px] text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1 uppercase font-bold tracking-wider">
                        <Briefcase size={10} /> View Stash
                      </div>
                    </button>
                  </div>

                  {/* --- NEW CODE STARTS HERE --- */}
                  {p.upgrades && p.upgrades.length > 0 && (
                    <div className="flex gap-1 justify-center mt-1 flex-wrap">
                      {p.upgrades.map((uId) => {
                        const item = SHOP_ITEMS[uId];
                        if (!item) return null;
                        return (
                          <div
                            key={uId}
                            className="p-0.5 bg-zinc-800 rounded border border-zinc-600 text-yellow-500"
                            title={item.name}
                          >
                            <item.icon size={10} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* --- NEW CODE ENDS HERE --- */}

                  {p.loadedCrate ? (
                    <div className="mt-2 w-full bg-black/40 rounded p-2 text-center border border-zinc-600">
                      {/* --- CHANGE 2: Show Loaded Item Count --- */}
                      <div className="flex justify-center items-center gap-1 mb-1">
                        <div className="bg-zinc-700 text-zinc-300 text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Box size={8} /> {p.loadedCrate.cards.length}
                        </div>
                      </div>
                      {/* ---------------------------------------- */}

                      <div className="text-[10px] text-zinc-500 uppercase flex justify-center items-center gap-1">
                        {GOODS[p.loadedCrate.declaration].name}{" "}
                        {p.loadedCrate.bribe > 0 && (
                          <Coins size={10} className="text-yellow-500" />
                        )}
                      </div>

                      {isInspector &&
                        me.id === inspector.id &&
                        gameState.turnState === "INSPECTING" && (
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <button
                              onClick={() => inspectCrate(p.id, "PASS")}
                              className="bg-emerald-700 hover:bg-emerald-600 text-[8px] py-2 rounded text-white font-bold"
                            >
                              PASS
                            </button>
                            <button
                              onClick={() => inspectCrate(p.id, "OPEN")}
                              className="bg-red-700 hover:bg-red-600 text-[8px] py-2 rounded text-white font-bold"
                            >
                              OPEN
                            </button>
                            {p.loadedCrate.bribe > 0 && (
                              <button
                                onClick={() =>
                                  inspectCrate(p.id, "ACCEPT_BRIBE")
                                }
                                className="col-span-2 bg-yellow-600 hover:bg-yellow-500 text-[9px] py-1 rounded text-black font-bold flex items-center justify-center gap-1"
                              >
                                Take ${p.loadedCrate.bribe} Bribe
                              </button>
                            )}
                            {me.upgrades?.includes("SCANNER") &&
                              !p.loadedCrate.scanned && (
                                <button
                                  onClick={() => inspectCrate(p.id, "PEEK")}
                                  className="col-span-2 bg-blue-600 hover:bg-blue-500 text-[9px] py-1 rounded text-white font-bold flex items-center justify-center gap-1"
                                >
                                  <Scan size={10} /> SCAN
                                </button>
                              )}
                          </div>
                        )}
                    </div>
                  ) : (
                    !isInsp && (
                      <div className="mt-2 text-[9px] text-zinc-600 animate-pulse">
                        {p.ready ? "Ready" : "Thinking..."}
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Player Area */}
          <div
            className={`w-full max-w-4xl bg-zinc-900/95 p-4 md:p-6 rounded-t-3xl border-t border-emerald-500/30 backdrop-blur-md mt-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 transition-opacity duration-500 ${
              gameState.status === "finished"
                ? "opacity-20 pointer-events-none"
                : "opacity-100"
            }`}
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* My Stats */}
              <div className="flex flex-col gap-2 min-w-[140px]">
                {/* --- CHANGE: Conditional Rendering for Inspector vs Role --- */}
                {isInspector ? (
                  // INSPECTOR VIEW
                  <>
                    <div className="font-bold text-lg text-white flex items-center gap-2">
                      <Siren size={18} className="text-red-500 animate-pulse" />
                      {me.name}
                    </div>
                    <div className="text-xs text-red-300 font-bold">
                      You are the Inspector. Check crates!
                    </div>
                  </>
                ) : (
                  // REGULAR ROLE VIEW
                  <>
                    <div className="font-bold text-lg text-white flex items-center gap-2">
                      {me.role &&
                        React.createElement(ROLES[me.role].icon, {
                          size: 18,
                          className: ROLES[me.role].color,
                        })}
                      {me.name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {ROLES[me.role]?.desc}
                    </div>
                  </>
                )}
                {/* -------------------------------------------------------- */}

                {/* Event Info Display */}
                <div className="mt-2 border-t border-zinc-700 pt-2">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1 flex items-center gap-1">
                    <Info size={10} /> Event Active
                  </div>
                  {/* ... existing event code ... */}
                  <div className="text-sm font-bold text-yellow-500">
                    {currentEvent.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 leading-tight">
                    {currentEvent.desc}
                  </div>
                </div>

                {/* ... existing upgrades/stash buttons ... */}
                <div className="mt-2 flex gap-1 flex-wrap">
                  {me.upgrades?.map((u) => {
                    const ItemIcon = SHOP_ITEMS[u].icon;
                    return (
                      <div
                        key={u}
                        className="p-1 bg-zinc-800 rounded border border-zinc-700 text-yellow-500"
                        title={SHOP_ITEMS[u].name}
                      >
                        <ItemIcon size={12} />
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setShowStash(true)}
                  className="mt-2 w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 border border-zinc-600 flex items-center justify-center gap-2 transition-colors"
                >
                  <Briefcase size={12} /> View Stash ({me.stash.length})
                </button>

                {/* ... existing ready/shop buttons ... */}
                {gameState.turnState === "SHOPPING" && (
                  // ... existing shop button code ...
                  <>
                    <button
                      onClick={() => !shopDisabled && setShowShop(true)}
                      disabled={shopDisabled}
                      className={`mt-2 w-full py-2 rounded text-xs border flex items-center justify-center gap-2 transition-colors ${
                        !shopDisabled
                          ? "bg-yellow-900/20 hover:bg-yellow-900/30 text-yellow-500 border-yellow-500/50"
                          : "bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed"
                      }`}
                    >
                      <ShoppingBag size={12} /> Open Black Market
                    </button>
                    <button
                      onClick={toggleReady}
                      disabled={me.ready}
                      className={`mt-2 py-2 px-4 rounded font-bold transition-all ${
                        me.ready
                          ? "bg-green-600/50 text-white/50 cursor-not-allowed"
                          : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                      }`}
                    >
                      {me.ready ? "READY" : "MARKET DONE"}
                    </button>
                  </>
                )}
              </div>

              {/* Hand / Main Action Area */}
              <div className="flex-1 overflow-x-auto min-h-[160px]">
                {/* --- CHANGE: Removed the text box for Inspector --- */}
                {isInspector ? null : me.loadedCrate ? (
                  // ... existing loadedCrate code ...
                  <div className="h-full flex flex-col items-center justify-center w-full min-w-0">
                    {/* Display Locked Cards - Scrollable & Centered */}
                    <div className="w-full overflow-x-auto no-scrollbar">
                      {/* w-max + mx-auto: Centers the cards if they fit, aligns left if they overflow.
                          p-4: Adds padding so the hover animation (-translate-y) doesn't get clipped.
                      */}
                      <div className="flex gap-2 w-max mx-auto px-4 py-4 grayscale-[0.3] scale-90 origin-bottom">
                        {me.loadedCrate.cards.map((cId, i) => (
                          <div
                            key={i}
                            className="relative group shrink-0 transition-transform hover:-translate-y-2"
                          >
                            <Card typeId={cId} small={false} />
                            {/* Lock Overlay */}
                            <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Lock className="text-white/80 drop-shadow-md" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-3 bg-zinc-900/80 px-4 py-2 rounded-full border border-emerald-500/30 text-xs shadow-xl backdrop-blur-md whitespace-nowrap z-20">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <Lock size={12} /> LOCKED
                      </span>
                      <div className="w-px h-3 bg-zinc-700"></div>
                      <span className="text-zinc-400">
                        Declared:{" "}
                        <strong className="text-white">
                          {GOODS[me.loadedCrate.declaration]?.name}
                        </strong>
                      </span>
                      {me.loadedCrate.bribe > 0 && (
                        <>
                          <div className="w-px h-3 bg-zinc-700"></div>
                          <span className="flex items-center gap-1 text-yellow-500 font-mono">
                            <Coins size={12} /> ${me.loadedCrate.bribe}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ) : gameState.turnState === "LOADING" ? (
                  <div className="flex gap-2 pb-2">
                    {me.hand.map((cId, i) => (
                      <Card
                        key={i}
                        typeId={cId}
                        selected={selectedCards.includes(i)}
                        onClick={() => {
                          if (selectedCards.includes(i))
                            setSelectedCards(
                              selectedCards.filter((idx) => idx !== i),
                            );
                          else if (
                            selectedCards.length <
                            (me.upgrades?.includes("EXPANDED") ? 5 : 4)
                          )
                            setSelectedCards([...selectedCards, i]);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-600 italic">
                    Market Phase - Check Shop
                  </div>
                )}
              </div>

              {/* Controls */}
              {!isInspector && gameState.turnState !== "SHOPPING" && (
                <div className="min-w-[200px] flex flex-col gap-3">
                  {/* Phase 1: Loading (Visible when no crate yet) */}
                  {!me.loadedCrate && gameState.turnState === "LOADING" && (
                    <>
                      <div className="bg-zinc-800 p-2 rounded-xl border border-zinc-700">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">
                          Declare As
                        </label>
                        <div className="grid grid-cols-4 gap-1">
                          {["FOOD", "MEDS", "TEXTILE", "PARTS"].map((type) => (
                            <button
                              key={type}
                              onClick={() => setDeclaredType(type)}
                              className={`p-2 rounded flex items-center justify-center ${
                                declaredType === type
                                  ? "bg-emerald-600 text-white"
                                  : "bg-zinc-700 text-zinc-400"
                              }`}
                            >
                              {React.createElement(GOODS[type].icon, {
                                size: 16,
                              })}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-zinc-800 p-2 rounded-xl border border-zinc-700 flex items-center gap-2">
                        <div className="text-[10px] text-zinc-500 uppercase font-bold w-12">
                          Bribe
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={Math.max(0, Math.min(me.coins, 10000))}
                          step="10"
                          value={bribeAmount}
                          onChange={(e) => setBribeAmount(e.target.value)}
                          className="flex-1 accent-yellow-500 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs font-mono text-yellow-500 w-10 text-right">
                          ${bribeAmount}
                        </span>
                      </div>

                      <button
                        onClick={loadCrate}
                        disabled={selectedCards.length === 0}
                        className="w-full py-3 bg-linear-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg"
                      >
                        LOAD CRATE
                      </button>
                    </>
                  )}

                  {/* Phase 2: Updating Bribe (Visible when crate IS loaded) */}
                  {me.loadedCrate && (
                    <div className="bg-zinc-800/80 p-3 rounded-xl border border-yellow-500/30 animate-in fade-in">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <Handshake size={14} className="text-yellow-500" />{" "}
                          Negotiation
                        </div>
                        <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                          Active
                        </div>
                      </div>

                      <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-700 flex items-center gap-2 mb-2">
                        <div className="text-[10px] text-zinc-500 uppercase font-bold w-8">
                          Offer
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={Math.min(
                            10000,
                            me.coins + (me.loadedCrate?.bribe || 0),
                          )}
                          step="10"
                          value={bribeAmount}
                          onChange={(e) => setBribeAmount(e.target.value)}
                          className="flex-1 accent-yellow-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs font-mono text-yellow-500 w-10 text-right">
                          ${bribeAmount}
                        </span>
                      </div>

                      <button
                        onClick={updateBribe}
                        disabled={Date.now() - lastBribeUpdate < 2000}
                        className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold rounded-lg text-xs shadow-lg shadow-yellow-900/20 transition-colors flex items-center justify-center gap-2"
                      >
                        {Date.now() - lastBribeUpdate < 2000 ? (
                          <>
                            <Clock size={12} className="animate-spin" /> WAIT
                          </>
                        ) : (
                          "UPDATE OFFER"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Game Over Screen Overlay */}
          {gameState.status === "finished" && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-4xl bg-zinc-900 border border-emerald-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 bg-zinc-950 border-b border-zinc-800 text-center">
                  <h2 className="text-4xl font-bold text-emerald-400 drop-shadow-md">
                    {gameState.winner} Wins!
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <ReportCard
                    players={gameState.players}
                    roundData={gameState.roundHistory}
                    isFinal={true}
                  />
                </div>

                <div className="p-6 bg-zinc-950 border-t border-zinc-800 flex justify-center gap-4">
                  {!isHost ? (
                    <button
                      onClick={toggleReady}
                      className={`px-8 py-3 rounded-xl font-bold transition-all ${
                        me.ready
                          ? "bg-green-600 text-white"
                          : "bg-zinc-700 hover:bg-zinc-600 text-white"
                      }`}
                    >
                      {me.ready
                        ? "Ready! Waiting for Host..."
                        : "Ready for Next Round"}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={startGame}
                        disabled={!guestsReady}
                        className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                          guestsReady
                            ? "bg-emerald-600 hover:bg-emerald-500"
                            : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                        }`}
                      >
                        New Game
                      </button>
                      <button
                        onClick={returnToLobby}
                        disabled={!guestsReady}
                        className={`px-6 py-3 rounded-xl font-bold text-white transition-all ${
                          guestsReady
                            ? "bg-zinc-700 hover:bg-zinc-600"
                            : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                        }`}
                      >
                        Return Team to Lobby
                      </button>
                    </>
                  )}
                </div>
                {isHost && !guestsReady && (
                  <div className="pb-4 text-center text-xs text-zinc-500 animate-pulse">
                    Waiting for squad...
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Round Summary Overlay */}
          {/* Round Summary Overlay */}
          {gameState.turnState === "ROUND_SUMMARY" && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">
                    Round {gameState.currentRound} Complete
                  </h2>
                  <div className="text-xs text-zinc-500 uppercase tracking-widest">
                    {gameState.currentRound >= totalRounds
                      ? "Game Sequence Complete"
                      : "Next Event Loading..."}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <ReportCard
                    players={gameState.players}
                    // Force the tab to be the specific round index
                    roundData={gameState.roundHistory}
                    isFinal={false}
                  />
                </div>

                <div className="p-6 bg-zinc-950 border-t border-zinc-800 flex justify-center">
                  <button
                    onClick={toggleReady}
                    className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${
                      me.ready
                        ? "bg-green-600 text-white shadow-green-900/20"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20"
                    }`}
                  >
                    {me.ready ? (
                      <>
                        <CheckCircle size={20} /> Waiting for others...
                      </>
                    ) : (
                      <>
                        {gameState.currentRound >= totalRounds ? (
                          <>
                            Show Final Results <Crown size={20} />
                          </>
                        ) : (
                          <>
                            Start Round {gameState.currentRound + 1}{" "}
                            <ChevronRight size={20} />
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>

                {/* Show who is ready */}
                <div className="pb-4 bg-zinc-950 flex justify-center gap-2">
                  {gameState.players.map((p) => (
                    <div
                      key={p.id}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        p.ready ? "bg-green-500" : "bg-zinc-700"
                      }`}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <ContrabandLogo />
      </div>
    );
  }

  return null;
}
//major update. new cards. card values changed. updated events. updated report with event bonus.
