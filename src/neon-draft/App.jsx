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
} from "firebase/firestore";
import {
  StepBack,
  Cpu,
  Wifi,
  Lock,
  Database,
  Zap,
  Layers,
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
  Loader2,
  Server,
  Smartphone,
  Trash2,
  Repeat,
  Ghost,
  Disc,
  FileBarChart,
  ArrowRight,
  Clock, // Added Clock icon
  Power, // Added Power icon
  MousePointerClick,
  RotateCw,
  Copy,
  Loader,
  Sparkles,
  Hammer,
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

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "neon-draft-game";
const GAME_ID = "10";

// --- Game Constants & Rules ---

// CARDS DEFINITION (Sushi Go Cyberpunk Reskin)
const CARDS = {
  CACHE_1: {
    id: "CACHE_1",
    name: "Data Cache v1",
    val: 1,
    icon: Disc,
    color: "text-slate-400",
    border: "border-slate-500",
    desc: "1 TB.",
  },
  CACHE_2: {
    id: "CACHE_2",
    name: "Data Cache v2",
    val: 2,
    icon: Disc,
    color: "text-orange-400",
    border: "border-orange-500",
    desc: "2 TB.",
  },
  CACHE_3: {
    id: "CACHE_3",
    name: "Data Cache v3",
    val: 3,
    icon: Disc,
    color: "text-yellow-400",
    border: "border-yellow-500",
    desc: "3 TB.",
  },
  EXPLOIT: {
    id: "EXPLOIT",
    name: "Zero-Day Exploit",
    val: 0,
    icon: Zap,
    color: "text-yellow-200",
    border: "border-yellow-600",
    desc: "Next Cache x3.",
  },
  GPU: {
    id: "GPU",
    name: "GPU Cluster",
    val: 0,
    icon: Cpu,
    color: "text-purple-400",
    border: "border-purple-500",
    desc: "Pair = 5 TB.",
  },
  MAINFRAME: {
    id: "MAINFRAME",
    name: "Mainframe Core",
    val: 0,
    icon: Server,
    color: "text-green-400",
    border: "border-green-500",
    desc: "Set of 3 = 10 TB.",
  },
  KEY: {
    id: "KEY",
    name: "Encryption Key",
    val: 0,
    icon: Lock,
    color: "text-blue-400",
    border: "border-blue-500",
    desc: "1/3/6/10/15 TB.",
  },
  BOTNET_1: {
    id: "BOTNET_1",
    name: "Botnet Node v1",
    val: 1,
    icon: Wifi,
    color: "text-red-100", // Pale Red
    border: "border-red-200",
    desc: "Str 1. Most Str = 6pts.",
  },
  BOTNET_2: {
    id: "BOTNET_2",
    name: "Botnet Node v2",
    val: 2,
    icon: Wifi,
    color: "text-red-400", // Strong, Pure Red
    border: "border-red-500",
    desc: "Str 2. Most Str = 6pts.",
  },
  BOTNET_3: {
    id: "BOTNET_3",
    name: "Botnet Node v3",
    val: 3,
    icon: Wifi,
    color: "text-red-600", // Neon Fuchsia (Distinct from Red)
    border: "border-red-700",
    desc: "Str 3. Most Str = 6pts.",
  },
  PROXY: {
    id: "PROXY",
    name: "Proxy Server",
    val: 0,
    icon: Repeat,
    color: "text-cyan-200",
    border: "border-cyan-400",
    desc: "Swap for 2 cards.",
  },
  BACKDOOR: {
    id: "BACKDOOR",
    name: "Backdoor Access",
    val: 0,
    icon: Ghost,
    color: "text-pink-400",
    border: "border-pink-500",
    desc: "End Game: +6/-6 TB.",
  },
};

// DECK DISTRIBUTION (108 cards)
const DECK_TEMPLATE = [
  ...Array(14).fill("GPU"),
  ...Array(14).fill("MAINFRAME"),
  ...Array(14).fill("KEY"),
  ...Array(12).fill("BOTNET_1"), // 12 Cards
  ...Array(8).fill("BOTNET_2"), // 8 Cards
  ...Array(6).fill("BOTNET_3"), // 6 Cards
  ...Array(10).fill("CACHE_2"),
  ...Array(5).fill("CACHE_3"),
  ...Array(5).fill("CACHE_1"),
  ...Array(6).fill("EXPLOIT"),
  ...Array(4).fill("PROXY"),
  ...Array(10).fill("BACKDOOR"),
];

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

const FloatingBackground = ({ isShaking }) => (
  <div
    className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${
      isShaking ? "animate-shake bg-red-900/20" : ""
    }`}
  >
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-yellow-900/20 via-gray-950 to-black" />
    <div className="absolute top-0 left-0 w-full h-full opacity-10">
      {[...Array(20)].map((_, i) => {
        const fruitKeys = Object.keys(CARDS);
        const Icon = CARDS[fruitKeys[i % fruitKeys.length]].icon;
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

const NeonLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-60 mt-auto pb-2 pt-2 relative z-10">
    <Layers size={12} className="text-cyan-400" />
    <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
      NEON DRAFT
    </span>
  </div>
);

const NeonLogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-60 mt-auto pb-2 pt-2 relative z-10">
    <Layers size={22} className="text-cyan-400" />
    <span className="text-[20px] font-black tracking-widest text-cyan-400 uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
      NEON DRAFT
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
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2">
        Disconnect from Grid?
      </h3>
      <p className="text-slate-400 mb-6 text-sm">
        {isHost
          ? "WARNING: As Admin, leaving will shut down the server for all runners."
          : inGame
            ? "Leaving now will corrupt the data stream for everyone."
            : "Closing secure connection."}
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onCancel}
          className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded font-bold transition-colors"
        >
          Stay Connected
        </button>
        {inGame && isHost && (
          <button
            onClick={onConfirmLobby}
            className="py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            <Home size={18} /> Reset to Lobby
          </button>
        )}
        <button
          onClick={onConfirmLeave}
          className="bg-pink-600 hover:bg-pink-500 text-white py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> {isHost ? "Shut Down Server" : "Jack Out"}
        </button>
      </div>
    </div>
  </div>
);

// Round Summary Component
const RoundSummary = ({
  players,
  round,
  onNext,
  isHost,
  onToggleReady,
  currentUserId,
}) => {
  // Identify guests (everyone except the current user if the current user is Host)
  const guests = isHost
    ? players.filter((p) => p.id !== currentUserId)
    : players.filter(
        (p) => p.id !== players.find((pl) => pl.id === currentUserId)?.id,
      ); // Fallback for guests view

  // Check if all guests are ready
  const allGuestsReady = guests.every((p) => p.ready);
  const readyCount = guests.filter((p) => p.ready).length;
  const totalGuests = guests.length;

  const me = players.find((p) => p.id === currentUserId);

  return (
    <div className="fixed inset-0 top-14 bg-black/95 z-150 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wider">
            <FileBarChart className="text-cyan-400" />
            ROUND {round} SUMMARY
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono bg-slate-800 px-3 py-1 rounded text-slate-300">
              GUESTS READY: {readyCount}/{totalGuests}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">
            <div className="col-span-3">Runner</div>
            <div className="col-span-5">Data Acquired (Ordered)</div>
            <div className="col-span-2 text-right">R{round} TB</div>
            <div className="col-span-2 text-right">Total TB</div>
          </div>

          {players
            .sort((a, b) => b.score - a.score)
            .map((p) => {
              const roundData = p.history.find((h) => h.round === round);
              const roundCards = roundData ? roundData.cards : [];
              const roundScore = roundData ? roundData.score : 0;
              const isMe = p.id === currentUserId;

              // Determine if this specific row is the host
              // We assume 'isHost' prop is true if *viewer* is host,
              // but we need to know if *this player row* is the host.
              // Since we don't pass hostId explicitly, we infer:
              // if I am host (isHost=true) and isMe=true, then this row is host.
              // If I am guest, we can't easily know who host is without hostId prop,
              // but for styling the checkmark it matters less.
              // We'll just check p.ready.

              return (
                <div
                  key={p.id}
                  className={`grid grid-cols-12 gap-4 items-center p-3 rounded-lg border transition-all ${
                    p.ready
                      ? "bg-green-900/10 border-green-500/30"
                      : "bg-slate-800/30 border-slate-700/50"
                  }`}
                >
                  <div className="col-span-3 font-bold text-white truncate flex items-center gap-2">
                    <User size={14} className="text-slate-400" />
                    {p.name}
                    {p.ready && (
                      <CheckCircle size={14} className="text-green-500" />
                    )}
                  </div>
                  <div className="col-span-5 flex flex-wrap gap-1">
                    {roundCards.map((cId, i) => {
                      const info = CARDS[cId];
                      const Icon = info.icon;
                      return (
                        <div
                          key={i}
                          className={`w-6 h-6 flex items-center justify-center rounded bg-slate-900 border ${info.border} ${info.color}`}
                          title={info.name}
                        >
                          <Icon size={12} />
                        </div>
                      );
                    })}
                    {roundCards.length === 0 && (
                      <span className="text-slate-600 text-xs italic">
                        No Data
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-right font-mono text-cyan-300 font-bold">
                    +{roundScore}
                  </div>
                  <div className="col-span-2 text-right font-mono text-white font-bold text-lg">
                    {p.score}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-4">
          {isHost ? (
            <button
              onClick={onNext}
              disabled={!allGuestsReady} // <--- Disable logic added here
              className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${
                allGuestsReady
                  ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
              }`}
            >
              {round >= 3 ? "Initialize Final Scoring" : "Start Next Round"}
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={onToggleReady}
              className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg w-full md:w-auto justify-center ${
                me?.ready
                  ? "bg-green-600/20 text-green-400 border border-green-500/50 hover:bg-green-600/30"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20 animate-pulse"
              }`}
            >
              {me?.ready ? (
                <>
                  <CheckCircle size={18} /> READY - STANDING BY
                </>
              ) : (
                <>
                  <CheckCircle size={18} /> MARK READY
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Log Viewer
const LogViewer = ({ logs, onClose }) => (
  <div className="fixed top-16 right-4 w-64 max-h-60 bg-gray-900/95 border border-gray-700 rounded-xl z-155 overflow-y-auto p-2 shadow-2xl">
    <div className="bg-slate-900 w-full md:max-w-md h-full md:h-[70vh] rounded-none md:rounded-xl flex flex-col border-none md:border border-slate-700 shadow-2xl">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <History size={18} className="text-cyan-400" /> System Logs
        </h3>
        <button
          onClick={onClose}
          className="p-2 bg-slate-700 rounded-full hover:bg-slate-600"
        >
          <X className="text-slate-400" />
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
                  : "bg-slate-700/50 border-slate-500 text-slate-300"
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
  <div className="fixed inset-0 bg-black/95 z-170 flex items-center justify-center p-2 md:p-6 animate-in fade-in">
    <div className="bg-slate-900 md:rounded-2xl w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] overflow-hidden border-none md:border border-cyan-500/30 flex flex-col shadow-[0_0_50px_rgba(34,211,238,0.15)]">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950 sticky top-0 z-10">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-widest uppercase">
            <BookOpen className="text-cyan-400" /> Data Runner's Manual
          </h2>
          <span className="text-xs text-slate-500 font-mono tracking-[0.2em]">
            OPERATIONAL PROTOCOLS v2.1
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-700">
        {/* SECTION 1: THE LOOP */}
        <section>
          <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2 border-b border-cyan-900/50 pb-2">
            <Repeat size={18} /> THE DRAFT LOOP
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-cyan-900/30 rounded-full flex items-center justify-center text-cyan-400 mb-1 border border-cyan-500/30">
                <MousePointerClick size={24} />
              </div>
              <div className="font-bold text-white">1. SELECT</div>
              <p className="text-xs text-slate-400">
                Pick 1 card to keep. <br />
                (Pick 2 if using Proxy).
              </p>
            </div>

            <div className="hidden md:flex items-center justify-center text-slate-600">
              <ArrowRight size={32} />
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center text-purple-400 mb-1 border border-purple-500/30">
                <Layers size={24} />
              </div>
              <div className="font-bold text-white">2. REVEAL</div>
              <p className="text-xs text-slate-400">
                Cards are added to your rig simultaneously.
              </p>
            </div>

            <div className="hidden md:flex items-center justify-center text-slate-600">
              <ArrowRight size={32} />
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center text-green-400 mb-1 border border-green-500/30">
                <RotateCw size={24} />
              </div>
              <div className="font-bold text-white">3. PASS</div>
              <p className="text-xs text-slate-400">
                Hand remaining deck to the left. Repeat until empty.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: SCORING DATABASE */}
        <section>
          <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2 border-b border-purple-900/50 pb-2">
            <Database size={18} /> SCORING DATABASE
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Data Cache (New Separate Box) */}
            <div className="bg-slate-800/40 p-3 rounded-lg border-l-4 border-orange-500 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="font-bold text-white text-sm">Data Cache</span>
                <Disc size={16} className="text-orange-400" />
              </div>
              <div className="text-xs text-slate-400">
                Raw data files. Come in 3 sizes.
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2 rounded mt-auto">
                <div className="text-center">
                  <div className="text-slate-400 font-black text-xs">1</div>
                  <div className="text-[10px] text-slate-600">TB</div>
                </div>
                <div className="text-center border-l border-slate-700 pl-4">
                  <div className="text-orange-400 font-black text-xs">2</div>
                  <div className="text-[10px] text-slate-600">TB</div>
                </div>
                <div className="text-center border-l border-slate-700 pl-4">
                  <div className="text-yellow-400 font-black text-xs">3</div>
                  <div className="text-[10px] text-slate-600">TB</div>
                </div>
              </div>
            </div>

            {/* 2. Exploit (New Separate Box) */}
            <div className="bg-slate-800/40 p-3 rounded-lg border-l-4 border-yellow-500 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="font-bold text-white text-sm">
                  Zero-Day Exploit
                </span>
                <Zap size={16} className="text-yellow-400" />
              </div>
              <div className="text-xs text-slate-400">
                Multiplies the <span className="underline">next</span> Cache
                card x3.
              </div>
              <div className="bg-black/40 p-2 rounded text-center font-mono text-xs text-yellow-200 mt-auto">
                [Exploit] + [2 TB] = <span className="font-bold">6 TB</span>
              </div>
            </div>

            {/* 3. GPU */}
            <div className="bg-slate-800/40 p-3 rounded-lg border-l-4 border-purple-500 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="font-bold text-white text-sm">
                  GPU Cluster
                </span>
                <Cpu size={16} className="text-purple-400" />
              </div>
              <div className="text-xs text-slate-400">
                Must be collected in pairs.
              </div>
              <div className="bg-black/40 p-2 rounded text-center font-mono text-sm text-purple-300 mt-auto">
                2 Cards = 5 TB
              </div>
            </div>

            {/* 4. Mainframe */}
            <div className="bg-slate-800/40 p-3 rounded-lg border-l-4 border-green-500 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="font-bold text-white text-sm">Mainframe</span>
                <Server size={16} className="text-green-400" />
              </div>
              <div className="text-xs text-slate-400">
                Huge storage, but requires a full set.
              </div>
              <div className="bg-black/40 p-2 rounded text-center font-mono text-sm text-green-300 mt-auto">
                3 Cards = 10 TB
              </div>
            </div>

            {/* 5. Encryption Keys */}
            <div className="bg-slate-800/40 p-3 rounded-lg border-l-4 border-blue-500 flex flex-col gap-2 md:col-span-2 lg:col-span-1">
              <div className="flex justify-between items-start">
                <span className="font-bold text-white text-sm">
                  Encryption Keys
                </span>
                <Lock size={16} className="text-blue-400" />
              </div>
              <div className="text-xs text-slate-400">
                Exponential growth. Collect as many as possible.
              </div>
              <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px] mt-auto">
                <div className="bg-black/40 p-1 rounded">
                  <div className="text-blue-500">1</div>1TB
                </div>
                <div className="bg-black/40 p-1 rounded">
                  <div className="text-blue-500">2</div>3TB
                </div>
                <div className="bg-black/40 p-1 rounded">
                  <div className="text-blue-500">3</div>6TB
                </div>
                <div className="bg-black/40 p-1 rounded">
                  <div className="text-blue-500">4</div>10TB
                </div>
                <div className="bg-black/40 p-1 rounded">
                  <div className="text-blue-500">5+</div>15TB
                </div>
              </div>
            </div>

            {/* 6. Botnet */}
            <div className="bg-slate-800/40 p-3 rounded-lg border-l-4 border-red-500 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="font-bold text-white text-sm">
                  Botnet Node
                </span>
                <Wifi size={16} className="text-red-500" />
              </div>
              <div className="text-xs text-slate-400">
                Collect strictly for strength. <br />
                Values: 1, 2, or 3. <br />
                <span className="text-red-400">Total Strength</span> wins.
              </div>
              <div className="flex gap-2 text-xs text-center font-mono mt-auto">
                <div className="bg-black/40 p-2 rounded flex-1">
                  <div className="text-red-400 font-bold">Most</div>6 TB
                </div>
                <div className="bg-black/40 p-2 rounded flex-1">
                  <div className="text-red-300 font-bold">2nd</div>3 TB
                </div>
              </div>
            </div>

            {/* 7. Backdoor */}
            <div className="bg-slate-800/40 p-3 rounded-lg border-l-4 border-pink-500 flex flex-col gap-2 md:col-span-2 lg:col-span-3">
              <div className="flex justify-between items-start">
                <span className="font-bold text-white text-sm">
                  Backdoor Access
                </span>
                <Ghost size={16} className="text-pink-400" />
              </div>
              <div className="text-xs text-slate-400">
                Kept until{" "}
                <span className="text-pink-400 font-bold">Game End</span>. Watch
                out for the penalty!
              </div>
              <div className="flex gap-2 text-xs text-center font-mono mt-auto">
                <div className="bg-black/40 p-2 rounded flex-1 border border-green-900/50">
                  <div className="text-green-400 font-bold">Most Collected</div>
                  +6 TB
                </div>
                <div className="bg-black/40 p-2 rounded flex-1 border border-red-900/50">
                  <div className="text-red-400 font-bold">Fewest Collected</div>
                  -6 TB
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
);

// Feedback Overlay
const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-160 flex items-center justify-center pointer-events-none">
    <div
      className={`
      flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl border-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] 
      transform transition-all animate-in fade-in zoom-in slide-in-from-bottom-10 duration-300 backdrop-blur-md
      ${
        type === "success" ? "bg-cyan-900/90 border-cyan-500 text-cyan-100" : ""
      }
      ${
        type === "info"
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

// Card Component
const Card = ({ typeId, onClick, selected, small, disabled }) => {
  const info = CARDS[typeId];
  if (!info) return null;
  const Icon = info.icon;

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        relative bg-slate-900 rounded-lg border-2 transition-all flex flex-col items-center justify-between
        ${info.border}
        ${
          selected
            ? "ring-4 ring-cyan-400 -translate-y-4 shadow-[0_0_20px_rgba(34,211,238,0.5)] z-20"
            : !disabled
              ? "hover:-translate-y-1 hover:shadow-lg"
              : "opacity-50 cursor-not-allowed"
        }
        ${onClick && !disabled ? "cursor-pointer" : ""}
        ${small ? "w-16 h-24 p-1" : "w-24 h-36 md:w-32 md:h-48 p-2"}
      `}
    >
      <div className="w-full flex justify-between items-start">
        <span
          className={`font-black ${small ? "text-[10px]" : "text-sm"} ${
            info.color
          }`}
        >
          {info.val > 0 ? info.val : ""}
        </span>
        <div
          className={`${small ? "w-3 h-3" : "w-6 h-6"} rounded-full border ${
            info.border
          } bg-slate-800 flex items-center justify-center`}
        >
          <Icon size={small ? 8 : 14} className={info.color} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <Icon
          size={small ? 20 : 40}
          className={`${info.color} drop-shadow-md`}
        />
        {!small && (
          <span
            className={`text-[10px] uppercase font-bold text-center leading-tight ${info.color}`}
          >
            {info.name}
          </span>
        )}
      </div>

      {!small && (
        <div className="w-full bg-black/40 rounded p-1 text-[8px] text-slate-400 text-center leading-tight">
          {info.desc}
        </div>
      )}

      {selected && (
        <div className="absolute inset-0 bg-cyan-500/20 rounded-lg flex items-center justify-center">
          <CheckCircle className="text-cyan-400 w-8 h-8 md:w-12 md:h-12 drop-shadow-lg" />
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
export default function NeonDraftGame() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("menu");

  const [roomId, setRoomId] = useState("");
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

  // Draft Selection
  const [selectedCardIndices, setSelectedCardIndices] = useState([]);
  const [isUsingProxy, setIsUsingProxy] = useState(false);

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

  // --- Session Restore ---
  useEffect(() => {
    const savedRoomId = localStorage.getItem("neondraft_roomId");
    if (savedRoomId) {
      setRoomId(savedRoomId);
    }
  }, []);

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

  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (
            !data.players ||
            !Array.isArray(data.players) ||
            !data.players.some((p) => p.id === user.uid)
          ) {
            setRoomId("");
            setView("menu");
            localStorage.removeItem("neondraft_roomId");
            setError("Connection Terminated (Kicked).");
            return;
          }

          setGameState(data);

          if (data.status === "lobby") setView("lobby");
          else setView("game");

          // Feedback Trigger
          if (
            data.feedbackTrigger &&
            data.feedbackTrigger.id !== gameState?.feedbackTrigger?.id
          ) {
            setFeedback(data.feedbackTrigger);
            setTimeout(() => setFeedback(null), 3000);
          }
        } else {
          setRoomId("");
          setView("menu");
          localStorage.removeItem("neondraft_roomId");
          setError("Server shut down by Admin.");
        }
      },
    );
    return () => unsub();
  }, [roomId, user, gameState?.feedbackTrigger?.id]);

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
          hand: [],
          keptCards: [],
          score: 0,
          ready: true,
          selection: [],
          history: [],
          backdoorCount: 0,
        },
      ],
      logs: [],
      round: 1,
      turnState: "IDLE",
      feedbackTrigger: null,
      winner: null,
    };

    try {
      await setDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
        initialData,
      );
      localStorage.setItem("neondraft_roomId", newId);
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
      if (data.status !== "lobby") throw new Error("Draft in progress.");
      if (data.players.length >= 6) throw new Error("Server full.");

      if (!data.players.find((p) => p.id === user.uid)) {
        await updateDoc(ref, {
          players: arrayUnion({
            id: user.uid,
            name: playerName,
            hand: [],
            keptCards: [],
            score: 0,
            ready: true,
            selection: [],
            history: [],
            backdoorCount: 0,
          }),
        });
      }
      localStorage.setItem("neondraft_roomId", roomCodeInput);
      setRoomId(roomCodeInput);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const leaveRoom = async () => {
    if (!roomId) return;
    const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);

    if (gameState.hostId === user.uid) {
      await deleteDoc(ref);
    } else {
      const updatedPlayers = gameState.players.filter((p) => p.id !== user.uid);
      await updateDoc(ref, { players: updatedPlayers });
    }

    localStorage.removeItem("neondraft_roomId");
    setRoomId("");
    setView("menu");
    setShowLeaveConfirm(false);
  };

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

  // --- Logic ---

  const startGame = async () => {
    if (gameState.players.length < 2) return setError("Need 2+ Runners.");

    let deck = shuffle([...DECK_TEMPLATE]);

    const handSize =
      gameState.players.length === 2
        ? 10
        : gameState.players.length === 3
          ? 9
          : gameState.players.length === 4
            ? 8
            : 7;

    const players = gameState.players.map((p) => {
      const hand = [];
      for (let i = 0; i < handSize; i++) hand.push(deck.pop());
      return {
        ...p,
        hand,
        keptCards: [],
        score: 0,
        backdoorCount: 0,
        history: [],
        selection: [],
        ready: false,
      };
    });

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        players: players,
        deck: deck,
        round: 1,
        turnState: "SELECTING",
        logs: [
          {
            id: Date.now().toString(),
            text: "Draft Initialized. Round 1.",
            type: "neutral",
          },
        ],
      },
    );
  };

  // --- Selection Logic ---
  const toggleCardSelection = (cardIdx) => {
    const maxSelect = isUsingProxy ? 2 : 1;

    setSelectedCardIndices((prev) => {
      if (prev.includes(cardIdx)) {
        return prev.filter((i) => i !== cardIdx);
      } else {
        if (prev.length >= maxSelect) {
          if (maxSelect === 1) return [cardIdx];
          return [...prev.slice(1), cardIdx];
        }
        return [...prev, cardIdx];
      }
    });
  };

  const confirmSelection = async () => {
    if (selectedCardIndices.length === 0) return;
    if (isUsingProxy && selectedCardIndices.length !== 2) return;

    const updatedPlayers = gameState.players.map((p) =>
      p.id === user.uid
        ? {
            ...p,
            selection: selectedCardIndices,
            usingProxy: isUsingProxy,
          }
        : p,
    );

    const allSelected = updatedPlayers.every((p) => p.selection.length > 0);

    if (allSelected) {
      await resolveTurn(updatedPlayers);
    } else {
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: updatedPlayers,
        },
      );
    }
    setSelectedCardIndices([]);
    setIsUsingProxy(false);
  };

  // --- SCORING ENGINE ---
  // --- SCORING ENGINE ---
  const calculateScoreBreakdown = (keptCards) => {
    let cacheScore = 0;
    let exploitStack = 0;
    let gpuCount = 0;
    let mainframeCount = 0;
    let keyCount = 0;
    let botnetCount = 0; // This will now represent Total Strength, not number of cards

    // Iterate sequentially
    keptCards.forEach((cId) => {
      // 1. Exploit / Cache Logic
      if (cId === "EXPLOIT") {
        exploitStack++;
      } else if (cId.startsWith("CACHE")) {
        const val = CARDS[cId].val;
        if (exploitStack > 0) {
          cacheScore += val * 3;
          exploitStack--;
        } else {
          cacheScore += val;
        }
      }

      // 2. Count others
      if (cId === "GPU") gpuCount++;
      if (cId === "MAINFRAME") mainframeCount++;
      if (cId === "KEY") keyCount++;

      // --- UPDATED BOTNET LOGIC ---
      if (cId.startsWith("BOTNET")) {
        // Add the val (1, 2, or 3) to the score counter
        botnetCount += CARDS[cId].val;
      }
      // ----------------------------
    });

    const gpuScore = Math.floor(gpuCount / 2) * 5;
    const mainframeScore = Math.floor(mainframeCount / 3) * 10;
    const keyTable = [0, 1, 3, 6, 10, 15];
    const keyScore = keyTable[Math.min(keyCount, 5)];

    return {
      total: cacheScore + gpuScore + mainframeScore + keyScore,
      botnetCount, // This is now the "Strength" sum used for comparison
    };
  };

  const resolveTurn = async (currentPlayers) => {
    const logs = [];
    let nextState = "SELECTING";
    let finalPlayers = [...currentPlayers];

    // 1. Resolve Proxy Swaps & Move to Kept
    finalPlayers = finalPlayers.map((p) => {
      const selectedCards = p.selection.map((idx) => p.hand[idx]);
      let newHand = p.hand.filter((_, i) => !p.selection.includes(i));
      let newKept = [...p.keptCards];

      if (p.usingProxy) {
        const proxyIndex = newKept.indexOf("PROXY");
        if (proxyIndex > -1) {
          newKept.splice(proxyIndex, 1);
          newHand.push("PROXY");
          newKept.push(...selectedCards);
        } else {
          newKept.push(selectedCards[0]);
          if (selectedCards.length > 1) newHand.push(selectedCards[1]);
        }
      } else {
        newKept.push(...selectedCards);
      }

      return {
        ...p,
        hand: newHand,
        keptCards: newKept,
        selection: [],
        usingProxy: false,
      };
    });

    logs.push({
      id: Date.now().toString(),
      text: "Data transfer complete. Hands rotating...",
      type: "neutral",
    });

    // 2. Rotate Hands
    const rotatedHands = finalPlayers.map(
      (_, i) => finalPlayers[(i + 1) % finalPlayers.length].hand,
    );
    finalPlayers.forEach((p, i) => (p.hand = rotatedHands[i]));

    // 3. Check Round End
    if (finalPlayers[0].hand.length === 0) {
      logs.push({
        id: Date.now() + 1,
        text: `Round ${gameState.round} Complete. Showing Summary.`,
        type: "success",
      });

      // --- ADD THIS BLOCK HERE ---
      // Reset ready status for the summary screen check
      finalPlayers.forEach((p) => (p.ready = false));
      // ---------------------------

      // --- ROUND SCORING ---
      const breakdowns = finalPlayers.map((p) =>
        calculateScoreBreakdown(p.keptCards),
      );

      // Botnet (Maki) Scoring
      const botnetCounts = breakdowns.map((b) => b.botnetCount);
      const uniqueCounts = [...new Set(botnetCounts)]
        .filter((c) => c > 0)
        .sort((a, b) => b - a);
      const firstPlaceCount = uniqueCounts[0] || 0;
      const secondPlaceCount = uniqueCounts[1] || 0;

      const firstPlaceWinners = finalPlayers.filter(
        (_, i) =>
          breakdowns[i].botnetCount === firstPlaceCount && firstPlaceCount > 0,
      );
      const secondPlaceWinners = finalPlayers.filter(
        (_, i) =>
          breakdowns[i].botnetCount === secondPlaceCount &&
          secondPlaceCount > 0,
      );

      const firstPoints = Math.floor(6 / (firstPlaceWinners.length || 1));
      const secondPoints = Math.floor(3 / (secondPlaceWinners.length || 1));

      finalPlayers.forEach((p, i) => {
        const bd = breakdowns[i];
        let botnetScore = 0;

        if (bd.botnetCount === firstPlaceCount && firstPlaceCount > 0) {
          botnetScore = firstPoints;
        } else if (
          bd.botnetCount === secondPlaceCount &&
          secondPlaceCount > 0 &&
          firstPlaceWinners.length === 1
        ) {
          botnetScore = secondPoints;
        }

        // Handle Backdoors (Puddings) - Move to persistent storage
        const roundBackdoors = p.keptCards.filter(
          (c) => c === "BACKDOOR",
        ).length;
        p.backdoorCount += roundBackdoors;

        const roundTotal = bd.total + botnetScore;

        p.history.push({
          round: gameState.round,
          cards: [...p.keptCards], // Snapshot
          score: roundTotal,
        });
        p.score += roundTotal;
        // Don't clear keptCards yet, so summary can see them if needed (though we use history now)
      });

      nextState = "ROUND_SUMMARY"; // Pause game
    }

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players: finalPlayers,
        turnState: nextState,
        logs: arrayUnion(...logs),
      },
    );
  };

  // --- Start Next Round / End Game ---
  const proceedToNextRound = async () => {
    if (gameState.hostId !== user.uid) return;

    if (gameState.round >= 3) {
      // Calculate Game End Scores
      const players = [...gameState.players];
      const backdoorCounts = players.map((p) => p.backdoorCount);
      const maxBackdoor = Math.max(...backdoorCounts);
      const minBackdoor = Math.min(...backdoorCounts);

      const maxWinners = players.filter((p) => p.backdoorCount === maxBackdoor);
      const minLosers = players.filter((p) => p.backdoorCount === minBackdoor);

      const maxPoints = Math.floor(6 / maxWinners.length);
      const minPoints =
        players.length > 2 ? Math.floor(-6 / minLosers.length) : 0;

      players.forEach((p) => {
        let puddingScore = 0;
        if (p.backdoorCount === maxBackdoor) puddingScore = maxPoints;
        else if (p.backdoorCount === minBackdoor) puddingScore = minPoints;
        p.score += puddingScore;
        p.backdoorScore = puddingScore; // Save for display
        p.ready = false; // RESET READY STATUS FOR GAME OVER SCREEN
      });

      const sorted = [...players].sort((a, b) => b.score - a.score);
      const winner = sorted[0].name;

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          status: "finished",
          turnState: "GAME_OVER",
          winner,
          feedbackTrigger: {
            id: Date.now(),
            type: "success",
            message: "SYSTEM HACKED",
            subtext: `${winner} Dominates the Grid`,
          },
        },
      );
    } else {
      // Deal Next Round
      const nextRound = gameState.round + 1;
      let deck = [...gameState.deck];
      const handSize =
        gameState.players.length === 2
          ? 10
          : gameState.players.length === 3
            ? 9
            : gameState.players.length === 4
              ? 8
              : 7;

      const players = gameState.players.map((p) => {
        const newHand = [];
        for (let k = 0; k < handSize; k++)
          if (deck.length > 0) newHand.push(deck.pop());
        return {
          ...p,
          hand: newHand,
          keptCards: [], // Clear now
        };
      });

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          deck,
          round: nextRound,
          turnState: "SELECTING",
          feedbackTrigger: {
            id: Date.now(),
            type: "info",
            message: `ROUND ${nextRound}`,
            subtext: "New Data Available",
          },
        },
      );
    }
  };

  const returnToLobby = async () => {
    const resetPlayers = gameState.players.map((p) => ({
      ...p,
      hand: [],
      keptCards: [],
      score: 0,
      backdoorCount: 0,
      selection: [],
      history: [],
      ready: true,
    }));
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        players: resetPlayers,
        logs: [],
        round: 1,
        winner: null,
        feedbackTrigger: null,
      },
    );
  };

  const me = gameState?.players.find((p) => p.id === user?.uid);

  // --- Render ---

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <NeonLogoBig />
        <div className="bg-orange-500/10 p-8 rounded-2xl border border-orange-500/30">
          <Hammer
            size={64}
            className="text-orange-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
          <p className="text-gray-400">
            The connection is compromised. Enhancing security protocols.
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
        <NeonLogo />
      </div>
    );
  }

  if (!user)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-cyan-500 animate-pulse">
        Initializing Interface...
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

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
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
          <Layers
            size={64}
            className="text-cyan-400 mx-auto mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]"
          />
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-linear-to-br from-cyan-400 via-blue-500 to-purple-600 font-serif tracking-widest drop-shadow-md">
            NEON DRAFT
          </h1>
          <p className="text-white-400/60 tracking-[0.3em] uppercase mt-2">
            Build Your Rig. Rule the Net.
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-cyan-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 animate-in slide-in-from-bottom-10 duration-700 delay-100">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm border border-red-800">
              {error}
            </div>
          )}

          <input
            className="w-full bg-black/50 border border-slate-600 p-3 rounded mb-4 text-white placeholder-slate-500 focus:border-cyan-500 outline-none transition-colors font-mono"
            placeholder="Hacker Alias"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-linear-to-r from-cyan-700 to-blue-600 hover:from-cyan-600 hover:to-blue-500 p-4 rounded font-bold mb-4 flex items-center justify-center gap-2 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all"
          >
            <Server size={20} /> New Server
          </button>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              className="w-full sm:flex-1 bg-black/50 border border-slate-600 p-3 rounded text-white placeholder-slate-500 uppercase font-mono tracking-wider focus:border-cyan-500 outline-none"
              placeholder="IP ADDR"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-600 px-6 py-3 rounded font-bold transition-colors"
            >
              Connect
            </button>
          </div>

          <button
            onClick={() => setShowRules(true)}
            className="w-full text-sm text-slate-400 hover:text-white flex items-center justify-center gap-2 py-2"
          >
            <BookOpen size={16} /> Data Manual
          </button>
        </div>
        <div className="absolute bottom-4 text-slate-600 text-xs text-center">
          Inspired by Sushi Go. A tribute game.
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
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative">
        <FloatingBackground />
        <NeonLogoBig />
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirmLeave={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={isHost}
            inGame={false}
          />
        )}

        <div className="z-10 w-full max-w-lg bg-slate-900/90 backdrop-blur p-8 rounded-2xl border border-cyan-900/50 shadow-2xl mb-4">
          <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
            {/* Grouping Title and Copy Button together on the left */}
            <div>
              <h2 className="text-lg md:text-xl text-cyan-500 font-bold uppercase">
                Node
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

          <div className="bg-black/20 rounded-xl p-4 mb-8 border border-slate-800">
            <h3 className="text-slate-500 text-xs uppercase tracking-wider mb-4 flex justify-between">
              <span>Runners ({gameState.players.length})</span>
            </h3>
            <div className="space-y-2">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-slate-800/50 p-3 rounded border border-slate-700/50"
                >
                  <span
                    className={`font-bold flex items-center gap-2 ${
                      p.id === user.uid ? "text-cyan-400" : "text-slate-300"
                    }`}
                  >
                    <User size={14} /> {p.name}{" "}
                    {p.id === gameState.hostId && (
                      <Crown size={14} className="text-yellow-500" />
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-xs flex items-center gap-1">
                      <CheckCircle size={12} /> Online
                    </span>
                    {isHost && p.id !== user.uid && (
                      <button
                        onClick={() => kickPlayer(p.id)}
                        className="text-slate-500 hover:text-red-500 hover:bg-red-900/20 p-1 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {gameState.players.length < 2 && (
                <div className="text-center text-slate-500 italic text-sm py-2">
                  Waiting for connection...
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
                  ? "bg-cyan-700 hover:bg-cyan-600 text-white shadow-cyan-900/20"
                  : "bg-slate-800 cursor-not-allowed text-slate-500"
              }`}
            >
              {gameState.players.length < 2
                ? "Waiting for Runners..."
                : "Initialize Draft"}
            </button>
          ) : (
            <div className="text-center text-cyan-400/60 animate-pulse font-serif italic">
              Waiting for Admin...
            </div>
          )}
        </div>
        <NeonLogo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const isSelecting = gameState.turnState === "SELECTING";
    const isSummary = gameState.turnState === "ROUND_SUMMARY";
    const hasSelected = me?.selection.length > 0;
    const waitingForOthers = isSelecting && hasSelected;
    const opponents = gameState.players.filter((p) => p.id !== user.uid);
    const hasProxy = me.keptCards.includes("PROXY");

    // Game Over Ready Check
    const allPlayersReady = gameState.players.every((p) => p.ready);

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans">
        <FloatingBackground />

        {/* Overlays */}
        {feedback && (
          <FeedbackOverlay
            type={feedback.type}
            message={feedback.message}
            subtext={feedback.subtext}
            icon={feedback.type === "success" ? Trophy : Layers}
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
        {isSummary && (
          <RoundSummary
            players={gameState.players}
            round={gameState.round}
            isHost={gameState.hostId === user.uid}
            onNext={proceedToNextRound}
            onToggleReady={toggleReady}
            currentUserId={user.uid}
          />
        )}

        {/* Top Bar */}
        <div className="h-14 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-4 z-160 backdrop-blur-md sticky top-0">
          <div className="flex items-center gap-2">
            <span className="font-serif text-cyan-500 font-bold tracking-wider hidden md:block">
              NEON DRAFT
            </span>
            <span className="text-xs text-slate-500 bg-black/50 px-2 py-1 rounded">
              Round: {gameState.round}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRules(true)}
              className="p-2 hover:bg-slate-800 rounded text-slate-400"
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
        <div className="flex-1 p-4 flex flex-col items-center relative z-10 max-w-7xl mx-auto w-full gap-4">
          {/* Opponents */}
          <div className="w-full flex gap-2 overflow-x-auto pb-2 justify-start md:justify-center">
            {opponents.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900/80 p-2 rounded-lg border border-slate-700 min-w-[140px] flex flex-col gap-1"
              >
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="font-bold text-slate-300 truncate max-w-[80px]">
                    {p.name}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Trophy size={10} className="text-yellow-500" /> {p.score}
                  </div>
                </div>
                <div className="flex gap-0.5 justify-center bg-black/30 p-1 rounded">
                  {p.hand.map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-3 bg-slate-600 rounded-sm"
                    ></div>
                  ))}
                </div>
                {p.selection.length > 0 ? (
                  <div className="text-[10px] text-green-400 text-center font-bold flex items-center justify-center gap-1">
                    <CheckCircle size={10} /> Ready
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 text-center animate-pulse">
                    Thinking...
                  </div>
                )}
                {/* Mini Rig Preview */}
                <div className="flex flex-wrap gap-1 mt-1 justify-center">
                  {p.keptCards.map((c, i) => {
                    const info = CARDS[c];
                    const Icon = info?.icon || Database;
                    return (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-md border border-slate-600 flex items-center justify-center ${
                          info?.color
                            ? info.color
                                .replace("text", "bg")
                                .replace("400", "900")
                            : "bg-slate-800"
                        } bg-opacity-30`}
                      >
                        <Icon size={12} className={info?.color} />
                      </div>
                    );
                  })}
                  {p.backdoorCount > 0 && (
                    <div className="w-6 h-6 rounded-md border border-pink-500 bg-pink-900/30 flex items-center justify-center relative">
                      <Ghost size={12} className="text-pink-400" />
                      <span className="text-[8px] absolute -top-1 -right-1 bg-black text-white px-0.5 rounded-full border border-pink-500">
                        {p.backdoorCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* My Rig */}
          <div className="flex-1 w-full bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800 p-4 flex flex-col items-center min-h-[200px]">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2 w-full text-center border-b border-slate-800 pb-2 flex justify-between px-4">
              <span>My Rig</span>
              <span className="text-yellow-400 font-bold">{me.score} TB</span>
              <span className="text-pink-400 flex items-center gap-1">
                <Ghost size={10} /> {me.backdoorCount}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center content-start h-full overflow-y-auto w-full">
              {me.keptCards.length === 0 && (
                <div className="text-slate-600 italic mt-10">
                  System Empty. Acquire Data.
                </div>
              )}
              {me.keptCards.map((c, i) => (
                <Card key={i} typeId={c} small />
              ))}
            </div>
          </div>

          {/* Hand Selection */}
          <div
            className={`w-full max-w-4xl bg-slate-900/95 p-4 rounded-t-3xl border-t border-cyan-500/30 backdrop-blur-md mt-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 transition-all ${
              waitingForOthers ? "translate-y-4 opacity-90" : ""
            }`}
          >
            {gameState.status === "finished" ? (
              <div className="text-center py-6 w-full flex flex-col items-center">
                <h3 className="text-4xl font-black text-cyan-400 mb-2">
                  {gameState.winner} Wins!
                </h3>
                <p className="text-slate-400 mb-6">Mission Debriefing</p>

                {/* Detailed Scoreboard */}
                <div className="w-full overflow-x-auto mb-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs text-slate-500 uppercase border-b border-slate-700">
                        <th className="p-3">Runner</th>
                        <th className="p-3 text-center">R1</th>
                        <th className="p-3 text-center">R2</th>
                        <th className="p-3 text-center">R3</th>
                        <th className="p-3 text-center text-pink-400">
                          Backdoor
                        </th>
                        <th className="p-3 text-right text-cyan-400">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {gameState.players
                        .sort((a, b) => b.score - a.score)
                        .map((p) => {
                          const r1 =
                            p.history.find((h) => h.round === 1)?.score || 0;
                          const r2 =
                            p.history.find((h) => h.round === 2)?.score || 0;
                          const r3 =
                            p.history.find((h) => h.round === 3)?.score || 0;
                          const bdBonus = p.backdoorScore || 0;

                          return (
                            <tr
                              key={p.id}
                              className="border-b border-slate-800 hover:bg-slate-800/30"
                            >
                              <td className="p-3 font-bold flex items-center gap-2">
                                {p.name}
                                {p.backdoorCount > 0 && (
                                  <span className="text-[10px] text-pink-500 bg-pink-900/20 px-1 rounded flex items-center gap-0.5">
                                    <Ghost size={8} /> {p.backdoorCount}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center text-slate-400">
                                {r1}
                              </td>
                              <td className="p-3 text-center text-slate-400">
                                {r2}
                              </td>
                              <td className="p-3 text-center text-slate-400">
                                {r3}
                              </td>
                              <td
                                className={`p-3 text-center font-bold ${
                                  bdBonus > 0
                                    ? "text-green-400"
                                    : bdBonus < 0
                                      ? "text-red-400"
                                      : "text-slate-600"
                                }`}
                              >
                                {bdBonus > 0 ? "+" : ""}
                                {bdBonus}
                              </td>
                              <td className="p-3 text-right font-black text-cyan-400 text-lg">
                                {p.score}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* --- READY CHECK SECTION --- */}
                <div className="w-full max-w-md bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700">
                  <h4 className="text-slate-400 text-xs uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">
                    System Check
                  </h4>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {gameState.players.map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-2 rounded text-sm ${
                          p.ready
                            ? "bg-green-900/20 border border-green-500/30 text-green-300"
                            : "bg-slate-900 border border-slate-700 text-slate-500"
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        {p.ready ? (
                          <CheckCircle size={14} />
                        ) : (
                          <Clock size={14} className="animate-pulse" />
                        )}
                      </div>
                    ))}
                  </div>

                  {!me.ready ? (
                    <button
                      onClick={toggleReady}
                      className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded font-bold text-white shadow-lg animate-pulse"
                    >
                      MARK READY
                    </button>
                  ) : (
                    <div className="text-center text-green-400 text-sm font-bold flex items-center justify-center gap-2 py-2 bg-green-900/10 rounded">
                      <CheckCircle size={16} /> YOU ARE READY
                    </div>
                  )}
                </div>

                {/* --- HOST CONTROLS --- */}
                {gameState.hostId === user.uid && (
                  <div className="flex gap-4 justify-center w-full">
                    <button
                      onClick={startGame}
                      disabled={!allPlayersReady}
                      className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                        allPlayersReady
                          ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/50 shadow-lg"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <RotateCcw size={18} /> Restart
                    </button>
                    <button
                      onClick={returnToLobby}
                      disabled={!allPlayersReady}
                      className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                        allPlayersReady
                          ? "bg-slate-700 hover:bg-slate-600 text-white"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <Power size={18} /> Lobby
                    </button>
                  </div>
                )}
                {gameState.hostId === user.uid && !allPlayersReady && (
                  <div className="text-xs text-slate-500 mt-2 italic">
                    Waiting for all runners to mark ready...
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Smartphone size={18} className="text-cyan-400" /> Incoming
                    Stream ({me.hand.length})
                  </h3>

                  {/* Proxy Toggle */}
                  {hasProxy && !waitingForOthers && me.hand.length >= 2 && (
                    <button
                      onClick={() => {
                        setIsUsingProxy(!isUsingProxy);
                        setSelectedCardIndices([]);
                      }}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                        isUsingProxy
                          ? "bg-cyan-900/50 border-cyan-400 text-cyan-300"
                          : "bg-slate-800 border-slate-600 text-slate-400 hover:border-cyan-500"
                      }`}
                    >
                      {isUsingProxy ? (
                        <CheckCircle size={12} />
                      ) : (
                        <Repeat size={12} />
                      )}
                      Use Proxy Protocol {isUsingProxy ? "(Pick 2)" : ""}
                    </button>
                  )}

                  {waitingForOthers && (
                    <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold animate-pulse">
                      <Loader2 size={16} className="animate-spin" />
                      Synchronizing...
                    </div>
                  )}
                </div>

                {/* Cards Scroller */}
                <div className="flex gap-2 md:gap-4 overflow-x-auto pb-4 pt-4 px-2 justify-start md:justify-center min-h-[160px] md:min-h-[220px]">
                  {me.hand.map((c, i) => (
                    <div
                      key={i}
                      className={`transition-all duration-300 ${
                        waitingForOthers
                          ? "grayscale opacity-50 pointer-events-none scale-90"
                          : ""
                      }`}
                    >
                      <Card
                        typeId={c}
                        onClick={() => toggleCardSelection(i)}
                        selected={selectedCardIndices.includes(i)}
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={confirmSelection}
                  disabled={
                    selectedCardIndices.length === 0 || waitingForOthers
                  }
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all mt-2
                        ${
                          waitingForOthers
                            ? "bg-slate-800 text-cyan-400/50 cursor-wait border border-slate-700"
                            : selectedCardIndices.length > 0
                              ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/50"
                              : "bg-slate-800 text-slate-500 cursor-not-allowed"
                        }`}
                >
                  {waitingForOthers
                    ? "Waiting for other runners..."
                    : isUsingProxy && selectedCardIndices.length < 2
                      ? "Select 2nd Fragment..."
                      : "ACQUIRE DATA"}
                </button>
              </>
            )}
          </div>
        </div>
        <NeonLogo />
      </div>
    );
  }

  return null;
}
