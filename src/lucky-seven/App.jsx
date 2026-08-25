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
} from "firebase/firestore";
import {
  AlertTriangle, Crown, X, StepBack, Play, RotateCcw, Copy, 
  CheckCircle, Trash2, LogOut, Hammer, BookOpen, History, BarChart2,
  Sparkles, Earth, Zap, Snowflake, Shuffle, HeartHandshake, Hash,
  Crosshair, User, Loader
} from "lucide-react";
import CoverImage from "./assets/seven.png";

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

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "lucky7-game";
const GAME_ID = "24";

// ---------------------------------------------------------------------------
// STYLES & VISUALS
// ---------------------------------------------------------------------------
const GlobalStyles = () => (
  <style>{`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.6); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 1); }
    
    @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
    .animate-float { animation: float infinite ease-in-out; }
    
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-spin-slow { animation: spin-slow 20s linear infinite; }
    
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    @keyframes pulse-cyan {
      0%, 100% { box-shadow: 0 0 20px rgba(34, 211, 238, 0.3); }
      50% { box-shadow: 0 0 40px rgba(34, 211, 238, 0.7); }
    }
    .animate-pulse-cyan { animation: pulse-cyan 3s ease-in-out infinite; }
  `}</style>
);

const FloatingBackground = React.memo(() => {
  const backgroundIcons = React.useMemo(() => {
    const icons = [Zap, Hash, Sparkles, Shuffle];
    return [...Array(15)].map((_, i) => {
      const Icon = icons[i % icons.length];
      return (
        <div
          key={i}
          className="absolute animate-float text-cyan-500/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${12 + Math.random() * 15}s`,
            transform: `scale(${0.8 + Math.random()})`,
          }}
        >
          <Icon size={48} />
        </div>
      );
    });
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-black" />
      <div className="absolute top-0 left-0 w-full h-full opacity-40">
        {backgroundIcons}
      </div>
    </div>
  );
});

const DarkAtmosphere = React.memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-950/40 via-slate-950 to-black opacity-90" />
    <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />
    {[...Array(25)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full animate-float opacity-30"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 4 + 1}px`,
          height: `${Math.random() * 4 + 1}px`,
          backgroundColor: Math.random() > 0.5 ? "#d946ef" : "#8b5cf6",
          animationDuration: `${10 + Math.random() * 20}s`,
          animationDelay: `${Math.random() * -20}s`,
          boxShadow: "0 0 15px 2px rgba(217,70,239,0.4)",
        }}
      />
    ))}
    <style>{`@keyframes float { 0%, 100% { transform: translate(0,0) scale(1); opacity:0.1; } 50% { transform: translate(${Math.random() * 40 - 20}px, -60px) scale(1.5); opacity:0.6; } } .animate-float { animation: float infinite ease-in-out; }`}</style>
  </div>
));

const GameLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Zap size={12} className="text-cyan-500" />
    <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">
      LUCKY 7
    </span>
  </div>
);

const GameLogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Zap size={20} className="text-cyan-500" />
    <span className="text-[20px] font-black tracking-widest text-cyan-500 uppercase">
      LUCKY 7
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// GAME LOGIC HELPERS & DECK MANAGEMENT
// ---------------------------------------------------------------------------
const PLAYER_COLORS = [
  { bg: "bg-cyan-500", border: "border-cyan-400", fill: "#22d3ee", text: "text-cyan-300", glow: "shadow-[0_0_20px_rgba(34,211,238,0.4)]" },
  { bg: "bg-fuchsia-500", border: "border-fuchsia-400", fill: "#e879f9", text: "text-fuchsia-300", glow: "shadow-[0_0_20px_rgba(232,121,249,0.4)]" },
  { bg: "bg-amber-400", border: "border-amber-300", fill: "#fbbf24", text: "text-amber-300", glow: "shadow-[0_0_20px_rgba(251,191,36,0.4)]" },
  { bg: "bg-emerald-500", border: "border-emerald-400", fill: "#34d399", text: "text-emerald-300", glow: "shadow-[0_0_20px_rgba(52,211,153,0.4)]" },
  { bg: "bg-rose-500", border: "border-rose-400", fill: "#fb7185", text: "text-rose-300", glow: "shadow-[0_0_20px_rgba(251,113,133,0.4)]" },
  { bg: "bg-indigo-500", border: "border-indigo-400", fill: "#818cf8", text: "text-indigo-300", glow: "shadow-[0_0_20px_rgba(129,140,248,0.4)]" },
];

const GENERATE_DECK = () => {
  let deck = [];
  let idCounter = 0;
  
  // Numbers (79 cards: 1x0, 1x1, 2x2, 3x3 ... 12x12)
  deck.push({ id: `c_${idCounter++}`, type: 'NUMBER', value: 0 });
  for(let n = 1; n <= 12; n++) {
    for(let i = 0; i < n; i++) {
      deck.push({ id: `c_${idCounter++}`, type: 'NUMBER', value: n });
    }
  }

  // Modifiers (6 cards)
  [2, 4, 6, 8, 10].forEach(val => deck.push({ id: `c_${idCounter++}`, type: 'MODIFIER', value: `+${val}` }));
  deck.push({ id: `c_${idCounter++}`, type: 'MODIFIER', value: 'x2' });

  // Actions (9 cards)
  for(let i = 0; i < 3; i++) {
    deck.push({ id: `c_${idCounter++}`, type: 'ACTION', value: 'FREEZE' });
    deck.push({ id: `c_${idCounter++}`, type: 'ACTION', value: 'FLIP3' });
    deck.push({ id: `c_${idCounter++}`, type: 'ACTION', value: 'SECOND_CHANCE' });
  }

  return deck.sort(() => Math.random() - 0.5); 
};

const getNextActivePlayer = (players, currentIndex) => {
  let next = (currentIndex + 1) % players.length;
  let loops = 0;
  while (players[next].status !== "PLAYING" && loops < players.length) {
    next = (next + 1) % players.length;
    loops++;
  }
  return next;
};

const calculateTurnScore = (activeCards) => {
  if (!activeCards) return 0;
  let sum = 0;
  let multi = 1;
  activeCards.forEach(c => {
    if (c.type === 'NUMBER') sum += c.value;
    if (c.type === 'MODIFIER') {
      if (c.value.startsWith('+')) sum += parseInt(c.value.replace('+', ''));
      if (c.value === 'x2') multi *= 2;
    }
  });
  return sum * multi;
};

