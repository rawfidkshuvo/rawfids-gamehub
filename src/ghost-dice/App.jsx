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
  deleteDoc,
  onSnapshot,
  arrayUnion,
  increment,
  runTransaction,
} from "firebase/firestore";
import {
  StepBack,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Dices,
  Ghost,
  Skull,
  Trophy,
  LogOut,
  History,
  BookOpen,
  X,
  Crown,
  User,
  RotateCcw,
  Home,
  CheckCircle,
  AlertTriangle,
  Gavel,
  Megaphone,
  Hammer,
  Sparkles,
  Trash2,
  Loader,
  Copy,
} from "lucide-react";

// --- Firebase Config ---
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

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "ghost-dice";
const GAME_ID = "7";
const LS_ROOM_KEY = "ghost_dice_roomId"; // Persistence Key

// --- Constants ---
const DICE_ICONS = {
  1: Dice1,
  2: Dice2,
  3: Dice3,
  4: Dice4,
  5: Dice5,
  6: Dice6,
};

const PLAYER_THEMES = [
  {
    name: "Green",
    color: "text-green-400",
    border: "border-green-500",
    bg: "bg-green-900/20",
    shadow: "shadow-green-500/20",
    ring: "ring-green-500",
  },
  {
    name: "Orange",
    color: "text-orange-400",
    border: "border-orange-500",
    bg: "bg-orange-900/20",
    shadow: "shadow-orange-500/20",
    ring: "ring-orange-500",
  },
  {
    name: "Cyan",
    color: "text-cyan-400",
    border: "border-cyan-500",
    bg: "bg-cyan-900/20",
    shadow: "shadow-cyan-500/20",
    ring: "ring-cyan-500",
  },
  {
    name: "Yellow",
    color: "text-yellow-400",
    border: "border-yellow-500",
    bg: "bg-yellow-900/20",
    shadow: "shadow-yellow-500/20",
    ring: "ring-yellow-500",
  },
  {
    name: "Purple",
    color: "text-purple-400",
    border: "border-purple-500",
    bg: "bg-purple-900/20",
    shadow: "shadow-purple-500/20",
    ring: "ring-purple-500",
  },
  {
    name: "Rose",
    color: "text-rose-400",
    border: "border-rose-500",
    bg: "bg-rose-900/20",
    shadow: "shadow-rose-500/20",
    ring: "ring-rose-500",
  },
];

// --- Sub-Components (Strict DNA adherence) ---

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

const GhostLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Dices size={12} className="text-indigo-400" />
    <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
      GHOST DICE
    </span>
  </div>
);

const GhostLogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Dices size={22} className="text-indigo-400" />
    <span className="text-[20px] font-black tracking-widest text-indigo-400 uppercase">
      GHOST DICE
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
    <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2">Abandon the Haunt?</h3>
      <p className="text-zinc-400 mb-6 text-sm">
        {inGame
          ? "Leaving now will forfeit your soul (and the game)."
          : "Leaving the lobby will disconnect you."}
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onCancel}
          className="bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded font-bold transition-colors"
        >
          Stay
        </button>
        {inGame && isHost && (
          <button
            onClick={onConfirmLobby}
            className="py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <Home size={18} /> Return Group to Lobby
          </button>
        )}
        <button
          onClick={onConfirmLeave}
          className="bg-red-900/80 hover:bg-red-800 text-red-200 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 border border-red-900"
        >
          <LogOut size={18} /> Leave Game
        </button>
      </div>
    </div>
  </div>
);

