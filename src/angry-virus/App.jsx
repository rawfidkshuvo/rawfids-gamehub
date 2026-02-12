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
  Biohazard,
  Pill,
  Skull,
  Crosshair,
  Trophy,
  User,
  Play,
  LogOut,
  RotateCcw,
  CheckCircle,
  X,
  History,
  BookOpen,
  AlertTriangle,
  ArrowRight,
  Hammer,
  Crown,
  Settings,
  Home,
  Sparkles,
  Trash2,
  FileText, // Added for report icon
  Copy,
  Loader,
  StepBack,
} from "lucide-react";
import CoverImage from "./assets/virus_cover.png";

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

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "angry-virus";
const GAME_ID = "21";

// --- Constants ---
const DECK_START = 3;
const DECK_END = 35; // 33 cards total

// --- Helpers ---
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

// Calculate score with the "Consecutive Sequence" twist
const calculateScore = (cards, tokens) => {
  if (!cards || cards.length === 0) return -tokens;

  // Sort cards numerically
  const sorted = [...cards].sort((a, b) => a - b);
  let score = 0;

  for (let i = 0; i < sorted.length; i++) {
    // If it's the first card, or not consecutive to the previous one, add it
    if (i === 0 || sorted[i] !== sorted[i - 1] + 1) {
      score += sorted[i];
    }
    // If it IS consecutive (e.g. 22 after 21), we essentially "skip" adding it
  }

  return score - tokens;
};

// Helper to group consecutive cards for display
const groupConsecutiveCards = (cards) => {
  if (!cards || cards.length === 0) return [];
  const sorted = [...cards].sort((a, b) => a - b);
  const groups = [];
  let currentGroup = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      currentGroup.push(sorted[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }
  groups.push(currentGroup);
  return groups;
};

// --- Components ---

const Logo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Biohazard size={12} className="text-green-500" />
    <span className="text-[10px] font-black tracking-widest text-green-500 uppercase">
      ANGRY VIRUS
    </span>
  </div>
);

const LogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Biohazard size={22} className="text-green-500" />
    <span className="text-[20px] font-black tracking-widest text-green-500 uppercase">
      ANGRY VIRUS
    </span>
  </div>
);

const DICE_ICONS = {
  1: Biohazard,
  2: Pill,
  3: Crosshair,
  4: Skull,
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
  value,
  size = "md",
  isNew = false,
  isSequenceStart = false,
}) => {
  const sizeClasses =
    size === "lg"
      ? "w-24 h-36 md:w-32 md:h-48 text-3xl md:text-4xl"
      : size === "md"
        ? "w-16 h-24 md:w-20 md:h-28 text-xl md:text-2xl"
        : "w-10 h-14 md:w-12 md:h-16 text-xs md:text-sm";

  return (
    <div
      className={`${sizeClasses} bg-gray-200 rounded-xl border-4 ${
        isSequenceStart
          ? "border-yellow-500 ring-2 ring-yellow-500/50 z-10"
          : "border-green-700"
      } flex flex-col items-center justify-center shadow-xl relative overflow-hidden transform transition-all ${
        isNew ? "animate-in zoom-in duration-500" : ""
      }`}
    >
      <div className="absolute top-1 left-2 text-green-800 font-black opacity-50 text-[8px] md:text-[10px]">
        VIRUS
      </div>
      <div className="font-black text-green-900 z-10">{value}</div>
      <Biohazard className="absolute -bottom-4 -right-4 text-green-800/10 w-3/4 h-3/4" />
      <div className="absolute inset-0 bg-linear-to-br from-white/0 to-green-500/10" />
    </div>
  );
};

const TokenDisplay = ({ count, size = "md" }) => (
  <div
    className={`flex items-center gap-1 bg-orange-600/90 text-white rounded-full font-bold shadow-lg border border-orange-400 ${
      size === "lg"
        ? "px-3 py-1.5 md:px-4 md:py-2 text-lg md:text-xl"
        : "px-2 py-1 text-[10px] md:text-xs"
    }`}
  >
    <Pill
      className={size === "lg" ? "w-5 h-5 md:w-6 md:h-6" : "w-3 h-3"}
      fill="currentColor"
    />
    <span>{count}</span>
  </div>
);

