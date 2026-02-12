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
  Target,
  Zap,
  Shield,
  History,
  Info,
  LogOut,
  X,
  Trophy,
  RotateCcw,
  User,
  CheckCircle,
  Settings,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Home,
  Layers,
  Sparkles,
  Minimize2,
  EyeOff,
  Activity,
  Cpu,
  Unplug,
  FastForward,
  Signal,
  Inbox,
  Battery,
  Hammer,
  Trash2,
  Copy,
  Loader,
  Play,
} from "lucide-react";
import CoverImage from "./assets/spectrum_cover.png";

// --- Firebase Config & Init ---
const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : {
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

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "spectrum-game";
const GAME_ID = "24";

// --- Game Constants ---
const SUITS = {
  BLUE: {
    name: "Blue",
    color: "text-blue-400",
    bg: "bg-blue-900/40",
    border: "border-blue-500",
    icon: Activity,
  },
  GREEN: {
    name: "Green",
    color: "text-emerald-400",
    bg: "bg-emerald-900/40",
    border: "border-emerald-500",
    icon: Cpu,
  },
  MAGENTA: {
    name: "Magenta",
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-900/40",
    border: "border-fuchsia-500",
    icon: Target,
  },
  SILVER: {
    name: "Silver",
    color: "text-slate-200",
    bg: "bg-slate-700/40",
    border: "border-slate-400",
    icon: Zap,
  },
};

const SUIT_ORDER = { BLUE: 0, GREEN: 1, MAGENTA: 2, SILVER: 3 };

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

// --- Sub-Components ---

const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-160 flex items-center justify-center pointer-events-none">
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl border-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] transform transition-all animate-in fade-in zoom-in slide-in-from-bottom-10 duration-300 backdrop-blur-md
      ${
        type === "success"
          ? "bg-fuchsia-900/90 border-fuchsia-500 text-fuchsia-100"
          : ""
      }
      ${type === "failure" ? "bg-red-900/90 border-red-500 text-red-100" : ""}
      ${
        type === "neutral"
          ? "bg-slate-900/90 border-slate-500 text-slate-100"
          : ""
      }
    `}
    >
      {Icon && (
        <div className="mb-4 p-4 bg-black/30 rounded-full border-2 border-white/20">
          <Icon size={64} className="animate-bounce text-fuchsia-400" />
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
        const fruitKeys = Object.keys(SUITS);
        const Icon = SUITS[fruitKeys[i % fruitKeys.length]].icon;
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

const SpectrumLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Target size={12} className="text-fuchsia-500" />
    <span className="text-[10px] font-black tracking-widest text-fuchsia-500 uppercase">
      SPECTRUM
    </span>
  </div>
);

const SpectrumLogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Target size={22} className="text-fuchsia-500" />
    <span className="text-[20px] font-black tracking-widest text-fuchsia-500 uppercase">
      SPECTRUM
    </span>
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
      <h3 className="text-xl font-bold text-white mb-2 font-serif">
        Abort Frequency?
      </h3>
      <p className="text-gray-400 mb-6 text-sm">
        {isHost
          ? "WARNING: As Host, shutting down the server will disconnect all users."
          : inGame
            ? "Leaving now will destabilize the session for all observers!"
            : "Disconnecting from the backroom..."}
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-bold transition-colors"
        >
          Stay Sync'd
        </button>
        {inGame && isHost && (
          <button
            onClick={onConfirmLobby}
            className="py-3 rounded font-bold bg-fuchsia-700 hover:bg-fuchsia-600 text-white flex items-center justify-center gap-2 transition-colors"
          >
            <Home size={18} /> Return to Backroom
          </button>
        )}
        <button
          onClick={onConfirmLeave}
          className="bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut size={18} />{" "}
          {isHost ? "Shut Down Server" : "Sever Connection"}
        </button>
      </div>
    </div>
  </div>
);

const CardDisplay = ({
  suit,
  val,
  faceDown,
  onClick,
  disabled,
  highlight,
  small,
  tiny,
}) => {
  const suitInfo = faceDown ? SUITS.MAGENTA : SUITS[suit] || SUITS.MAGENTA;
  const displayVal = faceDown ? 5 : val;
  const SuitIcon = suitInfo.icon;

  if (tiny) {
    return (
      <div
        className={`w-6 h-8 rounded border flex items-center justify-center ${suitInfo.bg} ${suitInfo.border} shadow-sm shrink-0`}
        title={suit}
      >
        <span className={`text-[10px] font-black ${suitInfo.color}`}>
          {displayVal}
        </span>
      </div>
    );
  }

  const sizeClasses = small ? "w-16 h-24 p-2" : "w-24 h-36 md:w-32 md:h-48 p-3";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative rounded-xl border-2 shadow-lg transition-all flex flex-col items-center justify-between overflow-hidden
        ${sizeClasses} ${suitInfo.bg} ${suitInfo.border}
        ${highlight ? "ring-4 ring-fuchsia-400 scale-105 z-10" : ""}
        ${
          disabled
            ? "opacity-50 cursor-not-allowed grayscale"
            : "hover:scale-105 cursor-pointer"
        }
      `}
    >
      {faceDown && (
        <div className="absolute inset-0 bg-fuchsia-600/10 flex items-center justify-center pointer-events-none">
          <EyeOff size={48} className="text-fuchsia-500/10" />
        </div>
      )}
      <div
        className={`w-full flex justify-between font-black ${
          small ? "text-xs" : "text-lg"
        } ${suitInfo.color}`}
      >
        <span>{displayVal}</span>
        <Target size={small ? 12 : 16} opacity={0.3} />
      </div>
      <div className="flex flex-col items-center">
        <SuitIcon size={small ? 20 : 32} className={`${suitInfo.color} mb-1`} />
        {!small && (
          <span
            className={`text-[8px] uppercase tracking-widest font-black ${suitInfo.color} opacity-60`}
          >
            {faceDown ? "MAGENTA 5" : suitInfo.name}
          </span>
        )}
      </div>
      <div
        className={`w-full flex justify-start font-black ${
          small ? "text-xs" : "text-lg"
        } ${suitInfo.color} rotate-180`}
      >
        <span>{displayVal}</span>
      </div>
    </button>
  );
};

const RulesModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-170 flex items-center justify-center p-0 md:p-4">
    <div className="bg-gray-900 md:rounded-2xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-hidden border border-fuchsia-500/30 shadow-2xl flex flex-col">
      <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950">
        <div className="flex flex-col">
          <h2 className="text-2xl md:text-3xl font-black text-fuchsia-500 uppercase tracking-widest font-serif">
            SYSTEM OVERVIEW
          </h2>
          <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">
            Spectrum Protocol
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
        >
          <X />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 text-gray-300">
        <div className="bg-fuchsia-950/20 p-6 rounded-xl border border-fuchsia-500/20">
          <h3 className="text-xl font-bold text-fuchsia-400 mb-2 flex items-center gap-2 font-serif">
            <Target size={20} /> Target: Equilibrium 25
          </h3>
          <p className="text-sm md:text-base leading-relaxed opacity-80">
            Win tricks to collect cards. Your cumulative score must reach{" "}
            <strong>25</strong>. Exceeding 25 causes a{" "}
            <strong>System Overload (Bust)</strong>—you lose chips and forfeit
            the round score.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-bold text-white uppercase text-[10px] tracking-widest border-b border-gray-800 pb-2">
              Trick Mechanisms
            </h4>
            <ul className="space-y-3 text-xs md:text-sm">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />{" "}
                Must follow lead suit if possible.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />{" "}
                <strong>Silver</strong> is always Trump.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />{" "}
                Highest card of lead suit (or Trump) takes the trick.
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-fuchsia-400 uppercase text-[10px] tracking-widest border-b border-fuchsia-900/50 pb-2">
              The Magenta 5 Override
            </h4>
            <ul className="space-y-3 text-xs md:text-sm">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />{" "}
                Any card can be played <strong>Face-Down</strong> as a Magenta
                5.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />{" "}
                Allowed only if unable to follow suit OR if it's your final card
                of that suit.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />{" "}
                Only <strong>one</strong> Magenta 5 per trick.
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="p-6 bg-gray-950 border-t border-gray-800 text-center">
        <button
          onClick={onClose}
          className="w-full md:w-auto bg-fuchsia-700 hover:bg-fuchsia-600 text-white px-16 py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-fuchsia-900/20"
        >
          Engage
        </button>
      </div>
    </div>
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
    const saved = localStorage.getItem("spectrum_roomId");
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

