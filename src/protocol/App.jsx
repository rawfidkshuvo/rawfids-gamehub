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
  Shield,
  Crown,
  Crosshair,
  Sword,
  Zap,
  Users,
  Vote,
  Lock,
  Unlock,
  Eye,
  Terminal,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LogOut,
  BookOpen,
  History,
  X,
  User,
  RotateCcw,
  Home,
  Check,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Sparkles,
  Hammer,
  Copy,
  Loader,
  Play,
} from "lucide-react";
import CoverImage from "./assets/protocol_cover.png";

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

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "protocol-game";
const GAME_ID = "8";

// --- Game Constants ---
const MISSION_CONFIG = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
};

const SPY_COUNTS = {
  5: 2,
  6: 2,
  7: 3,
  8: 3,
  9: 3,
  10: 4,
};

// --- Sub-Components ---

const DICE_ICONS = {
  1: Crown,
  2: Shield,
  3: Crosshair,
  4: Sword,
  5: Eye,
  6: Zap,
  7: Vote,
  8: Lock,
  9: Unlock,
  10: Server,
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

const ProtocolLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Terminal size={12} className="text-cyan-500" />
    <span className="text-[10px] font-black tracking-widest text-cyan-500 uppercase">
      PROTOCOL
    </span>
  </div>
);

const ProtocolLogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Terminal size={22} className="text-cyan-500" />
    <span className="text-[20px] font-black tracking-widest text-cyan-500 uppercase">
      PROTOCOL
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
      <h3 className="text-xl font-bold text-white mb-2">Abort Protocol?</h3>
      <p className="text-gray-400 mb-6 text-sm">
        {isHost
          ? "WARNING: As Admin, terminating connection will shut down the server for all agents."
          : inGame
            ? "Leaving now will compromise the mission for everyone!"
            : "Disconnecting from the secure server."}
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onCancel}
          className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-bold transition-colors"
        >
          Stay Connected
        </button>
        {inGame && isHost && (
          <button
            onClick={onConfirmLobby}
            className="py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Home size={18} /> Return Unit to Lobby
          </button>
        )}
        <button
          onClick={onConfirmLeave}
          className="bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> {isHost ? "Shut Down Server" : "Disconnect"}
        </button>
      </div>
    </div>
  </div>
);

