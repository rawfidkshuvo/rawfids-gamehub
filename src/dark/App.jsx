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
  Skull,
  Ghost,
  Eye,
  Flame,
  Shield,
  Sparkles,
  Map,
  Feather,
  Moon,
  Trophy,
  Play,
  Copy,
  LogOut,
  History,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  X,
  Swords,
  Crown,
  Ban,
  Scroll,
  Hand,
  Search,
  UserCheck,
  Layers,
  Zap,
  StepBack,
  Hammer,
  Loader,
  RotateCcw,
  LayersPlus,
} from "lucide-react";
import CoverImage from "./assets/dark.png";

// ---------------------------------------------------------------------------
// CONFIGURATION & FIREBASE
// ---------------------------------------------------------------------------
// FIXED: Using a safe fallback approach for accessing process.env/import.meta.env
const getEnvVar = (key) => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore errors
  }
  return undefined;
};

// Add a safe helper for the base URL specifically
const getBaseUrl = () => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      return import.meta.env.BASE_URL || "/";
    }
  } catch (e) {
    return "/";
  }
  return "/";
};

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
const APP_ID = typeof __app_id !== "undefined" ? __app_id : "dark-game";
const GAME_ID = "26"; // Unique ID for DARK in Gamehub

// ---------------------------------------------------------------------------
// GAME DICTIONARY & CARD TYPES
// ---------------------------------------------------------------------------
const DESTINATIONS = {
  POND: {
    id: "POND",
    name: "Dark Pond",
    type: "DEST",
    icon: Map,
    color: "text-emerald-200",
    bg: "bg-emerald-950/40",
  },
  REED: {
    id: "REED",
    name: "Reed Field",
    type: "DEST",
    icon: Map,
    color: "text-amber-500",
    bg: "bg-amber-950/40",
  },
  BAMBOO: {
    id: "BAMBOO",
    name: "Bamboo Grove",
    type: "DEST",
    icon: Map,
    color: "text-green-500",
    bg: "bg-green-950/40",
  },
};

const BIRDS = {
  CROW: {
    id: "CROW",
    name: "Ravenous Crow",
    type: "BIRD",
    icon: Feather,
    color: "text-slate-400",
    bg: "bg-slate-800/40",
  },
  OWL: {
    id: "OWL",
    name: "Silent Owl",
    type: "BIRD",
    icon: Feather,
    color: "text-indigo-400",
    bg: "bg-indigo-950/40",
  },
};

const UTILITY = {
  AMULET: {
    id: "AMULET",
    name: "Blood Amulet",
    type: "UTILITY",
    action: "DEFEND",
    desc: "Blocks a steal.",
    icon: Shield,
    color: "text-red-500",
    bg: "bg-red-950/40",
  },
  SPELL: {
    id: "SPELL",
    name: "Dark Spell",
    type: "UTILITY",
    action: "BOOST",
    desc: "Discard to gain +2 Actions.",
    icon: Sparkles,
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-950/40",
  },
};

const SUPERNATURALS = {
  SUP_GUARDIAN: {
    id: "SUP_GUARDIAN",
    name: "The Guardian",
    type: "SUP",
    gender: "M",
    target: "NONE",
    desc: "Locks and protects the set it's placed on, no more cards on the set.",
  },
  SUP_OCCULTIST: {
    id: "SUP_OCCULTIST",
    name: "Occultist",
    type: "SUP",
    gender: "M",
    target: "NONE",
    desc: "Draw top 2 cards from the deck.",
  },
  SUP_HEADLESS: {
    id: "SUP_HEADLESS",
    name: "Headless",
    type: "SUP",
    gender: "M",
    target: "PLAYER",
    desc: "Steal 2 random cards from a player.",
  },
  SUP_CHAINBINDER: {
    id: "SUP_CHAINBINDER",
    name: "Chainbinder",
    type: "SUP",
    gender: "M",
    target: "CHAINBINDER",
    desc: "View all players' hands and randomly steal 1 card.",
  },
  SUP_ENCHANTRESS: {
    id: "SUP_ENCHANTRESS",
    name: "Enchantress",
    type: "SUP",
    gender: "F",
    target: "TABLE_CARD_M",
    desc: "Steal a played Male entity, add to set, may trigger it.",
  },
  SUP_BLOODFIEND: {
    id: "SUP_BLOODFIEND",
    name: "Bloodfiend",
    type: "SUP",
    gender: "M",
    target: "BLOODFIEND",
    desc: "Steal 3 random cards from one or more players.",
  },
  SUP_DEVOURER: {
    id: "SUP_DEVOURER",
    name: "Devourer",
    type: "SUP",
    gender: "M",
    target: "PLAYER",
    desc: "Randomly discard 1 card from a player's hand.",
  },
  SUP_NIGHTWALKER: {
    id: "SUP_NIGHTWALKER",
    name: "Nightwalker",
    type: "SUP",
    gender: "M",
    target: "TABLE_CARD_ANY",
    desc: "Steal any played entity, add to set, may trigger it.",
  },
  SUP_GRIM: {
    id: "SUP_GRIM",
    name: "Grim Goblin",
    type: "SUP",
    gender: "M",
    target: "PLAYER",
    desc: "Draw 1 from deck, Steal 1 randomly from a player.",
  },
  SUP_DESTROYER: {
    id: "SUP_DESTROYER",
    name: "Destroyer",
    type: "SUP",
    gender: "M",
    target: "SET_DESTROY",
    desc: "Discard an opponent's entire played set.",
  },
  SUP_SHAPECHANGER: {
    id: "SUP_SHAPECHANGER",
    name: "Shapechanger",
    type: "SUP",
    gender: "F",
    target: "SET_SWAP",
    desc: "Swap one of your sets with an opponent's set.",
  },
  SUP_ORACLE: {
    id: "SUP_ORACLE",
    name: "River Oracle",
    type: "SUP",
    gender: "F",
    target: "ORACLE",
    desc: "Draw 1 from deck, 1 from discard. Keep 1, discard 1.",
  },
  SUP_RELIC: {
    id: "SUP_RELIC",
    name: "Relic Keeper",
    type: "SUP",
    gender: "M",
    target: "DISCARD_1",
    desc: "Take any card from the discard pile. can play immediately.",
  },
  SUP_HOARDER: {
    id: "SUP_HOARDER",
    name: "Hoarder",
    type: "SUP",
    gender: "M",
    target: "HOARDER",
    desc: "Draw or steal until you have 7 cards.",
  },
  SUP_HEXWITCH: {
    id: "SUP_HEXWITCH",
    name: "Hexwitch",
    type: "SUP",
    gender: "F",
    target: "SET_HEXWITCH",
    desc: "Discard your Bird set to steal any opponent's set.",
  },
  SUP_MOONHAG: {
    id: "SUP_MOONHAG",
    name: "Moon Hag",
    type: "SUP",
    gender: "F",
    target: "OWN_SUP",
    desc: "Re-trigger any of your played entities.",
  },
  SUP_BROKER: {
    id: "SUP_BROKER",
    name: "Grave Broker",
    type: "SUP",
    gender: "M",
    target: "BROKER",
    desc: "Draw discard cards = players' number. Keep 1, distribute rest.",
  },
  SUP_HANDSHIFTER: {
    id: "SUP_HANDSHIFTER",
    name: "Handshifter",
    type: "SUP",
    gender: "M",
    target: "PLAYER",
    desc: "Swap your entire hand with a player.",
  },
  SUP_SUMMONER: {
    id: "SUP_SUMMONER",
    name: "Summoner",
    type: "SUP",
    gender: "F",
    target: "CARD_TYPE",
    desc: "Name a card. Anyone holding it must give 1 it to you.",
  },
  SUP_RAVENOUS: {
    id: "SUP_RAVENOUS",
    name: "Ravenous Swarm",
    type: "SUP",
    gender: "O",
    target: "NONE",
    desc: "All opponents randomly discard 1 card.",
  },
  SUP_SILENCER: {
    id: "SUP_SILENCER",
    name: "Silencer",
    type: "SUP",
    gender: "F",
    target: "PLAYER",
    desc: "Target player skips their next turn.",
  },
  SUP_REDEEMER: {
    id: "SUP_REDEEMER",
    name: "Redeemer",
    type: "SUP",
    gender: "M",
    target: "NONE",
    desc: "Take the top card of the discard pile, may trigger it.",
  },
  SUP_TWINS: {
    id: "SUP_TWINS",
    name: "Twins of Fate",
    type: "SUP",
    gender: "O",
    target: "DISCARD_2",
    desc: "Take any 2 discarded cards, may trigger 1 of them.",
  },
  SUP_SERPENT: {
    id: "SUP_SERPENT",
    name: "Serpent King",
    type: "SUP",
    gender: "M",
    target: "PLAYER_VIEW",
    desc: "Look at all cards in a player's hand.",
  },
};

const ALL_CARDS = { ...DESTINATIONS, ...BIRDS, ...UTILITY, ...SUPERNATURALS };

const createDeck = () => {
  let deck = [];
  const add = (id, count) => {
    for (let i = 0; i < count; i++)
      deck.push({
        uid: `${id}_${Math.random().toString(36).substr(2, 6)}`,
        cardId: id,
      });
  };
  add("POND", 6);
  add("REED", 6);
  add("BAMBOO", 6);
  add("CROW", 9);
  add("OWL", 9);
  add("AMULET", 6);
  add("SPELL", 6);
  Object.keys(SUPERNATURALS).forEach((id) => add(id, 1));

  // --- NEW: Fisher-Yates Casino Shuffle ---
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap the cards
  }

  return deck;
};

// ---------------------------------------------------------------------------
// SCORING ENGINE
// ---------------------------------------------------------------------------
const calculateScore = (tableau) => {
  let score = 0;
  tableau.forEach((set) => {
    if (set.type === "DEST" && set.cards.length === 3) {
      const types = new Set(set.cards.map((c) => c.cardId)).size;
      if (types === 1) score += 3;
      else if (types === 3) score += 5;
    } else if (set.type === "BIRD" && set.cards.length === 3) {
      score += 10;
    } else if (set.type === "SUP") {
      const l = set.cards.length;
      if (l === 1) score += 1;
      else if (l === 2) score += 2;
      else if (l === 3) score += 5;
      else if (l === 4) score += 10;
      else if (l >= 5) score += 15;
    }
  });
  return score;
};

// ---------------------------------------------------------------------------
// UI COMPONENTS
// ---------------------------------------------------------------------------
const DarkAtmosphere = React.memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {/* Clean, deep gradient background (No hazy overlays) */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-950/40 via-slate-950 to-black" />

    {/* Crisp Particles */}
    {[...Array(25)].map((_, i) => {
      // Calculate individual random drifts using CSS variables
      const driftX = `${Math.random() * 40 - 20}px`;

      return (
        <div
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            backgroundColor: Math.random() > 0.5 ? "#d946ef" : "#8b5cf6",
            animationDuration: `${10 + Math.random() * 20}s`,
            animationDelay: `${Math.random() * -20}s`,
            boxShadow: "0 0 12px 2px rgba(217,70,239,0.8)", // Brighter glow
            "--driftX": driftX, // Passes individual random drift to CSS
          }}
        />
      );
    })}
    <style>{`
      @keyframes float { 
        0%, 100% { 
          transform: translate(0, 0) scale(1); 
          opacity: 0.2; 
        } 
        50% { 
          transform: translate(var(--driftX), -60px) scale(1.5); 
          opacity: 1; /* Shines at full brightness */
        } 
      } 
      .animate-float { 
        animation: float infinite ease-in-out; 
      }
    `}</style>
  </div>
));

const Logo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Moon size={12} className="text-fuchsia-500" />
    <span className="text-[10px] font-black tracking-widest text-fuchsia-500 uppercase">
      DARK
    </span>
  </div>
);

const LogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Moon size={22} className="text-fuchsia-500" />
    <span className="text-[20px] font-black tracking-widest text-fuchsia-500 uppercase">
      DARK
    </span>
  </div>
);

