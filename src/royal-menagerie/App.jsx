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
  Crown,
  Info,
  LogOut,
  X,
  Trophy,
  RotateCcw,
  User,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  History,
  ArrowRight,
  Home,
  Hammer,
  Sparkles,
  Eye,
  Hand,
  MessageSquare,
  // ANIMAL ICONS
  Rat,
  Cat,
  Rabbit,
  Turtle,
  Fish,
  Bird,
  Snail,
  PawPrint, // Used for Dog
  Skull,
  Trash2, // Added Trash2 icon
  Copy,
  Loader,
  Play,
} from "lucide-react";
import CoverImage from "./assets/royal_cover.png";

// --- Firebase Config & Init ---
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

const APP_ID =
  typeof __app_id !== "undefined" ? __app_id : "royal-menagerie-game";
const GAME_ID = "19";

// --- Game Constants ---
const ANIMALS = {
  RAT: {
    name: "Rat",
    icon: Rat,
    color: "text-gray-200",
    bg: "bg-gray-800",
    border: "border-gray-600",
  },
  CAT: {
    name: "Cat",
    icon: Cat,
    color: "text-orange-200",
    bg: "bg-orange-900",
    border: "border-orange-700",
  },
  DOG: {
    name: "Dog",
    icon: PawPrint,
    color: "text-white",
    bg: "bg-black",
    border: "border-gray-500",
  },
  RABBIT: {
    name: "Rabbit",
    icon: Rabbit,
    color: "text-pink-200",
    bg: "bg-pink-900",
    border: "border-pink-700",
  },
  TURTLE: {
    name: "Turtle",
    icon: Turtle,
    color: "text-emerald-200",
    bg: "bg-emerald-900",
    border: "border-emerald-700",
  },
  FISH: {
    name: "Fish",
    icon: Fish,
    color: "text-blue-200",
    bg: "bg-blue-900",
    border: "border-blue-700",
  },
  BIRD: {
    name: "Bird",
    icon: Bird,
    color: "text-sky-200",
    bg: "bg-sky-900",
    border: "border-sky-700",
  },
  SNAIL: {
    name: "Snail",
    icon: Snail,
    color: "text-fuchsia-200",
    bg: "bg-fuchsia-900",
    border: "border-fuchsia-700",
  },
};

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

// --- Components ---

const GameGuideModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-200 flex items-center justify-center p-0 md:p-4 animate-in fade-in">
    <div className="bg-gray-900 md:rounded-2xl w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] overflow-hidden border-none md:border border-gray-700 shadow-2xl flex flex-col">
      <div className="p-4 md:p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800">
        <div className="flex flex-col">
          <h2 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-500 uppercase tracking-widest">
            ROYAL GUIDE
          </h2>
          <span className="text-gray-400 text-xs md:text-sm font-medium tracking-wide">
            The Court of Deception
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-full text-gray-400"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 text-gray-300">
        <div className="bg-linear-to-r from-purple-900/30 to-pink-900/30 p-4 md:p-6 rounded-2xl border border-purple-700/30">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-3 flex items-center gap-3">
            <Trophy className="text-yellow-400" size={24} /> The Objective
          </h3>
          <p className="text-sm md:text-lg leading-relaxed">
            There is only <strong>ONE LOSER</strong>. Everyone else wins.
            <br />
            <br />
            You lose if you collect:
            <br />
            1. <strong>4 cards</strong> of the same Animal.
            <br />
            2. <strong>1 card</strong> of every Animal (8 total).
            <br />
            3. Or run out of cards in your hand when you need to play.
          </p>
        </div>

        <div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <MessageSquare className="text-purple-400" size={24} /> Gameplay
          </h3>
          <div className="space-y-4 border-l-2 border-gray-700 ml-4 pl-4">
            <div>
              <h4 className="font-bold text-white text-lg">1. The Offer</h4>
              <p>
                Pick a card from your hand, pass it face-down to a player, and
                declare an animal name (e.g., "This is a Rat"). You can{" "}
                <strong>Lie</strong> or tell the <strong>Truth</strong>.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white text-lg">2. The Response</h4>
              <p>The receiver has two choices:</p>
              <ul className="list-disc ml-6 mt-1 space-y-1">
                <li>
                  <strong>Guess:</strong> Say "True" or "False". If they guess
                  right, YOU get the card face-up. If they guess wrong, THEY get
                  the card.
                </li>
                <li>
                  <strong>Peek & Pass:</strong> Peek at the card, then pass it
                  to a <em>new</em> player with a new claim.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 bg-gray-800 border-t border-gray-700 text-center sticky bottom-0">
        <button
          onClick={onClose}
          className="bg-purple-600 hover:bg-purple-500 text-white px-10 py-3 rounded-xl font-bold text-lg shadow-xl"
        >
          Enter the Court
        </button>
      </div>
    </div>
  </div>
);

const LeaveConfirmModal = ({
  onConfirmLeave,
  onConfirmLobby,
  onCancel,
  isHost,
  inGame,
}) => (
  <div className="fixed inset-0 bg-black/90 z-200 flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2">Abandon the Court?</h3>
      <p className="text-gray-400 mb-6 text-sm">
        {inGame
          ? "Leaving now will disrupt the proceedings!"
          : "Leaving the lobby will disconnect you."}
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-bold transition-colors"
        >
          Stay (Cancel)
        </button>
        {inGame && isHost && (
          <button
            onClick={onConfirmLobby}
            className="py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Home size={18} /> Return Court to Lobby
          </button>
        )}
        <button
          onClick={onConfirmLeave}
          className="bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} />{" "}
          {inGame && isHost ? "End Game for All" : "Leave Game"}
        </button>
      </div>
    </div>
  </div>
);