const LogViewer = ({ logs, onClose }) => (
  <div className="fixed top-16 right-4 w-64 max-h-60 bg-gray-900/95 border border-gray-700 rounded-xl z-155 overflow-y-auto p-2 shadow-2xl">
    <div className="bg-zinc-900 w-full md:max-w-md h-full md:h-[70vh] rounded-none md:rounded-xl flex flex-col border-none md:border border-zinc-700 shadow-2xl">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <History size={18} className="text-indigo-400" /> Séance Logs
        </h3>
        <button
          onClick={onClose}
          className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700"
        >
          <X className="text-zinc-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {[...logs].reverse().map((log, i) => (
          <div
            key={i}
            className={`text-xs md:text-sm p-3 rounded border-l-2 ${
              log.type === "danger"
                ? "bg-red-900/10 border-red-500 text-red-300"
                : log.type === "success"
                  ? "bg-green-900/10 border-green-500 text-green-300"
                  : log.type === "warning"
                    ? "bg-indigo-900/10 border-indigo-500 text-indigo-300"
                    : "bg-zinc-800/50 border-zinc-600 text-zinc-400"
            }`}
          >
            <span className="opacity-50 mr-2 font-mono">
              [
              {new Date(parseInt(log.id)).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
              ]
            </span>
            {log.text}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const RulesModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-100 flex items-center justify-center p-0 md:p-4 animate-in fade-in">
    <div className="bg-zinc-900 md:rounded-2xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-hidden border-none md:border border-indigo-500/30 flex flex-col">
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wider">
          <BookOpen className="text-indigo-400" /> The Grimoire
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400"
        >
          <X />
        </button>
      </div>
      <div className="p-6 overflow-y-auto text-zinc-300 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
            <h3 className="text-xl font-bold text-indigo-400 mb-2">
              The Basics
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                Everyone starts with <strong>5 Dice</strong>.
              </li>
              <li>
                Only <strong>you</strong> can see your own dice.
              </li>
              <li>Goal: Be the last player with dice remaining.</li>
              <li>
                <strong>1s (Aces) are Wild!</strong> They count as any number,
                unless the bid is on 1s.
              </li>
            </ul>
          </div>
          <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
            <h3 className="text-xl font-bold text-white mb-2">
              Bidding & Challenging
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Bid:</strong> Claim a quantity of a specific face value
                on the <em>entire table</em> (e.g., "Five 4s").
              </li>
              <li>
                <strong>Raise:</strong> You must bid a higher quantity OR the
                same quantity with a higher face value.
              </li>
              <li>
                <strong>Liar!:</strong> If you don't believe the previous bid,
                challenge it!
              </li>
              <li>
                <strong>Result:</strong> If the bid was valid, Challenger loses
                a die. If invalid, Bidder loses a die.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FeedbackOverlay = ({ data, currentUserId, onClose }) => {
  if (!data) return null;

  const isLoser = currentUserId === data.loserId;
  const isWinner = currentUserId === data.winnerId;

  // Determine styling based on result relative to the viewer
  let bgClass = "bg-zinc-800/95 border-zinc-500 text-white"; // Spectator
  let animClass = "animate-in fade-in zoom-in slide-in-from-bottom-10";
  let btnClass = "bg-zinc-700 hover:bg-zinc-600 text-white border-zinc-500"; // Default button

  if (isWinner) {
    bgClass =
      "bg-green-900/95 border-green-500 text-green-100 shadow-[0_0_100px_rgba(34,197,94,0.5)]";
    btnClass = "bg-green-600 hover:bg-green-500 text-white border-green-400";
  } else if (isLoser) {
    bgClass =
      "bg-red-900/95 border-red-500 text-red-100 shadow-[0_0_100px_rgba(239,68,68,0.5)]";
    animClass += " animate-shake"; // Requires the CSS added in previous step
    btnClass = "bg-red-800 hover:bg-red-700 text-white border-red-400";
  }

  const Icon = DICE_ICONS[data.bidFace] || Dices;

  return (
    <div className="fixed inset-0 z-160 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Full screen tint for loser/winner */}
      {isLoser && <div className="absolute inset-0 bg-red-500/10 z-0" />}
      {isWinner && <div className="absolute inset-0 bg-green-500/10 z-0" />}

      <div
        className={`
      relative z-10 flex flex-col items-center justify-center p-8 rounded-3xl border-4 
      max-w-xl w-full text-center shadow-2xl duration-300
      ${bgClass} ${animClass}
    `}
      >
        <div className="mb-6">
          <h2 className="text-3xl font-black uppercase tracking-widest mb-2">
            LIAR CALLED!
          </h2>
          <p className="text-lg opacity-80">
            <span className="font-bold border-b border-white/30 pb-0.5">
              {data.challengerName}
            </span>{" "}
            called out{" "}
            <span className="font-bold border-b border-white/30 pb-0.5">
              {data.bidderName}
            </span>
          </p>
        </div>

        <div className="bg-black/30 p-6 rounded-xl w-full mb-8 border border-white/10">
          <div className="flex items-center justify-center gap-8 mb-4">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider opacity-70 mb-1">
                Bid
              </div>
              <div className="text-4xl font-black flex items-center gap-2 justify-center">
                {data.bidQuantity} <span className="text-sm opacity-50">x</span>{" "}
                <Icon size={32} />
              </div>
            </div>
            <div className="h-12 w-px bg-white/20"></div>
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider opacity-70 mb-1">
                Found
              </div>
              <div
                className={`text-4xl font-black ${
                  data.actualCount >= data.bidQuantity
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {data.actualCount}
              </div>
            </div>
          </div>
          <p className="text-sm italic opacity-75">
            {data.actualCount >= data.bidQuantity
              ? "The bid was truthful!"
              : "The bid was a lie!"}
          </p>
        </div>

        <div className="text-2xl font-bold uppercase tracking-wide bg-black/40 px-6 py-3 rounded-full border border-white/20 mb-8">
          {data.loserName} loses a die!
        </div>

        {/* --- CLOSE BUTTON --- */}
        <button
          onClick={onClose}
          className={`
            w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest border-2 shadow-lg
            transition-all transform hover:scale-[1.02] active:scale-[0.98]
            ${btnClass}
          `}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// Add this inside the GhostDiceGame component, before the return
const styles = (
  <style>{`
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    .animate-shake {
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }
  `}</style>
);

const GameOverScreen = ({ winnerName, onReturnToLobby, isHost }) => (
  <div className="fixed inset-0 z-155 bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-500">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black pointer-events-none" />

    <div className="z-10 text-center space-y-8 p-8">
      <div className="mb-4">
        <Trophy
          size={80}
          className="text-yellow-400 mx-auto animate-bounce drop-shadow-[0_0_35px_rgba(250,204,21,0.6)]"
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl text-zinc-400 font-serif tracking-widest uppercase">
          The Deadliest Ghost
        </h2>
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-linear-to-b from-yellow-300 to-yellow-600 drop-shadow-2xl">
          {winnerName}
        </h1>
      </div>

      <div className="pt-12">
        {isHost ? (
          <button
            onClick={onReturnToLobby}
            className="group relative px-8 py-4 bg-zinc-100 text-black font-black text-xl rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            <span className="flex items-center gap-3">
              <RotateCcw className="group-hover:-rotate-180 transition-transform duration-500" />
              RETURN TO LOBBY
            </span>
          </button>
        ) : (
          <div className="text-zinc-500 animate-pulse font-mono">
            Waiting for Host to reset...
          </div>
        )}
      </div>
    </div>
  </div>
);

// --- Main Component ---
export default function GhostDiceGame() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("menu");

  // PERSISTENCE: Init state from localStorage
  const [roomId, setRoomId] = useState(
    () => localStorage.getItem(LS_ROOM_KEY) || "",
  );
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);

  // UI States
  const [showRules, setShowRules] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Input State
  const [bidQuantity, setBidQuantity] = useState(1);
  const [bidFace, setBidFace] = useState(2);

  //read and fill global name
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem("gameHub_playerName") || "",
  );
  //set global name for all game
  useEffect(() => {
    if (playerName) localStorage.setItem("gameHub_playerName", playerName);
  }, [playerName]);

  // --- Auth & Listener ---
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
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (!data.players.some((p) => p.id === user.uid)) {
            setRoomId("");
            localStorage.removeItem(LS_ROOM_KEY); // Clean up
            setView("menu");
            setError("Connection Terminated.");
            return;
          }
          setGameState(data);

          if (data.status === "lobby") setView("lobby");
          else setView("game");

          // Feedback Trigger
          if (data.feedbackTrigger) {
            // New trigger found
            if (data.feedbackTrigger.id !== gameState?.feedbackTrigger?.id) {
              setFeedback(data.feedbackTrigger);
            }
          } else {
            // Triggers cleared on server (New Game/Reset) -> Clear local overlay
            setFeedback(null);
          }

          // Auto update inputs to be valid next bid if not set
          if (data.currentBid && !gameState?.currentBid) {
            setBidQuantity(data.currentBid.quantity);
            setBidFace(data.currentBid.face);
          }
        } else {
          setRoomId("");
          localStorage.removeItem(LS_ROOM_KEY); // Clean up
          setView("menu");
          setError("Room vanished into the ether.");
        }
      },
    );
    return () => unsub();
  }, [roomId, user, gameState?.feedbackTrigger?.id]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists() && doc.data()[GAME_ID]?.maintenance)
        setIsMaintenance(true);
      else setIsMaintenance(false);
    });
    return () => unsub();
  }, []);

  // --- Game Actions ---

  const createRoom = async () => {
    if (!playerName.trim()) return setError("Name required.");
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
          dice: [], // Will generate on start
          diceCount: 5,
          eliminated: false,
          ready: true,
        },
      ],
      logs: [],
      turnIndex: 0,
      currentBid: null,
      turnState: "IDLE", // BIDDING, REVEAL
      feedbackTrigger: null,
      winner: null,
      roundLoserId: null, // Track who lost the round
      revealReadyIds: [], // Track who clicked "Next Round"
    };

    try {
      await setDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
        initialData,
      );
      setRoomId(newId);
      localStorage.setItem(LS_ROOM_KEY, newId); // Save Session
      setView("lobby");
    } catch (e) {
      setError("Network error.");
    }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCodeInput || !playerName)
      return setError("Code and Name required.");
    setLoading(true);
    try {
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
      if (!snap.exists()) throw new Error("Room not found.");
      const data = snap.data();
      if (data.status !== "lobby") throw new Error("Game already in progress.");
      if (data.players.length >= 6) throw new Error("Table full.");

      if (!data.players.find((p) => p.id === user.uid)) {
        await updateDoc(ref, {
          players: arrayUnion({
            id: user.uid,
            name: playerName,
            dice: [],
            diceCount: 5,
            eliminated: false,
            ready: true,
          }),
        });
      }
      setRoomId(roomCodeInput);
      localStorage.setItem(LS_ROOM_KEY, roomCodeInput); // Save Session
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const leaveRoom = async () => {
    if (!roomId) return;
    const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);

    // Check if I am host
    const isHost = gameState.hostId === user.uid;

    if (isHost) {
      // If host leaves, delete the room entirely
      // Listeners for other players will see doc removed and kick them to menu
      await deleteDoc(ref);
    } else {
      // Guest leaving
      const updatedPlayers = gameState.players.filter((p) => p.id !== user.uid);
      await updateDoc(ref, { players: updatedPlayers });
    }

    setRoomId("");
    localStorage.removeItem(LS_ROOM_KEY); // Clean up
    setView("menu");
    setShowLeaveConfirm(false);
  };

  // --- KICK FUNCTION ---
  const kickPlayer = async (playerIdToRemove) => {
    if (gameState.hostId !== user.uid) return;

    const newPlayers = gameState.players.filter(
      (p) => p.id !== playerIdToRemove,
    );

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players: newPlayers },
    );
  };

  // --- READY TOGGLE FUNCTION ---
  const toggleReady = async () => {
    if (!gameState) return;
    const updatedPlayers = gameState.players.map((p) =>
      p.id === user.uid ? { ...p, ready: !p.ready } : p,
    );
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players: updatedPlayers },
    );
  };

  // --- Logic ---

  const rollDice = (count) => {
    const res = [];
    for (let i = 0; i < count; i++) res.push(Math.floor(Math.random() * 6) + 1);
    return res.sort();
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
    if (gameState.players.length < 2) return setError("Need 2+ Players.");

    // Init Players
    const players = gameState.players.map((p) => ({
      ...p,
      diceCount: 5,
      dice: rollDice(5),
      eliminated: false,
      ready: false, // Reset readiness on start
    }));

    // Random Start
    const startIdx = Math.floor(Math.random() * players.length);

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        players: players,
        turnIndex: startIdx,
        currentBid: null,
        turnState: "BIDDING",
        feedbackTrigger: null, // <--- ADD THIS LINE (Wipes previous game data)
        winner: null, // <--- ADD THIS LINE (Safety)
        revealReadyIds: [], // <--- ADD THIS LINE (Safety)
        roundLoserId: null, // <--- ADD THIS LINE (Safety)
        logs: [
          {
            id: Date.now().toString(),
            text: "The Haunt Begins. 5 Dice each.",
            type: "neutral",
          },
        ],
      },
    );
  };

  const placeBid = async () => {
    const current = gameState.currentBid;
    const me = gameState.players.find((p) => p.id === user.uid);

    // Validation
    if (current) {
      if (bidQuantity < current.quantity) return; // Invalid
      if (bidQuantity === current.quantity && bidFace <= current.face) return; // Invalid
    }

    // Calc next turn
    let nextIdx = (gameState.turnIndex + 1) % gameState.players.length;
    while (gameState.players[nextIdx].eliminated)
      nextIdx = (nextIdx + 1) % gameState.players.length;

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        currentBid: {
          quantity: bidQuantity,
          face: bidFace,
          playerId: user.uid,
          playerName: me.name,
        },
        turnIndex: nextIdx,
        logs: arrayUnion({
          id: Date.now().toString(),
          text: `${me.name} bids: ${bidQuantity}x ${bidFace}s`,
          type: "neutral",
        }),
      },
    );
  };

  const challenge = async () => {
    const bid = gameState.currentBid;
    const challenger = gameState.players.find((p) => p.id === user.uid);
    const bidder = gameState.players.find((p) => p.id === bid.playerId);

    // 1. Reveal Phase: Count Dice
    let count = 0;
    let allDice = [];

    gameState.players.forEach((p) => {
      if (!p.eliminated) {
        allDice = [...allDice, ...p.dice];
        p.dice.forEach((d) => {
          if (d === bid.face || (d === 1 && bid.face !== 1)) {
            count++;
          }
        });
      }
    });

    const bidSuccess = count >= bid.quantity; // Bidder told the truth (or underbid)
    const loserId = bidSuccess ? challenger.id : bidder.id; // If bid true, challenger loses. If lie, bidder loses.
    const winnerId = bidSuccess ? bidder.id : challenger.id;
    const loserName = bidSuccess ? challenger.name : bidder.name;

    // --- NEW FEEDBACK OBJECT STRUCTURE ---
    const feedback = {
      id: Date.now(),
      type: "challenge_result", // We use this to trigger the specific overlay logic
      challengerName: challenger.name,
      bidderName: bidder.name,
      bidQuantity: bid.quantity,
      bidFace: bid.face,
      actualCount: count,
      loserId: loserId,
      winnerId: winnerId,
      loserName: loserName,
    };

    // Logs for the side panel
    let logs = [
      {
        id: Date.now().toString(),
        text: `${challenger.name} called LIAR on ${bidder.name}!`,
        type: "warning",
      },
      {
        id: Date.now() + 1,
        text: `Result: ${count} matching dice found (Bid: ${bid.quantity}).`,
        type: bidSuccess ? "success" : "danger",
      },
      {
        id: Date.now() + 2,
        text: `${loserName} loses a die.`,
        type: "danger",
      },
    ];

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        turnState: "REVEAL",
        feedbackTrigger: feedback,
        logs: arrayUnion(...logs),
        roundLoserId: loserId,
        revealReadyIds: [],
      },
    );
  };

  const confirmNextRound = async () => {
    if (!gameState || !user) return;

    const roomRef = doc(
      db,
      "artifacts",
      APP_ID,
      "public",
      "data",
      "rooms",
      roomId,
    );

    try {
      await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) return;
        const data = roomDoc.data();

        // Safety: Already voted?
        if (data.revealReadyIds?.includes(user.uid)) return;

        // Add user to ready list
        const newReadyIds = [...(data.revealReadyIds || []), user.uid];

        // --- UPDATED LOGIC START ---
        // Calculate how many people actually need to click "Roll"
        // We exclude players who are already eliminated OR are about to be eliminated
        const loser = data.players.find((p) => p.id === data.roundLoserId);
        const loserWillDie = loser && loser.diceCount <= 1;

        const activeVoters = data.players.filter((p) => {
          if (p.eliminated) return false; // Already dead
          // If this is the loser and they are about to reach 0 dice, they don't vote
          if (p.id === data.roundLoserId && loserWillDie) return false;
          return true;
        });

        const requiredVotes = activeVoters.length;
        // --- UPDATED LOGIC END ---

        // Check if everyone needed has clicked
        if (newReadyIds.length >= requiredVotes) {
          // RESOLVE ROUND
          const players = [...data.players];
          const lIdx = players.findIndex((p) => p.id === data.roundLoserId);

          players[lIdx].diceCount -= 1;

          let logText = "";
          let nextState = "BIDDING";
          let winner = null;
          let feedback = null;

          if (players[lIdx].diceCount <= 0) {
            players[lIdx].eliminated = true;
            logText = `${players[lIdx].name} has run out of soul. Eliminated.`;
          }

          // Check Win Condition
          const alive = players.filter((p) => !p.eliminated);
          if (alive.length === 1) {
            nextState = "FINISHED";
            winner = alive[0].name;
            feedback = null; // No feedback modal on game over
          } else {
            // Reroll everyone who is alive
            players.forEach((p) => {
              if (!p.eliminated) p.dice = rollDice(p.diceCount);
              else p.dice = [];
            });
          }

          // Next Player Calculation
          let nextIdx = lIdx;
          if (players[lIdx].eliminated) {
            nextIdx = (lIdx + 1) % players.length;
            while (players[nextIdx].eliminated && alive.length > 1)
              nextIdx = (nextIdx + 1) % players.length;
          }

          const updates = {
            players: players,
            turnState: nextState === "FINISHED" ? "IDLE" : "BIDDING",
            currentBid: null,
            turnIndex: nextIdx,
            revealReadyIds: [],
            roundLoserId: null,
          };

          if (logText) {
            updates.logs = arrayUnion({
              id: Date.now().toString(),
              text: logText,
              type: "danger",
            });
          }
          if (winner) {
            updates.status = "finished";
            updates.winner = winner;
            updates.feedbackTrigger = null; // Ensure clear
          }

          transaction.update(roomRef, updates);
        } else {
          // Just update vote count
          transaction.update(roomRef, {
            revealReadyIds: newReadyIds,
          });
        }
      });
    } catch (e) {
      console.error("Transaction failed: ", e);
    }
  };

  const returnToLobby = async () => {
    const resetPlayers = gameState.players.map((p) => ({
      ...p,
      dice: [],
      diceCount: 5,
      eliminated: false,
      ready: true,
    }));
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        players: resetPlayers,
        logs: [],
        currentBid: null,
        turnState: "IDLE",
        winner: null,
        feedbackTrigger: null,
        revealReadyIds: [],
        roundLoserId: null,
      },
    );
  };

  const me = gameState?.players.find((p) => p.id === user?.uid);
  const isMyTurn = gameState?.players[gameState?.turnIndex]?.id === user?.uid;

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <GhostLogoBig />
        <div className="bg-orange-500/10 p-8 rounded-2xl border border-orange-500/30">
          <Hammer
            size={64}
            className="text-orange-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
          <p className="text-gray-400">
            The spirits are resting. The tavern is closed until dusk.
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
        <GhostLogo />
      </div>
    );
  }

  // --- Views ---

  if (!user)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-indigo-500 animate-pulse">
        Summoning souls...
      </div>
    );

  // RECONNECTING STATE
  if (roomId && !gameState && !error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4">
        <FloatingBackground />
        <div className="bg-zinc-900/80 backdrop-blur p-8 rounded-2xl border border-zinc-700 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <Loader size={48} className="text-indigo-500 animate-spin" />
          <div className="text-center">
            <h2 className="text-xl font-bold">Reconnecting...</h2>
            <p className="text-zinc-400 text-sm">Resuming your session</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <FloatingBackground />
        {/* --- START OF BACK BUTTON --- */}
        <nav className="absolute top-0 left-0 w-full p-4 z-50">
          <a
            href={import.meta.env.BASE_URL}
            className="flex items-center gap-2 text-indigo-800 rounded-lg font-bold shadow-md hover:text-indigo-400 transition-colors w-fit animate-pulse"
          >
            {/* Arrow Icon */}
            <StepBack />
            <span>Back to Gamehub</span>
          </a>
        </nav>
        {/* --- END OF BACK BUTTON --- */}
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}

        <div className="z-10 text-center mb-10">
          <Dices
            size={64}
            className="text-indigo-400 mx-auto mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]"
          />
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-linear-to-b from-indigo-300 to-zinc-500 font-serif tracking-widest drop-shadow-md">
            GHOST DICE
          </h1>
          <p className="text-white-400/60 tracking-[0.3em] uppercase mt-2">
            Dead Men Tell No Tales
          </p>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur border border-indigo-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 animate-in slide-in-from-bottom-10 duration-700 delay-100">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm border border-red-800">
              {error}
            </div>
          )}

          <input
            className="w-full bg-black/50 border border-zinc-600 p-3 rounded mb-4 text-white placeholder-zinc-500 focus:border-indigo-500 outline-none transition-colors"
            placeholder="Soul Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-linear-to-r from-indigo-700 to-zinc-600 hover:from-indigo-600 hover:to-zinc-500 p-4 rounded font-bold mb-4 flex items-center justify-center gap-2 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all"
          >
            <Crown size={20} /> Host Séance
          </button>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              className="w-full sm:flex-1 bg-black/50 border border-zinc-600 p-3 rounded text-white placeholder-zinc-500 uppercase font-mono tracking-wider focus:border-indigo-500 outline-none"
              placeholder="CODE"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 px-6 py-3 rounded font-bold transition-colors"
            >
              Join
            </button>
          </div>

          <button
            onClick={() => setShowRules(true)}
            className="w-full text-sm text-zinc-400 hover:text-white flex items-center justify-center gap-2 py-2"
          >
            <BookOpen size={16} /> The Grimoire
          </button>
        </div>
        <div className="absolute bottom-4 text-slate-600 text-xs text-center">
          Inspired by Liar's Dice. A tribute game.
          <br />
          Developed by <strong>RAWFID K SHUVO</strong>. Visit{" "}
          <a
            href={import.meta.env.BASE_URL}
            //target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 underline hover:text-indigo-600"
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
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative">
        <FloatingBackground />
        <GhostLogoBig />
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirmLeave={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={isHost}
            inGame={false}
          />
        )}

        <div className="z-10 w-full max-w-lg bg-zinc-900/90 backdrop-blur p-8 rounded-2xl border border-indigo-900/50 shadow-2xl mb-4">
          <div className="flex justify-between items-center mb-8 border-b border-zinc-700 pb-4">
            {/* Grouping Title and Copy Button together on the left */}
            <div>
              <h2 className="text-lg md:text-xl text-indigo-400 font-bold uppercase">
                Crypt
              </h2>

              {/* Flex container to align ID and Button side-by-side */}
              <div className="flex items-center gap-3 mt-1">
                <div className="text-2xl md:text-3xl font-mono text-white">
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
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-indigo-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg animate-fade-in-up whitespace-nowrap">
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

          <div className="bg-black/20 rounded-xl p-4 mb-8 border border-zinc-800">
            <h3 className="text-zinc-500 text-xs uppercase tracking-wider mb-4 flex justify-between">
              <span>Souls ({gameState.players.length})</span>
            </h3>
            <div className="space-y-2">
              {gameState.players.map((p, i) => {
                const theme = PLAYER_THEMES[i % PLAYER_THEMES.length];
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded border ${theme.bg} ${theme.border}`}
                  >
                    <span
                      className={`font-bold flex items-center gap-2 ${theme.color}`}
                    >
                      <User size={14} /> {p.name}{" "}
                      {p.id === gameState.hostId && (
                        <Crown size={14} className="text-yellow-500" />
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 text-xs flex items-center gap-1">
                        <CheckCircle size={12} /> Present
                      </span>
                      {/* --- KICK BUTTON --- */}
                      {isHost && p.id !== user.uid && (
                        <button
                          onClick={() => kickPlayer(p.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-900/20 rounded-full transition-colors"
                          title="Kick Soul"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {gameState.players.length < 2 && (
                <div className="text-center text-zinc-500 italic text-sm py-2">
                  Waiting for more souls...
                </div>
              )}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={startGame}
              disabled={gameState.players.length < 2}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                gameState.players.length >= 2
                  ? "bg-indigo-700 hover:bg-indigo-600 text-white shadow-indigo-900/20"
                  : "bg-zinc-800 cursor-not-allowed text-zinc-500"
              }`}
            >
              {gameState.players.length < 2
                ? "Need 2+ Players..."
                : "Begin Haunt"}
            </button>
          ) : (
            <div className="text-center text-indigo-400/60 animate-pulse font-serif italic">
              Waiting for Host...
            </div>
          )}
        </div>
        <GhostLogo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const myIndex = gameState.players.findIndex((p) => p.id === user.uid);
    const myTheme = PLAYER_THEMES[myIndex % PLAYER_THEMES.length];

    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden font-sans">
        {styles} {/* <--- 1. INJECT STYLES HERE */}
        <FloatingBackground />
        {/* 1. IMMEDIATE GAME OVER SCREEN */}
        {gameState.status === "finished" && (
          <GameOverScreen
            winnerName={gameState.winner}
            isHost={gameState.hostId === user.uid}
            onReturnToLobby={returnToLobby}
          />
        )}
        {/* Overlays */}
        {/* 2. HIDE FEEDBACK OVERLAY IF GAME IS OVER */}
        {feedback && gameState.status !== "finished" && (
          <FeedbackOverlay
            data={feedback}
            currentUserId={user.uid}
            onClose={() => setFeedback(null)}
          />
        )}
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
        {showLogs && (
          <LogViewer logs={gameState.logs} onClose={() => setShowLogs(false)} />
        )}
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirmLeave={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={gameState.hostId === user.uid}
            onConfirmLobby={() => {
              returnToLobby();
              setShowLeaveConfirm(false);
            }}
            inGame={true}
          />
        )}
        {/* Top Bar */}
        <div className="h-14 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between px-4 z-160 backdrop-blur-md sticky top-0">
          <div className="flex items-center gap-2">
            <span className="font-serif text-indigo-500 font-bold tracking-wider hidden md:block">
              GHOST DICE
            </span>
            <span className="text-xs text-zinc-500 bg-black/50 px-2 py-1 rounded">
              Graveyard
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRules(true)}
              className="p-2 hover:bg-zinc-800 rounded text-zinc-400"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`p-2 rounded-full ${
                showLogs
                  ? "bg-indigo-900 text-indigo-400"
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
        {/* Game Content */}
        <div className="flex-1 p-4 flex flex-col items-center relative z-10 max-w-6xl mx-auto w-full gap-4">
          {/* Table Center (Current Bid) */}
          <div
            className={`w-full max-w-md ${myTheme.bg} p-6 rounded-2xl border border-indigo-500/20 flex flex-col items-center justify-center min-h-[160px] animate-in fade-in zoom-in`}
          >
            <div
              className={`text-xs ${myTheme.color} uppercase tracking-widest mb-2`}
            >
              Current Bid
            </div>
            {gameState.currentBid ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-4">
                  <span className="text-6xl font-black text-white drop-shadow-lg">
                    {gameState.currentBid.quantity}
                  </span>
                  <span className="text-4xl text-zinc-500">x</span>
                  {React.createElement(DICE_ICONS[gameState.currentBid.face], {
                    size: 64,
                    className: `${myTheme.color} drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]`,
                  })}
                </div>
                <div className="mt-2 text-zinc-400 text-sm">
                  by{" "}
                  <span className="text-white font-bold">
                    {gameState.currentBid.playerName}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-zinc-600 italic">No bids placed...</div>
            )}
          </div>

          {/* Opponents Grid */}
          <div className="flex gap-4 justify-center flex-wrap w-full my-4">
            {gameState.players.map((p, i) => {
              if (p.id === user.uid) return null;
              const isTurn = gameState.turnIndex === i;
              const theme = PLAYER_THEMES[i % PLAYER_THEMES.length];

              return (
                <div
                  key={p.id}
                  className={`
                                relative bg-zinc-900/90 p-4 rounded-xl border-2 w-32 md:w-40 transition-all flex flex-col items-center
                                ${
                                  isTurn
                                    ? `${theme.border} ${theme.shadow} scale-105`
                                    : "border-zinc-700"
                                }
                                ${p.eliminated ? "opacity-40 grayscale" : ""}
                            `}
                >
                  {/* Status Indicator for Next Round */}
                  {gameState.turnState === "REVEAL" &&
                    !p.eliminated &&
                    gameState.revealReadyIds?.includes(p.id) && (
                      <div className="absolute top-2 left-2">
                        <CheckCircle size={16} className="text-green-500" />
                      </div>
                    )}

                  <div className="absolute top-2 right-2 flex gap-0.5">
                    {[...Array(p.diceCount)].map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isTurn ? "bg-white" : "bg-zinc-600"
                        }`}
                      />
                    ))}
                  </div>

                  {p.eliminated ? (
                    <Skull size={32} className="text-red-500 mb-2" />
                  ) : (
                    <Ghost
                      size={32}
                      className={`${
                        isTurn
                          ? theme.color + " animate-bounce"
                          : "text-zinc-600"
                      }`}
                    />
                  )}

                  <span
                    className={`font-bold text-sm truncate w-full text-center ${
                      isTurn ? theme.color : "text-zinc-400"
                    }`}
                  >
                    {p.name}
                  </span>

                  {gameState.turnState === "REVEAL" && !p.eliminated && (
                    <div className="absolute inset-0 bg-black/90 rounded-xl flex items-center justify-center z-10 p-2 flex-wrap gap-1">
                      {p.dice.map((d, di) =>
                        React.createElement(DICE_ICONS[d], {
                          key: di,
                          size: 16,
                          className:
                            d === gameState.currentBid?.face || d === 1
                              ? "text-white"
                              : "text-zinc-700",
                        }),
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Player Area */}
          <div
            className={`w-full max-w-2xl bg-zinc-900/95 p-4 rounded-t-3xl border-t-4 ${
              myTheme.border
            } backdrop-blur-md mt-auto shadow-2xl z-20 transition-all ${
              me.eliminated && gameState.status !== "finished"
                ? "grayscale opacity-50 pointer-events-none"
                : ""
            }`}
          >
            {/* Roll Button Logic */}
            {(() => {
              // 1. Am I the one who lost the round?
              const amILoser = gameState.roundLoserId === user.uid;
              // 2. Do I have only 1 (or 0) dice left?
              const amIDying = amILoser && me.diceCount <= 1;

              // 3. Should I see the button?
              // (Must be Reveal phase, I must not be already dead, I must not be dying now, Game not finished)
              const showButton =
                gameState.turnState === "REVEAL" &&
                !me.eliminated &&
                !amIDying &&
                gameState.status !== "finished";

              if (!showButton) return null;

              return (
                <div className="absolute -top-16 left-0 right-0 flex justify-center z-30">
                  {!gameState.revealReadyIds?.includes(user.uid) ? (
                    <button
                      onClick={confirmNextRound}
                      className={`
                        px-8 py-3 rounded-full font-black text-lg shadow-xl uppercase tracking-widest flex items-center gap-2 animate-bounce
                        ${myTheme.bg} ${myTheme.text} ${myTheme.border} border-2
                      `}
                    >
                      <Dices size={24} /> Roll Dice
                    </button>
                  ) : (
                    <div className="bg-zinc-900 px-6 py-2 rounded-full border border-green-500 text-green-500 font-bold flex items-center gap-2">
                      <CheckCircle size={18} /> Ready
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <User className={myTheme.color} />
                <span className={`font-bold text-xl ${myTheme.color}`}>
                  {me.name}
                </span>
                <div
                  className={`px-3 py-1 rounded-full text-xs border ${myTheme.bg} ${myTheme.color} ${myTheme.border}`}
                >
                  {me.diceCount} Dice Left
                </div>
              </div>
              {/* My Dice - Updated for Mobile Overflow */}
              <div className="flex flex-wrap justify-center gap-2 bg-black/40 p-2 rounded-xl">
                {me.dice.map((d, i) => (
                  <div
                    key={i}
                    className={`
                                    ${myTheme.bg} rounded-lg p-1 shadow-inner
                                     ${
                                       gameState.currentBid &&
                                       (d === gameState.currentBid.face ||
                                         d === 1)
                                         ? `ring-2 ${myTheme.ring}`
                                         : ""
                                     }
                                 `}
                  >
                    {React.createElement(DICE_ICONS[d], {
                      size: 32,
                      className: myTheme.color,
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="min-h-[100px]">
              {gameState.status === "finished" ? (
                <div className="text-center">
                  <h3 className="text-3xl font-black text-indigo-400 mb-4">
                    {gameState.winner} Wins!
                  </h3>

                  {/* READY STATUS DISPLAY */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {gameState.players.map((p) => (
                      <div
                        key={p.id}
                        className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold border ${
                          p.ready
                            ? "bg-green-900/30 border-green-500 text-green-400"
                            : "bg-zinc-800 border-zinc-600 text-zinc-500"
                        }`}
                      >
                        {p.name} {p.ready && "✓"}
                      </div>
                    ))}
                  </div>

                  {gameState.hostId === user.uid ? (
                    <div className="flex flex-col gap-2">
                      {/* Host Buttons - Disabled until all ready */}
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={startGame}
                          disabled={!gameState.players.every((p) => p.ready)}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold text-white flex gap-2 items-center"
                        >
                          <RotateCcw size={18} /> Restart
                        </button>
                        <button
                          onClick={returnToLobby}
                          disabled={!gameState.players.every((p) => p.ready)}
                          className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold text-white flex gap-2 items-center"
                        >
                          <Home size={18} /> Lobby
                        </button>
                      </div>
                      {!gameState.players.every((p) => p.ready) && (
                        <div className="text-zinc-500 text-xs animate-pulse mt-2">
                          Waiting for all souls to be ready...
                        </div>
                      )}
                      {!me.ready && (
                        <button
                          onClick={toggleReady}
                          className="text-xs text-indigo-400 hover:text-indigo-300 underline mt-2"
                        >
                          Mark Self Ready
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-full max-w-xs mx-auto">
                      <button
                        onClick={toggleReady}
                        className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg transition-all mb-2 ${
                          me.ready
                            ? "bg-green-900/30 border border-green-500 text-green-400"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white"
                        }`}
                      >
                        {me.ready ? "READY" : "MARK READY"}
                      </button>
                      <div className="text-zinc-500 text-xs italic">
                        Waiting for Host...
                      </div>
                    </div>
                  )}
                </div>
              ) : isMyTurn && gameState.turnState === "BIDDING" ? (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4 items-center justify-center">
                    {/* Quantity Select */}
                    <div className="flex items-center bg-zinc-800 rounded-lg border border-zinc-700">
                      <button
                        onClick={() =>
                          setBidQuantity(Math.max(1, bidQuantity - 1))
                        }
                        className="p-3 hover:bg-zinc-700 text-zinc-400"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-bold text-xl">
                        {bidQuantity}
                      </span>
                      <button
                        onClick={() => setBidQuantity(bidQuantity + 1)}
                        className="p-3 hover:bg-zinc-700 text-white"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-zinc-500">x</span>
                    {/* Face Select */}
                    <div className="flex gap-1 bg-zinc-800 p-1 rounded-lg border border-zinc-700 overflow-x-auto">
                      {[1, 2, 3, 4, 5, 6].map((face) => (
                        <button
                          key={face}
                          onClick={() => setBidFace(face)}
                          className={`p-2 rounded-md transition-all ${
                            bidFace === face
                              ? `${myTheme.bg} ${myTheme.color} shadow-lg`
                              : "hover:bg-zinc-700 text-zinc-500"
                          }`}
                        >
                          {React.createElement(DICE_ICONS[face], { size: 24 })}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={challenge}
                      disabled={!gameState.currentBid}
                      className="bg-red-900/80 hover:bg-red-800 disabled:opacity-50 disabled:bg-zinc-800 text-red-200 py-4 rounded-xl font-bold text-lg shadow-lg border border-red-700 flex items-center justify-center gap-2"
                    >
                      <Gavel size={20} /> LIAR!
                    </button>
                    <button
                      onClick={placeBid}
                      disabled={
                        gameState.currentBid &&
                        (bidQuantity < gameState.currentBid.quantity ||
                          (bidQuantity === gameState.currentBid.quantity &&
                            bidFace <= gameState.currentBid.face))
                      }
                      className={`col-span-2 ${myTheme.bg} border ${myTheme.border} ${myTheme.text} hover:opacity-80 disabled:opacity-50 disabled:bg-zinc-800 disabled:border-zinc-700 disabled:text-zinc-500 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2`}
                    >
                      <Megaphone size={20} /> Place Bid
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-zinc-500 animate-pulse py-8">
                  {gameState.turnState === "REVEAL"
                    ? "Waiting for all players to roll the dice..."
                    : `Waiting for ${
                        gameState.players[gameState.turnIndex]?.name
                      }...`}
                </div>
              )}
            </div>
          </div>
        </div>
        <GhostLogo />
      </div>
    );
  }

  return null;
}
