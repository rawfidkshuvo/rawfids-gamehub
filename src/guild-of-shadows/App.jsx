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
} from "firebase/firestore";
import {
  StepBack,
  Ghost,
  Coins,
  Shield,
  Sword,
  Users,
  Briefcase,
  Zap,
  Crown,
  LogOut,
  BookOpen,
  History,
  X,
  User,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Trophy,
  Hand,
  Eye,
  Gavel,
  Lock,
  Search,
  Dice5,
  Copy,
  Scale,
  Megaphone,
  Skull,
  ArrowRightLeft,
  Info,
  Trash2,
  Hourglass,
  Sunrise,
  Moon,
  Receipt,
  Hammer,
  Sparkles,
  Loader2,
  ChevronRight,
  PlayCircle, // Added icon
  Loader,
  Play,
} from "lucide-react";
import CoverImage from "./assets/guild_cover.png";

// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------
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

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "guild-shadows";
const GAME_ID = "15";

// ---------------------------------------------------------------------------
// GAME DATA & CONSTANTS
// ---------------------------------------------------------------------------

const AGENT_LIFESPAN = 3;

const CARDS = {
  URCHIN: {
    id: "URCHIN",
    name: "Street Urchin",
    type: "ACTION",
    cost: 0,
    desc: "Gain 2 Gold from the supply.",
    icon: Coins,
    color: "text-amber-400",
    bg: "bg-amber-950",
    border: "border-amber-700",
  },
  THIEF: {
    id: "THIEF",
    name: "Master Thief",
    type: "ACTION",
    cost: 0,
    desc: "Steal 2 Gold from a player.",
    icon: Hand,
    color: "text-purple-400",
    bg: "bg-purple-950",
    border: "border-purple-700",
  },
  HEIST: {
    id: "HEIST",
    name: "Grand Heist",
    type: "ACTION",
    cost: 2,
    desc: "Risk: 50% get 5 Gold, 50% nothing.",
    icon: Dice5,
    color: "text-orange-400",
    bg: "bg-orange-950",
    border: "border-orange-700",
  },
  ASSASSIN: {
    id: "ASSASSIN",
    name: "Night Blade",
    type: "ACTION",
    cost: 2,
    desc: "Destroy a specific Agent.",
    icon: Skull,
    color: "text-red-500",
    bg: "bg-red-950",
    border: "border-red-800",
  },
  BLACKMAIL: {
    id: "BLACKMAIL",
    name: "Blackmail",
    type: "ACTION",
    cost: 3,
    desc: "Steal an Agent OR Steal 4 Gold.",
    icon: Gavel,
    color: "text-pink-400",
    bg: "bg-pink-950",
    border: "border-pink-700",
  },
  DOPPELGANGER: {
    id: "DOPPELGANGER",
    name: "Doppelganger",
    type: "ACTION",
    cost: 2,
    desc: "Copy effect of last Action card.",
    icon: Copy,
    color: "text-cyan-400",
    bg: "bg-cyan-950",
    border: "border-cyan-700",
  },
  MERCHANT: {
    id: "MERCHANT",
    name: "Silk Trader",
    type: "AGENT",
    cost: 2,
    desc: "+1 Gold at start of your turn.",
    icon: Briefcase,
    color: "text-emerald-400",
    bg: "bg-emerald-900",
    border: "border-emerald-600",
  },
  LOOKOUT: {
    id: "LOOKOUT",
    name: "Lookout",
    type: "AGENT",
    cost: 2,
    desc: "Peek at the top card of the deck.",
    icon: Search,
    color: "text-indigo-300",
    bg: "bg-indigo-900",
    border: "border-indigo-600",
  },
  BODYGUARD: {
    id: "BODYGUARD",
    name: "Iron Guard",
    type: "AGENT",
    cost: 4,
    desc: "Immune to theft & assassination.",
    icon: Shield,
    color: "text-blue-400",
    bg: "bg-blue-900",
    border: "border-blue-600",
  },
  POLITICIAN: {
    id: "POLITICIAN",
    name: "Corrupt Senator",
    type: "AGENT",
    cost: 4,
    desc: "Gain 1 Gold when others play Actions.",
    icon: Scale,
    color: "text-yellow-200",
    bg: "bg-yellow-900",
    border: "border-yellow-600",
  },
  SABOTEUR: {
    id: "SABOTEUR",
    name: "Saboteur",
    type: "AGENT",
    cost: 4,
    desc: "Others pay +1 Gold to play Actions.",
    icon: AlertTriangle,
    color: "text-orange-500",
    bg: "bg-stone-800",
    border: "border-orange-800",
  },
};

const DECK_COMPOSITION = [
  ...Array(6).fill("URCHIN"),
  ...Array(5).fill("THIEF"),
  ...Array(4).fill("HEIST"),
  ...Array(3).fill("ASSASSIN"),
  ...Array(3).fill("BLACKMAIL"),
  ...Array(2).fill("DOPPELGANGER"),
  ...Array(4).fill("MERCHANT"),
  ...Array(3).fill("LOOKOUT"),
  ...Array(3).fill("BODYGUARD"),
  ...Array(2).fill("POLITICIAN"),
  ...Array(2).fill("SABOTEUR"),
];

// ---------------------------------------------------------------------------
// UTILITIES
// ---------------------------------------------------------------------------
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

const Logo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Ghost size={12} className="text-purple-500" />
    <span className="text-[10px] font-black tracking-widest text-purple-500 uppercase">
      GUILD OF SHADOWS
    </span>
  </div>
);

const LogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Ghost size={22} className="text-purple-500" />
    <span className="text-[20px] font-black tracking-widest text-purple-500 uppercase">
      GUILD OF SHADOWS
    </span>
  </div>
);

const calculateWinGoal = (playerCount) => {
  if (playerCount <= 2) return 20;
  if (playerCount === 3) return 18;
  return 15;
};

// ---------------------------------------------------------------------------
// UI COMPONENTS
// ---------------------------------------------------------------------------