const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-160 flex items-center justify-center pointer-events-none">
    <div
      className={`
      flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl border-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] 
      transform transition-all animate-in fade-in zoom-in slide-in-from-bottom-10 duration-300 backdrop-blur-md
      ${
        type === "success"
          ? "bg-green-900/90 border-green-500 text-green-100"
          : ""
      }
      ${type === "failure" ? "bg-red-900/90 border-red-500 text-red-100" : ""}
      ${
        type === "neutral"
          ? "bg-purple-900/90 border-purple-500 text-purple-100"
          : ""
      }
    `}
    >
      {Icon && (
        <div className="mb-4 p-4 bg-black/30 rounded-full border-2 border-white/20">
          <Icon size={64} className="animate-bounce" />
        </div>
      )}
      <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest text-center drop-shadow-lg mb-2">
        {message}
      </h2>
      {subtext && (
        <p className="text-lg md:text-xl font-bold opacity-90 tracking-wide text-center">
          {subtext}
        </p>
      )}
    </div>
  </div>
);

const FloatingBackground = ({ isShaking }) => (
  <div
    className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${
      isShaking ? "animate-shake bg-red-900/20" : ""
    }`}
  >
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-yellow-900/20 via-gray-950 to-black" />
    <div className="absolute top-0 left-0 w-full h-full opacity-10">
      {[...Array(20)].map((_, i) => {
        const fruitKeys = Object.keys(ANIMALS);
        const Icon = ANIMALS[fruitKeys[i % fruitKeys.length]].icon;
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

const Logo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <PawPrint size={12} className="text-purple-500" />
    <span className="text-[10px] font-black tracking-widest text-purple-500 uppercase">
      ROYAL MENAGERIE
    </span>
  </div>
);

const LogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <PawPrint size={20} className="text-purple-500" />
    <span className="text-[20px] font-black tracking-widest text-purple-500 uppercase">
      ROYAL MENAGERIE
    </span>
  </div>
);

const InfoModal = ({ title, text, onClose, type = "info", card = null }) => (
  <div className="fixed inset-0 bg-black/90 z-150 flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-gray-800 border-2 border-purple-600 rounded-xl p-6 w-full max-w-sm shadow-2xl relative">
      <div className="flex flex-col items-center text-center gap-4">
        {type === "error" ? (
          <AlertTriangle className="text-red-500 w-12 h-12" />
        ) : type === "loss" ? (
          <Skull className="text-red-500 w-12 h-12 animate-bounce" />
        ) : (
          <Info className="text-purple-400 w-12 h-12" />
        )}
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <p className="text-gray-300 text-lg">{text}</p>
        {card && (
          <div className="my-2">
            <span className="text-xs text-gray-500 uppercase font-bold mb-1 block">
              The Card Was
            </span>
            <CardDisplay type={card} small />
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-lg font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors"
        >
          {type === "loss" ? "Accept Fate" : "Understood"}
        </button>
      </div>
    </div>
  </div>
);

// --- NEW COMPONENT: Interaction Modal for Spectators ---
const InteractionModal = ({ turnState, players, currentUserId }) => {
  if (!turnState) return null;

  // Only show if the current user is NOT involved in the turn
  if (
    turnState.originId === currentUserId ||
    turnState.holderId === currentUserId
  )
    return null;

  const originPlayer = players.find((p) => p.id === turnState.originId);
  const targetPlayer = players.find((p) => p.id === turnState.holderId);
  const declaredAnimal = ANIMALS[turnState.declaredType];

  if (!originPlayer || !targetPlayer || !declaredAnimal) return null;

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-80 pointer-events-none animate-in fade-in zoom-in">
      <div className="bg-gray-900/90 border-2 border-purple-500/50 backdrop-blur-md p-4 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.3)] flex flex-col items-center gap-3 w-64 md:w-80">
        <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-widest">
          <Eye size={14} className="animate-pulse" /> Live Interaction
        </div>

        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center mb-1">
              <User size={20} className="text-gray-400" />
            </div>
            <span className="text-xs font-bold text-gray-300 max-w-[80px] truncate">
              {originPlayer.name}
            </span>
          </div>

          <div className="flex flex-col items-center px-2">
            <ArrowRight className="text-purple-500 animate-pulse" />
            <span className="text-[10px] text-purple-400 font-bold mt-1">
              OFFERS
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center mb-1">
              <User size={20} className="text-gray-400" />
            </div>
            <span className="text-xs font-bold text-gray-300 max-w-[80px] truncate">
              {targetPlayer.name}
            </span>
          </div>
        </div>

        <div className="w-full bg-gray-800/50 rounded-lg p-2 flex items-center justify-center gap-2 border border-gray-700">
          <span className="text-gray-400 text-sm">Claim:</span>
          <div
            className={`flex items-center gap-1 font-bold ${declaredAnimal.color}`}
          >
            <declaredAnimal.icon size={16} />
            <span>{declaredAnimal.name}</span>
          </div>
        </div>

        <div className="text-[10px] text-gray-500 italic text-center w-full">
          Waiting for {targetPlayer.name} to decide...
        </div>
      </div>
    </div>
  );
};

const CardDisplay = ({
  type,
  onClick,
  disabled,
  highlight,
  small,
  tiny,
  isFaceDown,
}) => {
  if (isFaceDown) {
    return (
      <div
        onClick={onClick}
        className={`relative rounded-xl border-2 border-purple-800 bg-purple-950 shadow-lg flex items-center justify-center
            ${small ? "w-12 h-16" : "w-24 h-36 md:w-32 md:h-48"} 
            ${
              disabled
                ? "opacity-50"
                : "cursor-pointer hover:scale-105 transition-transform"
            }`}
      >
        <Cat className="text-purple-700 opacity-20" size={small ? 16 : 48} />
      </div>
    );
  }

  const card = ANIMALS[type];
  if (!card) return <div className="w-16 h-24 bg-gray-700 rounded"></div>;

  const sizeClasses = small
    ? "w-12 h-16 md:w-16 md:h-24"
    : "w-24 h-36 md:w-32 md:h-48";
  const iconSize = small
    ? "w-6 h-6 md:w-8 md:h-8"
    : "w-12 h-12 md:w-16 md:h-16";
  const textSize = small ? "text-[8px] md:text-[10px]" : "text-sm md:text-base";

  if (tiny) {
    return (
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center ${card.bg} border border-gray-400`}
        title={card.name}
      >
        <card.icon className={`${card.color} w-3 h-3`} />
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative rounded-xl border-4 shadow-lg transition-all flex flex-col items-center justify-center gap-1 md:gap-2
        ${sizeClasses}
        ${highlight ? "ring-4 ring-yellow-400 scale-105 z-10" : card.border}
        ${card.bg} 
        ${
          disabled
            ? "opacity-50 cursor-not-allowed grayscale"
            : "hover:scale-105 cursor-pointer"
        }
      `}
    >
      <div className="flex-1 flex items-center justify-center">
        <card.icon className={`${card.color} ${iconSize} drop-shadow-md`} />
      </div>
      <div
        className={`font-black uppercase tracking-wider ${textSize} ${card.color} w-full text-center pb-2 md:pb-4`}
      >
        <span>{card.name}</span>
      </div>
    </button>
  );
};

const LogViewer = ({ logs, onClose }) => (
  <div className="fixed top-16 right-4 w-64 max-h-60 bg-gray-900/95 border border-gray-700 rounded-xl z-155 overflow-y-auto p-2 shadow-2xl">
    <div className="bg-gray-800 w-full md:max-w-md h-full md:h-[70vh] flex flex-col border border-gray-700 md:rounded-xl">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
        <h3 className="text-white font-bold text-lg">Court Records</h3>
        <button onClick={onClose} className="p-2 bg-gray-700 rounded-full">
          <X className="text-gray-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {[...logs].reverse().map((log, i) => (
          <div
            key={i}
            className={`text-xs md:text-sm p-3 rounded border-l-2 ${
              log.type === "danger"
                ? "bg-red-900/20 border-red-500 text-red-200"
                : log.type === "success"
                  ? "bg-green-900/20 border-green-500 text-green-200"
                  : "bg-gray-700/50 border-gray-500 text-gray-300"
            }`}
          >
            {log.text}
          </div>
        ))}
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
    const saved = localStorage.getItem("royal_menagerie_roomId"); 
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
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-pink-500/50">
          <Loader size={48} className="animate-spin mb-4" />
          <div className="font-mono text-xs tracking-[0.3em] animate-pulse">
            INITIALIZING SYSTEM...
          </div>
        </div>
      )}

      {/* Background Image Container */}
      {/* Opacity 0 -> 100 ensures a smooth fade-in once loaded */}
      <div className={`absolute inset-0 z-0 overflow-hidden transition-opacity duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
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
export default function RoyalMenagerie() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("splash");

  // Initialize roomId from localStorage if available
  const [roomId, setRoomId] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLogs, setShowLogs] = useState(false);

  // Game Actions UI
  const [selectedCard, setSelectedCard] = useState(null);
  const [targetPlayerId, setTargetPlayerId] = useState(null);
  const [declaredAnimal, setDeclaredAnimal] = useState(null);

  // States for Modals
  const [showPeekModal, setShowPeekModal] = useState(false);
  const [forwardingPhase, setForwardingPhase] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showGuide, setShowGuide] = useState(false); // Game Guide State

  const [feedbackOverlay, setFeedbackOverlay] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  //read and fill global name
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem("gameHub_playerName") || "",
  );
  //set global name for all game
  useEffect(() => {
    if (playerName) localStorage.setItem("gameHub_playerName", playerName);
  }, [playerName]);

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
    const savedRoomId = localStorage.getItem("royal_menagerie_roomId");

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
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists() && doc.data()[GAME_ID]?.maintenance)
        setIsMaintenance(true);
      else setIsMaintenance(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (!data.players.some((p) => p.id === user.uid)) {
            // User was removed from the game (or game data corruption)
            localStorage.removeItem("royal_menagerie_roomId");
            setRoomId("");
            setView("menu");
            setError("You have been removed from the court.");
            return;
          }
          setGameState(data);
          if (data.status === "lobby") setView("lobby");
          else setView("game");
        } else {
          // Room does not exist anymore
          localStorage.removeItem("royal_menagerie_roomId");
          setRoomId("");
          setView("menu");
          setError("The court has been dissolved.");
        }
      },
    );
    return () => unsub();
  }, [roomId, user]);

  const triggerFeedback = (type, message, subtext, icon) => {
    setFeedbackOverlay({ type, message, subtext, icon });
    setTimeout(() => setFeedbackOverlay(null), 3000);
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
        {
          id: user.uid,
          name: playerName,
          hand: [],
          faceUpCards: [],
          eliminated: false,
          ready: false,
        },
      ],
      turnState: null,
      turnIndex: 0,
      logs: [],
      winnerId: null,
    };
    await setDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
      initialData,
    );

    // Save to local storage so refresh doesn't kill session
    localStorage.setItem("royal_menagerie_roomId", newId);
    setRoomId(newId);

    setView("lobby");
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCodeInput || !playerName)
      return setError("Code and Name required");
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
      setError("Room not found");
      setLoading(false);
      return;
    }

    const data = snap.data();
    if (data.status !== "lobby") {
      // Allow re-joining if player is already in the list (reconnection handling logic handled by main useEffect, but safety check here)
      if (!data.players.find((p) => p.id === user.uid)) {
        setError("Game in progress");
        setLoading(false);
        return;
      }
    }

    if (
      data.players.length >= 7 &&
      !data.players.find((p) => p.id === user.uid)
    ) {
      setError("Room full");
      setLoading(false);
      return;
    }

    if (!data.players.find((p) => p.id === user.uid)) {
      const newPlayers = [
        ...data.players,
        {
          id: user.uid,
          name: playerName,
          hand: [],
          faceUpCards: [],
          eliminated: false,
          ready: false,
        },
      ];
      await updateDoc(ref, { players: newPlayers });
    }

    // Save to local storage so refresh doesn't kill session
    localStorage.setItem("royal_menagerie_roomId", roomCodeInput);
    setRoomId(roomCodeInput);

    setLoading(false);
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
    const snap = await getDoc(roomRef);
    if (snap.exists()) {
      const data = snap.data();
      const isHost = data.hostId === user.uid;

      if (isHost || data.players.length <= 1) {
        await deleteDoc(roomRef);
      } else {
        const newPlayers = data.players.filter((p) => p.id !== user.uid);
        await updateDoc(roomRef, { players: newPlayers });
      }
    }

    // Clear local storage on explicit leave
    localStorage.removeItem("royal_menagerie_roomId");
    setRoomId("");

    setView("menu");
    setGameState(null);
    setShowLeaveConfirm(false);
  };

  const kickPlayer = async (pid) => {
    if (!gameState || gameState.hostId !== user.uid) return;
    const players = gameState.players.filter((p) => p.id !== pid);
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players },
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

  const resetToLobby = async () => {
    if (!gameState || gameState.hostId !== user.uid) return;
    const players = gameState.players.map((p) => ({
      ...p,
      hand: [],
      faceUpCards: [],
      eliminated: false,
      ready: false,
    }));
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        players,
        turnState: null,
        logs: [],
        winnerId: null,
      },
    );
    setShowLeaveConfirm(false);
  };

  const restartGame = async () => {
    if (!gameState || gameState.hostId !== user.uid) return;
    startGame();
  };

  const startGame = async () => {
    if (gameState.hostId !== user.uid) return;

    const players = gameState.players.map((p) => ({
      ...p,
      hand: [],
      faceUpCards: [],
      eliminated: false,
      ready: false, // Reset ready status
    }));
    const pCount = players.length;

    let deck = [];
    Object.keys(ANIMALS).forEach((key) => {
      for (let i = 0; i < 9; i++) deck.push(key);
    });
    deck = shuffle(deck);

    const remainder = deck.length % pCount;
    for (let i = 0; i < remainder; i++) deck.pop();
    if (pCount < 4) {
      deck.pop();
      deck.pop();
      deck.pop();
    }

    let pIdx = 0;
    while (deck.length > 0) {
      players[pIdx].hand.push(deck.pop());
      pIdx = (pIdx + 1) % pCount;
    }

    const startIdx = Math.floor(Math.random() * pCount);

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        players,
        turnIndex: startIdx,
        turnState: null,
        winnerId: null,
        logs: [
          {
            id: Date.now().toString(),
            text: "The Royal Menagerie is open! Let the deception begin.",
            type: "neutral",
          },
        ],
      },
    );
  };

  const initiatePass = async () => {
    if (!selectedCard || !targetPlayerId || !declaredAnimal) return;
    const players = [...gameState.players];
    const myIdx = players.findIndex((p) => p.id === user.uid);
    const myPlayer = players[myIdx];

    const cardIdx = myPlayer.hand.indexOf(selectedCard);
    if (cardIdx === -1) return;
    myPlayer.hand.splice(cardIdx, 1);

    const newTurnState = {
      activeCard: selectedCard,
      declaredType: declaredAnimal,
      holderId: targetPlayerId,
      originId: user.uid,
      passedTrace: [user.uid],
    };

    // FIX: Added optional chaining and fallback for player name
    const targetName =
      gameState.players.find((p) => p.id === targetPlayerId)?.name || "Unknown";

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players,
        turnState: newTurnState,
        logs: arrayUnion({
          id: Date.now().toString(),
          text: `${myPlayer.name} passed a card to ${targetName} claiming it is a ${ANIMALS[declaredAnimal].name}.`,
          type: "neutral",
        }),
      },
    );

    setSelectedCard(null);
    setTargetPlayerId(null);
    setDeclaredAnimal(null);
  };

  const handleGuess = async (isTrue) => {
    const ts = gameState.turnState;
    const actual = ts.activeCard;
    const claim = ts.declaredType;
    const isActuallyTrue = actual === claim;
    const guessCorrect =
      (isTrue && isActuallyTrue) || (!isTrue && !isActuallyTrue);

    const loserId = guessCorrect ? ts.originId : user.uid;
    const winnerId = guessCorrect ? user.uid : ts.originId;

    const players = [...gameState.players];
    const loserIdx = players.findIndex((p) => p.id === loserId);

    // FIX: Safety check
    if (loserIdx === -1) return;

    players[loserIdx].faceUpCards.push(actual);

    const loser = players[loserIdx];
    const loserName = loser.name;

    // FIX: Added optional chaining for winner name lookup
    const winnerName =
      players.find((p) => p.id === winnerId)?.name || "Unknown";

    let logText = guessCorrect
      ? `${winnerName} correctly guessed! ${loserName} takes the ${ANIMALS[actual].name}.`
      : `${winnerName} guessed wrong! They take the ${ANIMALS[actual].name}.`;

    if (user.uid === winnerId)
      triggerFeedback(
        "success",
        "CORRECT!",
        `${loserName} takes the card`,
        CheckCircle,
      );
    else if (user.uid === loserId)
      triggerFeedback(
        "failure",
        "WRONG!",
        `You take the ${ANIMALS[actual].name}`,
        X,
      );
    else triggerFeedback("neutral", "RESULT", logText, Info);

    const counts = {};
    loser.faceUpCards.forEach((c) => (counts[c] = (counts[c] || 0) + 1));

    let isGameOver = false;
    let lossReason = "";

    if (Object.values(counts).some((c) => c >= 4)) {
      isGameOver = true;
      lossReason = `collected 4 ${ANIMALS[actual].name}s`;
    } else if (Object.keys(counts).length === 8) {
      isGameOver = true;
      lossReason = "collected every animal type";
    } else if (loser.hand.length === 0) {
      isGameOver = true;
      lossReason = "ran out of cards to play";
    }

    const updates = {
      players,
      turnState: null,
      turnIndex: loserIdx,
      logs: arrayUnion({
        id: Date.now().toString(),
        text: logText,
        type: guessCorrect ? "success" : "danger",
      }),
    };

    if (isGameOver) {
      updates.status = "finished";
      updates.winnerId = loserId;
      updates.logs = arrayUnion({
        id: Date.now().toString(),
        text: `GAME OVER! ${loserName} ${lossReason} and is the Royal Fool!`,
        type: "danger",
      });
    }

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      updates,
    );
  };

  const handleForward = async () => {
    if (!targetPlayerId || !declaredAnimal) return;
    const ts = gameState.turnState;
    const newTrace = [...ts.passedTrace, user.uid];

    const newTurnState = {
      ...ts,
      holderId: targetPlayerId,
      originId: user.uid,
      declaredType: declaredAnimal,
      passedTrace: newTrace,
    };

    // FIX: Added optional chaining
    const userName =
      gameState.players.find((p) => p.id === user.uid)?.name || "Unknown";

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        turnState: newTurnState,
        logs: arrayUnion({
          id: Date.now().toString(),
          text: `${userName} looked and passed the card.`,
          type: "neutral",
        }),
      },
    );

    setForwardingPhase(false);
    setTargetPlayerId(null);
    setDeclaredAnimal(null);
  };

  const getValidTargets = (trace = []) => {
    return gameState.players.filter(
      (p) => p.id !== user.uid && !trace.includes(p.id) && !p.eliminated,
    );
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
            The Queen is feeding the royal animals. The animals will return
            after some rest.
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

  if (!user)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-purple-500 animate-pulse">
        Openning cages...
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

  // --- Views ---
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
            className="flex items-center gap-2 text-purple-800 rounded-lg 
			font-bold shadow-md hover:text-purple-400 transition-colors w-fit animate-pulse"
          >
            {/* Arrow Icon */}
            <StepBack />
            <span>Back to Gamehub</span>
          </a>
        </nav>
        {/* --- END OF BACK BUTTON --- */}
        {showGuide && <GameGuideModal onClose={() => setShowGuide(false)} />}
        <div className="z-10 text-center mb-10">
          <PawPrint
            size={80}
            className="text-purple-500 mx-auto mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
          />
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-linear-to-b from-purple-400 to-pink-600 font-serif tracking-widest drop-shadow-md">
            ROYAL MENAGERIE
          </h1>
          <p className="text-white-400/60 tracking-[0.3em] uppercase mt-2">
            The Court of Deception
          </p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur border border-purple-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm border border-red-800">
              {error}
            </div>
          )}
          <input
            className="w-full bg-black/50 border border-gray-600 p-3 rounded mb-4 text-white placeholder-gray-500 focus:border-purple-500 outline-none transition-colors"
            placeholder="Your Title (Name)"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-linear-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 p-4 rounded font-bold mb-4 flex items-center justify-center gap-2 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all"
          >
            <Crown size={20} /> Establish Court
          </button>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              className="w-full sm:flex-1 bg-black/50 border border-gray-600 p-3 rounded text-white placeholder-gray-500 uppercase font-mono tracking-wider focus:border-purple-500 outline-none"
              placeholder="CODE"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 border border-gray-600 px-6 py-3 rounded font-bold transition-colors"
            >
              Join
            </button>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="w-full text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 py-2"
          >
            <BookOpen size={16} /> Royal Guide
          </button>
        </div>
        <div className="absolute bottom-4 text-slate-600 text-xs text-center">
          Inspired by Cockroach Poker. A tribute game.
          <br />
          Developed by <strong>RAWFID K SHUVO</strong>. Visit{" "}
          <a
            href={import.meta.env.BASE_URL}
            //target="_blank"
            rel="noopener noreferrer"
            className="text-purple-500 underline hover:text-purple-600"
          >
            GAMEHUB
          </a>{" "}
          for more games.
        </div>
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 relative">
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
        <div className="z-10 w-full max-w-lg bg-gray-900/90 backdrop-blur p-8 rounded-2xl border border-purple-900/50 shadow-2xl mb-4">
          <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
            {/* Grouping Title and Copy Button together on the left */}
            <div>
              <h2 className="text-lg md:text-xl text-purple-400 font-bold uppercase">
                Court Room
              </h2>

              {/* Flex container to align ID and Button side-by-side */}
              <div className="flex items-center gap-3 mt-1">
                <div className="text-2xl md:text-3xl font-mono text-white font-black">
                  {roomId}
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
              className="p-2 bg-red-900/30 hover:bg-red-900/50 rounded text-red-300"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="space-y-2 mb-8">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-gray-800/50 p-3 rounded border border-gray-700/50"
              >
                <span
                  className={`font-bold flex items-center gap-2 ${
                    p.id === user.uid ? "text-purple-400" : "text-gray-300"
                  }`}
                >
                  {p.id === gameState.hostId && (
                    <Crown size={14} className="text-yellow-500" />
                  )}
                  {p.name}
                </span>
                {isHost && p.id !== user.uid && (
                  <button
                    onClick={() => kickPlayer(p.id)}
                    className="text-gray-500 hover:text-red-500 transition-colors p-1"
                    title="Kick Player"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            {gameState.players.length < 2 && (
              <div className="text-gray-500 italic text-center">
                Waiting for diplomats...
              </div>
            )}
          </div>

          {isHost ? (
            <button
              onClick={startGame}
              disabled={gameState.players.length < 2}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                gameState.players.length >= 2
                  ? "bg-green-700 hover:bg-green-600 text-white"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }`}
            >
              {gameState.players.length < 2
                ? "Awaiting Diplomats..."
                : "Start the Masquerade"}
            </button>
          ) : (
            <div className="text-center text-purple-400/60 animate-pulse font-serif italic">
              The Host is preparing the deck...
            </div>
          )}
        </div>
        <Logo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const isHost = gameState.hostId === user.uid;
    const myPlayer = gameState.players.find((p) => p.id === user.uid);
    const isMyTurn =
      gameState.status === "playing" &&
      !gameState.turnState &&
      gameState.players[gameState.turnIndex]?.id === user.uid;
    const isReceiving =
      gameState.status === "playing" &&
      gameState.turnState &&
      gameState.turnState.holderId === user.uid;
    const loserId = gameState.winnerId;

    // Check if all GUESTS are ready
    const allGuestsReady = gameState.players
      .filter((p) => p.id !== gameState.hostId)
      .every((p) => p.ready);

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden font-sans">
        <FloatingBackground />
        {feedbackOverlay && <FeedbackOverlay {...feedbackOverlay} />}
        {activeModal && (
          <InfoModal {...activeModal} onClose={() => setActiveModal(null)} />
        )}
        {showLogs && (
          <LogViewer logs={gameState.logs} onClose={() => setShowLogs(false)} />
        )}
        {showGuide && <GameGuideModal onClose={() => setShowGuide(false)} />}

        {/* NEW: Interaction Modal for Spectators */}
        {gameState.status === "playing" && (
          <InteractionModal
            turnState={gameState.turnState}
            players={gameState.players}
            currentUserId={user.uid}
          />
        )}

        {showLeaveConfirm && (
          <LeaveConfirmModal
            onCancel={() => setShowLeaveConfirm(false)}
            onConfirmLeave={leaveRoom}
            onConfirmLobby={() => {
              resetToLobby();
              setShowLeaveConfirm(false);
            }}
            isHost={isHost}
            inGame={true}
          />
        )}

        {/* Top Bar */}
        <div className="h-14 bg-gray-900/80 border-b border-gray-800 flex items-center justify-between px-4 z-160 backdrop-blur-md sticky top-0">
          <span className="font-serif text-purple-500 font-bold tracking-wider">
            ROYAL MENAGERIE
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGuide(true)}
              className="p-2 hover:bg-gray-800 rounded text-gray-400"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`p-2 rounded-full ${
                showLogs
                  ? "bg-purple-900 text-purple-400"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              <History size={18} />
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-red-900/50 rounded text-red-400"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* GAME OVER SCREEN */}
        {gameState.status === "finished" && (
          <div className="fixed inset-0 top-14 bg-black/95 z-150 flex flex-col items-center justify-center p-4 text-center animate-in fade-in">
            <Skull size={64} className="text-red-500 mb-6 animate-bounce" />
            <h1 className="text-3xl md:text-5xl font-black text-white mb-2 uppercase tracking-widest">
              Game Over
            </h1>
            <div className="text-xl md:text-2xl text-gray-300 mb-8 max-w-lg">
              <span className="text-red-400 font-bold text-3xl block mb-2">
                {gameState.players.find((p) => p.id === loserId)?.name}
              </span>
              is the Royal Fool!
            </div>

            {/* Ready Status for Players */}
            <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-md">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    p.ready
                      ? "border-green-500 bg-green-900/20 text-green-300"
                      : "border-gray-600 bg-gray-800 text-gray-400"
                  }`}
                >
                  {p.name} {p.ready && "✓"}
                </div>
              ))}
            </div>

            <div className="w-full max-w-xs space-y-3">
              {isHost ? (
                <>
                  <button
                    onClick={restartGame}
                    disabled={!allGuestsReady}
                    className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                      allGuestsReady
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:scale-105"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                    }`}
                  >
                    <RotateCcw size={20} /> Restart Court
                  </button>
                  <button
                    onClick={resetToLobby}
                    disabled={!allGuestsReady}
                    className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                      allGuestsReady
                        ? "border-2 border-green-600 text-green-500 hover:bg-green-600/10"
                        : "border-2 border-gray-700 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    <Home size={20} /> Return to Lobby
                  </button>
                  {!allGuestsReady && (
                    <p className="text-gray-500 text-sm animate-pulse">
                      Waiting for diplomats to be ready...
                    </p>
                  )}
                </>
              ) : !myPlayer.ready ? (
                <button
                  onClick={toggleReady}
                  className="w-full py-3 rounded-xl font-bold text-lg bg-green-600 hover:bg-green-500 text-white shadow-lg animate-pulse hover:scale-105 transition-all"
                >
                  Ready for Next Game
                </button>
              ) : (
                <div className="w-full py-3 bg-gray-800 rounded-xl font-bold text-green-400 border border-green-500/50 flex items-center justify-center gap-2">
                  <CheckCircle size={20} /> Waiting for Host...
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 p-2 md:p-4 flex flex-col items-center justify-between relative z-10 max-w-6xl mx-auto w-full">
          {/* Opponents Area */}
          <div className="flex flex-wrap justify-center gap-2 w-full mb-4">
            {gameState.players.map((p, i) => {
              if (p.id === user.uid) return null;
              const isActive = gameState.turnState
                ? gameState.turnState.holderId === p.id
                : gameState.players[gameState.turnIndex] &&
                  gameState.turnIndex === i;
              // ^^^ Added check to ensure turnIndex points to a valid player
              const isTargetable =
                (isMyTurn && selectedCard) || forwardingPhase;
              const validTargets = getValidTargets(
                forwardingPhase ? gameState.turnState.passedTrace : [],
              );
              const canSelect =
                isTargetable && validTargets.some((t) => t.id === p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => (canSelect ? setTargetPlayerId(p.id) : null)}
                  className={`relative bg-gray-900/90 p-2 rounded-lg border-2 w-28 md:w-36 flex flex-col items-center transition-all
                                              ${
                                                isActive
                                                  ? "border-yellow-500 shadow-lg shadow-yellow-500/20"
                                                  : "border-gray-700"
                                              }
                                              ${
                                                canSelect
                                                  ? "cursor-pointer ring-2 ring-green-500 hover:scale-105"
                                                  : ""
                                              }
                                              ${
                                                targetPlayerId === p.id
                                                  ? "bg-green-900/30 ring-4 ring-green-400"
                                                  : ""
                                              }
                                             `}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-xs font-bold truncate text-gray-300">
                      {p.name}
                    </span>
                    <div className="flex items-center gap-1 bg-black/40 px-1.5 rounded">
                      <Hand size={10} className="text-gray-400" />
                      <span className="text-xs font-bold">{p.hand.length}</span>
                    </div>
                  </div>

                  {/* Face Up Cards */}
                  <div className="flex flex-wrap justify-center gap-1 min-h-8">
                    {p.faceUpCards.sort().map((c, idx) => (
                      <CardDisplay key={idx} type={c} tiny />
                    ))}
                    {p.faceUpCards.length === 0 && (
                      <span className="text-[10px] text-gray-600">
                        Safe... for now
                      </span>
                    )}
                  </div>

                  {isActive && (
                    <div className="absolute -top-2 bg-yellow-600 text-[10px] font-bold px-2 rounded-full text-white">
                      ACTIVE
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Status Text */}
          <div className="my-2 bg-black/60 px-4 py-2 rounded-full backdrop-blur text-sm md:text-lg text-center font-bold text-gray-200 border border-gray-700">
            {!gameState.turnState ? (
              isMyTurn ? (
                <span className="text-green-400">
                  Your Turn! Select a card from hand.
                </span>
              ) : (
                `Waiting for ${
                  gameState.players[gameState.turnIndex]?.name || "Player"
                }...`
              )
            ) : isReceiving ? (
              <span className="text-yellow-400 animate-pulse">
                Incoming Card! Is it true or false?
              </span>
            ) : (
              `${
                gameState.players.find(
                  (p) => p.id === gameState.turnState.holderId,
                )?.name || "Opponent"
              } is deciding...`
            )}
          </div>

          {/* MODAL: SNEAK PEEK (Centered & Isolated) */}
          {showPeekModal && (
            <div className="fixed inset-0 bg-black/95 z-200 flex items-center justify-center p-4 animate-in zoom-in">
              <div className="bg-gray-800 w-full max-w-sm p-6 rounded-2xl border border-gray-600 flex flex-col items-center shadow-2xl relative">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Sneak Peek
                </h3>
                <div className="mb-6">
                  <CardDisplay type={gameState.turnState.activeCard} />
                </div>
                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => {
                      setShowPeekModal(false);
                      setForwardingPhase(true);
                    }}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold"
                  >
                    Ready to pass
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. Initiate Turn (Centered Modal, Click-Through enabled) */}
          {isMyTurn && selectedCard && !gameState.turnState && (
            <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none p-4">
              <div className="w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl p-6 animate-in zoom-in pointer-events-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <span className="text-xs uppercase text-gray-500 font-bold block mb-1">
                        Hidden
                      </span>
                      <CardDisplay type={selectedCard} small />
                    </div>
                    <ArrowRight className="text-gray-500" />
                    <div className="text-center w-32">
                      <span className="text-xs uppercase text-gray-500 font-bold block mb-1">
                        Target
                      </span>
                      {targetPlayerId ? (
                        <div className="bg-gray-700 p-2 rounded font-bold">
                          {
                            gameState.players.find(
                              (p) => p.id === targetPlayerId,
                            )?.name
                          }
                        </div>
                      ) : (
                        <div className="text-yellow-500 text-sm animate-pulse">
                          Tap an Opponent
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 w-full">
                    <span className="text-xs uppercase text-gray-500 font-bold block mb-1">
                      Declare (Lie or Truth)
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.keys(ANIMALS).map((k) => (
                        <button
                          key={k}
                          onClick={() => setDeclaredAnimal(k)}
                          className={`p-2 rounded text-[10px] md:text-xs font-bold flex flex-col items-center gap-1 border transition-all
                                                                ${
                                                                  declaredAnimal ===
                                                                  k
                                                                    ? "bg-purple-600 border-purple-400 text-white scale-105 shadow-lg"
                                                                    : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                                                                }
                                                               `}
                        >
                          {React.createElement(ANIMALS[k].icon, { size: 14 })}
                          {ANIMALS[k].name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full mt-4">
                  <button
                    onClick={initiatePass}
                    disabled={!targetPlayerId || !declaredAnimal}
                    className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg w-full"
                  >
                    Pass Card
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCard(null);
                      setTargetPlayerId(null);
                      setDeclaredAnimal(null);
                    }}
                    className="bg-red-900/50 hover:bg-red-900 text-red-300 py-2 rounded-lg w-full text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. Forwarding Phase (Centered Modal, Click-Through enabled) */}
          {forwardingPhase && (
            <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none p-4">
              <div className="w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl p-6 animate-in zoom-in pointer-events-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <span className="text-xs uppercase text-gray-500 font-bold block mb-1">
                        The Card
                      </span>
                      {/* Shows Active Card to User Only */}
                      <CardDisplay
                        type={gameState.turnState.activeCard}
                        small
                      />
                    </div>
                    <ArrowRight className="text-gray-500" />
                    <div className="text-center w-32">
                      <span className="text-xs uppercase text-gray-500 font-bold block mb-1">
                        Next Victim
                      </span>
                      {targetPlayerId ? (
                        <div className="bg-gray-700 p-2 rounded font-bold">
                          {
                            gameState.players.find(
                              (p) => p.id === targetPlayerId,
                            )?.name
                          }
                        </div>
                      ) : (
                        <div className="text-yellow-500 text-sm animate-pulse">
                          Tap an Opponent
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 w-full">
                    <span className="text-xs uppercase text-gray-500 font-bold block mb-1">
                      Declare (Lie or Truth)
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.keys(ANIMALS).map((k) => (
                        <button
                          key={k}
                          onClick={() => setDeclaredAnimal(k)}
                          className={`p-2 rounded text-[10px] md:text-xs font-bold flex flex-col items-center gap-1 border transition-all
                                                                ${
                                                                  declaredAnimal ===
                                                                  k
                                                                    ? "bg-purple-600 border-purple-400 text-white scale-105 shadow-lg"
                                                                    : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                                                                }
                                                               `}
                        >
                          {React.createElement(ANIMALS[k].icon, { size: 14 })}
                          {ANIMALS[k].name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full mt-4">
                  <button
                    onClick={handleForward}
                    disabled={!targetPlayerId || !declaredAnimal}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg w-full"
                  >
                    Pass It On
                  </button>
                  <button
                    onClick={() => setForwardingPhase(false)}
                    className="text-xs text-gray-500 hover:text-white mt-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Receive Card (Centered Modal, Click-Through enabled) */}
          {isReceiving && !showPeekModal && !forwardingPhase && (
            <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none p-4">
              <div className="w-full max-w-lg bg-gray-900 rounded-2xl border-2 border-yellow-500/50 shadow-2xl p-6 animate-in zoom-in pointer-events-auto">
                <h3 className="text-xl md:text-2xl font-black text-center text-white mb-2">
                  {gameState.players.find(
                    (p) => p.id === gameState.turnState.originId,
                  )?.name || "Opponent"}{" "}
                  offers a card...
                </h3>
                <p className="text-center text-gray-300 mb-6 text-lg">
                  "This is a{" "}
                  <strong className="text-purple-400 text-xl uppercase">
                    {ANIMALS[gameState.turnState.declaredType].name}
                  </strong>
                  ."
                </p>

                <div className="flex flex-col md:flex-row justify-center gap-4">
                  <button
                    onClick={() => handleGuess(true)}
                    className="flex-1 bg-green-700 hover:bg-green-600 p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle /> "True!"
                  </button>
                  <button
                    onClick={() => handleGuess(false)}
                    className="flex-1 bg-red-700 hover:bg-red-600 p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
                  >
                    <X /> "False!"
                  </button>

                  {getValidTargets(gameState.turnState.passedTrace).length >
                    0 && (
                    <div className="w-px bg-gray-600 mx-2 hidden md:block"></div>
                  )}

                  {getValidTargets(gameState.turnState.passedTrace).length >
                    0 && (
                    <button
                      onClick={() => setShowPeekModal(true)}
                      className="flex-1 bg-blue-700 hover:bg-blue-600 p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
                    >
                      <Eye /> Peek & Pass
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Area (Bottom Sheet) - Now just the Hand */}
          <div className="w-full max-w-4xl bg-gray-900/95 p-4 rounded-t-3xl border-t border-purple-900/50 backdrop-blur-md">
            {myPlayer && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-2">
                  <User className="text-purple-400" size={16} />
                  <span className="font-bold text-gray-300">My Hand</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {/* FIX: Improved Key for stability */}
                  {myPlayer.hand.map((card, i) => (
                    <div
                      key={`${card}-${i}`}
                      className="relative group shrink-0"
                    >
                      {selectedCard === card &&
                        isMyTurn &&
                        !gameState.turnState && (
                          <div className="absolute -top-8 left-0 right-0 text-center bg-yellow-500 text-black text-[10px] font-bold px-1 rounded animate-bounce z-20">
                            Selected
                          </div>
                        )}
                      <CardDisplay
                        type={card}
                        small
                        highlight={selectedCard === card}
                        disabled={!isMyTurn || gameState.turnState}
                        onClick={() =>
                          !gameState.turnState && isMyTurn
                            ? setSelectedCard(card)
                            : null
                        }
                      />
                    </div>
                  ))}
                </div>

                {/* My Face Up Cards */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-800 w-full overflow-hidden">
                  <span className="text-xs text-red-400 font-bold uppercase shrink-0">
                    My Failures ({myPlayer.faceUpCards.length})
                  </span>
                  <div className="flex gap-1 overflow-x-auto flex-1 pb-1 scrollbar-hide">
                    {myPlayer.faceUpCards.map((c, i) => (
                      <div key={i} className="shrink-0">
                        <CardDisplay type={c} tiny />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <Logo />
      </div>
    );
  }

  return null;
}