const CardDisplay = ({
  cardUid,
  cardId,
  onClick,
  highlight,
  small,
  tiny,
  disabled,
}) => {
  // --- ADD THIS SAFETY CHECK ---
  if (!cardId || !ALL_CARDS[cardId]) {
    return (
      <div className="w-16 h-24 bg-slate-900 rounded-md border border-slate-800 flex items-center justify-center text-[8px] text-slate-600">
        VOID
      </div>
    );
  }
  // -----------------------------
  const c = ALL_CARDS[cardId];
  if (!c)
    return (
      <div className="w-16 h-24 bg-slate-900 rounded-md border border-slate-800" />
    );
  const isSup = c.type === "SUP";
  const bg = isSup ? "bg-slate-900/90" : c.bg;
  const border = isSup
    ? "border-fuchsia-800/80"
    : c.color
        .replace("text-", "border-")
        .replace("500", "700")
        .replace("400", "700");

  if (tiny) {
    return (
      <div
        onClick={!disabled ? onClick : undefined}
        className={`relative flex items-center justify-center rounded border p-1 cursor-pointer w-8 h-12 md:w-10 md:h-14 ${bg} ${highlight ? "ring-2 ring-fuchsia-500 scale-110 z-10" : border} ${disabled ? "opacity-50 grayscale" : "hover:scale-110"}`}
        title={c.name}
      >
        {c.icon ? (
          <c.icon size={14} className={isSup ? "text-fuchsia-400" : c.color} />
        ) : (
          <Ghost size={14} />
        )}
      </div>
    );
  }

  const sizeClasses = small
    ? "w-14 h-20 sm:w-16 sm:h-24 text-[7px] sm:text-[9px]"
    : "w-20 h-28 sm:w-28 sm:h-40 text-[9px] sm:text-xs";

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`relative flex flex-col items-center justify-between rounded-lg sm:rounded-xl border-2 p-1.5 sm:p-2 cursor-pointer select-none transition-all ${sizeClasses} ${bg} ${highlight ? "ring-2 ring-fuchsia-500 scale-105 shadow-[0_0_20px_rgba(217,70,239,0.5)] z-10 -translate-y-2" : border} ${disabled ? "opacity-50 grayscale cursor-not-allowed" : "hover:-translate-y-2 hover:shadow-xl hover:shadow-fuchsia-900/20"}`}
    >
      <div className="w-full flex justify-between items-center text-white/50 uppercase font-black tracking-widest leading-none">
        <span>{c.type}</span>
        {isSup && <span className="text-fuchsia-500/70">{c.gender}</span>}
      </div>
      <div
        className={`${isSup ? "text-fuchsia-400" : c.color} drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] my-auto`}
      >
        {c.icon ? (
          <c.icon
            size={small ? 18 : 28}
            className="sm:w-auto sm:h-auto w-6 h-6"
          />
        ) : (
          <Ghost
            size={small ? 18 : 28}
            className="sm:w-auto sm:h-auto w-6 h-6"
          />
        )}
      </div>
      <div className="w-full text-center flex flex-col items-center gap-0.5 sm:gap-1 mt-auto">
        <div className="font-black text-slate-100 uppercase tracking-tight sm:tracking-widest leading-none sm:leading-tight truncate w-full px-0.5">
          {c.name}
        </div>
        {!small && isSup && (
          <div className="text-[7px] sm:text-[9px] text-fuchsia-200/80 leading-none sm:leading-tight bg-black/80 p-1 sm:p-1.5 rounded w-full h-8 sm:h-12 overflow-hidden flex items-center justify-center border border-fuchsia-900/50">
            {c.desc}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// HOW TO PLAY MODAL
// ---------------------------------------------------------------------------
const HowToPlayModal = ({ onClose }) => (
  <div className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="bg-slate-900 border border-fuchsia-900/50 w-full max-w-5xl rounded-3xl shadow-[0_0_50px_rgba(192,38,211,0.2)] p-6 md:p-8 relative max-h-[90vh] flex flex-col">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors z-10 border border-slate-700"
      >
        <X size={24} />
      </button>

      <div className="text-center mb-6 shrink-0 border-b border-slate-800 pb-4">
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-[0.2em] uppercase mb-2 drop-shadow-md">
          The Ritual <span className="text-fuchsia-500">Rules</span>
        </h2>
        <p className="text-slate-400 text-sm tracking-widest uppercase font-bold">
          1 Action Per Turn • Max 7 Cards in Hand
        </p>
      </div>

      <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-8">
        {/* Actions & Turn Economy */}
        <div>
          <h3 className="text-lg font-black text-fuchsia-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
            <Zap size={18} /> Turn Actions
          </h3>
          <p className="text-slate-300 text-sm mb-3">
            On your turn, you must choose <strong>ONE</strong> of the following
            actions:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs uppercase tracking-wider font-bold">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-emerald-400 block mb-1">1. Draw</span> Take
              the top card from the deck.
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-red-400 block mb-1">2. Steal</span> Randomly
              steal 1 card from any opponent.
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-cyan-400 block mb-1">3. Play Set</span> Play
              exactly 3 Birds or 3 Destinations to your Bank.
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-fuchsia-400 block mb-1">4. Invoke</span>{" "}
              Play 1 Supernatural entity to your Bank and trigger its power.
            </div>
          </div>
        </div>

        {/* Scoring */}
        <div>
          <h3 className="text-lg font-black text-fuchsia-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
            <Trophy size={18} /> Scoring (Banked Sets)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-800 p-4 rounded-xl">
              <strong className="text-yellow-400 block mb-2 text-sm uppercase tracking-widest">
                Destinations
              </strong>
              <ul className="space-y-2 text-slate-300">
                <li>
                  3 Identical ={" "}
                  <span className="font-black text-white">3 Pts</span>
                </li>
                <li>
                  1 of Each (Pond+Reed+Bamboo) ={" "}
                  <span className="font-black text-white">5 Pts</span>
                </li>
              </ul>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl">
              <strong className="text-yellow-400 block mb-2 text-sm uppercase tracking-widest">
                Birds
              </strong>
              <ul className="space-y-2 text-slate-300">
                <li>
                  3 Identical (Crows or Owls) ={" "}
                  <span className="font-black text-white">10 Pts</span>
                </li>
              </ul>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl">
              <strong className="text-yellow-400 block mb-2 text-sm uppercase tracking-widest">
                Supernaturals
              </strong>
              <ul className="space-y-1 text-slate-300">
                <li>
                  1 Card = <span className="font-black text-white">1 Pt</span>
                </li>
                <li>
                  2 Cards = <span className="font-black text-white">2 Pts</span>
                </li>
                <li>
                  3 Cards = <span className="font-black text-white">5 Pts</span>
                </li>
                <li>
                  4 Cards ={" "}
                  <span className="font-black text-white">10 Pts</span>
                </li>
                <li>
                  5 Cards (Max) ={" "}
                  <span className="font-black text-white">15 Pts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Dictionary */}
        <div>
          <h3 className="text-lg font-black text-fuchsia-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
            <BookOpen size={18} /> Entity Dictionary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.values(ALL_CARDS)
              .filter((c) => c.type === "SUP" || c.type === "UTILITY")
              .map((def) => (
                <div
                  key={def.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex gap-3 items-center"
                >
                  <div
                    className={`${def.type === "SUP" ? "text-fuchsia-400" : def.color} shrink-0`}
                  >
                    {def.icon ? <def.icon size={24} /> : <Ghost size={24} />}
                  </div>
                  <div>
                    <div className="text-sm font-black text-white uppercase tracking-widest leading-tight mb-1">
                      {def.name}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      {def.desc}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="text-center pt-6 border-t border-slate-800 shrink-0 mt-2">
        <button
          onClick={onClose}
          className="bg-fuchsia-700 hover:bg-fuchsia-600 text-white px-12 py-4 rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(192,38,211,0.5)] transition-transform active:scale-95"
        >
          Close Grimoire
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
    const saved = localStorage.getItem("dark_roomId");
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
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-end pb-20 md:justify-center md:pb-0 font-sans overflow-hidden">
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
        Inspired by Gohin. A tribute game.
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
// MAIN GAME COMPONENT
// ---------------------------------------------------------------------------
export default function DarkFolkloreGame() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("splash");
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");
  const [isMaintenance, setIsMaintenance] = useState(false);

  // UI States
  const [selectedHandCards, setSelectedHandCards] = useState([]);
  const [modalState, setModalState] = useState(null); // { type, ...payload }
  const [showLogs, setShowLogs] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [broadcastLog, setBroadcastLog] = useState(null);
  const lastSeenLogId = useRef(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== "undefined" && __initial_auth_token)
          await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth init failed:", err);
      }
    };
    initAuth();

    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const savedName = localStorage.getItem("gameHub_playerName");
        if (savedName) setPlayerName(savedName);

        // WE COMPLETELY REMOVED THE AUTO-RECONNECT LOGIC HERE
        // It will no longer skip the splash screen.
      }
    });
  }, []);

  // 3. NEW FUNCTION: Handle Splash Button Click
  const handleSplashStart = () => {
    const savedRoomId = localStorage.getItem("dark_roomId");

    if (savedRoomId) {
      // User clicked RESUME: Set the roomId to trigger the Reconnecting screen
      setRoomId(savedRoomId);
    } else {
      // User clicked PLAY: Go to menu
      setView("menu");
    }
  };

  useEffect(() => {
    if (!user) return; // Wait until authenticated to check settings
    const unsub = onSnapshot(
      doc(db, "game_hub_settings", "config"),
      (doc) => {
        if (doc.exists() && doc.data()[GAME_ID]?.maintenance)
          setIsMaintenance(true);
        else setIsMaintenance(false);
      },
      (error) => {
        console.warn("Maintenance check blocked, continuing anyway.", error);
        setIsMaintenance(false);
      },
    );
    return () => unsub();
  }, [user]); // Added user dependency

  useEffect(() => {
    if (!roomId || !user) return;
    return onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (!data.players.some((p) => p.id === user.uid)) {
            setRoomId("");
            setView("menu");
            setError("Kicked by the void.");
            localStorage.removeItem("dark_roomId");
            return;
          }
          setGameState(data);
          setView(data.status === "lobby" ? "lobby" : "game");
        } else {
          setView("menu");
          setRoomId("");
          setError("Room consumed by darkness.");
          localStorage.removeItem("dark_roomId");
        }
      },
      (err) => {
        console.error("Room sync error:", err);
        setView("menu");
        setRoomId("");
        setError("Connection lost to the void.");
        localStorage.removeItem("dark_roomId");
      },
    );
  }, [roomId, user]);

  // Listen for new logs and broadcast them
  useEffect(() => {
    if (gameState?.logs?.length > 0) {
      const latestLog = gameState.logs[gameState.logs.length - 1];

      // If this is the initial load, just record the ID silently and don't pop up
      if (!lastSeenLogId.current) {
        lastSeenLogId.current = latestLog.id;
        return;
      }

      // If it's a brand new log, show the broadcast banner
      if (latestLog.id !== lastSeenLogId.current) {
        lastSeenLogId.current = latestLog.id;
        setBroadcastLog(latestLog);

        // Auto-dismiss after 3.5 seconds
        const timer = setTimeout(() => {
          setBroadcastLog(null);
        }, 3500);

        return () => clearTimeout(timer);
      }
    }
  }, [gameState?.logs]);

  const createRoom = async () => {
    if (!playerName) return setError("Enter a name.");
    localStorage.setItem("gameHub_playerName", playerName);
    const newId = Math.random().toString(36).substr(2, 6).toUpperCase();
    localStorage.setItem("dark_roomId", newId);
    await setDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
      {
        roomId: newId,
        hostId: user.uid,
        status: "lobby",
        turnIndex: 0,
        turnState: "IDLE",
        actionsLeft: 1,
        logs: [],
        deck: [],
        discardPile: [],
        isFinalRound: false,
        finalRoundTriggeredBy: null,
        pendingAction: null,
        players: [
          {
            id: user.uid,
            name: playerName,
            hand: [],
            tableau: [],
            score: 0,
            ready: true,
            skipNextTurn: false,
            finalTurnTaken: false,
          },
        ],
      },
    );
    setRoomId(newId);
  };

  const joinRoom = async (code) => {
    if (!code || !playerName) return setError("Missing data.");
    localStorage.setItem("gameHub_playerName", playerName);
    const formattedCode = code.toUpperCase().trim();
    const ref = doc(
      db,
      "artifacts",
      APP_ID,
      "public",
      "data",
      "rooms",
      formattedCode,
    );
    const snap = await getDoc(ref);
    if (
      !snap.exists() ||
      snap.data().status !== "lobby" ||
      snap.data().players.length >= 6
    )
      return setError("Cannot join room.");
    if (!snap.data().players.some((p) => p.id === user.uid)) {
      await updateDoc(ref, {
        players: [
          ...snap.data().players,
          {
            id: user.uid,
            name: playerName,
            hand: [],
            tableau: [],
            score: 0,
            ready: false,
            skipNextTurn: false,
            finalTurnTaken: false,
          },
        ],
      });
    }
    localStorage.setItem("dark_roomId", formattedCode);
    setRoomId(formattedCode);
  };

  const startRound = async () => {
    if (gameState.hostId !== user.uid) return;
    let deck = createDeck();
    const players = gameState.players.map((p) => {
      const hand = [deck.pop(), deck.pop(), deck.pop()];
      return {
        ...p,
        hand,
        tableau: [],
        score: 0,
        skipNextTurn: false,
        finalTurnTaken: false,
        ready: false,
      };
    });
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        players,
        deck,
        discardPile: [],
        turnIndex: 0,
        turnState: "ACTION",
        actionsLeft: 1,
        isFinalRound: false,
        finalRoundTriggeredBy: null,
        pendingAction: null,
        logs: arrayUnion({ text: "The ritual begins.", id: Date.now() }),
      },
    );
  };

  const kickPlayer = async (targetId) => {
    if (gameState.hostId !== user.uid) return;
    const players = gameState.players.filter((p) => p.id !== targetId);
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players },
    );
  };

  const handleLeave = async () => {
    if (!roomId) return;
    try {
      const ref = doc(
        db,
        "artifacts",
        APP_ID,
        "public",
        "data",
        "rooms",
        roomId,
      );
      if (gameState.hostId === user.uid) await deleteDoc(ref);
      else {
        const newPlayers = gameState.players.filter((p) => p.id !== user.uid);
        await updateDoc(ref, { players: newPlayers });
      }
    } catch (e) {
      console.log("Room deleted");
    }
    localStorage.removeItem("dark_roomId");
    setRoomId("");
    setView("menu");
    setShowLeaveConfirm(false);
    setGameState(null);
  };

  const copyToClipboard = () => {
    const textToCopy = gameState.roomId;
    try {
      navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      const el = document.createElement("textarea");
      el.value = textToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const log = (text, type = "neutral") =>
    arrayUnion({ text, type, id: Date.now() });

  const executeAction = async (updates, logText, logType = "neutral") => {
    if (logText) updates.logs = log(logText, logType);
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      updates,
    );
  };

  // Common advancement logic called at the end of actions
  const finalizeAction = (
    players,
    deck,
    currentTurnState,
    currentActionsLeft,
    forceDiscardCheck = true,
  ) => {
    const pIdx = gameState.turnIndex;
    const p = players[pIdx];

    // Recalculate all scores
    players.forEach((pl) => (pl.score = calculateScore(pl.tableau)));

    if (forceDiscardCheck && p.hand.length > 7) {
      return {
        players,
        turnState: "FORCE_DISCARD",
        actionsLeft: currentActionsLeft,
        deck,
      };
    }

    if (currentActionsLeft <= 0) {
      let isFinal = gameState.isFinalRound;

      // 1. If the final round was ALREADY active when this player started their turn,
      // then they have now officially completed their one last turn.
      if (isFinal) {
        players[pIdx].finalTurnTaken = true;
      }

      // 2. Check if the deck JUST emptied right now
      if (deck.length === 0 && !isFinal) {
        isFinal = true;
        // Note: We DO NOT mark the current player's finalTurnTaken as true here,
        // because this was just their normal turn. They still get one more!
      }

      // 3. Resolve Skips FIRST
      let nextIdx = (pIdx + 1) % players.length;
      while (players[nextIdx].skipNextTurn) {
        players[nextIdx].skipNextTurn = false;

        // If they are skipped during the final round, they miss their last turn!
        if (isFinal) {
          players[nextIdx].finalTurnTaken = true;
        }
        nextIdx = (nextIdx + 1) % players.length;
      }

      // 4. Check if everyone has taken their final turn
      if (isFinal && players.every((pl) => pl.finalTurnTaken)) {
        // Identify Winner
        const sorted = [...players].sort((a, b) => b.score - a.score);
        const updates = {
          players,
          turnState: "FINISHED",
          status: "finished",
          deck,
          isFinalRound: true,
          winnerId: sorted[0].id,
        };

        updates.logs = log(
          `${sorted[0].name} commands the shadows and wins!`,
          "success",
        );

        return updates;
      }

      // 5. Game continues - pass to the next player
      return {
        players,
        turnIndex: nextIdx,
        turnState: "ACTION",
        actionsLeft: 1,
        deck,
        isFinalRound: isFinal,
      };
    }

    // Still have actions left, turn continues
    return {
      players,
      turnState: currentTurnState,
      actionsLeft: currentActionsLeft,
      deck,
    };
  };

  const processQueueAndSave = async (
    players,
    deck,
    discardPile,
    pending,
    remainingActions,
  ) => {
    let isPausedForAmulet = false;

    while (pending.queue.length > 0) {
      const currentTargetId = pending.queue[0];

      if (currentTargetId === "DECK") {
        if (deck.length > 0) {
          const source = players.find((p) => p.id === pending.sourceId);
          source.hand.push(deck.pop());
          pending.deckPulls = (pending.deckPulls || 0) + 1;
        }
        pending.queue.shift(); // Move to next in line
      } else {
        // Player Target
        const target = players.find((p) => p.id === currentTargetId);
        if (!target || target.hand.length === 0) {
          pending.queue.shift();
          continue; // Target has no cards, move to next
        }

        const hasAmulet = target.hand.some((c) => c.cardId === "AMULET");
        // NEW: Check if this player already pressed "Take Hit" during this queue
        const hasRejected =
          pending.rejectedAmulets &&
          pending.rejectedAmulets.includes(target.id);

        if (hasAmulet && !hasRejected && !pending.amuletPromptActive) {
          // STOP THE QUEUE: Ask for defense!
          pending.amuletPromptActive = true;
          pending.targetId = currentTargetId; // Tell UI who is defending
          isPausedForAmulet = true;
          break;
        } else {
          // Steal succeeds automatically (no amulet, OR they opted out earlier)
          const source = players.find((p) => p.id === pending.sourceId);
          const stolen = target.hand.splice(
            Math.floor(Math.random() * target.hand.length),
            1,
          )[0];
          source.hand.push(stolen);

          pending.stolenCount = pending.stolenCount || {};
          pending.stolenCount[target.name] =
            (pending.stolenCount[target.name] || 0) + 1;

          pending.amuletPromptActive = false;
          pending.queue.shift();
        }
      }
    }

    if (isPausedForAmulet) {
      const updates = {
        players,
        deck,
        discardPile,
        turnState: "AMULET_PROMPT",
        pendingAction: pending,
      };
      const target = players.find((p) => p.id === pending.targetId);
      const source = players.find((p) => p.id === pending.sourceId);
      const attackName = ALL_CARDS[pending.defId].name;

      await executeAction(
        updates,
        `${source.name}'s ${attackName} targets ${target.name}. Waiting for defense...`,
        "warning",
      );
    } else {
      // QUEUE EMPTY! End the sequence and build final log.
      const source = players.find((p) => p.id === pending.sourceId);
      const def = ALL_CARDS[pending.defId];
      let finalLog = "";
      let details = [];

      if (pending.deckPulls > 0) details.push(`${pending.deckPulls} from deck`);
      if (pending.stolenCount) {
        details.push(
          Object.entries(pending.stolenCount)
            .map(([n, c]) => `${c} from ${n}`)
            .join(" and "),
        );
      }

      if (details.length > 0)
        finalLog = `${source.name}'s ${def.name} claimed ${details.join(" and ")}.`;
      else finalLog = `${source.name}'s ${def.name} found nothing.`;

      if (pending.blockedBy && pending.blockedBy.length > 0) {
        finalLog += ` (${pending.blockedBy.join(" and ")} blocked!)`;
      }

      const updates = finalizeAction(players, deck, "ACTION", remainingActions);
      updates.discardPile = discardPile;
      updates.pendingAction = null;
      await executeAction(updates, finalLog, "success");
    }
  };

  const actionDraw = async () => {
    const players = JSON.parse(JSON.stringify(gameState.players));
    const deck = [...gameState.deck];
    if (deck.length === 0) return;
    players[gameState.turnIndex].hand.push(deck.pop());
    const updates = finalizeAction(
      players,
      deck,
      "ACTION",
      gameState.actionsLeft - 1,
    );
    await executeAction(
      updates,
      `${players[gameState.turnIndex].name} drew a card from the deck.`,
      "neutral",
    );
    setSelectedHandCards([]); // <--- ADD THIS HERE
  };

  const actionStealInit = async () => {
    setModalState({ type: "PLAYER", mode: "STEAL", count: 1 });
  };

  const actionPlaySpell = async (cardUid) => {
    const players = JSON.parse(JSON.stringify(gameState.players));
    const discardPile = [...gameState.discardPile];
    const p = players[gameState.turnIndex];
    const cIdx = p.hand.findIndex((c) => c.uid === cardUid);
    discardPile.push(p.hand.splice(cIdx, 1)[0]);

    // NEW LOGIC HERE:
    const isCurrentlyFreePlay = gameState.turnState === "FREE_PLAY_PROMPT";
    const actionsCost = isCurrentlyFreePlay ? 0 : 1;

    const updates = finalizeAction(
      players,
      gameState.deck,
      "ACTION",
      gameState.actionsLeft - actionsCost + 2,
    );
    updates.discardPile = discardPile;
    if (isCurrentlyFreePlay) updates.pendingAction = null;

    await executeAction(
      updates,
      `${p.name} cast a Dark Spell! +2 Actions.`,
      "success",
    );
    setSelectedHandCards([]);
  };

  const actionPlaySet = async () => {
    const players = JSON.parse(JSON.stringify(gameState.players));
    const p = players[gameState.turnIndex];
    const cards = selectedHandCards.map((uid) =>
      p.hand.find((c) => c.uid === uid),
    );

    // Validation
    if (cards.length !== 3) return setError("Set must be exactly 3 cards.");
    const isDest = cards.every((c) => ALL_CARDS[c.cardId].type === "DEST");
    const isBird = cards.every((c) => ALL_CARDS[c.cardId].type === "BIRD");
    if (!isDest && !isBird) return setError("Invalid Set.");

    if (isDest) {
      const types = new Set(cards.map((c) => c.cardId)).size;
      if (types === 2)
        return setError("Destinations must be 3 identical or 1 of each.");
    } else {
      const types = new Set(cards.map((c) => c.cardId)).size;
      if (types !== 1) return setError("Birds must be 3 identical.");
    }

    // Remove from hand, add to tableau
    p.hand = p.hand.filter((c) => !selectedHandCards.includes(c.uid));
    p.tableau.push({
      id: `SET_${Date.now()}`,
      type: isDest ? "DEST" : "BIRD",
      cards,
      isLocked: false,
    });

    const updates = finalizeAction(
      players,
      gameState.deck,
      "ACTION",
      gameState.actionsLeft - 1,
    );
    await executeAction(
      updates,
      `${p.name} played a ${isDest ? "Destination" : "Bird"} Set.`,
      "success",
    );
    setSelectedHandCards([]);
  };

  const actionPlaySupernatural = async (cardUid, placementSetId = null) => {
    setSelectedHandCards([]); // Clears previous highlights
    const p = gameState.players[gameState.turnIndex];
    const card = p.hand.find((c) => c.uid === cardUid);
    const def = SUPERNATURALS[card.cardId];

    // NEW: Intercept flow to ask for set placement if they have valid existing sets
    const validSets = p.tableau.filter(
      (s) => s.type === "SUP" && !s.isLocked && s.cards.length < 5,
    );
    if (placementSetId === null && validSets.length > 0) {
      setModalState({ type: "CHOOSE_PLACEMENT", cardUid, def });
      return; // Stop here and wait for modal input
    }

    // Pass the placementSetId into the target modals so it isn't lost
    if (def.target === "SET_SWAP") {
      // Deep copy so we can visually inject the pending card
      let previewOwnSets = JSON.parse(
        JSON.stringify(p.tableau.filter((s) => !s.isLocked))
      );

      // Default to "NEW" if they bypassed the placement modal
      const actualPlacement = placementSetId || "NEW";

      if (actualPlacement === "NEW") {
        previewOwnSets.push({
          id: "NEW_PLACEMENT_SET", // A temporary mock ID
          type: "SUP",
          cards: [{ cardId: card.cardId, uid: card.uid }],
          isLocked: false,
        });
      } else {
        const tgtSet = previewOwnSets.find((s) => s.id === actualPlacement);
        if (tgtSet) {
          tgtSet.cards.push({ cardId: card.cardId, uid: card.uid });
        }
      }

      if (previewOwnSets.length === 0)
        return setError("Requires an unlocked set to swap.");

      return setModalState({
        type: "SET_SWAP",
        ownSetId: previewOwnSets.length === 1 ? previewOwnSets[0].id : null,
        validOwnSets: previewOwnSets,
        cardUid,
        def,
        placementSetId: actualPlacement, // Pass the placement through!
      });
    }
    if (def.target === "SET_HEXWITCH") {
      const validOwnSets = p.tableau.filter(
        (s) => s.type === "BIRD" && !s.isLocked && s.cards.length === 3,
      );
      if (validOwnSets.length === 0)
        return setError("Requires a completed Bird set to sacrifice.");
      return setModalState({
        type: "SET_HEXWITCH",
        ownSetId: validOwnSets.length === 1 ? validOwnSets[0].id : null,
        validOwnSets,
        cardUid,
        def,
        placementSetId,
      });
    }
    if (def.target === "OWN_SUP") {
      const hasSup = p.tableau.some(
        (s) => s.type === "SUP" && s.cards.length > 0 && !s.isLocked,
      );
      if (!hasSup)
        return setError("You have no unlocked entities to re-trigger.");
      return setModalState({ type: "OWN_SUP", cardUid, def, placementSetId });
    }
    if (def.target === "ORACLE") {
      return setModalState({ type: "ORACLE", cardUid, def, placementSetId });
    }
    if (def.target === "BROKER") {
      return setModalState({ type: "BROKER", cardUid, def, placementSetId });
    }

    if (def.target === "NONE") resolveSupernatural(cardUid, { placementSetId });
    else setModalState({ type: def.target, cardUid, def, placementSetId });
  };

  const applySupernaturalEffect = (def, targetData, ctx) => {
    const { players, me } = ctx;

    // Safety checks for targeted abilities resolving missing data (prevents chain soft-locks)
    if (
      [
        "SUP_HEADLESS",
        "SUP_DEVOURER",
        "SUP_GRIM",
        "SUP_SERPENT",
        "SUP_SILENCER",
        "SUP_HANDSHIFTER",
      ].includes(def.id) &&
      (!targetData || !targetData.targetPlayerId)
    )
      return;
    if (
      def.id === "SUP_CHAINBINDER" &&
      (!targetData || !targetData.targetPlayerId)
    )
      return;
    // FIX: Changed targetIds to selections
    if (def.id === "SUP_BLOODFIEND" && (!targetData || !targetData.selections))
      return;
    if (def.id === "SUP_HOARDER" && (!targetData || !targetData.choices))
      return;
    if (
      ["SUP_DESTROYER"].includes(def.id) &&
      (!targetData || !targetData.targetSetId)
    )
      return;
    if (
      ["SUP_SHAPECHANGER", "SUP_HEXWITCH"].includes(def.id) &&
      (!targetData || !targetData.ownSetId || !targetData.targetSetId)
    )
      return;
    if (
      ["SUP_ENCHANTRESS", "SUP_NIGHTWALKER"].includes(def.id) &&
      (!targetData || !targetData.targetCardUid)
    )
      return;

    switch (def.id) {
      case "SUP_GUARDIAN":
        // Finds the specific set that holds an unlocked Guardian
        let tSet = me.tableau.findIndex(
          (s) =>
            !s.isLocked && s.cards.some((c) => c.cardId === "SUP_GUARDIAN"),
        );
        if (tSet > -1) me.tableau[tSet].isLocked = true;
        ctx.logsText += " Set locked defensively.";
        break;
      case "SUP_OCCULTIST":
        if (ctx.deck.length > 0) me.hand.push(ctx.deck.pop());
        if (ctx.deck.length > 0) me.hand.push(ctx.deck.pop());
        ctx.logsText += " They drew 2 cards from the deck.";
        break;
      case "SUP_HEADLESS":
        // NEW: Moved to Queue System so it steals 1-by-1!
        ctx.pendingData = {
          isQueue: true,
          type: "SUP_HEADLESS",
          defId: def.id,
          sourceId: me.id,
          queue: [targetData.targetPlayerId, targetData.targetPlayerId], // Queued 2 times!
          stolenCount: {},
          blockedBy: [],
          rejectedAmulets: [],
          deckPulls: 0,
          amuletPromptActive: false,
        };
        ctx.isQueueProcessing = true;
        break;
      case "SUP_DEVOURER":
        ctx.logsText += " The shadows reach out to strike.";
        ctx.awaitAmulet = true;
        ctx.pendingData = {
          type: def.id,
          targetId: targetData.targetPlayerId,
          sourceId: me.id,
        };
        break;
      case "SUP_GRIM":
        // NEW: Draw immediately before asking for the amulet!
        if (ctx.deck.length > 0) {
          me.hand.push(ctx.deck.pop());
          ctx.logsText += " They drew 1 from the deck.";
        }
        ctx.logsText += " The shadows reach out to strike.";
        ctx.awaitAmulet = true;
        ctx.pendingData = {
          type: def.id,
          targetId: targetData.targetPlayerId,
          sourceId: me.id,
        };
        break;
      case "SUP_CHAINBINDER":
        ctx.awaitAmulet = true;
        ctx.pendingData = {
          type: "STEAL",
          targetId: targetData.targetPlayerId,
          sourceId: me.id,
        };
        ctx.logsText += ` They scanned all minds and targeted ${players.find((p) => p.id === targetData.targetPlayerId).name}.`;
        break;
      case "SUP_BLOODFIEND":
        ctx.pendingData = {
          isQueue: true,
          type: "SUP_BLOODFIEND",
          defId: def.id,
          sourceId: me.id,
          queue: [...targetData.selections],
          stolenCount: {},
          blockedBy: [],
          rejectedAmulets: [], // <--- ADD THIS
          deckPulls: 0,
          amuletPromptActive: false,
        };
        // Pad with DECK for remaining attempts if they selected fewer than 3 people
        while (ctx.pendingData.queue.length < 3) {
          ctx.pendingData.queue.push("DECK");
        }
        ctx.isQueueProcessing = true; // Tell the engine to use the queue
        break;
      case "SUP_SERPENT":
        ctx.logsText += ` They glared into ${players.find((p) => p.id === targetData.targetPlayerId).name}'s hand.`;
        break;
      case "SUP_DESTROYER":
        const tOpp = players.find((p) => p.id === targetData.targetPlayerId);
        const tSetIdx = tOpp.tableau.findIndex(
          (s) => s.id === targetData.targetSetId,
        );
        if (tSetIdx > -1) {
          const destroyedSet = tOpp.tableau.splice(tSetIdx, 1)[0];
          ctx.discardPile.push(...destroyedSet.cards);
          ctx.logsText += ` They shattered a ${destroyedSet.cards.length}-card set belonging to ${tOpp.name}!`;
        }
        break;
      case "SUP_SHAPECHANGER":
        let mySetIdx = me.tableau.findIndex(
          (s) => s.id === targetData.ownSetId,
        );

        // Catch the mock ID for a newly created placement set
        if (targetData.ownSetId === "NEW_PLACEMENT_SET") {
          // The new set was just pushed to the very end of the tableau
          mySetIdx = me.tableau.length - 1;
        }

        const opp = players.find((p) => p.id === targetData.targetPlayerId);
        const oppSetIdx = opp.tableau.findIndex(
          (s) => s.id === targetData.targetSetId,
        );
        if (mySetIdx > -1 && oppSetIdx > -1) {
          const temp = me.tableau[mySetIdx];
          me.tableau[mySetIdx] = opp.tableau[oppSetIdx];
          opp.tableau[oppSetIdx] = temp;
          ctx.logsText += ` Swapped sets with ${opp.name}.`;
        }
        break;
      case "SUP_ORACLE":
        ctx.deck.splice(
          0,
          ctx.deck.length,
          ...(targetData.updatedDeck || ctx.deck),
        );
        ctx.discardPile.splice(
          0,
          ctx.discardPile.length,
          ...(targetData.updatedDiscard || ctx.discardPile),
        );
        if (targetData.keptCard) me.hand.push(targetData.keptCard);
        if (targetData.discardedCard)
          ctx.discardPile.push(targetData.discardedCard);
        ctx.logsText += " They peered into the future and kept 1 card.";
        break;
      case "SUP_RELIC":
        if (targetData.discardUids && targetData.discardUids.length > 0) {
          const rIdx = ctx.discardPile.findIndex(
            (c) => c.uid === targetData.discardUids[0],
          );
          if (rIdx > -1) {
            const drawn = ctx.discardPile.splice(rIdx, 1)[0];
            me.hand.push(drawn);
            ctx.freePlayUids = [drawn.uid];
            ctx.logsText += ` They claimed '${ALL_CARDS[drawn.cardId].name}' from the discard pile.`;
          }
        }
        break;
      case "SUP_HOARDER":
        ctx.pendingData = {
          isQueue: true,
          type: "SUP_HOARDER",
          defId: def.id,
          sourceId: me.id,
          queue: [...targetData.choices],
          stolenCount: {},
          blockedBy: [],
          rejectedAmulets: [],
          deckPulls: 0,
          amuletPromptActive: false,
        };
        ctx.isQueueProcessing = true;
        break;
      case "SUP_HEXWITCH":
        const hMySetIdx = me.tableau.findIndex(
          (s) => s.id === targetData.ownSetId,
        );
        if (hMySetIdx > -1) {
          ctx.discardPile.push(...me.tableau.splice(hMySetIdx, 1)[0].cards);
          const hOpp = players.find((p) => p.id === targetData.targetPlayerId);
          const hOppSetIdx = hOpp.tableau.findIndex(
            (s) => s.id === targetData.targetSetId,
          );
          if (hOppSetIdx > -1)
            me.tableau.push(hOpp.tableau.splice(hOppSetIdx, 1)[0]);
          ctx.logsText += ` They sacrificed a Bird set to steal ${hOpp.name}'s set!`;
        }
        break;
      case "SUP_SILENCER":
        const silOpp = players.find((p) => p.id === targetData.targetPlayerId);
        if (silOpp) {
          silOpp.skipNextTurn = true;
          ctx.logsText += ` They silenced ${silOpp.name}, skipping their next turn!`;
        }
        break;
      case "SUP_HANDSHIFTER":
        const hsOpp = players.find((p) => p.id === targetData.targetPlayerId);
        if (hsOpp) {
          const myHand = [...me.hand];
          me.hand = [...hsOpp.hand];
          hsOpp.hand = myHand;
          ctx.logsText += ` Swapped hands with ${hsOpp.name}.`;
        }
        break;
      case "SUP_RAVENOUS":
        let ravTargets = [];
        players.forEach((p) => {
          if (p.id !== me.id && p.hand.length > 0) {
            ctx.discardPile.push(
              p.hand.splice(Math.floor(Math.random() * p.hand.length), 1)[0],
            );
            ravTargets.push(p.name);
          }
        });
        ctx.logsText +=
          ravTargets.length > 0
            ? ` A swarm devoured 1 card from ${ravTargets.join(", ")}.`
            : ` A swarm appeared, but there was nothing to devour.`;
        break;
      case "SUP_REDEEMER":
        if (ctx.discardPile.length > 0) {
          const drawn = ctx.discardPile.pop();
          me.hand.push(drawn);
          ctx.freePlayUids = [drawn.uid];
          ctx.logsText += ` They redeemed '${ALL_CARDS[drawn.cardId].name}' from the discard pile.`;
        }
        break;
      case "SUP_TWINS":
        ctx.freePlayUids = [];
        let twinsPulled = [];
        if (targetData.discardUids) {
          targetData.discardUids.forEach((uid) => {
            const idx = ctx.discardPile.findIndex((c) => c.uid === uid);
            if (idx > -1) {
              const drawn = ctx.discardPile.splice(idx, 1)[0];
              me.hand.push(drawn);
              ctx.freePlayUids.push(drawn.uid);
              twinsPulled.push(`'${ALL_CARDS[drawn.cardId].name}'`);
            }
          });
        }
        if (twinsPulled.length > 0) {
          ctx.logsText += ` They resurrected ${twinsPulled.join(" and ")} from the discard pile.`;
        }
        break;
      case "SUP_SUMMONER":
        let summonedCount = 0;
        let summonedFrom = [];
        const namedCard = ALL_CARDS[targetData.namedCardId]?.name || "a card";

        players.forEach((p) => {
          if (p.id !== me.id && targetData.namedCardId) {
            const matchIdx = p.hand.findIndex(
              (c) => c.cardId === targetData.namedCardId,
            );
            if (matchIdx > -1) {
              me.hand.push(p.hand.splice(matchIdx, 1)[0]);
              summonedCount++;
              summonedFrom.push(p.name);
            }
          }
        });

        ctx.logsText +=
          summonedCount > 0
            ? ` They compelled '${namedCard}' from ${summonedFrom.join(" and ")}!`
            : ` They called for '${namedCard}' but no one answered.`;
        break;
      case "SUP_BROKER":
        ctx.discardPile.splice(
          0,
          ctx.discardPile.length,
          ...(targetData.updatedDiscard || ctx.discardPile),
        );
        if (targetData.keptCard) me.hand.push(targetData.keptCard);
        const opps = players.filter((p) => p.id !== me.id);
        if (targetData.scatterCards) {
          targetData.scatterCards.forEach((c, i) => {
            opps[i % opps.length].hand.push(c);
          });
        }
        const keptName = targetData.keptCard
          ? ALL_CARDS[targetData.keptCard.cardId].name
          : "nothing";
        const scatterCount = targetData.scatterCards
          ? targetData.scatterCards.length
          : 0;
        ctx.logsText += ` Grave Broker kept '${keptName}' and scattered ${scatterCount} cards to opponents.`;
        break;
      case "SUP_NIGHTWALKER":
      case "SUP_ENCHANTRESS":
        const nwOpp = players.find((p) => p.id === targetData.targetPlayerId);
        const nwSetIdx = nwOpp.tableau.findIndex(
          (s) => s.id === targetData.targetSetId,
        );
        const nwSet = nwOpp.tableau[nwSetIdx];
        const nwCardIdx = nwSet.cards.findIndex(
          (c) => c.uid === targetData.targetCardUid,
        );
        const stolenSup = nwSet.cards.splice(nwCardIdx, 1)[0];

        // CLEANUP EMPTY SET
        if (nwSet.cards.length === 0) {
          nwOpp.tableau.splice(nwSetIdx, 1);
        }

        // Handle the chosen placement for the stolen card
        if (targetData.stolenPlacementSetId === "NEW") {
          me.tableau.push({
            id: `SET_${Date.now()}_STOLEN`,
            type: "SUP",
            cards: [stolenSup],
            isLocked: false,
          });
        } else if (targetData.stolenPlacementSetId === "SAME_AS_SOURCE") {
          // Find the set that holds the Enchantress/Nightwalker, and push it there
          const sourceSet = me.tableau.find((s) =>
            s.cards.some((c) => c.uid === ctx.sourceCardUid),
          );
          if (sourceSet) {
            sourceSet.cards.push(stolenSup);
          } else {
            // Failsafe fallback
            me.tableau.push({
              id: `SET_${Date.now()}_STOLEN`,
              type: "SUP",
              cards: [stolenSup],
              isLocked: false,
            });
          }
        } else if (targetData.stolenPlacementSetId) {
          const tSetIdx = me.tableau.findIndex(
            (s) => s.id === targetData.stolenPlacementSetId,
          );
          if (tSetIdx > -1) {
            me.tableau[tSetIdx].cards.push(stolenSup);
          } else {
            // Failsafe fallback if set not found
            me.tableau.push({
              id: `SET_${Date.now()}_STOLEN`,
              type: "SUP",
              cards: [stolenSup],
              isLocked: false,
            });
          }
        } else {
          // Ultimate fallback just in case no placement ID was passed
          let tSet2 = me.tableau
            .map((s) => s.type === "SUP" && !s.isLocked && s.cards.length < 5)
            .lastIndexOf(true);
          if (tSet2 > -1) me.tableau[tSet2].cards.push(stolenSup);
          else
            me.tableau.push({
              id: `SET_${Date.now()}_STOLEN`,
              type: "SUP",
              cards: [stolenSup],
              isLocked: false,
            });
        }

        const stolenDef = SUPERNATURALS[stolenSup.cardId];
        ctx.logsText += ` They entranced and stole ${nwOpp.name}'s ${stolenDef.name}.`;

        // Handle the chosen trigger toggle
        if (targetData.triggerStolen) {
          ctx.logsText += ` The stolen entity awakens!`;
          if (stolenDef.target === "NONE") {
            applySupernaturalEffect(stolenDef, null, ctx);
          } else {
            ctx.triggerChain = true;
            ctx.chainDefId = stolenDef.id;
          }
        } else {
          ctx.logsText += ` The stolen entity remains dormant.`;
        }
        break;
      case "SUP_MOONHAG":
        if (!targetData.retriggerCardId) break;
        const reDef = SUPERNATURALS[targetData.retriggerCardId];
        ctx.logsText += ` Moon Hag re-invokes ${reDef.name}.`;
        if (reDef.target === "NONE") {
          applySupernaturalEffect(reDef, null, ctx);
        } else {
          ctx.triggerChain = true;
          ctx.chainDefId = reDef.id;
        }
        break;
      default:
        break;
    }
  };

  const resolveSupernatural = async (cardUid, targetData) => {
    let ctx = {
      players: JSON.parse(JSON.stringify(gameState.players)),
      deck: [...gameState.deck],
      discardPile: [...gameState.discardPile],
      pIdx: gameState.turnIndex,
      logsText: "",
      awaitAmulet: false,
      pendingData: null,
      triggerChain: false,
      chainDefId: null,
      sourceCardUid: cardUid, // <--- ADD THIS LINE HERE
    };
    ctx.me = ctx.players[ctx.pIdx];

    const handIdx = ctx.me.hand.findIndex((c) => c.uid === cardUid);
    const cardObj = ctx.me.hand.splice(handIdx, 1)[0];
    const def = SUPERNATURALS[cardObj.cardId];

    // NEW: Respect the player's modal choice for set placement
    let targetSetIdx = -1;
    if (targetData?.placementSetId === "NEW") {
      targetSetIdx = -1; // Force new set creation
    } else if (targetData?.placementSetId) {
      targetSetIdx = ctx.me.tableau.findIndex(
        (s) => s.id === targetData.placementSetId,
      );
    } else {
      // Fallback for players with 0 existing sets (bypassed the modal)
      targetSetIdx = ctx.me.tableau
        .map((s) => s.type === "SUP" && !s.isLocked && s.cards.length < 5)
        .lastIndexOf(true);
    }

    if (targetSetIdx > -1) ctx.me.tableau[targetSetIdx].cards.push(cardObj);
    else
      ctx.me.tableau.push({
        id: `SET_${Date.now()}`,
        type: "SUP",
        cards: [cardObj],
        isLocked: false,
      });

    ctx.logsText = `${ctx.me.name} summoned ${def.name}.`;
    applySupernaturalEffect(def, targetData, ctx);

    // ... [Rest of the resolveSupernatural function remains the same]

    if (ctx.triggerChain) {
      const updates = {
        players: ctx.players,
        deck: ctx.deck,
        discardPile: ctx.discardPile,
        turnState: "CHAIN_MODAL",
        pendingAction: {
          type: "CHAIN",
          defId: ctx.chainDefId,
          logPrefix: ctx.logsText,
        },
      };
      // FIX: Clear local modal state before moving to the chain
      setModalState(null);
      setSelectedHandCards([]);
      return executeAction(
        updates,
        `${ctx.logsText} Gathering power...`,
        "neutral",
      );
    }

    if (ctx.awaitAmulet) {
      const target = ctx.players.find((p) => p.id === ctx.pendingData.targetId);
      const hasAmulet = target.hand.some((c) => c.cardId === "AMULET");
      if (hasAmulet && target.hand.length > 0) {
        const updates = {
          players: ctx.players,
          deck: ctx.deck,
          discardPile: ctx.discardPile,
          turnState: "AMULET_PROMPT",
          pendingAction: ctx.pendingData,
        };
        setModalState(null);
        setSelectedHandCards([]);
        return executeAction(
          updates,
          `${ctx.logsText} The attack on ${target.name} succeeds!`,
          "success",
        );
      } else {
        resolveOffensiveAction(
          ctx.pendingData,
          ctx.players,
          ctx.discardPile,
          ctx.deck,
        );
        const updates = finalizeAction(
          ctx.players,
          ctx.deck,
          "ACTION",
          gameState.actionsLeft - 1,
        );
        updates.discardPile = ctx.discardPile;
        // FIX: Clear the modal out of local memory before the turn passes!
        setModalState(null);
        setSelectedHandCards([]);
        // Use the helper here too!
        const successLog = getAttackSuccessLog(
          ctx.pendingData.type,
          ctx.me.name,
          target.name,
        );
        return executeAction(updates, successLog, "success");
      }
    }

    // --- REPLACE THE END OF resolveSupernatural WITH THIS ---
    const isCurrentlyFreePlay = gameState.turnState === "FREE_PLAY_PROMPT";
    const actionsCost = isCurrentlyFreePlay ? 0 : 1;

    // --- NEW QUEUE INTERCEPTOR ---
    if (ctx.isQueueProcessing) {
      ctx.pendingData.remainingActions = gameState.actionsLeft - actionsCost;
      setModalState(null);
      setSelectedHandCards([]);
      return processQueueAndSave(
        ctx.players,
        ctx.deck,
        ctx.discardPile,
        ctx.pendingData,
        ctx.pendingData.remainingActions,
      );
    }

    // NEW FIX: Intercept the Free Play state so finalizeAction doesn't instantly end the turn
    if (ctx.freePlayUids && ctx.freePlayUids.length > 0) {
      const updates = {
        players: ctx.players,
        deck: ctx.deck,
        discardPile: ctx.discardPile,
        turnState: "FREE_PLAY_PROMPT",
        actionsLeft: gameState.actionsLeft - actionsCost, // Deducts the action, but holds the turn!
        pendingAction: {
          type: "FREE_PLAY",
          uids: ctx.freePlayUids,
          sourceId: ctx.me.id,
        },
      };
      setModalState(null);
      setSelectedHandCards([]);
      return executeAction(updates, ctx.logsText, "success");
    }

    // Normal turn resolution if no Free Play is pending
    const updates = finalizeAction(
      ctx.players,
      ctx.deck,
      "ACTION",
      gameState.actionsLeft - actionsCost,
    );

    updates.discardPile = ctx.discardPile;
    if (isCurrentlyFreePlay) updates.pendingAction = null;

    await executeAction(updates, ctx.logsText, "success");
    setModalState(null);
    setSelectedHandCards([]);
  }; // End of resolveSupernatural

  const resolveChain = async (targetData) => {
    let ctx = {
      players: JSON.parse(JSON.stringify(gameState.players)),
      deck: [...gameState.deck],
      discardPile: [...gameState.discardPile],
      pIdx: gameState.turnIndex,
      logsText: gameState.pendingAction.logPrefix,
      awaitAmulet: false,
      pendingData: null,
      triggerChain: false,
      chainDefId: null,
    };
    ctx.me = ctx.players[ctx.pIdx];
    const def = SUPERNATURALS[gameState.pendingAction.defId];

    applySupernaturalEffect(def, targetData, ctx);

    // --- ADD THIS MISSING BLOCK FOR CONTINUOUS CHAINING ---
    if (ctx.triggerChain) {
      const updates = {
        players: ctx.players,
        deck: ctx.deck,
        discardPile: ctx.discardPile,
        turnState: "CHAIN_MODAL",
        pendingAction: {
          type: "CHAIN",
          defId: ctx.chainDefId,
          logPrefix: ctx.logsText,
        },
      };
      setModalState(null);
      setSelectedHandCards([]);
      return executeAction(
        updates,
        `${ctx.logsText} Gathering power...`,
        "neutral",
      );
    }
    // ------------------------------------------------------

    if (ctx.awaitAmulet) {
      const target = ctx.players.find((p) => p.id === ctx.pendingData.targetId);
      const hasAmulet = target.hand.some((c) => c.cardId === "AMULET");
      if (hasAmulet && target.hand.length > 0) {
        const updates = {
          players: ctx.players,
          deck: ctx.deck,
          discardPile: ctx.discardPile,
          turnState: "AMULET_PROMPT",
          pendingAction: ctx.pendingData,
        };
        // FIX: Clear local modal state before waiting for defense
        setModalState(null);
        setSelectedHandCards([]);
        return executeAction(
          updates,
          `${ctx.logsText} The attack on ${target.name} succeeds!`,
          "success",
        );
      } else {
        resolveOffensiveAction(
          ctx.pendingData,
          ctx.players,
          ctx.discardPile,
          ctx.deck,
        );
        const updates = finalizeAction(
          ctx.players,
          ctx.deck,
          "ACTION",
          gameState.actionsLeft - 1,
        );
        updates.discardPile = ctx.discardPile;
        // FIX: Clear the modal out of local memory before the turn passes!
        setModalState(null);
        setSelectedHandCards([]);
        // Use the helper here too!
        const successLog = getAttackSuccessLog(
          ctx.pendingData.type,
          ctx.me.name,
          target.name,
        );
        return executeAction(updates, successLog, "success");
      }
    }

    // --- REPLACE THE END OF resolveSupernatural WITH THIS ---
    const isCurrentlyFreePlay = gameState.turnState === "FREE_PLAY_PROMPT";
    const actionsCost = isCurrentlyFreePlay ? 0 : 1;

    // --- NEW QUEUE INTERCEPTOR ---
    if (ctx.isQueueProcessing) {
      ctx.pendingData.remainingActions = gameState.actionsLeft - actionsCost;
      setModalState(null);
      setSelectedHandCards([]);
      return processQueueAndSave(
        ctx.players,
        ctx.deck,
        ctx.discardPile,
        ctx.pendingData,
        ctx.pendingData.remainingActions,
      );
    }

    // NEW FIX: Intercept the Free Play state so finalizeAction doesn't instantly end the turn
    if (ctx.freePlayUids && ctx.freePlayUids.length > 0) {
      const updates = {
        players: ctx.players,
        deck: ctx.deck,
        discardPile: ctx.discardPile,
        turnState: "FREE_PLAY_PROMPT",
        actionsLeft: gameState.actionsLeft - actionsCost, // Deducts the action, but holds the turn!
        pendingAction: {
          type: "FREE_PLAY",
          uids: ctx.freePlayUids,
          sourceId: ctx.me.id,
        },
      };
      setModalState(null);
      setSelectedHandCards([]);
      return executeAction(updates, ctx.logsText, "success");
    }

    // Normal turn resolution if no Free Play is pending
    const updates = finalizeAction(
      ctx.players,
      ctx.deck,
      "ACTION",
      gameState.actionsLeft - actionsCost,
    );

    updates.discardPile = ctx.discardPile;
    if (isCurrentlyFreePlay) updates.pendingAction = null;

    await executeAction(updates, ctx.logsText, "success");
    setModalState(null);
    setSelectedHandCards([]);
  }; // End of resolveChain

  const resolveOffensiveAction = (pending, players, discardPile, deck) => {
    const source = players.find((p) => p.id === pending.sourceId);
    const target = players.find((p) => p.id === pending.targetId);
    if (!target || target.hand.length === 0) return;

    const stealRandom = (count) => {
      for (let i = 0; i < count; i++) {
        if (target.hand.length > 0)
          source.hand.push(
            target.hand.splice(
              Math.floor(Math.random() * target.hand.length),
              1,
            )[0],
          );
      }
    };

    if (pending.type === "STEAL") stealRandom(1);
    else if (pending.type === "SUP_BLOODFIEND") stealRandom(3);
    else if (pending.type === "SUP_DEVOURER")
      discardPile.push(
        target.hand.splice(
          Math.floor(Math.random() * target.hand.length),
          1,
        )[0],
      );
    // UPDATED: Removed the deck push from here!
    else if (pending.type === "SUP_GRIM") stealRandom(1);
    else if (pending.type === "SUP_CHAINBINDER") {
      const cIdx = target.hand.findIndex(
        (c) => c.uid === pending.specificCardUid,
      );
      if (cIdx > -1) source.hand.push(target.hand.splice(cIdx, 1)[0]);
    }
  };

  const getAttackSuccessLog = (type, sourceName, targetName) => {
    if (type === "STEAL")
      return `${sourceName} stole a card from ${targetName}.`;
    if (type === "SUP_DEVOURER")
      return `${sourceName}'s Devourer ripped a card from ${targetName}'s hand into the void.`;
    // UPDATED: Removed "drew from the deck and" since the draw happened earlier
    if (type === "SUP_GRIM")
      return `${sourceName}'s Grim Goblin successfully stole a card from ${targetName}.`;
    if (type === "SUP_CHAINBINDER")
      return `${sourceName}'s Chainbinder stole a card from ${targetName}.`;
    return `${sourceName} struck ${targetName} successfully.`;
  };

  const handleAmuletResponse = async (useAmulet) => {
    const players = JSON.parse(JSON.stringify(gameState.players));
    const discardPile = [...gameState.discardPile];
    const deck = [...gameState.deck];
    const pending = gameState.pendingAction;
    const me = players.find((p) => p.id === user.uid);
    const source = players.find((p) => p.id === pending.sourceId);

    // --- QUEUED MULTI-ATTACK LOGIC ---
    if (pending.isQueue) {
      if (useAmulet) {
        const aIdx = me.hand.findIndex((c) => c.cardId === "AMULET");
        discardPile.push(me.hand.splice(aIdx, 1)[0]);
        pending.blockedBy = pending.blockedBy || [];
        pending.blockedBy.push(me.name);
      } else {
        // NEW: Player Took the hit -> DO NOT ASK AGAIN FOR THIS ATTACK
        pending.rejectedAmulets = pending.rejectedAmulets || [];
        pending.rejectedAmulets.push(me.id);

        const stolen = me.hand.splice(
          Math.floor(Math.random() * me.hand.length),
          1,
        )[0];
        source.hand.push(stolen);
        pending.stolenCount = pending.stolenCount || {};
        pending.stolenCount[me.name] = (pending.stolenCount[me.name] || 0) + 1;
      }

      pending.queue.shift(); // Consume this attempt
      pending.amuletPromptActive = false; // Reset for next loop
      setSelectedHandCards([]);

      // Pass it back to the queue processor to handle the next target!
      return processQueueAndSave(
        players,
        deck,
        discardPile,
        pending,
        pending.remainingActions,
      );
    }

    // --- EXISTING SINGLE ATTACK LOGIC ---
    let logText = "";
    if (useAmulet) {
      const aIdx = me.hand.findIndex((c) => c.cardId === "AMULET");
      discardPile.push(me.hand.splice(aIdx, 1)[0]);
      const attackName =
        pending.type === "STEAL"
          ? "A steal"
          : ALL_CARDS[pending.type]?.name || "An attack";
      logText = `${me.name} burned an Amulet! ${attackName} from ${source.name} was nullified.`;
    } else {
      resolveOffensiveAction(pending, players, discardPile, gameState.deck);
      logText = getAttackSuccessLog(pending.type, source.name, me.name);
    }

    const updates = finalizeAction(
      players,
      gameState.deck,
      "ACTION",
      gameState.actionsLeft - 1,
    );
    updates.discardPile = discardPile;
    updates.pendingAction = null;
    await executeAction(updates, logText, useAmulet ? "neutral" : "failure");
    setSelectedHandCards([]);
  };

  const handleForceDiscard = async (cardUids) => {
    const players = JSON.parse(JSON.stringify(gameState.players));
    const discardPile = [...gameState.discardPile];
    const p = players[gameState.turnIndex];
    cardUids.forEach((uid) => {
      const idx = p.hand.findIndex((c) => c.uid === uid);
      discardPile.push(p.hand.splice(idx, 1)[0]);
    });
    const updates = finalizeAction(
      players,
      gameState.deck,
      "ACTION",
      gameState.actionsLeft,
      false,
    );
    updates.discardPile = discardPile;
    await executeAction(
      updates,
      `${p.name} discarded down to hand limit.`,
      "warning",
    );
    setModalState(null);
    setSelectedHandCards([]); // <--- ADD THIS HERE to clear the ghost cards!
  };

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 p-4 text-center relative overflow-hidden">
        <DarkAtmosphere />
        <LogoBig />
        <div className="z-10 bg-fuchsia-950/20 p-8 rounded-3xl border border-fuchsia-900/50 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-md">
          <Hammer
            size={64}
            className="text-fuchsia-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-black mb-2 tracking-[0.2em] uppercase text-slate-100">
            The Void is Restless
          </h1>
          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">
            Darkness is undergoing maintenance. Return later.
          </p>
        </div>
        <div className="h-8"></div>
        <a href={import.meta.env.BASE_URL} className="z-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900/80 rounded-full border border-fuchsia-500/20 text-fuchsia-300 font-bold tracking-widest text-sm uppercase backdrop-blur-sm transition-colors hover:bg-slate-800 hover:border-fuchsia-400">
              <StepBack size={16} /> Retreat to Gamehub
            </div>
          </div>
        </a>
        <Logo />
      </div>
    );
  }

  if (!user)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-fuchsia-500 animate-pulse">
        Eradicating darkness...
      </div>
    );

  // RECONNECTING STATE
  if (roomId && !gameState && !error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <DarkAtmosphere />
        <div className="bg-slate-900/80 backdrop-blur p-8 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <Loader size={48} className="text-fuchsia-500 animate-spin" />
          <div className="text-center">
            <h2 className="text-xl font-bold">Reconnecting...</h2>
            <p className="text-slate-400 text-sm">Resuming your session</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === "splash") return <SplashScreen onStart={handleSplashStart} />;

  if (view === "menu")
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative text-slate-200">
        <DarkAtmosphere />
        <nav className="absolute top-0 left-0 w-full p-6 z-50">
          <a
            href={import.meta.env.BASE_URL}
            className="flex items-center gap-2 text-fuchsia-500 hover:text-fuchsia-400 font-bold tracking-widest uppercase transition-colors w-fit group"
          >
            <StepBack
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="text-xs">Back to Gamehub</span>
          </a>
        </nav>
        {showGuide && <HowToPlayModal onClose={() => setShowGuide(false)} />}
        <div className="z-10 text-center mb-12">
          <Moon
            size={64}
            className="mx-auto mb-6 text-fuchsia-600 drop-shadow-[0_0_20px_rgba(192,38,211,0.6)]"
          />
          <h1 className="text-7xl font-black tracking-[0.4em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-slate-100 to-slate-600 drop-shadow-xl">
            DARK
          </h1>
          <p className="text-fuchsia-400 tracking-widest uppercase text-xs mt-4 font-bold">
            Folklore & Shadows
          </p>
        </div>
        <div className="z-10 w-full max-w-sm space-y-4">
          {error && (
            <div className="bg-red-950/80 text-red-300 p-3 rounded-lg text-center text-xs font-bold border border-red-500/50 uppercase tracking-widest animate-in fade-in">
              {error}
            </div>
          )}
          <input
            className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-center uppercase tracking-widest focus:border-fuchsia-500 outline-none text-lg font-black transition-all"
            placeholder="Enter Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={12}
          />
          <button
            onClick={createRoom}
            className="w-full bg-gradient-to-r from-fuchsia-900 to-purple-900 hover:from-fuchsia-800 hover:to-purple-800 text-fuchsia-100 p-4 rounded-xl font-black tracking-widest uppercase border border-fuchsia-700 transition-all active:scale-95 shadow-lg shadow-fuchsia-900/50"
          >
            Host Ritual
          </button>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded-xl text-center uppercase tracking-widest outline-none font-bold text-lg focus:border-fuchsia-500 transition-all"
              placeholder="CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button
              onClick={() => joinRoom(roomCode)}
              className="bg-slate-800 hover:bg-slate-700 p-3 rounded-xl font-black tracking-widest uppercase px-6 border border-slate-600 shadow-md"
            >
              Join
            </button>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="w-full mt-4 text-fuchsia-500 hover:text-fuchsia-400 text-sm font-bold flex items-center justify-center gap-2 transition-colors py-2"
          >
            <BookOpen size={16} /> How to Play
          </button>
        </div>
      </div>
    );

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative text-slate-200">
        <DarkAtmosphere />
        <LogoBig />
        <div className="z-10 w-full max-w-md bg-slate-900/90 p-8 rounded-3xl border border-fuchsia-900/50 shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-md">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
            {/* Ritual Code Section */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-fuchsia-400 font-bold uppercase tracking-widest">
                Ritual Code
              </span>

              <div className="flex items-center gap-3">
                {/* Smaller Room Code */}
                <span className="text-2xl sm:text-3xl font-black tracking-[0.2em] text-slate-100 drop-shadow-md">
                  {gameState.roomId}
                </span>

                {/* Inline Copy Button (No Box) */}
                <button
                  onClick={copyToClipboard}
                  className="flex items-center justify-start w-20 text-slate-400 hover:text-white transition-all"
                >
                  {isCopied ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
                      <CheckCircle size={20} className="text-emerald-400" />
                      <span className="text-[10px] sm:text-xs font-black text-emerald-400 uppercase tracking-widest mt-0.5">
                        Copied
                      </span>
                    </div>
                  ) : (
                    <Copy
                      size={20}
                      className="hover:scale-110 transition-transform"
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Leave / Flee Button */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="p-3 sm:p-4 bg-red-950/50 rounded-xl hover:bg-red-900/80 transition-colors shadow-md border border-red-900/50 h-fit my-auto"
                title="Leave Ritual"
              >
                <LogOut size={24} className="text-red-400" />
              </button>
            </div>
          </div>
          <div className="space-y-3 mb-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Initiates ({gameState.players.length}/6)
            </h3>
            {gameState.players.map((p, i) => (
              <div
                key={p.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center shadow-inner"
              >
                <span className="font-bold uppercase tracking-widest flex items-center gap-3 text-lg">
                  <span className="text-fuchsia-600 font-black bg-fuchsia-950/50 w-8 h-8 flex items-center justify-center rounded-full border border-fuchsia-900">
                    {i + 1}
                  </span>{" "}
                  {p.name}{" "}
                  {p.id === gameState.hostId && (
                    <Crown
                      size={16}
                      className="text-yellow-500 ml-2 drop-shadow-md"
                    />
                  )}
                </span>
                {isHost && p.id !== user.uid && (
                  <button
                    onClick={() => kickPlayer(p.id)}
                    className="text-red-500 hover:text-red-400 p-2"
                  >
                    <Ban size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {isHost ? (
            <button
              onClick={startRound}
              disabled={gameState.players.length < 2}
              className="w-full bg-gradient-to-r from-fuchsia-700 to-purple-700 hover:from-fuchsia-600 hover:to-purple-600 text-white p-5 rounded-xl font-black tracking-[0.2em] text-lg uppercase transition-all disabled:opacity-50 disabled:grayscale shadow-[0_0_20px_rgba(192,38,211,0.4)] flex items-center justify-center gap-3"
            >
              <Play size={24} /> Begin Descent
            </button>
          ) : (
            <div className="text-center text-slate-500 uppercase tracking-widest font-bold animate-pulse py-4 bg-slate-950 rounded-xl border border-slate-800">
              Awaiting Host...
            </div>
          )}
        </div>

        {/* Leave Confirm Modal */}
        {showLeaveConfirm && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl max-w-xs w-full text-center shadow-2xl">
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wider">
                Flee the Void?
              </h3>
              <p className="text-slate-400 mb-6 text-sm">
                {isHost
                  ? "As the host, leaving dissolves the entire ritual."
                  : "You will return to the menu."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 bg-slate-800 py-3 rounded-lg font-bold text-slate-300 hover:bg-slate-700"
                >
                  Stay
                </button>
                <button
                  onClick={handleLeave}
                  className="flex-1 bg-red-900 py-3 rounded-lg font-bold text-red-200 hover:bg-red-800"
                >
                  Flee
                </button>
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
    const isMyTurn =
      gameState.turnIndex === meIdx && gameState.turnState !== "AMULET_PROMPT";
    const amITarget =
      gameState.turnState === "AMULET_PROMPT" &&
      gameState.pendingAction?.targetId === user.uid;

    return (
      <div className="fixed inset-0 bg-slate-950 text-white flex flex-col font-sans select-none overflow-hidden">
        <DarkAtmosphere />
        {/* Cinematic Broadcast Banner */}
        {broadcastLog && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] w-[90%] max-w-2xl pointer-events-none animate-in zoom-in-95 fade-in duration-300">
            <div
              className={`p-6 md:p-8 rounded-3xl shadow-2xl border backdrop-blur-xl flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 ${
                broadcastLog.type === "success"
                  ? "bg-emerald-950/95 border-emerald-500/50 shadow-[0_0_80px_rgba(16,185,129,0.5)]"
                  : broadcastLog.type === "failure"
                    ? "bg-red-950/95 border-red-500/50 shadow-[0_0_80px_rgba(239,68,68,0.5)]"
                    : broadcastLog.type === "warning"
                      ? "bg-yellow-950/95 border-yellow-500/50 shadow-[0_0_80px_rgba(234,179,8,0.5)]"
                      : "bg-fuchsia-950/95 border-fuchsia-500/50 shadow-[0_0_80px_rgba(192,38,211,0.5)]"
              }`}
            >
              <div className="text-white drop-shadow-lg shrink-0">
                {broadcastLog.type === "success" ? (
                  <CheckCircle
                    size={48}
                    className="text-emerald-400 animate-pulse"
                  />
                ) : broadcastLog.type === "failure" ? (
                  <AlertTriangle
                    size={48}
                    className="text-red-400 animate-bounce"
                  />
                ) : broadcastLog.type === "warning" ? (
                  <Flame size={48} className="text-yellow-400 animate-pulse" />
                ) : (
                  <Sparkles
                    size={48}
                    className="text-fuchsia-400 animate-pulse"
                  />
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-lg md:text-2xl font-black uppercase tracking-[0.15em] text-slate-100 leading-snug drop-shadow-md">
                  {broadcastLog.text}
                </p>
              </div>
            </div>
          </div>
        )}
        {showGuide && <HowToPlayModal onClose={() => setShowGuide(false)} />}

        {/* Top Bar */}
        <div className="h-16 bg-slate-950/90 border-b border-fuchsia-900/30 flex items-center justify-between px-6 z-[260] shrink-0 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-4">
            <Moon
              className="text-fuchsia-600 drop-shadow-[0_0_8px_rgba(192,38,211,0.8)]"
              size={24}
            />
            <span className="font-black tracking-[0.3em] uppercase text-slate-200 text-lg hidden sm:block">
              DARK
            </span>
          </div>
          <div className="flex gap-4 items-center">
            {/* Unified Deck & Void Button */}
            <button
              onClick={() => setShowDiscard(true)}
              className="bg-slate-900/80 hover:bg-slate-800 transition-colors px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold tracking-widest uppercase border border-slate-700 shadow-inner flex items-center gap-3 sm:gap-4 cursor-pointer active:scale-95"
            >
              <div
                className="flex items-center gap-1.5 text-fuchsia-300"
                title="Cards in Deck"
              >
                <Layers size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Deck:</span>{" "}
                {gameState.deck.length}
              </div>

              {/* Subtle Divider */}
              <div className="w-[1px] h-4 bg-slate-700" />

              <div
                className="flex items-center gap-1.5 text-red-400"
                title="Cards in Discard Pile"
              >
                <LayersPlus size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Discard:</span>{" "}
                {gameState.discardPile.length}
              </div>
            </button>
            <button
              onClick={() => setShowGuide(true)}
              className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-fuchsia-400 transition-colors"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`p-2 rounded transition-colors ${showLogs ? "bg-fuchsia-900 text-fuchsia-200" : "hover:bg-slate-800 text-slate-400"}`}
            >
              <History size={18} />
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-red-900/30 rounded text-red-400"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Logs Drawer */}
        {showLogs && (
          <div className="fixed top-16 right-4 w-64 max-h-60 bg-slate-900/95 border border-slate-700 rounded-xl z-150 overflow-y-auto p-2 shadow-2xl backdrop-blur-md">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sticky top-0 bg-slate-900/95 py-2">
              Ritual Log
            </h4>
            <div className="space-y-2">
              {gameState.logs
                .slice()
                .reverse()
                .map((l) => (
                  <div
                    key={l.id}
                    className={`text-xs p-2 rounded border-l-2 ${l.type === "success" ? "border-emerald-500 bg-emerald-900/10 text-emerald-300" : l.type === "failure" ? "border-red-500 bg-red-900/10 text-red-300" : l.type === "warning" ? "border-yellow-500 bg-yellow-900/10 text-yellow-300" : "border-fuchsia-500 bg-slate-800/30 text-slate-300"}`}
                  >
                    {l.text}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Leave Modal in Game */}
        {/* Leave Modal in Game */}
        {showLeaveConfirm && (
          <div className="fixed inset-0 bg-black/90 z-[220] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl max-w-sm w-full text-center shadow-2xl">
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wider">
                Abandon Ritual?
              </h3>
              <p className="text-slate-400 mb-6 text-sm">
                {gameState.hostId === user.uid
                  ? "As host, you can dissolve the entire room or safely return everyone to the lobby."
                  : "You will flee, abandoning your progress."}
              </p>

              <div className="flex flex-col gap-3">
                {/* NEW: Return to Lobby Button (Host Only) */}
                {gameState.hostId === user.uid && (
                  <button
                    onClick={() => {
                      const resetPlayers = gameState.players.map((p) => ({
                        ...p,
                        ready: true,
                        score: 0,
                        hand: [],
                        tableau: [],
                        skipNextTurn: false,
                        finalTurnTaken: false,
                      }));
                      executeAction(
                        {
                          status: "lobby",
                          turnState: "IDLE",
                          pendingAction: null,
                          players: resetPlayers,
                          deck: [],
                          discardPile: [],
                          logs: [],
                          turnIndex: 0,
                          winnerId: null,
                          isFinalRound: false,
                        },
                        "The host aborted the ritual and returned everyone to the lobby.",
                        "warning",
                      );
                      setShowLeaveConfirm(false);
                    }}
                    className="w-full bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-500 py-3 rounded-lg font-bold uppercase tracking-widest border border-yellow-600/50 transition-colors"
                  >
                    Return All to Lobby
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLeaveConfirm(false)}
                    className="flex-1 bg-slate-800 py-3 rounded-lg font-bold text-slate-300 hover:bg-slate-700 uppercase tracking-widest"
                  >
                    Stay
                  </button>
                  <button
                    onClick={handleLeave}
                    className="flex-1 bg-red-900 py-3 rounded-lg font-bold text-red-200 hover:bg-red-800 uppercase tracking-widest"
                  >
                    {gameState.hostId === user.uid ? "Dissolve Room" : "Flee"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Central Arena */}
        <div className="flex-1 flex flex-col md:flex-row relative z-10 overflow-hidden">
          {/* Opponents Sidebar */}
          <div className="w-full md:w-80 bg-slate-950/60 border-b md:border-b-0 md:border-r border-fuchsia-900/20 overflow-x-auto md:overflow-y-auto p-3 md:p-4 flex flex-row md:flex-col gap-3 md:gap-4 custom-scrollbar shadow-2xl backdrop-blur-sm shrink-0 snap-x">
            {gameState.players.map((p, i) => {
              if (p.id === user.uid) return null;
              const isTurn =
                gameState.turnIndex === i && gameState.status !== "finished";
              return (
                <div
                  key={p.id}
                  className={`bg-slate-900/80 backdrop-blur-md p-3 md:p-4 rounded-2xl border ${isTurn ? "border-fuchsia-500 shadow-[0_0_20px_rgba(192,38,211,0.3)]" : "border-slate-800/80"} shrink-0 w-64 md:w-full transition-all relative snap-center flex flex-col gap-2`}
                >
                  {gameState.status === "finished" &&
                    gameState.winnerId === p.id && (
                      <div className="absolute inset-0 border-4 border-yellow-500 rounded-2xl animate-pulse pointer-events-none"></div>
                    )}

                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {isTurn ? (
                        <Zap
                          size={14}
                          className="text-fuchsia-400 animate-pulse shrink-0"
                        />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-700 shrink-0" />
                      )}
                      <span className="font-black text-xs md:text-sm uppercase tracking-widest text-slate-200 truncate">
                        {p.name}
                      </span>
                      {gameState.winnerId === p.id && (
                        <Crown size={12} className="text-yellow-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-fuchsia-400 font-black text-sm md:text-base bg-fuchsia-950/50 px-2 py-0.5 rounded shadow-inner shrink-0">
                      {p.score}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between items-center text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Scroll size={12} /> Hand: {p.hand.length}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers size={12} /> Sets: {p.tableau.length}
                    </div>
                  </div>

                  {/* Tableau Sets - Horizontally Scrollable */}
                  <div className="flex flex-nowrap overflow-x-auto custom-scrollbar gap-2 mt-1 min-h-[40px] pb-2 w-full">
                    {p.tableau.length === 0 && (
                      <div className="text-[10px] text-slate-600 italic uppercase flex items-center justify-center min-w-[80px] h-[52px] border border-dashed border-slate-800 rounded-lg">
                        No Sets
                      </div>
                    )}
                    {p.tableau.map((set, sIdx) => (
                      <div
                        key={sIdx}
                        className={`flex rounded-md p-1 bg-slate-950/50 shadow-inner border shrink-0 ${set.isLocked ? "border-yellow-600/50" : "border-slate-800"}`}
                      >
                        {set.cards.map((c, cIdx) => (
                          <div
                            key={c.uid}
                            className={`relative transition-transform hover:-translate-y-1 ${cIdx > 0 ? "-ml-3 md:-ml-4" : ""}`}
                          >
                            {cIdx === 0 && set.isLocked && (
                              <Shield className="absolute -top-2 -left-2 text-yellow-600 z-20 w-3 h-3 drop-shadow-md" />
                            )}
                            <CardDisplay
                              cardId={c.cardId}
                              tiny
                              disabled={set.isLocked}
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Board Status */}
          <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden relative">
            <div className="flex-1 flex flex-col justify-center items-center h-full max-h-full">
              {gameState.status !== "finished" && (
                <div className="w-full flex items-center justify-center">
                  <div className="w-full max-w-2xl py-6 md:py-10 flex items-center justify-center bg-gradient-to-r from-transparent via-fuchsia-950/60 to-transparent border-y border-fuchsia-900/50 shadow-[0_0_50px_rgba(192,38,211,0.15)] backdrop-blur-sm">
                    <span className="font-black uppercase tracking-widest md:tracking-[0.2em] text-fuchsia-300 text-sm md:text-2xl animate-pulse drop-shadow-md text-center px-4">
                      {gameState.isFinalRound
                        ? "FINAL ROUND!"
                        : isMyTurn
                          ? `Your Turn (${gameState.actionsLeft} Actions)`
                          : amITarget
                            ? "DEFEND YOURSELF!"
                            : `Waiting for ${gameState.players[gameState.turnIndex].name}`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Player HUD */}
        <div className="flex-none bg-slate-950 border-t-2 border-fuchsia-900/50 p-2 md:p-4 relative z-20 flex flex-col gap-2 md:gap-4 shadow-[0_-20px_40px_rgba(0,0,0,0.7)] backdrop-blur-md min-h-min">
          {/* Action Buttons & Stats */}
          <div className="flex flex-row justify-between items-center gap-2 md:gap-3 overflow-x-auto custom-scrollbar pb-1 md:pb-0 whitespace-nowrap">
            {/* Stats Box */}
            <div className="flex items-center justify-around sm:justify-start gap-3 sm:gap-6 bg-slate-900/80 px-3 py-1.5 sm:px-6 sm:py-3 rounded-xl border border-slate-800 shadow-inner shrink-0">
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  Total Power
                </span>
                <div className="text-lg sm:text-3xl font-black text-fuchsia-500 tracking-widest drop-shadow-[0_0_10px_rgba(217,70,239,0.5)] leading-none">
                  {me.score}
                </div>
              </div>
              <div className="w-px h-6 sm:h-10 bg-slate-700" />
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  Hand Limit
                </span>
                <div className="text-sm sm:text-xl text-slate-300 font-black uppercase tracking-widest flex items-center gap-1 sm:gap-2 leading-none">
                  <Hand size={12} className="text-slate-500 sm:w-5 sm:h-5" />{" "}
                  {me.hand.length}/7
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex gap-2 sm:gap-3 flex-nowrap items-center shrink-0">
              {isMyTurn &&
                gameState.turnState === "ACTION" &&
                gameState.status !== "finished" && (
                  <>
                    {/* Default Actions: Only show if NO cards are selected */}
                    {selectedHandCards.length === 0 && (
                      <>
                        {!gameState.isFinalRound && (
                          <button
                            onClick={actionDraw}
                            className="shrink-0 bg-slate-800 hover:bg-slate-700 px-3 py-2 sm:px-6 sm:py-3 rounded-lg md:rounded-xl text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-200 border border-slate-700 transition-all hover:scale-105 shadow-lg active:scale-95 text-center"
                          >
                            Draw 1
                          </button>
                        )}

                        <button
                          onClick={actionStealInit}
                          className="shrink-0 bg-red-950/60 hover:bg-red-900/80 px-3 py-2 sm:px-6 sm:py-3 rounded-lg md:rounded-xl text-[10px] sm:text-sm font-black uppercase tracking-widest text-red-400 border border-red-900/50 transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95"
                        >
                          <Swords
                            size={12}
                            className="sm:w-[16px] sm:h-[16px]"
                          />{" "}
                          Steal
                        </button>
                      </>
                    )}

                    {/* Contextual Actions */}
                    {selectedHandCards.length === 3 && (
                      <button
                        onClick={actionPlaySet}
                        className="shrink-0 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 px-4 py-2 sm:px-8 sm:py-3 rounded-lg md:rounded-xl text-[10px] sm:text-sm font-black uppercase tracking-widest text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-bounce active:scale-95"
                      >
                        Play Set
                      </button>
                    )}

                    {selectedHandCards.length === 1 &&
                      me.hand.find((c) => c.uid === selectedHandCards[0]) &&
                      ALL_CARDS[
                        me.hand.find((c) => c.uid === selectedHandCards[0])
                          .cardId
                      ]?.type === "SUP" && (
                        <button
                          onClick={() =>
                            actionPlaySupernatural(selectedHandCards[0])
                          }
                          className="shrink-0 bg-gradient-to-r from-fuchsia-700 to-purple-700 hover:from-fuchsia-600 hover:to-purple-600 px-4 py-2 sm:px-8 sm:py-3 rounded-lg md:rounded-xl text-[10px] sm:text-sm font-black uppercase tracking-widest text-white shadow-[0_0_20px_rgba(192,38,211,0.6)] active:scale-95 hover:scale-105 transition-all"
                        >
                          Invoke
                        </button>
                      )}

                    {selectedHandCards.length === 1 &&
                      me.hand.find((c) => c.uid === selectedHandCards[0])
                        ?.cardId === "SPELL" && (
                        <button
                          onClick={() => actionPlaySpell(selectedHandCards[0])}
                          className="shrink-0 bg-fuchsia-950 hover:bg-fuchsia-900 px-4 py-2 sm:px-8 sm:py-3 rounded-lg md:rounded-xl text-[10px] sm:text-sm font-black uppercase tracking-widest text-fuchsia-400 border border-fuchsia-700 shadow-lg active:scale-95 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                        >
                          <Sparkles size={12} className="sm:w-4 sm:h-4" /> Cast
                        </button>
                      )}

                    {/* Only show this if they cast a Spell and have bonus actions they can't use */}
                    {/* Ultimate Soft-Lock Failsafe: Only appears if the deck is empty */}
                    {gameState.deck.length === 0 && (
                      <button
                        onClick={() => {
                          executeAction(
                            finalizeAction(
                              gameState.players,
                              gameState.deck,
                              "ACTION",
                              0,
                            ),
                            `${me.name} ended their turn.`,
                            "neutral",
                          );
                          setSelectedHandCards([]);
                        }}
                        className="shrink-0 bg-transparent hover:bg-white/5 px-3 py-2 sm:px-6 sm:py-3 rounded-lg md:rounded-xl text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-500 transition-colors border border-transparent hover:border-slate-700 active:scale-95 text-center"
                      >
                        End
                      </button>
                    )}
                  </>
                )}
            </div>
          </div>

          {/* Cards Area */}
          <div className="flex flex-col md:flex-row gap-2 md:gap-6 items-stretch overflow-hidden">
            {/* Tableau */}
            <div className="w-full md:w-80 md:border-r border-b md:border-b-0 border-slate-800 pb-2 md:pb-0 md:pr-4 flex flex-row md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-y-auto custom-scrollbar shrink-0 items-center md:items-stretch min-h-[50px] md:min-h-[auto]">
              <span className="text-[7px] md:text-[10px] text-slate-600 font-black uppercase tracking-wider md:tracking-[0.2em] bg-slate-900 inline-block px-1.5 md:px-3 py-0.5 md:py-1 rounded-full shrink-0">
                Bank
              </span>
              <div className="flex flex-row md:flex-row flex-nowrap md:flex-wrap gap-1.5 sm:gap-2 items-center">
                {me.tableau.map((set, sIdx) => (
                  <div
                    key={sIdx}
                    className={`p-1 sm:p-2 rounded-md sm:rounded-xl bg-slate-900 border-2 ${set.isLocked ? "border-yellow-600 shadow-[0_0_15px_rgba(202,138,4,0.3)]" : "border-slate-800"} flex flex-nowrap md:flex-wrap gap-1 relative shrink-0`}
                  >
                    {set.isLocked && (
                      <Shield
                        className="absolute -top-1.5 sm:-top-2.5 -right-1.5 sm:-right-2.5 text-yellow-500 drop-shadow-lg z-20 bg-slate-950 rounded-full p-0.5"
                        size={14}
                      />
                    )}
                    {set.cards.map((c, cIdx) => (
                      <CardDisplay key={cIdx} cardId={c.cardId} small />
                    ))}
                  </div>
                ))}
                {me.tableau.length === 0 && (
                  <span className="text-[9px] md:text-xs text-slate-700 italic uppercase font-bold p-1 md:p-2 shrink-0">
                    Empty
                  </span>
                )}
              </div>
            </div>

            {/* Hand */}
            <div className="flex-1 overflow-x-auto flex items-center gap-1.5 sm:gap-3 custom-scrollbar pb-2 sm:pb-4 px-1 sm:px-2 pt-4 sm:pt-6 min-h-[100px]">
              {me.hand.map((c) => {
                const isSel = selectedHandCards.includes(c.uid);
                return (
                  <div
                    key={c.uid}
                    className={`transition-transform duration-300 shrink-0 ${isSel ? "-translate-y-4 sm:-translate-y-6 z-10" : "hover:-translate-y-1 sm:hover:-translate-y-2 hover:z-10"}`}
                  >
                    <CardDisplay
                      cardId={c.cardId}
                      highlight={isSel}
                      disabled={!isMyTurn || gameState.status === "finished"}
                      onClick={() => {
                        if (
                          !isMyTurn ||
                          gameState.turnState !== "ACTION" ||
                          gameState.status === "finished"
                        )
                          return;
                        if (isSel)
                          setSelectedHandCards(
                            selectedHandCards.filter((id) => id !== c.uid),
                          );
                        else
                          setSelectedHandCards([...selectedHandCards, c.uid]);
                      }}
                    />
                  </div>
                );
              })}
              {me.hand.length === 0 && (
                <span className="text-xs md:text-sm text-slate-600 font-bold uppercase tracking-widest pl-2 md:pl-4 shrink-0">
                  Hand Empty
                </span>
              )}
            </div>
          </div>
        </div>

        {/* MODALS */}
        {/* Force Discard */}
        {isMyTurn && gameState.turnState === "FORCE_DISCARD" && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-md">
            <h2 className="text-4xl font-black text-red-500 uppercase tracking-widest mb-2 animate-pulse drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]">
              Hand Limit Exceeded
            </h2>
            <p className="text-red-300 mb-8 uppercase tracking-widest text-sm font-bold bg-red-950/50 px-4 py-2 rounded-full border border-red-900">
              Select {me.hand.length - 7} cards to discard
            </p>
            <div className="flex flex-wrap justify-center gap-4 max-w-5xl mb-10">
              {me.hand.map((c) => (
                <CardDisplay
                  key={c.uid}
                  cardId={c.cardId}
                  highlight={selectedHandCards.includes(c.uid)}
                  onClick={() => {
                    if (selectedHandCards.includes(c.uid))
                      setSelectedHandCards(
                        selectedHandCards.filter((id) => id !== c.uid),
                      );
                    else if (selectedHandCards.length < me.hand.length - 7)
                      setSelectedHandCards([...selectedHandCards, c.uid]);
                  }}
                />
              ))}
            </div>
            <button
              disabled={selectedHandCards.length !== me.hand.length - 7}
              onClick={() => handleForceDiscard(selectedHandCards)}
              className="bg-red-700 hover:bg-red-600 text-white px-10 py-4 rounded-xl uppercase font-black tracking-[0.2em] shadow-[0_0_20px_rgba(239,68,68,0.5)] disabled:opacity-50 disabled:grayscale transition-all active:scale-95 text-lg"
            >
              Discard to Void
            </button>
          </div>
        )}

        {/* Free Play Prompt Overlay */}
        {isMyTurn &&
          gameState.turnState === "FREE_PLAY_PROMPT" &&
          !modalState && (
            <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
              <h2 className="text-3xl md:text-4xl font-black text-fuchsia-500 uppercase tracking-widest mb-4 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)] text-center">
                A Gift from the Void
              </h2>
              <p className="text-slate-300 mb-8 uppercase tracking-widest text-sm font-bold bg-slate-900 px-6 py-3 rounded-full border border-slate-700 text-center">
                You may play one of these drawn cards immediately for free.
              </p>
              <div className="flex flex-wrap justify-center gap-6 mb-10">
                {me.hand
                  .filter((c) => gameState.pendingAction?.uids?.includes(c.uid))
                  .map((c) => {
                    const def = ALL_CARDS[c.cardId];

                    // FIXED: Checking c.cardId instead of def.cardId
                    const isPlayable =
                      def.type === "SUP" || c.cardId === "SPELL";

                    return (
                      <div
                        key={c.uid}
                        className="flex flex-col items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800"
                      >
                        <CardDisplay cardId={c.cardId} />
                        {isPlayable ? (
                          <button
                            onClick={() => {
                              if (c.cardId === "SPELL") actionPlaySpell(c.uid);
                              else actionPlaySupernatural(c.uid);
                            }}
                            className="bg-fuchsia-700 hover:bg-fuchsia-600 px-6 py-2 rounded-lg font-black uppercase text-xs tracking-widest text-white shadow-[0_0_15px_rgba(192,38,211,0.5)] transition-all active:scale-95"
                          >
                            {c.cardId === "SPELL" ? "Cast Free" : "Invoke Free"}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 uppercase font-bold text-center px-2">
                            Must be played in a set
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
              <button
                onClick={() => {
                  const updates = finalizeAction(
                    gameState.players,
                    gameState.deck,
                    "ACTION",
                    gameState.actionsLeft,
                    true, // Enforces the "discard to 7" check if they pass and have too many cards
                  );
                  updates.pendingAction = null;
                  executeAction(
                    updates,
                    `${me.name} kept the cards for later.`,
                    "neutral",
                  );
                  setSelectedHandCards([]); // <--- ADD THIS HERE
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-8 py-3 rounded-xl uppercase font-black tracking-widest transition-colors border border-slate-700"
              >
                Keep For Later
              </button>
            </div>
          )}

        {/* Amulet Prompt - Scaled Down */}
        {amITarget && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-950 border border-red-900/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full flex flex-col items-center text-center shadow-[0_0_50px_rgba(220,38,38,0.2)] animate-in zoom-in-95 duration-200">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-red-500 blur-[30px] opacity-30 rounded-full animate-pulse"></div>
                <Shield
                  size={48}
                  className="text-red-500 animate-bounce relative z-10 drop-shadow-lg"
                />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest mb-2 drop-shadow-md">
                Incoming Attack!
              </h2>

              <p className="text-red-300 mb-8 uppercase tracking-wider text-xs font-bold bg-red-950/40 px-4 py-2.5 rounded-xl border border-red-900/50 w-full">
                An entity strikes. Burn your Amulet?
              </p>

              <div className="flex w-full gap-3">
                <button
                  onClick={() => handleAmuletResponse(true)}
                  className="flex-1 bg-gradient-to-b from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white py-3 sm:py-4 rounded-xl uppercase font-black tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:scale-105 transition-all active:scale-95 text-xs sm:text-sm border border-red-500/50"
                >
                  Burn
                </button>
                <button
                  onClick={() => handleAmuletResponse(false)}
                  className="flex-1 bg-slate-900/80 hover:bg-slate-800 text-slate-400 py-3 sm:py-4 rounded-xl uppercase font-bold tracking-widest border border-slate-700 hover:text-slate-200 transition-all hover:scale-105 active:scale-95 text-xs sm:text-sm"
                >
                  Take Hit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game State Overview Modal (Hand & Void) */}
        {showDiscard && (
          <div className="fixed inset-0 z-[270] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-950 border border-slate-700/50 rounded-3xl w-full max-w-4xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden max-h-[85vh]">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-4 md:p-6 border-b border-slate-800 bg-slate-900/50 shrink-0">
                <h3 className="text-xl md:text-2xl font-black text-slate-200 uppercase tracking-widest flex items-center gap-3 drop-shadow-md">
                  <BookOpen className="text-fuchsia-500" /> State of the Ritual
                </h3>
                <button
                  onClick={() => setShowDiscard(false)}
                  className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8">
                {/* Your Hand Section */}
                <div>
                  <h4 className="text-sm font-black text-fuchsia-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Hand size={16} /> Your Hand
                    <span className="text-xs bg-slate-900 px-2 py-0.5 rounded-full text-slate-400 border border-slate-800">
                      {me.hand.length}/7
                    </span>
                  </h4>
                  <div className="flex flex-wrap gap-4 content-start">
                    {me.hand.length === 0 ? (
                      <div className="text-slate-600 uppercase tracking-widest font-black py-6 flex flex-col items-center gap-3 w-full bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                        <Ghost size={32} className="opacity-20" />
                        Your hand is empty.
                      </div>
                    ) : (
                      me.hand.map((c, i) => (
                        <div
                          key={`${c.uid}-${i}`}
                          className="hover:-translate-y-2 transition-transform"
                        >
                          <CardDisplay cardId={c.cardId} />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* The Void Section */}
                <div>
                  <h4 className="text-sm font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <LayersPlus size={16} /> Discard Pile
                    <span className="text-xs bg-slate-900 px-2 py-0.5 rounded-full text-slate-400 border border-slate-800">
                      {gameState.discardPile.length}
                    </span>
                  </h4>
                  <div className="flex flex-wrap gap-4 content-start">
                    {gameState.discardPile.length === 0 ? (
                      <div className="text-slate-600 uppercase tracking-widest font-black py-6 flex flex-col items-center gap-3 w-full bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                        <Ghost size={32} className="opacity-20" />
                        The discard pile is currently empty.
                      </div>
                    ) : (
                      /* Reversing so the most recently discarded cards show up first */
                      [...gameState.discardPile].reverse().map((c, i) => (
                        <div key={`${c.uid}-${i}`} className="relative group">
                          {i === 0 && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-950 text-red-400 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-red-900/50 z-20 shadow-md">
                              Top
                            </div>
                          )}
                          <CardDisplay cardId={c.cardId} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generic Action Target Modals (Robust Switch System + Chaining) */}
        {(() => {
          let fallbackModal = null;
          if (gameState?.turnState === "CHAIN_MODAL" && isMyTurn) {
            const def = SUPERNATURALS[gameState.pendingAction.defId];
            fallbackModal = {
              type: def.target,
              cardUid: "CHAIN",
              def: def,
              isChain: true,
            };

            if (def.target === "SET_SWAP") {
              const validOwnSets = me.tableau.filter((s) => !s.isLocked);
              fallbackModal.validOwnSets = validOwnSets;
              fallbackModal.ownSetId =
                validOwnSets.length === 1 ? validOwnSets[0].id : null;
            }
            if (def.target === "SET_HEXWITCH") {
              const validOwnSets = me.tableau.filter(
                (s) => s.type === "BIRD" && !s.isLocked && s.cards.length === 3,
              );
              fallbackModal.validOwnSets = validOwnSets;
              fallbackModal.ownSetId =
                validOwnSets.length === 1 ? validOwnSets[0].id : null;
            }
          }
          const activeModal = modalState || fallbackModal;

          if (!activeModal || !isMyTurn) return null;

          const confirmModalAction = (data) => {
            const payload = {
              ...data,
              placementSetId: activeModal.placementSetId,
            };
            if (activeModal.isChain) resolveChain(payload);
            else resolveSupernatural(activeModal.cardUid, payload);
          };

          // FIXED FAIL-SAFE CONDITION:
          if (
            activeModal.isChain &&
            (!activeModal.validOwnSets ||
              activeModal.validOwnSets.length === 0) &&
            ["SET_SWAP", "SET_HEXWITCH"].includes(activeModal.type)
          ) {
            return (
              <div className="fixed inset-0 z-[80] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-lg">
                <div className="bg-slate-950 border border-red-700/50 p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center">
                  <AlertTriangle
                    className="text-red-500 mx-auto mb-4"
                    size={48}
                  />
                  <h3 className="text-xl font-black text-red-400 uppercase tracking-widest mb-2">
                    Power Fizzled
                  </h3>
                  <p className="text-slate-400 text-sm mb-6 uppercase font-bold tracking-widest">
                    You do not have the required sets to fulfill this entity's
                    demand.
                  </p>
                  <button
                    onClick={() => resolveChain({})}
                    className="bg-slate-800 hover:bg-slate-700 text-white w-full py-4 rounded-xl uppercase font-black tracking-widest transition-colors"
                  >
                    Yield Effect
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div className="fixed inset-0 z-[80] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-lg">
              <div className="bg-slate-950 border border-fuchsia-700/50 p-6 md:p-8 rounded-3xl max-w-4xl w-full shadow-[0_0_50px_rgba(192,38,211,0.2)]">
                <div className="flex justify-between items-center mb-6 border-b border-slate-800/80 pb-4">
                  <h3 className="text-xl md:text-2xl font-black text-fuchsia-400 uppercase tracking-widest flex items-center gap-3 drop-shadow-md">
                    <Search className="text-fuchsia-600" />{" "}
                    {activeModal.type === "CHOOSE_PLACEMENT"
                      ? "Place Entity" // <--- ADD THIS LINE
                      : activeModal.type === "PLAYER"
                        ? "Select Target"
                        : activeModal.type === "PLAYER_VIEW" ||
                            activeModal.type === "PLAYER_VIEW_STEAL"
                          ? "Gaze into a Mind"
                          : activeModal.type === "VIEW_HAND"
                            ? "The Mind Revealed"
                            : activeModal.type.includes("DISCARD")
                              ? "Search the Void"
                              : activeModal.type.includes("SET")
                                ? "Target a Banked Set"
                                : activeModal.type.includes("TABLE_CARD")
                                  ? "Target an Entity"
                                  : activeModal.type === "CARD_TYPE"
                                    ? "Name an Entity"
                                    : activeModal.type === "STEAL_PLACEMENT"
                                      ? "Place & Trigger"
                                      : activeModal.type === "OWN_SUP"
                                        ? "Select your Entity"
                                        : activeModal.type === "ORACLE"
                                          ? "River Oracle"
                                          : activeModal.type === "BROKER"
                                            ? "Grave Broker"
                                            : "Select Target"}
                  </h3>
                  {!activeModal.isChain && (
                    <button
                      onClick={() => {
                        setModalState(null);
                        setSelectedHandCards([]);
                      }}
                      className="text-slate-500 hover:text-white bg-slate-900 p-2 rounded-full border border-slate-800 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                  {/* TYPE: CHOOSE_PLACEMENT (Step 1 of Supernatural play) */}
                  {activeModal.type === "CHOOSE_PLACEMENT" && (
                    <div className="flex flex-col gap-6 items-center">
                      <div className="text-slate-400 uppercase tracking-widest text-sm font-bold bg-slate-900 px-6 py-2 rounded-full border border-slate-800">
                        Where will you place this entity?
                      </div>
                      <div className="flex flex-wrap justify-center gap-4">
                        {gameState.players[gameState.turnIndex].tableau
                          .filter(
                            (s) =>
                              s.type === "SUP" &&
                              !s.isLocked &&
                              s.cards.length < 5,
                          )
                          .map((set) => (
                            <button
                              key={set.id}
                              onClick={() =>
                                actionPlaySupernatural(
                                  activeModal.cardUid,
                                  set.id,
                                )
                              }
                              className="bg-slate-900 p-4 rounded-xl border-2 border-slate-700 hover:border-fuchsia-500 transition-all group flex flex-col items-center gap-2"
                            >
                              <div className="flex gap-1">
                                {set.cards.map((c, i) => (
                                  <CardDisplay key={i} cardId={c.cardId} tiny />
                                ))}
                              </div>
                              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                                Append to Set ({set.cards.length}/5)
                              </span>
                            </button>
                          ))}
                        <button
                          onClick={() =>
                            actionPlaySupernatural(activeModal.cardUid, "NEW")
                          }
                          className="bg-slate-900 p-4 rounded-xl border-2 border-slate-700 hover:border-fuchsia-500 transition-all flex flex-col items-center justify-center gap-2 min-w-[140px]"
                        >
                          <Layers size={24} className="text-fuchsia-400" />
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                            Start New Set
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                  {/* TYPE: PLAYER (Headless, Chainbinder init, Serpent init, Bloodfiend, Devourer, Grim, Handshifter, Silencer) */}
                  {(activeModal.type === "PLAYER" ||
                    activeModal.type === "PLAYER_VIEW" ||
                    activeModal.type === "PLAYER_VIEW_STEAL") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {gameState.players
                        .filter((p) => p.id !== user.uid)
                        .map((p) => (
                          <button
                            key={p.id}
                            disabled={
                              p.hand.length === 0 &&
                              activeModal.def?.id !== "SUP_SILENCER" &&
                              activeModal.def?.id !== "SUP_HANDSHIFTER"
                            }
                            onClick={() => {
                              if (activeModal.mode === "STEAL") {
                                const target = gameState.players.find(
                                  (pl) => pl.id === p.id,
                                );
                                const pending = {
                                  type: "STEAL",
                                  sourceId: me.id,
                                  targetId: p.id,
                                  count: 1,
                                };
                                if (
                                  target.hand.some((c) => c.cardId === "AMULET")
                                ) {
                                  const updates = {
                                    turnState: "AMULET_PROMPT",
                                    pendingAction: pending,
                                  };
                                  executeAction(
                                    updates,
                                    `${me.name} attempts to steal from ${target.name}. Waiting for defense...`,
                                    "warning",
                                  );
                                } else {
                                  const players = JSON.parse(
                                    JSON.stringify(gameState.players),
                                  );
                                  const discardPile = [
                                    ...gameState.discardPile,
                                  ];
                                  const deck = [...gameState.deck];
                                  resolveOffensiveAction(
                                    pending,
                                    players,
                                    discardPile,
                                    deck,
                                  );
                                  const updates = finalizeAction(
                                    players,
                                    deck,
                                    "ACTION",
                                    gameState.actionsLeft - 1,
                                  );
                                  updates.discardPile = discardPile;
                                  executeAction(
                                    updates,
                                    `${me.name} successfully stole from ${target.name}!`,
                                    "success",
                                  );
                                }
                                setModalState(null);
                                setSelectedHandCards([]); // <--- ADD THIS HERE
                              } else if (
                                activeModal.type === "PLAYER_VIEW_STEAL" ||
                                activeModal.type === "PLAYER_VIEW"
                              ) {
                                setModalState({
                                  ...activeModal,
                                  type: "VIEW_HAND",
                                  targetId: p.id,
                                });
                              } else {
                                confirmModalAction({ targetPlayerId: p.id });
                              }
                            }}
                            className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-left hover:border-fuchsia-500 hover:bg-slate-800 transition-all disabled:opacity-30 disabled:grayscale group shadow-md hover:shadow-[0_0_15px_rgba(192,38,211,0.3)]"
                          >
                            <div className="font-black text-xl text-slate-200 uppercase tracking-widest mb-2 group-hover:text-fuchsia-300 flex justify-between items-center">
                              {p.name}{" "}
                              <UserCheck
                                size={20}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                            </div>
                            <div className="text-xs text-slate-500 uppercase font-bold flex items-center gap-2">
                              <Scroll size={14} /> Cards in Hand:{" "}
                              <span className="text-slate-300 text-sm">
                                {p.hand.length}
                              </span>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}

                  {/* TYPE: VIEW_HAND (Serpent King) */}
                  {activeModal.type === "VIEW_HAND" && (
                    <div className="flex flex-col gap-6 items-center">
                      <div className="text-slate-400 uppercase tracking-widest text-sm font-bold bg-slate-900 px-6 py-2 rounded-full border border-slate-800 text-center">
                        The Mind Revealed
                      </div>

                      <div className="flex flex-wrap gap-4 justify-center mb-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800 w-full max-w-3xl">
                        {gameState.players
                          .find((p) => p.id === activeModal.targetId)
                          .hand.map((c, i) => (
                            <div
                              key={i}
                              className="relative hover:-translate-y-2 transition-transform"
                            >
                              {/* Removed the onClick handler so they are just static displays */}
                              <CardDisplay cardId={c.cardId} />
                            </div>
                          ))}

                        {gameState.players.find(
                          (p) => p.id === activeModal.targetId,
                        ).hand.length === 0 && (
                          <div className="text-slate-500 italic py-10 font-bold uppercase tracking-widest">
                            Their mind is empty.
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          confirmModalAction({
                            targetPlayerId: activeModal.targetId,
                          });
                        }}
                        className="bg-fuchsia-700 hover:bg-fuchsia-600 text-white px-10 py-4 rounded-xl uppercase font-black tracking-[0.2em] shadow-[0_0_20px_rgba(192,38,211,0.5)] transition-all active:scale-95 text-lg"
                      >
                        Done Observing
                      </button>
                    </div>
                  )}

                  {/* TYPE: DISCARD (Relic, Twins) */}
                  {activeModal.type.includes("DISCARD") && (
                    <div className="flex flex-col gap-6 items-center">
                      <div className="text-slate-400 uppercase tracking-widest text-sm font-bold bg-slate-900 px-6 py-2 rounded-full border border-slate-800">
                        Select {activeModal.def?.id === "SUP_TWINS" ? "2" : "1"}{" "}
                        card(s)
                      </div>
                      <div className="flex flex-wrap gap-4 justify-center">
                        {gameState.discardPile.length === 0 && (
                          <div className="text-slate-500 uppercase tracking-widest py-10 font-bold">
                            Discard Pile is empty
                          </div>
                        )}
                        {gameState.discardPile.map((c, i) => {
                          const isSel = selectedHandCards.includes(c.uid);
                          return (
                            <div key={c.uid || i} className="relative">
                              <CardDisplay
                                cardId={c.cardId}
                                highlight={isSel}
                                onClick={() => {
                                  // Determine max allowed selections based on card type
                                  const max =
                                    activeModal.def?.id === "SUP_TWINS" ||
                                    activeModal.type === "DISCARD_2"
                                      ? 2
                                      : 1;

                                  if (isSel) {
                                    setSelectedHandCards(
                                      selectedHandCards.filter(
                                        (uid) => uid !== c.uid,
                                      ),
                                    );
                                  } else {
                                    if (max === 1) {
                                      // For Relic Keeper (1 card), clicking a new card instantly replaces the selection
                                      setSelectedHandCards([c.uid]);
                                    } else if (selectedHandCards.length < max) {
                                      // For Twins of Fate (2 cards), accumulate up to max
                                      setSelectedHandCards([
                                        ...selectedHandCards,
                                        c.uid,
                                      ]);
                                    }
                                  }
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <button
                        disabled={
                          selectedHandCards.length !==
                          (activeModal.def?.id === "SUP_TWINS"
                            ? Math.min(2, gameState.discardPile.length)
                            : Math.min(1, gameState.discardPile.length))
                        }
                        onClick={() =>
                          confirmModalAction({ discardUids: selectedHandCards })
                        }
                        className="bg-fuchsia-700 hover:bg-fuchsia-600 text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest disabled:opacity-50 mt-4 shadow-lg transition-colors"
                      >
                        Confirm Selection
                      </button>
                    </div>
                  )}

                  {/* Chainbinder Modal */}
                  {activeModal.type === "CHAINBINDER" && (
                    <div className="flex flex-col gap-6">
                      <div className="text-slate-400 uppercase tracking-widest text-sm font-bold bg-slate-900 px-6 py-2 rounded-full border border-slate-800 text-center">
                        Observe all hands. Choose your victim.
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {gameState.players
                          .filter((p) => p.id !== user.uid)
                          .map((p) => (
                            <div
                              key={p.id}
                              className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3"
                            >
                              <h4 className="font-black text-fuchsia-400 uppercase tracking-widest flex items-center justify-between">
                                {p.name}
                                <button
                                  disabled={p.hand.length === 0}
                                  onClick={() =>
                                    confirmModalAction({ targetPlayerId: p.id })
                                  }
                                  className="bg-red-950 hover:bg-red-900 text-red-400 px-3 py-1 rounded text-xs disabled:opacity-30 border border-red-900/50"
                                >
                                  Steal Random
                                </button>
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {p.hand.map((c) => (
                                  <CardDisplay
                                    key={c.uid}
                                    cardId={c.cardId}
                                    tiny
                                  />
                                ))}
                                {p.hand.length === 0 && (
                                  <span className="text-xs text-slate-500">
                                    Empty
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Bloodfiend Modal */}
                  {activeModal.type === "BLOODFIEND" &&
                    (() => {
                      // Calculate if opponents even have 3 cards combined to prevent soft-locks
                      const totalOpponentCards = gameState.players
                        .filter((p) => p.id !== user.uid)
                        .reduce((sum, p) => sum + p.hand.length, 0);

                      const requiredSelections = Math.min(
                        3,
                        totalOpponentCards,
                      );
                      const selections = activeModal.selections || [];

                      return (
                        <div className="flex flex-col gap-6 items-center">
                          <div className="text-slate-400 uppercase tracking-widest text-sm font-bold bg-slate-900 px-6 py-2 rounded-full border border-slate-800 text-center">
                            Select up to {requiredSelections} targets to steal
                            from ({selections.length}/{requiredSelections})
                          </div>

                          <div className="flex flex-wrap justify-center gap-4">
                            {gameState.players
                              .filter((p) => p.id !== user.uid)
                              .map((p) => {
                                const count = selections.filter(
                                  (id) => id === p.id,
                                ).length;
                                return (
                                  <button
                                    key={p.id}
                                    // Prevents clicking if 3 targets are picked OR if trying to steal more cards than the player actually holds
                                    disabled={
                                      selections.length >= requiredSelections ||
                                      p.hand.length <= count
                                    }
                                    onClick={() => {
                                      setModalState({
                                        ...activeModal,
                                        selections: [...selections, p.id],
                                      });
                                    }}
                                    className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col items-center gap-2 hover:border-red-500 disabled:opacity-50 min-w-[120px] transition-colors"
                                  >
                                    <span className="font-black text-slate-200 uppercase tracking-widest">
                                      {p.name}
                                    </span>
                                    <span className="text-xs text-slate-500 font-bold">
                                      Cards: {p.hand.length}
                                    </span>
                                    {count > 0 && (
                                      <div className="text-red-500 font-black text-xl">
                                        TARGETED x{count}
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                          </div>

                          <div className="flex gap-4 mt-4">
                            <button
                              onClick={() =>
                                setModalState({
                                  ...activeModal,
                                  selections: [],
                                })
                              }
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold uppercase text-slate-400 transition-colors"
                            >
                              Reset
                            </button>

                            <button
                              // Disables the Strike button until exactly the required amount of targets are chosen
                              disabled={selections.length < requiredSelections}
                              onClick={() =>
                                confirmModalAction({
                                  selections: activeModal.selections,
                                })
                              }
                              className="bg-red-700 hover:bg-red-600 text-white px-8 py-3 rounded-xl uppercase font-black tracking-widest disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                            >
                              Strike
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                  {/* Hoarder Modal */}
                  {activeModal.type === "HOARDER" &&
                    (() => {
                      const selections = activeModal.selections || [];

                      // FIX: If playing from hand, subtract 1 to account for Hoarder leaving.
                      // If chaining from table (Nightwalker), hand size stays the same.
                      const actualHandSize = activeModal.isChain
                        ? me.hand.length
                        : me.hand.length - 1;

                      const needed = Math.max(0, 7 - actualHandSize);

                      return (
                        <div className="flex flex-col gap-6 items-center">
                          <div className="text-slate-400 uppercase tracking-widest text-sm font-bold bg-slate-900 px-6 py-2 rounded-full border border-slate-800 text-center">
                            Gather {needed} cards ({selections.length}/{needed})
                          </div>

                          <div className="flex flex-wrap justify-center gap-4">
                            <button
                              disabled={
                                gameState.deck.length <=
                                  selections.filter((c) => c === "DECK")
                                    .length || selections.length >= needed
                              }
                              onClick={() => {
                                setModalState({
                                  ...activeModal,
                                  selections: [...selections, "DECK"],
                                });
                              }}
                              className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col items-center gap-2 hover:border-fuchsia-500 disabled:opacity-50 min-w-[120px]"
                            >
                              <Layers size={24} className="text-fuchsia-400" />
                              <span className="font-black text-slate-200 uppercase tracking-widest">
                                Deck
                              </span>
                              {selections.filter((c) => c === "DECK").length >
                                0 && (
                                <span className="text-fuchsia-400 font-black">
                                  x
                                  {
                                    selections.filter((c) => c === "DECK")
                                      .length
                                  }
                                </span>
                              )}
                            </button>
                            {gameState.players
                              .filter((p) => p.id !== user.uid)
                              .map((p) => {
                                const count = selections.filter(
                                  (id) => id === p.id,
                                ).length;
                                return (
                                  <button
                                    key={p.id}
                                    disabled={
                                      p.hand.length <= count ||
                                      selections.length >= needed
                                    }
                                    onClick={() => {
                                      setModalState({
                                        ...activeModal,
                                        selections: [...selections, p.id],
                                      });
                                    }}
                                    className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col items-center gap-2 hover:border-red-500 disabled:opacity-50 min-w-[120px]"
                                  >
                                    <UserCheck
                                      size={24}
                                      className="text-red-400"
                                    />
                                    <span className="font-black text-slate-200 uppercase tracking-widest">
                                      {p.name}
                                    </span>
                                    {count > 0 && (
                                      <span className="text-red-500 font-black">
                                        x{count}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                          </div>
                          <div className="flex gap-4 mt-4">
                            <button
                              onClick={() =>
                                setModalState({
                                  ...activeModal,
                                  selections: [],
                                })
                              }
                              className="px-4 py-2 bg-slate-800 rounded text-xs font-bold uppercase text-slate-400"
                            >
                              Reset
                            </button>
                            <button
                              disabled={selections.length === 0 && needed > 0}
                              onClick={() =>
                                confirmModalAction({ choices: selections })
                              }
                              className="bg-fuchsia-700 hover:bg-fuchsia-600 text-white px-8 py-3 rounded-xl uppercase font-black tracking-widest disabled:opacity-50"
                            >
                              Hoard
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                  {/* TYPE: SET (Destroyer, Shapechanger, Hexwitch) */}
                  {/* TYPE: SET (Destroyer, Shapechanger, Hexwitch) */}
                  {activeModal.type.includes("SET") && (
                    <div className="flex flex-col gap-8">
                      {/* Step 1 - Choose own set to give away/sacrifice */}
                      {activeModal.ownSetId === null ? (
                        <div className="flex flex-col gap-6 items-center animate-in fade-in">
                          <div className="text-slate-400 uppercase tracking-widest text-sm font-bold bg-slate-900 px-6 py-2 rounded-full border border-slate-800 text-center">
                            {activeModal.def?.id === "SUP_SHAPECHANGER"
                              ? "Select your set to give away"
                              : "Select your Bird set to sacrifice"}
                          </div>
                          <div className="flex flex-wrap justify-center gap-4">
                            {activeModal.validOwnSets?.map((set) => (
                              <button
                                key={set.id}
                                onClick={() =>
                                  setModalState({
                                    ...activeModal,
                                    ownSetId: set.id,
                                  })
                                }
                                className="bg-slate-900 p-4 rounded-xl border-2 border-slate-700 hover:border-fuchsia-500 transition-all flex gap-1 shadow-md hover:shadow-[0_0_15px_rgba(192,38,211,0.3)]"
                              >
                                {set.cards.map((c, i) => (
                                  <CardDisplay key={i} cardId={c.cardId} tiny />
                                ))}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
                          {/* Step 2 - Choose Opponent's set (Comment safely moved INSIDE the div) */}
                          <div className="text-slate-400 uppercase tracking-widest text-sm font-bold bg-slate-900 px-6 py-2 rounded-full border border-slate-800 text-center mx-auto">
                            {activeModal.def?.id === "SUP_SHAPECHANGER"
                              ? "Select opponent's set to take"
                              : activeModal.def?.id === "SUP_HEXWITCH"
                                ? "Select opponent's set to steal"
                                : "Select a set to destroy"}
                          </div>
                          {gameState.players
                            .filter((p) => p.id !== user.uid)
                            .map((p) => (
                              <div
                                key={p.id}
                                className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800"
                              >
                                <h4 className="font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <UserCheck size={18} /> {p.name}'s Sets
                                </h4>
                                <div className="flex flex-wrap gap-4">
                                  {p.tableau.length === 0 && (
                                    <span className="text-slate-600 text-xs uppercase font-bold italic">
                                      No sets
                                    </span>
                                  )}
                                  {p.tableau.map((set) => (
                                    <button
                                      key={set.id}
                                      disabled={set.isLocked}
                                      onClick={() =>
                                        confirmModalAction({
                                          targetPlayerId: p.id,
                                          targetSetId: set.id,
                                          ownSetId: activeModal.ownSetId,
                                        })
                                      }
                                      className="bg-slate-950 p-2 rounded-xl border-2 border-slate-700 hover:border-fuchsia-500 transition-colors flex gap-1 group disabled:opacity-50 disabled:grayscale relative"
                                    >
                                      {set.isLocked && (
                                        <Shield
                                          size={24}
                                          className="absolute inset-0 m-auto text-yellow-600/50 z-10"
                                        />
                                      )}
                                      {set.cards.map((c, i) => (
                                        <CardDisplay
                                          key={i}
                                          cardId={c.cardId}
                                          tiny
                                        />
                                      ))}
                                      <div className="absolute inset-0 bg-fuchsia-500/10 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity z-10 flex items-center justify-center backdrop-blur-[1px]">
                                        <CheckCircle className="text-fuchsia-300 drop-shadow-md" />
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TYPE: TABLE_CARD (Enchantress, Nightwalker) */}
                  {activeModal.type.includes("TABLE_CARD") && (
                    <div className="flex flex-col gap-6">
                      <div className="text-slate-400 uppercase tracking-widest text-sm font-bold bg-slate-900 px-6 py-2 rounded-full border border-slate-800 text-center mx-auto mb-2">
                        {activeModal.def?.id === "SUP_ENCHANTRESS"
                          ? "Select a male entity to enthrall"
                          : "Select any entity to take"}
                      </div>

                      {gameState.players
                        .filter((p) => p.id !== user.uid)
                        .map((p) => {
                          const validSets = p.tableau.filter(
                            (s) => s.type === "SUP" && !s.isLocked,
                          );
                          if (validSets.length === 0) return null;
                          return (
                            <div
                              key={p.id}
                              className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800"
                            >
                              <h4 className="font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <UserCheck size={18} /> {p.name}'s Entities
                              </h4>
                              <div className="flex flex-col gap-3">
                                {validSets.map((set) => (
                                  <div
                                    key={set.id}
                                    className="bg-slate-950 p-3 rounded-xl border border-slate-700 flex flex-col gap-2 shadow-inner"
                                  >
                                    {set.cards.map((c) => {
                                      const def = SUPERNATURALS[c.cardId];
                                      const isValid =
                                        activeModal.def?.id ===
                                          "SUP_NIGHTWALKER" ||
                                        def?.gender === "M";

                                      return (
                                        <button
                                          key={c.uid}
                                          disabled={!isValid}
                                          onClick={() => {
                                            if (isValid) {
                                              setModalState({
                                                ...activeModal,
                                                type: "STEAL_PLACEMENT",
                                                targetPlayerId: p.id,
                                                targetSetId: set.id,
                                                targetCardUid: c.uid,
                                                stolenDef: def,
                                                triggerStolen: true, // Default to true
                                              });
                                            }
                                          }}
                                          className={`flex items-center gap-4 p-3 rounded-xl border-2 text-left transition-all ${
                                            isValid
                                              ? "border-slate-700 hover:border-fuchsia-500 bg-slate-900 hover:bg-slate-800 cursor-pointer shadow-md"
                                              : "border-slate-800 bg-slate-950 opacity-40 grayscale cursor-not-allowed"
                                          }`}
                                        >
                                          <div className="shrink-0 w-12 h-16 bg-slate-950 rounded flex flex-col items-center justify-center border border-fuchsia-900/50">
                                            <div className="text-fuchsia-400 mb-1">
                                              {def.icon ? (
                                                <def.icon size={20} />
                                              ) : (
                                                <Ghost size={20} />
                                              )}
                                            </div>
                                            <div className="text-[9px] font-black text-slate-500">
                                              {def.gender}
                                            </div>
                                          </div>
                                          <div className="flex-1">
                                            <div className="text-sm font-black text-slate-200 uppercase tracking-widest mb-1">
                                              {def.name}
                                            </div>
                                            <div className="text-xs text-fuchsia-300 font-bold leading-snug">
                                              {def.desc}
                                            </div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* TYPE: STEAL_PLACEMENT (Step 3 of Nightwalker/Enchantress play) */}
                  {activeModal.type === "STEAL_PLACEMENT" &&
                    (() => {
                      const me = gameState.players[gameState.turnIndex];
                      const baseSets = me.tableau.filter(
                        (s) => s.type === "SUP" && !s.isLocked,
                      );

                      let previewSets = [];
                      let addedToExisting = false;

                      // 1. Map existing sets and inject the source card visually if needed
                      baseSets.forEach((s) => {
                        let newCards = [...s.cards];
                        if (
                          !activeModal.isChain &&
                          s.id === activeModal.placementSetId
                        ) {
                          newCards.push({
                            cardId: activeModal.def.id,
                            uid: "temp_source",
                          });
                          addedToExisting = true;
                        }
                        if (newCards.length < 5) {
                          previewSets.push({ ...s, cards: newCards });
                        }
                      });

                      // 2. If the source card is creating a NEW set, show that new set as an option!
                      if (
                        !activeModal.isChain &&
                        (activeModal.placementSetId === "NEW" ||
                          (!addedToExisting && baseSets.length === 0))
                      ) {
                        previewSets.push({
                          id: "SAME_AS_SOURCE",
                          type: "SUP",
                          cards: [
                            { cardId: activeModal.def.id, uid: "temp_source" },
                          ],
                          isLocked: false,
                        });
                      }

                      return (
                        <div className="flex flex-col gap-6 items-center animate-in fade-in">
                          <div className="text-slate-400 uppercase tracking-widest text-sm font-bold bg-slate-900 px-6 py-2 rounded-full border border-slate-800">
                            Place stolen '{activeModal.stolenDef?.name}'
                          </div>

                          {/* Trigger Toggle */}
                          <label className="flex items-center gap-4 cursor-pointer bg-slate-950 border border-slate-700 p-4 rounded-xl hover:border-fuchsia-500 transition-all shadow-inner w-full max-w-sm group">
                            <input
                              type="checkbox"
                              className="w-6 h-6 accent-fuchsia-600 rounded cursor-pointer"
                              checked={activeModal.triggerStolen !== false}
                              onChange={(e) =>
                                setModalState({
                                  ...activeModal,
                                  triggerStolen: e.target.checked,
                                })
                              }
                            />
                            <div className="flex flex-col">
                              <span className="font-black text-fuchsia-400 uppercase tracking-widest group-hover:text-fuchsia-300 transition-colors">
                                Trigger Ability
                              </span>
                              <span className="text-[10px] text-slate-500 uppercase font-bold">
                                If unchecked, it remains dormant.
                              </span>
                            </div>
                          </label>

                          <div className="flex flex-wrap justify-center gap-4">
                            {previewSets.map((set) => (
                              <button
                                key={set.id}
                                onClick={() =>
                                  confirmModalAction({
                                    targetPlayerId: activeModal.targetPlayerId,
                                    targetSetId: activeModal.targetSetId,
                                    targetCardUid: activeModal.targetCardUid,
                                    stolenPlacementSetId: set.id,
                                    triggerStolen:
                                      activeModal.triggerStolen !== false,
                                  })
                                }
                                className="bg-slate-900 p-4 rounded-xl border-2 border-slate-700 hover:border-fuchsia-500 transition-all group flex flex-col items-center gap-2"
                              >
                                <div className="flex gap-1 items-end">
                                  {set.cards.map((c, i) => (
                                    <div
                                      key={i}
                                      className={`transition-all ${c.uid === "temp_source" ? "opacity-60 scale-90 -ml-2 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]" : ""}`}
                                    >
                                      <CardDisplay cardId={c.cardId} tiny />
                                    </div>
                                  ))}
                                </div>
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest group-hover:text-fuchsia-300 mt-1">
                                  Append to Set ({set.cards.length}/5)
                                </span>
                              </button>
                            ))}
                            <button
                              onClick={() =>
                                confirmModalAction({
                                  targetPlayerId: activeModal.targetPlayerId,
                                  targetSetId: activeModal.targetSetId,
                                  targetCardUid: activeModal.targetCardUid,
                                  stolenPlacementSetId: "NEW",
                                  triggerStolen:
                                    activeModal.triggerStolen !== false,
                                })
                              }
                              className="bg-slate-900 p-4 rounded-xl border-2 border-slate-700 hover:border-fuchsia-500 transition-all flex flex-col items-center justify-center gap-2 min-w-[140px] group"
                            >
                              <Layers
                                size={24}
                                className="text-fuchsia-400 group-hover:text-fuchsia-300"
                              />
                              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest group-hover:text-fuchsia-300">
                                Start New Set
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                  {/* TYPE: CARD_TYPE (Summoner) */}
                  {activeModal.type === "CARD_TYPE" && (
                    <div className="flex flex-col gap-4">
                      <div className="text-slate-400 uppercase tracking-widest text-sm font-bold bg-slate-900 px-6 py-2 rounded-full border border-slate-800 text-center mb-4">
                        Name a card to summon
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {Object.values(ALL_CARDS).map((def) => (
                          <button
                            key={def.id}
                            onClick={() =>
                              confirmModalAction({ namedCardId: def.id })
                            }
                            className="bg-slate-900 border-2 border-slate-800 p-2 rounded-xl hover:border-fuchsia-500 hover:bg-slate-800 transition-colors flex flex-col items-center gap-2"
                          >
                            <div
                              className={`${def.type === "SUP" ? "text-fuchsia-400" : def.color} drop-shadow-md`}
                            >
                              {def.icon ? (
                                <def.icon size={24} />
                              ) : (
                                <Ghost size={24} />
                              )}
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-300 text-center">
                              {def.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TYPE: OWN_SUP (Moon Hag) */}
                  {activeModal.type === "OWN_SUP" && (
                    <div className="flex flex-col gap-6 items-center w-full">
                      <div className="text-slate-400 uppercase tracking-widest text-sm font-bold bg-slate-900 px-6 py-2 rounded-full border border-slate-800 text-center">
                        Select an entity to re-invoke
                      </div>
                      <div className="flex flex-col gap-3 w-full max-w-2xl bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                        {me.tableau
                          .filter((s) => s.type === "SUP" && !s.isLocked)
                          .map((set) =>
                            set.cards.map((c) => {
                              const def = SUPERNATURALS[c.cardId];
                              return (
                                <button
                                  key={c.uid}
                                  onClick={() =>
                                    confirmModalAction({
                                      retriggerCardId: c.cardId,
                                    })
                                  }
                                  className="flex items-center gap-4 p-3 rounded-xl border-2 border-slate-700 hover:border-fuchsia-500 bg-slate-950 hover:bg-slate-800 transition-all text-left w-full shadow-md"
                                >
                                  <div className="shrink-0 w-12 h-16 bg-slate-900 rounded flex flex-col items-center justify-center border border-fuchsia-900/50">
                                    <div className="text-fuchsia-400">
                                      {def.icon ? (
                                        <def.icon size={20} />
                                      ) : (
                                        <Ghost size={20} />
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-black text-slate-200 uppercase tracking-widest mb-1">
                                      {def.name}
                                    </div>
                                    <div className="text-xs text-fuchsia-300 font-bold leading-snug">
                                      {def.desc}
                                    </div>
                                  </div>
                                </button>
                              );
                            }),
                          )}
                        {me.tableau.filter(
                          (s) => s.type === "SUP" && !s.isLocked,
                        ).length === 0 && (
                          <span className="text-slate-500 font-bold uppercase tracking-widest text-sm text-center py-4">
                            No valid entities in your bank.
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* River Oracle */}
                  {activeModal.type === "ORACLE" && (
                    <div className="flex flex-col gap-8 items-center">
                      <p className="text-slate-300 uppercase tracking-widest text-sm font-bold bg-slate-900 px-6 py-3 rounded-full border border-slate-700">
                        One from the deck, one from the discard pile. Keep 1.
                      </p>
                      <div className="flex gap-8">
                        {activeModal.tempCards &&
                          activeModal.tempCards
                            .filter((c) => c && c.cardId && ALL_CARDS[c.cardId]) // <--- Protects against undefined/malformed cards
                            .map((c, i) => (
                              <div
                                key={i}
                                className="flex flex-col items-center gap-4"
                              >
                                <span className="text-xs font-bold text-slate-500 uppercase">
                                  {i === 0 ? "From Deck" : "From Discard Pile"}
                                </span>
                                <CardDisplay
                                  cardId={c.cardId}
                                  onClick={() => {
                                    confirmModalAction({
                                      keptCard: c,
                                      discardedCard: activeModal.tempCards.find(
                                        (card) => card && card.uid !== c.uid,
                                      ),
                                      updatedDeck: activeModal._deck,
                                      updatedDiscard: activeModal._discard,
                                    });
                                  }}
                                />
                              </div>
                            ))}
                        {!activeModal.tempCards && (
                          <button
                            onClick={() => {
                              const deck = [...gameState.deck];
                              const discard = [...gameState.discardPile];
                              const topDeck = deck.pop();
                              const topDiscard = discard.pop();
                              const tempCards = [topDeck, topDiscard].filter(
                                Boolean,
                              );

                              setModalState({
                                ...activeModal,
                                tempCards,
                                _deck: deck,
                                _discard: discard,
                              });
                            }}
                            className="bg-fuchsia-700 hover:bg-fuchsia-600 px-8 py-4 rounded-xl text-white font-black uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(192,38,211,0.5)]"
                          >
                            Gaze into the River
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Grave Broker */}
                  {activeModal.type === "BROKER" && (
                    <div className="flex flex-col gap-8 items-center">
                      <p className="text-slate-300 uppercase tracking-widest text-sm font-bold bg-slate-900 px-6 py-3 rounded-full border border-slate-700">
                        Keep 1 card. The rest scatter to opponents.
                      </p>
                      {!activeModal.tempCards ? (
                        <button
                          onClick={() => {
                            const discard = [...gameState.discardPile];
                            const tempCards = [];
                            for (let i = 0; i < gameState.players.length; i++) {
                              if (discard.length > 0) {
                                const drawn = discard.pop();
                                // Strict check: must exist, have a uid, and have a valid cardId in ALL_CARDS
                                if (
                                  drawn &&
                                  drawn.uid &&
                                  drawn.cardId &&
                                  ALL_CARDS[drawn.cardId]
                                ) {
                                  tempCards.push(drawn);
                                }
                              }
                            }
                            setModalState({
                              ...activeModal,
                              tempCards,
                              _discard: discard,
                            });
                          }}
                          className="bg-fuchsia-700 hover:bg-fuchsia-600 px-8 py-4 rounded-xl text-white font-black uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(192,38,211,0.5)]"
                        >
                          Unearth the Graves
                        </button>
                      ) : (
                        <div className="flex flex-wrap justify-center gap-6 max-w-4xl">
                          {activeModal.tempCards &&
                            activeModal.tempCards
                              .filter(
                                (c) => c && c.cardId && ALL_CARDS[c.cardId],
                              ) // <--- Filter out bad/undefined cards
                              .map((c, i) => (
                                <CardDisplay
                                  key={i}
                                  cardId={c.cardId}
                                  onClick={() => {
                                    confirmModalAction({
                                      keptCard: c,
                                      scatterCards:
                                        activeModal.tempCards.filter(
                                          (card) => card.uid !== c.uid,
                                        ),
                                      updatedDiscard: activeModal._discard,
                                    });
                                  }}
                                />
                              ))}
                          {activeModal.tempCards.length === 0 && (
                            <span className="text-slate-500 uppercase tracking-widest font-bold">
                              The discard pile was empty.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* WIN SCREEN OVERLAY */}
        {gameState.status === "finished" && (
          <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
            <div className="bg-slate-900/80 p-8 md:p-12 rounded-3xl border border-yellow-500/50 shadow-[0_0_60px_rgba(234,179,8,0.4)] text-center animate-in zoom-in max-w-2xl w-full">
              <Crown
                size={64}
                className="text-yellow-500 mx-auto mb-4 md:mb-6 animate-bounce drop-shadow-[0_0_20px_rgba(234,179,8,0.8)]"
              />
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-[0.2em] text-white mb-3">
                {
                  gameState.players.find((p) => p.id === gameState.winnerId)
                    ?.name
                }{" "}
                Wins!
              </h2>
              <p className="text-slate-400 uppercase tracking-widest text-sm md:text-lg font-bold mb-8 md:mb-10">
                The shadows bow to them.
              </p>

              {gameState.hostId === user.uid && (
                <button
                  onClick={() => {
                    const resetPlayers = gameState.players.map((p) => ({
                      ...p,
                      ready: true,
                      score: 0,
                      hand: [],
                      tableau: [],
                      skipNextTurn: false,
                      finalTurnTaken: false,
                    }));
                    executeAction(
                      {
                        status: "lobby",
                        players: resetPlayers,
                        deck: [],
                        discardPile: [],
                        logs: [],
                        turnIndex: 0,
                        winnerId: null,
                        isFinalRound: false,
                      },
                      null,
                    );
                  }}
                  className="bg-yellow-600 hover:bg-yellow-500 text-black px-8 md:px-10 py-4 md:py-5 rounded-xl text-base md:text-lg font-black uppercase tracking-widest shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-transform hover:scale-105 active:scale-95"
                >
                  Return to Lobby
                </button>
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
