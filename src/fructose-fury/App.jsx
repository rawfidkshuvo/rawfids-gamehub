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
  onSnapshot,
  arrayUnion,
  increment,
  deleteDoc,
} from "firebase/firestore";
import {
  Banana,
  StepBack,
  Grape,
  Citrus,
  Apple,
  Cherry,
  Trophy,
  Skull,
  Play,
  LogOut,
  RotateCcw,
  User,
  CheckCircle,
  X,
  History,
  Info,
  BookOpen,
  ArrowRight,
  Hand,
  AlertTriangle,
  Hammer,
  Sparkles,
  Home,
  Trash2,
  Nut,
  Leaf,
  Flower,
  Sun,
  Gem,
  Megaphone,
  ShieldCheck,
  Copy,
  Loader,
} from "lucide-react";
import CoverImage from "./assets/fructose_cover.png";

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
  typeof __app_id !== "undefined" ? __app_id : "fructose-fury-game";
const GAME_ID = "20"; // Assigned ID for Fructose Fury

// --- Game Constants ---
const FRUITS = {
  CHERRY: {
    name: "Strawberry",
    val: 1,
    count: 11,
    color: "text-red-400",
    bg: "bg-red-900/50",
    border: "border-red-500",
    icon: Cherry,
  },
  CITRUS: {
    name: "Tangerine",
    val: 2,
    count: 11,
    color: "text-orange-400",
    bg: "bg-orange-900/50",
    border: "border-orange-500",
    icon: Citrus,
  },
  APPLE: {
    name: "Peach",
    val: 3,
    count: 11,
    color: "text-pink-400",
    bg: "bg-pink-900/50",
    border: "border-pink-500",
    icon: Apple,
  },
  GRAPE: {
    name: "Grape",
    val: 4,
    count: 11,
    color: "text-purple-400",
    bg: "bg-purple-900/50",
    border: "border-purple-500",
    icon: Grape,
  },
  BANANA: {
    name: "Banana",
    val: 5,
    count: 11,
    color: "text-yellow-400",
    bg: "bg-yellow-900/50",
    border: "border-yellow-500",
    icon: Banana,
  },
  NUT: {
    name: "Coconut",
    val: 6,
    count: 7,
    color: "text-stone-400",
    bg: "bg-stone-800/80",
    border: "border-stone-500",
    icon: Nut,
  },
  LEAF: {
    name: "Pear",
    val: 7,
    count: 7,
    color: "text-lime-400",
    bg: "bg-lime-900/50",
    border: "border-lime-500",
    icon: Leaf,
  },
  FLOWER: {
    name: "Dragonfruit",
    val: 8,
    count: 7,
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-900/50",
    border: "border-fuchsia-500",
    icon: Flower,
  },
  SUN: {
    name: "Melon",
    val: 9,
    count: 7,
    color: "text-amber-300",
    bg: "bg-amber-900/50",
    border: "border-amber-500",
    icon: Sun,
  },
  GEM: {
    name: "Pineapple",
    val: 10,
    count: 7,
    color: "text-cyan-300",
    bg: "bg-cyan-900/50",
    border: "border-cyan-500",
    icon: Gem,
  },
};

// Generate Deck based on specific counts
const DECK_TEMPLATE = [];
Object.keys(FRUITS).forEach((type) => {
  const count = FRUITS[type].count;
  for (let i = 0; i < count; i++) {
    DECK_TEMPLATE.push(type);
  }
});

const Logo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Banana size={12} className="text-yellow-400" />
    <span className="text-[10px] font-black tracking-widest text-yellow-400 uppercase">
      FRUCTOSE FURY
    </span>
  </div>
);

const LogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Banana size={20} className="text-yellow-400" />
    <span className="text-[20px] font-black tracking-widest text-yellow-400 uppercase">
      FRUCTOSE FURY
    </span>
  </div>
);

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

const calculateScore = (cards) => {
  if (!cards || !Array.isArray(cards)) return 0;
  return cards.reduce((total, type) => total + (FRUITS[type]?.val || 0), 0);
};

// --- Visual Components ---

