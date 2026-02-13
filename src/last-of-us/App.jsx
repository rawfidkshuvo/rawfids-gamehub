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
  onSnapshot,
  arrayUnion,
  deleteDoc,
} from "firebase/firestore";
import {
  StepBack,
  Skull,
  Syringe,
  Biohazard,
  Pill,
  Crosshair,
  Users,
  Play,
  LogOut,
  RotateCcw,
  CheckCircle,
  X,
  History,
  BookOpen,
  ArrowRight,
  Hammer,
  Crown,
  Ban,
  Activity,
  User,
  Home,
  Sparkles,
  Trash2,
  Copy,
  Loader,
} from "lucide-react";
import CoverImage from "./assets/last_cover.png";

// --- Firebase Config ---
// Using environment config for compatibility with the preview environment
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

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "last-of-us-game";
const GAME_ID = "22";

// --- Constants ---
const CARD_DISTRIBUTION = {
  2: 14,
  3: 12,
  4: 11,
  5: 10,
  6: 9,
};

// --- Helpers ---
const generateDeck = () => {
  const deck = [];
  // Zombies (Odd)
  const zombies = { 1: 2, 3: 4, 5: 6, 7: 8, 9: 6, 11: 4, 13: 2 };
  Object.entries(zombies).forEach(([val, count]) => {
    for (let i = 0; i < count; i++)
      deck.push({ val: parseInt(val), type: "ZOMBIE" });
  });
  // Antidotes (Even)
  const antidotes = { 2: 3, 4: 5, 6: 7, 8: 7, 10: 5, 12: 3 };
  Object.entries(antidotes).forEach(([val, count]) => {
    for (let i = 0; i < count; i++)
      deck.push({ val: parseInt(val), type: "ANTIDOTE" });
  });
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

const Logo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Skull size={12} className="text-red-600" />
    <span className="text-[10px] font-black tracking-widest text-red-600 uppercase">
      LAST OF US
    </span>
  </div>
);

const LogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Skull size={22} className="text-red-600" />
    <span className="text-[20px] font-black tracking-widest text-red-600 uppercase">
      LAST OF US
    </span>
  </div>
);

// --- Components ---

const DICE_ICONS = {
  1: Biohazard,
  2: Pill,
  3: Crosshair,
  4: Skull,
  5: Syringe,
};

const FloatingBackground = ({ isShaking }) => (
  <div
    className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${
      isShaking ? "animate-shake bg-red-900/20" : ""
    }`}
  >
    {/* Background Gradient */}
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900/40 via-gray-950 to-black" />

    <div className="absolute top-0 left-0 w-full h-full opacity-10">
      {[...Array(20)].map((_, i) => {
        // --- CHANGE START ---
        const diceKeys = Object.keys(DICE_ICONS);
        // We cycle through keys 1-6 based on the index
        const key = diceKeys[i % diceKeys.length];
        // Direct assignment because DICE_ICONS values are the components themselves
        const Icon = DICE_ICONS[key];
        // --- CHANGE END ---

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

const Card = ({
  val,
  type,
  count = 1,
  size = "md",
  selected = false,
  onClick,
  disabled = false,
  faded = false,
  isBoard = false,
}) => {
  const isZ = type === "ZOMBIE";

  let bgClass = "";
  if (isBoard) {
    bgClass = isZ
      ? "bg-red-900 border-red-600 shadow-red-900/40"
      : "bg-lime-900 border-lime-500 shadow-lime-900/40";
  } else {
    bgClass = isZ
      ? "bg-linear-to-b from-red-800 to-stone-900 border-red-600"
      : "bg-linear-to-b from-lime-700 to-stone-900 border-lime-500";
  }

  const textClass = isZ ? "text-red-100" : "text-lime-100";
  const iconColor = isZ ? "text-red-500/30" : "text-lime-400/30";

  // Increased icon sizes for better visibility
  const iconSize = size === "lg" ? 64 : size === "md" ? 48 : 24;

  const sizeClasses =
    size === "lg"
      ? "w-20 h-32 md:w-28 md:h-40 text-3xl md:text-5xl"
      : size === "sm"
        ? "w-10 h-14 text-xs"
        : "w-16 h-24 md:w-20 md:h-28 text-xl md:text-2xl";

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        ${sizeClasses} rounded-xl border-2 flex flex-col items-center justify-center shadow-xl relative overflow-hidden transition-all duration-200 shrink-0
        ${bgClass}
        ${
          selected ? "ring-4 ring-yellow-400 -translate-y-4 z-20 scale-110" : ""
        }
        ${
          disabled
            ? faded
              ? "opacity-40 grayscale"
              : "cursor-default"
            : "cursor-pointer hover:scale-105"
        }
        ${!disabled && !selected ? "hover:-translate-y-1" : ""}
      `}
    >
      <div
        className={`absolute top-1 left-2 font-black opacity-70 text-[10px] ${textClass}`}
      >
        {isZ ? "ZMB" : "ANT"}
      </div>
      <div className={`font-black ${textClass} z-10`}>{val}</div>

      {/* Icon positioning and sizing tweak */}
      {isZ ? (
        <div className={`absolute -bottom-2 -right-2 ${iconColor}`}>
          <Skull size={iconSize} strokeWidth={2.5} />
        </div>
      ) : (
        <div className={`absolute -bottom-2 -right-2 ${iconColor}`}>
          <Syringe size={iconSize} strokeWidth={2.5} />
        </div>
      )}

      {count > 1 && (
        <div className="absolute top-[-5px] right-[-5px] bg-yellow-500 text-black font-bold rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md border border-yellow-600 z-20">
          x{count}
        </div>
      )}
    </div>
  );
};

