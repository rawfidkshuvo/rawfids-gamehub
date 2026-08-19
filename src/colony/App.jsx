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
  Earth,
  Hexagon,
  TreeDeciduous,
  Mountain,
  Sun,
  AlertTriangle,
  Crown,
  Sparkles,
  Trophy,
  PawPrint,
  Cuboid,
  Leaf,
  Home,
  Dices,
  Grip,
  ArrowRightLeft,
  Building2,
  Skull,
  Anchor,
  Scroll,
  Handshake,
  Swords,
  Gem,
  X,
  StepBack,
  Play,
  RotateCcw,
  Copy,
  CheckCircle,
  Trash2,
  LogOut,
  Loader,
  Hammer,
  BookOpen,
  History,
  BarChart2,
} from "lucide-react";
import CoverImage from "./assets/catan.png";

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

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "colony-game";
const GAME_ID = "21";

// ---------------------------------------------------------------------------
// STYLES & VISUALS
// ---------------------------------------------------------------------------
const GlobalStyles = () => (
  <style>{`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249, 115, 22, 0.3); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(249, 115, 22, 0.6); }
    
    @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }
    .animate-float { animation: float infinite ease-in-out; }
    
    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-spin-slow { animation: spin-slow 12s linear infinite; }
    
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    @keyframes float-up {
        0% { transform: translate(-50%, 0) scale(0.8); opacity: 1; }
        100% { transform: translate(-50%, -40px) scale(1.2); opacity: 0; }
    }
    .animate-float-up { animation: float-up 2s ease-out forwards; }
    
    @keyframes slow-blink {
        0%, 100% { opacity: 1; box-shadow: 0 0 15px rgba(0,0,0,1); }
        50% { opacity: 0.5; box-shadow: 0 0 5px rgba(0,0,0,0.5); }
    }
    .animate-slow-blink { animation: slow-blink 3s ease-in-out infinite; }

    @keyframes flash-red {
      0%, 33%, 66%, 100% { box-shadow: inset 0 0 0px transparent; background-color: rgb(30, 41, 59); }
      16%, 50%, 83% { box-shadow: inset 0 0 20px rgba(239, 68, 68, 0.8); background-color: rgba(239, 68, 68, 0.3); }
    }
    .animate-flash-red { animation: flash-red 3s ease-in-out; }
  `}</style>
);

const FloatingBackground = React.memo(() => {
  const backgroundIcons = React.useMemo(() => {
    const icons = [TreeDeciduous, Mountain, Cuboid, PawPrint, Leaf, Sun];
    return [...Array(20)].map((_, i) => {
      const Icon = icons[i % icons.length];
      return (
        <div
          key={i}
          className="absolute animate-float text-white/10"
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
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-gray-950 to-black" />
      <div className="absolute top-0 left-0 w-full h-full opacity-30">
        {backgroundIcons}
      </div>
    </div>
  );
});


const GameLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Hexagon size={12} className="text-orange-500" />
    <span className="text-[10px] font-black tracking-widest text-orange-400 uppercase">
      COLONY
    </span>
  </div>
);

const GameLogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Hexagon size={20} className="text-orange-500" />
    <span className="text-[20px] font-black tracking-widest text-orange-500 uppercase">
      COLONY
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// GAME LOGIC & CONSTANTS
// ---------------------------------------------------------------------------
const HEX_SIZE = 50;
const RESOURCES = {
  WOOD: { id: "WOOD", color: "bg-emerald-700", border: "border-emerald-900", icon: TreeDeciduous, name: "Wood" },
  BRICK: { id: "BRICK", color: "bg-red-700", border: "border-red-900", icon: Cuboid, name: "Brick" },
  SHEEP: { id: "SHEEP", color: "bg-lime-500", border: "border-lime-700", icon: PawPrint, name: "Sheep" },
  WHEAT: { id: "WHEAT", color: "bg-yellow-500", border: "border-yellow-700", icon: Leaf, name: "Wheat" },
  ORE: { id: "ORE", color: "bg-slate-500", border: "border-slate-700", icon: Mountain, name: "Ore" },
  DESERT: { id: "DESERT", color: "bg-amber-200", border: "border-amber-400", icon: Sun, name: "Desert" },
};

const DEV_CARD_TYPES = {
  KNIGHT: { id: "KNIGHT", name: "Knight", desc: "Move the robber. Play before rolling.", icon: Swords },
  VP: { id: "VP", name: "Victory Point", desc: "Play to reveal and add +1 to your score.", icon: Trophy },
  ROAD: { id: "ROAD", name: "Road Building", desc: "Build 2 free roads.", icon: Grip },
  PLENTY: { id: "PLENTY", name: "Year of Plenty", desc: "Take any 2 resources.", icon: Gem },
  MONOPOLY: { id: "MONOPOLY", name: "Monopoly", desc: "Steal all of 1 resource type.", icon: Crown },
};

const PLAYER_COLORS = [
  { bg: "bg-blue-500", border: "border-blue-700", fill: "#3b82f6" },
  { bg: "bg-red-500", border: "border-red-700", fill: "#ef4444" },
  { bg: "bg-purple-500", border: "border-purple-700", fill: "#a855f7" },
  { bg: "bg-green-500", border: "border-green-700", fill: "#00ff00" },
];

const COSTS = {
  ROAD: { WOOD: 1, BRICK: 1, SHEEP: 0, WHEAT: 0, ORE: 0 },
  SETTLEMENT: { WOOD: 1, BRICK: 1, SHEEP: 1, WHEAT: 1, ORE: 0 },
  CITY: { WOOD: 0, BRICK: 0, SHEEP: 0, WHEAT: 2, ORE: 3 },
  DEV_CARD: { WOOD: 0, BRICK: 0, SHEEP: 1, WHEAT: 1, ORE: 1 },
};

const getHexCenter = (q, r) => ({ x: HEX_SIZE * Math.sqrt(3) * (q + r / 2), y: HEX_SIZE * (3 / 2) * r });
const getDistance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

const GENERATE_DECK = () => {
  let deck = [];
  for (let i = 0; i < 14; i++) deck.push("KNIGHT");
  for (let i = 0; i < 5; i++) deck.push("VP");
  for (let i = 0; i < 2; i++) deck.push("ROAD");
  for (let i = 0; i < 2; i++) deck.push("PLENTY");
  for (let i = 0; i < 2; i++) deck.push("MONOPOLY");
  return deck.sort(() => Math.random() - 0.5);
};

const getLongestRoad = (pId, board) => {
  const playerEdges = Object.values(board.edges).filter((e) => e.owner === pId);
  if (playerEdges.length === 0) return 0;
  let maxLen = 0;
  const dfs = (currentNodeId, visitedEdges) => {
    maxLen = Math.max(maxLen, visitedEdges.size);
    const node = board.nodes[currentNodeId];
    if (node.owner && node.owner !== pId && visitedEdges.size > 0) return;
    const connectedEdges = playerEdges.filter((e) => e.n1 === currentNodeId || e.n2 === currentNodeId);
    for (const edge of connectedEdges) {
      if (!visitedEdges.has(edge.id)) {
        visitedEdges.add(edge.id);
        const nextNodeId = edge.n1 === currentNodeId ? edge.n2 : edge.n1;
        dfs(nextNodeId, visitedEdges);
        visitedEdges.delete(edge.id);
      }
    }
  };
  const relevantNodes = new Set();
  playerEdges.forEach((e) => { relevantNodes.add(e.n1); relevantNodes.add(e.n2); });
  relevantNodes.forEach((startNodeId) => dfs(startNodeId, new Set()));
  return maxLen;
};

const getTotalScore = (p, gameState) => {
  let s = p.score || 0;
  if (gameState.longestRoad?.playerId === p.id) s += 2;
  if (gameState.largestArmy?.playerId === p.id) s += 2;
  return s;
};

const GENERATE_BOARD = () => {
  const hexes = {}; const nodes = {}; const edges = {};
  const gridShape = [
    { r: -2, qStart: 0, qEnd: 2 },
    { r: -1, qStart: -1, qEnd: 2 },
    { r: 0, qStart: -2, qEnd: 2 },
    { r: 1, qStart: -2, qEnd: 1 },
    { r: 2, qStart: -2, qEnd: 0 },
  ];

  const resourcePool = [
    "DESERT", "WOOD", "WOOD", "WOOD", "WOOD", "BRICK", "BRICK", "BRICK",
    "SHEEP", "SHEEP", "SHEEP", "SHEEP", "WHEAT", "WHEAT", "WHEAT", "WHEAT",
    "ORE", "ORE", "ORE",
  ].sort(() => Math.random() - 0.5);

  const numberPool = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12].sort(() => Math.random() - 0.5);

  gridShape.forEach(({ r, qStart, qEnd }) => {
    for (let q = qStart; q <= qEnd; q++) {
      const res = resourcePool.pop();
      const num = res === "DESERT" ? null : numberPool.pop();
      const center = getHexCenter(q, r);
      hexes[`${q},${r}`] = { q, r, resource: res, number: num, center };

      const W = Math.sqrt(3) * HEX_SIZE;
      const corners = [
        { x: center.x, y: center.y - HEX_SIZE },
        { x: center.x + W / 2, y: center.y - HEX_SIZE / 2 },
        { x: center.x + W / 2, y: center.y + HEX_SIZE / 2 },
        { x: center.x, y: center.y + HEX_SIZE },
        { x: center.x - W / 2, y: center.y + HEX_SIZE / 2 },
        { x: center.x - W / 2, y: center.y - HEX_SIZE / 2 },
      ];

      corners.forEach((c) => {
        const id = `${c.x.toFixed(1)},${c.y.toFixed(1)}`;
        if (!nodes[id]) nodes[id] = { id, x: c.x, y: c.y, owner: null, type: null, port: null };
      });

      for (let i = 0; i < 6; i++) {
        const c1 = corners[i]; const c2 = corners[(i + 1) % 6];
        const mx = (c1.x + c2.x) / 2; const my = (c1.y + c2.y) / 2;
        const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x) * (180 / Math.PI);
        const id = `${mx.toFixed(1)},${my.toFixed(1)}`;
        const id1 = `${c1.x.toFixed(1)},${c1.y.toFixed(1)}`;
        const id2 = `${c2.x.toFixed(1)},${c2.y.toFixed(1)}`;

        if (!edges[id]) edges[id] = { id, x: mx, y: my, angle, owner: null, hexes: [], n1: id1, n2: id2, port: null };
        if (!edges[id].hexes.includes(`${q},${r}`)) edges[id].hexes.push(`${q},${r}`);
      }
    }
  });

  const outerEdges = Object.values(edges).filter((e) => e.hexes.length === 1);
  outerEdges.sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));

  const ports = ["3:1", "3:1", "3:1", "3:1", "WOOD_2:1", "BRICK_2:1", "SHEEP_2:1", "WHEAT_2:1", "ORE_2:1"].sort(() => Math.random() - 0.5);

  let portIdx = 0;
  for (let i = 0; i < outerEdges.length; i += 3) {
    if (portIdx < ports.length) {
      const edge = outerEdges[i];
      edge.port = ports[portIdx];
      nodes[edge.n1].port = ports[portIdx];
      nodes[edge.n2].port = ports[portIdx];
      portIdx++;
    }
  }

  return { hexes, nodes, edges };
};