// --- Main Component ---
export default function SpectrumGame() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("splash");

  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomId, setRoomId] = useState("");
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [feedbackOverlay, setFeedbackOverlay] = useState(null);
  const [playMode, setPlayMode] = useState("NORMAL");

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
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 3. NEW FUNCTION: Handle Splash Button Click
  const handleSplashStart = () => {
    const savedRoomId = localStorage.getItem("spectrum_roomId");

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

  // --- Session Restoration ---
  // useEffect(() => {
  //   const savedRoomId = localStorage.getItem("spectrum_roomId");
  //   if (savedRoomId) {
  //     setRoomId(savedRoomId);
  //   }
  // }, []);

  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();

          const amIInRoom = data.players.some((p) => p.id === user.uid);
          if (!amIInRoom) {
            setRoomId("");
            setView("menu");
            localStorage.removeItem("spectrum_roomId");
            setError("Signal Lost: Kicked by Host");
            return;
          }

          setGameState(data);
          if (data.status === "playing") setView("game");
          else if (data.status === "lobby") setView("lobby");
          else if (data.status === "finished") setView("game");
        } else {
          setRoomId("");
          setView("menu");
          localStorage.removeItem("spectrum_roomId");
          setError("Synchronicity Terminated (Room Closed)");
        }
      },
    );
    return () => unsub();
  }, [roomId, user]);

  useEffect(() => {
    if (!gameState || !user || gameState.status !== "playing") return;
    const isHost = gameState.hostId === user.uid;
    if (isHost && gameState.trick.length === gameState.players.length) {
      const timer = setTimeout(() => {
        resolveTrick(gameState.trick, gameState.players, gameState.leadSuit);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [gameState?.trick?.length, user?.uid, gameState?.status]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists() && doc.data()[GAME_ID]?.maintenance)
        setIsMaintenance(true);
      else setIsMaintenance(false);
    });
    return () => unsub();
  }, []);

  const triggerFeedback = (type, message, subtext = "", Icon = null) => {
    setFeedbackOverlay({ type, message, subtext, icon: Icon });
    setTimeout(() => setFeedbackOverlay(null), 2000);
  };

  const createRoom = async () => {
    if (!playerName) return setError("Identifier Required");
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
          chips: 5,
          hand: [],
          scorePile: [],
          scoreTotal: 0,
          busted: false,
          ready: false,
        },
      ],
      deck: [],
      trick: [],
      leadSuit: null,
      turnIndex: 0,
      roundCount: 1,
      logs: [],
      reserve: 0,
    };
    await setDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
      initialData,
    );
    localStorage.setItem("spectrum_roomId", newId);
    setRoomId(newId);
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCodeInput || !playerName) return setError("Protocol Data Missing");
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
      setError("Frequency not found");
      setLoading(false);
      return;
    }
    const data = snap.data();
    if (data.status !== "lobby") {
      setError("Session locked");
      setLoading(false);
      return;
    }
    if (data.players.length >= 4) {
      setError("Backroom Full");
      setLoading(false);
      return;
    }
    const newPlayers = [
      ...data.players,
      {
        id: user.uid,
        name: playerName,
        chips: 5,
        hand: [],
        scorePile: [],
        scoreTotal: 0,
        busted: false,
        ready: false,
      },
    ];
    await updateDoc(ref, { players: newPlayers });
    localStorage.setItem("spectrum_roomId", roomCodeInput);
    setRoomId(roomCodeInput);
    setLoading(false);
  };

  const startRound = async () => {
    if (!gameState || gameState.hostId !== user.uid) return;
    const playerCount = gameState.players.length;
    const cardsPerSuit = playerCount === 3 ? 9 : 13;
    const deck = [];
    Object.keys(SUITS).forEach((suitKey) => {
      for (let i = 1; i <= cardsPerSuit; i++) {
        deck.push({ suit: suitKey, val: i });
      }
    });
    const shuffled = shuffle(deck);
    const handSize = Math.floor(shuffled.length / playerCount);

    const players = gameState.players.map((p) => {
      const hand = [];
      for (let i = 0; i < handSize; i++) {
        hand.push(shuffled.pop());
      }
      return {
        ...p,
        // REMOVED: chips: 5, <--- This was the bug resetting your score
        hand,
        scorePile: [],
        scoreTotal: 0,
        busted: false,
        ready: false,
      };
    });

    const isNextRound = gameState.status === "playing";
    let nextStarterIndex;

    // --- CHANGED LOGIC START ---
    if (isNextRound) {
      // Ongoing game: Next player starts (Sequential Rotation)
      // We retrieve who started the PREVIOUS round, defaulting to 0 if undefined
      const prevStarter = gameState.roundStarterIdx ?? 0;
      nextStarterIndex = (prevStarter + 1) % playerCount;
    } else {
      // New Game: Random player starts
      nextStarterIndex = Math.floor(Math.random() * playerCount);
    }
    // --- CHANGED LOGIC END ---

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        deck: shuffled,
        players,
        trick: [],
        leadSuit: null,
        // Update both the actual turn and the tracker for the round starter
        turnIndex: nextStarterIndex,
        roundStarterIdx: nextStarterIndex,
        roundResult: null, // This clears the modal
        roundCount: isNextRound ? increment(1) : gameState.roundCount,
        logs: arrayUnion({
          text: `Initialized Frequency Sync: Round ${
            isNextRound ? gameState.roundCount + 1 : gameState.roundCount
          }`,
          type: "neutral",
        }),
      },
    );
  };

  const finalizeGame = async () => {
    if (!gameState || gameState.hostId !== user.uid) return;

    // Reset for a new game in Lobby
    const resetPlayers = gameState.players.map((p) => ({
      ...p,
      chips: 5,
      scoreTotal: 0,
      scorePile: [],
      hand: [],
      history: [],
      busted: false,
      ready: false,
      roundRank: null,
    }));

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby", // Go back to lobby
        roundCount: 1,
        players: resetPlayers,
        deck: [],
        trick: [],
        roundResult: null,
        reserve: 0,
        turnIndex: 0, // <--- ADD THIS LINE
        logs: [
          {
            text: "--- OPERATION COMPLETE: RETURNING TO BASE ---",
            type: "neutral",
          },
        ],
      },
    );
  };

  const restartGame = async () => {
    if (!gameState || gameState.hostId !== user.uid) return;
    const playerCount = gameState.players.length;
    const cardsPerSuit = playerCount === 3 ? 9 : 13;
    const deck = [];
    Object.keys(SUITS).forEach((suitKey) => {
      for (let i = 1; i <= cardsPerSuit; i++) {
        deck.push({ suit: suitKey, val: i });
      }
    });
    const shuffled = shuffle(deck);
    const handSize = Math.floor(shuffled.length / playerCount);
    const resetPlayers = gameState.players.map((p) => {
      const hand = [];
      for (let i = 0; i < handSize; i++) {
        hand.push(shuffled.pop());
      }
      return {
        ...p,
        chips: 5,
        hand,
        scorePile: [],
        scoreTotal: 0,
        busted: false,
        ready: false,
      };
    });

    // --- CHANGED LOGIC: Random start for Reboot ---
    const randomStarter = Math.floor(Math.random() * playerCount);

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        deck: shuffled,
        players: resetPlayers,
        trick: [],
        leadSuit: null,
        turnIndex: randomStarter, // Random start
        roundStarterIdx: randomStarter, // Save reference
        roundCount: 1,
        reserve: 0,
        roundResult: null,
        logs: [
          {
            text: "--- GRID REBOOTED: COMMENCING NEW OPERATION ---",
            type: "neutral",
          },
        ],
      },
    );
    setShowLeaveConfirm(false);
  };

  const setPlayerReady = async () => {
    if (!gameState) return;
    const updatedPlayers = gameState.players.map((p) =>
      p.id === user.uid ? { ...p, ready: true } : p,
    );
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players: updatedPlayers,
      },
    );
  };

  const handleRoundReady = async () => {
    if (!gameState) return;
    const updatedPlayers = gameState.players.map((p) =>
      p.id === user.uid ? { ...p, ready: true } : p,
    );
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players: updatedPlayers },
    );
  };

  const playCard = async (index, faceDown) => {
    if (
      !gameState ||
      gameState.turnIndex === null ||
      gameState.players[gameState.turnIndex].id !== user.uid
    )
      return;
    const me = gameState.players[gameState.turnIndex];
    const card = me.hand[index];

    if (gameState.trick.length > 0 && !faceDown) {
      const hasSuit = me.hand.some((c) => c.suit === gameState.leadSuit);
      if (hasSuit && card.suit !== gameState.leadSuit) {
        triggerFeedback("failure", "DESYNC", "Must maintain lead frequency!");
        return;
      }
    }

    if (faceDown) {
      const hasSuit = me.hand.some((c) => c.suit === gameState.leadSuit);
      const isLastOfSuit =
        me.hand.filter((c) => c.suit === gameState.leadSuit).length === 1 &&
        card.suit === gameState.leadSuit;
      const magentaExists = gameState.trick.some((t) => t.faceDown);

      if (magentaExists) {
        triggerFeedback("failure", "JAMMED", "One Magenta Override limit!");
        return;
      }
      if (gameState.trick.length > 0 && hasSuit && !isLastOfSuit) {
        triggerFeedback(
          "failure",
          "INVALID MASK",
          "Cannot mask if able to follow.",
        );
        return;
      }
    }

    const updatedPlayers = [...gameState.players];
    const playerIdx = gameState.turnIndex;
    updatedPlayers[playerIdx].hand.splice(index, 1);
    const trickCard = {
      playerId: user.uid,
      playerName: me.name,
      suit: card.suit,
      val: card.val,
      faceDown,
    };
    const newTrick = [...gameState.trick, trickCard];
    let newLeadSuit = gameState.leadSuit;

    if (gameState.trick.length === 0) {
      newLeadSuit = faceDown ? "MAGENTA" : card.suit;
    }

    const isTrickComplete = newTrick.length === gameState.players.length;
    const nextTurn = isTrickComplete
      ? -1
      : (gameState.turnIndex + 1) % gameState.players.length;

    const logText = faceDown
      ? `📡 ${me.name} initiated MAGENTA_OVERRIDE (MASKED)`
      : `📡 ${me.name} transmitted signal: ${card.suit} ${card.val}`;
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players: updatedPlayers,
        trick: newTrick,
        leadSuit: newLeadSuit,
        turnIndex: nextTurn,
        logs: arrayUnion({ text: logText, type: "neutral" }),
      },
    );
    setPlayMode("NORMAL");
  };

  const RoundSummaryModal = ({
    roundCount,
    results,
    players,
    isHost,
    hostId,
    onReady,
    onNextRound,
    onFinalize,
    myId,
  }) => {
    const guests = players.filter((p) => p.id !== hostId);
    const allGuestsReady = guests.every((p) => p.ready);
    const readyCount = guests.filter((p) => p.ready).length;
    const totalGuests = guests.length;
    const me = players.find((p) => p.id === myId);

    // Calculate columns based on the history length of the first player to prevent blanks
    // If roundCount is 4, we expect 4 columns.
    const rounds = Array.from({ length: roundCount }, (_, i) => i + 1);
    const isFinal = results.isFinal;

    // Determine Winner for Final Screen
    const winner = players.find((p) => p.id === results.winnerId) || players[0];
    const isMeWinner = winner?.id === myId;

    return (
      <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
        <div
          className={`w-full max-w-5xl ${
            isFinal
              ? "border-2 border-yellow-500/50 shadow-yellow-900/40"
              : "border border-fuchsia-500/30"
          } bg-gray-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]`}
        >
          {/* --- VICTORY HEADER (Only if Final) --- */}
          {isFinal && (
            <div className="bg-linear-to-b from-yellow-900/20 to-gray-900 p-8 text-center shrink-0 border-b border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="relative z-10 flex flex-col items-center animate-in slide-in-from-top-10 duration-700">
                <Trophy
                  size={64}
                  className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] mb-4 animate-bounce"
                />
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-linear-to-b from-yellow-200 to-yellow-600 font-serif tracking-[0.2em] uppercase mb-2">
                  {winner.name}
                </h1>
                <div className="inline-flex items-center gap-2 bg-yellow-950/40 border border-yellow-500/30 px-6 py-2 rounded-full">
                  <span className="text-yellow-500 font-bold tracking-widest text-xs uppercase">
                    Mission Accomplished
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* --- NORMAL HEADER (If Not Final) --- */}
          {!isFinal && (
            <div className="p-6 bg-gray-950 border-b border-gray-800 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black text-white font-serif tracking-widest uppercase">
                  Phase {roundCount} Report
                </h2>
              </div>
              <div className="flex gap-4">
                {results.reserve > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-fuchsia-900/20 rounded-full border border-fuchsia-500/20">
                    <Battery size={16} className="text-fuchsia-400" />
                    <span className="text-lg font-mono font-bold text-white">
                      {results.reserve}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full border border-gray-700">
                  <span className="text-[10px] text-gray-400 uppercase font-black">
                    Ready
                  </span>
                  <span className="text-lg font-mono font-bold text-white">
                    {readyCount}/{totalGuests}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* --- THE TABLE (Shows Round 4 Data correctly now) --- */}
          <div className="p-0 md:p-6 overflow-x-auto flex-1 bg-gray-900">
            {!isFinal && (
              <div className="md:hidden text-center text-[10px] text-gray-500 uppercase py-2">
                Scroll for details &rarr;
              </div>
            )}
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-800">
                  <th className="pb-3 pl-4 sticky left-0 bg-gray-900 z-20">
                    Rank
                  </th>
                  <th className="pb-3 sticky left-14 bg-gray-900 z-20">Unit</th>
                  {rounds.map((r) => (
                    <React.Fragment key={r}>
                      <th className="pb-3 text-center px-2 border-l border-gray-800 text-fuchsia-400/50">
                        R{r} Eq
                      </th>
                      <th className="pb-3 text-center px-2 text-fuchsia-400/50">
                        Diff
                      </th>
                    </React.Fragment>
                  ))}
                  <th className="pb-3 text-right pl-4 pr-4 border-l border-gray-800 text-white sticky right-0 bg-gray-900 z-20">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {results.breakdown.map((row) => {
                  const isRowMe = row.id === myId;
                  const playerObj = players.find((p) => p.id === row.id);
                  const history = playerObj?.history || [];

                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-800/50 ${
                        isRowMe ? "bg-fuchsia-900/10" : ""
                      }`}
                    >
                      <td className="py-4 pl-4 font-mono text-gray-400 sticky left-0 bg-gray-900/95 z-10">
                        {row.busted ? (
                          <span className="text-red-500">⚠</span>
                        ) : (
                          `#${row.rank}`
                        )}
                      </td>
                      <td
                        className={`py-4 font-bold sticky left-14 bg-gray-900/95 z-10 ${
                          isRowMe ? "text-fuchsia-300" : "text-gray-300"
                        }`}
                      >
                        {row.name}
                      </td>

                      {rounds.map((r, i) => {
                        const roundData = history[i];
                        return (
                          <React.Fragment key={r}>
                            <td className="py-4 text-center font-mono border-l border-gray-800 px-2 text-gray-500">
                              {roundData ? roundData.eq : "-"}
                            </td>
                            <td className="py-4 text-center font-mono font-bold px-2">
                              {roundData ? (
                                roundData.diff > 0 ? (
                                  <span className="text-green-400">
                                    +{roundData.diff}
                                  </span>
                                ) : roundData.diff < 0 ? (
                                  <span className="text-red-400">
                                    {roundData.diff}
                                  </span>
                                ) : (
                                  <span className="text-gray-600">-</span>
                                )
                              ) : (
                                "-"
                              )}
                            </td>
                          </React.Fragment>
                        );
                      })}

                      <td className="py-4 text-right pr-4 font-mono font-bold text-white border-l border-gray-800 sticky right-0 bg-gray-900/95 z-10">
                        {row.chipsTotal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* --- FOOTER ACTIONS --- */}
          <div className="p-6 bg-gray-950 border-t border-gray-800 flex justify-end gap-3 shrink-0">
            {isHost ? (
              <button
                onClick={isFinal ? onFinalize : onNextRound} // Finalize resets to lobby
                disabled={!isFinal && !allGuestsReady}
                className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all w-full md:w-auto ${
                  isFinal
                    ? "bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20"
                    : allGuestsReady
                      ? "bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-lg"
                      : "bg-gray-800 text-gray-600 cursor-not-allowed opacity-50"
                }`}
              >
                {isFinal ? (
                  <>
                    {" "}
                    <Home size={18} /> Return to Base{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    <FastForward size={18} />{" "}
                    {allGuestsReady
                      ? "Initialize Next Phase"
                      : "Awaiting Signals..."}{" "}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={onReady}
                disabled={isFinal || me?.ready} // Disable if game is over
                className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all w-full md:w-auto ${
                  isFinal
                    ? "bg-gray-800 text-gray-500 cursor-default" // Guest view on final screen
                    : me?.ready
                      ? "bg-green-900/30 border border-green-500/50 text-green-500 cursor-default"
                      : "bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-lg animate-pulse"
                }`}
              >
                {isFinal
                  ? "Awaiting Host..."
                  : me?.ready
                    ? "Standing By"
                    : "Signal Ready"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const resolveTrick = async (trick, currentPlayers, leadSuit) => {
    let winnerId = trick[0].playerId;
    let highestVal = -1;

    // 1. Determine Winner
    const trumps = trick.filter((t) => t.suit === "SILVER" && !t.faceDown);
    if (trumps.length > 0) {
      highestVal = Math.max(...trumps.map((t) => t.val));
      winnerId = trumps.find((t) => t.val === highestVal).playerId;
    } else {
      const valid = trick.filter(
        (t) =>
          (t.suit === leadSuit && !t.faceDown) ||
          (t.faceDown && leadSuit === "MAGENTA"),
      );
      if (valid.length > 0) {
        highestVal = Math.max(...valid.map((t) => (t.faceDown ? 5 : t.val)));
        winnerId = valid.find(
          (t) => (t.faceDown ? 5 : t.val) === highestVal,
        ).playerId;
      }
    }

    const winnerIdx = currentPlayers.findIndex((p) => p.id === winnerId);
    const winningCard = trick.find((t) => t.playerId === winnerId);
    const cardValAdded = winningCard.faceDown ? 5 : winningCard.val;

    const newLogs = [];
    const updatedPlayers = currentPlayers.map((p) => ({ ...p }));

    // 2. Update Scores
    updatedPlayers[winnerIdx].scorePile = [
      ...updatedPlayers[winnerIdx].scorePile,
      winningCard,
    ];
    updatedPlayers[winnerIdx].scoreTotal += cardValAdded;

    // Check Bust
    if (updatedPlayers[winnerIdx].scoreTotal > 25) {
      updatedPlayers[winnerIdx].busted = true;
      newLogs.push({
        text: `⚠️ SYSTEM_OVERLOAD: ${updatedPlayers[winnerIdx].name} BUSTED at ${updatedPlayers[winnerIdx].scoreTotal}`,
        type: "danger",
      });
    }

    const roundEnds = updatedPlayers.every((p) => p.hand.length === 0);

    if (roundEnds) {
      // --- ROUND END CALCULATION ---
      const finalPlayers = JSON.parse(JSON.stringify(updatedPlayers));

      // Snapshot chips before distribution for history delta
      const chipsBefore = {};
      finalPlayers.forEach((p) => (chipsBefore[p.id] = p.chips));

      // Calculate Rankings
      const scoreGroups = {};
      finalPlayers
        .filter((p) => !p.busted)
        .forEach((p) => {
          const diff = Math.abs(25 - p.scoreTotal);
          if (!scoreGroups[diff]) scoreGroups[diff] = [];
          scoreGroups[diff].push(p.id);
        });

      const sortedDiffs = Object.keys(scoreGroups)
        .map(Number)
        .sort((a, b) => a - b);

      const rewards = finalPlayers.length === 3 ? [2, 1, 0] : [3, 2, 1, 0];
      let nextReserve = gameState.reserve || 0;
      let currentRank = 0;

      // Distribute Rewards
      sortedDiffs.forEach((diff) => {
        const group = scoreGroups[diff];
        const reward = rewards[currentRank] || 0;
        const rankLabel = currentRank + 1;

        group.forEach((pid) => {
          const p = finalPlayers.find((x) => x.id === pid);
          p.chips += reward;
          p.roundRank = rankLabel;

          // Perfect Score Bonus
          if (diff === 0) {
            p.chips += 1;
            newLogs.push({
              text: `🎯 PERFECT_SYNC: ${p.name} (+1 Bonus)`,
              type: "success",
            });
          }
        });
        currentRank += group.length;
      });

      // Handle Bust Penalties
      finalPlayers.forEach((p) => {
        if (p.busted) {
          p.chips -= 1;
          p.roundRank = 99;
          nextReserve += 1;
        }
      });

      // Handle Reserve Payout or Flush
      const firstPlaceIds = scoreGroups[sortedDiffs[0]] || [];
      const singleWinner = firstPlaceIds.length === 1;

      if (singleWinner) {
        const winner = finalPlayers.find((p) => p.id === firstPlaceIds[0]);
        if (nextReserve > 0) {
          winner.chips += nextReserve;
          newLogs.push({
            text: `⚡ RESERVE CAPTURED: ${winner.name} (+${nextReserve})`,
            type: "success",
          });
          nextReserve = 0;
        }
      }

      // --- CRITICAL HISTORY FIX ---
      // We push to history explicitly here before saving
      finalPlayers.forEach((p) => {
        if (!Array.isArray(p.history)) p.history = [];
        const diff = p.chips - chipsBefore[p.id];
        // Ensure values are numbers
        p.history.push({ eq: Number(p.scoreTotal), diff: Number(diff) });
      });

      // Generate Modal Data
      const breakdown = finalPlayers
        .map((p) => ({
          id: p.id,
          name: p.name,
          chipsTotal: p.chips,
          rank: p.roundRank,
          busted: p.busted,
          // We don't need history here, strictly, as we read it from the player object,
          // but passing it in the player object inside updateDoc is vital.
        }))
        .sort((a, b) =>
          a.busted === b.busted
            ? b.chipsTotal - a.chipsTotal
            : a.busted
              ? 1
              : -1,
        );

      // --- FIX STARTS HERE ---
      // Determine the TRUE chip leader separately
      // (Sort purely by chips, ignoring bust status)
      const trueLeader = [...finalPlayers].sort((a, b) => b.chips - a.chips)[0];
      // --- FIX ENDS HERE ---

      // Check Final Game State
      const gameFinished =
        gameState.roundCount >= 4 || finalPlayers.some((p) => p.chips >= 25);
      if (gameFinished && nextReserve > 0) nextReserve = 0; // Clear reserve on game over

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: finalPlayers, // This saves the updated history!
          trick: [],
          leadSuit: null,
          turnIndex: null,
          status: "playing", // Keep playing to show modal
          reserve: nextReserve,
          roundResult: {
            breakdown,
            reserve: nextReserve,
            isFinal: gameFinished,
            winnerId: gameFinished ? trueLeader.id : null, // Pass winner ID for the modal
          },
          logs: arrayUnion(...newLogs, {
            text: `--- Phase ${gameState.roundCount} Complete ---`,
            type: "neutral",
          }),
        },
      );
    } else {
      // Normal Trick End
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: updatedPlayers,
          trick: [],
          leadSuit: null,
          turnIndex: winnerIdx,
          logs: arrayUnion(...newLogs, {
            text: `✅ Trick secured by ${updatedPlayers[winnerIdx].name}`,
            type: "success",
          }),
        },
      );
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId) return;
    const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);
    try {
      if (gameState?.hostId === user.uid) {
        await deleteDoc(ref);
      } else {
        const newPlayers = gameState.players.filter((p) => p.id !== user.uid);
        await updateDoc(ref, { players: newPlayers });
      }
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("spectrum_roomId");
    setRoomId("");
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

  const kickPlayer = async (playerIdToRemove) => {
    if (!gameState || gameState.hostId !== user.uid) return;

    const newPlayers = gameState.players.filter(
      (p) => p.id !== playerIdToRemove,
    );

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players: newPlayers },
    );
  };

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <SpectrumLogoBig />
        <div className="bg-orange-500/10 p-8 rounded-2xl border border-orange-500/30">
          <Hammer
            size={64}
            className="text-orange-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
          <p className="text-gray-400">
            The system is running short of chips. Wait until new chips are built
            and delivered.
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
        <SpectrumLogo />
      </div>
    );
  }

  if (!user)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-fuchsia-500 animate-pulse">
        Merging frequencies...
      </div>
    );

  // RECONNECTING STATE
  if (roomId && !gameState && !error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4">
        <FloatingBackground />
        <div className="bg-zinc-900/80 backdrop-blur p-8 rounded-2xl border border-zinc-700 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <Loader size={48} className="text-fuchsia-500 animate-spin" />
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
            className="flex items-center gap-2 text-fuchsia-800 rounded-lg 
			font-bold shadow-md hover:text-fuchsia-400 transition-colors w-fit animate-pulse"
          >
            {/* Arrow Icon */}
            <StepBack />
            <span>Back to Gamehub</span>
          </a>
        </nav>
        {/* --- END OF BACK BUTTON --- */}
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
        <div className="z-10 text-center mb-10">
          <Target
            size={64}
            className="text-fuchsia-500 mx-auto mb-4 animate-bounce drop-shadow-[0_0_20px_rgba(217,70,239,0.4)]"
          />
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-linear-to-b from-fuchsia-300 to-fuchsia-600 font-serif tracking-[0.2em]">
            SPECTRUM
          </h1>
          <p className="text-white-400/60 tracking-[0.3em] uppercase mt-2">
            THE MAGENTA EQUILIBRIUM
          </p>
        </div>
        <div className="bg-gray-900/90 backdrop-blur-md border border-fuchsia-500/20 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10">
          {error && (
            <div className="bg-red-900/40 text-red-200 p-3 mb-4 rounded border border-red-800 text-center text-xs">
              {error}
            </div>
          )}
          <input
            className="w-full bg-black/60 border border-gray-700 p-3 rounded mb-4 text-white placeholder-gray-600 focus:border-fuchsia-500 outline-none transition-all uppercase font-mono tracking-widest text-sm"
            placeholder="AGENT_IDENTIFIER"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-fuchsia-700 hover:bg-fuchsia-600 p-4 rounded-xl font-black mb-4 flex items-center justify-center gap-2 shadow-lg tracking-widest uppercase transition-all text-sm"
          >
            <Target size={18} /> Establish Grid
          </button>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              className="w-full sm:flex-1 bg-black/60 border border-gray-700 p-3 rounded text-white placeholder-gray-600 uppercase font-mono tracking-widest text-sm outline-none"
              placeholder="ROOM_CODE"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 border border-gray-700 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest"
            >
              Infiltrate
            </button>
          </div>
          <button
            onClick={() => setShowRules(true)}
            className="w-full text-[10px] text-gray-500 hover:text-fuchsia-400 flex items-center justify-center gap-2 uppercase tracking-widest"
          >
            <BookOpen size={14} /> System Manual
          </button>
        </div>
        <div className="absolute bottom-4 text-slate-600 text-xs text-center">
          Inspired by Fives. A tribute game.
          <br />
          Developed by <strong>RAWFID K SHUVO</strong>. Visit{" "}
          <a
            href={import.meta.env.BASE_URL}
            //target="_blank"
            rel="noopener noreferrer"
            className="text-fuchsia-500 underline hover:text-fuchsia-600"
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
        <SpectrumLogoBig />
        <div className="z-10 w-full max-w-lg bg-gray-900/95 backdrop-blur-xl p-8 rounded-2xl border border-fuchsia-900/30 shadow-2xl">
          <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
            {/* Grouping Title and Copy Button together on the left */}
            <div>
              <h2 className="text-lg md:text-xl text-fuchsia-500 font-bold uppercase">
                Frequency
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
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-fuchsia-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg animate-fade-in-up whitespace-nowrap">
                      Copied!
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 bg-red-900/20 hover:bg-red-900/40 rounded text-red-400 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
          <div className="space-y-3 mb-10">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-gray-800"
              >
                <span
                  className={`font-black flex items-center gap-2 text-sm uppercase tracking-widest ${
                    p.id === user.uid ? "text-fuchsia-400" : "text-gray-400"
                  }`}
                >
                  <User size={14} /> {p.name}{" "}
                  {p.id === gameState.hostId && (
                    <Sparkles size={14} className="text-yellow-500" />
                  )}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-green-500 text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 animate-pulse">
                    <CheckCircle size={10} /> Active
                  </span>
                  {isHost && p.id !== gameState.hostId && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-all"
                      title="Kick Player"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {isHost ? (
            <button
              onClick={startRound}
              disabled={gameState.players.length < 3}
              className={`w-full py-5 rounded-xl font-black uppercase tracking-[0.2em] transition-all shadow-xl ${
                gameState.players.length >= 3
                  ? "bg-fuchsia-700 hover:bg-fuchsia-600 text-white shadow-fuchsia-900/20"
                  : "bg-gray-800 text-gray-600 cursor-not-allowed"
              }`}
            >
              {gameState.players.length < 3
                ? "Awaiting Data (3+ Required)"
                : "Commence Protocol"}
            </button>
          ) : (
            <div className="text-center text-fuchsia-500/50 animate-pulse font-serif italic text-sm">
              Synchronizing with host authority...
            </div>
          )}
        </div>
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onCancel={() => setShowLeaveConfirm(false)}
            onConfirmLeave={handleLeaveRoom}
            isHost={isHost}
          />
        )}
        <SpectrumLogo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const me = gameState.players.find((p) => p.id === user.uid);
    if (!me) return null;

    const isMyTurn =
      gameState.turnIndex !== null &&
      gameState.turnIndex !== -1 &&
      gameState.players[gameState.turnIndex]?.id === user.uid;
    const isHost = gameState.hostId === user.uid;
    const isRoundOver =
      gameState.turnIndex === null && gameState.status === "playing";
    const sortedHand = me
      ? [...me.hand]
          .map((card, originalIdx) => ({ ...card, originalIdx }))
          .sort((a, b) => {
            if (SUIT_ORDER[a.suit] !== SUIT_ORDER[b.suit])
              return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
            return a.val - b.val;
          })
      : [];
    const allGuestsReady = gameState.players
      .filter((p) => p.id !== gameState.hostId)
      .every((p) => p.ready);
    const victor = [...gameState.players].sort((a, b) => b.chips - a.chips)[0];

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden font-sans">
        <FloatingBackground />
        {feedbackOverlay && <FeedbackOverlay {...feedbackOverlay} />}
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}

        {showLeaveConfirm && (
          <LeaveConfirmModal
            onCancel={() => setShowLeaveConfirm(false)}
            onConfirmLeave={handleLeaveRoom}
            onConfirmLobby={() => {
              // Perform a full reset of player stats
              const resetPlayers = gameState.players.map((p) => ({
                ...p,
                chips: 5, // <--- Reset chips to 5
                scoreTotal: 0, // <--- Reset current score
                scorePile: [], // <--- Clear collected cards
                hand: [], // <--- Clear hand
                history: [], // <--- Clear history (R1, R2 columns)
                busted: false,
                ready: false,
              }));

              updateDoc(
                doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
                {
                  status: "lobby",
                  roundCount: 1,
                  roundResult: null,
                  reserve: 0,
                  players: resetPlayers,
                  deck: [], // <--- Clear the deck
                  trick: [], // <--- Clear any active trick
                  logs: [], // <--- Optional: Clear logs for a fresh start
                },
              );
              setShowLeaveConfirm(false);
            }}
            isHost={isHost}
            inGame
          />
        )}

        <div className="h-14 bg-gray-950/90 border-b border-fuchsia-900/30 flex items-center justify-between px-4 z-160 backdrop-blur-md sticky top-0">
          <div className="flex items-center gap-2 font-serif font-black text-fuchsia-500 tracking-[0.2em]">
            SPECTRUM{" "}
            <span className="text-[10px] text-gray-500 font-sans tracking-widest ml-1 opacity-70">
              (ROUND {gameState.roundCount})
            </span>
          </div>
          <div className="flex gap-2">
            {gameState.reserve > 0 && (
              <div className="flex items-center gap-1.5 bg-fuchsia-900/40 px-3 py-1 rounded-full border border-fuchsia-500/30 mr-2 animate-in fade-in slide-in-from-right-4 duration-500">
                <Battery size={12} className="text-fuchsia-400" />
                <span className="text-[10px] font-black text-fuchsia-300 uppercase tracking-tighter">
                  EXTRA_CHIPS: {gameState.reserve}
                </span>
              </div>
            )}
            <button
              onClick={() => setShowRules(true)}
              className="p-2 hover:bg-gray-800 rounded text-gray-400 transition-colors"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`p-2 rounded-full ${
                showLogs
                  ? "bg-fuchsia-900 text-fuchsia-400"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              <History size={18} />
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-red-900/40 rounded text-red-400 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 p-2 md:p-4 flex flex-col items-center justify-between relative z-10 w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full justify-center">
            {gameState.players.map((p, i) => {
              if (p.id === user.uid) return null;
              const isActive = gameState.turnIndex === i;
              return (
                <div
                  key={p.id}
                  className={`bg-black/60 p-3 rounded-xl border-2 transition-all 
                  ${
                    isActive
                      ? "border-fuchsia-500 scale-105 shadow-xl shadow-fuchsia-900/40 animate-pulse"
                      : "border-gray-800"
                  } 
                  ${p.busted ? "opacity-30 grayscale" : ""}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-[10px] uppercase tracking-wider truncate max-w-[70px]">
                      {p.name}
                    </span>
                    <div className="flex gap-1 items-center bg-gray-900 px-2 rounded-full border border-gray-700">
                      <Sparkles size={8} className="text-yellow-400" />
                      <span className="text-[10px] font-mono">{p.chips}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex -space-x-3">
                      {p.hand.map((_, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-6 bg-fuchsia-950 rounded border border-fuchsia-800"
                        />
                      ))}
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-[10px] font-black tracking-tighter ${
                          p.busted ? "text-red-500" : "text-fuchsia-400"
                        }`}
                      >
                        EQ: {p.scoreTotal}
                      </div>
                      <div className="flex flex-wrap gap-0.5 justify-end max-w-[80px]">
                        {p.scorePile.map((c, idx) => (
                          <CardDisplay key={idx} {...c} tiny />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full relative">
            {/* --- REPLACEMENT START --- */}
            {isRoundOver &&
              gameState.roundResult &&
              gameState.roundResult.breakdown && (
                <RoundSummaryModal
                  roundCount={gameState.roundCount}
                  results={gameState.roundResult}
                  players={gameState.players}
                  isHost={isHost}
                  hostId={gameState.hostId} // <--- Pass this prop
                  myId={user.uid}
                  onReady={handleRoundReady}
                  onNextRound={startRound}
                  onFinalize={finalizeGame} // Pass the new function here
                />
              )}
            {/* --- REPLACEMENT END --- */}

            <div className="relative w-full max-w-md flex flex-wrap gap-4 justify-center items-center">
              {gameState.trick.map((c, idx) => (
                <div
                  key={idx}
                  className="animate-in zoom-in slide-in-from-bottom-4 duration-500 flex flex-col items-center"
                >
                  <div className="text-[10px] text-gray-500 uppercase font-black text-center mb-1 tracking-tighter truncate w-24">
                    {c.playerName}
                  </div>
                  <CardDisplay {...c} small />
                </div>
              ))}

              {gameState.trick.length === 0 && !isRoundOver && (
                <div className="text-gray-800 uppercase tracking-[0.5em] font-black text-center opacity-40 select-none flex flex-col items-center">
                  <Activity size={64} className="mb-4 text-fuchsia-900" />
                  IDLE_GRID
                </div>
              )}
            </div>

            {gameState.leadSuit && !isRoundOver && (
              <div className="mt-8 bg-gray-900/80 border border-fuchsia-500/20 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                Protocol:{" "}
                <span className={SUITS[gameState.leadSuit]?.color}>
                  {SUITS[gameState.leadSuit]?.name}
                </span>
              </div>
            )}
          </div>

          <div className="w-full bg-gray-900/98 border-t-2 border-fuchsia-500/20 p-4 md:p-6 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`px-5 py-3 rounded-2xl flex items-center gap-3 border transition-all ${
                    me.busted
                      ? "bg-red-950/40 border-red-500 shadow-red-900/20"
                      : "bg-fuchsia-950/40 border-fuchsia-500 shadow-fuchsia-900/20"
                  }`}
                >
                  <Activity
                    className={me.busted ? "text-red-500" : "text-fuchsia-400"}
                    size={24}
                  />
                  <div className="flex flex-col">
                    <span
                      className={`text-2xl font-black leading-none ${
                        me.busted ? "text-red-500" : "text-fuchsia-100"
                      }`}
                    >
                      {me.scoreTotal}
                    </span>
                    <span className="text-[8px] uppercase font-black tracking-widest text-gray-500">
                      Equilibrium
                    </span>
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-400" />
                  <span className="text-xl font-mono font-bold">
                    {me.chips}
                  </span>
                </div>

                {/* --- MODIFIED: Added My Score Pile Visualization (Removed hidden sm:flex) --- */}
                <div className="flex flex-col border-l border-gray-800 pl-4 ml-2">
                  <span className="text-[8px] uppercase text-gray-500 font-black mb-1">
                    Acquired
                  </span>
                  <div className="flex flex-wrap gap-0.5 max-w-[150px]">
                    {me.scorePile.map((c, idx) => (
                      <CardDisplay key={idx} {...c} tiny />
                    ))}
                  </div>
                </div>
                {/* -------------------------------------------------- */}
              </div>

              {isMyTurn && !isRoundOver && (
                <div className="flex bg-black/50 p-1.5 rounded-xl border border-gray-800 shadow-inner">
                  <button
                    onClick={() => setPlayMode("NORMAL")}
                    className={`px-2 sm:px-4 py-2 text-[8px] font-black tracking-widest uppercase rounded-lg transition-all ${
                      playMode === "NORMAL"
                        ? "bg-fuchsia-600 text-white shadow-lg"
                        : "text-gray-500 hover:text-gray-400"
                    }`}
                  >
                    Signal
                  </button>
                  <button
                    onClick={() => setPlayMode("FACEDOWN")}
                    className={`px-2 sm:px-4 py-2 text-[8px] font-black tracking-widest uppercase rounded-lg transition-all ${
                      playMode === "FACEDOWN"
                        ? "bg-fuchsia-600 text-white shadow-lg"
                        : "text-gray-500 hover:text-gray-400"
                    }`}
                  >
                    Override
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto pt-6 pb-8 px-4 justify-start lg:justify-center items-end h-64 scrollbar-hide scroll-smooth">
              {sortedHand.map((card) => (
                <div
                  key={card.originalIdx}
                  className={`${
                    isMyTurn ? "hover:translate-y-[-10px]" : ""
                  } transition-transform duration-300 shrink-0`}
                >
                  <CardDisplay
                    suit={card.suit}
                    val={card.val}
                    faceDown={playMode === "FACEDOWN"}
                    onClick={() =>
                      isMyTurn &&
                      playCard(card.originalIdx, playMode === "FACEDOWN")
                    }
                    disabled={!isMyTurn}
                    highlight={isMyTurn}
                  />
                </div>
              ))}
              {me.hand.length === 0 && gameState.trick.length > 0 && (
                <div className="text-gray-600 font-black uppercase text-xs animate-pulse">
                  Syncing Pulse...
                </div>
              )}
              {me.hand.length === 0 &&
                gameState.trick.length === 0 &&
                !isRoundOver &&
                gameState.status !== "finished" && (
                  <div className="text-fuchsia-600 font-black uppercase text-xs animate-pulse">
                    Protocol Initializing...
                  </div>
                )}
            </div>
          </div>
        </div>

        {showLogs && (
          <div className="fixed top-16 right-4 w-64 max-h-60 bg-gray-900/95 border border-gray-700 rounded-xl z-155 overflow-y-auto p-2 shadow-2xl">
            <div className="bg-gray-900 border border-gray-800 w-full max-w-md h-[60vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
              <div className="p-4 bg-gray-950 flex justify-between items-center border-b border-gray-800">
                <span className="font-serif font-black text-fuchsia-500 tracking-widest uppercase text-sm">
                  System_Logs
                </span>
                <button onClick={() => setShowLogs(false)}>
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {[...gameState.logs].reverse().map((l, i) => (
                  <div
                    key={i}
                    className={`text-[10px] font-mono p-2 border-l-2 bg-black/30 ${
                      l.type === "success"
                        ? "border-fuchsia-500 text-fuchsia-300"
                        : l.type === "danger"
                          ? "border-red-500 text-red-300"
                          : "border-gray-700 text-gray-500"
                    }`}
                  >
                    {l.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {gameState.status === "finished" && (
          <div className="fixed inset-0 top-14 bg-black/95 z-150 flex flex-col items-center justify-center p-4 backdrop-blur-2xl">
            <div className="relative mb-10">
              <Trophy
                size={100}
                className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)] animate-bounce"
              />
              <span className="absolute -top-4 -right-4 text-fuchsia-400 animate-pulse">
                <Sparkles size={32} />
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-serif font-black text-white mb-2 uppercase tracking-[0.4em] text-center">
              SYNCHRONIZED
            </h1>
            <div className="bg-fuchsia-950/40 border border-fuchsia-500/30 px-6 py-2 rounded-full mb-12">
              <p className="text-fuchsia-400 font-mono text-xs tracking-[0.2em] uppercase font-black">
                Protocol_Victor:{" "}
                <span className="text-white ml-2">{victor?.name}</span>
              </p>
            </div>

            <div className="w-full max-w-lg space-y-3 mb-16 overflow-y-auto max-h-[30vh]">
              <h3 className="text-center text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4">
                Unit Summary
              </h3>
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    p.id === victor.id
                      ? "bg-fuchsia-900/30 border-fuchsia-500 shadow-lg shadow-fuchsia-900/20"
                      : "bg-black/40 border-gray-800 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User
                      size={18}
                      className={
                        p.id === victor.id
                          ? "text-fuchsia-400"
                          : "text-gray-600"
                      }
                    />
                    <span
                      className={`font-black text-sm uppercase tracking-wider ${
                        p.id === victor.id
                          ? "text-fuchsia-100"
                          : "text-gray-400"
                      }`}
                    >
                      {p.name}
                    </span>
                    {p.ready && p.id !== gameState.hostId && (
                      <CheckCircle size={14} className="text-green-500 ml-2" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-yellow-400" />
                    <span className="font-mono text-lg font-bold">
                      {p.chips}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 w-full max-w-sm">
              {isHost ? (
                <>
                  {!allGuestsReady && (
                    <div className="flex items-center justify-center gap-2 text-red-400 text-[10px] font-black uppercase tracking-widest animate-pulse mb-2">
                      <Signal size={12} /> Awaiting Signal from Observers...
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={restartGame}
                      disabled={!allGuestsReady}
                      className={`py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl transition-all ${
                        allGuestsReady
                          ? "bg-fuchsia-700 hover:bg-fuchsia-600 text-white shadow-fuchsia-900/20"
                          : "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <RotateCcw size={16} /> Reboot
                    </button>
                    <button
                      onClick={() => {
                        const resetPlayers = gameState.players.map((p) => ({
                          ...p,
                          ready: false,
                        }));
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
                          {
                            status: "lobby",
                            roundCount: 1,
                            roundResult: null,
                            reserve: 0,
                            players: resetPlayers,
                          },
                        );
                        setShowLeaveConfirm(false);
                      }}
                      disabled={!allGuestsReady}
                      className={`py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border transition-all ${
                        allGuestsReady
                          ? "border-fuchsia-600 text-fuchsia-400 hover:bg-fuchsia-900/20"
                          : "border-gray-800 text-gray-600 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <Home size={16} /> Backroom
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={setPlayerReady}
                  disabled={me?.ready}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl transition-all ${
                    me?.ready
                      ? "bg-black/50 border border-green-500 text-green-500 cursor-default"
                      : "bg-fuchsia-700 hover:bg-fuchsia-600 text-white shadow-fuchsia-900/20"
                  }`}
                >
                  {me?.ready ? (
                    <>
                      <CheckCircle size={20} /> Signal_Acquired
                    </>
                  ) : (
                    <>
                      <Signal size={20} /> Transmit_Readiness
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleLeaveRoom}
                className="w-full bg-transparent hover:bg-red-950/20 text-gray-600 hover:text-red-400 py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all"
              >
                Sever_Connection
              </button>
            </div>
          </div>
        )}
        <SpectrumLogo />
      </div>
    );
  }

  return null;
}