const FloatingBackground = React.memo(() => {
  // useMemo ensures these random positions are calculated ONLY ONCE
  // This keeps the performance high and stops icons from resetting.
  const backgroundIcons = React.useMemo(() => {
    return [...Array(20)].map((_, i) => {
      const iconKeys = Object.keys(FRUITS);
      const Icon = FRUITS[iconKeys[i % iconKeys.length]].icon;
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

const Card = ({ type, size = "md", animate = false }) => {
  const fruit = FRUITS[type];
  if (!fruit) return <div className="w-16 h-24 bg-gray-800 rounded-lg"></div>;

  const sizeClasses =
    size === "sm"
      ? "w-10 h-14 md:w-12 md:h-16 p-1"
      : size === "lg"
        ? "w-32 h-48 p-4"
        : "w-20 h-28 md:w-24 md:h-32 p-2";

  const Icon = fruit.icon;
  return (
    <div
      className={`
      ${sizeClasses} rounded-xl border-2 ${fruit.bg} ${fruit.border} 
      flex flex-col items-center justify-center shadow-lg relative overflow-hidden
      ${animate ? "animate-in zoom-in duration-300" : ""}
    `}
    >
      <div className="absolute -right-2 -top-2 opacity-20 rotate-12">
        <Icon size={size === "lg" ? 80 : 40} />
      </div>
      <Icon
        className={`${fruit.color} drop-shadow-md z-10`}
        size={size === "sm" ? 20 : size === "lg" ? 64 : 32}
      />
      {size !== "sm" && (
        <span
          className={`font-bold uppercase tracking-wider text-[10px] md:text-xs mt-2 text-white/90 z-10 text-center leading-none`}
        >
          {fruit.name}
        </span>
      )}
      <div className="absolute bottom-1 right-1 bg-black/50 px-1 rounded text-white/80 text-[10px] md:text-xs font-mono font-bold">
        {fruit.val}
      </div>
    </div>
  );
};

// --- Modal & Overlay Components ---

const EventOverlay = ({ event, currentUserId }) => {
  if (!event) return null;
  // If I am the victim of a steal, show a specific modal instead of this generic one (handled by VictimModal)
  if (
    event.type === "STEAL" &&
    event.targetIds &&
    event.targetIds.includes(currentUserId)
  ) {
    return null;
  }

  // If I am the thief, I don't need a popup (I know what I did)
  if (event.type === "STEAL" && event.thiefId === currentUserId) {
    return null;
  }

  // If I am the one banking, I see the BankSuccessModal instead (handled by bankSuccessData state)
  if (event.type === "BANK" && event.playerId === currentUserId) {
    return null;
  }

  let Icon = Info;
  let colorClass = "text-white";
  let bgClass = "bg-gray-800";
  if (event.type === "BUST") {
    Icon = Skull;
    colorClass = "text-red-500";
    bgClass = "bg-red-900/90";
  } else if (event.type === "STEAL") {
    Icon = Hand;
    colorClass = "text-orange-500";
    bgClass = "bg-orange-900/90";
  } else if (event.type === "BANK") {
    Icon = CheckCircle;
    colorClass = "text-green-500";
    bgClass = "bg-green-900/90";
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-200 flex items-center justify-center p-4">
      <div
        className={`p-6 md:p-8 rounded-3xl ${bgClass} border-4 border-white/20 shadow-2xl flex flex-col items-center animate-in zoom-in fade-in duration-300 transform scale-110 max-w-sm w-full text-center`}
      >
        <Icon size={48} className={`${colorClass} mb-4 animate-bounce`} />
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase drop-shadow-lg">
          {event.title}
        </h2>
        <p className="text-lg md:text-xl text-white/90 font-bold mt-2">
          {event.message}
        </p>
      </div>
    </div>
  );
};

const VictimModal = ({ event, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-210 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in slide-in-from-top-5">
      <div className="bg-red-950/90 border-2 border-red-500 p-4 rounded-2xl max-w-xs w-full text-center shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-center gap-2 mb-2">
          <AlertTriangle size={32} className="text-red-500 animate-pulse" />
          <h2 className="text-2xl font-black text-white uppercase">ROBBED!</h2>
        </div>
        <p className="text-red-200 text-sm mb-4 font-bold">
          {event.message || "Someone stole your fruits!"}
        </p>

        {event.cardType && (
          <div className="flex flex-col items-center gap-1 mb-2">
            <span className="text-[10px] uppercase font-bold text-red-300 tracking-widest">
              Stolen Fruit
            </span>
            <div className="transform scale-90">
              <Card type={event.cardType} size="md" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BankSuccessModal = ({ data, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-210 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in slide-in-from-top-5">
      <div className="bg-green-950/90 border-2 border-green-500 p-4 rounded-2xl max-w-xs w-full text-center shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck size={32} className="text-green-400 animate-bounce" />
          <h2 className="text-2xl font-black text-white uppercase">SECURED!</h2>
        </div>
        <p className="text-green-100 text-sm mb-3 font-bold">
          You secured{" "}
          <span className="text-yellow-300 text-xl font-black">
            {data.amount}
          </span>{" "}
          points!
        </p>

        {data.cards && data.cards.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 opacity-90 max-h-24 overflow-hidden">
            {data.cards.map((fruit, i) => (
              <div key={i} className="transform scale-75">
                <Card type={fruit} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StealModal = ({ targets, fruitType, onSteal, onPass }) => (
  <div className="fixed inset-0 bg-black/90 z-100 flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-gray-800 rounded-2xl border-4 border-yellow-500 p-4 md:p-6 max-w-md w-full text-center shadow-[0_0_50px_rgba(234,179,8,0.3)] relative overflow-hidden flex flex-col max-h-[90vh]">
      <div className="absolute inset-0 bg-yellow-500/10 animate-pulse pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">
        <h3 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase italic transform -rotate-2">
          Sweet Opportunity!
        </h3>
        <p className="text-gray-300 mb-4 text-sm md:text-base">
          You drew a{" "}
          <strong className="text-yellow-400">{FRUITS[fruitType].name}</strong>!
          The following players have them ripe for the taking:
        </p>

        <div className="flex justify-center mb-4 shrink-0">
          <Card type={fruitType} size="lg" animate />
        </div>

        <div className="bg-black/40 rounded-xl p-3 mb-4 overflow-y-auto border border-gray-700 flex-1 min-h-0">
          {targets.map((t, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0"
            >
              <span className="font-bold text-white flex items-center gap-2">
                <User size={16} className="text-gray-400" /> {t.name}
              </span>
              <span className="bg-yellow-900/50 text-yellow-200 px-2 py-1 rounded text-xs font-mono border border-yellow-500/30">
                Has {t.count}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-auto">
          <button
            onClick={onPass}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 py-3 rounded-xl font-bold transition-all text-sm md:text-base"
          >
            Pass
          </button>
          <button
            onClick={onSteal}
            className="bg-linear-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-3 rounded-xl font-black text-sm md:text-xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <Hand size={18} /> STEAL ALL!
          </button>
        </div>
      </div>
    </div>
  </div>
);

const LeaveConfirmModal = ({
  onConfirm,
  onCancel,
  isHost,
  onReturnToLobby,
}) => (
  <div className="fixed inset-0 bg-black/90 z-200 flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2">
        Abandon the Harvest?
      </h3>
      <p className="text-gray-400 mb-6 text-sm">
        Leaving now will forfeit your gathered fruits.
      </p>
      <div className="flex flex-col gap-3">
        {isHost && onReturnToLobby && (
          <button
            onClick={onReturnToLobby}
            className="w-full bg-orange-700 hover:bg-orange-600 text-white py-3 rounded font-bold transition-colors border border-orange-500 shadow-lg mb-2"
          >
            Return Group to Lobby
          </button>
        )}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-bold transition-colors"
          >
            Stay
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold transition-colors"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  </div>
);

const GameSummaryModal = ({ players, destroyedCards, onClose }) => {
  return (
    <div className="fixed inset-0 z-250 bg-black/95 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-gray-900 border-2 border-yellow-600 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-6 bg-gray-950 border-b border-gray-800 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-orange-500 uppercase italic">
              Harvest Report
            </h2>
            <p className="text-gray-400 text-sm font-bold">
              All cards collected and destroyed
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* 1. Destroyed Cards Section */}
          <div className="bg-red-950/30 rounded-2xl p-4 border border-red-900/50">
            <div className="flex items-center gap-2 mb-4 text-red-400">
              <Trash2 size={24} />
              <h3 className="text-xl font-bold uppercase">
                Rotten Fruit (Destroyed)
              </h3>
              <span className="bg-red-900/50 px-2 py-0.5 rounded text-xs text-red-200">
                {destroyedCards?.length || 0} Cards
              </span>
            </div>

            {!destroyedCards || destroyedCards.length === 0 ? (
              <p className="text-gray-500 italic text-sm">
                No fruits were harmed in this game.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {destroyedCards.sort().map((type, i) => (
                  <div
                    key={i}
                    className="transform scale-75 origin-top-left -mr-4 -mb-4"
                  >
                    <Card type={type} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Player Collections Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {players.map((p) => (
              <div
                key={p.id}
                className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-yellow-500 text-lg flex items-center gap-2">
                    <User size={18} /> {p.name}
                  </span>
                  <span className="text-white font-mono font-bold bg-gray-900 px-2 py-1 rounded">
                    Score: {calculateScore(p.bank)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 min-h-[60px] content-start bg-black/20 p-2 rounded-xl">
                  {p.bank && p.bank.length > 0 ? (
                    p.bank.sort().map((type, i) => (
                      <div
                        key={i}
                        className="transform scale-75 origin-top-left -mr-3 -mb-3"
                      >
                        <Card type={type} size="sm" />
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-600 text-xs italic w-full text-center py-2">
                      Empty Basket
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-950 border-t border-gray-800 shrink-0 flex justify-center">
          <button
            onClick={onClose}
            className="bg-yellow-600 hover:bg-yellow-500 text-black font-black text-xl py-3 px-12 rounded-xl shadow-lg hover:scale-105 transition-transform"
          >
            SEE WINNER
          </button>
        </div>
      </div>
    </div>
  );
};

const GameGuideModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-150 flex items-center justify-center p-0 md:p-4">
    <div className="bg-gray-900 md:rounded-2xl w-full max-w-3xl h-full md:h-auto md:max-h-[90vh] overflow-hidden border border-yellow-500/30 flex flex-col">
      <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-orange-500 uppercase italic">
          Farming Guide
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full text-gray-400"
        >
          <X />
        </button>
      </div>
      <div className="p-6 overflow-y-auto space-y-6 text-gray-300">
        <div className="flex gap-4 items-start">
          <div className="bg-yellow-500/20 p-3 rounded-lg text-yellow-500">
            <Play size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">1. Push Your Luck</h3>
            <p className="text-sm">
              Draw fruits from the deck. They enter your{" "}
              <strong className="text-red-400">Risk Zone</strong>.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="bg-red-500/20 p-3 rounded-lg text-red-500">
            <Skull size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">2. The Bust Rule</h3>
            <p className="text-sm">
              You are safe if you have <strong>3 or fewer cards</strong> in your
              Risk Zone.
              <br />
              <strong>Only if you have 3+ cards:</strong> Drawing a fruit that
              matches one <em>already</em> in your Risk Zone causes a{" "}
              <strong>BUST</strong>! All fruits from this turn are lost.
              <br />
              <em>
                Note: Stealing does NOT cause a Bust, but having 3+ cards after
                stealing puts you in danger for your NEXT draw!
              </em>
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="bg-orange-500/20 p-3 rounded-lg text-orange-500">
            <Hand size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">3. Steal!</h3>
            <p className="text-sm">
              If you draw a fruit that an opponent has in their{" "}
              <strong className="text-orange-400">Danger Zone</strong> (Table),
              you can <strong>STEAL</strong> them! They are added to your Risk
              Zone. Watch out: this increases your card count, making a Bust
              more likely on your next draw!
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="bg-green-500/20 p-3 rounded-lg text-green-500">
            <CheckCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">4. Bank & Win</h3>
            <p className="text-sm">
              Stop before busting to move fruits to your{" "}
              <strong>Danger Zone</strong>. At the start of your <em>next</em>{" "}
              turn, they move to your <strong>Safe Zone</strong>.
              <br />
              <br />
              <strong>Winning:</strong> The player with the highest total{" "}
              <strong>VALUE</strong> (not count) of banked fruits wins!
            </p>
          </div>
        </div>
      </div>
      <div className="p-4 bg-gray-900 border-t border-gray-800 text-center">
        <button
          onClick={onClose}
          className="bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-3 rounded-lg font-bold"
        >
          Got it!
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
    const saved = localStorage.getItem("fructose_room_id");
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
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-yellow-500/50">
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
            className="group relative px-12 py-5 bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500/50 hover:border-yellow-400 text-yellow-300 font-black text-2xl tracking-widest rounded-none transform transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] backdrop-blur-md overflow-hidden"
          >
            {/* Animated Scanline overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-400/10 to-transparent translate-y-[-100%] animate-[scan_2s_infinite_linear]" />

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
        Inspired by Fruit Fight. A tribute game.
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

// --- Main Game Component ---

export default function FructoseFury() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("splash");

  const [roomId, setRoomId] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Local UI States
  const [showGuide, setShowGuide] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showLogHistory, setShowLogHistory] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null); // For popup
  const [showSummary, setShowSummary] = useState(false);

  // New Local States for Features
  const [bankSuccessData, setBankSuccessData] = useState(null); // Shows modal if not null
  const [victimEvent, setVictimEvent] = useState(null); // Shows modal if user was robbed

  //read and fill global name
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem("gameHub_playerName") || "",
  );
  //set global name for all game
  useEffect(() => {
    if (playerName) localStorage.setItem("gameHub_playerName", playerName);
  }, [playerName]);

  // Ref to track last processed event to avoid useEffect loop
  const lastProcessedEventId = useRef(null);

  // 3. NEW FUNCTION: Handle Splash Button Click
  const handleSplashStart = () => {
    const savedRoomId = localStorage.getItem("fructose_room_id");

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

  // --- Session Persistence Logic ---
  // 1. Restore Room ID on mount
  // useEffect(() => {
  //   const savedRoomId = localStorage.getItem("fructose_room_id");
  //   if (savedRoomId) {
  //     setRoomId(savedRoomId);
  //   }
  // }, []);

  //game summary modal trigger
  useEffect(() => {
    if (gameState?.status === "finished") {
      setShowSummary(true);
    }
  }, [gameState?.status]);

  // 2. Save Room ID when it changes
  // useEffect(() => {
  //   if (roomId) {
  //     localStorage.setItem("fructose_room_id", roomId);
  //   } else {
  //     localStorage.removeItem("fructose_room_id");
  //   }
  // }, [roomId]);

  // --- Auth & Maintenance ---
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

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data[GAME_ID]?.maintenance) {
          setIsMaintenance(true);
        } else {
          setIsMaintenance(false);
        }
      }
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

          // --- KICKED CHECK ---
          // If I am not in the player list, I was kicked.
          const amIInRoom = data.players.find((p) => p.id === user.uid);
          if (!amIInRoom) {
            setRoomId("");
            setView("menu");
            setError("You were kicked by the host.");
            localStorage.removeItem("fructose_room_id");
            return;
          }

          setGameState(data);

          if (data.status === "playing" || data.status === "finished") {
            setView("game");
          } else if (data.status === "lobby") {
            setView("lobby");
          }

          // Handle Events Popup
          if (data.lastEvent) {
            if (data.lastEvent.id !== lastProcessedEventId.current) {
              const evtTime = data.lastEvent.timestamp || Date.now();
              const isRecent = evtTime > Date.now() - 10000; // 10s window

              if (isRecent) {
                lastProcessedEventId.current = data.lastEvent.id;
                setCurrentEvent(data.lastEvent);

                // Check if I am a victim
                if (
                  data.lastEvent.type === "STEAL" &&
                  data.lastEvent.targetIds &&
                  data.lastEvent.targetIds.includes(user.uid)
                ) {
                  setVictimEvent(data.lastEvent);
                }

                // Check if I am the one who banked (Finally secured points)
                if (
                  data.lastEvent.type === "BANK" &&
                  data.lastEvent.playerId === user.uid
                ) {
                  setBankSuccessData({
                    amount: data.lastEvent.amount,
                    cards: data.lastEvent.cards,
                  });
                }

                setTimeout(() => setCurrentEvent(null), 3000);
              }
            }
          }
        } else {
          // Room Deleted (Host Left)
          setRoomId("");
          setView("menu");
          setError("The Fruit Stand has closed (Host left).");
          localStorage.removeItem("fructose_room_id");
        }
      },
    );
    return () => unsub();
  }, [roomId, user]);

  // --- Logic Functions ---

  const createRoom = async () => {
    if (!playerName) return setError("Name required");
    setLoading(true);
    const chars = "123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";
    let newId = "";
    for (let i = 0; i < 6; i++) {
      newId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Initial Deck
    const deck = shuffle([...DECK_TEMPLATE]);
    const initialData = {
      roomId: newId,
      hostId: user.uid,
      status: "lobby",
      players: [
        {
          id: user.uid,
          name: playerName,
          hand: [], // Risk Zone (Active Turn)
          table: [], // Danger Zone (Waiting to Bank)
          bank: [], // Safe Zone (Score)
          ready: false,
        },
      ],
      deck: deck,
      turnIndex: 0,
      turnPhase: "IDLE", // IDLE, DRAWING, STEALING
      stealTargetIds: [], // Now array for multiple targets
      destroyedCards: [],
      drawnCard: null, // The card just drawn
      lastEvent: null, // For popups
      logs: [],
    };

    await setDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
      initialData,
    );
    localStorage.setItem("fructose_room_id", newId);
    setRoomId(newId);
    setRoomCodeInput(newId);
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
      setError("Game already started");
      setLoading(false);
      return;
    }

    if (data.players.length >= 6) {
      setError("Room full");
      setLoading(false);
      return;
    }

    if (!data.players.find((p) => p.id === user.uid)) {
      await updateDoc(ref, {
        players: arrayUnion({
          id: user.uid,
          name: playerName,
          hand: [],
          table: [],
          bank: [],
          ready: false,
        }),
      });
    }
    // ADD THIS LINE:
    localStorage.setItem("fructose_room_id", roomCodeInput);
    setRoomId(roomCodeInput);
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
    if (gameState.hostId !== user.uid) return;
    const deck = shuffle([...DECK_TEMPLATE]);
    // Reset readiness for next game inside game loop, or just clear it here
    const players = gameState.players.map((p) => ({
      ...p,
      ready: false,
      hand: [],
      table: [],
      bank: [],
    }));
    // 2. Calculate Random Start Index
    const randomStartIndex = Math.floor(Math.random() * players.length);
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        players,
        deck,
        turnIndex: randomStartIndex,
        turnPhase: "DRAWING",
        logs: [
          {
            text: "The Harvest Begins! Draw fruits without busting.",
            type: "neutral",
          },
        ],
        stealTargetIds: [],
        destroyedCards: [], // <--- RESET THIS
        drawnCard: null,
        lastEvent: null,
      },
    );
  };

  const resetToLobby = async () => {
    if (gameState.hostId !== user.uid) return;
    const players = gameState.players.map((p) => ({
      ...p,
      hand: [],
      table: [],
      bank: [],
      ready: false,
    }));
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        players,
        deck: shuffle([...DECK_TEMPLATE]),
        logs: [],
        turnIndex: 0,
        destroyedCards: [], // <--- RESET THIS
      },
    );
    setShowLeaveConfirm(false);
  };

  const leaveRoom = async () => {
    if (!roomId) return;

    // Clear session immediately
    localStorage.removeItem("fructose_room_id");

    const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);

    if (gameState.hostId === user.uid) {
      // Host Exit: Delete the room.
      await deleteDoc(ref);
    } else {
      // Guest Exit
      if (gameState.players.length <= 1) {
        await deleteDoc(ref);
      } else {
        // 1. Calculate the new player list
        const leavingPlayerIndex = gameState.players.findIndex(
          (p) => p.id === user.uid,
        );
        const newPlayers = gameState.players.filter((p) => p.id !== user.uid);

        // 2. Calculate new Turn Index
        let newTurnIndex = gameState.turnIndex;
        let shouldResetPhase = false;

        if (leavingPlayerIndex < gameState.turnIndex) {
          // If the person who left was BEFORE the current turn, shift index down
          newTurnIndex = Math.max(0, gameState.turnIndex - 1);
        } else if (leavingPlayerIndex === gameState.turnIndex) {
          // If the ACTIVE player left, the turn passes to the person who slid into this slot
          // We must reset the phase so the new player doesn't inherit "STEALING" or "BUSTED" state
          shouldResetPhase = true;
        }

        // Ensure index wraps correctly if we were at the end of the list
        if (newPlayers.length > 0) {
          if (newTurnIndex >= newPlayers.length) {
            newTurnIndex = 0;
          }
        } else {
          newTurnIndex = 0;
        }

        // 3. Determine Game Status
        let newStatus = gameState.status;
        if (gameState.status === "playing" && newPlayers.length < 2) {
          newStatus = "finished";
        }

        // 4. Construct Update Data
        const updateData = {
          players: newPlayers,
          status: newStatus,
          turnIndex: newTurnIndex, // UPDATE TURN INDEX
          logs: arrayUnion({
            text: `${playerName} left the game.`,
            type: "danger",
          }),
        };

        // If the active player left, clean up the turn state for the next person
        if (shouldResetPhase) {
          updateData.turnPhase = "DRAWING";
          updateData.drawnCard = null;
          updateData.stealTargetIds = [];
        }

        await updateDoc(ref, updateData);
      }
    }
    setRoomId("");
    setView("menu");
    setShowLeaveConfirm(false);
  };

  // Move to next player
  // Also processes Auto-Banking for the UPCOMING player
  const nextTurn = async (
    currentPlayers,
    currentDeck,
    logs = [],
    event = null,
  ) => {
    let nextIdx = (gameState.turnIndex + 1) % currentPlayers.length;
    // Auto-Bank for the NEXT player (Move Table -> Bank)
    const nextPlayer = currentPlayers[nextIdx];
    let bankEvent = null;

    if (nextPlayer.table.length > 0) {
      const bankedValue = calculateScore(nextPlayer.table);
      const bankedCards = [...nextPlayer.table]; // Copy cards for event
      // Safe access to bank, fallback to empty array if undefined
      nextPlayer.bank = [...(nextPlayer.bank || []), ...nextPlayer.table];
      nextPlayer.table = [];
      logs.push({
        text: `${nextPlayer.name} banked ${bankedValue} points!`,
        type: "success",
      });
      // Create Event to notify everyone (especially the player who banked)
      bankEvent = {
        id: Date.now(),
        timestamp: Date.now(), // Added explicit timestamp
        type: "BANK",
        playerId: nextPlayer.id,
        amount: bankedValue,
        cards: bankedCards, // Added cards list
        title: "SECURED!",
        message: `${nextPlayer.name} banked ${bankedValue} points!`,
      };
    }

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players: currentPlayers,
        deck: currentDeck,
        turnIndex: nextIdx,
        turnPhase: "DRAWING",
        drawnCard: null,
        stealTargetIds: [],
        lastEvent: event || bankEvent || null,
        logs: arrayUnion(...logs),
      },
    );
  };

  const checkBust = (hand, newCard) => {
    // Bust happens ONLY if:
    // 1. You ALREADY have >= 3 cards in the risk zone.
    // 2. The NEW drawn card matches something in your existing hand.

    if (hand.length < 3) return false;

    return hand.includes(newCard);
  };

  // --- New Helper: Finalize Game State ---
  // Moves everyone's Hands and Tables to their Bank for final scoring
  const finalizePlayers = (currentPlayers) => {
    return currentPlayers.map((p) => ({
      ...p,
      bank: [...p.bank, ...p.table, ...p.hand], // Secure everything
      table: [],
      hand: [],
    }));
  };

  const handleDraw = async () => {
    if (gameState.deck.length === 0) return;

    const players = [...gameState.players];
    const deck = [...gameState.deck];
    const me = players[gameState.turnIndex];
    const cardType = deck.pop();

    // Priority 1: Check Bust FIRST
    if (checkBust(me.hand, cardType)) {
      // 1. Identify what is being destroyed
      const bustedCards = [...me.hand, cardType];

      // 2. FIX: Calculate the new total list locally to PRESERVE DUPLICATES
      // (arrayUnion would remove duplicates, which we don't want here)
      const currentDestroyed = gameState.destroyedCards || [];
      const updatedDestroyedCards = [...currentDestroyed, ...bustedCards];

      const event = {
        id: Date.now(),
        timestamp: Date.now(),
        type: "BUST",
        title: "BUSTED!",
        message: `${me.name} got greedy!`,
      };

      const logs = [
        {
          text: `${me.name} drew ${FRUITS[cardType].name} and BUSTED!`,
          type: "danger",
        },
      ];

      // CASE A: Deck is empty AND player busted (Game Over)
      if (deck.length === 0) {
        me.hand = [];
        const finalPlayers = finalizePlayers(players);

        await updateDoc(
          doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
          {
            players: finalPlayers,
            deck,
            status: "finished",
            lastEvent: event,
            destroyedCards: updatedDestroyedCards, // Save the full list
            logs: arrayUnion(...logs, {
              text: "Deck Empty on a Bust! Game Over!",
              type: "neutral",
            }),
            drawnCard: cardType,
            turnPhase: "BUSTED",
          },
        );
        return;
      }

      // CASE B: Standard Bust (Game Continues)
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          deck,
          lastEvent: event,
          destroyedCards: updatedDestroyedCards, // Save the full list
          logs: arrayUnion(...logs),
          drawnCard: cardType,
          turnPhase: "BUSTED",
        },
      );

      // Prepare wiped hand for the actual next turn state
      const nextPlayers = JSON.parse(JSON.stringify(players));
      nextPlayers[gameState.turnIndex].hand = [];

      setTimeout(() => nextTurn(nextPlayers, deck, [], null), 2500);
      return;
    }

    // Priority 2: Check Steal Opportunity
    const stealTargetIds = [];
    for (let p of players) {
      if (p.id !== me.id && p.table.includes(cardType)) {
        stealTargetIds.push(p.id);
      }
    }

    if (stealTargetIds.length > 0) {
      // Trigger Steal Phase
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          deck,
          drawnCard: cardType,
          turnPhase: "STEALING",
          stealTargetIds: stealTargetIds,
        },
      );
    } else {
      // Priority 3: Safe Draw (No Steal, No Bust)
      me.hand.push(cardType);

      if (deck.length === 0) {
        // Secure all points for everyone
        const finalPlayers = finalizePlayers(players);

        await updateDoc(
          doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
          {
            players: finalPlayers,
            deck,
            status: "finished",
            logs: arrayUnion({
              text: "Deck Empty! Game Over!",
              type: "neutral",
            }),
          },
        );
      } else {
        // Game Continues
        await updateDoc(
          doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
          {
            players,
            deck,
          },
        );
      }
    }
  };

  const handleSteal = async (doSteal) => {
    const players = [...gameState.players];
    const meIdx = gameState.turnIndex;
    const me = players[meIdx];
    const cardType = gameState.drawnCard;

    const logs = [];
    let event = null;

    // Start with adding the drawn card
    me.hand.push(cardType);

    if (doSteal) {
      let totalStolen = 0;
      const targetNames = [];
      const victimIds = [];

      gameState.stealTargetIds.forEach((targetId) => {
        const targetIdx = players.findIndex((p) => p.id === targetId);
        if (targetIdx === -1) return;

        const target = players[targetIdx];
        const stolenCards = target.table.filter((c) => c === cardType);
        const remainingTable = target.table.filter((c) => c !== cardType);

        if (stolenCards.length > 0) {
          target.table = remainingTable;
          me.hand = [...me.hand, ...stolenCards];
          totalStolen += stolenCards.length;
          targetNames.push(target.name);
          victimIds.push(targetId);
        }
      });
      logs.push({
        text: `${me.name} stole ${totalStolen} ${FRUITS[cardType].name}(s) from ${targetNames.join(", ")}!`,
        type: "warning",
      });
      event = {
        id: Date.now(),
        timestamp: Date.now(),
        type: "STEAL",
        title: "THIEF!",
        message: `${me.name} stole ${totalStolen} fruits from ${targetNames.join(", ")}!`,
        targetIds: victimIds,
        thiefId: me.id,
        cardType: cardType,
      };
    } else {
      logs.push({ text: `${me.name} passed on stealing.`, type: "neutral" });
    }

    // --- NEW: Check if deck is empty after the action ---
    if (gameState.deck.length === 0) {
      // Secure all points (Hand + Table -> Bank)
      const finalPlayers = finalizePlayers(players);

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: finalPlayers,
          status: "finished",
          logs: arrayUnion(...logs, {
            text: "Deck Empty! Game Over!",
            type: "neutral",
          }),
        },
      );
    } else {
      // Continue Game
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          turnPhase: "DRAWING",
          stealTargetIds: [],
          drawnCard: null,
          lastEvent: event,
          logs: arrayUnion(...logs),
        },
      );
    }
  };

  const handleStop = async () => {
    const players = [...gameState.players];
    const me = players[gameState.turnIndex];
    const cardsCount = me.hand.length;

    // Move Hand -> Table (Danger Zone)
    me.table = [...me.table, ...me.hand];
    me.hand = [];

    // Removed immediate local modal as per user request
    // setBankSuccessCount(cardsCount);
    const logs = [{ text: `${me.name} stopped safely.`, type: "neutral" }];
    await nextTurn(players, gameState.deck, logs);
  };

  const toggleReady = async () => {
    if (!roomId) return;
    const players = [...gameState.players];
    const myIdx = players.findIndex((p) => p.id === user.uid);
    players[myIdx].ready = !players[myIdx].ready;
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players,
      },
    );
  };

  const kickPlayer = async (pid) => {
    const players = gameState.players.filter((p) => p.id !== pid);
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players,
      },
    );
  };

  // --- Render Helpers ---

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
            The farmers are tending to the trees. Come back later for fresh
            fruit.
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-yellow-500 animate-pulse">
        Harvest approaching...
      </div>
    );

  // RECONNECTING STATE
  if (roomId && !gameState && !error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4">
        <FloatingBackground />
        <div className="bg-zinc-900/80 backdrop-blur p-8 rounded-2xl border border-zinc-700 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <Loader size={48} className="text-yellow-500 animate-spin" />
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
            className="flex items-center gap-2 text-yellow-800 rounded-lg 
			font-bold shadow-md hover:text-yellow-400 transition-colors w-fit animate-pulse"
          >
            {/* Arrow Icon */}
            <StepBack />
            <span>Back to Gamehub</span>
          </a>
        </nav>
        {/* --- END OF BACK BUTTON --- */}

        <div className="z-10 text-center mb-10">
          <div className="flex justify-center gap-2 mb-4 animate-bounce">
            <Banana size={48} className="text-yellow-400" />
            <Cherry size={48} className="text-red-500" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-400 via-orange-500 to-red-500 font-serif tracking-tight drop-shadow-xl italic transform -rotate-2">
            FRUCTOSE FURY
          </h1>
          <p className="text-white/60 tracking-[0.5em] uppercase mt-4 text-sm font-bold">
            Juicy Risks & Sweet Rewards
          </p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur border border-yellow-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 animate-in slide-in-from-bottom-10 duration-700 delay-100">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm border border-red-800">
              {error}
            </div>
          )}
          <input
            className="w-full bg-black/50 border border-gray-600 p-3 rounded-xl mb-4 text-white placeholder-gray-500 focus:border-yellow-500 outline-none transition-colors"
            placeholder="Farmer Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-linear-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 p-4 rounded-xl font-bold mb-4 flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all text-white"
          >
            <Play size={20} fill="currentColor" /> Open New Stand
          </button>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              className="w-full sm:flex-1 bg-black/50 border border-gray-600 p-3 rounded-xl text-white placeholder-gray-500 uppercase font-mono tracking-wider focus:border-yellow-500 outline-none"
              placeholder="ROOM CODE"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 border border-gray-600 px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Join
            </button>
          </div>

          <button
            onClick={() => setShowGuide(true)}
            className="w-full text-center text-gray-400 hover:text-white text-sm flex items-center justify-center gap-2"
          >
            <BookOpen size={14} /> Farming Guide
          </button>
        </div>

        {showGuide && <GameGuideModal onClose={() => setShowGuide(false)} />}
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 relative">
        <FloatingBackground />
        <LogoBig />

        <div className="z-10 w-full max-w-lg bg-gray-900/90 backdrop-blur p-8 rounded-2xl border border-orange-500/30 shadow-2xl">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
            <div>
              <h2 className="text-xl text-yellow-500 font-bold uppercase tracking-wider">
                Fruit Stand
              </h2>
              {/* Grouping Title and Copy Button together on the left */}
              <div className="flex items-center gap-2">
                <div className="text-3xl font-mono text-white font-black tracking-widest">
                  {gameState.roomId}
                </div>
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
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg animate-fade-in-up whitespace-nowrap">
                      Copied!
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 bg-red-900/30 hover:bg-red-900/50 rounded-full text-red-400 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>

          <div className="space-y-3 mb-8">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      p.ready
                        ? "bg-green-500 text-black"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    <User size={18} />
                  </div>
                  <span
                    className={`font-bold ${
                      p.id === user.uid ? "text-yellow-400" : "text-gray-300"
                    }`}
                  >
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {p.ready && (
                    <span className="text-green-500 text-xs font-bold uppercase tracking-wider">
                      Ready
                    </span>
                  )}
                  {isHost && p.id !== user.uid && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      className="text-gray-600 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {gameState.players.length < 2 && (
              <div className="text-center text-gray-500 py-4 italic">
                Waiting for more farmers...
              </div>
            )}
          </div>

          {isHost ? (
            <button
              onClick={startGame}
              disabled={gameState.players.length < 2}
              className={`w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest shadow-lg transition-all ${
                gameState.players.length >= 2
                  ? "bg-green-600 hover:bg-green-500 text-white hover:scale-105"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }`}
            >
              Start Harvest
            </button>
          ) : (
            <div className="w-full py-4 rounded-xl font-bold text-xl text-center text-gray-500 bg-gray-800/50 border border-gray-700 animate-pulse">
              Waiting for Host to Start...
            </div>
          )}
        </div>

        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirm={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={isHost}
          />
        )}
        <Logo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const me = gameState.players.find((p) => p.id === user.uid);
    if (!me)
      return (
        <div className="text-white text-center mt-20">Syncing game data...</div>
      );
    const activePlayer = gameState.players[gameState.turnIndex];
    if (!activePlayer) {
      return (
        <div className="text-white text-center mt-20">Syncing turn data...</div>
      );
    }

    const isMyTurn = activePlayer.id === user.uid;
    const opponent = gameState.players.filter((p) => p.id !== user.uid);
    const isStealing = gameState.turnPhase === "STEALING";
    const isBusted = currentEvent && currentEvent.type === "BUST";

    // Prepare Steal Targets info
    let potentialTargets = [];
    if (isStealing && gameState.stealTargetIds) {
      potentialTargets = gameState.stealTargetIds
        .map((tid) => {
          const p = gameState.players.find((pl) => pl.id === tid);
          if (!p) return null;
          const count = p.table.filter((c) => c === gameState.drawnCard).length;
          return { name: p.name, count };
        })
        .filter((t) => t !== null);
    }

    let winner = null;
    if (gameState.status === "finished") {
      winner = [...gameState.players].sort(
        (a, b) => calculateScore(b.bank) - calculateScore(a.bank),
      )[0];
    }

    const allPlayersReady = gameState.players.every(
      (p) => p.id === gameState.hostId || p.ready,
    );

    return (
      <div
        className={`h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden transition-colors duration-100 ${
          isBusted ? "animate-shake bg-red-900!" : ""
        }`}
      >
        <FloatingBackground />
        <EventOverlay event={currentEvent} currentUserId={user.uid} />

        {/* Feature: Victim Modal */}
        {victimEvent && (
          <VictimModal
            event={victimEvent}
            onClose={() => setVictimEvent(null)}
          />
        )}

        {/* Feature: Bank Success Modal */}
        {bankSuccessData !== null && (
          <BankSuccessModal
            data={bankSuccessData}
            onClose={() => setBankSuccessData(null)}
          />
        )}

        {/* Header */}
        <div className="h-14 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between px-4 z-160 sticky top-0 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <Banana className="text-yellow-500" size={20} />
            <span className="font-black uppercase tracking-tight text-lg hidden md:block">
              Fructose Fury
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGuide(true)}
              className="p-2 text-gray-400 hover:bg-gray-800 rounded-full"
            >
              <BookOpen size={20} />
            </button>
            <button
              onClick={() => setShowLogHistory(!showLogHistory)}
              className={`p-2 rounded-full ${
                showLogHistory
                  ? "bg-yellow-900 text-yellow-400"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              <History size={20} />
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 text-red-400 hover:bg-red-900/20 rounded-full"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Modals */}
        {isStealing && isMyTurn && (
          <StealModal
            targets={potentialTargets}
            fruitType={gameState.drawnCard}
            onSteal={() => handleSteal(true)}
            onPass={() => handleSteal(false)}
          />
        )}

        {showGuide && <GameGuideModal onClose={() => setShowGuide(false)} />}

        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirm={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={gameState.hostId === user.uid}
            onReturnToLobby={resetToLobby}
          />
        )}

        {showLogHistory && (
          <div className="fixed top-16 right-4 w-64 max-h-60 bg-gray-900/95 border border-gray-700 rounded-xl z-155 overflow-y-auto p-2 shadow-2xl">
            <div className="bg-gray-900 w-full max-w-md h-[70vh] rounded-2xl flex flex-col border border-gray-700">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h3 className="font-bold">Log</h3>
                <button onClick={() => setShowLogHistory(false)}>
                  <X />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {[...gameState.logs].reverse().map((l, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded text-sm border-l-2 ${
                      l.type === "danger"
                        ? "border-red-500 bg-red-900/20"
                        : l.type === "warning"
                          ? "border-orange-500 bg-orange-900/20"
                          : "border-gray-500 bg-gray-800"
                    }`}
                  >
                    {l.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NEW: Game Summary Modal */}
        {showSummary && (
          <GameSummaryModal
            players={gameState.players}
            destroyedCards={gameState.destroyedCards || []}
            onClose={() => setShowSummary(false)}
          />
        )}

        {/* Game Over Screen */}
        {gameState.status === "finished" && (
          <div className="fixed inset-0 top-14 z-150 bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in overflow-y-auto">
            {/* Content same as original, just added overflow-y-auto to container */}
            <Trophy size={80} className="text-yellow-400 mb-6 animate-bounce" />
            <h1 className="text-5xl font-black text-white mb-2 uppercase">
              Harvest Complete!
            </h1>
            <p className="text-2xl text-gray-300 mb-8">
              The Master Farmer is{" "}
              <span className="text-yellow-400 font-bold">{winner?.name}</span>{" "}
              with {calculateScore(winner?.bank || [])} points!
            </p>
            {/* Player list and buttons... (kept same logic as your original) */}
            <div className="grid grid-cols-2 gap-4 max-w-md w-full mb-8">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className="bg-gray-800 p-4 rounded-xl flex justify-between items-center border border-gray-700"
                >
                  <div className="flex items-center gap-2">
                    {p.ready && (
                      <CheckCircle size={16} className="text-green-500" />
                    )}
                    <span
                      className={
                        p.id === winner.id
                          ? "text-yellow-400 font-bold"
                          : "text-gray-400"
                      }
                    >
                      {p.name}
                    </span>
                  </div>
                  <span className="font-mono text-xl">
                    {calculateScore(p.bank || [])}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 items-center w-full max-w-md pb-10">
              {gameState.hostId !== user.uid &&
                (!me.ready ? (
                  <button
                    onClick={toggleReady}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white shadow-lg animate-pulse"
                  >
                    Ready for Next Game
                  </button>
                ) : (
                  <button
                    onClick={toggleReady}
                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-green-400 border border-green-500/50"
                  >
                    Waiting for others...
                  </button>
                ))}

              {gameState.hostId === user.uid && (
                <div className="flex gap-4 w-full">
                  <button
                    onClick={resetToLobby}
                    disabled={!allPlayersReady}
                    className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                      allPlayersReady
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                    }`}
                  >
                    Lobby
                  </button>
                  <button
                    onClick={startGame}
                    disabled={!allPlayersReady}
                    className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                      allPlayersReady
                        ? "bg-green-600 hover:bg-green-500 hover:scale-105"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    New Harvest
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MAIN GAME AREA 
            UPDATED: Removed overflow-hidden from here to allow inner elements to render pop-ups properly,
            but kept structure tight.
        */}
        <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto p-2 md:p-4 gap-2 md:gap-4 overflow-hidden">
          {/* TOP: OPPONENTS 
              UPDATED: Removed fixed height (h-32). Added padding (py-4) and min-height logic.
          */}
          <div className="flex-none flex items-stretch gap-3 overflow-x-auto py-4 px-2 no-scrollbar md:flex-wrap md:justify-center min-h-[25vh] md:min-h-0">
            {opponent.map((p) => (
              <div
                key={p.id}
                className={`bg-gray-900/80 p-3 rounded-xl border-2 flex flex-col gap-2 
                  min-w-[150px] md:min-w-[160px] 
                  transition-all relative group
                  ${
                    gameState.players[gameState.turnIndex].id === p.id
                      ? "border-yellow-500 shadow-yellow-900/20 shadow-lg scale-[1.02] animate-pulse"
                      : "border-gray-800 opacity-90"
                  }`}
              >
                <div className="flex justify-between items-center border-b border-gray-700 pb-1">
                  <span className="font-bold text-sm truncate max-w-[90px]">
                    {p.name}
                  </span>
                  <div className="flex items-center gap-1 bg-green-900/30 px-1.5 rounded text-green-400 text-xs">
                    <Trophy size={10} /> {calculateScore(p.bank || [])}
                  </div>
                </div>

                {/* OPPONENT DANGER ZONE 
                    UPDATED: Added max-h-[160px] to ensure scrolling when pile gets large.
                */}
                <div className="flex flex-wrap content-start gap-1 flex-1 bg-black/20 rounded p-1 overflow-y-auto min-h-[80px] max-h-[160px]">
                  {p.table.length === 0 ? (
                    <span className="text-[10px] text-gray-600 w-full text-center py-4">
                      Safe
                    </span>
                  ) : (
                    p.table.map((fruit, i) => (
                      <div
                        key={i}
                        className="transform scale-75 origin-top-left -mr-3 -mb-3 hover:z-10 hover:scale-100 transition-transform"
                      >
                        <Card type={fruit} size="sm" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* CENTER: ACTION AREA */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 relative min-h-0">
            {/* Log Ticker */}
            <div className="absolute top-0 pointer-events-none w-full flex justify-center z-10">
              {gameState.logs.length > 0 && (
                <div className="bg-black/60 backdrop-blur px-4 py-1 rounded-full text-xs text-yellow-100/80 border border-yellow-500/20 animate-in fade-in slide-in-from-top-2 text-center max-w-[90%] truncate shadow-lg">
                  {gameState.logs[gameState.logs.length - 1].text}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 md:gap-16 w-full justify-center">
              {/* DECK */}
              <button
                onClick={
                  isMyTurn && !isStealing && gameState.turnPhase !== "BUSTED"
                    ? handleDraw
                    : undefined
                }
                disabled={
                  !isMyTurn || isStealing || gameState.turnPhase === "BUSTED"
                }
                className={`relative w-24 h-36 md:w-32 md:h-48 bg-gray-800 rounded-xl border-4 border-gray-700 shadow-2xl flex items-center justify-center group transition-all shrink-0 ${
                  isMyTurn && !isStealing && gameState.turnPhase !== "BUSTED"
                    ? "hover:scale-105 cursor-pointer hover:border-yellow-500 ring-4 ring-yellow-500/20"
                    : "opacity-80 cursor-default"
                }`}
              >
                <div className="absolute inset-2 border-2 border-dashed border-gray-600 rounded-lg" />
                <div className="text-center z-10">
                  <span className="block font-black text-xl md:text-2xl text-gray-500">
                    {gameState.deck.length}
                  </span>
                  <span className="text-[10px] uppercase text-gray-600 font-bold">
                    Cards
                  </span>
                </div>
                {isMyTurn &&
                  !isStealing &&
                  gameState.turnPhase !== "BUSTED" && (
                    <div className="absolute -bottom-4 md:-bottom-8 bg-yellow-500 text-black text-[10px] md:text-xs font-bold px-3 py-1 rounded-full animate-bounce shadow-lg z-20">
                      DRAW!
                    </div>
                  )}
              </button>

              {/* CURRENT HAND (RISK ZONE) 
                  UPDATED: Added pt-10 to prevent clipping of the hover pop-up effect 
                  and overflow-x-auto padding to prevent horizontal clipping.
              */}
              <div className="flex items-center justify-start p-2 pl-4 pt-10 pb-4 bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-700 h-[160px] md:h-[180px] w-full max-w-[500px] overflow-x-auto no-scrollbar relative">
                {/* Busted Overlay */}
                {gameState.drawnCard && gameState.turnPhase === "BUSTED" && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl animate-in fade-in">
                    <div className="transform rotate-12 scale-110 shadow-2xl shadow-red-500/50">
                      <Card type={gameState.drawnCard} size="lg" />
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white font-black px-2 py-1 rounded text-xs uppercase tracking-widest whitespace-nowrap">
                        Fatal Draw
                      </div>
                    </div>
                  </div>
                )}

                {activePlayer.hand.length === 0 && !gameState.drawnCard ? (
                  <div className="w-full text-center">
                    <span className="text-gray-600 font-bold uppercase tracking-widest text-xs md:text-sm">
                      Risk Zone Empty
                    </span>
                  </div>
                ) : (
                  <div className="flex -space-x-8 md:-space-x-12 px-2">
                    {activePlayer.hand.map((fruit, i) => (
                      <div
                        key={i}
                        className="transform transition-transform duration-200 hover:-translate-y-6 hover:scale-110 z-0 hover:z-30 shrink-0 shadow-xl"
                      >
                        <Card
                          type={fruit}
                          animate={i === activePlayer.hand.length - 1}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            {isMyTurn && activePlayer.hand.length > 0 && !isStealing && (
              <div className="flex gap-4 animate-in slide-in-from-bottom-4 z-20 mt-2">
                <button
                  onClick={handleStop}
                  className="bg-green-600 hover:bg-green-500 text-white px-8 md:px-12 py-3 md:py-4 rounded-xl font-black text-lg md:text-xl shadow-lg shadow-green-900/20 transform hover:scale-105 transition-all flex items-center gap-2 border-b-4 border-green-800 active:border-b-0 active:translate-y-1"
                >
                  <CheckCircle size={20} /> BANK IT!
                </button>
              </div>
            )}

            {/* Status Text */}
            {!isMyTurn && (
              <div className="bg-gray-900/80 px-4 md:px-6 py-2 md:py-3 rounded-full border border-gray-700 text-gray-400 font-mono text-xs md:text-sm animate-pulse text-center mt-2">
                Waiting for {activePlayer.name}...
              </div>
            )}
          </div>

          {/* BOTTOM: MY PLAYER AREA */}
          <div
            className={`flex-none bg-gray-900 p-3 md:p-4 rounded-t-3xl border-t-4 ${
              isMyTurn ? "border-yellow-500" : "border-gray-800"
            } shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 pb-6 md:pb-4`}
          >
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2 md:gap-4">
                <div className="relative">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-800 rounded-full border-2 border-gray-600 flex items-center justify-center overflow-hidden">
                    <User size={24} className="text-gray-400 md:hidden" />
                    <User size={32} className="text-gray-400 hidden md:block" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-green-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs md:text-base shadow-lg border-2 border-gray-900">
                    {calculateScore(me.bank || [])}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm md:text-xl font-bold text-white">
                    {me.name} (You)
                  </h3>
                  <div className="text-[10px] md:text-xs text-green-400 font-bold uppercase tracking-wider">
                    Safe Zone
                  </div>
                </div>
              </div>

              {/* MY DANGER ZONE 
                  UPDATED: Added max-h-[100px] and overflow-y-auto to allow scrolling for large piles
              */}
              <div className="flex-1 ml-4 md:ml-8 flex flex-col items-end overflow-hidden">
                <span className="text-[10px] md:text-xs text-orange-400 font-bold uppercase tracking-wider mb-1 md:mb-2 flex items-center gap-1 whitespace-nowrap">
                  <AlertTriangle size={12} /> Danger Zone (Next Turn)
                </span>
                <div className="flex flex-wrap justify-end gap-1 md:gap-2 bg-black/30 p-2 rounded-xl border border-gray-800 w-full md:w-auto min-h-[60px] md:min-h-[70px] max-h-[100px] min-w-[120px] overflow-y-auto">
                  {me.table.length === 0 ? (
                    <span className="text-gray-600 text-[10px] md:text-xs self-center mx-auto">
                      Empty
                    </span>
                  ) : (
                    me.table.map((fruit, i) => (
                      <div
                        key={i}
                        className="transform scale-75 hover:scale-100 transition-transform origin-bottom shrink-0 z-10"
                      >
                        <Card type={fruit} size="sm" />
                      </div>
                    ))
                  )}
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