const FloatingBackground = React.memo(() => {
  // useMemo ensures these random positions are calculated ONLY ONCE
  // This keeps the performance high and stops icons from resetting.
  const backgroundIcons = React.useMemo(() => {
    return [...Array(20)].map((_, i) => {
      const iconKeys = Object.keys(CARDS);
      const Icon = CARDS[iconKeys[i % iconKeys.length]].icon;
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
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Dark Gradient Layer */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-yellow-900/20 via-gray-950 to-black" />
      
      {/* Floating Icons Layer */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        {backgroundIcons}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        .animate-float { animation: float infinite ease-in-out; }
      `}</style>
    </div>
  );
});

const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-160 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300 px-4">
    <div
      className={`
      flex flex-col items-center justify-center p-6 md:p-12 rounded-3xl border-4 shadow-2xl backdrop-blur-xl max-w-lg w-full text-center
      ${
        type === "success"
          ? "bg-green-950/90 border-green-500 text-green-100"
          : type === "failure"
            ? "bg-red-950/90 border-red-500 text-red-100"
            : "bg-blue-950/90 border-blue-500 text-blue-100"
      }
    `}
    >
      {Icon && (
        <div className="mb-4 p-4 bg-black/20 rounded-full">
          <Icon size={48} className="animate-bounce" />
        </div>
      )}
      <h2 className="text-2xl md:text-4xl font-black uppercase tracking-widest drop-shadow-md mb-2">
        {message}
      </h2>
      {subtext && (
        <p className="text-sm md:text-lg font-bold opacity-90 tracking-wide">
          {subtext}
        </p>
      )}
    </div>
  </div>
);

// --- GLOBAL ACTION BROADCAST ---
const ActionBroadcast = ({ event, onClose }) => {
  useEffect(() => {
    if (event) {
      const timer = setTimeout(onClose, 4000); // Auto close after 4s
      return () => clearTimeout(timer);
    }
  }, [event, onClose]);

  if (!event) return null;

  const isScout = event.type === "SCOUT";
  const isDiscard = event.type === "DISCARD";
  const isAction = event.type === "PLAY";

  // Resolve Card Data
  const card = event.cardId ? CARDS[event.cardId] : null;

  return (
    <div className="fixed inset-0 z-180 flex items-center justify-center pointer-events-none px-4">
      <div className="bg-gray-900/95 backdrop-blur-xl border-2 border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.4)] rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 pointer-events-auto">
        {/* HEADER: Actor Name */}
        <div className="bg-linear-to-r from-gray-900 via-purple-900 to-gray-900 p-3 text-center border-b border-purple-500/30">
          <h3 className="font-bold text-lg text-white tracking-widest uppercase flex items-center justify-center gap-2">
            <User size={18} className="text-purple-400" />
            {event.actorName}
          </h3>
          <div className="text-[10px] text-purple-200 uppercase tracking-widest opacity-80">
            {isScout
              ? "Scouting Mission"
              : isDiscard
                ? "Forced Discard"
                : "Played Action"}
          </div>
        </div>

        {/* BODY: The Content */}
        <div className="p-6 flex flex-col items-center">
          {/* Card or Icon Display */}
          <div className="mb-6 scale-110">
            {isAction && card ? (
              <CardDisplay
                cardId={event.cardId}
                small
                disabled
                showCost={false}
              />
            ) : (
              <div className="w-20 h-28 bg-gray-800 rounded-xl border-2 border-gray-600 flex items-center justify-center shadow-inner">
                {isScout ? (
                  <Eye size={32} className="text-blue-400" />
                ) : (
                  <Trash2 size={32} className="text-red-400" />
                )}
              </div>
            )}
          </div>

          {/* Outcomes List */}
          <div className="w-full space-y-2">
            {event.outcomes.map((text, i) => (
              <div
                key={i}
                className="bg-black/40 rounded p-2 text-center text-sm border border-gray-700/50 text-gray-200 shadow-sm font-medium"
              >
                {text}
              </div>
            ))}
            {event.outcomes.length === 0 && (
              <div className="text-center text-gray-500 text-xs italic">
                No visible effect.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CardDisplay = ({
  cardId,
  onClick,
  disabled,
  highlight,
  small,
  tiny,
  turnsLeft,
  showCost = true,
}) => {
  const card = CARDS[cardId];
  if (!card) return <div className="w-16 h-24 bg-gray-800 rounded"></div>;

  if (tiny) {
    return (
      <div
        className={`relative w-6 h-8 rounded flex items-center justify-center ${card.bg} border ${card.border} shadow-sm`}
        title={card.name}
      >
        <card.icon className={`${card.color} w-3.5 h-3.5`} />
        {turnsLeft !== undefined && (
          <div className="absolute -top-1.5 -right-1.5 bg-black text-[9px] text-white w-4 h-4 rounded-full flex items-center justify-center border border-gray-500 z-10">
            {turnsLeft}
          </div>
        )}
      </div>
    );
  }

  // --- MOBILE OPTIMIZED SIZES ---
  const sizeClasses = small
    ? "w-20 h-28 p-1.5"
    : "w-24 h-40 md:w-32 md:h-48 p-2";

  const iconSize = small ? 20 : 28;
  const textSize = small ? "text-[8px]" : "text-[9px] md:text-[10px]";
  const titleSize = small ? "text-[10px]" : "text-[11px] md:text-xs";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative rounded-xl border-2 shadow-lg transition-all flex flex-col items-center justify-between cursor-pointer active:scale-95 touch-manipulation overflow-visible shrink-0
        ${sizeClasses} ${card.bg} ${
          highlight ? "ring-4 ring-yellow-400 z-10 scale-105" : card.border
        }
        ${
          disabled
            ? "opacity-50 grayscale cursor-not-allowed"
            : "hover:scale-105 hover:brightness-110"
        }
      `}
    >
      {/* HEADER: Type & Cost */}
      <div className="w-full flex justify-between items-center font-bold text-gray-300">
        <span
          className={`${small ? "text-[8px]" : "text-[10px]"} ${
            card.type === "AGENT" ? "text-blue-300" : "text-amber-200"
          }`}
        >
          {card.type === "AGENT" ? "AGT" : "ACT"}
        </span>
        {showCost && card.cost > 0 && (
          <span className="bg-black/50 px-1.5 rounded text-yellow-400 flex items-center gap-0.5 text-[10px]">
            {card.cost} <Coins size={8} />
          </span>
        )}
      </div>

      {/* ICON */}
      <div className="flex-1 flex items-center justify-center my-1 relative">
        <card.icon className={`${card.color}`} size={iconSize} />
        {turnsLeft !== undefined && (
          <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 bg-black/80 px-1.5 py-0.5 rounded-full border border-gray-600 shadow-md">
            <Hourglass size={8} className="text-gray-400" />
            <span className="text-[10px] text-white font-bold">
              {turnsLeft}
            </span>
          </div>
        )}
      </div>

      {/* FOOTER: Name & Desc */}
      <div className="w-full text-center">
        <div
          className={`font-bold text-white leading-tight mb-1 line-clamp-1 ${titleSize}`}
        >
          {card.name}
        </div>
        <div
          className={`
            text-gray-400 leading-tight bg-black/40 rounded flex items-center justify-center px-1 w-full
            ${textSize} h-auto p-1 whitespace-normal text-center
          `}
        >
          {card.desc}
        </div>
      </div>
    </button>
  );
};

const GuideModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-200 p-4 flex items-center justify-center">
    <div className="bg-gray-900 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950">
        <h2 className="font-serif text-xl font-bold text-purple-400 flex items-center gap-2">
          <BookOpen size={18} /> Guild Archives
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 text-sm text-gray-300 space-y-8">
        <section className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/20">
          <h3 className="font-bold text-xl text-white mb-2 flex items-center gap-2">
            <Trophy size={18} className="text-yellow-400" /> Victory Condition
          </h3>
          <p>
            Amass enough Gold to buy control of the Guild. The amount required
            changes based on the number of players:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
            <li>
              <strong>2 Players:</strong> 20 Gold
            </li>
            <li>
              <strong>3 Players:</strong> 18 Gold
            </li>
            <li>
              <strong>4 Players:</strong> 15 Gold
            </li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-lg text-amber-400 mb-3 border-b border-gray-700 pb-1 flex items-center gap-2">
            <Zap size={18} /> Actions{" "}
            <span className="text-xs text-gray-500 font-normal ml-auto">
              (Discarded after use)
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              CARDS.URCHIN,
              CARDS.THIEF,
              CARDS.HEIST,
              CARDS.ASSASSIN,
              CARDS.BLACKMAIL,
              CARDS.DOPPELGANGER,
            ].map((c) => (
              <div
                key={c.id}
                className="bg-gray-800/50 p-2 rounded border border-gray-700 flex items-start gap-2"
              >
                <div className={`p-2 rounded bg-black/30 ${c.color}`}>
                  <c.icon size={16} />
                </div>
                <div>
                  <div className={`font-bold ${c.color}`}>
                    {c.name} (Cost {c.cost})
                  </div>
                  <div className="text-xs text-gray-400">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-bold text-lg text-blue-400 mb-3 border-b border-gray-700 pb-1 flex items-center gap-2">
            <Users size={18} /> Agents{" "}
            <span className="text-xs text-gray-500 font-normal ml-auto">
              (Last for 3 Turns)
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              CARDS.MERCHANT,
              CARDS.LOOKOUT,
              CARDS.BODYGUARD,
              CARDS.POLITICIAN,
              CARDS.SABOTEUR,
            ].map((c) => (
              <div
                key={c.id}
                className="bg-gray-800/50 p-2 rounded border border-gray-700 flex items-start gap-2"
              >
                <div className={`p-2 rounded bg-black/30 ${c.color}`}>
                  <c.icon size={16} />
                </div>
                <div>
                  <div className={`font-bold ${c.color}`}>
                    {c.name} (Cost {c.cost})
                  </div>
                  <div className="text-xs text-gray-400">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <h3 className="font-bold text-white mb-2">Game Mechanics</h3>
          <ul className="list-disc pl-4 space-y-2 text-gray-400">
            <li>
              <strong>Scouting:</strong> When you Pass, you enter{" "}
              <strong>Scout Mode</strong>. Select a card from your hand to
              discard, and you will draw a replacement.
            </li>
            <li>
              <strong>Agent Decay:</strong> All Agents (Merchants, Bodyguards,
              etc.) leave your service after <strong>3 turns</strong>. Plan
              accordingly.
            </li>
            <li>
              <strong>Taxes & Corruption:</strong> Saboteurs tax opponents.
              Politicians profit from opponent actions.
            </li>
            <li>
              <strong>Pity Bonus:</strong> Start your turn with 0 gold? Get +1
              extra gold from the guild.
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
);

// --- INLINE REPORT COMPONENTS ---

const MorningReportInline = ({ report }) => {
  if (!report) return null;
  return (
    <div className="w-full bg-green-950/40 border-b border-green-500/30 p-2 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
      <div className="flex flex-col gap-0.5 w-full">
        <div className="flex flex-wrap gap-2 text-[10px] text-gray-300">
          {report.breakdown.map((item, i) => (
            <span key={i} className="flex gap-1 items-center">
              <span className="text-gray-400">{item.source}:</span>
              <span className="text-green-300">+{item.amount}</span>
            </span>
          ))}
        </div>
        {report.expired.length > 0 && (
          <div className="text-[9px] text-red-300 mt-0.5 flex gap-1 items-center">
            <LogOut size={8} /> Lost:{" "}
            {report.expired.map((c) => CARDS[c]?.name).join(", ")}
          </div>
        )}
      </div>
      <div className="pl-3 border-l border-green-500/20 flex flex-col items-center justify-center text-green-400 shrink-0">
        <span className="text-sm font-black">+{report.income}</span>
      </div>
    </div>
  );
};

const EveningReportInline = ({ report }) => {
  if (!report) return null;
  return (
    <div className="w-full bg-indigo-950/40 border-b border-indigo-500/30 p-2 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
      <div className="flex flex-col gap-0.5 w-full">
        <div className="text-[10px] text-indigo-300 font-bold uppercase">
          {report.actionName}
        </div>
        <div className="flex flex-wrap gap-2 text-[9px] text-gray-400">
          <span>Cost: {report.cost}</span>
          {report.tax > 0 && (
            <span className="text-red-400">Tax: {report.tax}</span>
          )}
          {report.gains.map((g, i) => (
            <span key={i} className="text-green-300">
              {g.desc}: +{g.amount}
            </span>
          ))}
        </div>
      </div>
      <div className="pl-3 border-l border-indigo-500/20 flex flex-col items-center justify-center shrink-0">
        <span
          className={`text-sm font-black ${
            report.netChange >= 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {report.netChange > 0 ? "+" : ""}
          {report.netChange}
        </span>
      </div>
    </div>
  );
};

// --- UPDATED SPLASH SCREEN (With Loading Indicator) ---
const SplashScreen = ({ onStart }) => {
  const [hasSession, setHasSession] = useState(false);

  // State 1: Image is downloaded and ready to show
  const [isLoaded, setIsLoaded] = useState(false);
  // State 2: Button is ready to slide in (after zoom)
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // 1. Check Session immediately
    const saved = localStorage.getItem("guild_room_id");
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
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-purple-500/50">
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
            className="group relative px-12 py-5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 hover:border-purple-400 text-purple-300 font-black text-2xl tracking-widest rounded-none transform transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] backdrop-blur-md overflow-hidden"
          >
            {/* Animated Scanline overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-400/10 to-transparent translate-y-[-100%] animate-[scan_2s_infinite_linear]" />

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

// ---------------------------------------------------------------------------
// MAIN GAME LOGIC
// ---------------------------------------------------------------------------

export default function GuildOfShadows() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("splash");

  const [roomCode, setRoomCode] = useState("");

  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  // PERSISTENCE FIX: Load room ID from local storage
  const [roomId, setRoomId] = useState("");
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // UI States
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [targetMode, setTargetMode] = useState(null); // PLAYER, CARD, OPTION, SCOUT, DISCARD
  const [selectedTargetPlayerId, setSelectedTargetPlayerId] = useState(null);
  const [peekCard, setPeekCard] = useState(null);

  // New state for Doppelganger confirmation
  const [doppelgangerConfirm, setDoppelgangerConfirm] = useState(null);

  // Global Action Notification State
  const [activeEvent, setActiveEvent] = useState(null);
  const lastEventIdRef = useRef(0);

  // Local Report States (To prevent showing other people's reports if game state updates)
  const [morningReportData, setMorningReportData] = useState(null);
  const [eveningReportData, setEveningReportData] = useState(null);

  //read and fill global name
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem("gameHub_playerName") || "",
  );
  //set global name for all game
  useEffect(() => {
    if (playerName) localStorage.setItem("gameHub_playerName", playerName);
  }, [playerName]);

  // --- AUTH & SYNC ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // 3. NEW FUNCTION: Handle Splash Button Click
  const handleSplashStart = () => {
    const savedRoomId = localStorage.getItem("guild_room_id");

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

  useEffect(() => {
    if (!roomId || !user) return;
    return onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const amIInRoom = data.players.some((p) => p.id === user.uid);

          if (!amIInRoom) {
            setRoomId("");
            setView("menu");
            setError("You have been removed from the guild.");
            return;
          }

          setGameState(data);

          // --- CHECK FOR NEW PUBLIC EVENT ---
          if (
            data.latestPublicEvent &&
            data.latestPublicEvent.id > lastEventIdRef.current
          ) {
            lastEventIdRef.current = data.latestPublicEvent.id;
            setActiveEvent(data.latestPublicEvent);
          }

          // --- REPORT CAPTURE ---
          // 1. Morning Report
          if (
            data.status === "playing" &&
            data.turnReport &&
            data.turnReport.playerId === user.uid &&
            !data.turnReport.seen
          ) {
            setMorningReportData(data.turnReport);
            setEveningReportData(null); // Clear evening if morning arrives
          }

          // 2. Evening Report
          if (
            data.status === "playing" &&
            data.eveningReport &&
            data.eveningReport.playerId === user.uid &&
            !data.eveningReport.seen
          ) {
            setEveningReportData(data.eveningReport);
            setMorningReportData(null); // Clear morning if evening arrives
          }

          if (data.status === "lobby") setView("lobby");
          else if (data.status === "playing" || data.status === "finished")
            setView("game");
        } else {
          setRoomId("");
          setView("menu");
          setError("The Guild Hall was disbanded by the host.");
        }
      },
      (err) => console.error(err),
    );
  }, [roomId, user]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists() && doc.data()[GAME_ID]?.maintenance)
        setIsMaintenance(true);
      else setIsMaintenance(false);
    });
    return () => unsub();
  }, []);

  // --- ACTIONS ---

  const triggerFeedback = (type, msg, sub, icon) => {
    setFeedback({ type, message: msg, subtext: sub, icon });
    setTimeout(() => setFeedback(null), 2500);
  };

  const createRoom = async () => {
    if (!playerName) return setError("Enter Alias");

    setLoading(true);

    try {
      const chars = "123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";
      let newId = "";
      for (let i = 0; i < 6; i++) {
        newId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      await setDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
        {
          roomId: newId,
          hostId: user.uid,
          status: "lobby",
          players: [
            {
              id: user.uid,
              name: playerName,
              gold: 0,
              hand: [],
              tableau: [],
              ready: false,
            },
          ],
          deck: [],
          discardPile: [],
          turnIndex: 0,
          logs: [],
          lastAction: null,
          turnReport: null,
          eveningReport: null,
          latestPublicEvent: null, // Init
        },
      );
      setRoomId(newId);
      localStorage.setItem("guild_room_id", newId); // Persist
    } catch (e) {
      console.error(e);
      setError("Failed to create room.");
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!roomCode || !playerName) return setError("Enter Info");

    setLoading(true);

    try {
      const ref = doc(
        db,
        "artifacts",
        APP_ID,
        "public",
        "data",
        "rooms",
        roomCode,
      );
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setLoading(false);
        return setError("Invalid Room");
      }
      const data = snap.data();
      if (data.status !== "lobby") {
        setLoading(false);
        return setError("Game Started");
      }
      if (data.players.length >= 4) {
        setLoading(false);
        return setError("Room Full");
      }

      await updateDoc(ref, {
        players: [
          ...data.players,
          {
            id: user.uid,
            name: playerName,
            gold: 0,
            hand: [],
            tableau: [],
            ready: false,
          },
        ],
      });
      setRoomId(roomCode);
      localStorage.setItem("guild_room_id", roomCode); // Persist
    } catch (e) {
      console.error(e);
      setError("Failed to join room.");
    } finally {
      setLoading(false);
    }
  };

  const kickPlayer = async (pidToKick) => {
    if (gameState.hostId !== user.uid) return;
    const newPlayers = gameState.players.filter((p) => p.id !== pidToKick);
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players: newPlayers,
      },
    );
  };

  const handleLeaveRoom = async () => {
    if (!gameState) return;
    if (gameState.hostId === user.uid) {
      // Host leaves -> Delete Room
      await deleteDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      );
    } else {
      const newPlayers = gameState.players.filter((p) => p.id !== user.uid);
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: newPlayers,
        },
      );
    }
    setRoomId("");
    localStorage.removeItem("guild_room_id");
    setView("menu");
    setShowLeaveConfirm(false);
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
    if (gameState.hostId !== user.uid) return;
    const deck = shuffle([...DECK_COMPOSITION]);
    const players = gameState.players.map((p) => ({
      ...p,
      hand: [deck.pop(), deck.pop()],
      tableau: [],
      gold: 2,
      ready: false,
    }));

    // 2. Calculate Random Start Index
    const randomStartIndex = Math.floor(Math.random() * players.length);

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        deck,
        players,
        turnIndex: randomStartIndex,
        totalTurns: 0, // <--- ADD THIS LINE (Initialize global turn counter)
        logs: [
          {
            text: "The struggle for the Guild begins...",
            type: "neutral",
            id: Date.now(),
          },
        ],
        lastAction: null,
        turnReport: null,
        eveningReport: null,
        latestPublicEvent: null,
      },
    );
  };

  const toggleReady = async () => {
    const players = gameState.players.map((p) => {
      if (p.id === user.uid) return { ...p, ready: !p.ready };
      return p;
    });
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players },
    );
  };

  const returnToLobby = async () => {
    if (gameState.hostId !== user.uid) return;
    const players = gameState.players.map((p) => ({
      ...p,
      hand: [],
      tableau: [],
      gold: 0,
      ready: false,
    }));
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        deck: [],
        discardPile: [],
        winnerId: null,
        logs: [],
        players,
        latestPublicEvent: null,
      },
    );
    setShowLeaveConfirm(false);
  };

  // --- GAMEPLAY ENGINE ---

  const getTaxAmount = (players, actorId) => {
    let tax = 0;
    players.forEach((p) => {
      if (p.id !== actorId) {
        const count = p.tableau.filter((c) => c.cardId === "SABOTEUR").length;
        tax += count;
      }
    });
    return tax;
  };

  const payPoliticians = (players, actorId) => {
    players.forEach((p) => {
      if (p.id !== actorId) {
        const count = p.tableau.filter((c) => c.cardId === "POLITICIAN").length;
        if (count > 0) p.gold += count;
      }
    });
  };

  const nextTurn = async (
    updatedPlayers,
    deck,
    discardPile,
    logs,
    lastAction = null,
    eveningReport = null,
    publicEvent = null,
  ) => {
    let nextIdx = (gameState.turnIndex + 1) % updatedPlayers.length;
    let nextPlayer = updatedPlayers[nextIdx];

    // --- CALCULATE GLOBAL TURN COUNT ---
    // Default to 0 if undefined (for backward compatibility)
    const currentTotalTurns = gameState.totalTurns || 0;
    const newTotalTurns = currentTotalTurns + 1;

    // --- AGENT DECAY LOGIC ---
    const expiredAgents = [];
    const survivedAgents = [];

    nextPlayer.tableau.forEach((agent) => {
      agent.turnsLeft -= 1;
      if (agent.turnsLeft <= 0) {
        expiredAgents.push(agent.cardId);
        discardPile.push(agent.cardId);
      } else {
        survivedAgents.push(agent);
      }
    });
    nextPlayer.tableau = survivedAgents;

    // --- INCOME ---
    let totalIncome = 0;
    const incomeBreakdown = [];

    // 1. Guild Stipend
    // LOGIC CHANGE: Only give stipend if we are past the first round of turns.
    // e.g., if 2 players:
    // Turn 0 (P1) -> Next is Turn 1 (P2). 1 < 2, No Stipend.
    // Turn 1 (P2) -> Next is Turn 2 (P1). 2 >= 2, Stipend Active.
    if (newTotalTurns >= updatedPlayers.length) {
      incomeBreakdown.push({ source: "Guild Stipend", amount: 1 });
      totalIncome += 1;
    }

    // 2. Merchants
    nextPlayer.tableau.forEach((c) => {
      if (c.cardId === "MERCHANT") {
        incomeBreakdown.push({ source: "Silk Trader", amount: 1 });
        totalIncome += 1;
      }
    });

    // 3. Pity Bonus
    if (nextPlayer.gold === 0) {
      incomeBreakdown.push({ source: "Pity Bonus", amount: 1 });
      totalIncome += 1;
    }

    nextPlayer.gold += totalIncome;

    // --- LOGS & REPORT ---
    if (expiredAgents.length > 0) {
      logs.push({
        text: `${nextPlayer.name} lost ${expiredAgents.length} agents to time.`,
        type: "warning",
        id: Date.now(),
      });
    }
    logs.push({
      text: `${nextPlayer.name} begins turn (+${totalIncome} Gold).`,
      type: "neutral",
      id: Date.now() + 1,
    });

    const turnReport = {
      playerId: nextPlayer.id,
      income: totalIncome,
      breakdown: incomeBreakdown,
      expired: expiredAgents,
      seen: false,
    };

    // --- WIN CHECK ---
    const goal = calculateWinGoal(updatedPlayers.length);
    if (nextPlayer.gold >= goal) {
      const finalPlayers = updatedPlayers.map((p) => ({ ...p, ready: false }));
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: finalPlayers,
          status: "finished",
          winnerId: nextPlayer.id,
          logs: arrayUnion({
            text: `🏆 ${nextPlayer.name} has bought the Guild!`,
            type: "success",
            id: Date.now() + 2,
          }),
        },
      );
      return;
    }

    // --- DRAW ---
    if (deck.length === 0) {
      if (discardPile.length > 0) {
        deck = shuffle([...discardPile]);
        discardPile = [];
        logs.push({
          text: "Deck reshuffled.",
          type: "warning",
          id: Date.now() + 3,
        });
      } else {
        logs.push({ text: "Deck empty!", type: "danger", id: Date.now() + 3 });
      }
    }

    if (deck.length > 0) {
      nextPlayer.hand.push(deck.pop());
    }

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players: updatedPlayers,
        deck,
        discardPile,
        turnIndex: nextIdx,
        totalTurns: newTotalTurns, // <--- ADD THIS LINE (Save the new count)
        logs: arrayUnion(...logs),
        lastAction: lastAction !== null ? lastAction : gameState.lastAction,
        turnReport,
        eveningReport: eveningReport,
        latestPublicEvent: publicEvent, // SAVE GLOBAL EVENT
      },
    );
  };

  const executeCardEffect = async (
    cardId,
    targetPlayerId,
    secondaryTarget,
    players,
    deck,
    discardPile,
    logs,
    meIdx,
    tax,
  ) => {
    const me = players[meIdx];
    const card = CARDS[cardId];

    let reportGains = [];
    const publicOutcomes = [];
    let netChange = -(card.cost + tax);

    // Pay Cost
    me.gold -= card.cost + tax;

    if (card.type === "ACTION") payPoliticians(players, me.id);

    const handIdx = me.hand.indexOf(cardId);
    if (handIdx > -1) me.hand.splice(handIdx, 1);

    let newLastAction = gameState.lastAction;

    if (card.type === "AGENT") {
      me.tableau.push({ cardId, turnsLeft: AGENT_LIFESPAN });
      logs.push({
        text: `🏰 ${me.name} recruited ${card.name}.`,
        type: "success",
        id: Date.now(),
      });
      reportGains.push({ desc: "Recruited Agent", amount: 0 });
      publicOutcomes.push(`Recruited ${card.name}`);
      publicOutcomes.push(`Active for ${AGENT_LIFESPAN} turns`);
    } else {
      discardPile.push(cardId);
      newLastAction = { cardId, playerId: me.id };

      if (cardId === "URCHIN") {
        me.gold += 2;
        netChange += 2;
        reportGains.push({ desc: "Street Urchin", amount: 2 });
        logs.push({
          text: `💰 ${me.name} used Urchin (+2 Gold).`,
          type: "neutral",
          id: Date.now(),
        });
        publicOutcomes.push("Gained +2 Gold from Supply");
      } else if (cardId === "HEIST") {
        const roll = Math.floor(Math.random() * 6) + 1;
        if (roll >= 4) {
          me.gold += 5;
          netChange += 5;
          reportGains.push({ desc: "Heist Success", amount: 5 });
          logs.push({
            text: `🎲 ${me.name} pulled off a Heist! (+5 Gold)`,
            type: "success",
            id: Date.now(),
          });
          publicOutcomes.push("Heist Successful: +5 Gold!");
        } else {
          reportGains.push({ desc: "Heist Failed", amount: 0 });
          logs.push({
            text: `🎲 ${me.name}'s Heist failed.`,
            type: "failure",
            id: Date.now(),
          });
          publicOutcomes.push("Heist Failed: 0 Gold.");
        }
      } else if (cardId === "THIEF") {
        const target = players.find((p) => p.id === targetPlayerId);
        if (target.tableau.some((c) => c.cardId === "BODYGUARD")) {
          reportGains.push({ desc: "Thief Blocked", amount: 0 });
          logs.push({
            text: `🛡️ ${target.name}'s Bodyguard stopped the Thief!`,
            type: "warning",
            id: Date.now(),
          });
          publicOutcomes.push(`Targeted ${target.name}`);
          publicOutcomes.push("Blocked by Bodyguard!");
        } else {
          const amount = Math.min(target.gold, 2);
          target.gold -= amount;
          me.gold += amount;
          netChange += amount;
          reportGains.push({ desc: `Stole from ${target.name}`, amount });
          logs.push({
            text: `🦹 ${me.name} stole ${amount} Gold from ${target.name}.`,
            type: "danger",
            id: Date.now(),
          });
          publicOutcomes.push(`Stole ${amount} Gold from ${target.name}`);
        }
      } else if (cardId === "ASSASSIN") {
        const target = players.find((p) => p.id === targetPlayerId);
        if (target.tableau.some((c) => c.cardId === "BODYGUARD")) {
          logs.push({
            text: `🛡️ ${target.name}'s Bodyguard intercepted!`,
            type: "warning",
            id: Date.now(),
          });
          publicOutcomes.push(`Targeted ${target.name}`);
          publicOutcomes.push("Blocked by Bodyguard!");
        } else {
          if (secondaryTarget !== null && target.tableau[secondaryTarget]) {
            const killed = target.tableau[secondaryTarget];
            target.tableau.splice(secondaryTarget, 1);
            discardPile.push(killed.cardId);
            logs.push({
              text: `🗡️ ${me.name} assassinated ${target.name}'s ${
                CARDS[killed.cardId].name
              }!`,
              type: "danger",
              id: Date.now(),
            });
            publicOutcomes.push(
              `Assassinated ${target.name}'s ${CARDS[killed.cardId].name}`,
            );
          }
        }
      } else if (cardId === "BLACKMAIL") {
        const target = players.find((p) => p.id === targetPlayerId);
        if (target.tableau.some((c) => c.cardId === "BODYGUARD")) {
          logs.push({
            text: `🛡️ ${target.name} blocked Blackmail.`,
            type: "warning",
            id: Date.now(),
          });
          publicOutcomes.push(`Targeted ${target.name}`);
          publicOutcomes.push("Blocked by Bodyguard!");
        } else {
          if (secondaryTarget === "GOLD") {
            const amount = Math.min(target.gold, 4);
            target.gold -= amount;
            me.gold += amount;
            netChange += amount;
            reportGains.push({ desc: `Blackmail Gold`, amount });
            logs.push({
              text: `🤐 ${me.name} blackmailed ${target.name} for ${amount} Gold.`,
              type: "danger",
              id: Date.now(),
            });
            publicOutcomes.push(
              `Blackmailed ${target.name} for ${amount} Gold`,
            );
          } else {
            const idx = parseInt(secondaryTarget);
            if (!isNaN(idx) && target.tableau[idx]) {
              const stolen = target.tableau[idx];
              target.tableau.splice(idx, 1);
              me.tableau.push(stolen);
              logs.push({
                text: `🤐 ${me.name} blackmailed ${target.name}'s ${
                  CARDS[stolen.cardId].name
                }.`,
                type: "danger",
                id: Date.now(),
              });
              publicOutcomes.push(
                `Stole ${target.name}'s ${CARDS[stolen.cardId].name}`,
              );
            }
          }
        }
      } else if (cardId === "DOPPELGANGER") {
        const prevAction = gameState.lastAction;
        if (!prevAction || prevAction.cardId === "DOPPELGANGER") {
          logs.push({
            text: `🎭 ${me.name}'s Doppelganger fizzled.`,
            type: "failure",
            id: Date.now(),
          });
          publicOutcomes.push("Effect Fizzled");
        } else {
          logs.push({
            text: `🎭 ${me.name} copies ${CARDS[prevAction.cardId].name}...`,
            type: "neutral",
            id: Date.now(),
          });
          const copyId = prevAction.cardId;
          if (["URCHIN", "HEIST"].includes(copyId)) {
            if (copyId === "URCHIN") {
              me.gold += 2;
              netChange += 2;
              reportGains.push({ desc: "Copied Urchin", amount: 2 });
              publicOutcomes.push("Mimicked Urchin: +2 Gold");
            }
            if (copyId === "HEIST") {
              const roll = Math.floor(Math.random() * 6) + 1;
              if (roll >= 4) {
                me.gold += 5;
                netChange += 5;
                reportGains.push({ desc: "Copied Heist", amount: 5 });
                publicOutcomes.push("Mimicked Heist: +5 Gold!");
              } else {
                publicOutcomes.push("Mimicked Heist: Failed.");
              }
            }
          } else {
            me.gold += 3;
            netChange += 3;
            reportGains.push({ desc: "Copied Complex Action", amount: 3 });
            logs.push({
              text: `(Doppelganger mimics complex action as +3 Gold)`,
              type: "neutral",
              id: Date.now(),
            });
            publicOutcomes.push(`Mimicked ${CARDS[copyId].name}`);
            publicOutcomes.push("Bonus: +3 Gold");
          }
        }
      }
    }

    // --- IMMEDIATE WIN CHECK ---
    const goal = calculateWinGoal(players.length);
    if (me.gold >= goal) {
      const finalPlayers = players.map((p) => ({ ...p, ready: false }));
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: finalPlayers,
          status: "finished",
          winnerId: me.id,
          logs: arrayUnion({
            text: `🏆 ${me.name} has bought the Guild!`,
            type: "success",
            id: Date.now() + 2,
          }),
        },
      );
      return; // Do NOT call nextTurn
    }

    const eveningReport = {
      playerId: me.id,
      actionName: card.name,
      cost: card.cost,
      tax: tax,
      gains: reportGains,
      netChange: netChange,
      seen: false,
    };

    const publicEvent = {
      id: Date.now(),
      type: "PLAY",
      actorName: me.name,
      cardId: cardId,
      outcomes: publicOutcomes,
    };

    setSelectedCardIdx(null);
    setTargetMode(null);
    setSelectedTargetPlayerId(null);
    setDoppelgangerConfirm(null);

    await nextTurn(
      players,
      deck,
      discardPile,
      logs,
      newLastAction,
      eveningReport,
      publicEvent,
    );
  };

  const handleExcessDiscard = async (handIdx) => {
    const players = JSON.parse(JSON.stringify(gameState.players));
    const meIdx = gameState.turnIndex;
    const me = players[meIdx];
    const deck = [...gameState.deck];
    const discardPile = [...gameState.discardPile];
    const logs = [];

    // Discard chosen card
    const discarded = me.hand.splice(handIdx, 1)[0];
    discardPile.push(discarded);

    logs.push({
      text: `🗑️ ${me.name} discarded ${CARDS[discarded].name} (Hand Limit).`,
      type: "neutral",
      id: Date.now(),
    });

    const eveningReport = {
      playerId: me.id,
      actionName: "Discard",
      cost: 0,
      tax: 0,
      gains: [],
      netChange: 0,
      seen: false,
    };

    const publicEvent = {
      id: Date.now(),
      type: "DISCARD",
      actorName: me.name,
      cardId: null,
      outcomes: [`Discarded ${CARDS[discarded].name}`, "Hand limit enforced"],
    };

    setSelectedCardIdx(null);
    setTargetMode(null);
    await nextTurn(
      players,
      deck,
      discardPile,
      logs,
      null,
      eveningReport,
      publicEvent,
    );
  };

  const handleCardClick = (idx) => {
    if (targetMode === "DISCARD") {
      handleExcessDiscard(idx);
      return;
    }

    if (targetMode === "SCOUT") {
      handleScout(idx);
      return;
    }

    const cardId = gameState.players[gameState.turnIndex].hand[idx];
    const card = CARDS[cardId];
    const me = gameState.players[gameState.turnIndex];
    const tax =
      card.type === "ACTION" ? getTaxAmount(gameState.players, me.id) : 0;

    if (me.gold < card.cost + tax) {
      triggerFeedback(
        "failure",
        "Insufficient Funds",
        `Cost: ${card.cost} + ${tax} Tax`,
        Coins,
      );
      return;
    }

    // Logic for Doppelganger Confirmation
    if (cardId === "DOPPELGANGER") {
      const lastAction = gameState.lastAction;
      let targetCard = null;
      if (lastAction && lastAction.cardId !== "DOPPELGANGER") {
        targetCard = CARDS[lastAction.cardId];
      }
      setDoppelgangerConfirm({ handIdx: idx, targetCard });
      return;
    }

    setSelectedCardIdx(idx);

    if (cardId === "THIEF" || cardId === "ASSASSIN" || cardId === "BLACKMAIL") {
      setTargetMode("PLAYER");
    } else if (
      card.type === "AGENT" ||
      cardId === "URCHIN" ||
      cardId === "HEIST"
    ) {
      initiatePlay(idx, null, null);
    }
  };

  const handleTargetPlayerClick = (pid) => {
    if (!targetMode) return;
    const cardId = gameState.players[gameState.turnIndex].hand[selectedCardIdx];

    if (cardId === "THIEF") {
      initiatePlay(selectedCardIdx, pid, null);
    } else if (cardId === "ASSASSIN") {
      setSelectedTargetPlayerId(pid);
      setTargetMode("CARD");
    } else if (cardId === "BLACKMAIL") {
      setSelectedTargetPlayerId(pid);
      setTargetMode("OPTION");
    }
  };

  const handleTargetCardClick = (targetCardIdx) => {
    if (targetMode === "CARD" && selectedTargetPlayerId) {
      initiatePlay(selectedCardIdx, selectedTargetPlayerId, targetCardIdx);
    }
  };

  const handleOptionSelect = (option) => {
    if (targetMode === "OPTION" && selectedTargetPlayerId) {
      initiatePlay(selectedCardIdx, selectedTargetPlayerId, option);
    }
  };

  const initiatePlay = async (handIdx, targetPid, secTarget) => {
    const players = JSON.parse(JSON.stringify(gameState.players));
    const deck = [...gameState.deck];
    const discardPile = [...gameState.discardPile];
    const logs = [];
    const me = players.find((p) => p.id === user.uid);
    const cardId = me.hand[handIdx];
    const tax =
      CARDS[cardId].type === "ACTION" ? getTaxAmount(players, me.id) : 0;

    await executeCardEffect(
      cardId,
      targetPid,
      secTarget,
      players,
      deck,
      discardPile,
      logs,
      gameState.turnIndex,
      tax,
    );
  };

  const startScoutMode = () => {
    setTargetMode("SCOUT");
    triggerFeedback("success", "Scout Mode", "Select a card to discard", Eye);
  };

  const handleScout = async (handIdx) => {
    const players = JSON.parse(JSON.stringify(gameState.players));
    const meIdx = gameState.turnIndex;
    const me = players[meIdx];
    const deck = [...gameState.deck];
    const discardPile = [...gameState.discardPile];
    const logs = [];

    // Discard chosen card
    const discarded = me.hand.splice(handIdx, 1)[0];
    discardPile.push(discarded);

    // Draw replacement
    if (deck.length > 0) {
      me.hand.push(deck.pop());
    }

    logs.push({
      text: `zzz ${me.name} scouted (replaced a card).`,
      type: "neutral",
      id: Date.now(),
    });

    const eveningReport = {
      playerId: me.id,
      actionName: "Scout Mission",
      cost: 0,
      tax: 0,
      gains: [{ desc: "Card Replaced", amount: 0 }],
      netChange: 0,
      seen: false,
    };

    const publicEvent = {
      id: Date.now(),
      type: "SCOUT",
      actorName: me.name,
      cardId: null,
      outcomes: ["Discarded 1 card", "Drew 1 replacement"],
    };

    setSelectedCardIdx(null);
    setTargetMode(null);
    await nextTurn(
      players,
      deck,
      discardPile,
      logs,
      null,
      eveningReport,
      publicEvent,
    );
  };

  const handlePeek = () => {
    if (gameState.deck.length === 0) return;
    setPeekCard(gameState.deck[gameState.deck.length - 1]);
    setTimeout(() => setPeekCard(null), 3000);
  };

  const getDoppelEffectText = (cardId) => {
    if (cardId === "URCHIN") return "Effect: Gain +2 Gold";
    if (cardId === "HEIST") return "Effect: 50% chance to gain +5 Gold";
    // All other cards result in simple mimic gold gain in this version
    return "Effect: Gain +3 Gold (Mimic Bonus)";
  };

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
            The Guild Hall is dark. The masters are deliberating.
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
        <Logo />
      </div>
    );
  }

  // --- RENDER HELPERS ---

  if (!user)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-purple-500 animate-pulse">
        Awakenning shadows...
      </div>
    );

  // RECONNECTING STATE
  if (roomId && !gameState && !error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4">
        <FloatingBackground />
        <div className="bg-zinc-900/80 backdrop-blur p-8 rounded-2xl border border-zinc-700 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <Loader size={48} className="text-purple-500 animate-spin" />
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
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <FloatingBackground />
        {/* --- START OF BACK BUTTON --- */}
        <nav className="absolute top-0 left-0 w-full p-4 z-50">
          <a
            href={import.meta.env.BASE_URL}
            className="flex items-center gap-2 text-purple-800 rounded-lg font-bold shadow-md hover:text-purple-400 transition-colors w-fit animate-pulse"
          >
            {/* Arrow Icon */}
            <StepBack />
            <span>Back to Gamehub</span>
          </a>
        </nav>
        {/* --- END OF BACK BUTTON --- */}

        <div className="z-10 text-center mb-10">
          <Ghost
            size={64}
            className="text-purple-500 mx-auto mb-4 animate-bounce drop-shadow-lg"
          />
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-linear-to-b from-purple-400 to-indigo-600 font-serif tracking-widest">
            GUILD OF SHADOWS
          </h1>
          <p className="text-white-400/60 tracking-[0.3em] uppercase mt-2">
            In Shadows We Trust
          </p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur border border-purple-500/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl z-10">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-xs border border-red-800">
              {error}
            </div>
          )}

          <input
            className="w-full bg-black/50 border border-gray-700 p-3 rounded mb-3 text-white placeholder-gray-500 focus:border-purple-500 outline-none transition-colors"
            placeholder="CODENAME"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-linear-to-r from-purple-700 to-indigo-600 hover:from-purple-600 p-3 rounded font-bold mb-3 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Crown size={18} />
            )}
            {loading ? "Establishing..." : "Establish Guild"}
          </button>

          <div className="flex gap-2 mb-3">
            <input
              className="flex-1 bg-black/50 border border-gray-700 p-3 rounded text-white placeholder-gray-500 uppercase font-mono tracking-wider focus:border-purple-500 outline-none"
              placeholder="CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 px-4 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] flex items-center justify-center"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Join"
              )}
            </button>
          </div>

          <button
            onClick={() => setShowGuide(true)}
            className="w-full text-xs text-gray-500 hover:text-white flex items-center justify-center gap-2 py-2"
          >
            <BookOpen size={14} /> Guild Archives
          </button>
        </div>
        {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 relative">
        <FloatingBackground />
        <LogoBig />
        <div className="z-10 w-full max-w-md bg-gray-900/90 backdrop-blur p-6 rounded-2xl border border-purple-900/50 shadow-2xl">
          <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
            {/* Grouping Title and Copy Button together on the left */}
            <div>
              <h2 className="text-lg md:text-xl text-purple-400 font-bold uppercase">
                Shadow Hall
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
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-purple-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg animate-fade-in-up whitespace-nowrap">
                      Copied!
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="text-red-400 hover:text-red-300"
            >
              <LogOut size={20} />
            </button>
          </div>

          <div className="space-y-2 mb-6">
            <h3 className="text-xs uppercase text-gray-500 font-bold tracking-wider">
              Operatives
            </h3>
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-gray-800/50 p-3 rounded border border-gray-700/50 group"
              >
                <span className="font-bold flex items-center gap-2">
                  <User size={14} /> {p.name}
                  {p.id === gameState.hostId && (
                    <Crown size={14} className="text-yellow-500" />
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-xs flex items-center gap-1">
                    <CheckCircle size={12} /> Ready
                  </span>
                  {isHost && p.id !== user.uid && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      className="text-gray-600 hover:text-red-500 transition-colors p-1"
                      title="Kick Player"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isHost ? (
            <button
              onClick={startGame}
              disabled={gameState.players.length < 2}
              className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 ${
                gameState.players.length < 2
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-green-700 hover:bg-green-600 text-white"
              }`}
            >
              Start Operation
            </button>
          ) : (
            <div className="text-center text-purple-400/60 animate-pulse text-sm">
              Waiting for Guild Master...
            </div>
          )}
        </div>
        {/* ADD THIS HERE: */}
        {showLeaveConfirm && (
          <div className="fixed inset-0 z-200 bg-black/90 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm text-center border border-gray-700 shadow-2xl">
              <h3 className="text-lg font-bold mb-4 text-white">
                Abandon the Guild?
              </h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="bg-gray-700 hover:bg-gray-600 py-3 rounded font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveRoom}
                  className="bg-red-600 hover:bg-red-500 py-3 rounded font-bold transition-colors"
                >
                  {gameState.hostId === user.uid
                    ? "Disband Guild (Delete Room)"
                    : "Leave Game"}
                </button>
              </div>
            </div>
          </div>
        )}
        <Logo />
      </div>
    );
  }

  // --- GAME VIEW ---
  const meIdx = gameState.players.findIndex((p) => p.id === user.uid);
  const me = gameState.players[meIdx];
  const isMyTurn = gameState.turnIndex === meIdx;
  const selectedCard =
    selectedCardIdx !== null ? CARDS[me.hand[selectedCardIdx]] : null;
  const taxAmount = getTaxAmount(gameState.players, me.id);
  const winGoal = calculateWinGoal(gameState.players.length);

  // Check if I have Lookout agent for UI button logic
  const hasLookout = me.tableau.some((c) => c.cardId === "LOOKOUT");

  return (
    <div className="h-dvh bg-gray-950 text-white overflow-hidden flex flex-col relative font-sans">
      <FloatingBackground />

      {/* --- NOTIFICATIONS --- */}
      {feedback && <FeedbackOverlay {...feedback} />}

      {/* --- ACTION BROADCAST --- */}
      <ActionBroadcast
        event={activeEvent}
        onClose={() => setActiveEvent(null)}
      />

      {/* RENDER LOGIC: Ensure Mutual Exclusivity and Proper Layering */}
      {peekCard && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center bg-black/80 backdrop-blur"
          onClick={() => setPeekCard(null)}
        >
          <div className="animate-in zoom-in duration-200 flex flex-col items-center p-8">
            <div className="text-white font-bold mb-6 text-2xl tracking-widest">
              Top of Deck
            </div>
            <div className="scale-150 transform transition-all">
              <CardDisplay cardId={peekCard} />
            </div>
            <div className="mt-8 text-gray-400 text-sm animate-pulse">
              (Tap anywhere to close)
            </div>
          </div>
        </div>
      )}

      {/* DOPPELGANGER CONFIRMATION MODAL */}
      {doppelgangerConfirm && (
        <div className="fixed inset-0 z-190 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-gray-800 border-2 border-cyan-500 rounded-2xl w-full max-w-sm flex flex-col items-center p-6 shadow-[0_0_30px_rgba(34,211,238,0.2)] animate-in zoom-in-95">
            <Copy size={48} className="text-cyan-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Doppelganger</h3>

            <div className="text-center mb-6 w-full">
              <p className="text-gray-400 text-sm mb-2">
                Copying previous action:
              </p>
              {doppelgangerConfirm.targetCard ? (
                <div className="bg-black/40 p-4 rounded-lg border border-gray-700 flex flex-col items-center w-full">
                  <span
                    className={`font-bold ${doppelgangerConfirm.targetCard.color} text-lg`}
                  >
                    {doppelgangerConfirm.targetCard.name}
                  </span>
                  <div className="mt-3 bg-cyan-900/30 text-cyan-200 px-3 py-2 rounded text-sm font-bold border border-cyan-500/30 w-full text-center">
                    {getDoppelEffectText(doppelgangerConfirm.targetCard.id)}
                  </div>
                </div>
              ) : (
                <div className="bg-red-900/20 border border-red-500/50 p-3 rounded text-red-200 text-sm italic">
                  No valid action to copy (Effect will fizzle).
                </div>
              )}
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDoppelgangerConfirm(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  initiatePlay(doppelgangerConfirm.handIdx, null, null)
                }
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TOP BAR --- */}
      <div className="h-14 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between px-4 z-160 shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <span className="font-serif text-purple-500 font-bold hidden md:inline text-lg">
            GUILD OF SHADOWS
          </span>
          <span className="bg-purple-900/40 text-yellow-500 text-xs px-3 py-1 rounded-full border border-purple-800/50 font-mono tracking-wider shadow-[0_0_10px_rgba(168,85,247,0.2)]">
            Goal: {winGoal} <Coins size={10} className="inline ml-0.5" />
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className={`p-2 rounded-full ${
              showLogs
                ? "bg-purple-900 text-purple-400"
                : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            <History size={20} />
          </button>
          <button
            onClick={() => setShowGuide(true)}
            className="p-2 text-gray-400 hover:bg-gray-800 rounded-full transition-colors"
          >
            <BookOpen size={20} />
          </button>
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="p-2 text-red-400 hover:bg-red-900/20 rounded-full transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* --- MAIN AREA --- */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* OPPONENTS SCROLL VIEW */}
        <div className="flex-1 overflow-y-auto p-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {gameState.players.map((p, i) => {
              if (p.id === user.uid) return null;
              const isActive = gameState.turnIndex === i;
              const isTargetable = targetMode === "PLAYER";
              const isSelected = selectedTargetPlayerId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() =>
                    isTargetable ? handleTargetPlayerClick(p.id) : null
                  }
                  className={`
                        relative bg-gray-900/80 backdrop-blur-sm p-3 rounded-xl border transition-all duration-200
                        ${
                          isActive
                            ? "border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.25)] bg-purple-900/10 scale-[1.02]"
                            : "border-gray-800"
                        }
                        ${
                          isTargetable
                            ? "cursor-pointer hover:border-red-400 hover:bg-red-900/10 ring-2 ring-transparent hover:ring-red-500/50"
                            : ""
                        }
                        ${isSelected ? "ring-2 ring-red-500 bg-red-900/20" : ""}
                      `}
                >
                  {/* PLAYING STATUS BADGE */}
                  {isActive && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-600 text-purple-100 text-[9px] px-2 py-0.5 rounded-full font-bold shadow-lg animate-pulse z-10 whitespace-nowrap flex items-center gap-1">
                      <PlayCircle size={8} /> PLAYING
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-200 flex items-center gap-1.5 truncate max-w-[100px]">
                        {p.name}
                        {p.id === gameState.hostId && (
                          <Crown size={12} className="text-yellow-500" />
                        )}
                      </span>
                      <span className="text-xs text-yellow-500 flex items-center gap-1 font-mono bg-black/40 px-1.5 py-0.5 rounded w-fit mt-1 border border-yellow-500/20">
                        {p.gold} <Coins size={10} />
                      </span>
                    </div>
                    <div className="flex gap-0.5">
                      {p.hand.map((_, h) => (
                        <div
                          key={h}
                          className="w-2.5 h-4 bg-linear-to-b from-purple-800 to-purple-950 rounded-[2px] border border-purple-600/50 shadow-sm"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Tableau */}
                  <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                    {p.tableau.map((c, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTargetCardClick(idx);
                        }}
                        className={`${
                          targetMode === "CARD" && isSelected
                            ? "animate-pulse cursor-pointer ring-1 ring-red-400 rounded"
                            : ""
                        }`}
                      >
                        <CardDisplay
                          cardId={c.cardId}
                          turnsLeft={c.turnsLeft}
                          tiny
                        />
                      </div>
                    ))}
                    {p.tableau.length === 0 && (
                      <div className="w-full h-8 flex items-center justify-center text-[10px] text-gray-600 italic border border-dashed border-gray-800 rounded">
                        Empty Hall
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Logs Preview - Floating */}
          <div className="mt-6 flex flex-col items-center space-y-1.5 pointer-events-none opacity-80">
            {gameState.logs
              .slice(-3)
              .reverse()
              .map((l) => (
                <div
                  key={l.id}
                  className={`text-[10px] px-3 py-1 rounded-full backdrop-blur-md shadow-lg border ${
                    l.type === "danger"
                      ? "bg-red-950/70 border-red-500/30 text-red-200"
                      : "bg-gray-900/70 border-gray-700/50 text-gray-300"
                  }`}
                >
                  {l.text}
                </div>
              ))}
          </div>
        </div>

        {/* --- BOTTOM PLAYER AREA (Flex Column for No Overlap) --- */}
        <div className="bg-gray-950 border-t border-purple-900/30 pb-safe z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] flex flex-col shrink-0">
          {/* 0. REPORT AREA (PERSISTENT & INLINE ABOVE STATUS) */}
          <div className="w-full bg-black/20">
            {/* YOUR TURN BANNER */}
            {isMyTurn && (
              <div className="w-full bg-green-600/20 border-y border-green-500/30 py-1 flex items-center justify-center animate-pulse">
                <span className="text-green-400 font-bold tracking-[0.3em] text-[10px] md:text-xs uppercase flex items-center gap-2">
                  <PlayCircle size={10} /> Your Turn
                </span>
              </div>
            )}

            {!peekCard && morningReportData ? (
              <MorningReportInline report={morningReportData} />
            ) : !peekCard && eveningReportData ? (
              <EveningReportInline report={eveningReportData} />
            ) : null}
          </div>

          {/* 1. Status Bar */}
          <div className="flex justify-between items-center px-4 py-2 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="text-yellow-400 font-black text-2xl flex items-center gap-2 drop-shadow-md">
                <Coins className="fill-yellow-400/20" size={24} /> {me.gold}
              </div>
              {taxAmount > 0 && (
                <div className="text-xs text-red-400 flex items-center gap-1 bg-red-950/50 px-2 py-1 rounded border border-red-900/50">
                  Tax: +{taxAmount} <Coins size={10} />
                </div>
              )}
            </div>

            <div className="flex gap-1.5 overflow-x-auto max-w-[50%] no-scrollbar items-center mask-linear-fade">
              {me.tableau.map((c, i) => (
                <div key={i} className="shrink-0">
                  <CardDisplay cardId={c.cardId} turnsLeft={c.turnsLeft} tiny />
                </div>
              ))}
            </div>
          </div>

          {/* 2. Controls / Action Prompts (Middle Layer) */}
          <div className="min-h-[50px] flex items-center justify-center py-2 px-4">
            {isMyTurn && !targetMode && selectedCardIdx === null && (
              <div className="flex gap-3 w-full justify-center">
                {hasLookout && (
                  <button
                    onClick={handlePeek}
                    className="bg-indigo-900 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/50 px-5 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 text-sm transition-all active:scale-95"
                  >
                    <Search size={16} /> Peek
                  </button>
                )}

                {me.hand.length > 5 ? (
                  <button
                    onClick={() => {
                      setTargetMode("DISCARD");
                      triggerFeedback(
                        "neutral",
                        "Discard Mode",
                        "Hand limit reached",
                        Trash2,
                      );
                    }}
                    className="flex-1 max-w-xs bg-red-900/90 hover:bg-red-800 text-red-100 border border-red-500/50 px-6 py-2.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 text-sm transition-all active:scale-95"
                  >
                    Discard & Pass <Trash2 size={16} />
                  </button>
                ) : (
                  <button
                    onClick={startScoutMode}
                    className="flex-1 max-w-xs bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600 px-6 py-2.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 text-sm transition-all active:scale-95"
                  >
                    Pass & Scout <ArrowRightLeft size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Mode Messages */}
            {targetMode === "SCOUT" && (
              <div className="flex items-center gap-3 bg-blue-900/30 border border-blue-500/30 px-4 py-2 rounded-full">
                <span className="text-blue-300 text-sm font-bold flex items-center gap-2">
                  <Eye size={16} /> Select card to discard
                </span>
                <button
                  onClick={() => setTargetMode(null)}
                  className="bg-gray-800 p-1 rounded-full"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {targetMode === "DISCARD" && (
              <div className="flex items-center gap-3 bg-red-900/30 border border-red-500/30 px-4 py-2 rounded-full">
                <span className="text-red-300 text-sm font-bold flex items-center gap-2">
                  <Trash2 size={16} /> Hand Full: Discard 1
                </span>
                <button
                  onClick={() => setTargetMode(null)}
                  className="bg-gray-800 p-1 rounded-full"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {targetMode === "PLAYER" && (
              <div className="flex items-center gap-3 bg-red-900/30 border border-red-500/30 px-4 py-2 rounded-full animate-pulse">
                <span className="text-red-300 text-sm font-bold flex items-center gap-2">
                  <AlertTriangle size={16} /> Select Target Player
                </span>
                <button
                  onClick={() => {
                    setTargetMode(null);
                    setSelectedCardIdx(null);
                  }}
                  className="bg-gray-800 p-1 rounded-full"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {selectedCardIdx !== null && !targetMode && (
              <button
                onClick={() => setSelectedCardIdx(null)}
                className="bg-gray-800 text-gray-400 px-4 py-1.5 rounded-full text-xs font-bold border border-gray-700"
              >
                Cancel Selection
              </button>
            )}

            {/* Sub-modes */}
            {targetMode === "CARD" && (
              <div className="bg-black/60 px-4 py-2 rounded-full text-sm font-bold border border-red-500/50 text-red-200">
                Select Agent to Destroy
              </div>
            )}
            {targetMode === "OPTION" && (
              <div className="flex gap-3 w-full justify-center">
                <button
                  onClick={() => handleOptionSelect("GOLD")}
                  className="bg-yellow-700 hover:bg-yellow-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 border border-yellow-500"
                >
                  Steal 4 Gold
                </button>
                <button
                  onClick={() => setTargetMode("CARD")}
                  className="bg-blue-700 hover:bg-blue-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 border border-blue-500"
                >
                  Steal Agent
                </button>
              </div>
            )}
          </div>

          {/* 3. Hand (Bottom Layer - Horizontal Scroll) */}
          <div className="flex overflow-x-auto px-4 pb-4 gap-3 no-scrollbar snap-x snap-mandatory min-h-[180px] items-center">
            {me.hand.length === 0 && (
              <div className="text-gray-600 text-sm italic w-full text-center py-8 border-2 border-dashed border-gray-800 rounded-xl">
                Hand Empty
              </div>
            )}
            {me.hand.map((c, i) => (
              <div
                key={i}
                className={`snap-center transition-transform duration-200 ${
                  selectedCardIdx === i ? "-translate-y-6 scale-105" : ""
                }`}
              >
                <CardDisplay
                  cardId={c}
                  onClick={() => (isMyTurn ? handleCardClick(i) : null)}
                  disabled={
                    !isMyTurn ||
                    (targetMode !== null &&
                      targetMode !== "SCOUT" &&
                      targetMode !== "DISCARD" &&
                      selectedCardIdx !== i)
                  }
                  highlight={selectedCardIdx === i}
                />
              </div>
            ))}
            {/* Spacer for right padding in scroll view */}
            <div className="w-2 shrink-0"></div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {showLogs && (
        <div className="fixed top-16 right-4 w-64 max-h-60 bg-gray-900/95 border border-gray-700 rounded-xl z-155 overflow-y-auto p-2 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Shadow Log</h3>
            <button onClick={() => setShowLogs(false)}>
              <X />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {[...gameState.logs].reverse().map((l) => (
              <div
                key={l.id}
                className={`p-3 rounded border-l-4 text-sm ${
                  l.type === "danger"
                    ? "bg-red-900/20 border-red-500"
                    : l.type === "success"
                      ? "bg-green-900/20 border-green-500"
                      : "bg-gray-800 border-gray-600"
                }`}
              >
                <span className="opacity-70 text-[10px] block mb-1">
                  {new Date(l.id).toLocaleTimeString()}
                </span>
                {l.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-200 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm text-center">
            <h3 className="text-lg font-bold mb-4">Abandon the Guild?</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="bg-gray-700 py-3 rounded font-bold"
              >
                Cancel
              </button>
              {gameState.hostId === user.uid && (
                <button
                  onClick={returnToLobby}
                  className="bg-purple-700 py-3 rounded font-bold"
                >
                  Return to Lobby
                </button>
              )}
              <button
                onClick={handleLeaveRoom}
                className="bg-red-600 py-3 rounded font-bold"
              >
                {gameState.hostId === user.uid
                  ? "Leave (Delete Room)"
                  : "Leave Game"}
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState.status === "finished" && (
        <div className="fixed inset-0 top-14 z-150 bg-black/90 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <Trophy size={80} className="text-yellow-400 mb-6 animate-bounce" />
          <h2 className="text-4xl font-black text-white mb-2">GAME OVER</h2>
          <p className="text-2xl text-purple-400 font-serif mb-8">
            {gameState.players.find((p) => p.id === gameState.winnerId)?.name}{" "}
            is the new Guild Master!
          </p>

          {/* FINAL SCOREBOARD */}
          <div className="bg-gray-800/80 p-5 rounded-2xl mb-6 w-full max-w-sm border border-gray-700 shadow-xl">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-700 pb-2">
              Final Standings
            </h3>
            <div className="space-y-3">
              {[...gameState.players]
                .sort((a, b) => b.gold - a.gold)
                .map((p, i) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center bg-black/30 p-2 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                            ${
                              i === 0
                                ? "bg-yellow-500 text-black"
                                : "bg-gray-700 text-gray-300"
                            }
                         `}
                      >
                        {i + 1}
                      </div>
                      <span
                        className={`font-bold ${
                          p.id === gameState.winnerId
                            ? "text-yellow-400"
                            : "text-white"
                        }`}
                      >
                        {p.name}
                      </span>
                    </div>
                    <div className="font-mono text-yellow-500 font-bold flex items-center gap-1">
                      {p.gold} <Coins size={12} />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-gray-800/50 p-4 rounded-xl mb-6 w-full max-w-sm">
            <h4 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">
              Rematch Status
            </h4>
            <div className="space-y-2">
              {gameState.players.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span
                    className={
                      p.ready ? "text-green-400 font-bold" : "text-gray-500"
                    }
                  >
                    {p.ready ? "READY" : "WAITING"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            {!me.ready ? (
              <button
                onClick={toggleReady}
                className="bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold"
              >
                Ready for Rematch
              </button>
            ) : (
              <div className="text-green-500 font-bold mb-2">
                You are ready!
              </div>
            )}

            {gameState.hostId === user.uid && (
              <button
                onClick={returnToLobby}
                disabled={!gameState.players.every((p) => p.ready)}
                className={`py-3 rounded-lg font-bold transition-all ${
                  gameState.players.every((p) => p.ready)
                    ? "bg-white text-black hover:scale-105"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                Return to Lobby
              </button>
            )}
          </div>
        </div>
      )}
      <Logo />
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}
