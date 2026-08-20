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
  Sparkles, Earth, Eye, Star, Image as ImageIcon, ArrowLeft, Loader
} from "lucide-react";
import CoverImage from "./assets/dixit.png";

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

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "reverie-game";
const GAME_ID = "reverie";

// ---------------------------------------------------------------------------
// STYLES & VISUALS
// ---------------------------------------------------------------------------
const GlobalStyles = () => (
  <style>{`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(168, 85, 247, 0.4); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(168, 85, 247, 0.8); }
    
    @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(2deg); } }
    .animate-float { animation: float infinite ease-in-out; }
    
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-spin-slow { animation: spin-slow 20s linear infinite; }
    
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    @keyframes pulse-purple {
      0%, 100% { box-shadow: 0 0 15px rgba(168, 85, 247, 0.2); }
      50% { box-shadow: 0 0 30px rgba(168, 85, 247, 0.5); }
    }
    .animate-pulse-purple { animation: pulse-purple 3s ease-in-out infinite; }
  `}</style>
);

const FloatingBackground = React.memo(() => {
  const backgroundIcons = React.useMemo(() => {
    const icons = [Sparkles, Eye, Crown];
    return [...Array(10)].map((_, i) => {
      const Icon = icons[i % icons.length];
      return (
        <div
          key={i}
          className="absolute animate-float text-fuchsia-900/10"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${15 + Math.random() * 20}s`,
            transform: `scale(${0.6 + Math.random()})`,
          }}
        >
          <Icon size={48} />
        </div>
      );
    });
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black" />
      <div className="absolute top-0 left-0 w-full h-full opacity-40">
        {backgroundIcons}
      </div>
    </div>
  );
});

const GameLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Sparkles size={12} className="text-fuchsia-500" />
    <span className="text-[10px] font-black tracking-widest text-fuchsia-400 uppercase">
      REVERIE
    </span>
  </div>
);

const GameLogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Sparkles size={20} className="text-fuchsia-500" />
    <span className="text-[20px] font-black tracking-widest text-fuchsia-500 uppercase">
      REVERIE
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// GAME LOGIC HELPERS & DECK MANAGEMENT
// ---------------------------------------------------------------------------
const PLAYER_COLORS = [
  { bg: "bg-fuchsia-600", border: "border-fuchsia-500", fill: "#d946ef", text: "text-fuchsia-400" },
  { bg: "bg-cyan-600", border: "border-cyan-500", fill: "#06b6d4", text: "text-cyan-400" },
  { bg: "bg-amber-500", border: "border-amber-400", fill: "#f59e0b", text: "text-amber-300" },
  { bg: "bg-emerald-500", border: "border-emerald-400", fill: "#10b981", text: "text-emerald-300" },
  { bg: "bg-rose-500", border: "border-rose-400", fill: "#f43f5e", text: "text-rose-300" },
  { bg: "bg-indigo-500", border: "border-indigo-400", fill: "#6366f1", text: "text-indigo-300" },
];

// AUTOMATIC IMAGE IMPORTER
const cardModules = import.meta.glob('/src/reverie/assets/cards/*/*.{png,jpg,jpeg,webp,gif}', { 
  eager: true, 
  query: '?url',
  import: 'default'
});

const AVAILABLE_PACKS = {};
Object.entries(cardModules).forEach(([path, imgUrl]) => {
  const parts = path.split('/');
  let packName = parts[parts.length - 2]; 
  if (packName === "cards") packName = "Core";

  if (!AVAILABLE_PACKS[packName]) AVAILABLE_PACKS[packName] = [];
  AVAILABLE_PACKS[packName].push({
    id: `card_${packName}_${AVAILABLE_PACKS[packName].length}_${Math.random().toString(36).substr(2, 5)}`,
    image: imgUrl
  });
});

const GENERATE_DECK = (selectedPackNames = []) => {
  let deck = [];
  if (selectedPackNames.length === 0) {
    selectedPackNames = Object.keys(AVAILABLE_PACKS).slice(0, 3);
  }

  selectedPackNames.forEach(packName => {
    if (AVAILABLE_PACKS[packName]) {
      deck = [...deck, ...AVAILABLE_PACKS[packName]];
    }
  });

  if (deck.length === 0) {
    deck = Array(50).fill("").map((_, i) => ({ id: `fallback_${i}`, image: "" }));
  }

  return deck.sort(() => Math.random() - 0.5); 
};

// RESPONSIVE DREAM CARD COMPONENT
const DreamCard = ({ 
  card, 
  size = "md", 
  isFaceDown = false, 
  isSelected = false, 
  isOwnCard = false,
  onClick, 
  disabled = false, 
  votedBy = [],
  onPressStart,
  onPressEnd,
  onPressCancel 
}) => {
  const sizeClasses = 
    size === "sm" ? "w-12 h-16 sm:w-16 sm:h-24 border sm:border-2" : 
    size === "lg" ? "w-24 h-36 sm:w-40 sm:h-60 border-2 sm:border-4" : 
    size === "xl" ? "w-36 h-52 sm:w-48 sm:h-72 border-4" : 
    "w-20 h-28 sm:w-28 sm:h-[168px] border-2 sm:border-[3px]";

  if (!card || isFaceDown) {
    return (
      <div 
        onClick={onClick}
        className={`${sizeClasses} rounded-xl flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 to-slate-900 border-indigo-700/50 opacity-90 shadow-xl transition-all ${disabled ? "cursor-not-allowed" : "cursor-pointer hover:-translate-y-1 hover:shadow-indigo-500/20"}`}
      >
        <Sparkles className="text-indigo-400 opacity-20 w-1/3 h-1/3" />
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      onMouseDown={() => onPressStart && onPressStart(card)}
      onMouseUp={() => onPressEnd && onPressEnd()}
      onMouseLeave={() => onPressEnd && onPressEnd()}
      onTouchStart={() => onPressStart && onPressStart(card)}
      onTouchEnd={() => onPressEnd && onPressEnd()}
      onTouchMove={() => onPressCancel && onPressCancel()}
      className={`${sizeClasses} relative rounded-xl bg-cover bg-center border-white/10 bg-slate-800 transition-all duration-300 overflow-hidden select-none
        ${disabled && !isOwnCard ? "cursor-not-allowed opacity-80" : "cursor-pointer"}
        ${!disabled && !isSelected ? "hover:-translate-y-2 hover:shadow-[0_10px_20px_rgba(255,255,255,0.15)] hover:border-white/30" : ""}
        ${isSelected ? "ring-2 sm:ring-[3px] ring-cyan-400 -translate-y-2 sm:-translate-y-4 shadow-[0_0_25px_rgba(6,182,212,0.6)] z-20 scale-105" : "shadow-xl"}
        ${isOwnCard ? "ring-2 sm:ring-[3px] ring-fuchsia-600 shadow-[0_0_25px_rgba(217,70,239,0.5)] border-fuchsia-400" : ""}
      `}
      style={{ backgroundImage: card.image ? `url(${card.image})` : undefined }}
    >
      <div className="absolute inset-0 bg-black/5 hover:bg-transparent transition-colors duration-500 mix-blend-overlay"></div>
      
      {/* Voted By Badges */}
      {votedBy.length > 0 && (
        <div className="absolute bottom-1 sm:bottom-2 left-0 right-0 flex justify-center gap-1 sm:gap-1.5 z-20 flex-wrap px-1">
          {votedBy.map((p, i) => (
            <div 
              key={i} 
              className={`w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full border-2 border-white shadow-[0_3px_8px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.4)] backdrop-blur-md ${PLAYER_COLORS[p.colorIdx].bg}`} 
              title={p.name} 
            />
          ))}
        </div>
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
        "bg-fuchsia-900/90 border-fuchsia-500 text-fuchsia-100"
      }`}
    >
      {Icon && <div className="mb-4 p-3 sm:p-4 bg-black/20 rounded-full"><Icon className="w-10 h-10 sm:w-16 sm:h-16 animate-bounce" /></div>}
      <h2 className="text-2xl sm:text-5xl font-black uppercase tracking-widest drop-shadow-md mb-2 leading-tight">{message}</h2>
      {subtext && <p className="text-sm sm:text-xl font-bold opacity-90 tracking-wide">{subtext}</p>}
    </div>
  </div>
);

const RulesModal = ({ onClose }) => {
  const [tab, setTab] = useState("rules"); 
  const [viewingPack, setViewingPack] = useState(null);

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-fuchsia-900/50 w-full max-w-4xl rounded-3xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="flex border-b border-fuchsia-900/30 bg-slate-900 shrink-0">
          <button onClick={() => { setTab("rules"); setViewingPack(null); }} className={`flex-1 py-4 text-sm sm:text-base font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${tab === "rules" ? "text-fuchsia-400 border-b-2 border-fuchsia-400 bg-fuchsia-900/10" : "text-zinc-500 hover:text-zinc-300"}`}>
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5"/> Rules
          </button>
          <button onClick={() => setTab("gallery")} className={`flex-1 py-4 text-sm sm:text-base font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${tab === "gallery" ? "text-cyan-400 border-b-2 border-cyan-400 bg-cyan-900/10" : "text-zinc-500 hover:text-zinc-300"}`}>
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5"/> Gallery
          </button>
          <button onClick={onClose} className="p-4 text-zinc-500 hover:text-white transition-colors bg-slate-900 hover:bg-slate-800 border-l border-fuchsia-900/30"><X size={24} /></button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          {tab === "rules" && (
            <div className="space-y-4 sm:space-y-6 text-xs sm:text-sm text-slate-300">
              <section>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2"><Sparkles className="text-fuchsia-400 w-5 h-5 sm:w-6 sm:h-6" /> Objective</h3>
                <p className="bg-slate-800 p-3 sm:p-4 rounded-xl border border-fuchsia-900/30">
                  Be the first dreamer to reach <strong>30 points</strong>. You score by giving clues that are neither too obvious nor too obscure, and by tricking others into picking your cards.
                </p>
              </section>
              <section>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2"><Eye className="text-fuchsia-400 w-5 h-5 sm:w-6 sm:h-6" /> The Phases</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-slate-800 p-3 sm:p-4 rounded-xl border border-fuchsia-900/30">
                    <strong className="text-fuchsia-300 block mb-1">1. The Clue</strong>
                    <p className="text-[10px] sm:text-xs">The active <strong>Storyteller</strong> selects a card from their hand and types a clue. It should relate to the card.</p>
                  </div>
                  <div className="bg-slate-800 p-3 sm:p-4 rounded-xl border border-fuchsia-900/30">
                    <strong className="text-fuchsia-300 block mb-1">2. The Illusion</strong>
                    <p className="text-[10px] sm:text-xs">All other players secretly select a card from their own hand that best matches the Storyteller's clue.</p>
                  </div>
                  <div className="bg-slate-800 p-3 sm:p-4 rounded-xl sm:col-span-2 border border-fuchsia-900/30">
                    <strong className="text-fuchsia-300 block mb-1">3. The Gallery & The Vote</strong>
                    <p className="text-[10px] sm:text-xs mb-2">All chosen cards are shuffled and revealed. Every player (except the Storyteller) votes on which card they believe belongs to the Storyteller. You cannot vote for your own card!</p>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2"><Crown className="text-fuchsia-400 w-5 h-5 sm:w-6 sm:h-6" /> Scoring</h3>
                <ul className="bg-slate-800 p-3 sm:p-4 rounded-xl border border-fuchsia-900/30 list-disc pl-5 space-y-1 sm:space-y-2 text-[10px] sm:text-xs">
                  <li>If <strong>everyone</strong> or <strong>no one</strong> finds the Storyteller's card, Storyteller gets 0 points, everyone else gets 2 points.</li>
                  <li>In any other case: The Storyteller gets <strong>3 points</strong>. Players who guessed correctly get <strong>3 points</strong>.</li>
                  <li><strong>Bonus:</strong> Players (except the Storyteller) get <strong>1 point</strong> for every vote their fake card received!</li>
                </ul>
              </section>
            </div>
          )}

          {tab === "gallery" && !viewingPack && (
            <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
               {Object.keys(AVAILABLE_PACKS).length === 0 && (
                 <p className="text-zinc-500 text-center italic mt-10">No image packs found in the assets folder.</p>
               )}
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {Object.keys(AVAILABLE_PACKS).map(packName => (
                    <button 
                      key={packName}
                      onClick={() => setViewingPack(packName)}
                      className="group flex flex-col items-center gap-2 bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl border border-slate-700 hover:border-cyan-500 transition-all text-center"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-cyan-900/20 rounded-full flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                        <ImageIcon size={32} />
                      </div>
                      <div>
                        <div className="font-black text-white text-sm sm:text-base uppercase tracking-widest">{packName}</div>
                        <div className="text-xs text-cyan-500 font-bold">{AVAILABLE_PACKS[packName].length} Cards</div>
                      </div>
                    </button>
                  ))}
               </div>
            </div>
          )}

          {tab === "gallery" && viewingPack && (
            <div className="flex flex-col animate-in slide-in-from-right-8 duration-200">
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setViewingPack(null)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-zinc-400 transition-colors"><ArrowLeft size={20} /></button>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest">{viewingPack}</h3>
                  <p className="text-cyan-400 text-sm font-bold">{AVAILABLE_PACKS[viewingPack].length} Images</p>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                 {AVAILABLE_PACKS[viewingPack].map((card, idx) => (
                    <div key={idx} className="w-full aspect-[2/3] rounded-lg bg-cover bg-center shadow-md border border-white/10" style={{ backgroundImage: `url(${card.image})` }} />
                 ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ScoreboardModal = ({ gameState, onClose }) => (
  <div className="fixed inset-0 z-[200] bg-zinc-950/95 backdrop-blur-md flex items-center justify-center pt-16 sm:pt-20 pb-10 px-4">
    <div className="bg-slate-900 border border-fuchsia-900/50 w-full max-w-lg rounded-3xl shadow-2xl p-4 sm:p-6 relative flex flex-col max-h-full">
      <button onClick={onClose} className="absolute top-3 sm:top-4 right-3 sm:right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors z-10"><X className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></button>
      <div className="shrink-0 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-black text-center text-fuchsia-400 flex items-center justify-center gap-2"><BarChart2 className="w-5 h-5 sm:w-6 sm:h-6" /> Dreamer Standings</h2>
      </div>
      <div className="space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1 sm:pr-2">
        {gameState.players.slice().sort((a,b) => b.score - a.score).map((p, idx) => {
          return (
            <div key={p.id} className="bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-lg sm:text-2xl font-black text-slate-500 w-5 sm:w-6">#{idx + 1}</span>
                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-lg ${PLAYER_COLORS[p.colorIdx].bg}`} />
                <span className="font-bold text-sm sm:text-lg text-white truncate max-w-[120px] sm:max-w-[200px]">{p.name}</span>
                {p.id === gameState.storytellerId && <BookOpen size={12} className="text-fuchsia-400 shrink-0"/>}
              </div>
              <span className="text-xl sm:text-3xl font-black text-yellow-400">{p.score}</span>
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
    const saved = localStorage.getItem("equilibrium_roomId");
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
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-fuchsia-500/50">
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
            className="group relative px-12 py-5 bg-fuchsia-600/20 hover:bg-fuchsia-600/40 border border-fuchsia-500/50 hover:border-fuchsia-400 text-fuchsia-300 font-black text-2xl tracking-widest rounded-none transform transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] backdrop-blur-md overflow-hidden"
          >
            {/* Animated Scanline overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-fuchsia-400/10 to-transparent translate-y-[-100%] animate-[scan_2s_infinite_linear]" />

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
        Inspired by Dixit. A tribute game.
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
export default function ReverieGame() {
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

  // Local Interactions
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [selectedTableIdx, setSelectedTableIdx] = useState(null);
  const [clueInput, setClueInput] = useState("");

  // Zoom / Long Press State
  const [zoomCard, setZoomCard] = useState(null);
  const longPressTimerRef = useRef(null);

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
        const savedName = localStorage.getItem("gameHub_playerName") || localStorage.getItem("reverie_playerName");
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
          setRoomId(""); localStorage.removeItem("reverie_roomId"); setView("menu"); setError("You have awoken."); return;
        }
        setGameState(data);
        if (data.status === "playing" || data.status === "finished") setView("game");
        else if (data.status === "lobby") setView("lobby");

        if (data.turnPhase !== "VOTING") setSelectedTableIdx(null); // Reset selection
      } else {
        setView("menu"); setRoomId(""); localStorage.removeItem("reverie_roomId"); setError("The dream has faded.");
      }
    }, (err) => { console.error(err); setError("Connection lost."); });
    return () => unsub();
  }, [roomId, user]);

  const handleSplashStart = () => {
    const savedRoomId = localStorage.getItem("reverie_roomId");
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
        icon: latestLog.type === "success" ? Sparkles : AlertTriangle,
      });
      setTimeout(() => setFeedback(null), 3000);
    }
  }, [gameState?.logs]);

  // --- LONG PRESS ZOOM HANDLERS ---
  const handleLongPressStart = (card) => {
    if (!card) return;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setZoomCard(card);
    }, 400); 
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
    setZoomCard(null);
  };

  const handleScrollCancel = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  // ---------------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------------
  const createRoom = async () => {
    if (!playerName) return setError("Enter Name");
    localStorage.setItem("gameHub_playerName", playerName); localStorage.setItem("reverie_playerName", playerName); setLoading(true);
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const defaultPack = Object.keys(AVAILABLE_PACKS).length > 0 ? [Object.keys(AVAILABLE_PACKS)[0]] : [];
    
    const initialData = {
      roomId: newId, hostId: user.uid, status: "lobby",
      players: [{ id: user.uid, name: playerName, colorIdx: 0, score: 0, hand: [], hasPlayed: false, hasVoted: false }],
      selectedPacks: defaultPack,
      deck: [], table: [], storytellerIdx: 0, storytellerId: null, clue: "", turnPhase: "STORYTELLER_CLUE", logs: []
    };
    try {
      await setDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId), initialData);
      setRoomId(newId); localStorage.setItem("reverie_roomId", newId);
    } catch (e) { setError("Failed to create dream."); }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCode || !playerName) return setError("Enter details");
    localStorage.setItem("gameHub_playerName", playerName); localStorage.setItem("reverie_playerName", playerName); setLoading(true);
    try {
      const code = roomCode.toUpperCase().trim();
      const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", code);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data().status === "lobby") {
        const data = snap.data();
        if (!data.players.some((p) => p.id === user.uid)) {
          if (data.players.length >= 6) { setError("The dream is full."); setLoading(false); return; }
          const newPlayers = [...data.players, { id: user.uid, name: playerName, colorIdx: data.players.length, score: 0, hand: [], hasPlayed: false, hasVoted: false }];
          await updateDoc(ref, { players: newPlayers });
        }
        setRoomId(code); localStorage.setItem("reverie_roomId", code);
      } else setError("Room not found or game in progress.");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const togglePack = async (packName) => {
     let current = [...(gameState.selectedPacks || [])];
     if (current.includes(packName)) {
         if (current.length > 1) current = current.filter(p => p !== packName);
     } else {
         if (current.length < 3) current.push(packName);
     }
     await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { selectedPacks: current });
  };

  const startGame = async () => {
    const deck = GENERATE_DECK(gameState.selectedPacks);
    const players = gameState.players.map(p => ({
      ...p, score: 0, hand: deck.splice(0, 6), hasPlayed: false, hasVoted: false
    }));
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      status: "playing", players, deck, table: [], storytellerIdx: 0, storytellerId: players[0].id, clue: "", turnPhase: "STORYTELLER_CLUE",
      logs: arrayUnion({ text: "The dream begins.", important: true, type: "neutral", title: "BEGIN", id: Date.now() })
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
    localStorage.removeItem("reverie_roomId"); setRoomId(""); setView("menu"); setShowLeaveConfirm(false); setGameState(null);
  };

  const kickPlayer = async (targetId) => {
    if (!gameState || gameState.hostId !== user.uid) return;
    try {
      const newPlayers = gameState.players.filter((p) => p.id !== targetId);
      await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { players: newPlayers, logs: arrayUnion(triggerLog("A player awoke.", "warning")) });
    } catch (e) { console.error("Error kicking player:", e); }
  };

  const returnToLobby = async () => {
    if (gameState.hostId !== user.uid) return;
    const players = gameState.players.map((p) => ({ ...p, score: 0, hand: [], hasPlayed: false, hasVoted: false }));
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      status: "lobby", players, deck: [], table: [], storytellerIdx: 0, storytellerId: null, clue: "", turnPhase: "STORYTELLER_CLUE", logs: []
    });
  };

  const submitClue = async () => {
    if (gameState.turnPhase !== "STORYTELLER_CLUE" || gameState.storytellerId !== user.uid) return;
    if (selectedCardIdx === null || !clueInput.trim()) return alert("Select a card and enter a clue.");

    let players = JSON.parse(JSON.stringify(gameState.players));
    const me = players.find(p => p.id === user.uid);
    const playedCard = me.hand.splice(selectedCardIdx, 1)[0];
    me.hasPlayed = true;

    let table = [{ card: playedCard, playerId: me.id, votedBy: [] }];

    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      players, table, clue: clueInput.trim(), turnPhase: "PLAY_CARDS",
      logs: arrayUnion(triggerLog(`Storyteller gave a clue: "${clueInput.trim()}"`))
    });
    setSelectedCardIdx(null);
    setClueInput("");
  };

  const playCard = async () => {
    if (gameState.turnPhase !== "PLAY_CARDS" || gameState.storytellerId === user.uid) return;
    if (selectedCardIdx === null) return;

    let players = JSON.parse(JSON.stringify(gameState.players));
    const me = players.find(p => p.id === user.uid);
    if (me.hasPlayed) return;

    const playedCard = me.hand.splice(selectedCardIdx, 1)[0];
    me.hasPlayed = true;

    let table = JSON.parse(JSON.stringify(gameState.table));
    table.push({ card: playedCard, playerId: me.id, votedBy: [] });

    let updates = { players, table };

    const allPlayed = players.every(p => p.hasPlayed);
    if (allPlayed) {
      updates.turnPhase = "VOTING";
      updates.table = table.sort(() => Math.random() - 0.5); 
      updates.logs = arrayUnion(triggerLog("All cards submitted. Time to vote!", "important", true, "VOTING PHASE"));
    }

    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
    setSelectedCardIdx(null);
  };

  const submitVote = async () => {
    if (gameState.turnPhase !== "VOTING" || gameState.storytellerId === user.uid) return;
    if (selectedTableIdx === null) return;
    
    let players = JSON.parse(JSON.stringify(gameState.players));
    const me = players.find(p => p.id === user.uid);
    if (me.hasVoted) return;

    let table = JSON.parse(JSON.stringify(gameState.table));
    const targetCard = table[selectedTableIdx];
    
    if (targetCard.playerId === me.id) return; // Failsafe

    targetCard.votedBy.push(me.id);
    me.hasVoted = true;

    let updates = { players, table };

    const allVoted = players.filter(p => p.id !== gameState.storytellerId).every(p => p.hasVoted);
    
    if (allVoted) {
      let logs = [];
      const stCard = table.find(c => c.playerId === gameState.storytellerId);
      const votesForSt = stCard.votedBy.length;
      const totalVoters = players.length - 1;

      if (votesForSt === 0 || votesForSt === totalVoters) {
        logs.push(triggerLog(votesForSt === 0 ? "No one found the Storyteller's card!" : "Everyone found the Storyteller's card! Too easy!", "warning", true, "SCORING"));
        players.forEach(p => { if (p.id !== gameState.storytellerId) p.score += 2; });
      } else {
        logs.push(triggerLog("Some found the Storyteller's card!", "success", true, "SCORING"));
        const stPlayer = players.find(p => p.id === gameState.storytellerId);
        stPlayer.score += 3;
        stCard.votedBy.forEach(voterId => { players.find(p => p.id === voterId).score += 3; });
      }

      table.forEach(tc => {
        if (tc.playerId !== gameState.storytellerId && tc.votedBy.length > 0) {
          players.find(p => p.id === tc.playerId).score += tc.votedBy.length; 
        }
      });

      updates.turnPhase = "ROUND_END";
      
      const winner = players.find(p => p.score >= 30);
      if (winner) {
        updates.status = "finished";
        logs.push(triggerLog(`${winner.name} wins the game!`, "important", true, "VICTORY"));
      }

      updates.logs = arrayUnion(...logs);
    }

    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
    setSelectedTableIdx(null);
  };

  const nextRound = async () => {
    if (gameState.turnPhase !== "ROUND_END" || gameState.hostId !== user.uid) return;

    let players = JSON.parse(JSON.stringify(gameState.players));
    let deck = JSON.parse(JSON.stringify(gameState.deck));
    
    players.forEach(p => {
      p.hasPlayed = false; p.hasVoted = false;
      while (p.hand.length < 6 && deck.length > 0) { p.hand.push(deck.pop()); }
    });

    const nextStIdx = (gameState.storytellerIdx + 1) % players.length;

    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      players, deck, table: [], turnPhase: "STORYTELLER_CLUE", clue: "",
      storytellerIdx: nextStIdx, storytellerId: players[nextStIdx].id,
      logs: arrayUnion(triggerLog(`A new round begins. ${players[nextStIdx].name} is the Storyteller.`, "neutral"))
    });
  };

  // ---------------------------------------------------------------------------
  // RENDER LOGIC
  // ---------------------------------------------------------------------------
  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <GlobalStyles />
        <GameLogoBig />
        <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10 mb-8">
          <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-fuchsia-500 animate-pulse-purple" />
        </div>
        <div className="bg-fuchsia-900/10 p-6 sm:p-8 rounded-2xl border border-fuchsia-900/30 max-w-sm w-full">
          <Hammer className="w-12 h-12 sm:w-16 sm:h-16 text-fuchsia-500 mx-auto mb-4 animate-bounce" />
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">The Dream is Paused</h1>
          <p className="text-sm sm:text-base text-zinc-400">Maintenance is currently underway. Return soon.</p>
        </div>
        <div className="h-8"></div>
        <a href={import.meta.env.BASE_URL}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-center pb-12 animate-pulse">
              <div className="inline-flex items-center gap-2 sm:gap-3 px-6 py-3 sm:px-8 sm:py-4 bg-zinc-900/50 rounded-full border border-fuchsia-900/20 text-fuchsia-300 font-bold tracking-widest text-xs sm:text-sm uppercase backdrop-blur-sm"><StepBack size={16} /> Return to Gamehub <StepBack size={16} /></div>
            </div>
          </div>
        </a>
        <GameLogo />
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-fuchsia-500 animate-pulse font-mono tracking-widest text-sm sm:text-base">Entering sleep...</div>;
  }

  if (view === "splash") return <SplashScreen onStart={handleSplashStart} />;

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
        <GlobalStyles />
        <FloatingBackground />
        <nav className="absolute top-0 left-0 w-full p-4 z-50">
          <a href={import.meta.env.BASE_URL} className="flex items-center gap-2 text-fuchsia-800 rounded-lg font-bold shadow-md hover:text-fuchsia-400 transition-colors w-fit animate-pulse text-sm sm:text-base"><StepBack className="w-4 h-4 sm:w-6 sm:h-6"/><span>Back to Gamehub</span></a>
        </nav>
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
        <div className="z-10 text-center mb-8 sm:mb-10 mt-8">
          <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-fuchsia-500 mx-auto mb-4" />
          <h1 className="text-5xl md:text-7xl font-thin text-transparent bg-clip-text bg-gradient-to-b from-fuchsia-400 to-indigo-600 tracking-tighter drop-shadow-md">REVERIE</h1>
          <p className="text-fuchsia-200/40 tracking-[0.3em] sm:tracking-[0.5em] uppercase mt-2 text-[10px] sm:text-xs">Dream. Describe. Deceive.</p>
        </div>
        <div className="bg-zinc-900/80 backdrop-blur-md border border-fuchsia-900/30 p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 relative">
          {error && <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-3 mb-4 rounded text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2"><AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" /> {error}</div>}
          <div className="space-y-4">
            <input className="w-full bg-black/50 border border-fuchsia-900 focus:border-fuchsia-500 p-3 sm:p-4 rounded-xl text-white outline-none transition-all text-base sm:text-lg font-bold text-center" placeholder="YOUR NAME" value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={12} />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={createRoom} disabled={loading} className="bg-gradient-to-br from-fuchsia-600 to-indigo-800 hover:from-fuchsia-500 hover:to-indigo-700 p-3 sm:p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-fuchsia-900/50"><Sparkles className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="text-sm sm:text-base">Create</span></button>
              <div className="flex flex-col gap-2">
                <input className="bg-black/50 border border-fuchsia-900 focus:border-fuchsia-500 p-2 rounded-xl text-white text-center uppercase font-mono font-bold tracking-widest outline-none h-10 sm:h-12 text-sm sm:text-base" placeholder="CODE" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} maxLength={6} />
                <button onClick={joinRoom} disabled={loading} className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-xl font-bold text-zinc-300 transition-all active:scale-95 h-full text-sm sm:text-base">Join</button>
              </div>
            </div>
            <button onClick={() => setShowGuide(true)} className="w-full mt-4 text-fuchsia-500 hover:text-fuchsia-400 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors py-2"><BookOpen className="w-4 h-4 sm:w-5 sm:h-5" /> How to Play & Gallery</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    const canStart = gameState.players.length >= 3 && gameState.players.length <= 6;
    
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 relative">
        <GlobalStyles />
        <FloatingBackground />
        <GameLogoBig />
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
        <div className="z-10 w-full max-w-lg bg-zinc-900/90 backdrop-blur p-6 sm:p-8 rounded-2xl border border-fuchsia-900/30 shadow-2xl animate-in slide-in-from-bottom-8 mt-6">
          <div className="flex justify-between items-center mb-6 sm:mb-8 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-base sm:text-xl flex items-center gap-2 text-fuchsia-500 font-bold uppercase"><Sparkles className="w-5 h-5 sm:w-6 sm:h-6" /> Dream Code:</h2>
              <div className="flex items-center gap-2 sm:gap-3 mt-1">
                <div className="text-2xl sm:text-4xl font-mono text-white font-black">{roomId}</div>
                <div className="relative">
                  <button onClick={copyToClipboard} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">{isCopied ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}</button>
                  {isCopied && <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-fuchsia-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded shadow-lg animate-fade-in-up whitespace-nowrap">Copied!</div>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowLeaveConfirm(true)} className="p-2 hover:bg-red-900/30 rounded text-rose-500 transition-colors"><LogOut className="w-5 h-5 sm:w-6 sm:h-6" /></button>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
            <h3 className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Dreamers ({gameState.players.length}/6)</h3>
            {gameState.players.map((p) => (
              <div key={p.id} className="flex justify-between items-center bg-zinc-800 p-3 sm:p-4 rounded-xl border border-zinc-700">
                <span className="font-bold flex items-center gap-2 sm:gap-3 text-sm sm:text-lg">
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${PLAYER_COLORS[p.colorIdx].bg} shadow-lg`} /> {p.name} {p.id === gameState.hostId && <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />}
                </span>
                {gameState.hostId === user.uid && p.id !== user.uid && (
                  <button onClick={() => kickPlayer(p.id)} className="p-1.5 sm:p-2 bg-red-900/20 hover:bg-red-900/50 text-red-500 rounded-lg transition-colors border border-red-900/30" title="Wake Player"><Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                )}
              </div>
            ))}
            {Array.from({ length: 6 - gameState.players.length }).map((_, i) => <div key={i} className="border-2 border-dashed border-zinc-800 rounded-xl p-3 sm:p-4 flex items-center justify-center text-zinc-600 font-bold uppercase text-xs sm:text-sm">Empty Slot</div>)}
          </div>

          {isHost && Object.keys(AVAILABLE_PACKS).length > 0 && (
            <div className="mb-6 bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
              <h4 className="text-[10px] sm:text-xs font-bold text-fuchsia-400 uppercase tracking-widest mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Select Image Packs (1-3)</h4>
              <div className="flex flex-wrap gap-2">
                {Object.keys(AVAILABLE_PACKS).map(packName => {
                   const isSelected = gameState.selectedPacks?.includes(packName);
                   return (
                     <button 
                       key={packName}
                       onClick={() => togglePack(packName)}
                       className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isSelected ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow-md' : 'bg-zinc-800 border-zinc-600 text-zinc-400 hover:border-zinc-400'}`}
                     >
                       {packName} <span className="opacity-70 text-[10px]">({AVAILABLE_PACKS[packName].length})</span>
                     </button>
                   )
                })}
              </div>
            </div>
          )}

          {isHost ? (
            <div className="flex flex-col gap-2">
              <button onClick={startGame} disabled={!canStart} className="w-full flex justify-center items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all bg-gradient-to-br from-fuchsia-600 to-indigo-800 text-white hover:from-fuchsia-500 hover:to-indigo-700 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"><Sparkles className="w-5 h-5 sm:w-6 sm:h-6" /> Enter the Dream</button>
              {!canStart && <div className="text-center text-[10px] sm:text-xs font-bold text-fuchsia-500 uppercase tracking-wider mt-1">Requires 3 to 6 players to start</div>}
            </div>
          ) : <div className="text-center text-zinc-500 text-xs sm:text-sm font-bold uppercase tracking-widest animate-pulse">Waiting for host...</div>}
        </div>

        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl max-w-xs w-full text-center shadow-2xl">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase">Leave Dream?</h3>
              <p className="text-zinc-400 mb-6 text-xs sm:text-sm">{gameState.hostId === user.uid ? "As Host, leaving awakes everyone." : "You will disconnect from this session."}</p>
              <div className="flex gap-2">
                <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded font-bold text-zinc-300 text-sm sm:text-base">Stay</button>
                <button onClick={handleLeave} className="flex-1 bg-rose-700 hover:bg-rose-600 py-2 rounded font-bold text-white text-sm sm:text-base">Leave</button>
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
    const isStoryteller = gameState.storytellerId === user.uid;

    return (
      <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col overflow-hidden font-sans select-none">
        <GlobalStyles />
        <FloatingBackground />

        {/* --- LONG PRESS ZOOM OVERLAY (REDUCED SIZE) --- */}
        {zoomCard && (
          <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-none">
             <div 
                className="w-full max-w-[200px] sm:max-w-xs aspect-[2/3] rounded-3xl bg-cover bg-center shadow-[0_0_80px_rgba(255,255,255,0.15)] border border-white/20" 
                style={{backgroundImage: zoomCard.image ? `url(${zoomCard.image})` : undefined}}
             >
                {!zoomCard.image && <div className="w-full h-full flex items-center justify-center"><Sparkles className="w-16 h-16 text-indigo-500/50" /></div>}
             </div>
          </div>
        )}

        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl max-w-xs w-full text-center shadow-2xl">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase">Abandon Game?</h3>
              <p className="text-zinc-400 mb-6 text-xs sm:text-sm">{gameState.hostId === user.uid ? "Leaving deletes the game for everyone." : "You will leave this ongoing game."}</p>
              <div className="flex gap-2">
                <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded font-bold text-zinc-300 text-sm sm:text-base">Stay</button>
                <button onClick={handleLeave} className="flex-1 bg-rose-700 hover:bg-rose-600 py-2 rounded font-bold text-white text-sm sm:text-base">Leave</button>
              </div>
              {gameState.hostId === user.uid && <button onClick={() => { returnToLobby(); setShowLeaveConfirm(false); }} className="w-full bg-zinc-800 hover:bg-zinc-700 py-2 rounded font-bold text-rose-500 mt-2 text-xs sm:text-sm border border-zinc-700 transition-colors">Return All to Lobby</button>}
            </div>
          </div>
        )}

        {feedback && <FeedbackOverlay type={feedback.type} message={feedback.message} subtext={feedback.subtext} icon={feedback.icon} />}
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
        {showScoreboard && <ScoreboardModal gameState={gameState} onClose={() => setShowScoreboard(false)} />}

        {/* TOP BAR */}
        <div className="h-14 sm:h-16 bg-zinc-900 border-b border-fuchsia-900/50 flex items-center justify-between px-2 z-[160] shrink-0 shadow-lg relative">
          <div className="absolute inset-0 bg-fuchsia-900/10 pointer-events-none" />
          <div className="flex items-center gap-3 sm:gap-4 relative z-10">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-fuchsia-900/50 rounded-lg flex items-center justify-center border border-fuchsia-700 ml-1 sm:ml-2 shadow-[0_0_10px_rgba(217,70,239,0.3)]"><Sparkles className="text-fuchsia-400 w-4 h-4 sm:w-5 sm:h-5" /></div>
            <div>
              <div className="font-bold text-xs sm:text-sm tracking-wider text-fuchsia-100">REVERIE</div>
              <div className="text-[8px] sm:text-[10px] font-mono uppercase">
                {gameState.status === "finished" ? <span className="text-rose-400">GAME OVER</span> : 
                 <><span className="text-zinc-400 hidden sm:inline">Storyteller:</span> <span className="text-fuchsia-400">{gameState.players.find(p=>p.id===gameState.storytellerId)?.name}</span></>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 relative z-10">
            <button onClick={() => setShowScoreboard(true)} className="p-1.5 sm:p-2 hover:bg-zinc-800 rounded text-yellow-500 hover:text-white"><BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <button onClick={() => setShowGuide(true)} className="p-1.5 sm:p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><BookOpen className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <button onClick={() => setShowLogs(!showLogs)} className={`p-1.5 sm:p-2 rounded-full ${showLogs ? "bg-fuchsia-900 text-fuchsia-400" : "text-zinc-400 hover:bg-zinc-800"}`}><History className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            <button onClick={() => setShowLeaveConfirm(true)} className="p-1.5 sm:p-2 hover:bg-rose-900/30 rounded text-rose-500"><LogOut className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          </div>
        </div>

        {/* LOGS OVERLAY */}
        {showLogs && (
          <div className="fixed top-14 sm:top-16 right-2 sm:right-4 w-56 sm:w-64 max-h-56 sm:max-h-60 bg-zinc-900/95 border border-zinc-700 rounded-xl z-[155] overflow-y-auto p-2 shadow-2xl custom-scrollbar">
            <h4 className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 sticky top-0 bg-zinc-900/95 py-1 sm:py-2">World History</h4>
            <div className="space-y-2">
              {gameState.logs.slice().reverse().map((log) => (
                <div key={log.id} className={`text-[10px] sm:text-xs p-2 rounded border-l-2 ${log.type === "success" ? "border-emerald-500 bg-emerald-900/10 text-emerald-200" : log.type === "warning" ? "border-amber-500 bg-amber-900/10 text-amber-200" : log.type === "failure" ? "border-rose-500 bg-rose-900/10 text-rose-200" : "border-fuchsia-500 bg-zinc-800/30 text-zinc-300"}`}>
                  {log.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CENTRAL TABLE AREA */}
        <div className="flex-1 relative bg-transparent overflow-y-auto custom-scrollbar flex flex-col pt-4 sm:pt-8 pb-56 sm:pb-64">
          
          {/* Clue Banner */}
          {gameState.turnPhase !== "ROUND_END" && (
              <div className="w-full flex justify-center mb-4 sm:mb-6 px-2 sm:px-4">
                 {gameState.turnPhase === "STORYTELLER_CLUE" ? (
                    <div className="text-center animate-pulse text-zinc-400 uppercase tracking-widest font-bold border border-zinc-800 bg-zinc-900/50 py-2 px-4 sm:px-6 rounded-full shadow-lg text-[10px] sm:text-xs">
                       {isStoryteller ? "Select a card and enter a clue" : "Waiting for the Storyteller's Clue..."}
                    </div>
                 ) : (
                    <div className="text-center border border-fuchsia-500/30 bg-fuchsia-900/20 py-3 sm:py-4 px-4 sm:px-8 rounded-2xl shadow-[0_0_30px_rgba(217,70,239,0.1)] backdrop-blur max-w-xs sm:max-w-2xl w-full mx-2">
                       <h3 className="text-[10px] sm:text-xs font-black text-fuchsia-400 uppercase tracking-widest mb-1 opacity-70">The Clue</h3>
                       <p className="text-xl sm:text-4xl font-serif text-white italic drop-shadow-md leading-tight break-words">"{gameState.clue}"</p>
                    </div>
                 )}
              </div>
          )}

          {/* Table Cards Container */}
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 w-full max-w-5xl mx-auto px-2 sm:px-4 mt-auto mb-auto">
              
              {/* PLAY CARDS Phase - Show face down cards */}
              {gameState.turnPhase === "PLAY_CARDS" && (
                 <>
                    {gameState.table.map((entry, idx) => (
                       <DreamCard key={idx} isFaceDown size="lg" />
                    ))}
                    {Array.from({length: gameState.players.length - gameState.table.length}).map((_, idx) => (
                       <div key={`empty-${idx}`} className="w-24 h-36 sm:w-40 sm:h-60 rounded-xl border-2 sm:border-4 border-dashed border-zinc-800/50 flex flex-col items-center justify-center text-zinc-700 font-bold uppercase tracking-widest text-[10px] sm:text-xs">
                          Waiting
                       </div>
                    ))}
                 </>
              )}

              {/* VOTING Phase - Show shuffled face up cards */}
              {gameState.turnPhase === "VOTING" && gameState.table.map((entry, idx) => {
                  const isMyCard = entry.playerId === user.uid;
                  const isSelectable = !isStoryteller && !me.hasVoted && !isMyCard;
                  const isSelected = selectedTableIdx === idx;

                  return (
                    <div key={idx} className="relative flex flex-col items-center">
                        <DreamCard 
                          card={entry.card} 
                          size="lg" 
                          disabled={!isSelectable && !isMyCard} 
                          isSelected={isSelected}
                          isOwnCard={isMyCard}
                          onPressStart={handleLongPressStart}
                          onPressEnd={handleLongPressEnd}
                          onPressCancel={handleScrollCancel}
                          onClick={() => {
                              if (isSelectable) setSelectedTableIdx(isSelected ? null : idx);
                          }}
                        />
                        {isMyCard && (
                           <div className="absolute -top-3 bg-fuchsia-600 text-white text-[10px] sm:text-xs font-black px-3 py-1 rounded-full shadow-[0_0_15px_rgba(217,70,239,0.6)] z-30 uppercase tracking-widest border border-white/20">
                               Your Illusion
                           </div>
                        )}
                    </div>
                  );
              })}
          </div>
        </div>

        {/* --- ROUND RESULTS MODAL --- */}
        {gameState.turnPhase === "ROUND_END" && (
          <div className="fixed inset-0 z-[180] bg-black/90 backdrop-blur-md flex flex-col pt-16 pb-6 px-4 animate-in fade-in duration-300">
             
             {/* Header */}
             <div className="w-full max-w-5xl mx-auto text-center mb-6 shrink-0">
                <h2 className="text-3xl sm:text-5xl font-black text-fuchsia-400 uppercase tracking-widest mb-2">The Truth Revealed</h2>
                <div className="text-center border border-fuchsia-500/30 bg-fuchsia-900/20 py-2 px-6 rounded-2xl shadow-[0_0_30px_rgba(217,70,239,0.1)] inline-block">
                   <p className="text-lg sm:text-2xl font-serif text-white italic">"{gameState.clue}"</p>
                </div>
             </div>

             {/* Cards Scroll View */}
             <div className="flex-1 w-full max-w-6xl mx-auto overflow-y-auto custom-scrollbar flex flex-col items-center">
                 {/* The Storyteller's Card */}
                 <div className="mb-10 w-full flex flex-col items-center">
                     <div className="flex items-center gap-2 mb-3">
                         <Crown className="text-amber-400 w-5 h-5 sm:w-6 sm:h-6" />
                         <span className="text-amber-400 font-black uppercase tracking-widest text-sm sm:text-base">The Real Card</span>
                     </div>
                     {(() => {
                         const stEntry = gameState.table.find(e => e.playerId === gameState.storytellerId);
                         if (!stEntry) return null;
                         const ownerColor = PLAYER_COLORS[gameState.players.find(p=>p.id===stEntry.playerId).colorIdx];
                         const votedByPlayers = stEntry.votedBy.map(vid => gameState.players.find(p => p.id === vid));
                         return (
                             <div className="flex flex-col items-center gap-3">
                                 <div className="p-1 sm:p-2 rounded-2xl bg-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.4)]">
                                     <DreamCard 
                                        card={stEntry.card} 
                                        size="xl" 
                                        votedBy={votedByPlayers}
                                        onPressStart={handleLongPressStart}
                                        onPressEnd={handleLongPressEnd}
                                        onPressCancel={handleScrollCancel} 
                                     />
                                 </div>
                                 <div className="flex flex-col items-center mt-2">
                                     <span className={`text-xs sm:text-sm font-black uppercase tracking-widest ${ownerColor.text}`}>{gameState.players.find(p=>p.id===stEntry.playerId).name}</span>
                                 </div>
                             </div>
                         )
                     })()}
                 </div>

                 {/* The Decoys */}
                 <div className="w-full flex flex-col items-center border-t border-white/10 pt-8">
                     <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs sm:text-sm mb-6">The Illusions</span>
                     <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
                         {gameState.table.filter(e => e.playerId !== gameState.storytellerId).map((entry, idx) => {
                             const ownerColor = PLAYER_COLORS[gameState.players.find(p=>p.id===entry.playerId).colorIdx];
                             const votedByPlayers = entry.votedBy.map(vid => gameState.players.find(p => p.id === vid));
                             return (
                               <div key={idx} className="flex flex-col items-center gap-3">
                                   <DreamCard 
                                      card={entry.card} 
                                      size="lg" 
                                      votedBy={votedByPlayers}
                                      onPressStart={handleLongPressStart}
                                      onPressEnd={handleLongPressEnd}
                                      onPressCancel={handleScrollCancel} 
                                   />
                                   <div className="flex flex-col items-center bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-700 min-w-[120px] text-center">
                                       <span className="text-[10px] text-zinc-500 uppercase font-bold mb-0.5">Played By</span>
                                       <span className={`text-xs font-black uppercase tracking-widest truncate w-full ${ownerColor.text}`}>{gameState.players.find(p=>p.id===entry.playerId).name}</span>
                                   </div>
                               </div>
                             );
                         })}
                     </div>
                 </div>
             </div>

             {/* Footer Controls */}
             <div className="shrink-0 pt-6 flex justify-center">
                 {gameState.hostId === user.uid ? (
                    <button 
                        onClick={nextRound}
                        className="w-full max-w-sm bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all animate-bounce text-sm sm:text-base"
                    >
                        Start Next Round
                    </button>
                 ) : (
                    <div className="text-center text-zinc-500 text-xs sm:text-sm font-bold uppercase tracking-widest py-4 border border-zinc-800 rounded-xl bg-black/50 w-full max-w-sm">
                        Waiting for Host...
                    </div>
                 )}
             </div>
          </div>
        )}

        {/* BOTTOM UI CONTROLS (My Hand & Actions) */}
        {gameState.turnPhase !== "ROUND_END" && (
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/95 border-t-2 border-fuchsia-900/50 backdrop-blur-xl flex flex-col z-[60] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            {/* Status Bar */}
            <div className="flex justify-between items-center px-2 sm:px-4 py-1.5 sm:py-2 border-b border-white/5 bg-black/20 shrink-0">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] sm:text-[11px] font-black uppercase tracking-widest ${gameState.turnPhase !== "ROUND_END" ? "text-fuchsia-400 animate-pulse" : "text-zinc-500"}`}>
                  {gameState.turnPhase === "STORYTELLER_CLUE" ? (isStoryteller ? "Select card & enter clue" : "Waiting for Storyteller") : 
                   gameState.turnPhase === "PLAY_CARDS" ? (me.hasPlayed ? "Waiting for others" : "Select card to match clue") : 
                   gameState.turnPhase === "VOTING" ? (isStoryteller ? "Waiting for votes" : (me.hasVoted ? "Waiting for others to vote" : "Vote for Storyteller's card")) : 
                   "Round Ended"}
                </span>
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                 <Star className="w-3 h-3 sm:w-4 sm:h-4"/> My Score: {me?.score || 0}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row p-2 sm:p-4 gap-2 sm:gap-4 items-center sm:items-end">
              
              {/* Hand Area */}
              <div className="w-full flex-1 flex justify-start sm:justify-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-2 sm:pb-0 pt-2 sm:pt-4 px-2 sm:px-0">
                  {me && me.hand.map((card, idx) => {
                      const isSelectable = 
                          (gameState.turnPhase === "STORYTELLER_CLUE" && isStoryteller) || 
                          (gameState.turnPhase === "PLAY_CARDS" && !isStoryteller && !me.hasPlayed);
                      
                      const isSelected = idx === selectedCardIdx;

                      return (
                          <div key={card.id} className="shrink-0">
                            <DreamCard 
                                card={card} 
                                size="md" 
                                isSelected={isSelected}
                                disabled={!isSelectable}
                                onPressStart={handleLongPressStart}
                                onPressEnd={handleLongPressEnd}
                                onPressCancel={handleScrollCancel}
                                onClick={() => {
                                    if (isSelectable) setSelectedCardIdx(isSelected ? null : idx);
                                }}
                            />
                          </div>
                      );
                  })}
              </div>

              {/* Actions Area */}
              <div className="w-full sm:w-64 shrink-0 flex flex-col justify-end gap-2 sm:border-l sm:border-white/10 sm:pl-4 mt-2 sm:mt-0">
                  
                  {/* STORYTELLER Phase */}
                  {gameState.turnPhase === "STORYTELLER_CLUE" && isStoryteller && (
                      <div className="flex flex-col gap-2 w-full">
                          <input 
                              type="text" 
                              placeholder="Enter your Clue..." 
                              value={clueInput}
                              onChange={(e) => setClueInput(e.target.value)}
                              maxLength={40}
                              className="w-full bg-black/50 border border-fuchsia-900 focus:border-fuchsia-500 p-2.5 sm:p-3 rounded-xl text-white outline-none text-xs sm:text-sm font-bold text-center italic"
                          />
                          <button 
                              onClick={submitClue} 
                              disabled={selectedCardIdx === null || clueInput.trim() === ""}
                              className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black py-2.5 sm:py-3 rounded-xl uppercase tracking-widest shadow-lg transition-all text-xs sm:text-sm"
                          >
                              Give Clue
                          </button>
                      </div>
                  )}

                  {/* PLAY CARDS Phase */}
                  {gameState.turnPhase === "PLAY_CARDS" && !isStoryteller && !me.hasPlayed && (
                      <button 
                          onClick={playCard} 
                          disabled={selectedCardIdx === null}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black py-3 sm:py-4 rounded-xl uppercase tracking-widest shadow-lg transition-all animate-bounce text-xs sm:text-sm"
                      >
                          Play Card
                      </button>
                  )}

                  {/* VOTING Phase */}
                  {gameState.turnPhase === "VOTING" && !isStoryteller && !me.hasVoted && (
                      <button 
                          onClick={() => submitVote()} 
                          disabled={selectedTableIdx === null}
                          className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black py-3 sm:py-4 rounded-xl uppercase tracking-widest shadow-lg transition-all animate-bounce text-xs sm:text-sm"
                      >
                          Confirm Vote
                      </button>
                  )}

                  {/* Passive States */}
                  {((gameState.turnPhase === "STORYTELLER_CLUE" && !isStoryteller) || 
                    (gameState.turnPhase === "PLAY_CARDS" && (isStoryteller || me.hasPlayed)) || 
                    (gameState.turnPhase === "VOTING" && (isStoryteller || me.hasVoted))) && (
                      <div className="text-center text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest py-3 sm:py-4 border border-zinc-800 rounded-xl bg-black/20 w-full">
                          View Gallery Above
                      </div>
                  )}

              </div>
            </div>
          </div>
        )}

        {/* END GAME MODAL */}
        {gameState.status === "finished" && (
          <div className="fixed inset-0 z-[250] bg-black/90 flex items-center justify-center backdrop-blur-md pt-16 sm:pt-20 pb-10 px-4">
            <div className="bg-zinc-900 p-6 md:p-8 rounded-3xl border-2 border-fuchsia-500 text-center shadow-[0_0_50px_rgba(217,70,239,0.4)] animate-in zoom-in max-w-lg w-full flex flex-col relative max-h-[90vh]">
              <div className="shrink-0 mb-4 sm:mb-6">
                <Crown className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-500 mx-auto mb-2 sm:mb-4 animate-bounce" />
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white uppercase mb-1 sm:mb-2 leading-tight drop-shadow-lg truncate px-2">
                  {gameState.players.slice().sort((a,b)=>b.score - a.score)[0]?.name}
                </h2>
                <p className="text-fuchsia-400 font-bold tracking-widest text-xs sm:text-sm uppercase">Master of Dreams</p>
              </div>
              
              <div className="space-y-2 mb-4 sm:mb-6 overflow-y-auto custom-scrollbar flex-1">
                 {gameState.players.slice().sort((a,b)=>b.score - a.score).map((p, i) => (
                    <div key={p.id} className={`flex justify-between items-center px-3 sm:px-4 py-2 rounded-lg border ${i===0 ? "bg-amber-500/20 border-amber-500/50" : "bg-zinc-800 border-zinc-700"}`}>
                        <span className="font-bold text-white text-sm sm:text-base truncate mr-2">{i+1}. {p.name}</span>
                        <span className="font-black text-yellow-400 text-sm sm:text-base shrink-0">{p.score} pt</span>
                    </div>
                 ))}
              </div>

              {gameState.hostId === user.uid ? (
                <div className="shrink-0 pt-2">
                  <button onClick={returnToLobby} className="bg-fuchsia-700 hover:bg-fuchsia-600 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-black w-full text-white transition-colors uppercase tracking-widest shadow-lg text-xs sm:text-sm">Wake Everyone Up</button>
                </div>
              ) : (
                <div className="shrink-0 pt-2">
                  <button disabled className="bg-zinc-800 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-black w-full text-zinc-600 uppercase tracking-widest text-xs sm:text-sm">Waiting for Host...</button>
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