// --- New Component: Round Summary Modal ---
const RoundSummaryModal = ({ players, onClose }) => {
  // Sort players by score (lowest wins)
  const sortedPlayers = [...players].sort(
    (a, b) =>
      calculateScore(a.cards, a.tokens) - calculateScore(b.cards, b.tokens),
  );

  return (
    <div className="fixed inset-0 bg-black/95 z-170 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-gray-900 w-full max-w-3xl rounded-2xl border border-gray-700 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-gray-950 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="text-green-500" /> Viral Report
            </h2>
            <p className="text-gray-500 text-xs mt-1">
              Detailed breakdown of collected specimens
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {sortedPlayers.map((player, idx) => {
            const score = calculateScore(player.cards, player.tokens);
            const groups = groupConsecutiveCards(player.cards);

            return (
              <div
                key={player.id}
                className={`rounded-xl p-4 border ${
                  idx === 0
                    ? "bg-green-900/10 border-green-500/50"
                    : "bg-gray-800/40 border-gray-700"
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gray-500 font-bold">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-lg text-white">
                      {player.name}
                    </span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-green-500 text-black font-bold uppercase">
                        Cleanest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-orange-400 text-sm">
                      <Pill size={14} /> -{player.tokens} pts
                    </div>
                    <div className="text-xl font-black text-white">
                      {score} <span className="text-xs text-gray-500">PTS</span>
                    </div>
                  </div>
                </div>

                {/* Cards Visualization */}
                <div className="flex flex-wrap gap-2">
                  {groups.length === 0 ? (
                    <span className="text-xs text-gray-500 italic">
                      No viruses collected (Incredible!)
                    </span>
                  ) : (
                    groups.map((group, gIdx) => (
                      <div
                        key={gIdx}
                        className="flex items-center p-1 bg-black/30 rounded border border-gray-700/50"
                      >
                        {group.map((card, cIdx) => (
                          <div
                            key={card}
                            className={`w-8 h-10 flex items-center justify-center text-xs font-bold rounded mr-1 last:mr-0 ${
                              cIdx === 0
                                ? "bg-gray-200 text-red-900 border-2 border-red-500/50 z-10 scale-110 shadow-lg"
                                : "bg-gray-700 text-gray-400 border border-gray-600 opacity-60 scale-90"
                            }`}
                            title={
                              cIdx === 0
                                ? "Active Virus (Points Counted)"
                                : "Contained Virus (Points Ignored)"
                            }
                          >
                            {card}
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950 flex justify-end">
          <button
            onClick={onClose}
            className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105"
          >
            Proceed to Final Results <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const GameGuideModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-150 flex items-center justify-center p-4">
    <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-green-500/30 flex flex-col">
      <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950">
        <h2 className="text-2xl font-black text-green-500 uppercase tracking-widest flex items-center gap-2">
          <Biohazard /> Virus Protocol
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full text-gray-400"
        >
          <X />
        </button>
      </div>
      <div className="p-6 overflow-y-auto space-y-6 text-gray-300">
        <section>
          <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
            <Skull className="text-red-500" size={20} /> Goal: Stay Healthy
          </h3>
          <p className="text-sm">
            Avoid collecting high-value Virus cards. Your score is the sum of
            your viruses minus your vitamins.{" "}
            <strong>Lowest score wins!</strong>
          </p>
        </section>

        <section>
          <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
            <RotateCcw className="text-blue-400" size={20} /> The Choice
          </h3>
          <p className="text-sm mb-2">
            On your turn, a Virus card is revealed. You have two options:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              <strong>Pass:</strong> Place 1 Vitamin token on the card to skip
              it. Pass play to the left. (Requires tokens!)
            </li>
            <li>
              <strong>Take:</strong> Take the card AND all tokens on it. Reveal
              the next card. It is still your turn.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
            <Trophy className="text-yellow-400" size={20} /> The Twist
          </h3>
          <p className="text-sm">
            Collected viruses form chains! If you have consecutive numbers
            (e.g., 21, 22, 23), <strong>only the lowest number counts</strong>{" "}
            towards your score.
            <br />
            <span className="text-gray-500 text-xs italic">
              Example: 21, 22, 23 counts as just 21 points.
            </span>
          </p>
        </section>
      </div>
      <div className="p-4 bg-gray-950 border-t border-gray-800 text-center">
        <button
          onClick={onClose}
          className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold"
        >
          Understood
        </button>
      </div>
    </div>
  </div>
);

// Updated Leave Modal with proper Host/Guest logic
const LeaveConfirmModal = ({
  onConfirmLeave,
  onConfirmLobby,
  onCancel,
  isHost,
  inGame,
}) => (
  <div className="fixed inset-0 bg-black/90 z-200 flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2">Abandon Quarantine?</h3>
      <p className="text-gray-400 mb-6 text-sm">
        {isHost
          ? "WARNING: As Host, leaving will disband the group and return everyone to the menu."
          : inGame
            ? "Leaving now will impact the game for others."
            : "Leaving the lobby will disconnect you."}
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-bold transition-colors"
        >
          Stay (Cancel)
        </button>
        {isHost && inGame && (
          <button
            onClick={onConfirmLobby}
            className="py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Home size={18} /> Return Crew to Lobby
          </button>
        )}
        <button
          onClick={onConfirmLeave}
          className="bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> {isHost ? "Disband Group" : "Leave Game"}
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
    const saved = localStorage.getItem("angryvirus_roomId");
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
            showButton
              ? "translate-y-0 opacity-100"
              : "translate-y-20 opacity-0"
          }`}
        >
          <button
            onClick={onStart}
            className="group relative px-12 py-5 bg-green-600/20 hover:bg-green-600/40 border border-green-500/50 hover:border-green-400 text-green-300 font-black text-2xl tracking-widest rounded-none transform transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] backdrop-blur-md overflow-hidden"
          >
            {/* Animated Scanline overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/10 to-transparent translate-y-[-100%] animate-[scan_2s_infinite_linear]" />

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

export default function AngryVirus() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("splash"); // menu, lobby, game
  const [roomId, setRoomId] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  // NEW: State for the report modal
  const [showReport, setShowReport] = useState(false);
  //read and fill global name
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem("gameHub_playerName") || "",
  );
  //set global name for all game
  useEffect(() => {
    if (playerName) localStorage.setItem("gameHub_playerName", playerName);
  }, [playerName]);
  // --- Auth & Config ---
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
    const savedRoomId = localStorage.getItem("angryvirus_roomId");

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

  //--- Session Restore ---
  // useEffect(() => {
  //   const savedRoomId = localStorage.getItem("angryvirus_roomId");
  //   if (savedRoomId) {
  //     setRoomId(savedRoomId);
  //   }
  // }, []);

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

  // --- Room Sync ---
  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setGameState(data);

          // Check if user was kicked
          if (data.players && !data.players.find((p) => p.id === user.uid)) {
            setRoomId("");
            setView("menu");
            localStorage.removeItem("angryvirus_roomId");
            setError("You have been removed from the quarantine zone.");
            return;
          }

          if (data.status === "playing" || data.status === "finished")
            setView("game");
          else if (data.status === "lobby") setView("lobby");
        } else {
          // Room deleted
          setRoomId("");
          setView("menu");
          localStorage.removeItem("angryvirus_roomId");
          setError("Quarantine zone lifted (Room closed).");
        }
      },
    );
    return () => unsub();
  }, [roomId, user]);

  // --- NEW: Trigger Report on Finish ---
  useEffect(() => {
    if (gameState?.status === "finished") {
      setShowReport(true);
    } else {
      setShowReport(false);
    }
  }, [gameState?.status]);

  // --- Logic ---

  const createRoom = async () => {
    if (!playerName) return setError("Name required");
    setLoading(true);
    const chars = "123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";
    let newRoomId = "";
    for (let i = 0; i < 6; i++) {
      newRoomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Create Deck 3 to 35
    const deck = Array.from({ length: 33 }, (_, i) => i + 3);

    await setDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", newRoomId),
      {
        roomId: newRoomId,
        hostId: user.uid,
        status: "lobby",
        players: [
          {
            id: user.uid,
            name: playerName,
            tokens: 0,
            cards: [],
            ready: false,
          },
        ],
        deck: [], // Empty until start
        cardsToRemove: 5,
        currentCard: null,
        tokensOnCard: 0,
        turnIndex: 0,
        logs: [],
        winnerId: null,
      },
    );
    localStorage.setItem("angryvirus_roomId", newRoomId);
    setRoomId(newRoomId);
    setLoading(false);
  };

  const updateCardsToRemove = async (count) => {
    if (gameState.hostId !== user.uid) return;
    if (count < 5 || count > 9) return;
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        cardsToRemove: count,
      },
    );
  };

  const joinRoom = async () => {
    if (!roomCodeInput || !playerName) return setError("Code/Name required");
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
      setError("Outbreak already started");
      setLoading(false);
      return;
    }
    if (data.players.length >= 7) {
      setError("Room full");
      setLoading(false);
      return;
    }

    if (!data.players.find((p) => p.id === user.uid)) {
      await updateDoc(ref, {
        players: arrayUnion({
          id: user.uid,
          name: playerName,
          tokens: 0,
          cards: [],
          ready: false,
        }),
      });
    }
    localStorage.setItem("angryvirus_roomId", roomCodeInput);
    setRoomId(roomCodeInput);
    setLoading(false);
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

        if (isHost) {
          await deleteDoc(roomRef);
        } else {
          const leavingPlayerIndex = data.players.findIndex(
            (p) => p.id === user.uid,
          );
          const newPlayers = data.players.filter((p) => p.id !== user.uid);
          let newStatus = data.status;

          let newTurnIndex = data.turnIndex;
          if (leavingPlayerIndex < newTurnIndex) {
            newTurnIndex = Math.max(0, newTurnIndex - 1);
          }
          if (newTurnIndex >= newPlayers.length) {
            newTurnIndex = 0;
          }

          if (data.status === "playing" && newPlayers.length < 2) {
            newStatus = "finished";
          }

          await updateDoc(roomRef, {
            players: newPlayers,
            status: newStatus,
            turnIndex: newTurnIndex,
            logs: arrayUnion({
              text: `${playerName} abandoned the quarantine.`,
              type: "danger",
            }),
          });
        }
      }
    } catch (e) {
      console.error("Error leaving room:", e);
    }

    localStorage.removeItem("angryvirus_roomId");
    setRoomId("");
    setView("menu");
    setGameState(null);
    setShowLeaveConfirm(false);
    setShowReport(false);
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
    if (pCount < 2) return;

    let initialTokens = 11;
    if (pCount === 6) initialTokens = 9;
    if (pCount === 7) initialTokens = 7;

    let fullDeck = shuffle(Array.from({ length: 33 }, (_, i) => i + 3));
    const removeCount = gameState.cardsToRemove || 5;
    fullDeck = fullDeck.slice(0, fullDeck.length - removeCount);

    const firstCard = fullDeck.pop();

    const players = gameState.players.map((p) => ({
      ...p,
      tokens: initialTokens,
      cards: [],
      ready: false,
    }));
    const randStart = Math.floor(Math.random() * pCount);

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        players,
        deck: fullDeck,
        currentCard: firstCard,
        tokensOnCard: 0,
        turnIndex: randStart,
        logs: [
          {
            text: `The Outbreak Begins! (${removeCount} cards removed hiddenly)`,
            type: "neutral",
          },
        ],
      },
    );
  };

  const takeAction = async (action) => {
    const players = [...gameState.players];
    const playerIdx = gameState.turnIndex;
    const player = players[playerIdx];
    let deck = [...gameState.deck];
    let currentCard = gameState.currentCard;
    let tokensOnCard = gameState.tokensOnCard;
    let nextTurnIndex = gameState.turnIndex;
    let logs = [];
    let status = "playing";
    let winnerId = null;

    if (action === "PASS") {
      if (player.tokens <= 0) return;

      player.tokens -= 1;
      tokensOnCard += 1;
      nextTurnIndex = (nextTurnIndex + 1) % players.length;

      logs.push({
        text: `${player.name} passed (-1 Vitamin).`,
        type: "neutral",
      });
    } else if (action === "TAKE") {
      player.cards.push(currentCard);
      player.cards.sort((a, b) => a - b);
      player.tokens += tokensOnCard;

      logs.push({
        text: `${player.name} took Virus ${currentCard} and ${tokensOnCard} Vitamins!`,
        type: "warning",
      });

      if (deck.length > 0) {
        currentCard = deck.pop();
        tokensOnCard = 0;
      } else {
        status = "finished";
        currentCard = null;
        tokensOnCard = 0;

        const scores = players.map((p) => ({
          id: p.id,
          score: calculateScore(p.cards, p.tokens),
        }));
        scores.sort((a, b) => a.score - b.score);
        winnerId = scores[0].id;

        logs.push({
          text: "All viruses contained. Game Over!",
          type: "success",
        });
      }
    }

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players,
        deck,
        currentCard,
        tokensOnCard,
        turnIndex: nextTurnIndex,
        status,
        winnerId,
        logs: arrayUnion(...logs),
      },
    );
  };

  const returnToLobby = async () => {
    if (gameState.hostId !== user.uid) return;
    const players = gameState.players.map((p) => ({
      ...p,
      cards: [],
      tokens: 0,
      ready: false,
    }));
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        players,
        deck: [],
        currentCard: null,
        winnerId: null,
        logs: [],
      },
    );
    setShowLeaveConfirm(false);
    setShowReport(false);
  };

  const restartGame = async () => {
    if (gameState.hostId !== user.uid) return;
    await startGame();
    setShowReport(false);
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
            Quarantine in effect. Stay safe until the last traces of virus in
            eradicated.
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
        <Logo />
      </div>
    );
  }

  if (!user)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-green-500 animate-pulse">
        Spreading infection...
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

  if (view === "splash") {
    return <SplashScreen onStart={handleSplashStart} />;
  }

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <FloatingBackground />
        {/* --- START OF BACK BUTTON --- */}
        <nav className="absolute top-0 left-0 w-full p-4 z-50">
          <a
            href={import.meta.env.BASE_URL}
            className="flex items-center gap-2 text-green-800 rounded-lg font-bold shadow-md hover:text-green-400 transition-colors w-fit animate-pulse"
          >
            {/* Arrow Icon */}
            <StepBack />
            <span>Back to Gamehub</span>
          </a>
        </nav>
        {/* --- END OF BACK BUTTON --- */}
        <div className="z-10 text-center mb-10">
          <Biohazard
            size={64}
            className="text-green-500 mx-auto mb-4 animate-bounce md:w-20 md:h-20"
          />
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-linear-to-br from-green-400 to-lime-600 uppercase tracking-tighter">
            Angry Virus
          </h1>
          <p className="text-white-400/60 tracking-[0.3em] uppercase mt-2">
            Infectious Strategy
          </p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur border border-green-500/30 p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 mx-4">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm border border-red-800">
              {error}
            </div>
          )}

          <input
            className="w-full bg-black/50 border border-gray-600 p-3 rounded-xl mb-4 text-white focus:border-green-500 outline-none text-sm md:text-base"
            placeholder="Survivor Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-600 p-3 md:p-4 rounded-xl font-bold mb-4 flex items-center justify-center gap-2 transition-all text-sm md:text-base"
          >
            <Biohazard size={20} /> Start Outbreak
          </button>

          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <input
              className="flex-1 bg-black/50 border border-gray-600 p-3 rounded-xl text-white focus:border-green-500 outline-none text-sm md:text-base"
              placeholder="ROOM CODE"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 px-6 py-3 rounded-xl font-bold transition-all text-sm md:text-base"
            >
              Join
            </button>
          </div>

          <button
            onClick={() => setShowGuide(true)}
            className="w-full text-center text-gray-400 hover:text-white text-xs md:text-sm flex items-center justify-center gap-2 py-2"
          >
            <BookOpen size={14} /> Survival Guide
          </button>
        </div>
        {showGuide && <GameGuideModal onClose={() => setShowGuide(false)} />}
        <div className="absolute bottom-4 text-slate-600 text-xs text-center">
          Inspired by No Thanks. A tribute game.
          <br />
          Developed by <strong>RAWFID K SHUVO</strong>. Visit{" "}
          <a
            href={import.meta.env.BASE_URL}
            //target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 underline hover:text-green-600"
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
    const cardsToRemove = gameState.cardsToRemove || 5;

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 md:p-6 relative">
        <FloatingBackground />
        <LogoBig />

        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirmLeave={leaveRoom}
            onConfirmLobby={returnToLobby}
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={isHost}
            inGame={false}
          />
        )}

        <div className="z-10 w-full max-w-lg bg-gray-900/90 backdrop-blur p-6 md:p-8 rounded-2xl border border-green-500/30 shadow-2xl">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
            <div>
              <h2 className="text-lg md:text-xl text-green-500 font-bold uppercase">
                Quarantine Zone
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
              className="p-2 bg-red-900/30 text-red-400 rounded-full hover:bg-red-900/50"
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
                  <div className="p-2 rounded-full bg-gray-800">
                    <User size={18} className="text-green-400" />
                  </div>
                  <span
                    className={`font-bold ${
                      p.id === user.uid ? "text-green-400" : "text-gray-300"
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
                      className="text-gray-500 hover:text-red-500 p-1 transition-colors"
                      title="Kick Player"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {gameState.players.length < 2 && (
              <div className="text-center text-gray-500 py-4 italic text-sm">
                Waiting for survivors...
              </div>
            )}
          </div>

          {isHost && (
            <div className="bg-black/30 p-4 rounded-xl mb-6 border border-gray-700">
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Settings size={12} /> Difficulty: Cards Removed
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  Randomly remove <strong>{cardsToRemove}</strong> cards
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateCardsToRemove(cardsToRemove - 1)}
                    disabled={cardsToRemove <= 5}
                    className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                  >
                    -
                  </button>
                  <button
                    onClick={() => updateCardsToRemove(cardsToRemove + 1)}
                    disabled={cardsToRemove >= 9}
                    className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {isHost ? (
            <button
              onClick={startGame}
              disabled={gameState.players.length < 2}
              className="w-full py-4 rounded-xl font-black text-lg md:text-xl uppercase tracking-widest bg-green-600 hover:bg-green-500 text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Release Virus
            </button>
          ) : (
            <div className="w-full py-4 rounded-xl font-bold text-center text-gray-500 bg-gray-800/50 border border-gray-700 animate-pulse text-sm md:text-base">
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
    if (!me || !gameState.players[gameState.turnIndex]) {
      return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
          Loading game state...
        </div>
      );
    }

    const isMyTurn = gameState.players[gameState.turnIndex].id === user.uid;
    const activePlayer = gameState.players[gameState.turnIndex];
    const isHost = gameState.hostId === user.uid;
    const myGroups = groupConsecutiveCards(me.cards);
    const score = calculateScore(me.cards, me.tokens);
    const recentLogs = gameState.logs ? gameState.logs.slice(-2).reverse() : [];
    const allGuestsReady = gameState.players
      .filter((p) => p.id !== gameState.hostId)
      .every((p) => p.ready);

    return (
      <div className="h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden font-sans">
        <FloatingBackground />

        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirmLeave={leaveRoom}
            onConfirmLobby={returnToLobby}
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={isHost}
            inGame={true}
          />
        )}

        {/* --- NEW: REPORT MODAL --- */}
        {showReport && gameState.status === "finished" && (
          <RoundSummaryModal
            players={gameState.players}
            onClose={() => setShowReport(false)}
          />
        )}

        {/* Header */}
        <div className="h-14 md:h-16 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between px-4 z-160 sticky top-0 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Biohazard className="text-green-500 w-5 h-5 md:w-6 md:h-6" />
            <div className="flex flex-col">
              <span className="font-black uppercase leading-none text-sm md:text-base">
                Angry Virus
              </span>
              <span className="text-[10px] text-gray-500 tracking-wider">
                {gameState.deck.length} Unrevealed Cards
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGuide(true)}
              className="p-2 text-gray-400 hover:bg-gray-800 rounded-full"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`p-2 rounded-full ${
                showLogs
                  ? "bg-green-900 text-green-400"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              <History size={18} />
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 text-red-400 hover:bg-red-900/20 rounded-full"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Guides & Logs */}
        {showGuide && <GameGuideModal onClose={() => setShowGuide(false)} />}
        {showLogs && (
          <div className="fixed top-16 right-4 w-64 max-h-60 bg-gray-900/95 border border-gray-700 rounded-xl z-155 overflow-y-auto p-2 shadow-2xl">
            {gameState.logs
              .slice()
              .reverse()
              .map((l, i) => (
                <div
                  key={i}
                  className={`text-xs p-2 mb-1 rounded ${
                    l.type === "warning"
                      ? "text-yellow-300 bg-yellow-900/20"
                      : l.type === "success"
                        ? "text-green-300 bg-green-900/20"
                        : "text-gray-400"
                  }`}
                >
                  {l.text}
                </div>
              ))}
          </div>
        )}

        {/* Game Over Screen */}
        {gameState.status === "finished" && (
          <div className="fixed inset-0 top-14 z-150 bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in">
            <Trophy size={80} className="text-yellow-400 mb-6 animate-bounce" />
            <h1 className="text-5xl font-black text-white mb-2 uppercase">
              Survival Complete
            </h1>
            <div className="text-2xl text-gray-300 mb-8">
              Winner:{" "}
              <span className="text-green-400 font-bold">
                {
                  gameState.players.find((p) => p.id === gameState.winnerId)
                    ?.name
                }
              </span>
            </div>

            {/* Added button to re-open report if they closed it */}
            <button
              onClick={() => setShowReport(true)}
              className="mb-6 flex items-center gap-2 text-green-400 hover:text-green-300 underline"
            >
              <FileText size={16} /> View Detailed Report
            </button>

            <div className="grid grid-cols-1 gap-3 w-full max-w-md max-h-[30vh] overflow-y-auto mb-8">
              {[...gameState.players]
                .sort(
                  (a, b) =>
                    calculateScore(a.cards, a.tokens) -
                    calculateScore(b.cards, b.tokens),
                )
                .map((p, i) => (
                  <div
                    key={p.id}
                    className={`flex justify-between items-center p-4 rounded-xl border ${
                      p.id === gameState.winnerId
                        ? "bg-green-900/30 border-green-500"
                        : "bg-gray-800 border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gray-500">#{i + 1}</span>
                      <span className="font-bold">{p.name}</span>
                      {p.ready && (
                        <CheckCircle size={16} className="text-green-500" />
                      )}
                    </div>
                    <div className="font-mono text-xl font-bold">
                      {calculateScore(p.cards, p.tokens)} pts
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex flex-col gap-4 items-center w-full max-w-md">
              {isHost ? (
                <div className="flex flex-col w-full gap-3">
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={returnToLobby}
                      disabled={!allGuestsReady}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                        allGuestsReady
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                      }`}
                    >
                      <LogOut size={18} /> Lobby
                    </button>
                    <button
                      onClick={restartGame}
                      disabled={!allGuestsReady}
                      className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                        allGuestsReady
                          ? "bg-green-600 hover:bg-green-500 hover:scale-105"
                          : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                      }`}
                    >
                      <RotateCcw size={18} /> New Game
                    </button>
                  </div>
                  {!allGuestsReady && (
                    <p className="text-gray-500 text-sm animate-pulse">
                      Waiting for survivors to confirm status...
                    </p>
                  )}
                </div>
              ) : !me.ready ? (
                <button
                  onClick={toggleReady}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white shadow-lg animate-pulse transition-all hover:scale-105"
                >
                  Ready for Next Game
                </button>
              ) : (
                <div className="w-full py-3 bg-gray-800 rounded-xl font-bold text-green-400 border border-green-500/50 flex items-center justify-center gap-2">
                  <CheckCircle size={20} /> Waiting for host...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Area */}
        <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto p-4 gap-4 overflow-hidden relative">
          {/* Top: Opponents - Responsive Sizing */}
          <div className="flex-none h-32 flex items-center gap-3 overflow-x-auto no-scrollbar px-2">
            {gameState.players
              .filter((p) => p.id !== user.uid)
              .map((p) => {
                const oppGroups = groupConsecutiveCards(p.cards);
                return (
                  <div
                    key={p.id}
                    className={`flex flex-col items-center justify-start min-w-[120px] p-2 rounded-xl border-2 h-full transition-all ${
                      gameState.players[gameState.turnIndex].id === p.id
                        ? "border-green-500 bg-green-900/20 scale-105"
                        : "border-gray-800 bg-gray-900/50 opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1 w-full justify-center">
                      <User size={14} className="text-gray-400" />
                      <span className="text-xs font-bold truncate max-w-[80px]">
                        {p.name}
                      </span>
                    </div>

                    {/* Opponent Card Mini Visualization */}
                    <div className="flex gap-1 overflow-x-auto w-full mb-1 no-scrollbar justify-center">
                      {oppGroups.length > 0 ? (
                        oppGroups.map((group, gIdx) => (
                          <div
                            key={gIdx}
                            className="flex flex-col items-center bg-gray-800/80 rounded px-1 border border-gray-600"
                          >
                            <span className="text-[10px] font-bold text-green-400">
                              {group[0]}
                            </span>
                            {group.length > 1 && (
                              <span className="text-[8px] text-gray-500">
                                +{group.length - 1}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-gray-600">
                          No cards
                        </div>
                      )}
                    </div>

                    <div className="mt-auto flex gap-2 text-xs">
                      <div className="flex items-center gap-0.5 text-orange-400">
                        <Pill size={10} /> {p.tokens}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Center: Active Card & LOG OVERLAY */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 relative min-h-0">
            {/* PERSISTENT LOG OVERLAY - Placed at top of action area to avoid overlap */}
            <div className="absolute top-0 left-0 right-0 flex flex-col items-center pointer-events-none z-10 space-y-1">
              {recentLogs.map((l, i) => (
                <div
                  key={i}
                  className={`px-4 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 border max-w-[90%] text-center truncate ${
                    l.type === "warning"
                      ? "bg-yellow-900/60 border-yellow-500/30 text-yellow-100"
                      : l.type === "success"
                        ? "bg-green-900/60 border-green-500/30 text-green-100"
                        : "bg-gray-800/60 border-gray-600/30 text-gray-200"
                  }`}
                >
                  {l.text}
                </div>
              ))}
            </div>

            {!isMyTurn && (
              <div className="mt-8 bg-gray-900/80 px-4 py-2 rounded-full border border-gray-700 text-gray-400 text-sm animate-pulse">
                Waiting for {activePlayer.name}...
              </div>
            )}

            {/* The Active Card */}
            <div className={`relative group ${!isMyTurn ? "mt-0" : "mt-8"}`}>
              <div
                className={`absolute -inset-4 bg-green-500/20 rounded-full blur-xl ${
                  isMyTurn ? "animate-pulse" : "hidden"
                }`}
              ></div>
              {gameState.currentCard !== null ? (
                <div className="relative">
                  <Card value={gameState.currentCard} size="lg" isNew={true} />
                  {/* Tokens on Card */}
                  {gameState.tokensOnCard > 0 && (
                    <div className="absolute -top-4 -right-4 z-20">
                      <TokenDisplay count={gameState.tokensOnCard} size="lg" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-32 h-48 rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-600">
                  Empty
                </div>
              )}
            </div>

            {/* Actions */}
            {isMyTurn && gameState.status === "playing" && (
              <div className="flex gap-4 z-20 mt-4 w-full justify-center px-4">
                <button
                  onClick={() => takeAction("PASS")}
                  disabled={me.tokens <= 0}
                  className="flex-1 max-w-[140px] flex flex-col items-center gap-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-gray-600 transition-all active:scale-95"
                >
                  <span className="font-bold text-gray-300 text-sm md:text-base">
                    PASS
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-orange-400 font-bold bg-black/40 px-2 py-0.5 rounded-full">
                    Pay 1 <Pill size={10} />
                  </div>
                </button>

                <button
                  onClick={() => takeAction("TAKE")}
                  className="flex-1 max-w-[160px] flex flex-col items-center gap-1 px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-900/40 hover:scale-105 transition-all active:scale-95"
                >
                  <span className="text-sm md:text-base">TAKE IT</span>
                  {gameState.tokensOnCard > 0 && (
                    <div className="text-[10px] text-green-100 bg-green-700/50 px-2 py-0.5 rounded-full">
                      Gain {gameState.tokensOnCard} Tokens
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Bottom: Player Hand */}
          <div className="flex-none bg-gray-900/80 backdrop-blur-md p-4 rounded-t-3xl border-t border-gray-800 shadow-2xl">
            <div className="flex justify-between items-end mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gray-800 p-2 rounded-lg border border-gray-700 hidden md:block">
                  <User size={24} className="text-green-400" />
                </div>
                <div>
                  <div className="text-xs md:text-sm font-bold text-gray-400">
                    Your Score
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-white leading-none">
                    {score}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">
                  Vitamins
                </div>
                <TokenDisplay count={me.tokens} size="lg" />
              </div>
            </div>

            {/* Cards Scroll - Grouped by Consecutive Sequence */}
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar min-h-[80px] md:min-h-[100px]">
              {myGroups.length === 0 ? (
                <div className="flex items-center justify-center w-full text-gray-600 text-sm italic">
                  No viruses collected yet...
                </div>
              ) : (
                myGroups.map((group, gIdx) => (
                  <div
                    key={gIdx}
                    className="flex gap-1 p-2 bg-black/20 rounded-xl border border-gray-700/50"
                  >
                    {group.map((val, i) => (
                      <div
                        key={i}
                        className="transform hover:-translate-y-2 transition-transform"
                      >
                        <Card value={val} size="sm" isSequenceStart={i === 0} />
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <Logo />
      </div>
    );
  }

  return null;
}
//fixed
