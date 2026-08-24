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
  AlertTriangle, Crown, X, StepBack, Play, RotateCcw, Copy, User,
  CheckCircle, Trash2, LogOut, Hammer, BookOpen, History, BarChart2,
  Heart, Bone, Brain, Wind, Sparkles, Bug, Pill, Shuffle, Hand, Activity, Biohazard, ShieldAlert,
  FlaskConical,
  HeartPulse, Loader
} from "lucide-react";
import CoverImage from "./assets/virus.png";

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

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "immune-game";
const GAME_ID = "25";

// ---------------------------------------------------------------------------
// STYLES & VISUALS
// ---------------------------------------------------------------------------
const GlobalStyles = () => (
  <style>{`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.4); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.8); }
    
    @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-5px) rotate(1deg); } }
    .animate-float { animation: float infinite ease-in-out; }
    
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-spin-slow { animation: spin-slow 20s linear infinite; }
    
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.3); }
      50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.7); }
    }
    .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
  `}</style>
);

const FloatingBackground = React.memo(() => {
  const backgroundIcons = React.useMemo(() => {
    const icons = [Activity, Pill, Heart, ShieldAlert];
    return [...Array(12)].map((_, i) => {
      const Icon = icons[i % icons.length];
      return (
        <div
          key={i}
          className="absolute animate-float text-emerald-500/10"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${10 + Math.random() * 15}s`,
            transform: `scale(${0.4 + Math.random() * 0.6})`,
          }}
        >
          <Icon size={32}/>
        </div>
      );
    });
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-emerald-950 via-slate-950 to-black" />
      <div className="absolute top-0 left-0 w-full h-full opacity-40">
        {backgroundIcons}
      </div>
    </div>
  );
});

const DarkAtmosphere = React.memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-slate-950">
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

const Logo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-4 pt-4 relative z-10">
    <HeartPulse size={14} className="text-emerald-500" />
    <span className="text-xs font-black tracking-widest text-emerald-500 uppercase">
      IMMUNE
    </span>
  </div>
);

const LogoBig = () => (
  <div className="flex items-center justify-center gap-2 opacity-40 mt-auto pb-4 pt-4 relative z-10">
    <HeartPulse size={28} className="text-emerald-500" />
    <span className="text-2xl font-black tracking-widest text-emerald-500 uppercase">
      IMMUNE
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// GAME LOGIC HELPERS & DECK MANAGEMENT
// ---------------------------------------------------------------------------
const PLAYER_COLORS = [
  { bg: "bg-emerald-500", text: "text-emerald-300" },
  { bg: "bg-rose-500", text: "text-rose-300" },
  { bg: "bg-blue-500", text: "text-blue-300" },
  { bg: "bg-amber-400", text: "text-amber-300" },
  { bg: "bg-fuchsia-500", text: "text-fuchsia-300" },
  { bg: "bg-cyan-500", text: "text-cyan-300" },
];

const GENERATE_DECK = () => {
  const deck = [];
  let id = 0;
  const colors = ['RED', 'GREEN', 'BLUE', 'YELLOW', 'MULTI'];
  
  // Organs
  colors.forEach(c => {
      const count = c === 'MULTI' ? 1 : 5;
      for(let i=0; i<count; i++) deck.push({ id: `c_${id++}`, type: 'ORGAN', color: c });
  });
  // Viruses
  colors.forEach(c => {
      const count = c === 'MULTI' ? 1 : 4;
      for(let i=0; i<count; i++) deck.push({ id: `c_${id++}`, type: 'VIRUS', color: c });
  });
  // Medicines
  colors.forEach(c => {
      const count = c === 'MULTI' ? 4 : 4;
      for(let i=0; i<count; i++) deck.push({ id: `c_${id++}`, type: 'MEDICINE', color: c });
  });
  // Actions
  for(let i=0; i<2; i++) deck.push({ id: `c_${id++}`, type: 'ACTION', action: 'TRANSPLANT' });
  for(let i=0; i<3; i++) deck.push({ id: `c_${id++}`, type: 'ACTION', action: 'THIEF' });
  for(let i=0; i<2; i++) deck.push({ id: `c_${id++}`, type: 'ACTION', action: 'CONTAGION' });
  deck.push({ id: `c_${id++}`, type: 'ACTION', action: 'GLOVE' });
  deck.push({ id: `c_${id++}`, type: 'ACTION', action: 'ERROR' });

  return deck.sort(() => Math.random() - 0.5); 
};

const getCardVisuals = (card) => {
   if (!card) return { bg: 'bg-zinc-800', border: 'border-zinc-600', icon: Sparkles, text: 'text-zinc-500', label: '' };
   
   if (card.type === 'ACTION') {
      const icons = { TRANSPLANT: Shuffle, THIEF: Hand, CONTAGION: Biohazard, GLOVE: ShieldAlert, ERROR: Activity };
      return { bg: 'bg-fuchsia-600', border: 'border-fuchsia-400', icon: icons[card.action] || Zap, text: 'text-fuchsia-100', label: card.action };
   }
   
   const colors = {
      RED: { bg: 'bg-rose-500', border: 'border-rose-400', icon: Heart, text: 'text-rose-100' },
      GREEN: { bg: 'bg-emerald-500', border: 'border-emerald-400', icon: Wind, text: 'text-emerald-100' },
      BLUE: { bg: 'bg-blue-500', border: 'border-blue-400', icon: Brain, text: 'text-blue-100' },
      YELLOW: { bg: 'bg-amber-400', border: 'border-amber-300', icon: Bone, text: 'text-amber-100' },
      MULTI: { bg: 'bg-gradient-to-br from-rose-500 via-emerald-500 to-blue-500', border: 'border-white', icon: Sparkles, text: 'text-white' }
   };
   
   const vis = colors[card.color];
   if (card.type === 'VIRUS') return { ...vis, icon: Bug, label: 'VIRUS' };
   if (card.type === 'MEDICINE') return { ...vis, icon: Pill, label: 'MEDICINE' };
   return { ...vis, label: 'ORGAN' };
};

const checkWinCondition = (player) => {
    return player.body.filter(o => o.viruses.length === 0).length >= 4;
};

// ---------------------------------------------------------------------------
// VISUAL COMPONENTS
// ---------------------------------------------------------------------------
const GameCard = ({ card, size="md", isSelected, isTargetable, onClick }) => {
   const visuals = getCardVisuals(card);
   const Icon = visuals.icon;
   
   const sizeClasses = 
    size === "xs" ? "w-6 h-8 sm:w-8 sm:h-12 border sm:border-2 shrink-0" :
    size === "sm" ? "w-10 h-14 sm:w-12 sm:h-16 border-2 shrink-0" : 
    size === "md" ? "w-16 h-24 sm:w-20 sm:h-28 border-2 shrink-0" : 
    "w-24 h-36 sm:w-32 sm:h-48 border-4 shrink-0";

   return (
       <div 
         onClick={onClick}
         className={`${sizeClasses} rounded-md sm:rounded-lg flex flex-col items-center justify-center relative overflow-hidden transition-all
            ${visuals.bg} ${visuals.border}
            ${isSelected ? "ring-2 sm:ring-4 ring-white -translate-y-2 shadow-xl" : "shadow-md"}
            ${isTargetable ? "ring-2 sm:ring-4 ring-cyan-400 animate-pulse cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.6)]" : "cursor-pointer"}
         `}
       >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none mix-blend-overlay"></div>
          <Icon className={`w-1/2 h-1/2 ${visuals.text} drop-shadow-md`} />
          {size !== "sm" && size !== "xs" && (
             <span className={`text-[6px] sm:text-[10px] font-black uppercase tracking-widest mt-0.5 sm:mt-1 ${visuals.text} drop-shadow-sm text-center px-1 leading-tight`}>{visuals.label}</span>
          )}
       </div>
   )
};

const OrganView = ({ organ, onClick, isTargetable, size="md" }) => {
   const attachSize = size === "md" ? "sm" : "xs";

   return (
       <div className={`relative shrink-0 transition-all ${isTargetable ? 'ring-2 sm:ring-4 ring-cyan-400 rounded-lg animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.6)] cursor-pointer hover:scale-105' : ''}`}>
           <GameCard card={organ} size={size} onClick={onClick} />
           
           {/* Viruses */}
           {organ.viruses.map((v, i) => (
               <div key={i} className={`absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 rotate-12 z-20 pointer-events-none drop-shadow-lg`}>
                   <GameCard card={v} size={attachSize} />
               </div>
           ))}
           
           {/* Medicines */}
           {organ.medicines.length === 1 && (
               <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 -rotate-12 z-20 pointer-events-none drop-shadow-lg">
                   <GameCard card={organ.medicines[0]} size={attachSize} />
               </div>
           )}
           {organ.medicines.length === 2 && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex gap-0.5 pointer-events-none drop-shadow-xl rotate-90 scale-90 bg-black/30 p-0.5 sm:p-1 rounded-md">
                   <GameCard card={organ.medicines[0]} size={attachSize} />
                   <GameCard card={organ.medicines[1]} size={attachSize} />
               </div>
           )}
       </div>
   )
};

const triggerLog = (text, type = "neutral", important = false, title = "") => ({
  text, type, important, title, id: Date.now() + Math.random()
});

// ---------------------------------------------------------------------------
// SUBCOMPONENTS (Modals & UI)
// ---------------------------------------------------------------------------
const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-200">
    <div className={`flex flex-col items-center justify-center p-4 sm:p-12 rounded-3xl border-2 sm:border-4 shadow-2xl backdrop-blur-xl max-w-[85vw] sm:max-w-xl mx-auto text-center ${
        type === "success" ? "bg-emerald-900/95 border-emerald-500 text-emerald-100" :
        type === "failure" ? "bg-rose-900/95 border-rose-500 text-rose-100" :
        "bg-cyan-900/95 border-cyan-500 text-cyan-100"
      }`}
    >
      {Icon && <div className="mb-2 sm:mb-4 p-2 sm:p-4 bg-black/20 rounded-full shadow-inner"><Icon className="w-8 h-8 sm:w-16 sm:h-16 animate-bounce"/></div>}
      <h2 className="text-xl sm:text-5xl font-black uppercase tracking-widest drop-shadow-md mb-1 sm:mb-2 leading-tight">{message}</h2>
      {subtext && <p className="text-xs sm:text-xl font-bold opacity-90 tracking-wide">{subtext}</p>}
    </div>
  </div>
);

// --- FULLY REDESIGNED HOW TO PLAY MODAL ---
const RulesModal = ({ onClose }) => (
  <div className="fixed inset-0 z-[200] bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
    <div className="bg-slate-900 border border-emerald-900/50 w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
      
      {/* Header */}
      <div className="shrink-0 p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
        <h2 className="text-xl sm:text-3xl font-black text-emerald-400 flex items-center gap-3">
          <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" /> Field Manual
        </h2>
        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 rounded-full transition-colors">
          <X className="w-5 h-5 sm:w-6 sm:h-6"/>
        </button>
      </div>

      {/* Scrolling Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6 sm:space-y-8 text-slate-300">
        
        {/* Objective & Turn (Side by Side on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
           <div className="bg-emerald-950/30 p-4 sm:p-5 rounded-2xl border border-emerald-900/50 shadow-inner">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
                 <Heart className="text-emerald-400 w-5 h-5"/> The Goal
              </h3>
              <p className="text-sm leading-relaxed">
                 Be the first researcher to build a body with <strong>4 different healthy organs</strong>. 
                 An organ is "healthy" if it has <span className="text-rose-400 font-bold">no viruses</span>. Vaccinated or immunized organs also count as healthy!
              </p>
           </div>
           <div className="bg-blue-950/30 p-4 sm:p-5 rounded-2xl border border-blue-900/50 shadow-inner">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
                 <Play className="text-blue-400 w-5 h-5"/> Your Turn
              </h3>
              <p className="text-sm leading-relaxed">
                 You must do exactly <strong>one</strong> of two things:<br/>
                 <span className="inline-block mt-2 font-bold text-emerald-300">1. Play 1 Card</span> to the board.<br/>
                 <span className="inline-block mt-1 font-bold text-rose-300">2. Discard Cards</span> (any amount, even your whole hand).<br/>
                 <em className="block mt-2 text-[10px] sm:text-xs opacity-75">*You automatically draw back up to 3 cards at the end of your turn.</em>
              </p>
           </div>
        </div>

        <hr className="border-white/5" />

        {/* Core Cards Breakdown */}
        <div>
           <h3 className="text-xl sm:text-2xl font-black text-white mb-4 flex items-center gap-2">
              <FlaskConical className="text-amber-400 w-6 h-6"/> Anatomy & Infection
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 shadow-inner">
                 <div className="flex items-center gap-2 mb-2 text-cyan-400 font-black tracking-widest"><HeartPulse className="w-5 h-5"/> ORGANS</div>
                 <p className="text-xs sm:text-sm">Place these in front of you. You cannot have two organs of the same color. Collect 4 different healthy ones to win.</p>
              </div>
              <div className="bg-rose-950/20 p-4 rounded-2xl border border-rose-900/30 shadow-inner">
                 <div className="flex items-center gap-2 mb-2 text-rose-400 font-black tracking-widest"><Bug className="w-5 h-5"/> VIRUSES</div>
                 <p className="text-xs sm:text-sm">Play on an opponent's organ of the <strong>same color</strong>.<br/>
                 <span className="block mt-2">• <strong>1 Virus:</strong> Infects it (stops them from winning).</span>
                 <span className="block mt-1">• <strong>2 Viruses:</strong> Destroys the organ entirely!</span>
                 <span className="block mt-1">• <strong>vs Medicine:</strong> Destroys a vaccine.</span></p>
              </div>
              <div className="bg-amber-950/20 p-4 rounded-2xl border border-amber-900/30 shadow-inner">
                 <div className="flex items-center gap-2 mb-2 text-amber-400 font-black tracking-widest"><Pill className="w-5 h-5"/> MEDICINES</div>
                 <p className="text-xs sm:text-sm">Play on your organ of the <strong>same color</strong>.<br/>
                 <span className="block mt-2">• <strong>vs Virus:</strong> Cures/removes an infection.</span>
                 <span className="block mt-1">• <strong>1 Medicine:</strong> Vaccinates the organ.</span>
                 <span className="block mt-1">• <strong>2 Medicines:</strong> IMMUNIZES it permanently!</span></p>
              </div>
           </div>
           
           <div className="mt-4 bg-gradient-to-r from-rose-900/20 via-emerald-900/20 to-blue-900/20 p-3 sm:p-4 rounded-xl border border-white/10 flex items-center gap-3 shadow-inner">
              <Sparkles className="text-white w-6 h-6 sm:w-8 sm:h-8 shrink-0"/>
              <p className="text-xs sm:text-sm"><strong className="text-white tracking-widest uppercase">The Multicolor Wildcard:</strong> Rainbow organs can take ANY virus or medicine. Rainbow viruses/medicines can be played on ANY organ!</p>
           </div>
        </div>

        <hr className="border-white/5" />

        {/* Action Cards Details */}
        <div>
           <h3 className="text-xl sm:text-2xl font-black text-white mb-4 flex items-center gap-2">
              <Activity className="text-fuchsia-400 w-6 h-6"/> Treatment Cards
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex gap-3 bg-fuchsia-950/20 p-3 sm:p-4 rounded-xl border border-fuchsia-900/30 items-start shadow-inner">
                 <Hand className="text-fuchsia-400 w-6 h-6 shrink-0 mt-0.5"/>
                 <div>
                    <strong className="text-fuchsia-300 block mb-1 tracking-widest">ORGAN THIEF</strong>
                    <p className="text-xs sm:text-sm opacity-90">Steal an organ from another player and add it to your body. You can steal healthy, vaccinated, or infected organs, but <strong>not</strong> immunized ones.</p>
                 </div>
              </div>
              <div className="flex gap-3 bg-fuchsia-950/20 p-3 sm:p-4 rounded-xl border border-fuchsia-900/30 items-start shadow-inner">
                 <Shuffle className="text-fuchsia-400 w-6 h-6 shrink-0 mt-0.5"/>
                 <div>
                    <strong className="text-fuchsia-300 block mb-1 tracking-widest">TRANSPLANT</strong>
                    <p className="text-xs sm:text-sm opacity-90">Swap any two organs between any two players (yours or theirs). Cannot swap immunized organs.</p>
                 </div>
              </div>
              <div className="flex gap-3 bg-fuchsia-950/20 p-3 sm:p-4 rounded-xl border border-fuchsia-900/30 items-start shadow-inner">
                 <Biohazard className="text-fuchsia-400 w-6 h-6 shrink-0 mt-0.5"/>
                 <div>
                    <strong className="text-fuchsia-300 block mb-1 tracking-widest">CONTAGION</strong>
                    <p className="text-xs sm:text-sm opacity-90">Move viruses from your infected organs to any valid free organs belonging to your opponents.</p>
                 </div>
              </div>
              <div className="flex gap-3 bg-fuchsia-950/20 p-3 sm:p-4 rounded-xl border border-fuchsia-900/30 items-start shadow-inner">
                 <ShieldAlert className="text-fuchsia-400 w-6 h-6 shrink-0 mt-0.5"/>
                 <div>
                    <strong className="text-fuchsia-300 block mb-1 tracking-widest">LATEX GLOVE</strong>
                    <p className="text-xs sm:text-sm opacity-90">All other players instantly discard their entire hand. They miss their next turn to draw back up to 3 cards.</p>
                 </div>
              </div>
              <div className="flex gap-3 bg-fuchsia-950/20 p-3 sm:p-4 rounded-xl border border-fuchsia-900/30 items-start sm:col-span-2 shadow-inner">
                 <Activity className="text-fuchsia-400 w-6 h-6 shrink-0 mt-0.5"/>
                 <div>
                    <strong className="text-fuchsia-300 block mb-1 tracking-widest">MEDICAL ERROR</strong>
                    <p className="text-xs sm:text-sm opacity-90">Swap your <strong>entire body</strong> (organs, viruses, medicines) with another player! This is the only card that ignores immunizations.</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
      
      {/* Footer */}
      <div className="shrink-0 p-4 sm:p-6 border-t border-white/10 bg-black/40 flex justify-center">
         <button onClick={onClose} className="w-full sm:w-auto px-10 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 tracking-widest uppercase">
           Got It, Let's Play
         </button>
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
    const saved = localStorage.getItem("angryvirus_roomId");
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
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-green-500/50">
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
        Inspired by Virus. A tribute game.
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
export default function ImmuneGame() {
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
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const feedbackTimeoutRef = useRef(null);

  // Hand Selection State
  const [selectedCards, setSelectedCards] = useState([]);
  const [transplantA, setTransplantA] = useState(null);

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
        const savedName = localStorage.getItem("gameHub_playerName") || localStorage.getItem("immune_playerName");
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
          setRoomId(""); localStorage.removeItem("immune_roomId"); setView("menu"); setError("You have been disconnected."); return;
        }
        setGameState(data);
        if (data.status === "playing" || data.status === "finished") setView("game");
        else if (data.status === "lobby") setView("lobby");
      } else {
        setView("menu"); setRoomId(""); localStorage.removeItem("immune_roomId"); setError("The lab was closed.");
      }
    }, (err) => { console.error(err); setError("Connection lost."); });
    return () => unsub();
  }, [roomId, user]);

  const handleSplashStart = () => {
    const savedRoomId = localStorage.getItem("immune_roomId");
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
        icon: latestLog.type === "success" ? Sparkles : (latestLog.type === "failure" ? AlertTriangle : Bug),
      });
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 3000);
    }
  }, [gameState?.logs]);

  useEffect(() => { setTransplantA(null); }, [selectedCards]);

  // ---------------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------------
  const createRoom = async () => {
    if (!playerName) return setError("Enter Name");
    localStorage.setItem("gameHub_playerName", playerName); localStorage.setItem("immune_playerName", playerName); setLoading(true);
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const initialData = {
      roomId: newId, hostId: user.uid, status: "lobby",
      players: [{ id: user.uid, name: playerName, colorIdx: 0, wins: 0, hand: [], body: [], skipTurn: false }],
      deck: [], discardPile: [], turnIndex: 0, logs: []
    };
    try {
      await setDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId), initialData);
      setRoomId(newId); localStorage.setItem("immune_roomId", newId);
    } catch (e) { setError("Failed to create lab."); }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCode || !playerName) return setError("Enter details");
    localStorage.setItem("gameHub_playerName", playerName); localStorage.setItem("immune_playerName", playerName); setLoading(true);
    try {
      const code = roomCode.toUpperCase().trim();
      const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", code);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data().status === "lobby") {
        const data = snap.data();
        if (!data.players.some((p) => p.id === user.uid)) {
          if (data.players.length >= 6) { setError("The lab is full."); setLoading(false); return; }
          const newPlayers = [...data.players, { id: user.uid, name: playerName, colorIdx: data.players.length, wins: 0, hand: [], body: [], skipTurn: false }];
          await updateDoc(ref, { players: newPlayers });
        }
        setRoomId(code); localStorage.setItem("immune_roomId", code);
      } else setError("Room not found or game in progress.");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId).then(() => { setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }).catch(err => {
      const el = document.createElement("textarea"); el.value = roomId; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
      setIsCopied(true); setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const startGame = async () => {
    let deck = GENERATE_DECK();
    let players = gameState.players.map(p => ({ ...p, hand: [], body: [], skipTurn: false }));
    
    players.forEach(p => {
       for(let i=0; i<3; i++) p.hand.push(deck.pop());
    });

    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      status: "playing", players, deck, discardPile: [], turnIndex: 0,
      logs: arrayUnion(triggerLog("The infection spreads. Game started!", "neutral", true, "START"))
    });
  };

  const handleLeave = async () => {
    if (!roomId) return;
    try {
      const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);
      if (gameState.hostId === user.uid) {
         const data = (await getDoc(ref)).data();
         if (data.status !== "finished") await deleteDoc(ref);
      }
      else { 
         let state = JSON.parse(JSON.stringify(gameState));
         state.players = state.players.filter((p) => p.id !== user.uid);
         await updateDoc(ref, state); 
      }
    } catch (e) { console.log("Room gone"); }
    localStorage.removeItem("immune_roomId"); setRoomId(""); setView("menu"); setShowLeaveConfirm(false); setGameState(null);
  };

  const kickPlayer = async (targetId) => {
    if (!gameState || gameState.hostId !== user.uid) return;
    try {
      let state = JSON.parse(JSON.stringify(gameState));
      state.players = state.players.filter((p) => p.id !== targetId);
      state.logs.push(triggerLog("A player was removed.", "warning"));
      await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), state);
    } catch (e) { console.error("Error kicking player:", e); }
  };

  const returnToLobby = async () => {
    if (gameState.hostId !== user.uid) return;
    const players = gameState.players.map((p) => ({ ...p, hand: [], body: [], skipTurn: false }));
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      status: "lobby", players, deck: [], discardPile: [], turnIndex: 0, logs: []
    });
  };

  const toggleSelect = (idx) => {
    if (selectedCards.includes(idx)) setSelectedCards(selectedCards.filter(i => i !== idx));
    else setSelectedCards([...selectedCards, idx]);
  };

  const submitDiscard = async () => {
    let state = JSON.parse(JSON.stringify(gameState));
    let me = state.players.find(p => p.id === user.uid);
    let logs = [];
    
    selectedCards.sort((a,b)=>b-a).forEach(idx => {
        state.discardPile.push(me.hand.splice(idx, 1)[0]);
    });
    logs.push(triggerLog(`${me.name} discarded ${selectedCards.length} cards.`, "neutral"));
    
    setSelectedCards([]);
    await finishTurn(state, logs);
  };

  const executeAction = async (actionType, params = null) => {
    let state = JSON.parse(JSON.stringify(gameState));
    let me = state.players.find(p => p.id === user.uid);
    let logs = [];
    const cardIdx = selectedCards[0];
    const card = me.hand[cardIdx];

    try {
        if (actionType === 'ORGAN') {
            if (me.body.some(o => o.color === card.color)) throw new Error("You already have an organ of that color.");
            me.body.push({ ...card, viruses: [], medicines: [] });
            me.hand.splice(cardIdx, 1);
            logs.push(triggerLog(`${me.name} placed a ${card.color} organ.`, "success", true, "NEW ORGAN"));
        }
        else if (actionType === 'VIRUS') {
            const tPlayer = state.players.find(p => p.id === params.targetPlayerId);
            const tOrgan = tPlayer.body.find(o => o.id === params.targetOrganId);
            if (tOrgan.medicines.length >= 2) throw new Error("That organ is immunized!");
            if (tOrgan.color !== card.color && tOrgan.color !== 'MULTI' && card.color !== 'MULTI') throw new Error("Virus color must match the organ.");
            
            me.hand.splice(cardIdx, 1);
            
            if (tOrgan.medicines.length === 1) {
                state.discardPile.push(card, tOrgan.medicines.pop());
                logs.push(triggerLog(`${me.name} destroyed a vaccine on ${tPlayer.name}'s organ.`, "warning", true, "VACCINE DESTROYED"));
            } else if (tOrgan.viruses.length === 1) {
                state.discardPile.push(card, tOrgan.viruses.pop(), tOrgan);
                tPlayer.body = tPlayer.body.filter(o => o.id !== tOrgan.id);
                logs.push(triggerLog(`${me.name} destroyed ${tPlayer.name}'s organ!`, "failure", true, "ORGAN DESTROYED"));
            } else {
                tOrgan.viruses.push(card);
                logs.push(triggerLog(`${me.name} infected ${tPlayer.name}'s organ.`, "warning", true, "INFECTION"));
            }
        }
        else if (actionType === 'MEDICINE') {
            const tPlayer = state.players.find(p => p.id === params.targetPlayerId);
            const tOrgan = tPlayer.body.find(o => o.id === params.targetOrganId);
            if (tOrgan.medicines.length >= 2) throw new Error("That organ is already immunized!");
            if (tOrgan.color !== card.color && tOrgan.color !== 'MULTI' && card.color !== 'MULTI') throw new Error("Medicine color must match the organ.");
            
            me.hand.splice(cardIdx, 1);

            if (tOrgan.viruses.length > 0) {
                state.discardPile.push(card, tOrgan.viruses.pop());
                logs.push(triggerLog(`${me.name} cured a virus on ${tPlayer.name}'s organ.`, "success", true, "CURED"));
            } else {
                tOrgan.medicines.push(card);
                if (tOrgan.medicines.length === 2) logs.push(triggerLog(`${me.name} immunized an organ!`, "success", true, "IMMUNIZED"));
                else logs.push(triggerLog(`${me.name} vaccinated an organ.`, "success", true, "VACCINATED"));
            }
        }
        else if (actionType === 'THIEF') {
            const tPlayer = state.players.find(p => p.id === params.targetPlayerId);
            const tOrgan = tPlayer.body.find(o => o.id === params.targetOrganId);
            if (tOrgan.medicines.length >= 2) throw new Error("Cannot steal an immunized organ!");
            if (me.body.some(o => o.color === tOrgan.color)) throw new Error("You already have an organ of that color.");
            
            me.hand.splice(cardIdx, 1);
            tPlayer.body = tPlayer.body.filter(o => o.id !== tOrgan.id);
            me.body.push(tOrgan);
            state.discardPile.push(card);
            logs.push(triggerLog(`${me.name} stole ${tPlayer.name}'s organ!`, "warning", true, "ORGAN STOLEN"));
        }
        else if (actionType === 'TRANSPLANT') {
            const pA = state.players.find(p => p.id === params.organA.targetPlayerId);
            const oA = pA.body.find(o => o.id === params.organA.targetOrganId);
            const pB = state.players.find(p => p.id === params.organB.targetPlayerId);
            const oB = pB.body.find(o => o.id === params.organB.targetOrganId);
            
            if (pA.id === pB.id) throw new Error("Transplants must happen between two different players.");
            if (oA.medicines.length >= 2 || oB.medicines.length >= 2) throw new Error("Cannot transplant immunized organs!");
            
            const pABodyWithoutA = pA.body.filter(o => o.id !== oA.id);
            const pBBodyWithoutB = pB.body.filter(o => o.id !== oB.id);
            if (pABodyWithoutA.some(o => o.color === oB.color && oB.color !== 'MULTI')) throw new Error(`${pA.name} already has a ${oB.color} organ.`);
            if (pBBodyWithoutB.some(o => o.color === oA.color && oA.color !== 'MULTI')) throw new Error(`${pB.name} already has a ${oA.color} organ.`);
            
            me.hand.splice(cardIdx, 1);
            pA.body = [...pABodyWithoutA, oB];
            pB.body = [...pBBodyWithoutB, oA];
            state.discardPile.push(card);
            logs.push(triggerLog(`${me.name} performed a transplant between ${pA.name} and ${pB.name}!`, "warning", true, "TRANSPLANT"));
        }
        else if (actionType === 'ERROR') {
            const tPlayer = state.players.find(p => p.id === params.targetPlayerId);
            if (tPlayer.id === me.id) throw new Error("Cannot swap with yourself.");
            
            me.hand.splice(cardIdx, 1);
            const temp = me.body;
            me.body = tPlayer.body;
            tPlayer.body = temp;
            state.discardPile.push(card);
            logs.push(triggerLog(`${me.name} caused a Medical Error! Swapped bodies with ${tPlayer.name}!`, "failure", true, "MEDICAL ERROR"));
        }
        else if (actionType === 'CONTAGION') {
            me.hand.splice(cardIdx, 1);
            let spreadCount = 0;
            me.body.forEach(myOrgan => {
               if (myOrgan.viruses.length > 0) {
                  const topVirus = myOrgan.viruses[myOrgan.viruses.length - 1]; 
                  for (let p of state.players) {
                     if (p.id === me.id) continue;
                     let validOrgan = p.body.find(o => 
                         (o.color === topVirus.color || o.color === 'MULTI' || topVirus.color === 'MULTI') &&
                         o.medicines.length < 2 && o.viruses.length === 0
                     );
                     if (validOrgan) {
                         const v = myOrgan.viruses.pop();
                         if (validOrgan.medicines.length === 1) state.discardPile.push(v, validOrgan.medicines.pop());
                         else validOrgan.viruses.push(v);
                         spreadCount++;
                         break;
                     }
                  }
               }
            });
            state.discardPile.push(card);
            logs.push(triggerLog(`${me.name} spread contagion! ${spreadCount} viruses moved.`, "warning", true, "CONTAGION"));
        }
        else if (actionType === 'GLOVE') {
            me.hand.splice(cardIdx, 1);
            state.players.forEach(p => {
               if (p.id !== me.id) {
                   state.discardPile.push(...p.hand);
                   p.hand = [];
                   p.skipTurn = true;
               }
            });
            state.discardPile.push(card);
            logs.push(triggerLog(`${me.name} used Latex Glove! Everyone else discarded their hands.`, "failure", true, "LATEX GLOVE"));
        }

        setSelectedCards([]);
        setTransplantA(null);
        await finishTurn(state, logs);

    } catch (err) {
        alert(err.message);
    }
  };

  const finishTurn = async (state, logs) => {
    let me = state.players[state.turnIndex];
    
    const draw = (player) => {
        while(player.hand.length < 3) {
            if (state.deck.length === 0) {
                if (state.discardPile.length === 0) break;
                state.deck = state.discardPile.sort(()=>Math.random()-0.5);
                state.discardPile = [];
                logs.push(triggerLog("Deck reshuffled from discard pile.", "neutral"));
            }
            player.hand.push(state.deck.pop());
        }
    };
    draw(me);
    
    let winner = state.players.find(checkWinCondition);
    if (winner) {
        state.status = 'finished';
        winner.wins += 1;
        logs.push(triggerLog(`${winner.name} has completed their body!`, "important", true, "VICTORY!"));
    } else {
        let nextIdx = (state.turnIndex + 1) % state.players.length;
        while(state.players[nextIdx].skipTurn) {
            state.players[nextIdx].skipTurn = false;
            draw(state.players[nextIdx]);
            logs.push(triggerLog(`${state.players[nextIdx].name} missed their turn due to Latex Glove.`, "warning", true, "TURN SKIPPED"));
            nextIdx = (nextIdx + 1) % state.players.length;
        }
        state.turnIndex = nextIdx;
    }
    
    state.logs = arrayUnion(...logs);
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), state);
  };

  const handleBoardClick = (targetPlayerId, targetOrganId) => {
     if (selectedCards.length !== 1) return;
     const card = gameState.players.find(p=>p.id===user.uid).hand[selectedCards[0]];
     
     if (card.type === 'VIRUS') executeAction('VIRUS', { targetPlayerId, targetOrganId });
     else if (card.type === 'MEDICINE') executeAction('MEDICINE', { targetPlayerId, targetOrganId });
     else if (card.type === 'ACTION' && card.action === 'THIEF') executeAction('THIEF', { targetPlayerId, targetOrganId });
     else if (card.type === 'ACTION' && card.action === 'TRANSPLANT') {
         if (!transplantA) setTransplantA({ targetPlayerId, targetOrganId });
         else executeAction('TRANSPLANT', { organA: transplantA, organB: { targetPlayerId, targetOrganId }});
     }
  };

  const handlePlayerClick = (targetPlayerId) => {
     if (selectedCards.length !== 1) return;
     const card = gameState.players.find(p=>p.id===user.uid).hand[selectedCards[0]];
     if (card.type === 'ACTION' && card.action === 'ERROR') executeAction('ERROR', { targetPlayerId });
  };

  const isOpponentOrganTargetable = (organ, me) => {
    if (selectedCards.length !== 1) return false;
    const card = me.hand[selectedCards[0]];
    if (card.type === 'VIRUS' && organ.medicines.length < 2 && (organ.color === card.color || organ.color === 'MULTI' || card.color === 'MULTI')) return true;
    if (card.type === 'ACTION' && card.action === 'THIEF' && organ.medicines.length < 2 && !me.body.some(o => o.color === organ.color)) return true;
    if (card.type === 'ACTION' && card.action === 'TRANSPLANT' && organ.medicines.length < 2) return true;
    return false;
  };
  
  const isMyOrganTargetable = (organ, me) => {
    if (selectedCards.length !== 1) return false;
    const card = me.hand[selectedCards[0]];
    if (card.type === 'MEDICINE' && organ.medicines.length < 2 && (organ.color === card.color || organ.color === 'MULTI' || card.color === 'MULTI')) return true;
    if (card.type === 'ACTION' && card.action === 'TRANSPLANT' && organ.medicines.length < 2) return true;
    return false;
  };
  
  const isPlayerTargetable = (playerId, me) => {
    if (selectedCards.length !== 1) return false;
    const card = me.hand[selectedCards[0]];
    if (card.type === 'ACTION' && card.action === 'ERROR' && playerId !== me.id) return true;
    return false;
  };

  // ---------------------------------------------------------------------------
  // RENDER LOGIC
  // ---------------------------------------------------------------------------
  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <GlobalStyles/>
        <LogoBig />
        <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10 mb-8">
        </div>
        <div className="bg-emerald-900/10 p-6 sm:p-8 rounded-2xl border border-emerald-900/30 max-w-sm w-full">
          <Hammer className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500 mx-auto mb-4 animate-bounce"/>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Lab is Closed</h1>
          <p className="text-sm sm:text-base text-zinc-400">Maintenance is currently underway. Return soon.</p>
        </div>
        <div className="h-8"></div>
        <a href={import.meta.env.BASE_URL}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-center pb-12 animate-pulse">
              <div className="inline-flex items-center gap-2 sm:gap-3 px-6 py-3 sm:px-8 sm:py-4 bg-zinc-900/50 rounded-full border border-emerald-900/20 text-emerald-300 font-bold tracking-widest text-sm sm:text-base uppercase backdrop-blur-sm"><StepBack size={16}/> Return to Gamehub <StepBack size={16}/></div>
            </div>
          </div>
        </a>
        <Logo />
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-emerald-500 animate-pulse font-mono tracking-widest text-sm sm:text-base">Connecting...</div>;
  }

  if (view === "splash") return <SplashScreen onStart={handleSplashStart}/>;

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
        <GlobalStyles/>
        <DarkAtmosphere/>
        <nav className="absolute top-0 left-0 w-full p-4 z-50">
          <a href={import.meta.env.BASE_URL} className="flex items-center gap-2 text-emerald-800 rounded-lg font-bold shadow-md hover:text-emerald-400 transition-colors w-fit animate-pulse text-base sm:text-lg"><StepBack className="w-5 h-5 sm:w-6 sm:h-6"/><span>Back to Gamehub</span></a>
        </nav>
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
        <div className="z-10 text-center mb-6 sm:mb-10 mt-6">
          <HeartPulse className="w-20 h-20 sm:w-24 sm:h-24 text-emerald-500 mx-auto mb-2 sm:mb-4"/>
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-teal-700 tracking-tighter drop-shadow-md">IMMUNE</h1>
          <p className="text-emerald-200/40 tracking-[0.3em] sm:tracking-[0.5em] uppercase mt-1 sm:mt-2 text-xs sm:text-sm font-bold">Infect. Cure. Survive.</p>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl z-10 relative">
          {error && <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-3 mb-4 rounded text-center text-sm font-bold flex items-center justify-center gap-2"><AlertTriangle className="w-5 h-5"/> {error}</div>}
          <div className="space-y-4">
            <input className="w-full bg-black/50 border border-emerald-900/50 focus:border-emerald-400 p-4 rounded-xl text-white outline-none transition-all text-base sm:text-lg font-bold text-center shadow-inner" placeholder="YOUR NAME" value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={12} />
            <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2">
              <button onClick={createRoom} disabled={loading} className="bg-gradient-to-br from-emerald-500 to-teal-700 hover:from-emerald-400 hover:to-teal-600 p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-300/30"><HeartPulse className="w-6 h-6"/> <span className="text-sm sm:text-base">Create</span></button>
              <div className="flex flex-col gap-2">
                <input className="bg-black/50 border border-emerald-900/50 focus:border-emerald-400 p-2 rounded-xl text-white text-center uppercase font-mono font-bold tracking-widest outline-none h-12 text-sm sm:text-base shadow-inner" placeholder="CODE" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} maxLength={6} />
                <button onClick={joinRoom} disabled={loading} className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-xl font-bold text-zinc-300 transition-all active:scale-95 h-full text-sm sm:text-base border border-white/5">Join</button>
              </div>
            </div>
            <button onClick={() => setShowGuide(true)} className="w-full mt-2 sm:mt-4 text-emerald-500 hover:text-emerald-400 text-sm font-bold flex items-center justify-center gap-2 transition-colors py-2"><BookOpen className="w-5 h-5"/> How to Play</button>
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
        <LogoBig />
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
        <div className="z-10 w-full max-w-lg bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-8 mt-4 sm:mt-6">
          <div className="flex justify-between items-center mb-4 sm:mb-8 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl flex items-center gap-2 text-emerald-400 font-black uppercase tracking-widest"><FlaskConical className="w-6 h-6"/> Lab Code</h2>
              <div className="flex items-center gap-2 sm:gap-3 mt-1">
                <div className="text-3xl sm:text-4xl font-mono text-white font-black drop-shadow-md">{roomId}</div>
                <div className="relative">
                  <button onClick={copyToClipboard} className="p-2 bg-white/5 hover:bg-white/20 rounded-full transition-colors text-zinc-300 hover:text-white border border-white/10">{isCopied ? <CheckCircle className="w-5 h-5 text-emerald-400"/> : <Copy className="w-5 h-5"/>}</button>
                  {isCopied && <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-fade-in-up whitespace-nowrap">Copied!</div>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowLeaveConfirm(true)} className="p-2 bg-white/5 hover:bg-rose-900/50 rounded-full text-rose-400 transition-colors border border-white/10"><LogOut className="w-6 h-6"/></button>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-8">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2"><User size={16} /> Researchers ({gameState.players.length}/6)</h3>
            {gameState.players.map((p) => (
              <div key={p.id} className="flex justify-between items-center bg-black/30 p-3 sm:p-4 rounded-xl border border-white/5 shadow-inner">
                <span className="font-bold flex items-center gap-2 sm:gap-3 text-sm sm:text-lg">
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${PLAYER_COLORS[p.colorIdx].bg} shadow-md`} /> {p.name} {p.id === gameState.hostId && <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.6)]"/>}
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
              <button onClick={startGame} disabled={!canStart} className="w-full flex justify-center items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-black tracking-widest text-base sm:text-lg transition-all bg-gradient-to-br from-emerald-500 to-teal-700 text-white hover:from-emerald-400 hover:to-teal-600 hover:scale-[1.02] shadow-[0_0_25px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:hover:scale-100 border border-emerald-300/30"><HeartPulse className="w-5 h-5 sm:w-6 sm:h-6"/> Start Outbreak</button>
              {!canStart && <div className="text-center text-xs font-bold text-emerald-500 uppercase tracking-wider mt-1">Requires 2 to 6 players to start</div>}
            </div>
          ) : <div className="text-center text-zinc-400 text-sm font-bold uppercase tracking-widest animate-pulse border border-white/5 bg-black/30 py-3 sm:py-4 rounded-xl">Waiting for host...</div>}
        </div>

        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 p-5 sm:p-6 rounded-2xl max-w-xs w-full text-center shadow-2xl">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase">Leave Lab?</h3>
              <p className="text-zinc-400 mb-4 sm:mb-6 text-xs sm:text-sm">{gameState.hostId === user.uid ? "As Host, leaving ends the game for everyone." : "You will disconnect from this session."}</p>
              <div className="flex gap-2">
                <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold text-zinc-300 text-sm sm:text-base transition-colors">Stay</button>
                <button onClick={handleLeave} className="flex-1 bg-rose-600 hover:bg-rose-500 py-3 rounded-xl font-bold text-white text-sm sm:text-base transition-colors shadow-[0_0_15px_rgba(225,29,72,0.4)]">Leave</button>
              </div>
            </div>
          </div>
        )}
        <Logo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const meIdx = gameState.players.findIndex((p) => p.id === user.uid);
    const me = gameState.players[meIdx];
    const isMyTurn = gameState.turnIndex === meIdx;
    const activePlayer = gameState.players[gameState.turnIndex];

    const renderActionBar = () => {
        if (!isMyTurn) return <div className="w-full text-center text-zinc-500 text-xs sm:text-sm font-bold uppercase tracking-widest py-3 bg-black/20 rounded-xl">Waiting for {activePlayer?.name}</div>;
        if (selectedCards.length === 0) return <div className="w-full text-center text-zinc-400 text-xs sm:text-sm font-bold uppercase tracking-widest py-3 bg-white/5 border border-white/10 rounded-xl shadow-inner">Select cards in your hand</div>;
        
        if (selectedCards.length > 1) {
            return <button onClick={submitDiscard} className="w-full bg-rose-600 hover:bg-rose-500 py-3 rounded-xl font-black tracking-widest text-white uppercase shadow-lg transition-all text-xs sm:text-sm">Discard {selectedCards.length} Cards</button>;
        }
        
        const c = me.hand[selectedCards[0]];
        const btnClasses = "flex-1 py-3 sm:py-4 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all text-xs sm:text-sm flex justify-center items-center text-center leading-tight";

        if (c.type === 'ORGAN') {
            const isValid = !me.body.some(o => o.color === c.color);
            return (
                <div className="flex gap-2 w-full">
                    <button onClick={submitDiscard} className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-3 sm:py-4 rounded-xl font-bold text-white uppercase text-xs">Discard</button>
                    {isValid ? (
                        <button onClick={()=>executeAction('ORGAN')} className={`${btnClasses} bg-emerald-600 hover:bg-emerald-500 text-white`}>Play Organ</button>
                    ) : (
                        <div className={`${btnClasses} bg-zinc-800 text-zinc-500 cursor-not-allowed`}>Duplicate</div>
                    )}
                </div>
            );
        }
        if (c.type === 'ACTION' && c.action === 'CONTAGION') {
            return (
                <div className="flex gap-2 w-full">
                    <button onClick={submitDiscard} className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-3 sm:py-4 rounded-xl font-bold text-white uppercase text-xs">Discard</button>
                    <button onClick={()=>executeAction('CONTAGION')} className={`${btnClasses} bg-fuchsia-600 hover:bg-fuchsia-500 text-white animate-pulse`}>Contagion</button>
                </div>
            );
        }
        if (c.type === 'ACTION' && c.action === 'GLOVE') {
            return (
                <div className="flex gap-2 w-full">
                    <button onClick={submitDiscard} className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-3 sm:py-4 rounded-xl font-bold text-white uppercase text-xs">Discard</button>
                    <button onClick={()=>executeAction('GLOVE')} className={`${btnClasses} bg-fuchsia-600 hover:bg-fuchsia-500 text-white animate-pulse`}>Latex Glove</button>
                </div>
            );
        }
        
        let targetText = "Select Target on Board";
        if (c.type === 'ACTION' && c.action === 'TRANSPLANT') targetText = transplantA ? "Select 2nd Organ" : "Select 1st Organ";
        if (c.type === 'ACTION' && c.action === 'ERROR') targetText = "Select Opponent Profile";
        
        return (
            <div className="flex gap-2 w-full">
                <button onClick={submitDiscard} className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-3 sm:py-4 rounded-xl font-bold text-white uppercase text-xs">Discard</button>
                <div className={`${btnClasses} bg-cyan-900/50 border border-cyan-500 text-cyan-300 animate-pulse`}>{targetText}</div>
            </div>
        );
    }

    return (
      <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col overflow-hidden font-sans select-none">
        <GlobalStyles/>
        <DarkAtmosphere/>

        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 p-5 sm:p-6 rounded-2xl max-w-xs w-full text-center shadow-2xl">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase">Abandon Game?</h3>
              <p className="text-zinc-400 mb-4 sm:mb-6 text-xs sm:text-sm">{gameState.hostId === user.uid ? "Leaving deletes the game for everyone." : "You will leave this ongoing game."}</p>
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

        {/* TOP BAR */}
        <div className="h-14 sm:h-16 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-2 z-[160] shrink-0 shadow-lg relative">
          <div className="flex items-center gap-3 sm:gap-4 relative z-10">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-400/50 ml-1 sm:ml-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"><HeartPulse className="text-emerald-400 w-4 h-4 sm:w-5 sm:h-5"/></div>
            <div>
              <div className="font-black text-xs sm:text-sm tracking-widest text-white drop-shadow-md">IMMUNE</div>
              <div className="text-[10px] sm:text-[10px] font-bold uppercase tracking-wider">
                 <span className="text-zinc-400">Turn:</span> <span className="text-emerald-400">{activePlayer?.name}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 relative z-10">
            <button onClick={() => setShowGuide(true)} className="p-2 hover:bg-white/10 rounded-full text-zinc-300 hover:text-white transition-colors"><BookOpen className="w-5 h-5"/></button>
            <button onClick={() => setShowLogs(!showLogs)} className={`p-2 rounded-full transition-colors ${showLogs ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-300 hover:bg-white/10"}`}><History className="w-5 h-5"/></button>
            <button onClick={() => setShowLeaveConfirm(true)} className="p-2 hover:bg-rose-900/50 rounded-full text-rose-400 transition-colors ml-0.5"><LogOut className="w-5 h-5"/></button>
          </div>
        </div>

        {/* LOGS OVERLAY */}
        {showLogs && (
          <div className="fixed top-14 sm:top-16 right-2 sm:right-4 w-56 sm:w-64 max-h-56 sm:max-h-60 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl z-[155] overflow-y-auto p-2 shadow-2xl custom-scrollbar">
            <h4 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest mb-2 sticky top-0 bg-slate-900/95 py-2 border-b border-white/5">World History</h4>
            <div className="space-y-2 mt-2">
              {gameState.logs.slice().reverse().map((log) => (
                <div key={log.id} className={`text-[10px] sm:text-xs p-2.5 rounded-xl border-l-4 font-bold ${log.type === "success" ? "border-emerald-400 bg-emerald-900/20 text-emerald-100" : log.type === "warning" ? "border-amber-400 bg-amber-900/20 text-amber-100" : log.type === "failure" ? "border-rose-400 bg-rose-900/20 text-rose-100" : "border-zinc-500 bg-black/30 text-zinc-300"}`}>
                  {log.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OPPONENTS AREA */}
        <div className="w-full bg-black/40 border-b border-white/5 flex overflow-x-auto custom-scrollbar p-3 sm:p-4 gap-4 shadow-inner shrink-0">
           {gameState.players.filter(p => p.id !== user.uid).map(p => {
              const isTurn = gameState.turnIndex === gameState.players.findIndex(x=>x.id===p.id);
              const isTargetable = isPlayerTargetable(p.id, me);

              return (
                 <div 
                   key={p.id} 
                   className={`flex flex-col w-fit min-w-[140px] sm:min-w-[180px] bg-slate-800/80 p-2.5 sm:p-3 rounded-2xl border transition-all ${isTurn ? 'border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-white/10'} ${isTargetable ? 'ring-4 ring-cyan-400 animate-pulse cursor-pointer' : ''}`}
                 >
                    <div className="flex justify-between items-center mb-2" onClick={() => { if(isTargetable) handlePlayerClick(p.id); }}>
                       <span className={`text-[10px] sm:text-sm font-black text-white truncate max-w-[80px] sm:max-w-[120px] ${isTargetable ? 'cursor-pointer' : ''}`}>{p.name}</span>
                       <span className="text-[8px] sm:text-[10px] font-bold bg-black/50 px-1.5 py-0.5 rounded text-yellow-400">{p.wins} Wins</span>
                    </div>
                    {/* The Tidy Grid Layout for Opponents */}
                    <div className={`grid gap-2 justify-items-center ${p.body.length === 5 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                       {p.body.map(organ => (
                          <OrganView 
                             key={organ.id} 
                             organ={organ} 
                             size="sm"
                             isTargetable={isOpponentOrganTargetable(organ, me)}
                             onClick={() => { if (isOpponentOrganTargetable(organ, me)) handleBoardClick(p.id, organ.id); }} 
                          />
                       ))}
                       {p.body.length === 0 && <div className="col-span-full text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-widest italic w-full text-center py-4">No Organs</div>}
                    </div>
                 </div>
              )
           })}
        </div>

        {/* MY BODY AREA */}
        <div className="flex-1 relative bg-transparent overflow-y-auto custom-scrollbar flex flex-col pt-4 pb-36 sm:pb-48">
          <div className="w-full flex justify-center mb-6">
             <div className={`px-6 py-2 rounded-full border border-white/10 shadow-lg text-xs sm:text-sm font-black uppercase tracking-widest ${isMyTurn ? 'bg-emerald-900/80 text-emerald-300 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.4)] border-emerald-500' : 'bg-black/50 text-zinc-500'}`}>
                {isMyTurn ? "Your Turn" : "Waiting..."}
             </div>
          </div>
          
          <div className="flex flex-nowrap overflow-x-auto custom-scrollbar justify-center items-center gap-3 sm:gap-6 w-full max-w-5xl mx-auto px-4 mt-auto mb-auto pt-4 pb-8">
             {me?.body.map(organ => (
                <div key={organ.id} className="shrink-0">
                    <OrganView 
                       organ={organ} 
                       size="md"
                       isTargetable={isMyOrganTargetable(organ, me)}
                       onClick={() => { if(isMyOrganTargetable(organ, me)) handleBoardClick(me.id, organ.id); }}
                    />
                </div>
             ))}
             {me?.body.length === 0 && (
                <div className="text-zinc-600 font-bold uppercase tracking-widest text-sm sm:text-base border-2 border-dashed border-zinc-700 px-12 py-8 rounded-2xl shrink-0">
                   Your Body is Empty
                </div>
             )}
          </div>
        </div>

        {/* BOTTOM UI CONTROLS */}
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 flex flex-col z-[60] shadow-[0_-15px_30px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 bg-black/30 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 rounded-full uppercase drop-shadow-md">{me?.wins || 0} Wins</span>
            </div>
            <div className="text-[10px] sm:text-xs font-black text-zinc-300 bg-white/5 border border-white/10 px-3 py-0.5 rounded-full uppercase tracking-widest">
               Deck: {gameState.deck.length} | Discard: {gameState.discardPile.length}
            </div>
          </div>

          <div className="flex flex-col p-3 sm:p-4 gap-3 sm:gap-4 justify-center items-center w-full max-w-3xl mx-auto">
              
              {/* My Hand */}
              <div className="flex justify-center gap-3 sm:gap-4 overflow-x-auto custom-scrollbar py-2 px-4 w-full">
                 {me?.hand.map((card, idx) => (
                    <GameCard 
                       key={card.id} 
                       card={card} 
                       size="md"
                       isSelected={selectedCards.includes(idx)}
                       disabled={!isMyTurn}
                       onClick={() => { if(isMyTurn) toggleSelect(idx); }}
                    />
                 ))}
                 {me?.hand.length === 0 && <div className="text-zinc-500 text-xs py-8 italic font-bold">Hand is empty...</div>}
              </div>

              {/* Action Bar */}
              <div className="w-full">
                 {renderActionBar()}
              </div>
          </div>
        </div>

        {/* END GAME MODAL */}
        {gameState.status === "finished" && (
          <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-xl flex items-center justify-center pt-16 sm:pt-20 pb-10 px-4">
            <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-emerald-500/50 text-center shadow-[0_0_80px_rgba(16,185,129,0.3)] animate-in zoom-in max-w-lg w-full flex flex-col relative max-h-[90vh]">
              <div className="shrink-0 mb-4 sm:mb-6">
                <Heart className="w-20 h-20 sm:w-24 sm:h-24 text-emerald-400 mx-auto mb-2 sm:mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]"/>
                <h2 className="text-4xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 uppercase mb-1 sm:mb-2 leading-tight drop-shadow-xl truncate px-2">
                  {gameState.players.slice().sort((a,b)=>b.wins - a.wins)[0]?.name}
                </h2>
                <p className="text-emerald-400 font-black tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-sm uppercase drop-shadow-md">Survives!</p>
              </div>
              
              <div className="space-y-3 mb-6 sm:mb-8 overflow-y-auto custom-scrollbar flex-1 px-1">
                 {gameState.players.slice().sort((a,b)=>b.wins - a.wins).map((p, i) => (
                    <div key={p.id} className={`flex justify-between items-center px-4 sm:px-6 py-3 rounded-2xl border ${i===0 ? "bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-black/40 border-white/5 shadow-inner"}`}>
                        <span className="font-black text-white text-base sm:text-xl tracking-wide truncate mr-2 drop-shadow-md">{i+1}. {p.name}</span>
                        <span className="font-black text-yellow-400 text-lg sm:text-2xl shrink-0 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{p.wins} Wins</span>
                    </div>
                 ))}
              </div>

              {gameState.hostId === user.uid ? (
                <div className="shrink-0 pt-2">
                  <button onClick={returnToLobby} className="bg-gradient-to-br from-emerald-500 to-teal-700 hover:from-emerald-400 hover:to-teal-600 border border-emerald-300/50 px-6 py-4 rounded-2xl font-black w-full text-white transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)] text-sm sm:text-base">Play Again</button>
                </div>
              ) : (
                <div className="shrink-0 pt-2">
                  <button disabled className="bg-zinc-800 border border-white/5 px-6 py-4 rounded-2xl font-black w-full text-zinc-500 uppercase tracking-widest text-sm sm:text-base shadow-inner">Waiting for Host...</button>
                </div>
              )}
            </div>
          </div>
        )}
        <Logo />
      </div>
    );
  }

  return null;
}