// ---------------------------------------------------------------------------
// SUBCOMPONENTS (Modals & UI)
// ---------------------------------------------------------------------------
const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
    <div className={`flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl border-4 shadow-2xl backdrop-blur-xl max-w-sm md:max-w-xl mx-4 text-center ${
        type === "success" ? "bg-orange-900/90 border-orange-500 text-orange-100" :
        type === "failure" ? "bg-red-900/90 border-red-500 text-red-100" :
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
  <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
    <div className="bg-slate-900 border border-orange-900/50 w-full max-w-3xl rounded-3xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
        <X size={24} className="text-white" />
      </button>
      <h2 className="text-3xl font-black text-center mb-6 text-orange-400">Settler's Guide</h2>
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Hexagon className="text-orange-500" /> Building Costs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div className="bg-slate-800 p-4 rounded-xl border border-orange-900/30">
              <strong className="text-orange-400 block mb-1">Roads</strong>
              <div className="flex gap-2 mb-2">
                <span className="bg-emerald-900/50 px-2 py-1 rounded">1 Wood</span>
                <span className="bg-red-900/50 px-2 py-1 rounded">1 Brick</span>
              </div>
              <p className="text-xs">Connects your settlements. Longest continuous road (5+) earns 2 VP.</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-orange-900/30">
              <strong className="text-orange-400 block mb-1">Settlement (1 VP)</strong>
              <div className="flex gap-2 mb-2 flex-wrap">
                <span className="bg-emerald-900/50 px-2 py-1 rounded">1 Wood</span>
                <span className="bg-red-900/50 px-2 py-1 rounded">1 Brick</span>
                <span className="bg-lime-900/50 px-2 py-1 rounded">1 Sheep</span>
                <span className="bg-yellow-900/50 px-2 py-1 rounded">1 Wheat</span>
              </div>
              <p className="text-xs">Must be placed at least 2 edges away from any other settlement.</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-orange-900/30">
              <strong className="text-orange-400 block mb-1">City (2 VP)</strong>
              <div className="flex gap-2 mb-2">
                <span className="bg-yellow-900/50 px-2 py-1 rounded">2 Wheat</span>
                <span className="bg-slate-700/50 px-2 py-1 rounded">3 Ore</span>
              </div>
              <p className="text-xs">Upgrades a settlement. Yields double resources from hexes.</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-orange-900/30">
              <strong className="text-orange-400 block mb-1">Dev Card</strong>
              <div className="flex gap-2 mb-2">
                <span className="bg-lime-900/50 px-2 py-1 rounded">1 Sheep</span>
                <span className="bg-yellow-900/50 px-2 py-1 rounded">1 Wheat</span>
                <span className="bg-slate-700/50 px-2 py-1 rounded">1 Ore</span>
              </div>
              <p className="text-xs">Grants Knights, special abilities, or hidden Victory Points.</p>
            </div>
          </div>
        </section>
      </div>
      <div className="mt-8 flex flex-col items-center gap-2">
        <button onClick={onClose} className="px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all bg-gradient-to-br from-orange-600 to-amber-700 text-white hover:bg-orange-400 hover:scale-105">
          Return to Game
        </button>
      </div>
    </div>
  </div>
);

const ScoreboardModal = ({ gameState, onClose }) => (
  <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-md flex items-center justify-center pt-20 pb-10 px-4">
    <div className="bg-slate-900 border border-orange-900/50 w-full max-w-lg rounded-3xl shadow-2xl p-6 relative flex flex-col max-h-full">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors z-10"><X size={24} className="text-white" /></button>
      <div className="shrink-0 mb-6">
        <h2 className="text-2xl font-black text-center text-orange-400 flex items-center justify-center gap-2"><BarChart2 /> Live Scores</h2>
      </div>
      <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
        {gameState.players.slice().sort((a,b) => getTotalScore(b, gameState) - getTotalScore(a, gameState)).map((p) => {
          const totalScore = getTotalScore(p, gameState);
          const hasLongestRoad = gameState.longestRoad?.playerId === p.id;
          const hasLargestArmy = gameState.largestArmy?.playerId === p.id;
          return (
            <div key={p.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2">
                <span className="font-bold text-lg" style={{color: PLAYER_COLORS[p.colorIdx].fill}}>{p.name}</span>
                <span className="text-2xl font-black text-yellow-500">{totalScore}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400">
                <div className="flex justify-between text-slate-300"><span>VP (Buildings):</span><span className="font-bold text-white">{p.score}</span></div>
                <div className="flex justify-between text-slate-300"><span>Knights Played:</span><span className="font-bold text-white">{p.playedKnights}</span></div>
                <div className="flex justify-between text-slate-300"><span>Road Length:</span><span className="font-bold text-white">{p.roadLength}</span></div>
                <div className="flex justify-between text-slate-300"><span>Dev Cards (Hidden):</span><span className="font-bold text-white">{Object.values(p.devCards).reduce((a,b)=>a+b,0) + Object.values(p.newDevCards).reduce((a,b)=>a+b,0)}</span></div>
                
                {hasLongestRoad && <div className="col-span-2 flex justify-between text-orange-400 font-bold bg-orange-900/20 px-2 py-1 rounded mt-1"><span className="flex items-center gap-1"><Grip size={12}/> Longest Road</span><span>+2</span></div>}
                {hasLargestArmy && <div className="col-span-2 flex justify-between text-red-400 font-bold bg-red-900/20 px-2 py-1 rounded mt-1"><span className="flex items-center gap-1"><Swords size={12}/> Largest Army</span><span>+2</span></div>}
              </div>
            </div>
          );
        })}
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
    const saved = localStorage.getItem("equilibrium_roomId");
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
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-emerald-500/50">
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
            className="group relative px-12 py-5 bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/50 hover:border-orange-400 text-orange-300 font-black text-2xl tracking-widest rounded-none transform transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] backdrop-blur-md overflow-hidden"
          >
            {/* Animated Scanline overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-400/10 to-transparent translate-y-[-100%] animate-[scan_2s_infinite_linear]" />

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
        Inspired by Catan. A tribute game.
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
export default function ColonyGame() {
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

  // Modals & UI States
  const [showLogs, setShowLogs] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showDevModal, setShowDevCards] = useState(false);
  const [activeBuildMode, setActiveBuildMode] = useState(null);
  const [popupContent, setPopupContent] = useState(null);
  const [resourceAnimations, setResourceAnimations] = useState({});
  const [flashDice, setFlashDice] = useState(false);
  const [offerTokens, setOfferTokens] = useState({ WOOD: 0, BRICK: 0, WHEAT: 0, SHEEP: 0, ORE: 0 });
  const [requestTokens, setRequestTokens] = useState({ WOOD: 0, BRICK: 0, WHEAT: 0, SHEEP: 0, ORE: 0 });
  const [discardTokens, setDiscardTokens] = useState({ WOOD: 0, BRICK: 0, WHEAT: 0, SHEEP: 0, ORE: 0 });
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [mustDiscardAmount, setMustDiscardAmount] = useState(0);

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
        const savedName = localStorage.getItem("gameHub_playerName") || localStorage.getItem("colony_playerName");
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
          setRoomId("");
          localStorage.removeItem("colony_roomId");
          setView("menu");
          setError("You were removed from the world.");
          return;
        }
        setGameState(data);
        if (data.status === "playing" || data.status === "finished") setView("game");
        else if (data.status === "lobby") setView("lobby");

        handleGamePopups(data);
        handleDiscardPhase(data);
      } else {
        setView("menu");
        setRoomId("");
        localStorage.removeItem("colony_roomId");
        setError("World collapsed.");
      }
    }, (err) => { console.error(err); setError("Connection lost."); });
    return () => unsub();
  }, [roomId, user]);

  const handleSplashStart = () => {
    const savedRoomId = localStorage.getItem("colony_roomId");
    if (savedRoomId) { setLoading(true); setRoomId(savedRoomId); setView("menu"); }
    else { setView("menu"); }
  };

  const prevDice = useRef(null);
  useEffect(() => {
    if (gameState?.dice && prevDice.current) {
      if ((gameState.hasRolled && !prevDice.current.hasRolled) || gameState.dice[0] !== prevDice.current.dice[0] || gameState.dice[1] !== prevDice.current.dice[1]) {
        setFlashDice(true);
        setTimeout(() => setFlashDice(false), 3000);
      }
    }
    prevDice.current = { dice: gameState?.dice || [1, 1], hasRolled: gameState?.hasRolled };
  }, [gameState?.dice, gameState?.hasRolled]);

  const pIdx = gameState?.players?.findIndex((p) => p.id === user?.uid) ?? -1;
  const me = pIdx !== -1 ? gameState.players[pIdx] : null;

  const prevResources = useRef(null);
  useEffect(() => {
    if (!me) return;
    if (prevResources.current) {
      const newAnims = { ...resourceAnimations };
      let changed = false;
      Object.keys(me.resources).forEach((res) => {
        const diff = me.resources[res] - prevResources.current[res];
        if (diff !== 0) {
          changed = true;
          if (!newAnims[res]) newAnims[res] = [];
          const id = Date.now() + Math.random();
          newAnims[res].push({ id, val: diff });
          setTimeout(() => {
            setResourceAnimations((curr) => {
              const updated = { ...curr };
              if (updated[res]) updated[res] = updated[res].filter((a) => a.id !== id);
              return updated;
            });
          }, 2000);
        }
      });
      if (changed) setResourceAnimations(newAnims);
    }
    prevResources.current = { ...me.resources };
  }, [me?.resources]);

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
        icon: latestLog.type === "success" ? Sparkles : AlertTriangle,
      });
      setTimeout(() => setFeedback(null), 2500);
    }
  }, [gameState?.logs]);

  const handleDiscardPhase = (data) => {
    if (data.turnPhase === "DISCARD") {
      const currentPlayer = data.players.find((p) => p.id === user?.uid);
      const needsToDiscard = data.discardingPlayers && data.discardingPlayers.includes(user?.uid);
      if (needsToDiscard && !showDiscardModal) {
        const count = Object.values(currentPlayer.resources).reduce((a, b) => a + b, 0);
        const toLose = Math.floor(count / 2);
        setMustDiscardAmount(toLose);
        setShowDiscardModal(true);
        setDiscardTokens({ WOOD: 0, BRICK: 0, WHEAT: 0, SHEEP: 0, ORE: 0 });
      } else if (!needsToDiscard) setShowDiscardModal(false);
    } else setShowDiscardModal(false);
  };

  const handleGamePopups = (data) => {
    const idx = data.players.findIndex((p) => p.id === user?.uid);
    if (idx === -1) return;
    if (data.turnPhase === "ROBBER_STEAL" && data.turnIndex === idx) {
      const hexNodes = getHexVertices(data.robberTarget.q, data.robberTarget.r, data.board.nodes);
      const victims = [...new Set(hexNodes.filter((n) => n.owner && n.owner !== user.uid).map((n) => n.owner))];
      if (victims.length > 0) { setPopupContent({ type: "STEAL", victims }); return; }
      else {
        const nextPhase = data.hasRolled ? "MAIN" : "ROLL";
        updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { turnPhase: nextPhase });
      }
    }
    if (data.activeTrade && data.activeTrade.senderId !== user.uid && !data.activeTrade.responses?.[user.uid]) {
      setPopupContent({ type: "INCOMING_TRADE", trade: data.activeTrade }); return;
    }
    if (data.turnPhase === "YEAR_OF_PLENTY" && data.turnIndex === idx) { setPopupContent({ type: "YEAR_OF_PLENTY" }); return; }
    if (data.turnPhase === "MONOPOLY" && data.turnIndex === idx) { setPopupContent({ type: "MONOPOLY" }); return; }
    setPopupContent(null);
  };

  const triggerLog = (text, type = "neutral", important = false, title = "") => ({ text, type, important, title, id: Date.now() + Math.random() });

  const getHexVertices = (q, r, allNodes) => {
    const center = getHexCenter(q, r);
    return Object.values(allNodes).filter((node) => getDistance(center.x, center.y, node.x, node.y) < HEX_SIZE + 5);
  };

  const checkVictory = (players, longestRoadState, largestArmyState) => {
    const idx = players.findIndex((p) => p.id === user.uid);
    if (idx === -1) return false;
    let total = players[idx].score;
    if (longestRoadState?.playerId === user.uid) total += 2;
    if (largestArmyState?.playerId === user.uid) total += 2;
    return total >= 10;
  };

  const createRoom = async () => {
    if (!playerName) return setError("Enter Name");
    localStorage.setItem("gameHub_playerName", playerName);
    localStorage.setItem("colony_playerName", playerName);
    setLoading(true);
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const initialData = {
      roomId: newId, hostId: user.uid, status: "lobby",
      players: [{
        id: user.uid, name: playerName, colorIdx: 0, score: 0,
        resources: { WOOD: 0, BRICK: 0, WHEAT: 0, SHEEP: 0, ORE: 0 },
        devCards: { KNIGHT: 0, VP: 0, ROAD: 0, PLENTY: 0, MONOPOLY: 0 },
        newDevCards: { KNIGHT: 0, VP: 0, ROAD: 0, PLENTY: 0, MONOPOLY: 0 },
        usedDevCards: { KNIGHT: 0, VP: 0, ROAD: 0, PLENTY: 0, MONOPOLY: 0 },
        playedKnights: 0, hasPlayedDevCard: false, roadLength: 0,
      }],
      longestRoad: { playerId: null, length: 4 },
      largestArmy: { playerId: null, size: 2 },
      hasRolled: false, board: null, devDeck: [], activeTrade: null,
      turnIndex: 0, turnPhase: "SETUP_SETTLEMENT", setupRound: 1, dice: [1, 1], robberHex: null, logs: [], discardingPlayers: [],
    };
    try {
      await setDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId), initialData);
      setRoomId(newId);
      localStorage.setItem("colony_roomId", newId);
    } catch (e) { setError("Failed to create world."); }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCode || !playerName) return setError("Enter details");
    localStorage.setItem("gameHub_playerName", playerName);
    localStorage.setItem("colony_playerName", playerName);
    setLoading(true);
    try {
      const code = roomCode.toUpperCase().trim();
      const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", code);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data().status === "lobby") {
        const data = snap.data();
        if (!data.players.some((p) => p.id === user.uid)) {
          if (data.players.length >= 4) { setError("World is full."); setLoading(false); return; }
          const newPlayers = [...data.players, {
            id: user.uid, name: playerName, colorIdx: data.players.length, score: 0,
            resources: { WOOD: 0, BRICK: 0, WHEAT: 0, SHEEP: 0, ORE: 0 },
            devCards: { KNIGHT: 0, VP: 0, ROAD: 0, PLENTY: 0, MONOPOLY: 0 },
            newDevCards: { KNIGHT: 0, VP: 0, ROAD: 0, PLENTY: 0, MONOPOLY: 0 },
            usedDevCards: { KNIGHT: 0, VP: 0, ROAD: 0, PLENTY: 0, MONOPOLY: 0 },
            playedKnights: 0, hasPlayedDevCard: false, roadLength: 0,
          }];
          await updateDoc(ref, { players: newPlayers });
        }
        setRoomId(code);
        localStorage.setItem("colony_roomId", code);
      } else setError("Room not found or in progress");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const startGame = async () => {
    const board = GENERATE_BOARD();
    const desertEntry = Object.entries(board.hexes).find(([_, h]) => h.resource === "DESERT");
    const robberHex = desertEntry ? desertEntry[0] : "0,0";
    const devDeck = GENERATE_DECK();
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      status: "playing", board, robberHex, devDeck, turnIndex: 0, turnPhase: "SETUP_SETTLEMENT", setupRound: 1, dice: [1, 1],
      hasRolled: false, longestRoad: { playerId: null, length: 4 }, largestArmy: { playerId: null, size: 2 },
      logs: arrayUnion({ text: "The settlement begins.", important: true, type: "success", id: Date.now() }),
      discardingPlayers: [],
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setIsCopied(true); setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      const el = document.createElement("textarea"); el.value = roomId; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
      setIsCopied(true); setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleLeave = async () => {
    if (!roomId) return;
    try {
      const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);
      if (gameState.hostId === user.uid) await deleteDoc(ref);
      else {
        const newPlayers = gameState.players.filter((p) => p.id !== user.uid);
        await updateDoc(ref, { players: newPlayers });
      }
    } catch (e) { console.log("Room gone"); }
    localStorage.removeItem("colony_roomId");
    setRoomId(""); setView("menu"); setShowLeaveConfirm(false); setGameState(null);
  };

  const kickPlayer = async (targetId) => {
    if (!gameState || gameState.hostId !== user.uid) return;
    try {
      const newPlayers = gameState.players.filter((p) => p.id !== targetId);
      await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { players: newPlayers, logs: arrayUnion(triggerLog("A player was removed from the world.", "warning")) });
    } catch (e) { console.error("Error kicking player:", e); }
  };

  const returnToLobby = async () => {
    if (gameState.hostId !== user.uid) return;
    const players = gameState.players.map((p) => ({
      ...p, score: 0, resources: { WOOD: 0, BRICK: 0, WHEAT: 0, SHEEP: 0, ORE: 0 },
      devCards: { KNIGHT: 0, VP: 0, ROAD: 0, PLENTY: 0, MONOPOLY: 0 }, newDevCards: { KNIGHT: 0, VP: 0, ROAD: 0, PLENTY: 0, MONOPOLY: 0 },
      usedDevCards: { KNIGHT: 0, VP: 0, ROAD: 0, PLENTY: 0, MONOPOLY: 0 }, playedKnights: 0, hasPlayedDevCard: false, roadLength: 0,
    }));
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      status: "lobby", players, board: null, longestRoad: { playerId: null, length: 4 }, largestArmy: { playerId: null, size: 2 },
      hasRolled: false, devDeck: [], activeTrade: null, turnIndex: 0, turnPhase: "SETUP_SETTLEMENT", setupRound: 1,
      dice: [1, 1], robberHex: null, logs: [], discardingPlayers: [],
    });
  };

  const handleRollDice = async () => {
    if (gameState.turnIndex !== pIdx || gameState.turnPhase !== "ROLL" || gameState.hasRolled) return;
    const d1 = Math.floor(Math.random() * 6) + 1; const d2 = Math.floor(Math.random() * 6) + 1; const total = d1 + d2;
    let updates = { dice: [d1, d2], hasRolled: true };
    let logs = [triggerLog(`${me.name} rolled a ${total}!`)];
    let players = JSON.parse(JSON.stringify(gameState.players));

    if (total === 7) {
      logs.push(triggerLog(`The Robber strikes!`, "failure", true, "SEVEN ROLLED"));
      let playersToDiscard = [];
      players.forEach((p) => {
        const count = Object.values(p.resources).reduce((a, b) => a + b, 0);
        if (count > 7) playersToDiscard.push(p.id);
      });
      if (playersToDiscard.length > 0) { updates.turnPhase = "DISCARD"; updates.discardingPlayers = playersToDiscard; logs.push(triggerLog(`Waiting for players to discard cards...`)); }
      else { updates.turnPhase = "ROBBER"; }
    } else {
      updates.turnPhase = "MAIN";
      const producingHexes = Object.values(gameState.board.hexes).filter((h) => h.number === total && `${h.q},${h.r}` !== gameState.robberHex);
      let produced = false;
      producingHexes.forEach((hex) => {
        const hexCorners = getHexVertices(hex.q, hex.r, gameState.board.nodes);
        hexCorners.forEach((node) => {
          if (node.owner) {
            const ownerIdx = players.findIndex((p) => p.id === node.owner);
            if (ownerIdx !== -1) {
              const amount = node.type === "CITY" ? 2 : 1;
              players[ownerIdx].resources[hex.resource] += amount;
              produced = true;
            }
          }
        });
      });
      if (produced) logs.push(triggerLog(`Resources produced from ${total}.`));
    }
    updates.players = players;
    if (logs.length > 0) updates.logs = arrayUnion(...logs);
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
  };

  const submitDiscard = async () => {
    const totalDiscarded = Object.values(discardTokens).reduce((a, b) => a + b, 0);
    if (totalDiscarded !== mustDiscardAmount) return alert(`You must discard exactly ${mustDiscardAmount} cards.`);
    let valid = true; Object.keys(discardTokens).forEach((k) => { if (me.resources[k] < discardTokens[k]) valid = false; });
    if (!valid) return alert("You don't have those resources!");

    let players = JSON.parse(JSON.stringify(gameState.players));
    Object.keys(discardTokens).forEach((k) => { players[pIdx].resources[k] -= discardTokens[k]; });
    let discardingPlayers = gameState.discardingPlayers.filter((id) => id !== user.uid);
    let updates = { players, discardingPlayers };
    let logs = [triggerLog(`${me.name} discarded ${mustDiscardAmount} cards.`)];

    if (discardingPlayers.length === 0) { updates.turnPhase = "ROBBER"; logs.push(triggerLog(`All players discarded. Place the robber!`)); }
    updates.logs = arrayUnion(...logs);
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
    setShowDiscardModal(false);
  };

  const handlePlaceRobber = async (q, r) => {
    if (gameState.turnIndex !== pIdx || gameState.turnPhase !== "ROBBER") return;
    const hexId = `${q},${r}`;
    if (hexId === gameState.robberHex) return;
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      robberHex: hexId, robberTarget: { q, r }, turnPhase: "ROBBER_STEAL", logs: arrayUnion(triggerLog(`Robber moved to ${hexId}.`)),
    });
  };

  const executeSteal = async (victimId) => {
    let players = JSON.parse(JSON.stringify(gameState.players));
    let logs = [];
    const victimIdx = players.findIndex((p) => p.id === victimId);
    const v = players[victimIdx];
    const resKeys = Object.keys(v.resources).filter((k) => v.resources[k] > 0);
    if (resKeys.length > 0) {
      const stolenRes = resKeys[Math.floor(Math.random() * resKeys.length)];
      v.resources[stolenRes]--; players[pIdx].resources[stolenRes]++; logs.push(triggerLog(`Stole a resource from ${v.name}.`));
    } else { logs.push(triggerLog(`${v.name} had no resources to steal.`)); }
    let nextPhase = gameState.hasRolled ? "MAIN" : "ROLL";
    let updates = { players, turnPhase: nextPhase };
    if (logs.length > 0) updates.logs = arrayUnion(...logs);
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
    setPopupContent(null);
  };

  const getTradeRatios = (pId, board) => {
    let ratios = { WOOD: 4, BRICK: 4, SHEEP: 4, WHEAT: 4, ORE: 4 };
    Object.values(board.nodes).forEach((n) => {
      if (n.owner === pId && n.port) {
        if (n.port === "3:1") Object.keys(ratios).forEach((k) => (ratios[k] = Math.min(ratios[k], 3)));
        else { const res = n.port.split("_")[0]; ratios[res] = 2; }
      }
    });
    return ratios;
  };

  const executeBankTrade = async () => {
    let players = JSON.parse(JSON.stringify(gameState.players));
    const ratios = getTradeRatios(user.uid, gameState.board);
    let allowedPicks = 0; let validOffer = true;
    Object.keys(offerTokens).forEach((res) => {
      if (offerTokens[res] > 0) {
        if (players[pIdx].resources[res] < offerTokens[res]) validOffer = false;
        if (offerTokens[res] % ratios[res] !== 0) validOffer = false;
        allowedPicks += Math.floor(offerTokens[res] / ratios[res]);
      }
    });
    const requestedPicks = Object.values(requestTokens).reduce((a, b) => a + b, 0);
    if (!validOffer) return alert("Offer must be exactly in multiples of your bank/port ratios!");
    if (requestedPicks !== allowedPicks || requestedPicks === 0) return alert(`You offered enough for ${allowedPicks} resources, but requested ${requestedPicks}.`);

    Object.keys(offerTokens).forEach((res) => (players[pIdx].resources[res] -= offerTokens[res]));
    Object.keys(requestTokens).forEach((res) => (players[pIdx].resources[res] += requestTokens[res]));

    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      players, logs: arrayUnion(triggerLog(`${me.name} traded with the bank.`)),
    });
    setShowTradeModal(false); setOfferTokens({ WOOD: 0, BRICK: 0, WHEAT: 0, SHEEP: 0, ORE: 0 }); setRequestTokens({ WOOD: 0, BRICK: 0, WHEAT: 0, SHEEP: 0, ORE: 0 });
  };

  const proposeDomesticTrade = async () => {
    let hasOffer = Object.values(offerTokens).some((v) => v > 0); let hasReq = Object.values(requestTokens).some((v) => v > 0);
    if (!hasOffer || !hasReq) return alert("Must offer and request something.");
    let valid = true; Object.keys(offerTokens).forEach((k) => { if (me.resources[k] < offerTokens[k]) valid = false; });
    if (!valid) return alert("You don't have those resources!");

    const trade = { id: Date.now(), senderId: user.uid, senderName: me.name, offer: offerTokens, request: requestTokens, responses: {} };
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { activeTrade: trade, logs: arrayUnion(triggerLog(`${me.name} proposed a domestic trade.`)) });
    setShowTradeModal(false);
  };

  const respondToTrade = async (accept) => {
    const active = gameState.activeTrade; if (!active) return;
    if (accept) {
      let valid = true; Object.keys(active.request).forEach((k) => { if (me.resources[k] < active.request[k]) valid = false; });
      if (!valid) return alert("You don't have the resources to accept this trade.");

      let players = JSON.parse(JSON.stringify(gameState.players));
      const senderIdx = players.findIndex((p) => p.id === active.senderId);
      Object.keys(active.offer).forEach((k) => { players[senderIdx].resources[k] -= active.offer[k]; players[pIdx].resources[k] += active.offer[k]; });
      Object.keys(active.request).forEach((k) => { players[pIdx].resources[k] -= active.request[k]; players[senderIdx].resources[k] += active.request[k]; });

      await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { players, activeTrade: null, logs: arrayUnion(triggerLog(`${me.name} accepted ${active.senderName}'s trade!`, "success")) });
    } else {
      await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { [`activeTrade.responses.${user.uid}`]: "rejected" });
    }
    setPopupContent(null);
  };

  const handleBuyDevCard = async () => {
    if (gameState.turnIndex !== pIdx || gameState.turnPhase !== "MAIN") return;
    let players = JSON.parse(JSON.stringify(gameState.players)); let deck = [...gameState.devDeck];
    const cost = COSTS.DEV_CARD;
    if (Object.keys(cost).some((k) => players[pIdx].resources[k] < cost[k])) return alert("Not enough resources!");
    if (deck.length === 0) return alert("Deck is empty!");

    Object.keys(cost).forEach((k) => (players[pIdx].resources[k] -= cost[k]));
    const card = deck.pop(); let updates = { devDeck: deck }; let logs = [triggerLog(`${me.name} bought a Development Card.`)];
    if (card === "VP") players[pIdx].devCards["VP"]++; else players[pIdx].newDevCards[card]++;

    updates.players = players; updates.logs = arrayUnion(...logs);
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
  };

  const playDevCard = async (type) => {
    if (gameState.turnIndex !== pIdx) return;
    if (type !== "VP" && gameState.players[pIdx].hasPlayedDevCard) return alert("You can only play one Development Card per turn.");
    let players = JSON.parse(JSON.stringify(gameState.players)); let updates = {}; let logs = [];

    if (type === "VP") {
      const vpCount = players[pIdx].devCards["VP"]; players[pIdx].devCards["VP"] = 0;
      if (!players[pIdx].usedDevCards) players[pIdx].usedDevCards = { KNIGHT: 0, VP: 0, ROAD: 0, PLENTY: 0, MONOPOLY: 0 };
      players[pIdx].usedDevCards["VP"] += vpCount; players[pIdx].score += vpCount;
      logs.push(triggerLog(`${players[pIdx].name} revealed ${vpCount} Victory Point Card${vpCount > 1 ? "s" : ""}!`, "important", true));
    } else {
      players[pIdx].devCards[type]--; players[pIdx].hasPlayedDevCard = true;
      if (!players[pIdx].usedDevCards) players[pIdx].usedDevCards = { KNIGHT: 0, VP: 0, ROAD: 0, PLENTY: 0, MONOPOLY: 0 };
      players[pIdx].usedDevCards[type]++; logs.push(triggerLog(`${players[pIdx].name} played a ${DEV_CARD_TYPES[type].name} Card!`, "important", true));

      if (type === "KNIGHT") {
        players[pIdx].playedKnights++;
        const currentArmySize = gameState.largestArmy?.size || 2; const currentArmyHolder = gameState.largestArmy?.playerId;
        if (players[pIdx].playedKnights > currentArmySize) {
          updates.largestArmy = { playerId: user.uid, size: players[pIdx].playedKnights };
          if (currentArmyHolder !== user.uid) logs.push(triggerLog(`${players[pIdx].name} took the Largest Army!`, "important", true));
        }
        updates.turnPhase = "ROBBER";
      } else if (type === "ROAD") updates.turnPhase = "ROAD_BUILDING_1";
      else if (type === "PLENTY") updates.turnPhase = "YEAR_OF_PLENTY";
      else if (type === "MONOPOLY") updates.turnPhase = "MONOPOLY";
    }

    if (checkVictory(players, gameState.longestRoad, updates.largestArmy || gameState.largestArmy)) {
      updates.status = "finished"; logs.push(triggerLog(`${players[pIdx].name} wins the game!`, "important", true, "VICTORY"));
    }

    updates.players = players; updates.logs = arrayUnion(...logs);
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
    setShowDevCards(false);
  };

  const handleYearOfPlenty = async (res1, res2) => {
    let players = JSON.parse(JSON.stringify(gameState.players)); players[pIdx].resources[res1]++; players[pIdx].resources[res2]++;
    let nextPhase = gameState.hasRolled ? "MAIN" : "ROLL";
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { players, turnPhase: nextPhase, logs: arrayUnion(triggerLog(`${me.name} took ${res1} and ${res2} via Year of Plenty.`)) });
    setPopupContent(null);
  };

  const handleMonopoly = async (res) => {
    let players = JSON.parse(JSON.stringify(gameState.players)); let totalStolen = 0;
    players.forEach((p, i) => { if (i !== pIdx) { totalStolen += p.resources[res]; p.resources[res] = 0; } });
    players[pIdx].resources[res] += totalStolen;
    let nextPhase = gameState.hasRolled ? "MAIN" : "ROLL";
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { players, turnPhase: nextPhase, logs: arrayUnion(triggerLog(`${me.name} stole ${totalStolen} ${res} via Monopoly!`)) });
    setPopupContent(null);
  };

  const isValidSettlement = (nodeId) => {
    const node = gameState.board.nodes[nodeId]; if (node.owner) return false;
    const tooClose = Object.values(gameState.board.nodes).some((n) => n.owner && getDistance(n.x, n.y, node.x, node.y) < HEX_SIZE + 5);
    if (tooClose) return false;
    if (gameState.turnPhase.startsWith("SETUP_")) return true;
    const hasRoad = Object.values(gameState.board.edges).some((e) => e.owner === user.uid && getDistance(e.x, e.y, node.x, node.y) < HEX_SIZE / 2 + 5);
    return hasRoad;
  };

  const isValidRoad = (edgeId) => {
    const edge = gameState.board.edges[edgeId]; if (edge.owner) return false;
    const connectedToMyNode = Object.values(gameState.board.nodes).some((n) => n.owner === user.uid && getDistance(n.x, n.y, edge.x, edge.y) < HEX_SIZE / 2 + 5);
    const myRoads = Object.values(gameState.board.edges).filter((e) => e.owner === user.uid);
    const validConnectedRoad = myRoads.some((myRoad) => {
      const sharedNodeId = [myRoad.n1, myRoad.n2].find((n) => n === edge.n1 || n === edge.n2);
      if (sharedNodeId) { const node = gameState.board.nodes[sharedNodeId]; if (node.owner && node.owner !== user.uid) return false; return true; } return false;
    });
    if (gameState.turnPhase.startsWith("SETUP_ROAD")) return connectedToMyNode;
    return connectedToMyNode || validConnectedRoad;
  };

  const handleBuildNode = async (nodeId) => {
    if (gameState.turnIndex !== pIdx) return;
    let updates = {}; let players = JSON.parse(JSON.stringify(gameState.players)); let board = JSON.parse(JSON.stringify(gameState.board)); let logs = [];

    if (activeBuildMode === "SETTLEMENT" || gameState.turnPhase === "SETUP_SETTLEMENT") {
      if (!isValidSettlement(nodeId)) return;
      if (!gameState.turnPhase.startsWith("SETUP_")) {
        const cost = COSTS.SETTLEMENT;
        if (Object.keys(cost).some((k) => players[pIdx].resources[k] < cost[k])) return alert("Not enough resources!");
        Object.keys(cost).forEach((k) => (players[pIdx].resources[k] -= cost[k]));
      }

      board.nodes[nodeId].owner = user.uid; board.nodes[nodeId].type = "SETTLEMENT"; players[pIdx].score += 1;

      let maxRoadLength = 4; let maxPlayers = [];
      players.forEach((p) => {
        const pRoadLen = getLongestRoad(p.id, board); p.roadLength = pRoadLen;
        if (pRoadLen > maxRoadLength) { maxRoadLength = pRoadLen; maxPlayers = [p.id]; }
        else if (pRoadLen === maxRoadLength && pRoadLen > 4) { maxPlayers.push(p.id); }
      });

      let currentLongestPlayer = null; const previousOwner = gameState.longestRoad?.playerId; const previousLength = gameState.longestRoad?.length || 4;
      if (maxPlayers.length === 1) currentLongestPlayer = maxPlayers[0];
      else if (maxPlayers.length > 1) {
        if (maxPlayers.includes(previousOwner) && maxRoadLength === previousLength) currentLongestPlayer = previousOwner; else currentLongestPlayer = null;
      }

      if (currentLongestPlayer !== previousOwner || maxRoadLength !== previousLength) {
        updates.longestRoad = { playerId: currentLongestPlayer, length: maxRoadLength };
        if (currentLongestPlayer) {
          if (currentLongestPlayer !== previousOwner) { const newOwnerName = players.find((p) => p.id === currentLongestPlayer).name; logs.push(triggerLog(`Longest road updated! ${newOwnerName} holds it.`, "important", true)); }
        } else {
          updates.longestRoad = { playerId: null, length: maxRoadLength }; logs.push(triggerLog(`The Longest Road has been broken! No one holds it.`, "important", true));
        }
      }

      if (gameState.turnPhase === "SETUP_SETTLEMENT") {
        if (gameState.setupRound === 2) {
          const adjHexes = Object.values(board.hexes).filter((h) => getDistance(h.center.x, h.center.y, board.nodes[nodeId].x, board.nodes[nodeId].y) < HEX_SIZE + 5);
          adjHexes.forEach((h) => { if (h.resource !== "DESERT") players[pIdx].resources[h.resource]++; });
        }
        updates.turnPhase = "SETUP_ROAD";
      } else setActiveBuildMode(null);

      logs.push(triggerLog(`${me.name} built a Settlement.`, "success"));
    } else if (activeBuildMode === "CITY") {
      const node = board.nodes[nodeId]; if (node.owner !== user.uid || node.type !== "SETTLEMENT") return;
      const cost = COSTS.CITY;
      if (Object.keys(cost).some((k) => players[pIdx].resources[k] < cost[k])) return alert("Not enough resources!");
      Object.keys(cost).forEach((k) => (players[pIdx].resources[k] -= cost[k]));

      board.nodes[nodeId].type = "CITY"; players[pIdx].score += 1; setActiveBuildMode(null); logs.push(triggerLog(`${me.name} upgraded to a City.`, "success"));
    }

    if (checkVictory(players, updates.longestRoad || gameState.longestRoad, gameState.largestArmy)) {
      updates.status = "finished"; logs.push(triggerLog(`${me.name} wins the game!`, "important", true, "VICTORY"));
    }

    if (logs.length === 0) return;
    updates.players = players; updates.board = board; updates.logs = arrayUnion(...logs);
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
  };

  const handleBuildEdge = async (edgeId) => {
    if (gameState.turnIndex !== pIdx) return;
    const isSpecialBuildPhase = gameState.turnPhase.includes("ROAD");
    if (activeBuildMode !== "ROAD" && !isSpecialBuildPhase) return;
    if (!isValidRoad(edgeId)) return;

    let updates = {}; let players = JSON.parse(JSON.stringify(gameState.players)); let board = JSON.parse(JSON.stringify(gameState.board)); let logs = [];

    if (!gameState.turnPhase.includes("SETUP_") && !gameState.turnPhase.includes("ROAD_BUILDING")) {
      const cost = COSTS.ROAD;
      if (Object.keys(cost).some((k) => players[pIdx].resources[k] < cost[k])) return alert("Not enough resources!");
      Object.keys(cost).forEach((k) => (players[pIdx].resources[k] -= cost[k]));
    }

    board.edges[edgeId].owner = user.uid; logs.push(triggerLog(`${me.name} built a Road.`)); setActiveBuildMode(null);

    const currentLen = getLongestRoad(user.uid, board); players[pIdx].roadLength = currentLen;
    const currentRecord = gameState.longestRoad?.length || 4; const currentHolder = gameState.longestRoad?.playerId;

    if (currentLen > currentRecord) {
      updates.longestRoad = { playerId: user.uid, length: currentLen };
      if (currentHolder !== user.uid) logs.push(triggerLog(`${me.name} took the Longest Road!`, "important", true));
    }

    if (gameState.turnPhase === "SETUP_ROAD") {
      const numPlayers = gameState.players.length;
      if (gameState.setupRound === 1) {
        if (gameState.turnIndex === numPlayers - 1) { updates.setupRound = 2; updates.turnPhase = "SETUP_SETTLEMENT"; }
        else { updates.turnIndex = gameState.turnIndex + 1; updates.turnPhase = "SETUP_SETTLEMENT"; }
      } else {
        if (gameState.turnIndex === 0) { updates.turnPhase = "ROLL"; logs.push(triggerLog("Setup complete. Main phase begins!", "important", true, "GAME START")); }
        else { updates.turnIndex = gameState.turnIndex - 1; updates.turnPhase = "SETUP_SETTLEMENT"; }
      }
    } else if (gameState.turnPhase === "ROAD_BUILDING_1") { updates.turnPhase = "ROAD_BUILDING_2"; }
    else if (gameState.turnPhase === "ROAD_BUILDING_2") { updates.turnPhase = gameState.hasRolled ? "MAIN" : "ROLL"; }

    if (checkVictory(players, updates.longestRoad || gameState.longestRoad, gameState.largestArmy)) {
      updates.status = "finished"; logs.push(triggerLog(`${me.name} wins the game!`, "important", true, "VICTORY"));
    }

    if (logs.length === 0) return;
    updates.players = players; updates.board = board; updates.logs = arrayUnion(...logs);
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
  };

  const skipRoadBuilding = async () => {
    let nextPhase = gameState.turnPhase === "ROAD_BUILDING_1" ? "ROAD_BUILDING_2" : gameState.hasRolled ? "MAIN" : "ROLL";
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { turnPhase: nextPhase }); setActiveBuildMode(null);
  };

  const handleEndTurn = async () => {
    if (gameState.turnIndex !== pIdx || gameState.turnPhase !== "MAIN") return;
    let players = JSON.parse(JSON.stringify(gameState.players));
    Object.keys(players[pIdx].newDevCards).forEach((k) => { players[pIdx].devCards[k] += players[pIdx].newDevCards[k]; players[pIdx].newDevCards[k] = 0; });
    players[pIdx].hasPlayedDevCard = false;

    const nextIdx = (gameState.turnIndex + 1) % gameState.players.length;
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
      turnIndex: nextIdx, turnPhase: "ROLL", players, hasRolled: false, logs: arrayUnion(triggerLog(`Turn passed to ${gameState.players[nextIdx].name}.`)),
    });
    setActiveBuildMode(null);
  };

  // ---------------------------------------------------------------------------
  // RENDER LOGIC
  // ---------------------------------------------------------------------------
  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <GlobalStyles />
        <GameLogoBig />
        <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10 mb-8">
          <Hexagon size={32} className="text-orange-500 animate-spin-slow" />
        </div>
        <div className="bg-orange-500/10 p-8 rounded-2xl border border-orange-500/30">
          <Hammer size={64} className="text-orange-500 mx-auto mb-4 animate-bounce" />
          <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
          <p className="text-gray-400">The island is currently undergoing terraforming. Please return soon!</p>
        </div>
        <div className="h-8"></div>
        <a href={import.meta.env.BASE_URL}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-center pb-12 animate-pulse">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900/50 rounded-full border border-orange-500/20 text-orange-300 font-bold tracking-widest text-sm uppercase backdrop-blur-sm">
                <StepBack size={16} /> Return to Gamehub <StepBack size={16} />
              </div>
            </div>
          </div>
        </a>
        <GameLogo />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-orange-500 animate-pulse font-mono tracking-widest">
        Connecting...
      </div>
    );
  }

  if (view === "splash") {
    return <SplashScreen onStart={handleSplashStart} />;
  }

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
        <GlobalStyles />
        <FloatingBackground />
        
        <nav className="absolute top-0 left-0 w-full p-4 z-50">
          <a href={import.meta.env.BASE_URL} className="flex items-center gap-2 text-orange-600/80 rounded-lg font-bold shadow-md hover:text-orange-400 transition-colors w-fit animate-pulse">
            <StepBack /><span>Back to Gamehub</span>
          </a>
        </nav>

        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}

        <div className="z-10 text-center mb-10 mt-8">
          <Hexagon size={64} className="text-orange-400 mx-auto mb-4 animate-spin-slow" />
          <h1 className="text-5xl md:text-7xl font-thin text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-amber-600 tracking-tighter drop-shadow-md">
            COLONY
          </h1>
          <p className="text-orange-200/40 tracking-[0.5em] uppercase mt-2 text-xs">Trade. Build. Survive.</p>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-md border border-orange-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 relative">
          {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 mb-4 rounded text-center text-sm font-bold flex items-center justify-center gap-2"><AlertTriangle size={16} /> {error}</div>}
          <div className="space-y-4">
            <input className="w-full bg-black/50 border border-orange-700 focus:border-orange-500 p-4 rounded-xl text-white outline-none transition-all text-lg font-bold text-center" placeholder="YOUR NAME" value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={12} />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={createRoom} disabled={loading} className="bg-gradient-to-br from-orange-600 to-amber-700 hover:from-orange-500 hover:to-amber-600 p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-orange-900/50"><Earth size={24} /> <span>Create</span></button>
              <div className="flex flex-col gap-2">
                <input className="bg-black/50 border border-orange-700 focus:border-orange-500 p-2 rounded-xl text-white text-center uppercase font-mono font-bold tracking-widest outline-none h-12" placeholder="CODE" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} maxLength={6} />
                <button onClick={joinRoom} disabled={loading} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl font-bold text-slate-300 transition-all active:scale-95 h-full">Join</button>
              </div>
            </div>
            <button onClick={() => setShowGuide(true)} className="w-full mt-4 text-orange-400 hover:text-orange-300 text-sm font-bold flex items-center justify-center gap-2 transition-colors py-2"><BookOpen size={16} /> Settler's Guide</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    const canStart = gameState.players.length >= 3 && gameState.players.length <= 4;
    
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative">
        <GlobalStyles />
        <FloatingBackground />
        <GameLogoBig />
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
        <div className="z-10 w-full max-w-lg bg-slate-900/90 backdrop-blur p-8 rounded-2xl border border-orange-500/30 shadow-2xl animate-in slide-in-from-bottom-8 mt-6">
          <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
            <div>
              <h2 className="text-lg md:text-xl flex items-center gap-2 text-orange-500 font-bold uppercase"><Earth size={24} /> Island Code:</h2>
              <div className="flex items-center gap-3 mt-1">
                <div className="text-3xl md:text-4xl font-mono text-white font-black">{roomId}</div>
                <div className="relative">
                  <button onClick={copyToClipboard} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">{isCopied ? <CheckCircle size={20} className="text-green-500" /> : <Copy size={20} />}</button>
                  {isCopied && <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-orange-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg animate-fade-in-up whitespace-nowrap">Copied!</div>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowLeaveConfirm(true)} className="p-2 hover:bg-red-900/30 rounded text-red-400 transition-colors"><LogOut size={24} /></button>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Settlers ({gameState.players.length}/4)</h3>
            {gameState.players.map((p) => (
              <div key={p.id} className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
                <span className="font-bold flex items-center gap-3 text-lg">
                  <div className={`w-4 h-4 rounded-full ${PLAYER_COLORS[p.colorIdx].bg}`} /> {p.name} {p.id === gameState.hostId && <Crown size={16} className="text-yellow-500" />}
                </span>
                {gameState.hostId === user.uid && p.id !== user.uid && (
                  <button onClick={() => kickPlayer(p.id)} className="p-2 bg-red-900/20 hover:bg-red-900/50 text-red-500 rounded-lg transition-colors border border-red-900/30" title="Kick Player"><Trash2 size={16} /></button>
                )}
              </div>
            ))}
            {Array.from({ length: 4 - gameState.players.length }).map((_, i) => (
              <div key={i} className="border-2 border-dashed border-slate-700 rounded-xl p-4 flex items-center justify-center text-slate-600 font-bold uppercase text-sm">Empty Slot</div>
            ))}
          </div>

          {isHost ? (
            <div className="flex flex-col gap-2">
              <button onClick={startGame} disabled={!canStart} className="w-full flex justify-center items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all bg-gradient-to-br from-orange-600 to-amber-700 text-white hover:bg-orange-400 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"><Earth size={24} /> Generate Island</button>
              {!canStart && <div className="text-center text-xs font-bold text-amber-500 uppercase tracking-wider mt-1">Requires 3 or 4 players to start</div>}
            </div>
          ) : (
            <div className="text-center text-slate-500 text-sm font-bold uppercase tracking-widest animate-pulse">Waiting for host...</div>
          )}
        </div>

        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl max-w-xs w-full text-center shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2 uppercase">Leave World?</h3>
              <p className="text-slate-400 mb-6 text-sm">{gameState.hostId === user.uid ? "As Host, leaving ends the session for everyone." : "You will disconnect from this session."}</p>
              <div className="flex gap-2">
                <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded font-bold text-slate-300">Stay</button>
                <button onClick={handleLeave} className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded font-bold text-white">Leave</button>
              </div>
            </div>
          </div>
        )}
        <GameLogo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const isMyTurn = gameState.turnIndex === pIdx;
    const getHexClasses = (hId) => { if (gameState.turnPhase === "ROBBER" && isMyTurn) return "cursor-pointer hover:scale-105 hover:brightness-125 z-20"; return "opacity-100"; };

    return (
      <div className="fixed inset-0 bg-slate-950 text-white flex flex-col overflow-hidden font-sans select-none">
        <GlobalStyles />
        <FloatingBackground />

        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl max-w-xs w-full text-center shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2 uppercase">Abandon Game?</h3>
              <p className="text-slate-400 mb-6 text-sm">
                {gameState.hostId === user.uid 
                  ? "Leaving deletes the game for everyone." 
                  : "You will leave this ongoing game."}
              </p>
              
              <div className="flex gap-2">
                <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded font-bold text-slate-300">
                  Stay
                </button>
                <button onClick={handleLeave} className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded font-bold text-white">
                  Leave
                </button>
              </div>

              {/* THE MISSING HOST BUTTON */}
              {gameState.hostId === user.uid && (
                <button
                  onClick={() => {
                    returnToLobby();
                    setShowLeaveConfirm(false);
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 py-2 rounded font-bold text-orange-400 mt-2 text-sm border border-slate-700 transition-colors"
                >
                  Return All to Lobby
                </button>
              )}
              
            </div>
          </div>
        )}

        {feedback && <FeedbackOverlay type={feedback.type} message={feedback.message} subtext={feedback.subtext} icon={feedback.icon} />}
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
        {showScoreboard && <ScoreboardModal gameState={gameState} onClose={() => setShowScoreboard(false)} />}

        {showDiscardModal && me && (
          <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-slate-900 border-2 border-red-500 p-6 rounded-2xl max-w-sm w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.3)] relative">
              <Skull size={48} className="text-red-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-black text-white mb-2 uppercase">The Robber Strikes!</h3>
              <p className="text-red-300 text-sm mb-6 font-bold">You have too many cards. Discard exactly {mustDiscardAmount}.</p>
              <div className="bg-black/50 p-4 rounded-xl mb-6">
                <div className="flex flex-col gap-3">
                  {["WOOD", "BRICK", "SHEEP", "WHEAT", "ORE"].map((res) => {
                    const count = me.resources[res]; if (count === 0) return null;
                    const IconComponent = RESOURCES[res].icon;
                    return (
                      <div key={res} className="flex items-center justify-between bg-slate-800 p-2 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-2"><div className={`p-1.5 rounded ${RESOURCES[res].color} w-8 flex justify-center`}><IconComponent size={16} /></div><span className="font-bold text-sm">{res} (Have: {count})</span></div>
                        <div className="flex items-center gap-3"><button onClick={() => setDiscardTokens({ ...discardTokens, [res]: Math.max(0, discardTokens[res] - 1) })} className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 font-bold">-</button><span className="w-4 text-center font-black text-red-400">{discardTokens[res]}</span><button onClick={() => setDiscardTokens({ ...discardTokens, [res]: Math.min(count, discardTokens[res] + 1) })} className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 font-bold">+</button></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between items-center mb-4"><span className="text-slate-400 font-bold">Selected:</span><span className={`text-xl font-black ${Object.values(discardTokens).reduce((a, b) => a + b, 0) === mustDiscardAmount ? "text-orange-500" : "text-red-500"}`}>{Object.values(discardTokens).reduce((a, b) => a + b, 0)} / {mustDiscardAmount}</span></div>
              <button onClick={submitDiscard} disabled={Object.values(discardTokens).reduce((a, b) => a + b, 0) !== mustDiscardAmount} className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 rounded-xl font-black text-white transition-all uppercase tracking-widest shadow-lg">Confirm Discard</button>
            </div>
          </div>
        )}

        {popupContent && popupContent.type === "STEAL" && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-red-500 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
              <Skull size={48} className="text-red-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-black text-white mb-4">WHO TO ROB?</h3>
              <div className="flex flex-col gap-2">
                {popupContent.victims.map((vId) => {
                  const v = gameState.players.find((p) => p.id === vId);
                  return <button key={v.id} onClick={() => executeSteal(v.id)} className="py-3 bg-slate-800 hover:bg-red-900/50 rounded-xl font-bold border border-slate-600 transition-all">{v.name}</button>;
                })}
              </div>
            </div>
          </div>
        )}

        {popupContent && popupContent.type === "INCOMING_TRADE" && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-blue-500 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
              <Handshake size={48} className="text-blue-500 mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-black text-white mb-2 uppercase">{popupContent.trade.senderName} Proposes a Trade</h3>
              <div className="bg-black/30 p-4 rounded-xl mb-4">
                <div className="text-xs text-orange-400 font-bold mb-1 uppercase">You Receive:</div>
                <div className="flex justify-center gap-2 mb-4">{Object.keys(popupContent.trade.offer).map((k) => popupContent.trade.offer[k] > 0 && <span key={k} className="bg-orange-900/50 px-2 py-1 rounded text-xs border border-orange-800">{popupContent.trade.offer[k]} {k}</span>)}</div>
                <div className="text-xs text-red-400 font-bold mb-1 uppercase">You Give:</div>
                <div className="flex justify-center gap-2">{Object.keys(popupContent.trade.request).map((k) => popupContent.trade.request[k] > 0 && <span key={k} className="bg-red-900/50 px-2 py-1 rounded text-xs border border-red-800">{popupContent.trade.request[k]} {k}</span>)}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => respondToTrade(false)} className="flex-1 py-3 bg-red-900/50 rounded-xl font-bold text-red-200 hover:bg-red-800">Reject</button>
                <button onClick={() => respondToTrade(true)} className="flex-1 py-3 bg-orange-600 rounded-xl font-bold text-white hover:bg-orange-500">Accept</button>
              </div>
            </div>
          </div>
        )}

        {popupContent && popupContent.type === "YEAR_OF_PLENTY" && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-yellow-500 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
              <Gem size={48} className="text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-white mb-4">YEAR OF PLENTY</h3>
              <p className="text-slate-300 text-sm mb-4">Select two resources to add to your hand.</p>
              <div className="grid grid-cols-5 gap-2 mb-6">
                {["WOOD", "BRICK", "SHEEP", "WHEAT", "ORE"].map((res) => (
                  <button key={res} onClick={() => { if (!popupContent.res1) setPopupContent({ ...popupContent, res1: res }); else handleYearOfPlenty(popupContent.res1, res); }} className={`p-2 rounded-lg border-2 flex justify-center items-center ${popupContent.res1 === res ? "border-yellow-500 bg-yellow-900/50" : "border-slate-700 hover:border-slate-500"}`}>{React.createElement(RESOURCES[res].icon, { size: 24, className: "text-white" })}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {popupContent && popupContent.type === "MONOPOLY" && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-purple-500 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
              <Crown size={48} className="text-purple-500 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-white mb-4">MONOPOLY</h3>
              <p className="text-slate-300 text-sm mb-4">Declare a resource. All players must give you all of that resource.</p>
              <div className="grid grid-cols-5 gap-2 mb-6">
                {["WOOD", "BRICK", "SHEEP", "WHEAT", "ORE"].map((res) => (
                  <button key={res} onClick={() => handleMonopoly(res)} className="p-2 rounded-lg border-2 border-slate-700 flex justify-center items-center hover:border-purple-500 hover:bg-purple-900/30">{React.createElement(RESOURCES[res].icon, { size: 24, className: "text-white" })}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TOP BAR */}
        <div className="h-14 md:h-16 bg-slate-900 border-b border-orange-900/30 flex items-center justify-between px-2 z-[160] shrink-0 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-900/50 rounded-lg flex items-center justify-center border border-orange-700 ml-2">
              <Hexagon className="text-orange-400" size={20} />
            </div>
            <div>
              <div className="font-bold text-sm tracking-wider text-orange-100">COLONY</div>
              <div className="text-[10px] font-mono uppercase">{gameState.status === "finished" ? <span className="text-red-400">GAME OVER</span> : <><span className="text-white-400">Turn:</span> <span className="text-orange-400">{gameState.players[gameState.turnIndex].name}</span></>}</div>
            </div>
            <div className={`flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-lg border border-slate-700 shadow-inner ml-2 ${flashDice ? "animate-flash-red" : ""}`}>
              <div className={`w-6 h-6 rounded flex items-center justify-center font-black text-sm shadow-inner ${gameState.dice[0] + gameState.dice[1] === 7 ? "bg-red-500 text-white" : "bg-slate-200 text-slate-900"}`}>{gameState.dice[0]}</div>
              <div className={`w-6 h-6 rounded flex items-center justify-center font-black text-sm shadow-inner ${gameState.dice[0] + gameState.dice[1] === 7 ? "bg-red-500 text-white" : "bg-slate-200 text-slate-900"}`}>{gameState.dice[1]}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowScoreboard(true)} className="p-2 hover:bg-slate-800 rounded text-yellow-500 hover:text-white"><BarChart2 size={18} /></button>
            <button onClick={() => setShowGuide(true)} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white"><BookOpen size={18} /></button>
            <button onClick={() => setShowLogs(!showLogs)} className={`p-2 rounded-full ${showLogs ? "bg-orange-900 text-orange-400" : "text-gray-400 hover:bg-gray-800"}`}><History size={18} /></button>
            <button onClick={() => setShowLeaveConfirm(true)} className="p-2 hover:bg-red-900/30 rounded text-red-400"><LogOut size={18} /></button>
          </div>
        </div>

        {/* LOGS OVERLAY */}
        {showLogs && (
          <div className="fixed top-16 right-4 w-64 max-h-60 bg-slate-900/95 border border-slate-700 rounded-xl z-[155] overflow-y-auto p-2 shadow-2xl custom-scrollbar">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sticky top-0 bg-slate-900/95 py-2">World History</h4>
            <div className="space-y-2">
              {gameState.logs.slice().reverse().map((log) => (
                <div key={log.id} className={`text-xs p-2 rounded border-l-2 ${log.type === "success" ? "border-orange-500 bg-orange-900/10" : log.type === "warning" ? "border-amber-500 bg-amber-900/10" : log.type === "failure" ? "border-red-500 bg-red-900/10" : "border-slate-500 bg-slate-800/30"}`}>
                  {log.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GAME BOARD AREA */}
        <div className="flex-1 relative bg-transparent overflow-hidden flex items-center justify-center touch-none">
          <div className="absolute top-2 md:top-4 left-0 w-full flex flex-col items-center gap-2 z-[100] pointer-events-none px-2 md:px-4">
            <div className="flex flex-row flex-wrap justify-center gap-1 md:gap-4 w-full">
              {gameState.players.map((p, i) => (
                <div key={p.id} className={`flex flex-col items-center px-2 py-1 md:px-4 md:py-2 rounded-xl border-2 pointer-events-auto backdrop-blur-md bg-slate-900/80 transition-all ${gameState.turnIndex === i ? PLAYER_COLORS[p.colorIdx].border + " shadow-[0_0_15px_" + PLAYER_COLORS[p.colorIdx].fill + "]" : "border-transparent opacity-70"}`}>
                  <span className="text-[10px] md:text-sm font-black uppercase tracking-widest drop-shadow-md truncate max-w-[60px] md:max-w-[120px]" style={{ color: PLAYER_COLORS[p.colorIdx].fill }}>{p.name}</span>
                  <div className="flex gap-1 md:gap-3 items-center mt-0.5 md:mt-1">
                    <span className="text-[10px] md:text-sm font-black text-white flex items-center gap-0.5 md:gap-1"><Trophy size={10} className="md:w-3.5 md:h-3.5 text-yellow-500" />{getTotalScore(p, gameState)}</span>
                    {gameState.longestRoad?.playerId === p.id && <Grip size={10} className="md:w-3.5 md:h-3.5 text-orange-400" title="Longest Road" />}
                    {gameState.largestArmy?.playerId === p.id && <Swords size={10} className="md:w-3.5 md:h-3.5 text-red-400" title="Largest Army" />}
                    <span className="text-[10px] md:text-sm font-black text-white flex items-center gap-0.5 md:gap-1 opacity-80" title="Dev Cards"><Scroll size={10} className="md:w-3.5 md:h-3.5" />{Object.values(p.devCards).reduce((a, b) => a + b, 0) + Object.values(p.newDevCards).reduce((a, b) => a + b, 0)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="md:hidden pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700 px-4 py-1.5 rounded-full shadow-lg mt-1">
              <span className={`text-[11px] font-black uppercase tracking-widest ${isMyTurn ? "text-orange-400 animate-pulse" : "text-slate-400"}`}>{isMyTurn ? gameState.turnPhase.replace(/_/g, " ") : `WAITING FOR ${gameState.players[gameState.turnIndex].name}`}</span>
            </div>
          </div>

          <div className="relative transform scale-[0.75] sm:scale-[0.85] md:scale-[1.15] transition-transform mt-20 md:mt-0">
            {Object.entries(gameState.board.hexes).map(([hId, h]) => {
              const ResDef = h.resource !== "DESERT" ? RESOURCES[h.resource] : RESOURCES.DESERT;
              return (
                <div key={hId} onClick={() => handlePlaceRobber(h.q, h.r)} className={`absolute transition-all duration-300 ${getHexClasses(hId)}`} style={{ left: h.center.x, top: h.center.y, width: HEX_SIZE * Math.sqrt(3), height: HEX_SIZE * 2, transform: "translate(-50%, -50%)" }}>
                  <div className={`w-full h-full absolute ${ResDef.color} opacity-80`} style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
                  <svg viewBox="0 0 100 100" className="absolute inset-0 z-10 w-full h-full pointer-events-none">
                    <polygon points="50 0, 100 25, 100 75, 50 100, 0 75, 0 25" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                    <ResDef.icon size={24} className="text-white/40 mb-1" />
                    {h.number && (
                      <div className={`w-8 h-8 bg-[#fff3e0] rounded-full flex items-center justify-center text-sm font-bold border-2 border-slate-400 shadow-md ${h.number === 6 || h.number === 8 ? "text-red-600" : "text-slate-800"}`}>
                        {h.number}
                      </div>
                    )}
                    {gameState.robberHex === hId && (
                      <div className="absolute w-12 h-12 bg-slate-900 rounded-full border-4 border-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse z-30">
                        <Skull size={24} className="text-red-400" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {Object.entries(gameState.board.edges).map(([eId, e]) => {
              const isSpecialBuildPhase = gameState.turnPhase.includes("ROAD");
              const canBuild = isMyTurn && (activeBuildMode === "ROAD" || isSpecialBuildPhase) && isValidRoad(eId);
              const showGhost = canBuild && !e.owner;
              return (
                <div key={eId} onClick={() => handleBuildEdge(eId)} className={`absolute z-30 transition-all h-3 rounded-full flex items-center justify-center ${e.owner ? PLAYER_COLORS[gameState.players.find((p) => p.id === e.owner).colorIdx].bg : ""} ${showGhost ? `bg-white/40 hover:bg-white/80 cursor-pointer shadow-[0_0_10px_white]` : ""} ${!e.owner && !showGhost ? "pointer-events-none" : ""}`} style={{ left: e.x, top: e.y, width: HEX_SIZE * 0.9, transform: `translate(-50%, -50%) rotate(${e.angle}deg)`, boxShadow: e.owner ? "0 0 10px rgba(0,0,0,0.5)" : "" }} />
              );
            })}

            {Object.values(gameState.board.edges).filter((e) => e.port).map((e) => {
              const edgeAngleRad = e.angle * (Math.PI / 180);
              const nx1 = Math.cos(edgeAngleRad + Math.PI / 2); const ny1 = Math.sin(edgeAngleRad + Math.PI / 2);
              const nx2 = Math.cos(edgeAngleRad - Math.PI / 2); const ny2 = Math.sin(edgeAngleRad - Math.PI / 2);
              const isN1Outward = (nx1 * e.x + ny1 * e.y) > (nx2 * e.x + ny2 * e.y);
              const outX = isN1Outward ? nx1 : nx2; const outY = isN1Outward ? ny1 : ny2;
              const pushDistance = 28; const portX = e.x + (outX * pushDistance); const portY = e.y + (outY * pushDistance);
              const pierAngle = Math.atan2(-outY, -outX) * (180 / Math.PI);

              return (
                <div key={`port-${e.id}`} className="absolute w-8 h-8 -ml-4 -mt-4 bg-cyan-900/80 rounded-full border-2 border-cyan-400 flex items-center justify-center shadow-lg" style={{ left: portX, top: portY, zIndex: 50 }}>
                  <div className="absolute w-1 bg-cyan-400/50 rounded -z-10" style={{ height: pushDistance, top: '50%', left: '50%', transformOrigin: 'top center', transform: `translate(-50%, 0) rotate(${pierAngle - 90}deg)` }} />
                  <Anchor size={14} className="text-cyan-400 z-10" />
                  <span className="absolute top-8 text-[11px] bg-black/90 px-2 py-0.5 rounded font-black whitespace-nowrap text-cyan-100 border border-cyan-700 shadow-[0_0_15px_rgba(0,0,0,1)] animate-slow-blink z-[100] pointer-events-none">
                    {e.port.replace("_", " ")}
                  </span>
                </div>
              );
            })}

            {Object.entries(gameState.board.nodes).map(([nId, n]) => {
              const isSettlementMode = activeBuildMode === "SETTLEMENT" || gameState.turnPhase.startsWith("SETUP_SETTLEMENT");
              const canBuildSettlement = isMyTurn && isSettlementMode && isValidSettlement(nId);
              const canBuildCity = isMyTurn && activeBuildMode === "CITY" && n.owner === user.uid && n.type === "SETTLEMENT";
              const showGhost = (canBuildSettlement || canBuildCity) && !n.owner;
              const showUpgradeGhost = canBuildCity && n.owner === user.uid;

              return (
                <div key={nId} className="absolute z-40" style={{ left: n.x, top: n.y }}>
                  <div onClick={() => handleBuildNode(nId)} className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center transition-all ${n.owner ? PLAYER_COLORS[gameState.players.find((p) => p.id === n.owner).colorIdx].bg + " border-2 border-white shadow-xl" : ""} ${showGhost ? `bg-white/40 hover:bg-white/80 border border-white border-dashed cursor-pointer shadow-[0_0_15px_white]` : ""} ${showUpgradeGhost ? `ring-4 ring-yellow-400 cursor-pointer hover:scale-125` : ""} ${!n.owner && !showGhost ? "pointer-events-none" : ""}`}>
                    {n.type === "SETTLEMENT" && <Home size={16} className="text-white" />}
                    {n.type === "CITY" && <Building2 size={18} className="text-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM UI CONTROLS */}
        <div className="h-auto pb-4 pt-4 md:h-32 bg-slate-900/95 border-t-2 border-orange-500/50 backdrop-blur-xl z-[60] flex flex-col justify-center px-4 relative shrink-0">
          {me && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 bg-slate-900/90 p-1.5 rounded-t-xl border-t border-x border-slate-700 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
              {Object.entries(RESOURCES).filter(([k]) => k !== "DESERT").map(([key, def]) => (
                <div key={key} className={`flex items-center gap-1 ${def.color} px-2 py-1 rounded-md text-xs font-bold border ${def.border} text-white shadow-md relative`}>
                  <def.icon size={12} /> {me.resources[key]}
                  {resourceAnimations[key]?.map((anim) => (
                    <div key={anim.id} className={`absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-black ${anim.val > 0 ? "text-emerald-400" : "text-red-400"} animate-float-up pointer-events-none drop-shadow-md z-50`}>
                      {anim.val > 0 ? "+" : ""}{anim.val}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-5xl mx-auto gap-4">
            <div className="w-full md:w-1/4 text-center md:text-left hidden md:block">
              <div className="text-xs font-bold text-slate-400 tracking-wider">STATUS</div>
              <div className={`text-sm md:text-lg font-black uppercase ${isMyTurn ? "text-orange-400 animate-pulse" : "text-slate-500"}`}>
                {isMyTurn ? gameState.turnPhase.replace(/_/g, " ") : `WAITING FOR ${gameState.players[gameState.turnIndex].name}`}
              </div>
            </div>

            <div className="flex-1 flex flex-wrap justify-center gap-2">
              {isMyTurn && gameState.turnPhase === "ROLL" && !gameState.hasRolled && (
                <button onClick={handleRollDice} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center gap-2 text-lg animate-bounce">
                  <Dices /> ROLL DICE
                </button>
              )}

              {isMyTurn && (
                <>
                  {gameState.turnPhase === "MAIN" && (
                    <>
                      <button onClick={() => setActiveBuildMode(activeBuildMode === "ROAD" ? null : "ROAD")} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold flex flex-col items-center border-2 transition-all text-xs md:text-base ${activeBuildMode === "ROAD" ? "bg-blue-600 border-blue-400 scale-105 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-slate-800 border-slate-600 hover:bg-slate-700"}`}><Grip size={16} /> Road</button>
                      <button onClick={() => setActiveBuildMode(activeBuildMode === "SETTLEMENT" ? null : "SETTLEMENT")} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold flex flex-col items-center border-2 transition-all text-xs md:text-base ${activeBuildMode === "SETTLEMENT" ? "bg-orange-600 border-orange-400 scale-105 shadow-[0_0_10px_rgba(249,115,22,0.5)]" : "bg-slate-800 border-slate-600 hover:bg-slate-700"}`}><Home size={16} /> Set</button>
                      <button onClick={() => setActiveBuildMode(activeBuildMode === "CITY" ? null : "CITY")} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold flex flex-col items-center border-2 transition-all text-xs md:text-base ${activeBuildMode === "CITY" ? "bg-indigo-600 border-indigo-400 scale-105 shadow-[0_0_10px_rgba(79,70,229,0.5)]" : "bg-slate-800 border-slate-600 hover:bg-slate-700"}`}><Building2 size={16} /> City</button>
                      <button onClick={() => setShowTradeModal(true)} className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold flex flex-col items-center border-2 bg-slate-800 border-slate-600 hover:bg-slate-700 transition-all text-xs md:text-base"><Handshake size={16} /> Trade</button>
                    </>
                  )}
                  {!gameState.turnPhase.startsWith("SETUP") && (
                    <button onClick={() => setShowDevCards(true)} className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold flex flex-col items-center border-2 bg-slate-800 border-slate-600 hover:bg-slate-700 transition-all relative text-xs md:text-base">
                      <Scroll size={16} /> Cards
                      {me && (!me.hasPlayedDevCard || me.devCards["VP"] > 0) && Object.values(me.devCards).reduce((a, b) => a + b, 0) > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-slate-900"></span>}
                    </button>
                  )}
                </>
              )}

              {isMyTurn && gameState.turnPhase === "ROAD_BUILDING_1" && (
                <div className="flex gap-2"><div className="bg-blue-900/50 px-2 py-1 md:px-4 md:py-2 rounded border border-blue-500 text-blue-200 font-bold animate-pulse flex items-center text-xs md:text-base">Place 1st Free Road</div><button onClick={skipRoadBuilding} className="bg-slate-800 hover:bg-slate-700 px-2 py-1 md:px-3 md:py-2 rounded text-slate-300 font-bold text-xs">Skip</button></div>
              )}
              {isMyTurn && gameState.turnPhase === "ROAD_BUILDING_2" && (
                <div className="flex gap-2"><div className="bg-blue-900/50 px-2 py-1 md:px-4 md:py-2 rounded border border-blue-500 text-blue-200 font-bold animate-pulse flex items-center text-xs md:text-base">Place 2nd Free Road</div><button onClick={skipRoadBuilding} className="bg-slate-800 hover:bg-slate-700 px-2 py-1 md:px-3 md:py-2 rounded text-slate-300 font-bold text-xs">Skip</button></div>
              )}
            </div>

            <div className="w-full md:w-1/4 flex justify-center md:justify-end mt-2 md:mt-0">
              {isMyTurn && gameState.turnPhase === "MAIN" && (
                <button onClick={handleEndTurn} className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 md:px-8 md:py-3 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-400 transition-colors w-full md:w-auto text-sm md:text-base">
                  END TURN
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TRADE MODAL */}
        {showTradeModal && me && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-lg w-full text-center shadow-2xl relative">
              <button onClick={() => setShowTradeModal(false)} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700"><X size={20} /></button>
              <h3 className="text-2xl font-black text-white mb-4 uppercase">Trading Post</h3>
              <div className="bg-slate-800/80 p-3 rounded-xl mb-4 border border-slate-700">
                <div className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-widest text-center">Your Exchange Rates</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {Object.keys(getTradeRatios(user.uid, gameState.board)).map((k) => {
                    const ratio = getTradeRatios(user.uid, gameState.board)[k]; const ResDef = RESOURCES[k];
                    return <div key={k} className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-black ${ratio < 4 ? "bg-cyan-900/50 text-cyan-200 border border-cyan-700 shadow-[0_0_10px_rgba(6,182,212,0.3)]" : "bg-slate-900 text-slate-400 border border-slate-700"}`}><ResDef.icon size={12} /> {k} {ratio}:1</div>;
                  })}
                </div>
              </div>
              <div className="bg-black/30 p-4 rounded-xl mb-4 border border-white/5">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 font-bold mb-2 uppercase">You Offer</div>
                    <div className="flex flex-col gap-2">
                      {["WOOD", "BRICK", "SHEEP", "WHEAT", "ORE"].map((res) => {
                        const IconComponent = RESOURCES[res].icon;
                        return (
                          <div key={res} className="flex items-center gap-2">
                            <div className={`p-1.5 rounded bg-slate-800 border ${RESOURCES[res].border} w-8 flex justify-center`}><IconComponent size={16} /></div>
                            <input type="number" min="0" max={me.resources[res]} value={offerTokens[res]} onChange={(e) => setOfferTokens({ ...offerTokens, [res]: parseInt(e.target.value) || 0 })} className="w-12 bg-black border border-slate-700 rounded text-center text-white p-1" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center justify-center"><ArrowRightLeft className="text-slate-600" /></div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-400 font-bold mb-2 uppercase">You Want</div>
                    <div className="flex flex-col gap-2">
                      {["WOOD", "BRICK", "SHEEP", "WHEAT", "ORE"].map((res) => {
                        const IconComponent = RESOURCES[res].icon;
                        return (
                          <div key={res} className="flex items-center gap-2">
                            <input type="number" min="0" value={requestTokens[res]} onChange={(e) => setRequestTokens({ ...requestTokens, [res]: parseInt(e.target.value) || 0 })} className="w-12 bg-black border border-slate-700 rounded text-center text-white p-1" />
                            <div className={`p-1.5 rounded bg-slate-800 border ${RESOURCES[res].border} w-8 flex justify-center`}><IconComponent size={16} /></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={executeBankTrade} className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-xl font-bold text-white flex items-center justify-center gap-2"><Anchor size={18} /> Bank Trade</button>
                <button onClick={proposeDomesticTrade} className="flex-1 py-3 bg-blue-700 hover:bg-blue-600 rounded-xl font-bold text-white flex items-center justify-center gap-2"><Handshake size={18} /> Propose</button>
              </div>
            </div>
          </div>
        )}

        {/* DEV CARDS MODAL */}
        {showDevModal && me && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-lg w-full shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar">
              <button onClick={() => setShowDevCards(false)} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700"><X size={20} /></button>
              <h3 className="text-2xl font-black text-white mb-6 uppercase flex items-center gap-2"><Scroll className="text-purple-400" /> Development Cards</h3>
              {gameState.turnPhase === "MAIN" && (
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white mb-1">Buy Card</div>
                    <div className="flex gap-1 text-xs">
                      <span className="bg-lime-900/50 text-lime-200 px-1 rounded flex items-center"><PawPrint size={10} />1</span>
                      <span className="bg-yellow-900/50 text-yellow-200 px-1 rounded flex items-center"><Leaf size={10} />1</span>
                      <span className="bg-slate-700 text-slate-200 px-1 rounded flex items-center"><Mountain size={10} />1</span>
                    </div>
                  </div>
                  <button onClick={handleBuyDevCard} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-lg shadow-lg">Draw</button>
                </div>
              )}
              <div className="space-y-3">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest border-b border-slate-800 pb-1 flex justify-between"><span>Your Hand</span><span>{me.hasPlayedDevCard ? "Card Played this Turn" : "1 Play per Turn"}</span></div>
                {Object.keys(DEV_CARD_TYPES).map((type) => {
                  const count = me.devCards[type]; const newCount = me.newDevCards[type]; const total = count + newCount;
                  if (total === 0) return null; const def = DEV_CARD_TYPES[type];
                  return (
                    <div key={type} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-900 p-2 rounded-lg"><def.icon className="text-purple-400" size={20} /></div>
                        <div>
                          <div className="font-bold text-white">{def.name} x{total}</div>
                          <div className="text-xs text-slate-400">{def.desc}</div>
                          {newCount > 0 && type !== "VP" && <div className="text-[10px] text-amber-500">({newCount} bought this turn, cannot play)</div>}
                        </div>
                      </div>
                      {count > 0 && (
                        <button onClick={() => playDevCard(type)} disabled={type !== "VP" && me.hasPlayedDevCard} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-sm whitespace-nowrap shadow-lg">
                          {type === "VP" && count > 1 ? `Play All (${count})` : "Play"}
                        </button>
                      )}
                    </div>
                  );
                })}
                {Object.values(me.devCards).reduce((a, b) => a + b, 0) + Object.values(me.newDevCards).reduce((a, b) => a + b, 0) === 0 && <div className="text-center text-slate-500 text-sm py-4 italic">No cards in hand.</div>}
              </div>
              <div className="mt-8 pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3">Cards Played</div>
                <div className="space-y-3">
                  {gameState.players.map((p) => {
                    const playedCards = p.usedDevCards || { KNIGHT: 0, VP: 0, ROAD: 0, PLENTY: 0, MONOPOLY: 0 };
                    if (Object.values(playedCards).reduce((a, b) => a + b, 0) === 0) return null;
                    return (
                      <div key={p.id} className="bg-slate-800/40 p-2 rounded-lg border border-slate-700/50">
                        <span className="text-xs font-bold uppercase mb-2 block" style={{ color: PLAYER_COLORS[p.colorIdx].fill }}>{p.name}</span>
                        <div className="flex gap-2 flex-wrap">
                          {Object.keys(playedCards).map((type) => {
                            if (playedCards[type] > 0) { const Icon = DEV_CARD_TYPES[type].icon; return <div key={type} className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded text-xs text-slate-300 font-bold border border-slate-700"><Icon size={12} className="text-purple-400" /> {DEV_CARD_TYPES[type].name} x{playedCards[type]}</div>; }
                            return null;
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* END GAME MODAL */}
        {gameState.status === "finished" && (
          <div className="fixed inset-0 z-[250] bg-black/90 flex items-center justify-center backdrop-blur-md pt-20 pb-10 px-4">
            <div className="bg-slate-900 p-6 md:p-8 rounded-2xl border-2 border-yellow-500 text-center shadow-2xl animate-in zoom-in max-w-lg w-full flex flex-col relative">
              <div className="shrink-0 mb-4">
                <Trophy size={64} className="text-yellow-400 mx-auto mb-2 animate-bounce" />
                <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 uppercase mb-2 leading-tight">
                  {gameState.players.slice().sort((a,b) => getTotalScore(b, gameState) - getTotalScore(a, gameState))[0]?.name}
                </h2>
                <p className="text-orange-400 font-bold tracking-widest text-sm uppercase">Is the Lord of Settlers!</p>
              </div>
              <div className="space-y-3 mb-4 text-sm flex-1">
                 {gameState.players.slice().sort((a,b) => getTotalScore(b, gameState) - getTotalScore(a, gameState)).map((p, i) => (
                    <div key={p.id} className={`p-3 rounded-xl border flex justify-between items-center ${i === 0 ? "bg-slate-800 border-yellow-500" : "bg-slate-800/50 border-slate-700"}`}>
                       <span className="font-bold text-lg" style={{ color: PLAYER_COLORS[p.colorIdx].fill }}>{p.name}</span>
                       <span className="font-black text-2xl text-yellow-500">{getTotalScore(p, gameState)}</span>
                    </div>
                 ))}
              </div>
              {gameState.hostId === user.uid ? (
                <div className="shrink-0 pt-2">
                  <button onClick={returnToLobby} className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl font-bold w-full text-orange-400 transition-colors">Return All to Lobby</button>
                </div>
              ) : (
                <div className="shrink-0 pt-2">
                  <button disabled className="bg-slate-700/60 px-6 py-3 rounded-xl font-bold w-full text-slate-400">Waiting for Host...</button>
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