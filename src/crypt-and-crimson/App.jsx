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
  Skull,
  Flower,
  EyeOff,
  AlertTriangle,
  Crown,
  X,
  StepBack,
  Play,
  RotateCcw,
  Copy,
  CheckCircle,
  Trash2,
  LogOut,
  Hammer,
  BookOpen,
  History,
  ShieldAlert,
  Swords,
  Loader
} from "lucide-react";
import CoverImage from "./assets/skull.png";

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

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "crypt-crimson-game";
const GAME_ID = "22";

// ---------------------------------------------------------------------------
// STYLES & VISUALS
// ---------------------------------------------------------------------------
const GlobalStyles = () => (
  <style>{`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(225, 29, 72, 0.3); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(225, 29, 72, 0.6); }
    
    @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(3deg); } }
    .animate-float { animation: float infinite ease-in-out; }
    
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-spin-slow { animation: spin-slow 15s linear infinite; }
    
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    @keyframes pulse-red {
      0%, 100% { box-shadow: 0 0 15px rgba(225, 29, 72, 0.2); }
      50% { box-shadow: 0 0 30px rgba(225, 29, 72, 0.6); }
    }
    .animate-pulse-red { animation: pulse-red 2s ease-in-out infinite; }
  `}</style>
);

const FloatingBackground = React.memo(() => {
  const backgroundIcons = React.useMemo(() => {
    const icons = [Skull, Flower, ShieldAlert];
    return [...Array(15)].map((_, i) => {
      const Icon = icons[i % icons.length];
      return (
        <div
          key={i}
          className="absolute animate-float text-rose-900/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${12 + Math.random() * 15}s`,
            transform: `scale(${0.8 + Math.random()})`,
          }}
        >
          <Icon size={48} />
        </div>
      );
    });
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-black" />
      <div className="absolute top-0 left-0 w-full h-full opacity-40">
        {backgroundIcons}
      </div>
    </div>
  );
});

const GameLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Flower size={12} className="text-rose-500" />
    <span className="text-[10px] font-black tracking-widest text-rose-400 uppercase">
      CRYPT & CRIMSON
    </span>
  </div>
);

const GameLogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Flower size={20} className="text-rose-500" />
    <span className="text-[20px] font-black tracking-widest text-rose-500 uppercase">
      CRYPT & CRIMSON
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// GAME LOGIC HELPERS & COMPONENTS
// ---------------------------------------------------------------------------
const PLAYER_COLORS = [
  { bg: "bg-rose-600", matBg: "bg-rose-600/20", border: "border-rose-500", fill: "#e11d48", text: "text-rose-500" },
  { bg: "bg-indigo-600", matBg: "bg-indigo-600/20", border: "border-indigo-500", fill: "#4f46e5", text: "text-indigo-500" },
  { bg: "bg-emerald-600", matBg: "bg-emerald-600/20", border: "border-emerald-500", fill: "#10b981", text: "text-emerald-500" },
  { bg: "bg-amber-600", matBg: "bg-amber-600/20", border: "border-amber-500", fill: "#d97706", text: "text-amber-500" },
  { bg: "bg-fuchsia-600", matBg: "bg-fuchsia-600/20", border: "border-fuchsia-500", fill: "#c026d3", text: "text-fuchsia-500" },
  { bg: "bg-cyan-600", matBg: "bg-cyan-600/20", border: "border-cyan-500", fill: "#0891b2", text: "text-cyan-500" },
];

const INITIAL_HAND = ["ROSE", "ROSE", "ROSE", "SKULL"];

const triggerLog = (text, type = "neutral", important = false, title = "") => ({
  text, type, important, title, id: Date.now() + Math.random()
});

const getNextActivePlayer = (players, currentIndex) => {
  let next = (currentIndex + 1) % players.length;
  let loops = 0;
  while ((players[next].isEliminated || players[next].passed) && loops < players.length) {
    next = (next + 1) % players.length;
    loops++;
  }
  return next;
};

// Universal Disc Component adapting to Player Color
const Disc = ({ type, pColor, size = "md", isFaceDown = false, isGrayscale = false }) => {
  // Using responsive classes to handle sizing natively
  const sizeClasses = 
    size === "sm" ? "w-6 h-6 sm:w-8 sm:h-8 border-2" : 
    size === "lg" ? "w-16 h-16 sm:w-20 sm:h-20 border-[3px] sm:border-4" : 
    "w-12 h-12 sm:w-16 sm:h-16 border-[3px] sm:border-4"; // md default
  
  if (isFaceDown) {
      return (
        <div className={`${sizeClasses} rounded-full flex items-center justify-center bg-zinc-800 ${pColor.border} border-dashed opacity-90 shadow-md`}>
           <ShieldAlert className="w-1/2 h-1/2 text-zinc-600" />
        </div>
      );
  }
  
  return (
      <div className={`${sizeClasses} rounded-full flex items-center justify-center shadow-lg transition-all ${isGrayscale ? "grayscale opacity-40" : ""}
          ${type === "SKULL" ? `bg-black ${pColor.border}` : `${pColor.bg} border-white/40`}
      `}>
          {type === "SKULL" ? <Skull className={`w-3/5 h-3/5 ${pColor.text}`} /> : <Flower className="w-3/5 h-3/5 text-white/90" />}
      </div>
  )
}