// --- Modals ---

const LeaveConfirmModal = ({
  onConfirmLeave,
  onConfirmLobby,
  onCancel,
  isHost,
  inGame,
}) => (
  <div className="fixed inset-0 bg-black/90 z-200 flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-stone-900 rounded-xl border border-red-900/50 p-6 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
      <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
        <Biohazard className="text-red-500" /> Abandon Zone?
      </h3>
      <p className="text-gray-400 mb-6 text-sm">
        {isHost
          ? "WARNING: As Host, leaving will disband the group and return everyone to the menu."
          : inGame
            ? "Leaving now will disrupt the survival effort."
            : "Disconnect from the safe house?"}
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onCancel}
          className="bg-gray-800 hover:bg-gray-700 text-white py-3 rounded font-bold transition-colors"
        >
          Stay (Cancel)
        </button>
        {isHost && inGame && (
          <button
            onClick={onConfirmLobby}
            className="py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 text-white shadow-lg"
          >
            <Home size={18} /> Return Group to Lobby
          </button>
        )}
        <button
          onClick={onConfirmLeave}
          className="bg-red-700 hover:bg-red-600 text-white py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          <LogOut size={18} /> {isHost ? "Disband Group" : "Leave Game"}
        </button>
      </div>
    </div>
  </div>
);

const GameGuideModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-150 flex items-center justify-center p-4">
    <div className="bg-stone-900 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-red-900/30 flex flex-col">
      <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black/50">
        <h2 className="text-2xl font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
          <Skull /> Survival Guide
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full text-gray-400"
        >
          <X />
        </button>
      </div>
      <div className="p-6 overflow-y-auto space-y-6 text-gray-300 text-left">
        <section>
          <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
            <Biohazard className="text-green-500" size={20} /> The Basics
          </h3>
          <p className="text-sm">
            Get rid of your cards. Be the last survivor. <br /> Odd cards are{" "}
            <strong>Zombies</strong>. Even cards are <strong>Antidotes</strong>.
          </p>
        </section>
        <section>
          <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
            <ArrowRight className="text-blue-400" size={20} /> Placement Rules
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              Cards on the board are arranged in{" "}
              <strong>Ascending Order</strong>.
            </li>
            <li>
              You can play cards <strong>Lower</strong> than the minimum or{" "}
              <strong>Higher</strong> than the maximum.
            </li>
            <li>You CANNOT play inside the cage (between min and max).</li>
            <li>
              <strong>The Twist:</strong> Two cards of the same type
              (Zombie/Zombie or Antidote/Antidote) CANNOT sit next to each other
              horizontally.
            </li>
            <li>You CAN stack a matching card on top of an existing one.</li>
          </ul>
        </section>
        <section>
          <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
            <Users className="text-yellow-400" size={20} /> Multi-Play &
            Quarantine
          </h3>
          <p className="text-sm mb-2">
            If you play on the edges, you must play <strong>at least</strong> as
            many cards as are currently on that edge stack. If you stack on top,
            just follow the same rule.
          </p>
          <p className="text-sm border-l-4 border-red-600 pl-3 py-1 bg-red-900/10">
            <strong>Stuck?</strong> Select <strong>QUARANTINE</strong> mode,
            then click a card on the board to take it as a penalty. You are out
            for the round.
          </p>
        </section>
      </div>
      <div className="p-4 bg-black/50 border-t border-gray-800 text-center">
        <button
          onClick={onClose}
          className="bg-red-700 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-bold"
        >
          Survive
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
    const saved = localStorage.getItem("lastofus_roomId");
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
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-red-500/50">
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
            className="group relative px-12 py-5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 hover:border-red-400 text-red-300 font-black text-2xl tracking-widest rounded-none transform transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] backdrop-blur-md overflow-hidden"
          >
            {/* Animated Scanline overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-400/10 to-transparent translate-y-[-100%] animate-[scan_2s_infinite_linear]" />

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
        Inspired by I'm Out. A tribute game.
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

export default function LastOfUs() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("splash");

  const [roomId, setRoomId] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]); // Stores INDICES of selected cards
  const [isQuarantineMode, setIsQuarantineMode] = useState(false); // New state for selection mode
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

  // Helper for auto-dismissing errors
  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  // --- Auth ---
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
    const savedRoomId = localStorage.getItem("lastofus_roomId");

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

  // --- Restore Session ---
  // useEffect(() => {
  //   // Check if there is a saved room ID in local storage
  //   const savedRoomId = localStorage.getItem("lastofus_roomId");
  //   if (savedRoomId) {
  //     setRoomId(savedRoomId);
  //     // We don't set view yet, onSnapshot will handle that if the room is valid
  //   }
  // }, []);

  // --- Maintenance Check ---
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists() && doc.data()[GAME_ID]?.maintenance) {
        setIsMaintenance(true);
      } else {
        setIsMaintenance(false);
      }
    });
    return () => unsub();
  }, []);

  // --- Game Sync ---
  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();

          // Check if I am still in the player list
          if (data.players && !data.players.find((p) => p.id === user.uid)) {
            setRoomId("");
            setView("menu");
            localStorage.removeItem("lastofus_roomId"); // Clear storage if kicked
            showError("You have been kicked from the safe house.");
            return;
          }

          setGameState(data);
          if (data.status === "playing" || data.status === "finished")
            setView("game");
          else if (data.status === "lobby") setView("lobby");

          // FIX: Ensure data.players exists and turnIndex is valid before accessing
          if (
            data.turnIndex !== undefined &&
            data.players &&
            data.players[data.turnIndex] &&
            user
          ) {
            const isMyTurn = data.players[data.turnIndex].id === user.uid;
            if (!isMyTurn) setIsQuarantineMode(false);
          }
        } else {
          // Room deleted or invalid
          setRoomId("");
          setView("menu");
          localStorage.removeItem("lastofus_roomId"); // Clear storage if room closed
          showError("Safe house compromised (Room closed).");
        }
      },
    );
    return () => unsub();
  }, [roomId, user]);

  // --- Logic Helpers ---

  const validatePlay = (cardsToPlay, board) => {
    if (cardsToPlay.length === 0) return { valid: false, msg: "Select cards." };

    // Check if all selected cards are same value
    const val = cardsToPlay[0].val;
    const type = cardsToPlay[0].type;
    const count = cardsToPlay.length;
    if (!cardsToPlay.every((c) => c.val === val))
      return { valid: false, msg: "Must play identical cards." };

    if (board.length === 0) return { valid: true };

    const minCard = board[0];
    const maxCard = board[board.length - 1];

    // Case 1: Stacking
    const matchIndex = board.findIndex((c) => c.val === val);
    if (matchIndex !== -1) {
      // Logic for Stacking:
      // You can ONLY stack on the Edges (Min or Max). Stacking in the middle is forbidden ("never in the middle").
      const isEdge = matchIndex === 0 || matchIndex === board.length - 1;

      if (!isEdge) {
        return {
          valid: false,
          msg: "Cannot play inside the cage (even to stack).",
        };
      }

      // Logic for Stacking on Edges (Count Rule):
      // If playing on the edge, "same or higher number of cards" rule applies.
      const targetStack = board[matchIndex];
      if (count < targetStack.count) {
        return {
          valid: false,
          msg: `Must play at least ${targetStack.count} cards to stack on this edge.`,
        };
      }

      return { valid: true, action: "STACK", index: matchIndex };
    }

    // Case 2: Playing Outside
    if (val > minCard.val && val < maxCard.val) {
      return { valid: false, msg: "Cannot play inside the cage." };
    }

    // Check Adjacency Rule (Zombie/Zombie or Antidote/Antidote)
    if (val < minCard.val) {
      // Playing Left
      if (type === minCard.type)
        return {
          valid: false,
          msg: `Cannot place ${type} next to ${minCard.type}.`,
        };
      // Count check: Must play >= minCard.count
      if (count < minCard.count)
        return {
          valid: false,
          msg: `Must play at least ${minCard.count} cards here (matches edge stack).`,
        };

      return { valid: true, action: "LEFT" };
    } else if (val > maxCard.val) {
      // Playing Right
      if (type === maxCard.type)
        return {
          valid: false,
          msg: `Cannot place ${type} next to ${maxCard.type}.`,
        };
      // Count check: Must play >= maxCard.count
      if (count < maxCard.count)
        return {
          valid: false,
          msg: `Must play at least ${maxCard.count} cards here (matches edge stack).`,
        };

      return { valid: true, action: "RIGHT" };
    }

    return { valid: false, msg: "Invalid move." };
  };

  // --- Actions ---

  const createRoom = async () => {
    if (!playerName) return showError("Name required");
    setLoading(true);
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
            hand: [],
            quarantined: false,
            ready: false,
          },
        ],
        board: [],
        deck: [],
        turnIndex: 0,
        activeRoundPlayers: [], // IDs of players still in round
        logs: [],
        winner: null,
      },
    );
    // Persist Session
    localStorage.setItem("lastofus_roomId", newId);
    setRoomId(newId);
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCodeInput || !playerName) return showError("Details required");
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
      showError("Room not found");
      setLoading(false);
      return;
    }

    const data = snap.data();
    if (data.status !== "lobby") {
      showError("Game in progress");
      setLoading(false);
      return;
    }
    if (data.players.length >= 6) {
      showError("Room full");
      setLoading(false);
      return;
    }

    if (!data.players.find((p) => p.id === user.uid)) {
      await updateDoc(ref, {
        players: arrayUnion({
          id: user.uid,
          name: playerName,
          hand: [],
          quarantined: false,
          ready: false,
        }),
      });
    }
    // Persist Session
    localStorage.setItem("lastofus_roomId", roomCodeInput);
    setRoomId(roomCodeInput);
    setLoading(false);
  };

  const kickPlayer = async (pid) => {
    if (gameState.hostId !== user.uid) return;
    const players = gameState.players.filter((p) => p.id !== pid);
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players,
      },
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

  const startGame = async () => {
    if (gameState.hostId !== user.uid) return;
    const pCount = gameState.players.length;

    // Distribute cards
    const fullDeck = shuffle(generateDeck());
    const handSize = CARD_DISTRIBUTION[pCount] || 10;

    const players = gameState.players.map((p) => {
      const hand = fullDeck.splice(0, handSize).sort((a, b) => a.val - b.val);
      return { ...p, hand, quarantined: false, ready: false }; // Reset ready
    });

    const activeRoundPlayers = players.map((p) => p.id); // All players start in round

    // 2. Calculate Random Start Index
    const randomStartIndex = Math.floor(Math.random() * players.length);

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        players,
        deck: fullDeck, // Remaining cards (unused this game)
        board: [],
        activeRoundPlayers,
        turnIndex: randomStartIndex,
        logs: [{ text: "Survival begins. Good luck.", type: "neutral" }],
      },
    );
  };

  const restartGame = async () => {
    if (gameState.hostId !== user.uid) return;
    await startGame(); // Re-use start game logic to deal new cards
  };

  const returnToLobby = async () => {
    if (gameState.hostId !== user.uid) return;
    const players = gameState.players.map((p) => ({
      ...p,
      hand: [],
      quarantined: false,
      ready: false,
    }));

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        players,
        board: [],
        logs: [],
        activeRoundPlayers: [],
      },
    );
    setShowLeaveConfirm(false);
  };

  const toggleReady = async () => {
    if (!roomId || !user) return;
    const updatedPlayers = gameState.players.map((p) =>
      p.id === user.uid ? { ...p, ready: !p.ready } : p,
    );

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players: updatedPlayers },
    );
  };

  const handlePlayCards = async () => {
    const meIdx = gameState.players.findIndex((p) => p.id === user.uid);
    const me = gameState.players[meIdx];

    // FIX: Map selected indices to card objects
    const cardsToPlay = selectedCards.map((idx) => me.hand[idx]);

    // Validation
    const result = validatePlay(cardsToPlay, gameState.board);
    if (!result.valid) {
      showError(result.msg);
      return;
    }

    // Execute Play
    const newBoard = [...gameState.board];
    const cardVal = cardsToPlay[0].val; // Use resolved value
    const cardType = cardsToPlay[0].type;
    const count = cardsToPlay.length;

    // Update Board
    if (result.action === "STACK") {
      newBoard[result.index].count += count;
    } else if (result.action === "LEFT") {
      newBoard.unshift({ val: cardVal, type: cardType, count });
    } else if (result.action === "RIGHT") {
      newBoard.push({ val: cardVal, type: cardType, count });
    } else {
      // First play
      newBoard.push({ val: cardVal, type: cardType, count });
    }

    const updatedPlayers = [...gameState.players];
    // Reconstruct hand to ensure correct removal
    const remainingHand = [];
    let removed = 0;
    for (let c of me.hand) {
      if (c.val === cardVal && removed < count) {
        removed++;
      } else {
        remainingHand.push(c);
      }
    }
    updatedPlayers[meIdx].hand = remainingHand;

    // Check Win (Empty Hand)
    if (remainingHand.length === 0) {
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: updatedPlayers,
          board: newBoard,
          status: "finished",
          winner: me,
          logs: arrayUnion({
            text: `${me.name} survived! Game Over.`,
            type: "success",
          }),
        },
      );
      setSelectedCards([]);
      return;
    }

    // Determine Next Turn
    let nextTurnIdx = (gameState.turnIndex + 1) % updatedPlayers.length;
    let loops = 0;
    while (
      !gameState.activeRoundPlayers.includes(updatedPlayers[nextTurnIdx].id) ||
      updatedPlayers[nextTurnIdx].quarantined
    ) {
      nextTurnIdx = (nextTurnIdx + 1) % updatedPlayers.length;
      loops++;
      if (loops > updatedPlayers.length) break;
    }

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players: updatedPlayers,
        board: newBoard,
        turnIndex: nextTurnIdx,
        logs: arrayUnion({
          text: `${me.name} played ${count}x ${cardVal}.`,
          type: "neutral",
        }),
      },
    );
    setSelectedCards([]);
  };

  // Modified Quarantine Logic - Selection Phase
  const initiateQuarantine = () => {
    setIsQuarantineMode(true);
    // Removed redundant error message here as UI shows prompt
  };

  const handleBoardCardClick = async (cardIndex) => {
    if (!isQuarantineMode) return;

    const meIdx = gameState.players.findIndex((p) => p.id === user.uid);
    const me = gameState.players[meIdx];
    const board = [...gameState.board];

    if (board.length === 0) return;

    // Take specific card selected by index
    const penaltyCardObj = board[cardIndex];
    const penaltyCard = { val: penaltyCardObj.val, type: penaltyCardObj.type };

    // Remove one count from board
    if (penaltyCardObj.count > 1) {
      board[cardIndex].count -= 1;
    } else {
      board.splice(cardIndex, 1);
    }

    // Add to player hand
    const newHand = [...me.hand, penaltyCard].sort((a, b) => a.val - b.val);
    const updatedPlayers = [...gameState.players];
    updatedPlayers[meIdx].hand = newHand;
    updatedPlayers[meIdx].quarantined = true;

    // Remove from active round
    const newActivePlayers = gameState.activeRoundPlayers.filter(
      (id) => id !== user.uid,
    );

    const logs = [
      {
        text: `${me.name} quarantined and took ${penaltyCard.val}.`,
        type: "danger",
      },
    ];

    // Check Round End
    if (newActivePlayers.length === 1) {
      // One survivor remains. They win the round.
      const winnerId = newActivePlayers[0];
      const winner = updatedPlayers.find((p) => p.id === winnerId);
      logs.push({
        text: `${winner.name} won the round! Board cleared.`,
        type: "success",
      });

      const resetPlayers = updatedPlayers.map((p) => ({
        ...p,
        quarantined: false,
      }));

      const winnerIdx = resetPlayers.findIndex((p) => p.id === winnerId);

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: resetPlayers,
          board: [], // Clear board
          activeRoundPlayers: resetPlayers.map((p) => p.id), // All back in
          turnIndex: winnerIdx,
          logs: arrayUnion(...logs),
        },
      );
    } else {
      // Move turn
      let nextTurnIdx = (gameState.turnIndex + 1) % updatedPlayers.length;
      while (
        !newActivePlayers.includes(updatedPlayers[nextTurnIdx].id) ||
        updatedPlayers[nextTurnIdx].quarantined
      ) {
        nextTurnIdx = (nextTurnIdx + 1) % updatedPlayers.length;
      }

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: updatedPlayers,
          board,
          activeRoundPlayers: newActivePlayers,
          turnIndex: nextTurnIdx,
          logs: arrayUnion(...logs),
        },
      );
    }
    setIsQuarantineMode(false);
    setError("");
  };

  const leaveRoom = async () => {
    if (!roomId || !user) return;
    try {
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

        // If Host leaves (at any time), delete room so everyone goes home
        if (isHost) {
          await deleteDoc(roomRef);
        } else {
          // Regular player leaving
          const newPlayers = data.players.filter((p) => p.id !== user.uid);
          let newStatus = data.status;
          let newWinner = data.winner; // Preserve existing winner or undefined

          // If game is in progress and only 1 player remains (the Host usually, or whoever is left)
          // We set status to finished so the remaining player sees the game over screen
          if (data.status === "playing" && newPlayers.length < 2) {
            newStatus = "finished";
            if (newPlayers.length > 0) {
              // The last remaining player wins by default
              newWinner = newPlayers[0];
            }
          }

          const updatePayload = {
            players: newPlayers,
            status: newStatus,
            logs: arrayUnion({ text: `${playerName} fled.`, type: "danger" }),
          };

          // Explicitly set winner if we found one
          if (newWinner) {
            updatePayload.winner = newWinner;
          }

          await updateDoc(roomRef, updatePayload);
        }
      }
    } catch (e) {
      console.error("Error leaving room:", e);
    }

    // Clear local session logic
    localStorage.removeItem("lastofus_roomId");
    setRoomId("");
    setView("menu");
    setGameState(null);
    setShowLeaveConfirm(false);
  };

  const handleCardClick = (card, index) => {
    if (selectedCards.includes(index)) {
      setSelectedCards(selectedCards.filter((i) => i !== index));
    } else {
      if (selectedCards.length > 0) {
        const firstIdx = selectedCards[0];
        const me = gameState.players.find((p) => p.id === user.uid);
        const firstCard = me.hand[firstIdx];
        if (firstCard.val !== card.val) {
          setSelectedCards([index]); // Switch to new value
          return;
        }
      }
      setSelectedCards([...selectedCards, index]);
    }
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
            Zombies are lurking around. Wait for the sunlight to scare them
            away.
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-red-500 animate-pulse">
        Vital boost incoming...
      </div>
    );

  // RECONNECTING STATE
  if (roomId && !gameState && !error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4">
        <FloatingBackground />
        <div className="bg-zinc-900/80 backdrop-blur p-8 rounded-2xl border border-zinc-700 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <Loader size={48} className="text-red-500 animate-spin" />
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
      <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <FloatingBackground />
        {/* --- START OF BACK BUTTON --- */}
        <nav className="absolute top-0 left-0 w-full p-4 z-50">
          <a
            href={import.meta.env.BASE_URL}
            className="flex items-center gap-2 text-red-800 rounded-lg 
			font-bold shadow-md hover:text-red-400 transition-colors w-fit animate-pulse"
          >
            {/* Arrow Icon */}
            <StepBack />
            <span>Back to Gamehub</span>
          </a>
        </nav>
        {/* --- END OF BACK BUTTON --- */}
        <div className="z-10 text-center mb-10">
          <div className="flex justify-center gap-4 mb-4">
            <Skull size={50} className="text-red-600 animate-bounce" />
            <Syringe
              size={50}
              className="text-lime-500 animate-bounce delay-75"
            />
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-linear-to-r from-red-500 to-stone-500 uppercase tracking-tighter">
            Last of Us
          </h1>
          <p className="text-stone-500 tracking-[0.5em] uppercase mt-2 font-bold text-xs md:text-sm">
            Survive the Horde
          </p>
        </div>

        <div className="bg-stone-900/80 backdrop-blur border border-red-900/30 p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 mx-4">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm border border-red-800">
              {error}
            </div>
          )}
          <input
            className="w-full bg-black/50 border border-stone-700 p-3 rounded-xl mb-4 text-white focus:border-red-500 outline-none text-sm"
            placeholder="Survivor Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-red-800 hover:bg-red-700 p-4 rounded-xl font-bold mb-4 flex items-center justify-center gap-2 transition-all shadow-lg text-sm md:text-base"
          >
            <Play size={20} /> New Survival Zone
          </button>
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 bg-black/50 border border-stone-700 p-3 rounded-xl text-white focus:border-red-500 outline-none uppercase text-sm"
              placeholder="CODE"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="bg-stone-700 hover:bg-stone-600 px-6 rounded-xl font-bold transition-all text-sm"
            >
              Join
            </button>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="w-full text-center text-stone-500 hover:text-stone-300 text-sm flex items-center justify-center gap-2"
          >
            <BookOpen size={14} /> Survival Guide
          </button>
        </div>
        {showGuide && <GameGuideModal onClose={() => setShowGuide(false)} />}
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-6 relative">
        <FloatingBackground />
        <LogoBig />
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirmLeave={leaveRoom}
            onConfirmLobby={null}
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={isHost}
            inGame={false}
          />
        )}

        <div className="z-10 w-full max-w-lg bg-stone-900/90 backdrop-blur p-8 rounded-2xl border border-red-900/30 shadow-2xl">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-800">
            <div>
              {/* Grouping Title and Copy Button together on the left */}
              <div>
                <h2 className="text-lg md:text-xl text-red-600 font-bold uppercase">
                  Safe Zone
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
                      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-red-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg animate-fade-in-up whitespace-nowrap">
                        Copied!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 bg-red-900/30 text-red-400 rounded-full hover:bg-red-900/50"
            >
              <LogOut size={20} />
            </button>
          </div>
          <div className="space-y-3 mb-8">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-stone-800"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-stone-800">
                    <User size={18} className="text-stone-400" />
                  </div>
                  <span
                    className={`font-bold ${
                      p.id === user.uid ? "text-red-500" : "text-stone-400"
                    }`}
                  >
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {p.id === gameState.hostId && (
                    <Crown size={16} className="text-yellow-500" />
                  )}
                  {isHost && p.id !== user.uid && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      className="text-stone-600 hover:text-red-500 p-1 transition-colors"
                      title="Kick Player"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {gameState.players.length < 2 && (
              <div className="text-center text-stone-600 py-4 italic">
                Need at least 2 survivors...
              </div>
            )}
          </div>
          {isHost ? (
            <button
              onClick={startGame}
              disabled={gameState.players.length < 2}
              className="w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest bg-red-700 hover:bg-red-600 text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Survival
            </button>
          ) : (
            <div className="w-full py-4 rounded-xl font-bold text-center text-stone-500 bg-stone-800/50 border border-stone-700 animate-pulse">
              Waiting for Host...
            </div>
          )}
        </div>
        <Logo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const me = gameState.players.find((p) => p.id === user.uid);
    if (!me)
      return (
        <div className="min-h-screen bg-stone-950 flex items-center justify-center text-white">
          Loading...
        </div>
      );

    // FIX: Safely access the active player. If turnIndex is out of bounds, activePlayer is undefined.
    const activePlayer = gameState.players[gameState.turnIndex];
    const isMyTurn = activePlayer?.id === user.uid;
    const opponent = gameState.players.filter((p) => p.id !== user.uid);
    const activeLogs = gameState.logs.slice(-2).reverse();

    // Check readiness for next game (excluding host from needing to press ready button, they control the flow)
    const allGuestsReady = gameState.players
      .filter((p) => p.id !== gameState.hostId)
      .every((p) => p.ready);

    return (
      <div className="h-screen bg-stone-950 text-white flex flex-col relative overflow-hidden font-sans">
        <FloatingBackground />
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirmLeave={leaveRoom}
            onConfirmLobby={returnToLobby} // Use returnToLobby instead of resetGame to fully reset state
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={gameState.hostId === user.uid}
            inGame={true}
          />
        )}
        {showGuide && <GameGuideModal onClose={() => setShowGuide(false)} />}

        {/* Header */}
        <div className="h-14 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between px-4 z-160 sticky top-0 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Biohazard className="text-red-600" size={24} />
            <span className="font-black uppercase hidden md:block">
              Last of Us
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGuide(true)}
              className="p-2 text-stone-400 hover:bg-stone-800 rounded-full"
            >
              <BookOpen size={20} />
            </button>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`p-2 rounded-full ${
                showLogs
                  ? "bg-red-900/50 text-red-200"
                  : "text-stone-400 hover:bg-stone-800"
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

        {/* Logs Overlay - Modal */}
        {showLogs && (
          <div className="fixed top-16 right-4 z-155 bg-stone-900/95 border border-stone-700 p-2 rounded-xl max-h-60 overflow-y-auto w-64 shadow-2xl">
            {[...gameState.logs].reverse().map((l, i) => (
              <div
                key={i}
                className={`text-xs p-2 mb-1 rounded border-l-2 ${
                  l.type === "danger"
                    ? "bg-red-900/20 border-red-500 text-red-200"
                    : "bg-stone-800 border-stone-600 text-gray-400"
                }`}
              >
                {l.text}
              </div>
            ))}
          </div>
        )}

        {/* Winner Screen */}
        {gameState.status === "finished" && (
          <div className="fixed inset-0 top-14 z-150 bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in">
            <Crown size={80} className="text-yellow-500 mb-6 animate-bounce" />
            <h1 className="text-5xl font-black text-white mb-4">
              Survivor Found!
            </h1>
            <p className="text-2xl text-stone-300 mb-8">
              {gameState.winner ? gameState.winner.name : "Unknown Survivor"}{" "}
              cleared their hand!
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-md w-full mb-8">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className="bg-stone-800 p-4 rounded-xl flex justify-between items-center border border-stone-700"
                >
                  <div className="flex items-center gap-2">
                    {p.ready && (
                      <CheckCircle size={16} className="text-green-500" />
                    )}
                    <span
                      className={
                        p.id === gameState.winner?.id
                          ? "text-yellow-400 font-bold"
                          : "text-gray-400"
                      }
                    >
                      {p.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 items-center w-full max-w-md">
              {gameState.hostId !== user.uid ? (
                // Guest View
                !me.ready ? (
                  <button
                    onClick={toggleReady}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white shadow-lg animate-pulse transition-all hover:scale-105"
                  >
                    Ready for Next Game
                  </button>
                ) : (
                  <div className="w-full py-3 bg-stone-800 rounded-xl font-bold text-green-400 border border-green-500/50 flex items-center justify-center gap-2">
                    <CheckCircle size={20} /> Waiting for host...
                  </div>
                )
              ) : (
                // Host View
                <div className="flex flex-col w-full gap-3">
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={returnToLobby}
                      disabled={!allGuestsReady}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                        allGuestsReady
                          ? "bg-stone-700 hover:bg-stone-600 text-white hover:scale-105"
                          : "bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700"
                      }`}
                    >
                      <LogOut size={18} /> Lobby
                    </button>
                    <button
                      onClick={restartGame}
                      disabled={!allGuestsReady}
                      className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                        allGuestsReady
                          ? "bg-red-700 hover:bg-red-600 hover:scale-105"
                          : "bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700"
                      }`}
                    >
                      <RotateCcw size={18} /> Restart
                    </button>
                  </div>
                  {!allGuestsReady && (
                    <p className="text-stone-500 text-sm animate-pulse">
                      Waiting for survivors to report in...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Area */}
        <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto p-2 gap-2 overflow-hidden relative">
          {/* Opponents (Top) */}
          <div className="flex-none h-24 md:h-28 flex items-start justify-center gap-2 overflow-x-auto no-scrollbar px-2 py-2">
            {opponent.map((p) => (
              <div
                key={p.id}
                className={`flex flex-col items-center min-w-[80px] md:min-w-[100px] p-2 rounded-xl border ${
                  p.quarantined
                    ? "border-red-900 bg-red-900/20 opacity-50"
                    : "border-stone-700 bg-stone-900/50"
                } ${
                  // FIX: Use optional chaining (?.) here too
                  gameState.players[gameState.turnIndex]?.id === p.id
                    ? "ring-2 ring-yellow-500 animate-pulse"
                    : ""
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  {p.quarantined && <Ban size={12} className="text-red-500" />}
                  <span className="text-xs font-bold truncate max-w-[60px] md:max-w-[70px]">
                    {p.name}
                  </span>
                </div>
                <div className="flex gap-1 overflow-hidden h-8 md:h-12 w-full justify-center">
                  {p.hand.length > 0 ? (
                    <div className="flex -space-x-2">
                      {p.hand.map((_, i) => (
                        <div
                          key={i}
                          className="w-4 md:w-6 h-6 md:h-8 bg-stone-700 rounded border border-stone-600 shadow-sm"
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-green-500">Safe</span>
                  )}
                </div>
                <span className="text-[10px] text-stone-500">
                  {p.hand.length} Cards
                </span>
              </div>
            ))}
          </div>

          {/* Board (Center) */}
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-0 bg-stone-900/30 rounded-2xl border border-stone-800/30 mx-2">
            {/* Center Logs & Errors (Vertically Stacked Flex Container) */}
            <div className="absolute top-4 left-0 right-0 flex flex-col items-center pointer-events-none z-10 w-full space-y-2">
              {!showLogs &&
                activeLogs.map((l, i) => (
                  <div
                    key={i}
                    className={`px-4 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-lg backdrop-blur-md border animate-in fade-in zoom-in duration-300 ${
                      l.type === "danger"
                        ? "bg-red-900/50 border-red-500 text-red-100"
                        : "bg-stone-800/50 border-stone-600 text-stone-300"
                    }`}
                  >
                    {l.text}
                  </div>
                ))}

              {/* Error Message - Now stacked immediately below logs */}
              {error && (
                <div className="px-6 py-2 rounded-full text-sm font-bold bg-red-600 text-white shadow-xl animate-bounce whitespace-nowrap border-4 border-red-800">
                  {error}
                </div>
              )}
            </div>

            {gameState.board.length === 0 ? (
              <div className="text-stone-600 text-sm font-bold border-2 border-dashed border-stone-800 rounded-xl p-8">
                Board Empty
              </div>
            ) : (
              <div className="flex items-center gap-1 md:gap-2 overflow-x-auto p-4 w-full justify-start md:justify-center no-scrollbar h-full">
                {gameState.board.map((card, i) => (
                  <div
                    key={i}
                    className="transform hover:scale-105 transition-transform shrink-0"
                  >
                    <Card
                      val={card.val}
                      type={card.type}
                      count={card.count}
                      size="lg"
                      isBoard={true}
                      disabled={!isQuarantineMode}
                      selected={isQuarantineMode}
                      onClick={() => handleBoardCardClick(i)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Play Actions */}
            {isMyTurn && !me.quarantined && (
              <div className="absolute bottom-4 flex gap-4 z-20">
                {isQuarantineMode ? (
                  <div className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-2">
                    <div className="bg-red-900/80 px-4 py-2 rounded text-red-200 text-sm font-bold border border-red-500 shadow-xl">
                      Tap a card to take penalty
                    </div>
                    <button
                      onClick={() => setIsQuarantineMode(false)}
                      className="px-6 py-2 rounded-xl font-bold bg-gray-700 hover:bg-gray-600 text-gray-200 shadow-lg"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handlePlayCards}
                      disabled={selectedCards.length === 0}
                      className={`px-6 md:px-8 py-3 rounded-xl font-black text-lg md:text-xl shadow-xl flex items-center gap-2 transition-all ${
                        selectedCards.length > 0
                          ? "bg-yellow-500 hover:bg-yellow-400 text-black hover:scale-105"
                          : "bg-stone-800 text-stone-500 cursor-not-allowed"
                      }`}
                    >
                      PLAY{" "}
                      {selectedCards.length > 0 && `(${selectedCards.length})`}
                    </button>
                    <button
                      onClick={initiateQuarantine}
                      className="px-4 md:px-6 py-3 rounded-xl font-bold bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-800 flex items-center gap-2 transition-all"
                    >
                      <Ban size={18} />{" "}
                      <span className="inline">QUARANTINE</span>
                    </button>
                  </>
                )}
              </div>
            )}
            {isMyTurn && me.quarantined && (
              <div className="absolute bottom-4 text-red-500 font-bold animate-pulse bg-black/50 px-4 py-2 rounded-xl">
                You are Quarantined. Skip turn.
              </div>
            )}
            {!isMyTurn && (
              <div className="absolute bottom-4 px-4 py-2 bg-stone-900 rounded-full text-stone-500 text-sm border border-stone-800 animate-pulse">
                Waiting for survivors...
              </div>
            )}
          </div>

          {/* My Hand (Bottom) */}
          <div className="flex-none bg-stone-900/95 p-2 md:p-4 rounded-t-3xl border-t border-red-900/30 shadow-2xl relative z-30 w-full overflow-hidden">
            <div className="flex justify-between items-center mb-2 px-2">
              <span className="text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-widest">
                Inventory ({me.hand.length})
              </span>
              <span className="text-[8px] md:text-[10px] font-bold text-stone-500">
                Match count on edges
              </span>
            </div>
            <div className="flex gap-2 md:gap-4 overflow-x-auto pb-4 pt-2 px-2 no-scrollbar">
              {(() => {
                const renderedGroups = [];
                let currentGroup = [];
                for (let i = 0; i < me.hand.length; i++) {
                  const card = me.hand[i];
                  if (i > 0 && me.hand[i - 1].val !== card.val) {
                    renderedGroups.push(currentGroup);
                    currentGroup = [];
                  }
                  currentGroup.push({ card, index: i });
                }
                if (currentGroup.length > 0) renderedGroups.push(currentGroup);

                return renderedGroups.map((group, gIdx) => (
                  <div
                    key={gIdx}
                    className="flex -space-x-6 md:-space-x-8 hover:space-x-1 transition-all duration-300 pr-4 shrink-0"
                  >
                    {group.map(({ card, index }) => (
                      <div key={index}>
                        <Card
                          val={card.val}
                          type={card.type}
                          size="md"
                          selected={selectedCards.includes(index)}
                          onClick={() => handleCardClick(card, index)}
                        />
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
        <Logo />
      </div>
    );
  }

  return null;
}