// ---------------------------------------------------------------------------
// ENHANCED GAME CARD COMPONENT
// ---------------------------------------------------------------------------
const GameCard = ({ card, size = "md", isBust = false }) => {
  const sizeClasses = 
    size === "sm" ? "w-14 h-20 sm:w-16 sm:h-24 border sm:border-2 shrink-0" : 
    size === "lg" ? "w-24 h-36 sm:w-32 sm:h-48 border-2 sm:border-4 shrink-0" : 
    "w-16 h-24 sm:w-20 sm:h-28 border-2 sm:border-[3px] shrink-0";

  if (!card) return null;

  let bgClass = "bg-zinc-800";
  let borderClass = "border-zinc-600";
  let textClass = "text-white";
  let icon = null;

  if (card.type === 'NUMBER') {
    bgClass = "bg-gradient-to-br from-cyan-500 to-blue-800 shadow-[0_5px_15px_rgba(6,182,212,0.4)]";
    borderClass = "border-cyan-300/80";
    textClass = "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]";
  } else if (card.type === 'MODIFIER') {
    bgClass = "bg-gradient-to-br from-amber-400 to-orange-700 shadow-[0_5px_15px_rgba(245,158,11,0.4)]";
    borderClass = "border-amber-200/80";
    textClass = "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]";
  } else if (card.type === 'ACTION') {
    bgClass = "bg-gradient-to-br from-rose-500 to-fuchsia-900 shadow-[0_5px_15px_rgba(244,63,94,0.4)]";
    borderClass = "border-rose-300/80";
    textClass = "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]";
    if (card.value === 'FREEZE') icon = <Snowflake className="w-2/3 h-2/3 opacity-20 absolute text-white"/>;
    if (card.value === 'FLIP3') icon = <Shuffle className="w-2/3 h-2/3 opacity-20 absolute text-white"/>;
    if (card.value === 'SECOND_CHANCE') icon = <HeartHandshake className="w-2/3 h-2/3 opacity-20 absolute text-white"/>;
  }

  return (
    <div className={`${sizeClasses} relative rounded-xl flex flex-col items-center justify-center ${bgClass} ${borderClass} transition-all duration-300 overflow-hidden ${isBust ? "ring-4 ring-red-500 animate-pulse grayscale" : "hover:-translate-y-1 hover:shadow-[0_15px_25px_rgba(255,255,255,0.2)]"}`}>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none mix-blend-overlay"></div>
      
      {icon}
      
      <span className={`relative z-10 font-black tracking-tight ${size === 'lg' ? 'text-5xl sm:text-6xl' : size === 'sm' ? 'text-xl sm:text-2xl' : 'text-3xl sm:text-4xl'} ${textClass}`}>
        {card.type === 'ACTION' ? (card.value === 'SECOND_CHANCE' ? '2ND' : card.value.replace('FREEZE','FRZ')) : card.value}
      </span>
      
      {card.type === 'ACTION' && size !== 'sm' && (
         <span className={`relative z-10 text-[8px] sm:text-[10px] font-black tracking-widest uppercase mt-1 sm:mt-2 text-center leading-tight px-1 ${textClass}`}>
           {card.value.replace('_', ' ')}
         </span>
      )}
    </div>
  );
};

const triggerLog = (text, type = "neutral", important = false, title = "") => ({
  text, type, important, title, id: Date.now() + Math.random()
});

// ---------------------------------------------------------------------------
// SUBCOMPONENTS (Modals & UI)
// ---------------------------------------------------------------------------
const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
    <div className={`flex flex-col items-center justify-center p-6 sm:p-12 rounded-3xl border-4 shadow-2xl backdrop-blur-xl max-w-[90vw] sm:max-w-xl mx-auto text-center ${
        type === "success" ? "bg-emerald-900/90 border-emerald-500 text-emerald-100" :
        type === "failure" ? "bg-rose-900/90 border-rose-500 text-rose-100" :
        "bg-cyan-900/90 border-cyan-500 text-cyan-100"
      }`}
    >
      {Icon && <div className="mb-4 p-3 sm:p-4 bg-black/20 rounded-full"><Icon className="w-10 h-10 sm:w-16 sm:h-16 animate-bounce"/></div>}
      <h2 className="text-2xl sm:text-5xl font-black uppercase tracking-widest drop-shadow-md mb-2 leading-tight">{message}</h2>
      {subtext && <p className="text-sm sm:text-xl font-bold opacity-90 tracking-wide">{subtext}</p>}
    </div>
  </div>
);

const RulesModal = ({ onClose }) => (
  <div className="fixed inset-0 z-[200] bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-4">
    <div className="bg-slate-900 border border-cyan-900/50 w-full max-w-3xl rounded-3xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
        <X className="text-white" size={24}/>
      </button>
      <h2 className="text-2xl sm:text-3xl font-black text-center mb-6 text-cyan-400">How to Play Lucky 7</h2>
      <div className="space-y-4 sm:space-y-6 text-xs sm:text-sm text-slate-300 flex-1">
        <section>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2"><Sparkles className="text-cyan-400 w-5 h-5"/> Objective</h3>
          <p className="bg-slate-800 p-3 sm:p-4 rounded-xl border border-cyan-900/30">
            Push your luck by flipping cards from the deck. Bank your points before you bust. The first player to reach <strong>200 points</strong> wins!
          </p>
        </section>
        <section>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2"><Hash className="text-cyan-400 w-5 h-5"/> Busting & Lucky 7</h3>
          <p className="bg-slate-800 p-3 sm:p-4 rounded-xl border border-cyan-900/30 mb-2">
            You bust if you flip a Number card that you <strong>already have</strong> in front of you. Busted players score 0 for the turn. (Note: Modifiers and Actions do not cause busts).
          </p>
          <p className="bg-cyan-900/20 p-3 sm:p-4 rounded-xl border border-cyan-500/50 text-cyan-100 font-bold">
            If you successfully reveal 7 unique Number cards, you instantly end the round and score a +15 point bonus!
          </p>
        </section>
        <section>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2"><Zap className="text-cyan-400 w-5 h-5"/> Special Cards</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-800 p-3 rounded-xl border border-amber-500/30">
              <strong className="text-amber-400 block mb-1">Modifiers (+ / x2)</strong>
              <p className="text-[10px] sm:text-xs">Boost your score when you bank.</p>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-rose-500/30">
              <strong className="text-rose-400 block mb-1">Freeze</strong>
              <p className="text-[10px] sm:text-xs">Target a player. Their turn immediately ends and their points are banked.</p>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-rose-500/30">
              <strong className="text-rose-400 block mb-1">Flip Three</strong>
              <p className="text-[10px] sm:text-xs">Target a player. They are forced to flip 3 more cards on their turn.</p>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-rose-500/30">
              <strong className="text-rose-400 block mb-1">Second Chance</strong>
              <p className="text-[10px] sm:text-xs">If you bust, automatically discard this and the duplicate card to survive.</p>
            </div>
          </div>
        </section>
      </div>
      <div className="mt-6 sm:mt-8 flex flex-col items-center gap-2 shrink-0">
        <button onClick={onClose} className="px-6 py-2 sm:px-8 sm:py-3 rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all bg-gradient-to-br from-cyan-600 to-blue-800 text-white hover:from-cyan-500 hover:to-blue-700 hover:scale-105">
          Return to Game
        </button>
      </div>
    </div>
  </div>
);