// ---------------------------------------------------------------------------
// SUBCOMPONENTS (Modals & UI)
// ---------------------------------------------------------------------------
const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
    <div className={`flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl border-4 shadow-2xl backdrop-blur-xl max-w-sm md:max-w-xl mx-4 text-center ${
        type === "success" ? "bg-emerald-900/90 border-emerald-500 text-emerald-100" :
        type === "failure" ? "bg-rose-900/90 border-rose-500 text-rose-100" :
        "bg-amber-900/90 border-amber-500 text-amber-100"
      }`}
    >
      {Icon && <div className="mb-4 p-4 bg-black/20 rounded-full"><Icon size={64} className="animate-bounce" /></div>}
      <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest drop-shadow-md mb-2">{message}</h2>
      {subtext && <p className="text-lg md:text-xl font-bold opacity-90 tracking-wide">{subtext}</p>}
    </div>
  </div>
);

const RulesModal = ({ onClose }) => (
  <div className="fixed inset-0 z-[200] bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-4">
    <div className="bg-zinc-900 border border-rose-900/50 w-full max-w-3xl rounded-3xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors">
        <X size={24} className="text-white" />
      </button>
      <h2 className="text-3xl font-black text-center mb-6 text-rose-500">How to Play</h2>
      <div className="space-y-6 text-sm text-zinc-300">
        <section>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Swords className="text-rose-500" /> Objective</h3>
          <p className="bg-zinc-800 p-4 rounded-xl border border-rose-900/30">
            Win two rounds to be crowned the victor, or be the last player standing. Every player starts with 3 Roses and 1 Skull.
          </p>
        </section>
        <section>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><EyeOff className="text-rose-500" /> The Phases</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-800 p-4 rounded-xl border border-rose-900/30">
              <strong className="text-rose-400 block mb-1">1. Placement</strong>
              <p className="text-xs">Take turns placing one disc face down on your mat. Once everyone has at least one disc down, you can either place another disc OR start a Bid.</p>
            </div>
            <div className="bg-zinc-800 p-4 rounded-xl border border-rose-900/30">
              <strong className="text-rose-400 block mb-1">2. Bidding</strong>
              <p className="text-xs">Claim how many total discs you can flip across the table WITHOUT revealing a Skull. Once a bid is placed, no more discs can be added. Players must raise the bid or Pass.</p>
            </div>
            <div className="bg-zinc-800 p-4 rounded-xl md:col-span-2 border border-rose-900/30">
              <strong className="text-rose-400 block mb-1">3. The Reveal</strong>
              <p className="text-xs mb-2">The highest bidder becomes the Challenger. They must flip exactly their bid number of discs, obeying one strict rule:</p>
              <ul className="list-disc pl-4 text-xs space-y-1 font-bold text-rose-300">
                <li>You MUST flip all of your own played discs first.</li>
                <li>Once yours are flipped, you may flip the top disc of any opponent's stack, one by one.</li>
              </ul>
            </div>
          </div>
        </section>
        <section>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Skull className="text-rose-500" /> Survival</h3>
          <p className="bg-zinc-800 p-4 rounded-xl border border-rose-900/30">
            If you reveal a Skull, your challenge immediately fails, and you must destroy one of your discs permanently. If you lose all your discs, you are eliminated!
          </p>
        </section>
      </div>
      <div className="mt-8 flex flex-col items-center gap-2">
        <button onClick={onClose} className="px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all bg-gradient-to-br from-rose-700 to-rose-900 text-white hover:from-rose-600 hover:to-rose-800 hover:scale-105">
          Return to Game
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
    const saved = localStorage.getItem("crypt_roomId");
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
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-rose-500/50">
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
            className="group relative px-12 py-5 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/50 hover:border-rose-400 text-rose-300 font-black text-2xl tracking-widest rounded-none transform transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] backdrop-blur-md overflow-hidden"
          >
            {/* Animated Scanline overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-400/10 to-transparent translate-y-[-100%] animate-[scan_2s_infinite_linear]" />

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
        Inspired by Skull. A tribute game.
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
export default function CryptGame() {
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

  const [bidAmount, setBidAmount] = useState(1);

  // Gamehub Maintenance Listener
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
        const savedName = localStorage.getItem("gameHub_playerName") || localStorage.getItem("crypt_playerName");
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
          setRoomId(""); localStorage.removeItem("crypt_roomId"); setView("menu"); setError("You have been banished."); return;
        }
        setGameState(data);
        if (data.status === "playing" || data.status === "finished") setView("game");
        else if (data.status === "lobby") setView("lobby");
      } else {
        setView("menu"); setRoomId(""); localStorage.removeItem("crypt_roomId"); setError("The crypt has collapsed.");
      }
    }, (err) => { console.error(err); setError("Connection lost."); });
    return () => unsub();
  }, [roomId, user]);

  const handleSplashStart = () => {
    const savedRoomId = localStorage.getItem("crypt_roomId");
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
        icon: latestLog.type === "success" ? Flower : (latestLog.type === "failure" ? Skull : AlertTriangle),
      });
      setTimeout(() => setFeedback(null), 2500);
    }
  }, [gameState?.logs]);

  useEffect(() => {
    if (gameState && gameState.turnPhase === "BIDDING") setBidAmount(gameState.currentBid + 1);
  }, [gameState?.currentBid, gameState?.turnPhase]);

  // ---------------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------------
  const createRoom = async () => {
    if (!playerName) return setError("Enter Name");
    localStorage.setItem("gameHub_playerName", playerName); localStorage.setItem("crypt_playerName", playerName); setLoading(true);
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const initialData = {
      roomId: newId, hostId: user.uid, status: "lobby",
      players: [{ id: user.uid, name: playerName, colorIdx: 0, score: 0, hand: [], played: [], discarded: [], passed: false, isEliminated: false }],
      turnIndex: 0, turnPhase: "PLAY", currentBid: 0, highestBidder: null, cardsToReveal: 0, starterId: user.uid, discardingPlayer: null, logs: []
    };
    try {
      await setDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId), initialData);
      setRoomId(newId); localStorage.setItem("crypt_roomId", newId);
    } catch (e) { setError("Failed to open the crypt."); }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCode || !playerName) return setError("Enter details");
    localStorage.setItem("gameHub_playerName", playerName); localStorage.setItem("crypt_playerName", playerName); setLoading(true);
    try {
      const code = roomCode.toUpperCase().trim();
      const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", code);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data().status === "lobby") {
        const data = snap.data();
        if (!data.players.some((p) => p.id === user.uid)) {
          if (data.players.length >= 6) { setError("The crypt is full."); setLoading(false); return; }
          const newPlayers = [...data.players, { id: user.uid, name: playerName, colorIdx: data.players.length, score: 0, hand: [], played: [], discarded: [], passed: false, isEliminated: false }];
          await updateDoc(ref, { players: newPlayers });
        }
        setRoomId(code); localStorage.setItem("crypt_roomId", code);
      } else setError("Crypt not found or rituals have begun.");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const startGame = async () => {
    const players = gameState.players.map(p => ({
      ...p, score: 0, hand: [...INITIAL_HAND].sort(() => Math.random() - 0.5), played: [], discarded: [], passed: false, isEliminated: false
    }));
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      status: "playing", players, turnIndex: 0, turnPhase: "PLAY", currentBid: 0, highestBidder: null, cardsToReveal: 0, starterId: players[0].id, discardingPlayer: null,
      logs: arrayUnion({ text: "The rituals begin. Place your discs.", important: true, type: "neutral", title: "BEGIN", id: Date.now() })
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
    localStorage.removeItem("crypt_roomId"); setRoomId(""); setView("menu"); setShowLeaveConfirm(false); setGameState(null);
  };

  const kickPlayer = async (targetId) => {
    if (!gameState || gameState.hostId !== user.uid) return;
    try {
      const newPlayers = gameState.players.filter((p) => p.id !== targetId);
      await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { players: newPlayers, logs: arrayUnion(triggerLog("A player was banished.", "warning")) });
    } catch (e) { console.error("Error kicking player:", e); }
  };

  const returnToLobby = async () => {
    if (gameState.hostId !== user.uid) return;
    const players = gameState.players.map((p) => ({ ...p, score: 0, hand: [], played: [], discarded: [], passed: false, isEliminated: false }));
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      status: "lobby", players, turnIndex: 0, turnPhase: "PLAY", currentBid: 0, highestBidder: null, cardsToReveal: 0, starterId: user.uid, discardingPlayer: null, logs: []
    });
  };

  // --- GAME MOVES ---
  const playCard = async (cardIndex) => {
    const pIdx = gameState.players.findIndex(p => p.id === user.uid);
    if (gameState.turnIndex !== pIdx || gameState.turnPhase !== "PLAY") return;

    let players = JSON.parse(JSON.stringify(gameState.players));
    const me = players[pIdx];

    const playedType = me.hand.splice(cardIndex, 1)[0];
    me.played.push({ id: Date.now() + Math.random(), type: playedType, revealed: false });
    let nextIdx = getNextActivePlayer(players, pIdx);

    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      players, turnIndex: nextIdx, logs: arrayUnion(triggerLog(`${me.name} placed a disc.`))
    });
  };

  const placeBid = async (amount) => {
    const pIdx = gameState.players.findIndex(p => p.id === user.uid);
    if (gameState.turnIndex !== pIdx) return;
    if (amount <= gameState.currentBid) return;

    let players = JSON.parse(JSON.stringify(gameState.players));
    const me = players[pIdx];
    let nextIdx = getNextActivePlayer(players, pIdx);

    const totalPlaced = players.reduce((sum, p) => sum + p.played.length, 0);
    const isMaxBid = amount === totalPlaced;

    if (isMaxBid) { players.forEach(p => { if (p.id !== me.id) p.passed = true; }); }

    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      players, turnPhase: isMaxBid ? "REVEAL" : "BIDDING", currentBid: amount, highestBidder: me.id,
      turnIndex: isMaxBid ? pIdx : nextIdx, cardsToReveal: isMaxBid ? amount : gameState.cardsToReveal,
      logs: arrayUnion(triggerLog(`${me.name} bid ${amount}.`, "neutral", isMaxBid, isMaxBid ? "MAX BID" : ""))
    });
  };

  const passBid = async () => {
    const pIdx = gameState.players.findIndex(p => p.id === user.uid);
    if (gameState.turnIndex !== pIdx || gameState.turnPhase !== "BIDDING") return;

    let players = JSON.parse(JSON.stringify(gameState.players));
    players[pIdx].passed = true;
    const unpassedPlayers = players.filter(p => !p.passed && !p.isEliminated);
    
    let updates = { players }; let logs = [triggerLog(`${players[pIdx].name} passed.`)];

    if (unpassedPlayers.length === 1) {
      const winner = unpassedPlayers[0];
      updates.turnPhase = "REVEAL"; updates.turnIndex = players.findIndex(p => p.id === winner.id); updates.cardsToReveal = gameState.currentBid;
      logs.push(triggerLog(`${winner.name} won the bid with ${gameState.currentBid}.`, "neutral", true, "REVEAL PHASE"));
    } else { updates.turnIndex = getNextActivePlayer(players, pIdx); }

    updates.logs = arrayUnion(...logs);
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
  };

  const revealCard = async (targetPlayerId) => {
    if (gameState.turnPhase !== "REVEAL" || gameState.highestBidder !== user.uid) return;

    let players = JSON.parse(JSON.stringify(gameState.players));
    const meIdx = players.findIndex(p => p.id === user.uid); const me = players[meIdx];
    const targetIdx = players.findIndex(p => p.id === targetPlayerId); const target = players[targetIdx];

    const myUnrevealed = me.played.filter(c => !c.revealed).length;
    if (targetPlayerId !== me.id && myUnrevealed > 0) return alert("You must reveal all of your own discs first!");

    const unrevealedIndex = target.played.findLastIndex(c => !c.revealed);
    if (unrevealedIndex === -1) return;

    target.played[unrevealedIndex].revealed = true;
    const revealedType = target.played[unrevealedIndex].type;

    let updates = { players }; let logs = [];

    if (revealedType === "SKULL") {
      updates.turnPhase = "DISCARD";
      updates.discardingPlayer = me.id;
      updates.starterId = target.id; 

      // Consolidate all cards to hand so player can choose which to discard
      const totalPool = [...me.hand, ...me.played.map(c => c.type)];
      me.hand = totalPool;
      me.played = [];

      logs.push(triggerLog(`${me.name} hit a Skull! They must select a disc to destroy.`, "failure", true, "SKULL REVEALED"));
    } else {
      updates.cardsToReveal = gameState.cardsToReveal - 1;
      logs.push(triggerLog(`Revealed a Rose. ${updates.cardsToReveal} to go.`));

      if (updates.cardsToReveal === 0) {
        updates.turnPhase = "ROUND_END"; updates.starterId = me.id; me.score += 1;
        logs.push(triggerLog(`${me.name} completed the challenge!`, "success", true, "CHALLENGE WON"));

        if (me.score === 2) {
          updates.status = "finished"; logs.push(triggerLog(`${me.name} secured two victories!`, "important", true, "VICTORY"));
        }
      }
    }
    updates.logs = arrayUnion(...logs);
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
  };

  const handleSelectDiscard = async (index) => {
    if (gameState.turnPhase !== "DISCARD" || gameState.discardingPlayer !== user.uid) return;

    let players = JSON.parse(JSON.stringify(gameState.players));
    const meIdx = players.findIndex(p => p.id === user.uid);
    const me = players[meIdx];

    const discardedType = me.hand.splice(index, 1)[0];
    me.discarded.push(discardedType);

    let updates = { players }; let logs = [];

    if (me.hand.length === 0) {
      me.isEliminated = true;
      logs.push(triggerLog(`${me.name} lost their last disc and is ELIMINATED!`, "failure", true, "ELIMINATED"));
    } else {
      logs.push(triggerLog(`${me.name} destroyed a disc.`, "warning"));
    }

    updates.turnPhase = "ROUND_END";

    const alive = players.filter(p => !p.isEliminated);
    if (alive.length === 1) {
      updates.status = "finished";
      logs.push(triggerLog(`${alive[0].name} is the last survivor!`, "important", true, "VICTORY"));
    }

    updates.logs = arrayUnion(...logs);
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
  };

  const startNextRound = async () => {
    if (gameState.turnPhase !== "ROUND_END" || gameState.hostId !== user.uid) return;

    let players = JSON.parse(JSON.stringify(gameState.players));
    players.forEach(p => {
      const allCards = [...p.hand, ...p.played.map(c => c.type)];
      p.hand = allCards.sort(() => Math.random() - 0.5); 
      p.played = []; p.passed = false;
    });

    let starterIdx = players.findIndex(p => p.id === gameState.starterId);
    if (starterIdx === -1 || players[starterIdx].isEliminated) starterIdx = players.findIndex(p => !p.isEliminated);

    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      players, turnPhase: "PLAY", currentBid: 0, highestBidder: null, turnIndex: starterIdx, discardingPlayer: null,
      logs: arrayUnion(triggerLog("A new round begins.", "neutral"))
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
          <Flower size={48} className="text-rose-600 animate-pulse-red" />
        </div>
        <div className="bg-rose-900/10 p-8 rounded-2xl border border-rose-900/30">
          <Hammer size={64} className="text-rose-600 mx-auto mb-4 animate-bounce" />
          <h1 className="text-3xl font-bold mb-2">The Crypt is Sealed</h1>
          <p className="text-zinc-400">Dark rituals are currently being performed to improve the game. Return soon.</p>
        </div>
        <div className="h-8"></div>
        <a href={import.meta.env.BASE_URL}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-center pb-12 animate-pulse">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-zinc-900/50 rounded-full border border-rose-900/20 text-rose-300 font-bold tracking-widest text-sm uppercase backdrop-blur-sm"><StepBack size={16} /> Return to Gamehub <StepBack size={16} /></div>
            </div>
          </div>
        </a>
        <GameLogo />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-rose-600 animate-pulse font-mono tracking-widest">
        Descending...
      </div>
    );
  }

  if (view === "splash") return <SplashScreen onStart={handleSplashStart} />;

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
        <GlobalStyles />
        <FloatingBackground />
        <nav className="absolute top-0 left-0 w-full p-4 z-50">
          <a href={import.meta.env.BASE_URL} className="flex items-center gap-2 text-rose-900 rounded-lg font-bold shadow-md hover:text-rose-500 transition-colors w-fit animate-pulse"><StepBack /><span>Back to Gamehub</span></a>
        </nav>
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
        <div className="z-10 text-center mb-10 mt-8">
          <Flower size={64} className="text-rose-600 mx-auto mb-4 animate-spin-slow" />
          <h1 className="text-5xl md:text-7xl font-thin text-transparent bg-clip-text bg-gradient-to-b from-rose-500 to-rose-900 tracking-tighter drop-shadow-md">CRYPT & CRIMSON</h1>
          <p className="text-rose-200/40 tracking-[0.5em] uppercase mt-2 text-xs">Deceive. Reveal. Survive.</p>
        </div>
        <div className="bg-zinc-900/80 backdrop-blur-md border border-rose-900/30 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 relative">
          {error && <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-3 mb-4 rounded text-center text-sm font-bold flex items-center justify-center gap-2"><AlertTriangle size={16} /> {error}</div>}
          <div className="space-y-4">
            <input className="w-full bg-black/50 border border-rose-900 focus:border-rose-500 p-4 rounded-xl text-white outline-none transition-all text-lg font-bold text-center" placeholder="YOUR NAME" value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={12} />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={createRoom} disabled={loading} className="bg-gradient-to-br from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800 p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-rose-900/50"><Skull size={24} /> <span>Create</span></button>
              <div className="flex flex-col gap-2">
                <input className="bg-black/50 border border-rose-900 focus:border-rose-500 p-2 rounded-xl text-white text-center uppercase font-mono font-bold tracking-widest outline-none h-12" placeholder="CODE" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} maxLength={6} />
                <button onClick={joinRoom} disabled={loading} className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-xl font-bold text-zinc-300 transition-all active:scale-95 h-full">Join</button>
              </div>
            </div>
            <button onClick={() => setShowGuide(true)} className="w-full mt-4 text-rose-500 hover:text-rose-400 text-sm font-bold flex items-center justify-center gap-2 transition-colors py-2"><BookOpen size={16} /> How to Play</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    const canStart = gameState.players.length >= 3 && gameState.players.length <= 6;
    
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative">
        <GlobalStyles />
        <FloatingBackground />
        <GameLogoBig />
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
        <div className="z-10 w-full max-w-lg bg-zinc-900/90 backdrop-blur p-8 rounded-2xl border border-rose-900/30 shadow-2xl animate-in slide-in-from-bottom-8 mt-6">
          <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg md:text-xl flex items-center gap-2 text-rose-600 font-bold uppercase"><Skull size={24} /> Crypt Code:</h2>
              <div className="flex items-center gap-3 mt-1">
                <div className="text-3xl md:text-4xl font-mono text-white font-black">{roomId}</div>
                <div className="relative">
                  <button onClick={copyToClipboard} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">{isCopied ? <CheckCircle size={20} className="text-emerald-500" /> : <Copy size={20} />}</button>
                  {isCopied && <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg animate-fade-in-up whitespace-nowrap">Copied!</div>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowLeaveConfirm(true)} className="p-2 hover:bg-red-900/30 rounded text-rose-500 transition-colors"><LogOut size={24} /></button>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Challengers ({gameState.players.length}/6)</h3>
            {gameState.players.map((p) => (
              <div key={p.id} className="flex justify-between items-center bg-zinc-800 p-4 rounded-xl border border-zinc-700">
                <span className="font-bold flex items-center gap-3 text-lg">
                  <div className={`w-4 h-4 rounded-full ${PLAYER_COLORS[p.colorIdx].bg} shadow-lg`} /> {p.name} {p.id === gameState.hostId && <Crown size={16} className="text-yellow-500" />}
                </span>
                {gameState.hostId === user.uid && p.id !== user.uid && (
                  <button onClick={() => kickPlayer(p.id)} className="p-2 bg-red-900/20 hover:bg-red-900/50 text-red-500 rounded-lg transition-colors border border-red-900/30" title="Banish Player"><Trash2 size={16} /></button>
                )}
              </div>
            ))}
            {Array.from({ length: 6 - gameState.players.length }).map((_, i) => <div key={i} className="border-2 border-dashed border-zinc-800 rounded-xl p-4 flex items-center justify-center text-zinc-600 font-bold uppercase text-sm">Empty Slot</div>)}
          </div>

          {isHost ? (
            <div className="flex flex-col gap-2">
              <button onClick={startGame} disabled={!canStart} className="w-full flex justify-center items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all bg-gradient-to-br from-rose-700 to-rose-900 text-white hover:from-rose-600 hover:to-rose-800 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"><Skull size={24} /> Begin Ritual</button>
              {!canStart && <div className="text-center text-xs font-bold text-rose-500 uppercase tracking-wider mt-1">Requires 3 to 6 players to start</div>}
            </div>
          ) : <div className="text-center text-zinc-500 text-sm font-bold uppercase tracking-widest animate-pulse">Waiting for host...</div>}
        </div>

        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl max-w-xs w-full text-center shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2 uppercase">Leave Crypt?</h3>
              <p className="text-zinc-400 mb-6 text-sm">{gameState.hostId === user.uid ? "As Host, leaving seals the crypt for everyone." : "You will disconnect from this session."}</p>
              <div className="flex gap-2">
                <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded font-bold text-zinc-300">Stay</button>
                <button onClick={handleLeave} className="flex-1 bg-rose-700 hover:bg-rose-600 py-2 rounded font-bold text-white">Leave</button>
              </div>
            </div>
          </div>
        )}
        <GameLogo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const pIdx = gameState.players.findIndex((p) => p.id === user.uid);
    const me = gameState.players[pIdx];
    const myColor = me ? PLAYER_COLORS[me.colorIdx] : { bg: "bg-zinc-600", border: "border-zinc-500", fill: "#52525b", text: "text-zinc-500" };
    const isMyTurn = gameState.turnIndex === pIdx && !me.isEliminated;

    const totalCardsOnTable = gameState.players.reduce((sum, p) => sum + p.played.length, 0);
    const hasEveryonePlayedOne = !gameState.players.some(p => !p.isEliminated && p.played.length === 0);

    return (
      <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col overflow-hidden font-sans select-none">
        <GlobalStyles />
        <FloatingBackground />

        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl max-w-xs w-full text-center shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2 uppercase">Abandon Game?</h3>
              <p className="text-zinc-400 mb-6 text-sm">{gameState.hostId === user.uid ? "Leaving deletes the game for everyone." : "You will leave this ongoing game."}</p>
              <div className="flex gap-2">
                <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-2 rounded font-bold text-zinc-300">Stay</button>
                <button onClick={handleLeave} className="flex-1 bg-rose-700 hover:bg-rose-600 py-2 rounded font-bold text-white">Leave</button>
              </div>
              {gameState.hostId === user.uid && <button onClick={() => { returnToLobby(); setShowLeaveConfirm(false); }} className="w-full bg-zinc-800 hover:bg-zinc-700 py-2 rounded font-bold text-rose-500 mt-2 text-sm border border-zinc-700 transition-colors">Return All to Lobby</button>}
            </div>
          </div>
        )}

        {/* Discard Card Selection Modal */}
        {gameState.turnPhase === "DISCARD" && gameState.discardingPlayer === user.uid && (
          <div className="fixed inset-0 z-[250] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
            <div className={`p-6 md:p-10 rounded-3xl border-4 ${myColor.border} bg-zinc-900 text-center max-w-lg w-full shadow-2xl animate-in zoom-in`}>
                <h3 className="text-3xl font-black text-white uppercase mb-2">You hit a Skull!</h3>
                <p className="text-zinc-400 mb-8 font-bold">You must choose one of your discs to destroy permanently.</p>
                <div className="flex justify-center gap-4 flex-wrap">
                    {me.hand.map((type, idx) => (
                        <button key={idx} onClick={() => handleSelectDiscard(idx)} className="transition-all hover:scale-110 hover:-translate-y-2">
                            <Disc type={type} pColor={myColor} size="lg" />
                        </button>
                    ))}
                </div>
            </div>
          </div>
        )}

        {feedback && <FeedbackOverlay type={feedback.type} message={feedback.message} subtext={feedback.subtext} icon={feedback.icon} />}
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}

        {/* TOP BAR */}
        <div className="h-14 md:h-16 bg-zinc-900 border-b border-rose-900/50 flex items-center justify-between px-2 z-[160] shrink-0 shadow-lg relative">
          <div className="absolute inset-0 bg-rose-900/10 pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 bg-rose-900/50 rounded-lg flex items-center justify-center border border-rose-700 ml-2 shadow-[0_0_10px_rgba(225,29,72,0.3)]"><Flower className="text-rose-500" size={20} /></div>
            <div>
              <div className="font-bold text-sm tracking-wider text-rose-100">CRYPT & CRIMSON</div>
              <div className="text-[10px] font-mono uppercase">{gameState.status === "finished" ? <span className="text-rose-400">GAME OVER</span> : <><span className="text-zinc-400">Turn:</span> <span className="text-rose-400">{gameState.players[gameState.turnIndex].name}</span></>}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <button onClick={() => setShowGuide(true)} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><BookOpen size={18} /></button>
            <button onClick={() => setShowLogs(!showLogs)} className={`p-2 rounded-full ${showLogs ? "bg-rose-900 text-rose-400" : "text-zinc-400 hover:bg-zinc-800"}`}><History size={18} /></button>
            <button onClick={() => setShowLeaveConfirm(true)} className="p-2 hover:bg-rose-900/30 rounded text-rose-500"><LogOut size={18} /></button>
          </div>
        </div>

        {/* LOGS OVERLAY */}
        {showLogs && (
          <div className="fixed top-16 right-4 w-64 max-h-60 bg-zinc-900/95 border border-zinc-700 rounded-xl z-[155] overflow-y-auto p-2 shadow-2xl custom-scrollbar">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 sticky top-0 bg-zinc-900/95 py-2">World History</h4>
            <div className="space-y-2">
              {gameState.logs.slice().reverse().map((log) => (
                <div key={log.id} className={`text-xs p-2 rounded border-l-2 ${log.type === "success" ? "border-emerald-500 bg-emerald-900/10 text-emerald-200" : log.type === "warning" ? "border-amber-500 bg-amber-900/10 text-amber-200" : log.type === "failure" ? "border-rose-500 bg-rose-900/10 text-rose-200" : "border-zinc-500 bg-zinc-800/30 text-zinc-300"}`}>
                  {log.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GAME BOARD (MATS) */}
        <div className="flex-1 relative bg-transparent overflow-y-auto custom-scrollbar p-2 sm:p-4 flex flex-wrap justify-center items-start content-start gap-3 sm:gap-6 pb-64 sm:pb-56 pt-4">
          {gameState.players.map(p => {
            const isTargetMe = p.id === user.uid;
            const isTurn = gameState.turnIndex === gameState.players.findIndex(x => x.id === p.id);
            const isChallenger = gameState.highestBidder === p.id && gameState.turnPhase === "REVEAL";
            
            const isRevealPhase = gameState.turnPhase === "REVEAL" && gameState.highestBidder === user.uid && !p.isEliminated;
            const hasUnrevealed = p.played.some(c => !c.revealed);
            const canRevealThis = isRevealPhase && hasUnrevealed;

            return (
              <div 
                key={p.id} 
                onClick={() => { if (canRevealThis) revealCard(p.id); }}
                className={`relative w-28 h-36 sm:w-40 sm:h-48 rounded-xl border-4 flex flex-col items-center justify-end p-2 transition-all 
                  ${PLAYER_COLORS[p.colorIdx].matBg} backdrop-blur-sm
                  ${isTurn ? `${PLAYER_COLORS[p.colorIdx].border} shadow-[0_0_20px_${PLAYER_COLORS[p.colorIdx].fill}80] scale-105` : "border-zinc-800/50"}
                  ${p.isEliminated ? "opacity-30 grayscale" : ""}
                  ${canRevealThis ? "cursor-pointer hover:border-white hover:scale-110" : ""}
                `}
              >
                <div className="absolute top-2 right-2 flex gap-1">
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-yellow-500 ${p.score >= 1 ? 'bg-yellow-500' : 'bg-transparent'}`} />
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-yellow-500 ${p.score >= 2 ? 'bg-yellow-500' : 'bg-transparent'}`} />
                </div>
                <div className="absolute top-2 left-2 flex items-center gap-1"><span className={`text-[9px] sm:text-xs font-black uppercase tracking-widest ${PLAYER_COLORS[p.colorIdx].text}`}>{p.name}</span></div>

                {p.passed && !p.isEliminated && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-zinc-400 px-2 py-0.5 text-[8px] sm:text-[10px] sm:px-3 sm:py-1 rounded font-bold uppercase z-50 transform -rotate-12 border border-zinc-600">Passed</div>}
                {p.isEliminated && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 text-rose-500 px-2 py-0.5 text-[8px] sm:text-[10px] sm:px-3 sm:py-1 rounded font-black uppercase z-50 transform -rotate-12 border border-rose-900 flex items-center gap-1"><Skull size={12}/> Eliminated</div>}
                {isChallenger && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-2 py-0.5 sm:px-3 sm:py-0.5 rounded-full font-black text-[8px] sm:text-[10px] uppercase shadow-[0_0_10px_rgba(245,158,11,0.8)] z-50 whitespace-nowrap animate-bounce">Challenger</div>}

                <div className="relative w-full h-24 sm:h-32 flex items-end justify-center pointer-events-none">
                  {p.played.map((card, idx) => (
                    <div key={card.id} className="absolute transition-all duration-500" style={{ transform: `translateY(-${idx * 8}px)`, zIndex: idx }}>
                      <Disc type={card.type} pColor={PLAYER_COLORS[p.colorIdx]} size="md" isFaceDown={!card.revealed} />
                    </div>
                  ))}
                  {p.played.length === 0 && !p.isEliminated && <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-600 text-[8px] sm:text-[10px] uppercase font-bold">Empty</div>}
                </div>
                
                {!isTargetMe && !p.isEliminated && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 px-2 py-0.5 rounded-full flex gap-1">
                    {Array.from({length: p.hand.length}).map((_,i) => <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-zinc-600 rounded-full" />)}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* BOTTOM UI CONTROLS (My Actions) */}
        <div className={`absolute bottom-0 left-0 right-0 bg-zinc-900/95 border-t-4 ${myColor.border} backdrop-blur-xl flex flex-col z-[60] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]`}>
          {/* Status Bar */}
          <div className="flex justify-between items-center px-4 py-2 border-b border-white/5 bg-black/20 shrink-0">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-black uppercase tracking-widest ${isMyTurn ? "text-rose-400 animate-pulse" : "text-zinc-500"}`}>
                {gameState.turnPhase === "PLAY" ? (isMyTurn ? "Play a disc or Bid" : "Waiting for placement") : 
                 gameState.turnPhase === "BIDDING" ? (isMyTurn ? "Raise bid or Pass" : "Bidding in progress") : 
                 gameState.turnPhase === "REVEAL" ? (isMyTurn ? `Reveal ${gameState.cardsToReveal} discs` : "Revealing phase") : 
                 gameState.turnPhase === "DISCARD" ? "Discarding..." : "Round Ended"}
              </span>
            </div>
            {gameState.turnPhase === "BIDDING" && gameState.highestBidder && <div className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase">Current Bid: {gameState.currentBid} by {gameState.players.find(p=>p.id === gameState.highestBidder)?.name}</div>}
            {gameState.turnPhase === "REVEAL" && <div className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded uppercase">Remaining to Reveal: {gameState.cardsToReveal}</div>}
          </div>

          {/* History Bar - Compact Row */}
          <div className="flex justify-between items-center px-4 py-1.5 border-b border-white/5 bg-zinc-800/50 shrink-0">
             <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Placed:</span>
                <div className="flex gap-1 h-6 sm:h-8 items-center">
                    {(!me || me.played.length === 0) && <span className="text-zinc-600 text-[10px] italic">None</span>}
                    {me && me.played.map(c => <Disc key={c.id} type={c.type} pColor={myColor} size="sm" />)}
                </div>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Lost:</span>
                <div className="flex gap-1 h-6 sm:h-8 items-center">
                    {(!me || me.discarded.length === 0) && <span className="text-zinc-600 text-[10px] italic">None</span>}
                    {me && me.discarded.map((t, idx) => <Disc key={idx} type={t} pColor={myColor} size="sm" isGrayscale />)}
                </div>
             </div>
          </div>

          {/* Hand & Actions */}
          <div className="flex flex-col sm:flex-row p-3 sm:p-4 gap-4 items-center sm:items-stretch">
            {/* Hand Area */}
            <div className="flex-1 flex justify-center sm:justify-start gap-3 w-full">
              {me && !me.isEliminated && me.hand.map((type, idx) => (
                <button
                  key={idx}
                  onClick={() => playCard(idx)}
                  disabled={!isMyTurn || gameState.turnPhase !== "PLAY"}
                  className={`transition-all ${isMyTurn && gameState.turnPhase === "PLAY" ? "hover:-translate-y-2 hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)] active:scale-95" : "opacity-60 cursor-not-allowed"}`}
                >
                  <Disc type={type} pColor={myColor} size="lg" />
                </button>
              ))}
              {me && me.isEliminated && <div className="text-rose-600/50 font-black text-xl sm:text-2xl uppercase tracking-widest animate-pulse flex items-center gap-2 h-16"><Skull size={24}/> Eliminated</div>}
            </div>

            {/* Actions Area */}
            {!me?.isEliminated && (
              <div className="w-full sm:w-56 shrink-0 flex flex-col justify-center gap-2 sm:border-l sm:border-white/10 sm:pl-4">
                {gameState.turnPhase === "PLAY" && isMyTurn && (
                  <button onClick={() => placeBid(totalCardsOnTable === 0 ? 1 : 1)} disabled={!hasEveryonePlayedOne} className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-black py-3 sm:py-4 rounded-xl uppercase tracking-widest shadow-lg transition-all">Start Bid</button>
                )}
                {gameState.turnPhase === "BIDDING" && isMyTurn && (
                  <>
                    <div className="flex items-center gap-2 bg-black/50 p-1 rounded-xl border border-zinc-700">
                       <input type="range" min={gameState.currentBid + 1} max={totalCardsOnTable} value={bidAmount} onChange={(e) => setBidAmount(parseInt(e.target.value))} disabled={gameState.currentBid >= totalCardsOnTable} className="flex-1 accent-amber-500" />
                       <span className="font-black text-amber-500 w-6 text-center">{bidAmount}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => placeBid(bidAmount)} disabled={gameState.currentBid >= totalCardsOnTable} className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-2 rounded-lg text-sm uppercase transition-all">Raise</button>
                      <button onClick={passBid} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 rounded-lg text-sm uppercase transition-all">Pass</button>
                    </div>
                  </>
                )}
                {gameState.turnPhase === "ROUND_END" && gameState.hostId === user.uid && (
                  <button onClick={startNextRound} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 sm:py-4 rounded-xl uppercase tracking-widest shadow-lg transition-all animate-bounce">Next Round</button>
                )}
                {gameState.turnPhase === "ROUND_END" && gameState.hostId !== user.uid && <div className="text-center text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2 sm:mt-4">Waiting for Host...</div>}
              </div>
            )}
          </div>
        </div>

        {/* END GAME MODAL */}
        {gameState.status === "finished" && (
          <div className="fixed inset-0 z-[250] bg-black/90 flex items-center justify-center backdrop-blur-md pt-20 pb-10 px-4">
            <div className="bg-zinc-900 p-6 md:p-8 rounded-3xl border-2 border-rose-500 text-center shadow-[0_0_50px_rgba(225,29,72,0.4)] animate-in zoom-in max-w-lg w-full flex flex-col relative">
              <div className="shrink-0 mb-6">
                <Crown size={80} className="text-yellow-500 mx-auto mb-4 animate-bounce" />
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase mb-2 leading-tight drop-shadow-lg">
                  {gameState.players.filter(p=>!p.isEliminated).sort((a,b)=>b.score - a.score)[0]?.name}
                </h2>
                <p className="text-rose-500 font-bold tracking-widest text-sm uppercase">Survived the Crypt</p>
              </div>
              
              {gameState.hostId === user.uid ? (
                <div className="shrink-0 pt-2">
                  <button onClick={returnToLobby} className="bg-rose-700 hover:bg-rose-600 px-6 py-4 rounded-xl font-black w-full text-white transition-colors uppercase tracking-widest shadow-lg">Return to Crypt Doors</button>
                </div>
              ) : (
                <div className="shrink-0 pt-2">
                  <button disabled className="bg-zinc-800 px-6 py-4 rounded-xl font-black w-full text-zinc-600 uppercase tracking-widest">Waiting for Host...</button>
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