const LogViewer = ({ logs, onClose }) => (
  <div className="fixed top-16 right-4 w-64 max-h-60 bg-gray-900/95 border border-gray-700 rounded-xl z-155 overflow-y-auto p-2 shadow-2xl">
    <div className="bg-gray-800 w-full md:max-w-md h-full md:h-[70vh] rounded-none md:rounded-xl flex flex-col border-none md:border border-gray-700 shadow-2xl">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <History size={18} className="text-cyan-400" /> Server Logs
        </h3>
        <button
          onClick={onClose}
          className="p-2 bg-gray-700 rounded-full hover:bg-gray-600"
        >
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
                  : log.type === "warning"
                    ? "bg-yellow-900/20 border-yellow-500 text-yellow-200"
                    : "bg-gray-700/50 border-gray-500 text-gray-300"
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
    <div className="bg-gray-900 md:rounded-2xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-hidden border-none md:border border-cyan-500/30 flex flex-col">
      <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wider">
          <BookOpen className="text-cyan-400" /> Field Manual
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full text-gray-400"
        >
          <X />
        </button>
      </div>
      <div className="p-6 overflow-y-auto text-gray-300 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-cyan-900/10 p-4 rounded-lg border border-cyan-500/20">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">
              Operatives (Good)
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>You do NOT know who is who.</li>
              <li>
                Goal: Successfully complete <strong>3 Missions</strong>.
              </li>
              <li>Always vote to Approve trustworthy teams.</li>
              <li>
                If on a mission, you MUST play <strong>SUCCESS</strong>.
              </li>
            </ul>
          </div>
          <div className="bg-red-900/10 p-4 rounded-lg border border-red-500/20">
            <h3 className="text-xl font-bold text-red-400 mb-2">Moles (Bad)</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>You know who the other Moles are.</li>
              <li>
                Goal: Fail <strong>3 Missions</strong>.
              </li>
              <li>Deceive Operatives to get on mission teams.</li>
              <li>
                If on a mission, you can choose <strong>SUCCESS</strong> or{" "}
                <strong>SABOTAGE</strong>.
              </li>
            </ul>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-white mb-2">Game Flow</h3>
          <div className="space-y-2 text-sm">
            <p>
              <strong>1. Proposal:</strong> The Leader proposes a team for the
              current mission.
            </p>
            <p>
              <strong>2. Voting:</strong> Everyone votes to Approve or Reject
              the team. Majority rules.
            </p>
            <p>
              <strong>3. Mission:</strong> If approved, the team secretly
              executes the mission. One Sabotage usually fails the mission.
            </p>
            <p className="text-gray-500 italic">
              5 failed votes in a row = Immediate Mole Victory.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-160 flex items-center justify-center pointer-events-none">
    <div
      className={`
      flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl border-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] 
      transform transition-all animate-in fade-in zoom-in slide-in-from-bottom-10 duration-300
      backdrop-blur-md
      ${
        type === "success" ? "bg-cyan-900/90 border-cyan-500 text-cyan-100" : ""
      }
      ${type === "failure" ? "bg-red-900/90 border-red-500 text-red-100" : ""}
      ${type === "neutral" ? "bg-gray-800/90 border-gray-500 text-white" : ""}
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

// --- UPDATED SPLASH SCREEN (Zoom Effect + Button Timer) ---
const SplashScreen = ({ onStart }) => {
  const [hasSession, setHasSession] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [mounted, setMounted] = useState(false); // New state for image animation

  useEffect(() => {
    // 1. Trigger image zoom-out animation immediately
    setMounted(true);

    // 2. Check session
    const saved = localStorage.getItem("protocol_roomId");
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
export default function ProtocolGame() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("splash");

  const [roomId, setRoomId] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // UI States
  const [showRules, setShowRules] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [feedback, setFeedback] = useState(null);

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

  // 3. NEW FUNCTION: Handle Splash Button Click
  const handleSplashStart = () => {
    const savedRoomId = localStorage.getItem("protocol_roomId");

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

  // --- Session Restore ---
  // useEffect(() => {
  //   const savedRoomId = localStorage.getItem("protocol_roomId");
  //   if (savedRoomId) {
  //     setRoomId(savedRoomId);
  //     // We rely on the Room Sync useEffect to handle the view switching
  //   }
  // }, []);

  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          // Check if player is still in the room (in case they were kicked)
          if (!data.players.some((p) => p.id === user.uid)) {
            setRoomId("");
            setView("menu");
            localStorage.removeItem("protocol_roomId"); // Clear Session
            setError("Connection Terminated by Host.");
            return;
          }
          setGameState(data);

          if (data.status === "lobby") setView("lobby");
          else setView("game");

          // Handle Feedback Triggers based on log updates
          if (
            data.feedbackTrigger &&
            data.feedbackTrigger.id !== gameState?.feedbackTrigger?.id
          ) {
            setFeedback(data.feedbackTrigger);
            setTimeout(() => setFeedback(null), 2500);
          }
        } else {
          // If document doesn't exist, room was deleted (Host left)
          setRoomId("");
          setView("menu");
          localStorage.removeItem("protocol_roomId"); // Clear Session
          setError("Room Closed (Host Disconnected).");
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
    if (!playerName.trim()) return setError("Codename required.");
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
          role: null,
          isLeader: false,
          ready: true,
        },
      ],
      logs: [],
      missionHistory: [null, null, null, null, null],
      currentMissionIndex: 0,
      failedVoteCount: 0,
      leaderIndex: 0,
      turnState: "IDLE", // PICKING, VOTING, MISSION, FINISHED
      proposedTeam: [],
      votes: {},
      missionMoves: {},
      feedbackTrigger: null,
    };

    try {
      await setDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
        initialData,
      );
      localStorage.setItem("protocol_roomId", newId); // Save Session
      setRoomId(newId);
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
      if (data.status !== "lobby")
        throw new Error("Protocol already initiated.");
      if (data.players.length >= 10) throw new Error("Lobby full.");

      if (!data.players.find((p) => p.id === user.uid)) {
        await updateDoc(ref, {
          players: arrayUnion({
            id: user.uid,
            name: playerName,
            role: null,
            isLeader: false,
            ready: true,
          }),
        });
      }
      localStorage.setItem("protocol_roomId", roomCodeInput); // Save Session
      setRoomId(roomCodeInput);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const leaveRoom = async () => {
    if (!roomId) return;
    const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);
    try {
      if (gameState.hostId === user.uid) {
        // Host leaves -> Delete Room for Everyone
        await deleteDoc(ref);
      } else {
        // Guest leaves -> Remove self
        const updatedPlayers = gameState.players.filter(
          (p) => p.id !== user.uid,
        );
        await updateDoc(ref, { players: updatedPlayers });
      }
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("protocol_roomId"); // Clear Session
    setRoomId("");
    setView("menu");
    setShowLeaveConfirm(false);
  };

  const kickPlayer = async (playerIdToRemove) => {
    if (gameState.hostId !== user.uid) return;

    // Filter out the specific player
    const newPlayers = gameState.players.filter(
      (p) => p.id !== playerIdToRemove,
    );

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players: newPlayers },
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
    if (!gameState) return;
    const updatedPlayers = gameState.players.map((p) =>
      p.id === user.uid ? { ...p, ready: !p.ready } : p,
    );
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players: updatedPlayers },
    );
  };

  // --- Game Logic Functions ---

  const startGame = async () => {
    if (gameState.players.length < 5) return setError("Need 5+ Agents.");

    // 1. Shuffle the players to determine "Seating Order"
    const shuffledPlayers = [...gameState.players].sort(
      () => Math.random() - 0.5,
    );
    const playerCount = shuffledPlayers.length;
    const moleCount = SPY_COUNTS[playerCount] || 2;

    // 2. Create a pool of roles (e.g. ["MOLE", "MOLE", "OPERATIVE", "OPERATIVE"...])
    const rolePool = Array(playerCount).fill("OPERATIVE");
    for (let i = 0; i < moleCount; i++) {
      rolePool[i] = "MOLE";
    }

    // 3. Shuffle the ROLES separately
    const shuffledRoles = rolePool.sort(() => Math.random() - 0.5);

    // 4. Assign the shuffled roles to the shuffled players
    const playersWithRoles = shuffledPlayers.map((p, i) => ({
      ...p,
      role: shuffledRoles[i], // Assign random role
      isLeader: i === 0, // First player is leader, but their role is now random
      ready: false,
    }));

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "game",
        players: playersWithRoles,
        leaderIndex: 0,
        currentMissionIndex: 0,
        failedVoteCount: 0,
        turnState: "PICKING",
        proposedTeam: [],
        votes: {},
        missionMoves: {},
        missionHistory: [null, null, null, null, null],
        logs: [
          {
            id: Date.now().toString(),
            text: "Protocol Initiated. Roles Assigned.",
            type: "neutral",
          },
        ],
      },
    );
  };

  const toggleTeamSelection = async (targetId) => {
    if (gameState.turnState !== "PICKING") return;
    const currentTeam = gameState.proposedTeam || [];
    const missionSize =
      MISSION_CONFIG[gameState.players.length][gameState.currentMissionIndex];

    let newTeam;
    if (currentTeam.includes(targetId)) {
      newTeam = currentTeam.filter((id) => id !== targetId);
    } else {
      if (currentTeam.length >= missionSize) return;
      // Max size reached
      newTeam = [...currentTeam, targetId];
    }

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        proposedTeam: newTeam,
      },
    );
  };

  const confirmTeam = async () => {
    const missionSize =
      MISSION_CONFIG[gameState.players.length][gameState.currentMissionIndex];
    if (gameState.proposedTeam.length !== missionSize) return;

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        turnState: "VOTING",
        votes: {},
        logs: arrayUnion({
          id: Date.now().toString(),
          text: "Team proposed. Voting initiated.",
          type: "neutral",
        }),
      },
    );
  };

  const submitVote = async (approve) => {
    const newVotes = { ...gameState.votes, [user.uid]: approve };
    // Check if everyone voted
    if (Object.keys(newVotes).length === gameState.players.length) {
      // Tally
      const approves = Object.values(newVotes).filter((v) => v).length;
      const rejects = Object.values(newVotes).filter((v) => !v).length;
      const passed = approves > rejects;

      let updates = { votes: newVotes };
      let logs = [
        {
          id: Date.now().toString(),
          text: `Vote Result: ${approves} Approves, ${rejects} Rejects.`,
          type: passed ? "success" : "danger",
        },
      ];
      if (passed) {
        updates.turnState = "MISSION";
        updates.missionMoves = {};
        updates.failedVoteCount = 0;
        updates.feedbackTrigger = {
          id: Date.now(),
          type: "success",
          message: "APPROVED",
          subtext: "Mission Team is Go",
        };
        logs.push({
          id: Date.now() + 1,
          text: "Mission started. Operatives must act.",
          type: "neutral",
        });
      } else {
        // Failed Vote Logic
        const nextFailCount = gameState.failedVoteCount + 1;
        if (nextFailCount >= 5) {
          updates.status = "finished";
          updates.winner = "MOLES";
          updates.feedbackTrigger = {
            id: Date.now(),
            type: "failure",
            message: "CHAOS",
            subtext: "Moles Win via Chaos",
          };
          logs.push({
            id: Date.now() + 1,
            text: "5 Failed Votes. System Collapse. Moles Win.",
            type: "danger",
          });
        } else {
          // Next Leader
          const nextLeaderIdx =
            (gameState.leaderIndex + 1) % gameState.players.length;
          const nextLeaderId = gameState.players[nextLeaderIdx].id;
          const updatedPlayers = gameState.players.map((p) => ({
            ...p,
            isLeader: p.id === nextLeaderId,
          }));
          updates.turnState = "PICKING";
          updates.proposedTeam = [];
          updates.failedVoteCount = nextFailCount;
          updates.leaderIndex = nextLeaderIdx;
          updates.players = updatedPlayers;
          updates.feedbackTrigger = {
            id: Date.now(),
            type: "failure",
            message: "REJECTED",
            subtext: "Leadership Rotates",
          };
        }
      }
      updates.logs = arrayUnion(...logs);
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        updates,
      );
    } else {
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          votes: newVotes,
        },
      );
    }
  };

  const submitMissionMove = async (move) => {
    // move is 'SUCCESS' or 'SABOTAGE'
    const newMoves = { ...gameState.missionMoves, [user.uid]: move };
    const teamSize = gameState.proposedTeam.length;

    if (Object.keys(newMoves).length === teamSize) {
      // Resolve Mission
      const sabotages = Object.values(newMoves).filter(
        (m) => m === "SABOTAGE",
      ).length;
      // Special rule for Mission 4 in 7+ players (usually requires 2 fails)
      // Simplifying for this demo: Standard rule (1 fail = fail) unless specifically coded
      const playersCount = gameState.players.length;
      const missionIdx = gameState.currentMissionIndex;
      let requiresTwoFails = playersCount >= 7 && missionIdx === 3;

      const isSuccess = requiresTwoFails ? sabotages < 2 : sabotages === 0;

      const newHistory = [...gameState.missionHistory];
      newHistory[missionIdx] = isSuccess;
      let logs = [
        {
          id: Date.now().toString(),
          text: `Mission ${
            missionIdx + 1
          } Report: ${sabotages} Sabotage(s). result: ${
            isSuccess ? "SUCCESS" : "FAILURE"
          }`,
          type: isSuccess ? "success" : "danger",
        },
      ];
      let updates = {
        missionHistory: newHistory,
        missionMoves: newMoves, // Saved but not shown in UI logic usually
      };
      const successCount = newHistory.filter((r) => r === true).length;
      const failCount = newHistory.filter((r) => r === false).length;
      if (successCount >= 3) {
        updates.status = "finished";
        updates.winner = "OPERATIVES";
        updates.feedbackTrigger = {
          id: Date.now(),
          type: "success",
          message: "VICTORY",
          subtext: "Operatives secured the Protocol",
        };
        logs.push({
          id: Date.now() + 1,
          text: "Operatives Win!",
          type: "success",
        });
      } else if (failCount >= 3) {
        updates.status = "finished";
        updates.winner = "MOLES";
        updates.feedbackTrigger = {
          id: Date.now(),
          type: "failure",
          message: "DEFEAT",
          subtext: "Moles corrupted the Protocol",
        };
        logs.push({
          id: Date.now() + 1,
          text: "Moles Win!",
          type: "danger",
        });
      } else {
        // Next Round
        const nextLeaderIdx =
          (gameState.leaderIndex + 1) % gameState.players.length;
        const nextLeaderId = gameState.players[nextLeaderIdx].id;
        const updatedPlayers = gameState.players.map((p) => ({
          ...p,
          isLeader: p.id === nextLeaderId,
        }));
        updates.currentMissionIndex = gameState.currentMissionIndex + 1;
        updates.turnState = "PICKING";
        updates.proposedTeam = [];
        updates.votes = {};
        updates.failedVoteCount = 0;
        updates.leaderIndex = nextLeaderIdx;
        updates.players = updatedPlayers;

        if (!updates.feedbackTrigger) {
          updates.feedbackTrigger = isSuccess
            ? {
                id: Date.now(),
                type: "success",
                message: "SUCCESS",
                subtext: `${sabotages} Sabotage detected`,
              }
            : {
                id: Date.now(),
                type: "failure",
                message: "FAILURE",
                subtext: `${sabotages} Sabotage detected`,
              };
        }
      }

      updates.logs = arrayUnion(...logs);
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        updates,
      );
    } else {
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          missionMoves: newMoves,
        },
      );
    }
  };

  const returnToLobby = async () => {
    const resetPlayers = gameState.players.map((p) => ({
      ...p,
      role: null,
      isLeader: false,
      ready: true,
    }));
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        players: resetPlayers,
        logs: [],
        missionHistory: [null, null, null, null, null],
        currentMissionIndex: 0,
        failedVoteCount: 0,
        votes: {},
        missionMoves: {},
        turnState: "IDLE",
        feedbackTrigger: null,
        winner: null,
      },
    );
  };

  // --- Views ---


  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <ProtocolLogoBig />
        <div className="bg-orange-500/10 p-8 rounded-2xl border border-orange-500/30">
          <Hammer
            size={64}
            className="text-orange-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
          <p className="text-gray-400">
            System Reboot Initiated. Access denied to all personnel.
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
        <ProtocolLogo />
      </div>
    );
  }

  if (!user)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-cyan-500 animate-pulse">
        Establishing Secure Connection...
      </div>
    );

  // RECONNECTING STATE
  if (roomId && !gameState && !error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4">
        <FloatingBackground />
        <div className="bg-zinc-900/80 backdrop-blur p-8 rounded-2xl border border-zinc-700 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <Loader size={48} className="text-cyan-500 animate-spin" />
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
            className="flex items-center gap-2 text-cyan-800 rounded-lg 
			font-bold shadow-md hover:text-cyan-400 transition-colors w-fit animate-pulse"
          >
            {/* Arrow Icon */}
            <StepBack />
            <span>Back to Gamehub</span>
          </a>
        </nav>
        {/* --- END OF BACK BUTTON --- */}
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}

        <div className="z-10 text-center mb-10">
          <Server
            size={64}
            className="text-cyan-500 mx-auto mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
          />
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-linear-to-b from-cyan-400 to-blue-600 font-serif tracking-widest drop-shadow-md">
            PROTOCOL
          </h1>
          <p className="text-white-400/60 tracking-[0.3em] uppercase mt-2">
            Trust No One
          </p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur border border-cyan-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 animate-in slide-in-from-bottom-10 duration-700 delay-100">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm border border-red-800">
              {error}
            </div>
          )}

          <input
            className="w-full bg-black/50 border border-gray-600 p-3 rounded mb-4 text-white placeholder-gray-500 focus:border-cyan-500 outline-none transition-colors font-mono"
            placeholder="CODENAME"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-linear-to-r from-cyan-700 to-blue-600 hover:from-cyan-600 hover:to-blue-500 p-4 rounded font-bold mb-4 flex items-center justify-center gap-2 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all"
          >
            <Zap size={20} /> Initialize Protocol
          </button>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              className="w-full sm:flex-1 bg-black/50 border border-gray-600 p-3 rounded text-white placeholder-gray-500 uppercase font-mono tracking-wider focus:border-cyan-500 outline-none"
              placeholder="ACCESS CODE"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 border border-gray-600 px-6 py-3 rounded font-bold transition-colors"
            >
              Enter
            </button>
          </div>

          <button
            onClick={() => setShowRules(true)}
            className="w-full text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 py-2"
          >
            <BookOpen size={16} /> Field Manual
          </button>
        </div>
        <div className="absolute bottom-4 text-slate-600 text-xs text-center">
          Inspired by The Resistance: Avalon. A tribute game.
          <br />
          Developed by <strong>RAWFID K SHUVO</strong>. Visit{" "}
          <a
            href={import.meta.env.BASE_URL}
            //target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-500 underline hover:text-cyan-600"
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
        <ProtocolLogoBig />
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirmLeave={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={isHost}
            inGame={false}
          />
        )}

        <div className="z-10 w-full max-w-lg bg-gray-900/90 backdrop-blur p-8 rounded-2xl border border-cyan-900/50 shadow-2xl mb-4">
          <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
            {/* Grouping Title and Copy Button together on the left */}
            <div>
              <h2 className="text-lg md:text-xl text-cyan-500 font-bold uppercase">
                Sabotage Code
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
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-cyan-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg animate-fade-in-up whitespace-nowrap">
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

          <div className="bg-black/20 rounded-xl p-4 mb-8 border border-gray-800">
            <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-4 flex justify-between">
              <span>Units ({gameState.players.length})</span>
            </h3>
            <div className="space-y-2">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-gray-800/50 p-3 rounded border border-gray-700/50"
                >
                  <span
                    className={`font-bold flex items-center gap-2 ${
                      p.id === user.uid ? "text-cyan-400" : "text-gray-300"
                    }`}
                  >
                    <User size={14} /> {p.name}{" "}
                    {p.id === gameState.hostId && (
                      <Crown size={14} className="text-yellow-500" />
                    )}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-xs flex items-center gap-1">
                      <CheckCircle size={12} /> Connected
                    </span>
                    {isHost && p.id !== user.uid && (
                      <button
                        onClick={() => kickPlayer(p.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                        title="Kick Unit"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {gameState.players.length < 5 && (
                <div className="text-center text-gray-500 italic text-sm py-2">
                  Waiting for 5+ units...
                </div>
              )}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={startGame}
              disabled={gameState.players.length < 5}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                gameState.players.length >= 5
                  ? "bg-green-700 hover:bg-green-600 text-white shadow-green-900/20"
                  : "bg-gray-800 cursor-not-allowed text-gray-500"
              }`}
            >
              {gameState.players.length < 5
                ? "Need more Agents..."
                : "Execute Protocol"}
            </button>
          ) : (
            <div className="text-center text-cyan-400/60 animate-pulse font-serif italic">
              Waiting for Admin command...
            </div>
          )}
        </div>
        <ProtocolLogo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const me = gameState.players.find((p) => p.id === user.uid);
    const isLeader = me.isLeader;
    const myRole = me.role; // "OPERATIVE" or "MOLE"

    // Calculate Mission Status
    const missionSize =
      MISSION_CONFIG[gameState.players.length]?.[
        gameState.currentMissionIndex
      ] || 0;
    const hammer = 5 - gameState.failedVoteCount;

    // Identify Moles (if I am one)
    const moles = gameState.players.filter((p) => p.role === "MOLE");
    const iAmMole = myRole === "MOLE";

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden font-sans">
        <FloatingBackground />

        {/* Overlays */}
        {feedback && (
          <FeedbackOverlay
            type={feedback.type}
            message={feedback.message}
            subtext={feedback.subtext}
            icon={feedback.type === "success" ? CheckCircle : AlertTriangle}
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
        <div className="h-14 bg-gray-900/80 border-b border-gray-800 flex items-center justify-between px-4 z-50 backdrop-blur-md sticky top-0">
          <div className="flex items-center gap-2">
            <span className="font-serif text-cyan-500 font-bold tracking-wider hidden md:block">
              PROTOCOL
            </span>
            <span className="text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">
              Sabotage Hall
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRules(true)}
              className="p-2 hover:bg-gray-800 rounded text-gray-400"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`p-2 rounded-full ${
                showLogs
                  ? "bg-cyan-900 text-cyan-400"
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
        <div className="flex-1 p-2 md:p-4 flex flex-col items-center relative z-10 max-w-6xl mx-auto w-full gap-4">
          {/* Mission Tracker */}
          <div className="w-full max-w-2xl bg-gray-900/80 p-3 rounded-xl border border-gray-700 flex justify-between items-center gap-2">
            {gameState.missionHistory.map((res, i) => {
              const size = MISSION_CONFIG[gameState.players.length]?.[i] || "?";
              const active = i === gameState.currentMissionIndex;
              return (
                <div
                  key={i}
                  className={`
                                flex-1 h-16 rounded-lg flex flex-col items-center justify-center border-2 transition-all
                                ${
                                  active
                                    ? "border-yellow-400 bg-yellow-900/20 scale-105"
                                    : "border-gray-700 bg-gray-800"
                                }
                                ${
                                  res === true
                                    ? "bg-cyan-600 border-cyan-400"
                                    : ""
                                }
                                ${
                                  res === false
                                    ? "bg-red-600 border-red-400"
                                    : ""
                                }
                            `}
                >
                  {res === null ? (
                    <>
                      <span
                        className={`text-lg font-bold ${
                          active ? "text-yellow-400" : "text-gray-500"
                        }`}
                      >
                        {size}
                      </span>
                      <span className="text-[9px] text-gray-500 uppercase">
                        Agents
                      </span>
                    </>
                  ) : res ? (
                    <CheckCircle className="text-white" />
                  ) : (
                    <XCircle className="text-white" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Status Bar */}
          <div className="flex gap-4 text-xs font-bold uppercase tracking-widest text-gray-400">
            <div className="flex items-center gap-1">
              <Vote
                size={14}
                className={
                  gameState.failedVoteCount > 3
                    ? "text-red-500"
                    : "text-gray-500"
                }
              />
              Fails:{" "}
              <span className="text-white">{gameState.failedVoteCount}/5</span>
            </div>
          </div>

          {/* Player Grid */}
          <div className="flex gap-3 justify-center flex-wrap w-full my-4">
            {gameState.players.map((p) => {
              const isSelected = gameState.proposedTeam?.includes(p.id);
              const isLeaderP = p.isLeader;
              const voted =
                gameState.votes && gameState.votes[p.id] !== undefined;
              const lastVote = gameState.votes?.[p.id];
              const showVote = gameState.turnState !== "VOTING" && voted; // Reveal after voting phase

              // Spy Vis: If I am mole, highlight other moles
              const isKnownMole =
                iAmMole && p.role === "MOLE" && p.id !== user.uid;

              return (
                <div
                  key={p.id}
                  onClick={() =>
                    isLeader && gameState.turnState === "PICKING"
                      ? toggleTeamSelection(p.id)
                      : null
                  }
                  className={`
                                    relative bg-gray-900/90 p-3 rounded-xl border-2 w-32 md:w-40 transition-all cursor-pointer flex flex-col items-center
                                    ${
                                      isLeaderP
                                        ? "border-yellow-500 shadow-yellow-900/20 shadow-lg"
                                        : "border-gray-700"
                                    }
                                    ${
                                      isSelected
                                        ? "ring-2 ring-cyan-400 bg-cyan-900/30"
                                        : ""
                                    }
                                `}
                >
                  <div className="absolute top-1 right-1">
                    {isLeaderP && (
                      <Crown size={12} className="text-yellow-500" />
                    )}
                    {isKnownMole && <Eye size={12} className="text-red-500" />}
                  </div>

                  <User
                    size={24}
                    className={
                      p.id === user.uid ? "text-cyan-400" : "text-gray-500"
                    }
                  />
                  <span
                    className={`font-bold text-sm truncate w-full text-center mt-1 ${
                      p.id === user.uid ? "text-cyan-200" : "text-gray-300"
                    }`}
                  >
                    {p.name}
                  </span>

                  {/* Status Indicator */}
                  <div className="mt-2 h-4 flex items-center justify-center w-full">
                    {gameState.turnState === "VOTING" && voted && (
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
                    )}
                    {showVote &&
                      (lastVote ? (
                        <ThumbsUp size={12} className="text-green-400" />
                      ) : (
                        <ThumbsDown size={12} className="text-red-400" />
                      ))}
                    {gameState.turnState === "MISSION" &&
                      gameState.proposedTeam.includes(p.id) &&
                      (gameState.missionMoves[p.id] ? (
                        <Check size={12} className="text-cyan-400" />
                      ) : (
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" />
                      ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Interaction Area */}
          <div
            className={`w-full max-w-2xl bg-gray-900/95 p-4 rounded-t-3xl border-t border-cyan-500/30 backdrop-blur-md mt-auto shadow-2xl z-20`}
          >
            {/* Role Info */}
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-lg ${
                    myRole === "MOLE"
                      ? "bg-red-900/20 border border-red-500"
                      : "bg-cyan-900/20 border border-cyan-500"
                  }`}
                >
                  {myRole === "MOLE" ? (
                    <AlertTriangle size={20} className="text-red-400" />
                  ) : (
                    <Shield size={20} className="text-cyan-400" />
                  )}
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Your Role
                  </div>
                  <div
                    className={`font-black text-xl ${
                      myRole === "MOLE" ? "text-red-400" : "text-cyan-400"
                    }`}
                  >
                    {myRole}
                  </div>
                </div>
              </div>
              {myRole === "MOLE" && (
                <div className="text-right">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Fellow Moles
                  </div>
                  <div className="text-red-300 text-xs font-bold">
                    {moles.map((m) => m.name).join(", ")}
                  </div>
                </div>
              )}
            </div>

            {/* Action Controls */}
            <div className="min-h-[80px] flex items-center justify-center">
              {gameState.status === "finished" ? (
                <div className="w-full text-center">
                  <h3
                    className={`text-2xl font-black mb-4 ${
                      gameState.winner === "OPERATIVES"
                        ? "text-cyan-400"
                        : "text-red-500"
                    }`}
                  >
                    {gameState.winner} WIN
                  </h3>

                  {/* Readiness Status Grid */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {gameState.players.map((p) => (
                      <div
                        key={p.id}
                        className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold border ${
                          p.ready
                            ? "bg-green-900/30 border-green-500 text-green-400"
                            : "bg-gray-800 border-gray-600 text-gray-500"
                        }`}
                      >
                        {p.name} {p.ready && "✓"}
                      </div>
                    ))}
                  </div>

                  {gameState.hostId === user.uid ? (
                    <div className="flex flex-col gap-2">
                      {/* Host Controls - Disabled until everyone is ready */}
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={startGame}
                          disabled={!gameState.players.every((p) => p.ready)}
                          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold text-white flex gap-2 items-center"
                        >
                          <RotateCcw size={18} /> Restart
                        </button>
                        <button
                          onClick={returnToLobby}
                          disabled={!gameState.players.every((p) => p.ready)}
                          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold text-white flex gap-2 items-center"
                        >
                          <Home size={18} /> Lobby
                        </button>
                      </div>
                      {!gameState.players.every((p) => p.ready) && (
                        <span className="text-xs text-gray-500 animate-pulse mt-2">
                          Waiting for all agents to report ready...
                        </span>
                      )}
                      {!me.ready && (
                        <button
                          onClick={toggleReady}
                          className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 underline"
                        >
                          Mark Self Ready
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-full">
                      {/* Guest Ready Button */}
                      <button
                        onClick={toggleReady}
                        className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg transition-all mb-2 ${
                          me.ready
                            ? "bg-green-600/20 border border-green-500 text-green-400"
                            : "bg-cyan-700 hover:bg-cyan-600 text-white"
                        }`}
                      >
                        {me.ready ? "READY - STANDING BY" : "MARK READY"}
                      </button>
                      <div className="text-gray-500 italic text-xs">
                        Waiting for Host command...
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {gameState.turnState === "PICKING" &&
                    (isLeader ? (
                      <div className="w-full">
                        <div className="text-center text-gray-400 text-sm mb-2">
                          Select {missionSize} Agents for the Mission
                        </div>
                        <button
                          onClick={confirmTeam}
                          disabled={
                            gameState.proposedTeam?.length !== missionSize
                          }
                          className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-30 disabled:cursor-not-allowed text-black py-4 rounded-xl font-bold text-lg shadow-lg"
                        >
                          PROPOSE TEAM
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 animate-pulse">
                        Leader is selecting a team...
                      </div>
                    ))}

                  {gameState.turnState === "VOTING" &&
                    (gameState.votes[user.uid] === undefined ? (
                      <div className="flex gap-4 w-full">
                        <button
                          onClick={() => submitVote(true)}
                          className="flex-1 bg-gray-800 hover:bg-gray-700 border-2 border-green-500/50 py-4 rounded-xl text-green-400 font-bold flex flex-col items-center gap-1"
                        >
                          <ThumbsUp /> APPROVE
                        </button>
                        <button
                          onClick={() => submitVote(false)}
                          className="flex-1 bg-gray-800 hover:bg-gray-700 border-2 border-red-500/50 py-4 rounded-xl text-red-400 font-bold flex flex-col items-center gap-1"
                        >
                          <ThumbsDown /> REJECT
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        Vote Registered. Waiting for others...
                      </div>
                    ))}

                  {gameState.turnState === "MISSION" &&
                    (gameState.proposedTeam.includes(user.uid) ? (
                      gameState.missionMoves[user.uid] ? (
                        <div className="text-center text-cyan-400 font-bold">
                          Mission Move Locked In.
                        </div>
                      ) : (
                        <div className="flex gap-4 w-full">
                          <button
                            onClick={() => submitMissionMove("SUCCESS")}
                            className="flex-1 bg-linear-to-br from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-cyan-900/20"
                          >
                            SUCCESS
                          </button>
                          {myRole === "MOLE" && (
                            <button
                              onClick={() => submitMissionMove("SABOTAGE")}
                              className="flex-1 bg-linear-to-br from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-900/20"
                            >
                              SABOTAGE
                            </button>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="text-center text-gray-500 animate-pulse">
                        Mission in progress...
                      </div>
                    ))}
                </>
              )}
            </div>
          </div>
        </div>
        <ProtocolLogo />
      </div>
    );
  }

  return null;
}