const ScoreboardModal = ({ gameState, onClose }) => (
  <div className="fixed inset-0 z-[200] bg-zinc-950/95 backdrop-blur-md flex items-center justify-center pt-16 sm:pt-20 pb-10 px-4">
    <div className="bg-slate-900 border border-cyan-900/50 w-full max-w-lg rounded-3xl shadow-2xl p-4 sm:p-6 relative flex flex-col max-h-full">
      <button onClick={onClose} className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors z-10"><X className="w-5 h-5 sm:w-6 sm:h-6 text-white"/></button>
      <div className="shrink-0 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-black text-center text-cyan-400 flex items-center justify-center gap-2"><BarChart2 className="w-5 h-5 sm:w-6 sm:h-6"/> Scoreboard</h2>
      </div>
      <div className="space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1 sm:pr-2">
        {gameState.players.slice().sort((a,b) => b.score - a.score).map((p, idx) => {
          return (
            <div key={p.id} className="bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-lg sm:text-2xl font-black text-slate-500 w-5 sm:w-6">#{idx + 1}</span>
                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-lg ${PLAYER_COLORS[p.colorIdx].bg}`} />
                <span className="font-bold text-sm sm:text-lg text-white truncate max-w-[120px] sm:max-w-[200px]">{p.name}</span>
              </div>
              <span className="text-xl sm:text-3xl font-black text-amber-400">{p.score} <span className="text-xs text-slate-500">/ 200</span></span>
            </div>
          );
        })}
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
    const saved = localStorage.getItem("lucky7_roomId");
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
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-cyan-500/50">
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
            className="group relative px-12 py-5 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-black text-2xl tracking-widest rounded-none transform transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] backdrop-blur-md overflow-hidden"
          >
            {/* Animated Scanline overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent translate-y-[-100%] animate-[scan_2s_infinite_linear]" />

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
        Inspired by Flip 7. A tribute game.
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

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function Lucky7Game() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("splash");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomId, setRoomId] = useState("");
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [showLogs, setShowLogs] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists() && doc.data()[GAME_ID]?.maintenance) setIsMaintenance(true);
      else setIsMaintenance(false);
    }, (err) => console.log("Config Read Error (Safe to ignore):", err));
    return () => unsub();
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
      else await signInAnonymously(auth);
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const savedName = localStorage.getItem("gameHub_playerName") || localStorage.getItem("lucky7_playerName");
        if (savedName) setPlayerName(savedName);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!roomId || !user) return;
    const roomRef = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);
    const unsub = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (!data.players.some((p) => p.id === user.uid)) {
          setRoomId(""); localStorage.removeItem("lucky7_roomId"); setView("menu"); setError("You have been disconnected."); return;
        }
        setGameState(data);
        if (data.status === "playing" || data.status === "finished") setView("game");
        else if (data.status === "lobby") setView("lobby");
      } else {
        setView("menu"); setRoomId(""); localStorage.removeItem("lucky7_roomId"); setError("The game was closed.");
      }
    }, (err) => { console.error(err); setError("Connection lost."); });
    return () => unsub();
  }, [roomId, user]);

  const handleSplashStart = () => {
    const savedRoomId = localStorage.getItem("lucky7_roomId");
    if (savedRoomId) { setLoading(true); setRoomId(savedRoomId); setView("menu"); }
    else { setView("menu"); }
  };

  const lastLogIdRef = useRef(null);
  useEffect(() => {
    if (!gameState?.logs || gameState.logs.length === 0) return;
    const latestLog = gameState.logs[gameState.logs.length - 1];
    if (lastLogIdRef.current === null) { lastLogIdRef.current = latestLog.id; return; }
    if (latestLog.id <= lastLogIdRef.current) return;
    lastLogIdRef.current = latestLog.id;

    if (latestLog.important) {
      setFeedback({
        type: latestLog.type || "neutral",
        message: latestLog.title || "UPDATE",
        subtext: latestLog.text,
        icon: latestLog.type === "success" ? Sparkles : (latestLog.type === "failure" ? AlertTriangle : Zap),
      });
      setTimeout(() => setFeedback(null), 3000);
    }
  }, [gameState?.logs]);

  // ---------------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------------
  const createRoom = async () => {
    if (!playerName) return setError("Enter Name");
    localStorage.setItem("gameHub_playerName", playerName); localStorage.setItem("lucky7_playerName", playerName); setLoading(true);
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const initialData = {
      roomId: newId, hostId: user.uid, status: "lobby",
      players: [{ id: user.uid, name: playerName, colorIdx: 0, score: 0, activeCards: [], status: "PLAYING", forcedFlips: 0 }],
      deck: [], discardPile: [], turnIndex: 0, turnPhase: "PLAYING", pendingAction: null, logs: []
    };
    try {
      await setDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId), initialData);
      setRoomId(newId); localStorage.setItem("lucky7_roomId", newId);
    } catch (e) { setError("Failed to create game."); }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCode || !playerName) return setError("Enter details");
    localStorage.setItem("gameHub_playerName", playerName); localStorage.setItem("lucky7_playerName", playerName); setLoading(true);
    try {
      const code = roomCode.toUpperCase().trim();
      const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", code);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data().status === "lobby") {
        const data = snap.data();
        if (!data.players.some((p) => p.id === user.uid)) {
          if (data.players.length >= 6) { setError("The game is full."); setLoading(false); return; }
          const newPlayers = [...data.players, { id: user.uid, name: playerName, colorIdx: data.players.length, score: 0, activeCards: [], status: "PLAYING", forcedFlips: 0 }];
          await updateDoc(ref, { players: newPlayers });
        }
        setRoomId(code); localStorage.setItem("lucky7_roomId", code);
      } else setError("Room not found or game in progress.");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const startGame = async () => {
    let deck = GENERATE_DECK();
    let players = gameState.players.map(p => ({ ...p, score: 0, activeCards: [], status: "PLAYING", forcedFlips: 0 }));
    
    players.forEach(p => {
       const cardIdx = deck.findIndex(c => c.type !== 'ACTION');
       if(cardIdx !== -1) {
           p.activeCards.push(deck.splice(cardIdx, 1)[0]);
       }
    });

    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      status: "playing", players, deck, discardPile: [], turnIndex: 0, turnPhase: "PLAYING", pendingAction: null,
      logs: arrayUnion(triggerLog("Cards dealt. Let the flipping begin!", "neutral", true, "START"))
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId).then(() => { setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }).catch(err => {
      const el = document.createElement("textarea"); el.value = roomId; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
      setIsCopied(true); setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleLeave = async () => {
    if (!roomId) return;
    try {
      const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);
      if (gameState.hostId === user.uid) await deleteDoc(ref);
      else { const newPlayers = gameState.players.filter((p) => p.id !== user.uid); await updateDoc(ref, { players: newPlayers }); }
    } catch (e) { console.log("Room gone"); }
    localStorage.removeItem("lucky7_roomId"); setRoomId(""); setView("menu"); setShowLeaveConfirm(false); setGameState(null);
  };

  const kickPlayer = async (targetId) => {
    if (!gameState || gameState.hostId !== user.uid) return;
    try {
      const newPlayers = gameState.players.filter((p) => p.id !== targetId);
      await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { players: newPlayers, logs: arrayUnion(triggerLog("A player was removed.", "warning")) });
    } catch (e) { console.error("Error kicking player:", e); }
  };

  const returnToLobby = async () => {
    if (gameState.hostId !== user.uid) return;
    const players = gameState.players.map((p) => ({ ...p, score: 0, activeCards: [], status: "PLAYING", forcedFlips: 0 }));
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      status: "lobby", players, deck: [], discardPile: [], turnIndex: 0, turnPhase: "PLAYING", pendingAction: null, logs: []
    });
  };

  // --- CORE GAMEPLAY MECHANICS ---
  const flipCard = async () => {
    const pIdx = gameState.players.findIndex(p => p.id === user.uid);
    if (gameState.turnIndex !== pIdx || gameState.turnPhase !== "PLAYING") return;

    let updates = {};
    let players = JSON.parse(JSON.stringify(gameState.players));
    let me = players[pIdx];
    let deck = [...gameState.deck];
    let discardPile = [...gameState.discardPile];
    let logs = [];

    if (deck.length === 0) {
        deck = discardPile.sort(() => Math.random() - 0.5);
        discardPile = [];
        logs.push(triggerLog("Deck reshuffled."));
    }
    if (deck.length === 0) return;

    const card = deck.pop();
    updates.turnPhase = "PLAYING";
    
    if (card.type === 'NUMBER') {
        const hasDuplicate = me.activeCards.some(c => c.type === 'NUMBER' && c.value === card.value);
        if (hasDuplicate) {
            const scIdx = me.activeCards.findIndex(c => c.value === 'SECOND_CHANCE');
            if (scIdx !== -1) {
                discardPile.push(me.activeCards.splice(scIdx, 1)[0]); 
                discardPile.push(card); 
                logs.push(triggerLog(`${me.name} used a Second Chance to survive a ${card.value}!`, "success"));
                if (me.forcedFlips > 0) me.forcedFlips--;
            } else {
                card.isBust = true;
                me.activeCards.push(card);
                me.status = "BUSTED";
                me.forcedFlips = 0;
                logs.push(triggerLog(`${me.name} busted on a ${card.value}!`, "failure", true, "BUSTED!"));
            }
        } else {
            me.activeCards.push(card);
            if (me.forcedFlips > 0) me.forcedFlips--;
            
            const uniques = new Set(me.activeCards.filter(c => c.type === 'NUMBER').map(c => c.value));
            if (uniques.size >= 7) {
                me.status = "BANKED";
                updates.turnPhase = "ROUND_END";
                logs.push(triggerLog(`${me.name} achieved a LUCKY 7!`, "important", true, "LUCKY 7!"));
            }
        }
    } else if (card.type === 'ACTION') {
        if (card.value === 'SECOND_CHANCE') {
            const anyoneNeedsIt = players.some(p => p.status === "PLAYING" && !p.activeCards.some(c => c.value === 'SECOND_CHANCE'));
            
            if (!anyoneNeedsIt) {
                 discardPile.push(card);
                 if (me.forcedFlips > 0) me.forcedFlips--;
                 logs.push(triggerLog("Everyone has a Second Chance. Discarded.", "neutral"));
            } else if (!me.activeCards.some(c => c.value === 'SECOND_CHANCE')) {
                 me.activeCards.push(card);
                 if (me.forcedFlips > 0) me.forcedFlips--;
                 logs.push(triggerLog(`${me.name} found a Second Chance.`, "neutral"));
            } else {
                 updates.pendingAction = { card, sourceId: me.id };
                 updates.turnPhase = "ACTION_TARGET";
                 logs.push(triggerLog(`${me.name} must pass the Second Chance to another player.`, "warning"));
            }
        } else {
            updates.pendingAction = { card, sourceId: me.id };
            updates.turnPhase = "ACTION_TARGET";
            logs.push(triggerLog(`${me.name} must target a player with ${card.value.replace('_', ' ')}.`, "warning"));
        }
    } else if (card.type === 'MODIFIER') {
        me.activeCards.push(card);
        if (me.forcedFlips > 0) me.forcedFlips--;
        logs.push(triggerLog(`${me.name} flipped a ${card.value} modifier.`, "neutral"));
    }

    if (updates.turnPhase !== "ACTION_TARGET" && updates.turnPhase !== "ROUND_END") {
        const activeCount = players.filter(p => p.status === "PLAYING").length;
        if (activeCount === 0) {
            updates.turnPhase = "ROUND_END";
        } else if (me.forcedFlips > 0 && me.status === "PLAYING") {
            updates.turnIndex = pIdx;
        } else {
            updates.turnIndex = getNextActivePlayer(players, pIdx);
        }
    }

    updates.players = players;
    updates.deck = deck;
    updates.discardPile = discardPile;
    updates.logs = arrayUnion(...logs);
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
  };

  const resolveAction = async (targetId) => {
    const pIdx = gameState.players.findIndex((p) => p.id === user.uid);
    if (gameState.turnPhase !== "ACTION_TARGET" || gameState.turnIndex !== pIdx) return;
    
    let players = JSON.parse(JSON.stringify(gameState.players));
    let me = players[pIdx];
    let target = players.find(p => p.id === targetId);
    let discardPile = [...gameState.discardPile];
    let actionCard = gameState.pendingAction.card;
    let logs = [];

    if (target.status !== "PLAYING") return alert("You can only target players who are still playing.");

    // Decrement the forced flip for drawing the action card FIRST
    if (me.forcedFlips > 0 && actionCard.type === 'ACTION') me.forcedFlips--;

    if (actionCard.value === 'FREEZE') {
        target.status = "BANKED";
        target.forcedFlips = 0;
        logs.push(triggerLog(`${me.name} froze ${target.name}!`, "failure"));
        discardPile.push(actionCard);
    } else if (actionCard.value === 'FLIP3') {
        target.forcedFlips += 3;
        logs.push(triggerLog(`${me.name} forced ${target.name} to Flip 3!`, "warning"));
        discardPile.push(actionCard);
    } else if (actionCard.value === 'SECOND_CHANCE') {
        if (target.activeCards.some(c => c.value === 'SECOND_CHANCE')) return alert("That player already has a Second Chance!");
        target.activeCards.push(actionCard);
        logs.push(triggerLog(`${me.name} gave ${target.name} a Second Chance!`, "success"));
    }

    let updates = { pendingAction: null, turnPhase: "PLAYING" };
    
    const activeCount = players.filter(p => p.status === "PLAYING").length;
    if (activeCount === 0) {
        updates.turnPhase = "ROUND_END";
    } else {
        if (actionCard.value === 'FLIP3' && target.status === "PLAYING") {
            updates.turnIndex = players.findIndex(p => p.id === targetId);
        } else if (me.forcedFlips > 0 && me.status === "PLAYING") {
            updates.turnIndex = pIdx;
        } else {
            updates.turnIndex = getNextActivePlayer(players, pIdx);
        }
    }

    updates.players = players;
    updates.discardPile = discardPile;
    updates.logs = arrayUnion(...logs);
    
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
  };

  const bankScore = async () => {
    const pIdx = gameState.players.findIndex(p => p.id === user.uid);
    if (gameState.turnIndex !== pIdx || gameState.turnPhase !== "PLAYING" || gameState.players[pIdx].forcedFlips > 0) return;

    let players = JSON.parse(JSON.stringify(gameState.players));
    players[pIdx].status = "BANKED";
    
    let updates = { players, turnPhase: "PLAYING" };
    const activeCount = players.filter(p => p.status === "PLAYING").length;
    
    if (activeCount === 0) {
        updates.turnPhase = "ROUND_END";
    } else {
        updates.turnIndex = getNextActivePlayer(players, pIdx);
    }

    updates.logs = arrayUnion(triggerLog(`${players[pIdx].name} decided to bank.`, "neutral"));
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
  };

  const hostScoreRound = async () => {
    if (gameState.hostId !== user.uid || gameState.turnPhase !== "ROUND_END") return;

    let players = JSON.parse(JSON.stringify(gameState.players));
    let discardPile = [...gameState.discardPile];
    let deck = [...gameState.deck];
    let logs = [triggerLog("Scoring complete. Dealing new round.", "neutral")];
    let gameWinner = null;

    players.forEach(p => {
       if (p.status === "BANKED") {
          let sum = 0;
          let multi = 1;
          const numbers = (p.activeCards || []).filter(c => c.type === 'NUMBER').map(c => c.value);
          const uniques = new Set(numbers);
          const isFlip7 = uniques.size >= 7;

          (p.activeCards || []).forEach(c => {
              if (c.type === 'NUMBER') sum += c.value;
              if (c.type === 'MODIFIER') {
                  if (c.value === 'x2') multi *= 2;
                  else sum += parseInt(c.value.replace('+', ''));
              }
          });

          let earned = (sum * multi) + (isFlip7 ? 15 : 0);
          p.score += earned;
       }
       
       (p.activeCards || []).forEach(c => { delete c.isBust; discardPile.push(c); });
       p.activeCards = [];
       p.status = "PLAYING";
       p.forcedFlips = 0;
       
       if (p.score >= 200) gameWinner = p;
    });

    if (deck.length < players.length) {
       deck = [...deck, ...discardPile].sort(() => Math.random() - 0.5);
       discardPile = [];
    }
    players.forEach(p => {
       const cardIdx = deck.findIndex(c => c.type !== 'ACTION');
       if (cardIdx !== -1) p.activeCards.push(deck.splice(cardIdx, 1)[0]);
    });

    let updates = {
       players, discardPile, deck, turnPhase: "PLAYING",
       turnIndex: (gameState.turnIndex + 1) % players.length
    };

    if (gameWinner) updates.status = "finished";

    updates.logs = arrayUnion(...logs);
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
  };


  // ---------------------------------------------------------------------------
  // RENDER LOGIC
  // ---------------------------------------------------------------------------
  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <GlobalStyles/>
        <DarkAtmosphere/>
        <GameLogoBig />
        <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10 mb-8">
          <Zap className="text-cyan-500 animate-pulse-cyan" size={48}/>
        </div>
        <div className="bg-cyan-900/10 p-6 sm:p-8 rounded-2xl border border-cyan-900/30 max-w-sm w-full">
          <Hammer className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-500 mx-auto mb-4 animate-bounce"/>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Deck is Shuffling</h1>
          <p className="text-sm sm:text-base text-zinc-400">Maintenance is currently underway. Return soon.</p>
        </div>
        <div className="h-8"></div>
        <a href={import.meta.env.BASE_URL}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-center pb-12 animate-pulse">
              <div className="inline-flex items-center gap-2 sm:gap-3 px-6 py-3 sm:px-8 sm:py-4 bg-zinc-900/50 rounded-full border border-cyan-900/20 text-cyan-300 font-bold tracking-widest text-xs sm:text-sm uppercase backdrop-blur-sm"><StepBack size={16}/> Return to Gamehub <StepBack size={16}/></div>
            </div>
          </div>
        </a>
        <GameLogo />
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-cyan-500 animate-pulse font-mono tracking-widest text-sm sm:text-base">Connecting...</div>;
  }

  if (view === "splash") return <SplashScreen onStart={handleSplashStart}/>;

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
        <GlobalStyles/>
        <DarkAtmosphere/>
        <nav className="absolute top-0 left-0 w-full p-4 z-50">
          <a href={import.meta.env.BASE_URL} className="flex items-center gap-2 text-cyan-800 rounded-lg font-bold shadow-md hover:text-cyan-400 transition-colors w-fit animate-pulse text-sm sm:text-base"><StepBack className="w-4 h-4 sm:w-6 sm:h-6"/><span>Back to Gamehub</span></a>
        </nav>
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
        <div className="z-10 text-center mb-8 sm:mb-10 mt-8">
          <Zap className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-500 mx-auto mb-4"/>
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 tracking-tighter drop-shadow-md italic">LUCKY 7</h1>
          <p className="text-cyan-200/40 tracking-[0.3em] sm:tracking-[0.5em] uppercase mt-2 text-[10px] sm:text-xs font-bold">Flip. Risk. Bank.</p>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl z-10 relative">
          {error && <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-3 mb-4 rounded text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2"><AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5"/> {error}</div>}
          <div className="space-y-4">
            <input className="w-full bg-black/50 border border-cyan-900/50 focus:border-cyan-400 p-3 sm:p-4 rounded-xl text-white outline-none transition-all text-base sm:text-lg font-bold text-center shadow-inner" placeholder="YOUR NAME" value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={12} />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={createRoom} disabled={loading} className="bg-gradient-to-br from-cyan-500 to-blue-700 hover:from-cyan-400 hover:to-blue-600 p-3 sm:p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-300/30"><Zap className="w-5 h-5 sm:w-6 sm:h-6"/> <span className="text-sm sm:text-base">Create</span></button>
              <div className="flex flex-col gap-2">
                <input className="bg-black/50 border border-cyan-900/50 focus:border-cyan-400 p-2 rounded-xl text-white text-center uppercase font-mono font-bold tracking-widest outline-none h-10 sm:h-12 text-sm sm:text-base shadow-inner" placeholder="CODE" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} maxLength={6} />
                <button onClick={joinRoom} disabled={loading} className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-xl font-bold text-zinc-300 transition-all active:scale-95 h-full text-sm sm:text-base border border-white/5">Join</button>
              </div>
            </div>
            <button onClick={() => setShowGuide(true)} className="w-full mt-4 text-cyan-500 hover:text-cyan-400 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors py-2"><BookOpen className="w-4 h-4 sm:w-5 sm:h-5"/> How to Play</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    const canStart = gameState.players.length >= 2 && gameState.players.length <= 6;
    
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 relative">
        <GlobalStyles/>
        <DarkAtmosphere/>
        <GameLogoBig />
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
        <div className="z-10 w-full max-w-lg bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-8 mt-6">
          <div className="flex justify-between items-center mb-6 sm:mb-8 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-base sm:text-xl flex items-center gap-2 text-cyan-400 font-black uppercase tracking-widest"><Earth className="w-5 h-5 sm:w-6 sm:h-6"/> Table Code</h2>
              <div className="flex items-center gap-2 sm:gap-3 mt-1">
                <div className="text-2xl sm:text-4xl font-mono text-white font-black drop-shadow-md">{roomId}</div>
                <div className="relative">
                  <button onClick={copyToClipboard} className="p-2 bg-white/5 hover:bg-white/20 rounded-full transition-colors text-zinc-300 hover:text-white border border-white/10">{isCopied ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400"/> : <Copy className="w-4 h-4 sm:w-5 sm:h-5"/>}</button>
                  {isCopied && <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-cyan-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded shadow-[0_0_10px_rgba(6,182,212,0.5)] animate-fade-in-up whitespace-nowrap">Copied!</div>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowLeaveConfirm(true)} className="p-2 bg-white/5 hover:bg-rose-900/50 rounded-full text-rose-400 transition-colors border border-white/10"><LogOut className="w-5 h-5 sm:w-6 sm:h-6"/></button>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
            <h3 className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2"><User size={14}/> Players ({gameState.players.length}/6)</h3>
            {gameState.players.map((p) => (
              <div key={p.id} className="flex justify-between items-center bg-black/30 p-3 sm:p-4 rounded-xl border border-white/5 shadow-inner">
                <span className="font-bold flex items-center gap-2 sm:gap-3 text-sm sm:text-lg">
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${PLAYER_COLORS[p.colorIdx].bg} ${PLAYER_COLORS[p.colorIdx].glow}`} /> {p.name} {p.id === gameState.hostId && <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.6)]"/>}
                </span>
                {gameState.hostId === user.uid && p.id !== user.uid && (
                  <button onClick={() => kickPlayer(p.id)} className="p-1.5 sm:p-2 bg-rose-900/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition-colors border border-rose-900/50" title="Kick Player"><Trash2 className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                )}
              </div>
            ))}
            {Array.from({ length: 6 - gameState.players.length }).map((_, i) => <div key={i} className="border-2 border-dashed border-white/5 rounded-xl p-3 sm:p-4 flex items-center justify-center text-zinc-600 font-bold uppercase text-xs sm:text-sm bg-black/10">Empty Slot</div>)}
          </div>

          {isHost ? (
            <div className="flex flex-col gap-2 mt-4">
              <button onClick={startGame} disabled={!canStart} className="w-full flex justify-center items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-black tracking-widest text-base sm:text-lg transition-all bg-gradient-to-br from-cyan-500 to-blue-700 text-white hover:from-cyan-400 hover:to-blue-600 hover:scale-[1.02] shadow-[0_0_25px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:hover:scale-100 border border-cyan-300/30"><Zap className="w-5 h-5 sm:w-6 sm:h-6"/> Deal Cards</button>
              {!canStart && <div className="text-center text-[10px] sm:text-xs font-bold text-cyan-500 uppercase tracking-wider mt-1">Requires 2 to 6 players to start</div>}
            </div>
          ) : <div className="text-center text-zinc-400 text-xs sm:text-sm font-bold uppercase tracking-widest animate-pulse border border-white/5 bg-black/30 py-4 rounded-xl">Waiting for host...</div>}
        </div>

        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl max-w-xs w-full text-center shadow-2xl">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase">Leave Table?</h3>
              <p className="text-zinc-400 mb-6 text-xs sm:text-sm">{gameState.hostId === user.uid ? "As Host, leaving ends the game for everyone." : "You will disconnect from this session."}</p>
              <div className="flex gap-2">
                <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold text-zinc-300 text-sm sm:text-base transition-colors">Stay</button>
                <button onClick={handleLeave} className="flex-1 bg-rose-600 hover:bg-rose-500 py-3 rounded-xl font-bold text-white text-sm sm:text-base transition-colors shadow-[0_0_15px_rgba(225,29,72,0.4)]">Leave</button>
              </div>
            </div>
          </div>
        )}
        <GameLogo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const meIdx = gameState.players.findIndex((p) => p.id === user.uid);
    const me = gameState.players[meIdx];
    const isMyTurn = gameState.turnIndex === meIdx;
    const activePlayer = gameState.players[gameState.turnIndex];
    const isTargetPhase = gameState.turnPhase === "ACTION_TARGET" && isMyTurn;

    return (
      <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col overflow-hidden font-sans select-none">
        <GlobalStyles/>
        <DarkAtmosphere/>

        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl max-w-xs w-full text-center shadow-2xl">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase">Abandon Game?</h3>
              <p className="text-zinc-400 mb-6 text-xs sm:text-sm">{gameState.hostId === user.uid ? "Leaving deletes the game for everyone." : "You will leave this ongoing game."}</p>
              <div className="flex gap-2">
                <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold text-zinc-300 text-sm sm:text-base transition-colors">Stay</button>
                <button onClick={handleLeave} className="flex-1 bg-rose-600 hover:bg-rose-500 py-3 rounded-xl font-bold text-white text-sm sm:text-base transition-colors shadow-[0_0_15px_rgba(225,29,72,0.4)]">Leave</button>
              </div>
              {gameState.hostId === user.uid && <button onClick={() => { returnToLobby(); setShowLeaveConfirm(false); }} className="w-full bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold text-rose-400 mt-2 text-xs sm:text-sm border border-white/5 transition-colors">Return All to Lobby</button>}
            </div>
          </div>
        )}

        {feedback && <FeedbackOverlay icon={feedback.icon} message={feedback.message} subtext={feedback.subtext} type={feedback.type}/>}
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
        {showScoreboard && <ScoreboardModal gameState={gameState} onClose={() => setShowScoreboard(false)} />}

        {/* TOP BAR */}
        <div className="h-14 sm:h-16 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-2 z-[160] shrink-0 shadow-lg relative">
          <div className="flex items-center gap-3 sm:gap-4 relative z-10">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-400/50 ml-1 sm:ml-2 shadow-[0_0_15px_rgba(34,211,238,0.3)]"><Zap className="text-cyan-400 w-4 h-4 sm:w-5 sm:h-5"/></div>
            <div>
              <div className="font-black text-xs sm:text-sm tracking-widest text-white drop-shadow-md">LUCKY 7</div>
              <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">
                {gameState.status === "finished" ? <span className="text-amber-400">GAME OVER</span> : 
                 <><span className="text-zinc-400">Turn:</span> <span className="text-cyan-400">{activePlayer?.name}</span></>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 relative z-10">
            <button onClick={() => setShowScoreboard(true)} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full text-amber-400 hover:text-white transition-colors"><BarChart2 className="w-4 h-4 sm:w-5 sm:h-5"/></button>
            <button onClick={() => setShowGuide(true)} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full text-zinc-300 hover:text-white transition-colors"><BookOpen className="w-4 h-4 sm:w-5 sm:h-5"/></button>
            <button onClick={() => setShowLogs(!showLogs)} className={`p-1.5 sm:p-2 rounded-full transition-colors ${showLogs ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-300 hover:bg-white/10"}`}><History className="w-4 h-4 sm:w-5 sm:h-5"/></button>
            <button onClick={() => setShowLeaveConfirm(true)} className="p-1.5 sm:p-2 hover:bg-rose-900/50 rounded-full text-rose-400 transition-colors ml-1"><LogOut className="w-4 h-4 sm:w-5 sm:h-5"/></button>
          </div>
        </div>

        {/* LOGS OVERLAY */}
        {showLogs && (
          <div className="fixed top-14 sm:top-16 right-2 sm:right-4 w-56 sm:w-64 max-h-56 sm:max-h-60 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl z-[155] overflow-y-auto p-2 shadow-2xl custom-scrollbar">
            <h4 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest mb-2 sticky top-0 bg-slate-900/95 py-1 sm:py-2 border-b border-white/5">World History</h4>
            <div className="space-y-2 mt-2">
              {gameState.logs.slice().reverse().map((log) => (
                <div key={log.id} className={`text-[10px] sm:text-xs p-2.5 rounded-xl border-l-4 font-bold ${log.type === "success" ? "border-emerald-400 bg-emerald-900/20 text-emerald-100" : log.type === "warning" ? "border-amber-400 bg-amber-900/20 text-amber-100" : log.type === "failure" ? "border-rose-400 bg-rose-900/20 text-rose-100" : "border-zinc-500 bg-black/30 text-zinc-300"}`}>
                  {log.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOP SCORES BANNER */}
        <div className="w-full bg-black/40 border-b border-white/5 flex overflow-x-auto custom-scrollbar py-2 px-2 gap-2 shadow-inner">
           {gameState.players.map(p => (
              <div key={p.id} className={`flex items-center gap-2 px-3 py-1 rounded-full border ${p.id === activePlayer?.id ? 'bg-cyan-900/50 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'bg-zinc-900 border-white/10'} shrink-0 transition-all`}>
                 <div className={`w-2 h-2 rounded-full ${PLAYER_COLORS[p.colorIdx].bg} ${PLAYER_COLORS[p.colorIdx].glow}`} />
                 <span className="text-xs font-bold text-white truncate max-w-[80px]">{p.name}</span>
                 <span className="text-xs font-black text-amber-400 drop-shadow-md">{p.score}</span>
              </div>
           ))}
        </div>

        {/* CENTRAL AREA - PLAYERS MATS GRID */}
        <div className="flex-1 relative bg-transparent overflow-y-auto custom-scrollbar flex flex-col pt-4 pb-56 sm:pb-64">
          
          <div className="flex flex-wrap justify-center items-start gap-4 w-full max-w-6xl mx-auto px-2 sm:px-4 mt-2">
             {gameState.players.map((p, idx) => {
                const color = PLAYER_COLORS[p.colorIdx];
                const isActive = p.status === "PLAYING";
                const isTargetable = isTargetPhase && isActive;
                const pScore = calculateTurnScore(p.activeCards);

                return (
                  <div 
                     key={p.id}
                     onClick={() => { if(isTargetable) resolveAction(p.id); }}
                     className={`relative w-full sm:w-[48%] lg:w-[31%] rounded-3xl border-2 p-3 sm:p-4 flex flex-col transition-all duration-300 overflow-hidden
                       ${isTargetable ? "cursor-pointer hover:scale-105 hover:border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.4)] z-40 bg-slate-800" : ""}
                       ${gameState.turnIndex === idx && !isTargetable ? `border-${color.border.split('-')[1]}-400 ${color.glow} z-20 bg-slate-800` : (!isTargetable ? "border-white/10 bg-slate-900/60" : "")}
                       ${!isActive ? "opacity-50 grayscale hover:grayscale-0 transition-all" : ""}
                     `}
                  >
                     {/* Glass Header */}
                     <div className={`absolute top-0 left-0 right-0 h-14 ${color.matBg} backdrop-blur-md border-b border-white/5`}></div>

                     {/* Header Content */}
                     <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 shadow-inner">
                           <div className={`w-3 h-3 rounded-full ${color.bg} ${color.glow}`} />
                           <span className={`font-black uppercase tracking-widest text-xs sm:text-sm drop-shadow-md ${color.text}`}>{p.name}</span>
                        </div>
                        <div className="flex flex-col items-end bg-black/40 px-3 py-1 rounded-xl border border-white/10">
                           <span className="text-2xl font-black text-white leading-none drop-shadow-md">{pScore}</span>
                           <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest">Turn Score</span>
                        </div>
                     </div>

                     {/* Badges */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
                        {p.status === "BUSTED" && <div className="bg-rose-900/90 backdrop-blur-sm text-rose-200 border-2 border-rose-500 px-6 py-2 rounded-2xl font-black text-3xl uppercase transform -rotate-12 shadow-[0_0_30px_rgba(225,29,72,0.6)]">Busted</div>}
                        {p.status === "BANKED" && <div className="bg-amber-900/90 backdrop-blur-sm text-amber-200 border-2 border-amber-500 px-6 py-2 rounded-2xl font-black text-3xl uppercase transform -rotate-12 shadow-[0_0_30px_rgba(245,158,11,0.6)]">Banked</div>}
                     </div>

                     {/* Cards Array (Horizontal Scroll) */}
                     <div className="flex gap-2 sm:gap-3 overflow-x-auto custom-scrollbar pb-2 items-center relative z-10 min-h-[100px]">
                        {(p.activeCards || []).map((c, i) => (
                           <GameCard key={i} card={c} size="sm" isBust={c.isBust} />
                        ))}
                        {(!p.activeCards || p.activeCards.length === 0) && isActive && (
                           <div className="w-14 h-20 sm:w-16 sm:h-24 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-zinc-500 text-[10px] font-black uppercase tracking-widest bg-black/20">Empty</div>
                        )}
                     </div>

                     {/* Forced Flips Indicator */}
                     {p.forcedFlips > 0 && (
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-rose-600 border-2 border-rose-400 text-white text-[10px] font-black px-4 py-1.5 rounded-full animate-bounce shadow-[0_0_15px_rgba(225,29,72,0.6)] whitespace-nowrap z-50">
                           Must Flip: {p.forcedFlips}
                        </div>
                     )}
                  </div>
                )
             })}
          </div>
        </div>

        {/* BOTTOM UI CONTROLS */}
        {gameState.status !== "finished" && (
          <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 flex flex-col z-[60] shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 bg-black/30 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 rounded-full uppercase drop-shadow-md">Score: {me?.score || 0}</span>
              </div>
              <div className="text-[10px] sm:text-xs font-black text-zinc-300 bg-white/5 border border-white/10 px-3 py-0.5 rounded-full uppercase tracking-widest">
                 Deck: {gameState.deck.length}
              </div>
            </div>

            <div className="flex flex-col p-4 gap-4 justify-center items-center w-full max-w-3xl mx-auto">
                {isMyTurn ? (
                    <>
                      {gameState.turnPhase === "PLAYING" ? (
                         <div className="flex gap-4 w-full">
                            <button onClick={flipCard} className="flex-1 bg-gradient-to-br from-cyan-500 to-blue-700 hover:from-cyan-400 hover:to-blue-600 border border-cyan-300/50 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all animate-pulse-cyan text-sm sm:text-xl">FLIP CARD</button>
                            <button onClick={bankScore} disabled={me.forcedFlips > 0 || (me.activeCards || []).length === 0} className="flex-1 bg-gradient-to-br from-amber-500 to-orange-700 hover:from-amber-400 hover:to-orange-600 disabled:from-zinc-800 disabled:to-zinc-900 disabled:border-zinc-700 disabled:text-zinc-600 disabled:shadow-none border border-amber-300/50 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all text-sm sm:text-xl">BANK SCORE</button>
                         </div>
                      ) : gameState.turnPhase === "ACTION_TARGET" ? (
                         <div className="flex flex-row items-center justify-center gap-3 w-full p-2 sm:p-4 border border-rose-400/50 rounded-2xl bg-gradient-to-r from-rose-900/30 via-fuchsia-900/30 to-rose-900/30 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                            <div className="shrink-0 animate-bounce">
                               <GameCard card={gameState.pendingAction?.card} size="sm" />
                            </div>
                            <div className="flex flex-col text-left">
                               <span className="text-rose-400 text-sm sm:text-2xl font-black uppercase tracking-widest leading-none drop-shadow-md">Action Required</span>
                               <span className="text-white text-[10px] sm:text-sm font-bold uppercase mt-1 opacity-90 tracking-wide leading-tight">Target a player above to use<br className="sm:hidden"/> {gameState.pendingAction?.card?.value?.replace('_', ' ')}</span>
                            </div>
                         </div>
                      ) : (
                         <div className="w-full text-center text-zinc-500 text-xs font-bold uppercase tracking-widest py-5 border border-white/5 rounded-2xl bg-black/20">Please Wait...</div>
                      )}
                    </>
                ) : (
                    <>
                      {gameState.turnPhase === "ACTION_TARGET" ? (
                         <div className="w-full flex flex-row items-center justify-center gap-3 py-2 sm:py-4 border border-white/10 rounded-2xl bg-black/40 shadow-inner">
                             <div className="shrink-0">
                                <GameCard card={gameState.pendingAction?.card} size="sm" />
                             </div>
                             <div className="flex flex-col text-left">
                                <span className="text-zinc-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-tight">Waiting for {activePlayer?.name}</span>
                                <span className="text-rose-400 text-xs sm:text-sm font-black uppercase drop-shadow-md leading-tight">To use {gameState.pendingAction?.card?.value?.replace('_', ' ')}</span>
                             </div>
                         </div>
                      ) : (
                         <div className="w-full text-center text-zinc-400 text-xs sm:text-sm font-black uppercase tracking-widest py-5 border border-white/5 rounded-2xl bg-black/20 shadow-inner">
                             Waiting for {activePlayer?.name}
                         </div>
                      )}
                    </>
                )}
            </div>
            
            {/* Host End Round Control */}
            {gameState.turnPhase === "ROUND_END" && gameState.hostId === user.uid && (
                <div className="px-4 pb-4 w-full max-w-2xl mx-auto">
                    <button onClick={hostScoreRound} className="w-full bg-gradient-to-br from-emerald-500 to-teal-700 hover:from-emerald-400 hover:to-teal-600 border border-emerald-300/50 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all animate-bounce text-sm sm:text-lg">Score Round & Deal</button>
                </div>
            )}
          </div>
        )}

        {/* END GAME MODAL */}
        {gameState.status === "finished" && (
          <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-xl flex items-center justify-center pt-16 sm:pt-20 pb-10 px-4">
            <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-cyan-500/50 text-center shadow-[0_0_80px_rgba(6,182,212,0.3)] animate-in zoom-in max-w-lg w-full flex flex-col relative max-h-[90vh]">
              <div className="shrink-0 mb-4 sm:mb-6">
                <Crown className="w-20 h-20 sm:w-24 sm:h-24 text-yellow-400 mx-auto mb-2 sm:mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]"/>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 uppercase mb-1 sm:mb-2 leading-tight drop-shadow-xl truncate px-2">
                  {gameState.players.slice().sort((a,b)=>b.score - a.score)[0]?.name}
                </h2>
                <p className="text-cyan-400 font-black tracking-[0.3em] text-xs sm:text-sm uppercase drop-shadow-md">Ultimate Flipper</p>
              </div>
              
              <div className="space-y-3 mb-6 sm:mb-8 overflow-y-auto custom-scrollbar flex-1 px-1">
                 {gameState.players.slice().sort((a,b)=>b.score - a.score).map((p, i) => (
                    <div key={p.id} className={`flex justify-between items-center px-4 sm:px-6 py-3 rounded-2xl border ${i===0 ? "bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "bg-black/40 border-white/5 shadow-inner"}`}>
                        <span className="font-black text-white text-base sm:text-xl tracking-wide truncate mr-2 drop-shadow-md">{i+1}. {p.name}</span>
                        <span className="font-black text-yellow-400 text-lg sm:text-2xl shrink-0 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{p.score} pt</span>
                    </div>
                 ))}
              </div>

              {gameState.hostId === user.uid ? (
                <div className="shrink-0 pt-2">
                  <button onClick={returnToLobby} className="bg-gradient-to-br from-cyan-500 to-blue-700 hover:from-cyan-400 hover:to-blue-600 border border-cyan-300/50 px-4 sm:px-6 py-4 rounded-2xl font-black w-full text-white transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] text-sm sm:text-base">Play Again</button>
                </div>
              ) : (
                <div className="shrink-0 pt-2">
                  <button disabled className="bg-zinc-800 border border-white/5 px-4 sm:px-6 py-4 rounded-2xl font-black w-full text-zinc-500 uppercase tracking-widest text-sm sm:text-base shadow-inner">Waiting for Host...</button>
                </div>
              )}
            </div>
          </div>
        )}
        <GameLogo />
      </div>
    );
  }

  return null;
}