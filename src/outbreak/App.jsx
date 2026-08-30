import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Activity,
  Shield,
  Syringe,
  Plane,
  Globe2,
  Skull,
  MapPin,
  AlertTriangle,
  Play,
  Home,
  CheckCircle,
  Search,
  X,
  LogOut,
  RotateCcw,
  User,
  Loader,
  Info,
  Trophy,
  History,
  Copy,
  Settings,
  BookOpen,
  Trash2,
  Zap,
  Target,
} from "lucide-react";
import CoverImage from "./assets/outbreak.png";

// --- Firebase Config & Init ---
const firebaseConfig = {
  apiKey: "AIzaSyChsSRZW5mu5v529i83h3dDE9o2UZYx--o",
  authDomain: "rawfids-gamehub.firebaseapp.com",
  projectId: "rawfids-gamehub",
  storageBucket: "rawfids-gamehub.firebasestorage.app",
  messagingSenderId: "33131208034",
  appId: "1:33131208034:web:d731df5d2ffee26b6b603b",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "outbreak-game";
const GAME_ID = "27";

// --- Game Constants ---
const COLORS = {
  blue: {
    bg: "bg-blue-500",
    text: "text-blue-400",
    border: "border-blue-500",
    hex: "#3b82f6",
  },
  yellow: {
    bg: "bg-yellow-500",
    text: "text-yellow-400",
    border: "border-yellow-500",
    hex: "#eab308",
  },
  green: {
    bg: "bg-green-500",
    text: "text-green-400",
    border: "border-green-500",
    hex: "#10b981",
  },
  red: {
    bg: "bg-red-500",
    text: "text-red-400",
    border: "border-red-500",
    hex: "#ef4444",
  },
};

const INFECTION_RATES = [2, 2, 2, 3, 3, 4, 4];
const COVER_IMAGE =
  "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=2000";

const CITIES = {
  san_francisco: {
    name: "San Francisco",
    color: "blue",
    x: 10,
    y: 35,
    neighbors: ["tokyo", "manila", "los_angeles", "chicago"],
  },
  chicago: {
    name: "Chicago",
    color: "blue",
    x: 20,
    y: 30,
    neighbors: [
      "san_francisco",
      "los_angeles",
      "mexico_city",
      "atlanta",
      "montreal",
    ],
  },
  montreal: {
    name: "Montreal",
    color: "blue",
    x: 27,
    y: 30,
    neighbors: ["chicago", "washington", "new_york"],
  },
  new_york: {
    name: "New York",
    color: "blue",
    x: 35,
    y: 33,
    neighbors: ["montreal", "washington", "london", "madrid"],
  },
  washington: {
    name: "Washington",
    color: "blue",
    x: 28,
    y: 40,
    neighbors: ["montreal", "new_york", "atlanta", "miami"],
  },
  atlanta: {
    name: "Atlanta",
    color: "blue",
    x: 22,
    y: 42,
    neighbors: ["chicago", "washington", "miami"],
  },
  london: {
    name: "London",
    color: "blue",
    x: 42,
    y: 28,
    neighbors: ["new_york", "madrid", "paris", "essen"],
  },
  madrid: {
    name: "Madrid",
    color: "blue",
    x: 41,
    y: 42,
    neighbors: ["new_york", "london", "paris", "algiers", "sao_paulo"],
  },
  paris: {
    name: "Paris",
    color: "blue",
    x: 47,
    y: 35,
    neighbors: ["london", "madrid", "algiers", "milan", "essen"],
  },
  essen: {
    name: "Essen",
    color: "blue",
    x: 49,
    y: 23,
    neighbors: ["london", "paris", "milan", "st_petersburg"],
  },
  milan: {
    name: "Milan",
    color: "blue",
    x: 53,
    y: 32,
    neighbors: ["essen", "paris", "istanbul"],
  },
  st_petersburg: {
    name: "St. Petersburg",
    color: "blue",
    x: 58,
    y: 22,
    neighbors: ["essen", "istanbul", "moscow"],
  },
  los_angeles: {
    name: "Los Angeles",
    color: "yellow",
    x: 12,
    y: 45,
    neighbors: ["sydney", "san_francisco", "chicago", "mexico_city"],
  },
  mexico_city: {
    name: "Mexico City",
    color: "yellow",
    x: 16,
    y: 55,
    neighbors: ["los_angeles", "chicago", "miami", "bogota", "lima"],
  },
  miami: {
    name: "Miami",
    color: "yellow",
    x: 25,
    y: 52,
    neighbors: ["atlanta", "washington", "mexico_city", "bogota"],
  },
  bogota: {
    name: "Bogota",
    color: "yellow",
    x: 27,
    y: 62,
    neighbors: ["mexico_city", "miami", "lima", "sao_paulo", "buenos_aires"],
  },
  lima: {
    name: "Lima",
    color: "yellow",
    x: 22,
    y: 75,
    neighbors: ["mexico_city", "bogota", "santiago"],
  },
  santiago: {
    name: "Santiago",
    color: "yellow",
    x: 24,
    y: 90,
    neighbors: ["lima", "buenos_aires"],
  },
  buenos_aires: {
    name: "Buenos Aires",
    color: "yellow",
    x: 31,
    y: 85,
    neighbors: ["bogota", "sao_paulo", "santiago"],
  },
  sao_paulo: {
    name: "Sao Paulo",
    color: "yellow",
    x: 35,
    y: 75,
    neighbors: ["bogota", "buenos_aires", "madrid", "lagos"],
  },
  lagos: {
    name: "Lagos",
    color: "yellow",
    x: 47,
    y: 60,
    neighbors: ["sao_paulo", "kinshasa", "khartoum"],
  },
  kinshasa: {
    name: "Kinshasa",
    color: "yellow",
    x: 52,
    y: 70,
    neighbors: ["lagos", "khartoum", "johannesburg"],
  },
  johannesburg: {
    name: "Johannesburg",
    color: "yellow",
    x: 55,
    y: 85,
    neighbors: ["kinshasa", "khartoum"],
  },
  khartoum: {
    name: "Khartoum",
    color: "yellow",
    x: 58,
    y: 60,
    neighbors: ["lagos", "kinshasa", "johannesburg", "cairo"],
  },
  algiers: {
    name: "Algiers",
    color: "green",
    x: 48,
    y: 45,
    neighbors: ["madrid", "paris", "istanbul", "cairo"],
  },
  istanbul: {
    name: "Istanbul",
    color: "green",
    x: 57,
    y: 35,
    neighbors: [
      "milan",
      "st_petersburg",
      "algiers",
      "cairo",
      "baghdad",
      "moscow",
    ],
  },
  moscow: {
    name: "Moscow",
    color: "green",
    x: 63,
    y: 25,
    neighbors: ["st_petersburg", "istanbul", "tehran"],
  },
  cairo: {
    name: "Cairo",
    color: "green",
    x: 55,
    y: 47,
    neighbors: ["algiers", "istanbul", "baghdad", "riyadh", "khartoum"],
  },
  baghdad: {
    name: "Baghdad",
    color: "green",
    x: 62,
    y: 40,
    neighbors: ["istanbul", "cairo", "tehran", "riyadh", "karachi"],
  },
  tehran: {
    name: "Tehran",
    color: "green",
    x: 70,
    y: 32,
    neighbors: ["moscow", "baghdad", "karachi", "delhi"],
  },
  riyadh: {
    name: "Riyadh",
    color: "green",
    x: 62,
    y: 52,
    neighbors: ["cairo", "baghdad", "karachi"],
  },
  karachi: {
    name: "Karachi",
    color: "green",
    x: 70,
    y: 45,
    neighbors: ["tehran", "baghdad", "riyadh", "mumbai", "delhi"],
  },
  mumbai: {
    name: "Mumbai",
    color: "green",
    x: 70,
    y: 56,
    neighbors: ["karachi", "delhi", "chennai"],
  },
  delhi: {
    name: "Delhi",
    color: "green",
    x: 76,
    y: 40,
    neighbors: ["tehran", "karachi", "mumbai", "chennai", "kolkata"],
  },
  chennai: {
    name: "Chennai",
    color: "green",
    x: 76,
    y: 62,
    neighbors: ["mumbai", "delhi", "kolkata", "bangkok", "jakarta"],
  },
  kolkata: {
    name: "Kolkata",
    color: "green",
    x: 81,
    y: 45,
    neighbors: ["delhi", "chennai", "bangkok", "hong_kong"],
  },
  beijing: {
    name: "Beijing",
    color: "red",
    x: 84,
    y: 30,
    neighbors: ["seoul", "shanghai"],
  },
  seoul: {
    name: "Seoul",
    color: "red",
    x: 91,
    y: 27,
    neighbors: ["beijing", "shanghai", "tokyo"],
  },
  tokyo: {
    name: "Tokyo",
    color: "red",
    x: 100,
    y: 32,
    neighbors: ["seoul", "shanghai", "osaka", "san_francisco"],
  },
  shanghai: {
    name: "Shanghai",
    color: "red",
    x: 88,
    y: 40,
    neighbors: ["beijing", "seoul", "tokyo", "taipei", "hong_kong"],
  },
  osaka: {
    name: "Osaka",
    color: "red",
    x: 100,
    y: 42,
    neighbors: ["tokyo", "taipei"],
  },
  taipei: {
    name: "Taipei",
    color: "red",
    x: 94,
    y: 50,
    neighbors: ["shanghai", "osaka", "hong_kong", "manila"],
  },
  hong_kong: {
    name: "Hong Kong",
    color: "red",
    x: 88,
    y: 52,
    neighbors: [
      "shanghai",
      "taipei",
      "manila",
      "ho_chi_minh_city",
      "bangkok",
      "kolkata",
    ],
  },
  bangkok: {
    name: "Bangkok",
    color: "red",
    x: 80,
    y: 56,
    neighbors: [
      "kolkata",
      "hong_kong",
      "ho_chi_minh_city",
      "jakarta",
      "chennai",
    ],
  },
  manila: {
    name: "Manila",
    color: "red",
    x: 100,
    y: 62,
    neighbors: [
      "taipei",
      "hong_kong",
      "ho_chi_minh_city",
      "sydney",
      "san_francisco",
    ],
  },
  ho_chi_minh_city: {
    name: "Ho Chi Minh City",
    color: "red",
    x: 88,
    y: 66,
    neighbors: ["bangkok", "hong_kong", "manila", "jakarta"],
  },
  jakarta: {
    name: "Jakarta",
    color: "red",
    x: 80,
    y: 72,
    neighbors: ["chennai", "bangkok", "ho_chi_minh_city", "sydney"],
  },
  sydney: {
    name: "Sydney",
    color: "red",
    x: 94,
    y: 85,
    neighbors: ["jakarta", "manila", "los_angeles"],
  },
};

const EVENT_CARDS = {
  EVENT_AIRLIFT: { name: "Airlift", desc: "Move any pawn to any city." },
  EVENT_QUIET_NIGHT: {
    name: "One Quiet Night",
    desc: "Skip the next Infection Phase.",
  },
  EVENT_GOV_GRANT: { name: "Gov Grant", desc: "Build a station anywhere." },
  EVENT_FORECAST: {
    name: "Forecast",
    desc: "Rearrange top 6 Infection cards.",
  },
  EVENT_RESILIENT_POP: {
    name: "Resilient Pop",
    desc: "Remove 1 card from Infection Discard.",
  },
};

const ROLES = {
  MEDIC: {
    name: "Medic",
    desc: "Treat removes all cubes of a color. Auto-clears cured diseases upon entering a city. No new virus cubes are placed in their city if it's cure is already discovered.",
    icon: Activity,
    color: "text-orange-400",
    bgColor: "bg-orange-500", // Vibrant Orange
  },
  SCIENTIST: {
    name: "Scientist",
    desc: "Needs only 4 cards to discover a cure.",
    icon: Syringe,
    color: "text-slate-100",
    bgColor: "bg-slate-200", // Bright White/Silver
  },
  RESEARCHER: {
    name: "Researcher",
    desc: "Can give ANY city card when sharing knowledge.",
    icon: Search,
    color: "text-yellow-300",
    bgColor: "bg-yellow-400", // Bright Yellow/Gold
  },
  DISPATCHER: {
    name: "Dispatcher",
    desc: "Moves other agents as if they were their own. As an action, can move any pawn to a city with another pawn.",
    icon: Plane,
    color: "text-pink-400",
    bgColor: "bg-pink-500", // Vivid Pink/Magenta
  },
  OPS_EXPERT: {
    name: "Operations Expert",
    desc: "Can build a Research Station without discarding a card. Once per turn, as an action, move from a research station to any city by discarding any City card.",
    icon: Shield,
    color: "text-lime-400",
    bgColor: "bg-lime-500", // Light/Neon Green
  },
  QUARANTINE_SPEC: {
    name: "Quarantine Spec",
    desc: "Prevents disease placements and outbreaks in their city and all connected cities.",
    icon: Target,
    color: "text-violet-400",
    bgColor: "bg-violet-500", // Deep Purple
  },
  CONTINGENCY_PLAN: {
    name: "Contingency Planner",
    desc: "Can reuse an Event card from the discard pile. Upon use, the card is removed from the game.",
    icon: BookOpen,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500", // Bright Cyan/Light Blue
  },
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
const areConnected = (city1, city2) => CITIES[city1]?.neighbors.includes(city2);

// --- Sub-Components ---
const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-[160] flex items-center justify-center pointer-events-none">
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl border-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] transform transition-all animate-in fade-in zoom-in slide-in-from-bottom-10 duration-300 backdrop-blur-md
      ${type === "success" ? "bg-emerald-900/90 border-emerald-500 text-emerald-100" : ""}
      ${type === "failure" ? "bg-red-900/90 border-red-500 text-red-100" : ""}
      ${type === "neutral" ? "bg-cyan-900/90 border-cyan-500 text-cyan-100" : ""}
      ${type === "warning" ? "bg-amber-900/90 border-amber-500 text-amber-100" : ""}
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

const CyanAtmosphere = React.memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/40 via-slate-950 to-black" />
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
    {[...Array(20)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full animate-float opacity-30"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 3 + 1}px`,
          height: `${Math.random() * 3 + 1}px`,
          backgroundColor: Math.random() > 0.5 ? "#22d3ee" : "#10b981",
          animationDuration: `${15 + Math.random() * 20}s`,
          animationDelay: `${Math.random() * -20}s`,
          boxShadow: "0 0 10px 1px rgba(34, 211, 238, 0.5)",
        }}
      />
    ))}
    <style>{`@keyframes float { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.1;} 50% { transform: translateY(-40px) scale(1.5); opacity: 0.6;} } .animate-float { animation: float infinite ease-in-out; }`}</style>
  </div>
));

const GameLogo = () => (
  <div className="flex items-center justify-center gap-2 opacity-40 mt-auto pb-4 pt-2 relative z-10 pointer-events-none select-none">
    <Globe2 size={14} className="text-cyan-500" />
    <span className="text-[10px] font-black tracking-[0.2em] text-cyan-500 uppercase">
      OUTBREAK
    </span>
  </div>
);

const GameLogoBig = () => (
  <div className="flex items-center justify-center gap-2 opacity-40 mt-auto pb-4 pt-2 relative z-10 pointer-events-none select-none">
    <Globe2 size={22} className="text-cyan-500" />
    <span className="text-[20px] font-black tracking-[0.2em] text-cyan-500 uppercase">
      OUTBREAK
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
  <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2">Abort Mission?</h3>
      <p className="text-slate-400 mb-6 text-sm">
        {isHost
          ? "Leaving will destroy the session for all agents!"
          : inGame
            ? "Leaving now will end the operation for you!"
            : "Leaving the lobby will disconnect you."}
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={onCancel}
          className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded font-bold transition-colors"
        >
          Stay (Cancel)
        </button>
        {inGame && isHost && (
          <button
            onClick={onConfirmLobby}
            className="py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Home size={18} /> Return Team to HQ
          </button>
        )}
        <button
          onClick={onConfirmLeave}
          className="bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> {isHost ? "Destroy Room" : "Leave Game"}
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
    const saved = localStorage.getItem("outbreak_room_id");
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
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-end pb-20 md:justify-center md:pb-0 font-sans overflow-hidden">
      {/* --- NEW: LOADING INDICATOR --- */}
      {/* This shows only while the image is NOT loaded yet */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-cyan-500/50">
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
      <div className="absolute bottom-4 text-slate-600 text-xs text-center">
        Inspired by Pandemic. A tribute game.
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

const CardDisplay = ({
  type,
  isEpidemic,
  onClick,
  selected,
  disabled,
  mini = false,
}) => {
  if (isEpidemic) {
    return (
      <div
        className={`${mini ? "w-14 h-20 md:w-16 md:h-24" : "w-16 h-24 md:w-20 md:h-28"} bg-emerald-900 border-2 border-emerald-500 rounded flex flex-col items-center justify-center p-1 shadow-lg shadow-emerald-900/50 shrink-0`}
      >
        <Skull
          className={`text-emerald-400 ${mini ? "w-5 h-5 mb-1" : "w-8 h-8 mb-2"}`}
        />
        <span
          className={`${mini ? "text-[8px]" : "text-[10px] md:text-xs"} font-bold text-emerald-300 uppercase tracking-wider text-center leading-tight`}
        >
          Epidemic
        </span>
      </div>
    );
  }
  if (type.startsWith("EVENT_")) {
    const eventDef = EVENT_CARDS[type];
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${mini ? "w-14 h-20 md:w-16 md:h-24 p-1" : "w-16 h-24 md:w-20 md:h-28 p-2"} bg-purple-900/40 border-2 border-purple-500 rounded flex flex-col items-center justify-between shadow-lg shadow-purple-900/20 shrink-0 transition-all ${selected ? "ring-2 ring-white scale-105" : "hover:scale-105"} ${disabled ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
      >
        <Zap
          className={`text-purple-400 ${mini ? "w-4 h-4 mt-0.5" : "w-6 h-6 z-10"}`}
        />
        <span
          className={`${mini ? "text-[8px]" : "text-[10px] md:text-xs"} font-bold text-purple-200 uppercase tracking-wider text-center leading-tight drop-shadow-md break-words w-full`}
        >
          {eventDef?.name}
        </span>
      </button>
    );
  }
  const city = CITIES[type];
  if (!city)
    return (
      <div
        className={`${mini ? "w-14 h-20 md:w-16 md:h-24" : "w-16 h-24 md:w-20 md:h-28"} bg-slate-800 rounded border border-slate-700 shrink-0`}
      ></div>
    );
  const colStyles = COLORS[city.color];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${mini ? "w-14 h-20 md:w-16 md:h-24 border p-1" : "w-16 h-24 md:w-20 md:h-28 border-2 p-2"} rounded flex flex-col items-center justify-between shadow-lg transition-all relative overflow-hidden group shrink-0 ${selected ? `ring-2 ring-offset-2 ring-offset-slate-900 ring-white scale-105 z-10` : "hover:scale-105"} ${disabled ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer"} ${colStyles.bg} bg-opacity-20 ${colStyles.border}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70 z-0"></div>
      <MapPin
        className={`${colStyles.text} ${mini ? "w-4 h-4 mt-0.5" : "w-6 h-6"} z-10`}
      />
      <span
        className={`${mini ? "text-[8px]" : "text-[10px] md:text-xs"} font-bold text-white uppercase tracking-wider text-center z-10 leading-tight drop-shadow-md break-words w-full`}
      >
        {city.name}
      </span>
    </button>
  );
};

const TeamPanelModal = ({
  gameState,
  ROLES,
  CITIES,
  COLORS,
  user,
  onClose,
}) => {
  const [activeTab, setActiveTab] = React.useState("team"); // 'team', 'status', 'logs', 'map'

  const cubeCounts = { blue: 0, yellow: 0, green: 0, red: 0 };
  Object.values(gameState.cities).forEach((city) => {
    Object.keys(city.cubes).forEach((color) => {
      cubeCounts[color] += city.cubes[color];
    });
  });

  const allInfectionCards = Object.keys(CITIES);
  const existingInfections = [
    ...gameState.infectionDeck,
    ...gameState.infectionDiscard,
  ];
  const exiledInfections = allInfectionCards.filter(
    (c) => !existingInfections.includes(c),
  );

  const allPlayerCards = [...Object.keys(CITIES), ...Object.keys(EVENT_CARDS)];
  const existingPlayerCards = [
    ...gameState.playerDeck,
    ...gameState.playerDiscard,
    ...gameState.players.flatMap((p) => p.hand),
  ];
  const exiledPlayerCards = allPlayerCards.filter(
    (c) => !existingPlayerCards.includes(c),
  );

  return (
    <div className="fixed inset-0 bg-slate-950/95 z-[300] flex flex-col animate-in fade-in slide-in-from-bottom-4 backdrop-blur-md">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900 shadow-lg shrink-0">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <User className="text-cyan-400" /> Operations Overview
        </h2>
        <button
          onClick={onClose}
          className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900 border-b border-slate-800 shrink-0 overflow-x-auto custom-scrollbar">
        {["team", "status", "logs", "map"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[80px] py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50" : "text-slate-500 hover:text-slate-300"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col">
        {activeTab === "team" && (
          <div className="space-y-4">
            {gameState.players.map((p, i) => {
              const r = ROLES[p.role];
              const isTurn = gameState.turnIndex === i;
              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border ${isTurn ? "bg-slate-800/80 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.2)]" : "bg-slate-900/60 border-slate-800"}`}
                >
                  <div className="flex justify-between items-start mb-3 border-b border-slate-700/50 pb-3">
                    <div>
                      <div
                        className={`text-base font-bold ${r?.color || "text-white"} flex items-center gap-2`}
                      >
                        {p.name}{" "}
                        {p.id === user?.uid && (
                          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">
                        {r?.name} • {r?.desc}
                      </div>
                    </div>
                    {isTurn && (
                      <div className="text-[10px] bg-cyan-900 text-cyan-300 px-3 py-1 rounded-full font-bold animate-pulse border border-cyan-500/50 shrink-0">
                        ACTIVE
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-slate-300 flex items-center gap-2 mb-3 bg-black/40 px-3 py-2 rounded-lg border border-slate-800 w-fit">
                    <MapPin size={16} className="text-cyan-500" /> Location:{" "}
                    <span className="font-bold text-white uppercase">
                      {CITIES[p.location]?.name}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">
                      Hand Cards ({p.hand.length})
                    </div>
                    {p.hand.length === 0 ? (
                      <div className="text-xs text-slate-600 italic">
                        No cards in hand
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {p.hand.map((c, idx) => {
                          if (c === "EPIDEMIC")
                            return (
                              <div
                                key={idx}
                                className="px-2.5 py-1.5 bg-emerald-900/50 border border-emerald-500 rounded flex items-center gap-1.5 shadow-sm"
                              >
                                <Skull size={12} className="text-emerald-400" />
                                <span className="text-[10px] md:text-xs font-bold text-emerald-300 uppercase tracking-wider">
                                  Epidemic
                                </span>
                              </div>
                            );
                          if (c.startsWith("EVENT_"))
                            return (
                              <div
                                key={idx}
                                className="px-2.5 py-1.5 bg-purple-900/50 border border-purple-500 rounded flex items-center gap-1.5 shadow-sm"
                              >
                                <Zap size={12} className="text-purple-400" />
                                <span className="text-[10px] md:text-xs font-bold text-purple-300 uppercase tracking-wider">
                                  {EVENT_CARDS[c]?.name}
                                </span>
                              </div>
                            );
                          const city = CITIES[c];
                          if (!city) return null;
                          const colStyle = COLORS[city.color];
                          return (
                            <div
                              key={idx}
                              className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 border shadow-sm ${colStyle.bg} bg-opacity-20 ${colStyle.border}`}
                            >
                              <MapPin size={12} className={colStyle.text} />
                              <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-wider">
                                {city.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "status" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity size={14} /> Global Threat Level
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 uppercase font-bold mb-1">
                    <span>Outbreaks</span>
                    <span className="text-red-400">
                      {gameState.outbreaks} / 8
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${(gameState.outbreaks / 8) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-400 uppercase font-bold mb-1">
                    <span>Infection Rate</span>
                    <span className="text-amber-400">
                      {INFECTION_RATES[gameState.infectionRateIdx]} Cards/Turn
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(gameState.infectionRateIdx / (INFECTION_RATES.length - 1)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Syringe size={14} /> Cure Status & Active Infections
              </h3>
              <div className="space-y-3">
                {Object.keys(COLORS).map((color) => (
                  <div
                    key={color}
                    className="flex items-center justify-between p-2 rounded bg-black/40 border border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-sm ${COLORS[color].bg} shadow-sm`}
                      ></div>
                      <span className="text-xs font-bold uppercase text-slate-300">
                        {color}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold uppercase">
                      <span className="text-slate-500">
                        {cubeCounts[color]} / 24 cubes
                      </span>
                      {gameState.eradicated[color] ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle size={12} /> Eradicated
                        </span>
                      ) : gameState.cures[color] ? (
                        <span className="text-cyan-400 flex items-center gap-1">
                          <Syringe size={12} /> Cured
                        </span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1">
                          <AlertTriangle size={12} /> Active
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen size={14} /> Player Cards Intel
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-black/40 rounded border border-slate-800">
                  <span className="text-xs font-bold text-cyan-400">
                    PLAYER DECK
                  </span>
                  <span className="text-sm font-bold text-white">
                    {gameState.playerDeck.length}{" "}
                    <span className="text-slate-500 text-[10px]">left</span>
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-black/40 rounded border border-slate-800">
                  <span className="text-xs font-bold text-emerald-400">
                    EPIDEMICS REMAINING
                  </span>
                  <span className="text-sm font-bold text-white">
                    {
                      gameState.playerDeck.filter((c) => c === "EPIDEMIC")
                        .length
                    }{" "}
                    <span className="text-slate-500 text-[10px]">in deck</span>
                  </span>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase">
                    Discard Pile ({gameState.playerDiscard.length})
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar p-1.5 bg-black/20 rounded border border-slate-800">
                    {gameState.playerDiscard.length === 0 && (
                      <span className="text-xs text-slate-600 italic">
                        Empty
                      </span>
                    )}
                    {gameState.playerDiscard.map((c, i) => {
                      const isEvent = c.startsWith("EVENT_");

                      if (isEvent) {
                        return (
                          <div
                            key={i}
                            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border bg-purple-900/30 text-purple-300 border-purple-500/30 flex items-center gap-1"
                          >
                            <Zap size={8} />
                            {EVENT_CARDS[c]?.name}
                          </div>
                        );
                      }

                      const city = CITIES[c];
                      if (!city) return null;
                      const col = COLORS[city.color];

                      return (
                        <div
                          key={i}
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 bg-slate-800 ${col.border}`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${col.bg}`}
                          ></div>
                          <span className="text-slate-200">{city.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {exiledPlayerCards.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-red-500/80 mb-1.5 uppercase flex items-center gap-1">
                      <Trash2 size={10} /> Exiled (Contingency)
                    </div>
                    <div className="flex flex-wrap gap-1 p-1.5 bg-red-950/20 rounded border border-red-900/30">
                      {exiledPlayerCards.map((c, i) => {
                        const isEvent = c.startsWith("EVENT_");
                        const name = isEvent
                          ? EVENT_CARDS[c]?.name
                          : CITIES[c]?.name;
                        return (
                          <div
                            key={i}
                            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border bg-red-900/50 text-red-200 border-red-500/50"
                          >
                            {name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Target size={14} /> Infection Intel
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-black/40 rounded border border-slate-800">
                  <span className="text-xs font-bold text-amber-400">
                    INFECTION DECK
                  </span>
                  <span className="text-sm font-bold text-white">
                    {gameState.infectionDeck.length}{" "}
                    <span className="text-slate-500 text-[10px]">left</span>
                  </span>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase">
                    Discard Pile ({gameState.infectionDiscard.length})
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto custom-scrollbar p-1.5 bg-black/20 rounded border border-slate-800">
                    {gameState.infectionDiscard.length === 0 && (
                      <span className="text-xs text-slate-600 italic">
                        Empty
                      </span>
                    )}
                    {gameState.infectionDiscard.map((c, i) => {
                      const city = CITIES[c];
                      if (!city) return null;
                      const col = COLORS[city.color];
                      return (
                        <div
                          key={i}
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 bg-slate-800 ${col.border}`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${col.bg}`}
                          ></div>
                          <span className="text-slate-200">{city.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {exiledInfections.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-red-500/80 mb-1.5 uppercase flex items-center gap-1">
                      <Trash2 size={10} /> Removed (Resilient Pop)
                    </div>
                    <div className="flex flex-wrap gap-1 p-1.5 bg-red-950/20 rounded border border-red-900/30">
                      {exiledInfections.map((c, i) => {
                        const city = CITIES[c];
                        if (!city) return null;
                        return (
                          <div
                            key={i}
                            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border bg-red-900/50 text-red-200 border-red-500/50"
                          >
                            {city.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800 h-full">
            {gameState.logs
              .slice()
              .reverse()
              .map((log, i) => (
                <div
                  key={i}
                  className={`text-xs p-3 rounded-lg border-l-4 shadow-sm ${log.type === "danger" ? "bg-red-900/20 border-red-500 text-red-200" : log.type === "success" ? "bg-emerald-900/20 border-emerald-500 text-emerald-200" : log.type === "warning" ? "bg-amber-900/20 border-amber-500 text-amber-200" : "bg-slate-800/50 border-slate-500 text-slate-300"}`}
                >
                  {log.text}
                </div>
              ))}
            {gameState.logs.length === 0 && (
              <div className="text-slate-500 italic text-center py-4">
                No operations logged yet.
              </div>
            )}
          </div>
        )}

        {activeTab === "map" && (
          <div className="flex-1 w-full h-full overflow-auto relative custom-scrollbar overscroll-contain touch-pan-x touch-pan-y bg-slate-950 rounded-xl border border-slate-800">
            <div className="min-w-[1000px] xl:min-w-full min-h-[700px] xl:min-h-full h-full relative mx-auto">
              <div className="absolute inset-[4%] md:inset-[5%] z-10">
                {(() => {
                  const connections = [];
                  const wrapLabels = [];
                  const drawn = new Set();
                  Object.keys(CITIES).forEach((c1) => {
                    CITIES[c1].neighbors.forEach((c2) => {
                      const pair = [c1, c2].sort().join("-");
                      if (!drawn.has(pair)) {
                        drawn.add(pair);
                        const city1 = CITIES[c1];
                        const city2 = CITIES[c2];
                        const distanceX = Math.abs(city1.x - city2.x);
                        if (distanceX > 50) {
                          const westCity = city1.x < city2.x ? city1 : city2;
                          const eastCity = city1.x > city2.x ? city1 : city2;
                          const dY = eastCity.y - westCity.y;
                          const yOffset = dY * 0.15;
                          const wTargetX = westCity.x - 3;
                          const wTargetY = westCity.y + yOffset;
                          connections.push(
                            <line
                              key={`line-w-${pair}`}
                              x1={`${westCity.x}%`}
                              y1={`${westCity.y}%`}
                              x2={`${wTargetX}%`}
                              y2={`${wTargetY}%`}
                              stroke="rgba(255, 255, 255, 0.4)"
                              strokeWidth="3"
                              strokeDasharray="4 4"
                            />,
                          );
                          wrapLabels.push(
                            <div
                              key={`label-w-${pair}`}
                              className="absolute transform -translate-y-1/2 flex items-center justify-end z-0 pointer-events-none"
                              style={{
                                left: `calc(${wTargetX}% - 4px)`,
                                top: `${wTargetY}%`,
                                transform: "translate(-100%, -50%)",
                              }}
                            >
                              <div className="bg-slate-900/80 text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-slate-700/50 backdrop-blur-sm shadow-sm whitespace-nowrap">
                                {eastCity.name}
                              </div>
                            </div>,
                          );
                          const eTargetX = eastCity.x + 3;
                          const eTargetY = eastCity.y - yOffset;
                          connections.push(
                            <line
                              key={`line-e-${pair}`}
                              x1={`${eastCity.x}%`}
                              y1={`${eastCity.y}%`}
                              x2={`${eTargetX}%`}
                              y2={`${eTargetY}%`}
                              stroke="rgba(255, 255, 255, 0.4)"
                              strokeWidth="3"
                              strokeDasharray="4 4"
                            />,
                          );
                          wrapLabels.push(
                            <div
                              key={`label-e-${pair}`}
                              className="absolute transform -translate-y-1/2 flex items-center justify-start z-0 pointer-events-none"
                              style={{
                                left: `calc(${eTargetX}% + 4px)`,
                                top: `${eTargetY}%`,
                              }}
                            >
                              <div className="bg-slate-900/80 text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-slate-700/50 backdrop-blur-sm shadow-sm whitespace-nowrap">
                                {westCity.name}
                              </div>
                            </div>,
                          );
                          return;
                        }
                        connections.push(
                          <line
                            key={pair}
                            x1={`${city1.x}%`}
                            y1={`${city1.y}%`}
                            x2={`${city2.x}%`}
                            y2={`${city2.y}%`}
                            stroke="rgba(255, 255, 255, 0.15)"
                            strokeWidth="3"
                            strokeDasharray="6 6"
                          />,
                        );
                      }
                    });
                  });

                  return (
                    <>
                      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
                        {connections}
                      </svg>
                      {wrapLabels}
                      {Object.keys(CITIES).map((cityId) => {
                        const city = CITIES[cityId];
                        const cityState = gameState.cities[cityId];
                        if (!cityState) return null;
                        const playersHere = gameState.players.filter(
                          (p) => p.location === cityId,
                        );
                        const colStyle = COLORS[city.color];
                        const isAtRisk = Object.values(cityState.cubes).some(
                          (count) => count >= 3,
                        );

                        return (
                          <div
                            key={cityId}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-10"
                            style={{ left: `${city.x}%`, top: `${city.y}%` }}
                          >
                            <div className="p-1.5 md:p-2 flex flex-col items-center justify-center relative">
                              {isAtRisk && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full animate-ping opacity-30 w-12 h-12 md:w-16 md:h-16 pointer-events-none"></div>
                              )}
                              {/* FIX: Same update for the Map Tab */}
                              <div
                                className={`relative w-8 h-8 md:w-12 md:h-12 rounded-full border-4 shadow-xl flex items-center justify-center bg-slate-950 animate-pulse ${colStyle.border}`}
                              >
                                {cityState.hasStation && (
                                  <Home className="text-white w-4 h-4 md:w-5 md:h-5 absolute -top-5 md:-top-7 drop-shadow-md" />
                                )}
                                <div className="flex flex-wrap gap-[2px] w-6 h-6 md:w-8 md:h-8 justify-center content-center items-center">
                                  {Object.keys(cityState.cubes).map((color) => {
                                    return Array.from({
                                      length: cityState.cubes[color],
                                    }).map((_, i) => (
                                      <div
                                        key={`${color}-${i}`}
                                        className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-[1px] ${COLORS[color].bg} shadow-sm`}
                                      ></div>
                                    ));
                                  })}
                                </div>
                              </div>
                              <div className="absolute top-full flex flex-col items-center pointer-events-none z-20">
                                <div className="mt-1 px-2 py-1 bg-black/90 rounded text-[9px] md:text-[11px] font-bold text-white uppercase tracking-wider backdrop-blur-sm border border-slate-700 whitespace-nowrap drop-shadow-lg">
                                  {city.name}
                                </div>
                                {playersHere.length > 0 && (
                                  <div className="mt-1 flex gap-1">
                                    {playersHere.map((p, i) => {
                                      const roleDef = ROLES[p.role];
                                      const bgClass = roleDef
                                        ? roleDef.bgColor
                                        : "bg-white";
                                      return (
                                        <div
                                          key={p.id}
                                          className="relative flex items-center justify-center"
                                          style={{
                                            marginLeft: i > 0 ? "-8px" : "0",
                                          }}
                                        >
                                          <div
                                            className={`absolute inset-0 rounded-full animate-ping opacity-75 ${bgClass}`}
                                          ></div>
                                          <div
                                            className={`relative w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-black shadow-lg ${bgClass}`}
                                          ></div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PhaseReportModal = ({ gameState, user, CITIES, COLORS, onProceed }) => {
  const activePlayer = gameState.players[gameState.turnIndex];
  const isMyTurn = activePlayer.id === user?.uid;
  const { phase, turnData } = gameState;

  return (
    <div className="fixed inset-0 bg-slate-950/95 z-[250] flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
      <div
        className={`border-2 p-6 md:p-8 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col text-center relative overflow-hidden ${
          phase === "DRAW"
            ? "bg-slate-900 border-cyan-500 shadow-cyan-900/50"
            : phase === "EPIDEMIC"
              ? "bg-red-950 border-red-500 shadow-red-900/50"
              : "bg-emerald-950 border-emerald-500 shadow-emerald-900/50"
        }`}
      >
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-white mb-2 flex items-center justify-center gap-3">
          {phase === "DRAW" && (
            <>
              <Search className="text-cyan-400" /> Supply Drop
            </>
          )}
          {phase === "EPIDEMIC" && (
            <>
              <Skull className="text-red-400 animate-pulse" /> Epidemic!
            </>
          )}
          {phase === "INFECT" && (
            <>
              <AlertTriangle className="text-emerald-400" /> Infection Phase
            </>
          )}
        </h2>
        <p className="text-slate-300 text-sm md:text-base mb-6 font-bold uppercase tracking-wider opacity-80">
          {phase === "DRAW" && `${activePlayer.name} drew 2 cards`}
          {phase === "EPIDEMIC" && "The virus mutates and intensifies!"}
          {phase === "INFECT" &&
            (turnData.skipped
              ? "One Quiet Night is active."
              : "New infections spreading across the globe.")}
        </p>

        <div className="flex-1 flex flex-col items-center justify-center mb-8 min-h-[120px]">
          {phase === "DRAW" && (
            <div className="flex gap-4">
              {turnData.drawnCards.map((c, i) => (
                <CardDisplay
                  key={i}
                  type={c}
                  isEpidemic={c === "EPIDEMIC"}
                  disabled={false}
                />
              ))}
            </div>
          )}
          {phase === "EPIDEMIC" && (
            <div className="flex flex-col gap-4 w-full">
              {turnData.epidemicReports.map((report, i) => (
                <div
                  key={i}
                  className="bg-black/40 p-4 rounded-xl border border-red-500/30 flex flex-col items-center"
                >
                  <div className="text-red-400 font-bold text-xs uppercase mb-2">
                    1. Infection Rate Increased to {report.newRate}
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-slate-300 uppercase">
                      2. Struck:
                    </span>
                    <div className="bg-slate-800 px-3 py-1 rounded border border-slate-600 font-bold text-white uppercase text-sm">
                      {CITIES[report.city].name}
                    </div>
                  </div>
                  <div className="text-red-400 font-bold text-xs uppercase">
                    3. Discard pile shuffled & placed on top
                  </div>
                </div>
              ))}
            </div>
          )}
          {phase === "INFECT" &&
            (turnData.skipped ? (
              <div className="text-emerald-300 border border-emerald-500/50 bg-emerald-900/30 p-6 rounded-xl font-bold uppercase tracking-widest animate-pulse">
                Infections Bypassed
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                {turnData.infectedCities.map((inf, i) => (
                  <div
                    key={i}
                    className="bg-slate-800 border border-slate-600 p-2 rounded flex flex-col items-center gap-1 shadow-lg relative"
                  >
                    {inf.outbreak && (
                      <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce shadow-md z-10">
                        OUTBREAK
                      </div>
                    )}
                    <div
                      className={`w-3 h-3 rounded-sm ${COLORS[inf.color].bg}`}
                    ></div>
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider px-1">
                      {CITIES[inf.cityId].name}
                    </span>
                  </div>
                ))}
                {turnData.infectedCities.length === 0 && (
                  <div className="text-slate-400 italic">
                    No infections occurred (Deck empty or blocked).
                  </div>
                )}
              </div>
            ))}
        </div>

        {isMyTurn ? (
          <button
            onClick={onProceed}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-white shadow-lg transition-transform active:scale-95 ${phase === "DRAW" ? "bg-cyan-600 hover:bg-cyan-500" : phase === "EPIDEMIC" ? "bg-red-600 hover:bg-red-500" : "bg-emerald-600 hover:bg-emerald-500"}`}
          >
            {phase === "INFECT" ? "End Turn" : "Acknowledge & Proceed"}
          </button>
        ) : (
          <div className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-slate-400 bg-black/40 border border-slate-800 animate-pulse">
            Waiting for {activePlayer.name}...
          </div>
        )}
      </div>
    </div>
  );
};

const DiscardModal = ({
  player,
  CITIES,
  EVENT_CARDS,
  onDiscard,
  onPlayEvent,
}) => {
  const overAmount = player.hand.length - 7;
  return (
    <div className="fixed inset-0 bg-slate-950/95 z-[140] flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in zoom-in-95">
      <div className="bg-slate-900 border-2 border-red-500 p-6 md:p-8 rounded-2xl max-w-3xl w-full shadow-2xl shadow-red-900/20 flex flex-col text-center">
        <h2 className="text-xl md:text-3xl font-black uppercase tracking-widest text-red-400 mb-2 flex items-center justify-center gap-3">
          <AlertTriangle className="animate-pulse" /> Hand Limit Exceeded
        </h2>
        <p className="text-slate-300 text-sm md:text-base mb-8 font-bold uppercase tracking-wider">
          You must drop{" "}
          <span className="text-red-400 text-xl mx-1">{overAmount}</span> card
          {overAmount > 1 ? "s" : ""} (Or play events) to continue.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {player.hand.map((cardId, idx) => {
            const isEvent = cardId.startsWith("EVENT_");
            return (
              <div key={idx} className="flex flex-col gap-2">
                <CardDisplay type={cardId} disabled={false} />
                <div className="flex gap-1 w-full mt-1">
                  {isEvent ? (
                    <>
                      <button
                        onClick={() => onDiscard(cardId)}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold py-1.5 rounded transition-colors uppercase"
                      >
                        Drop
                      </button>
                      <button
                        onClick={() => onPlayEvent(cardId)}
                        className="flex-1 bg-purple-700 hover:bg-purple-600 text-white text-[10px] font-bold py-1.5 rounded transition-colors shadow-[0_0_10px_rgba(147,51,234,0.4)] uppercase"
                      >
                        Play
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onDiscard(cardId)}
                      className="w-full bg-red-900/80 hover:bg-red-700 text-red-200 text-xs font-bold py-1.5 rounded border border-red-500/50 transition-colors uppercase tracking-wider"
                    >
                      Discard
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ContingencyModal = ({ discardPile, EVENT_CARDS, onSelect, onClose }) => {
  const availableEvents = discardPile.filter((c) => c.startsWith("EVENT_"));
  return (
    <div className="fixed inset-0 bg-slate-950/90 z-[150] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center">
        <h3 className="text-xl font-bold text-cyan-200 mb-2 flex items-center justify-center gap-2">
          <BookOpen /> Contingency Plan
        </h3>
        <p className="text-slate-400 text-xs mb-4">
          Retrieve one Event card from the discard pile.
        </p>
        <div className="flex flex-col gap-3 mb-6">
          {availableEvents.map((eventId) => (
            <button
              key={eventId}
              onClick={() => onSelect(eventId)}
              className="p-4 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500 rounded-xl text-purple-200 font-bold uppercase tracking-wider flex items-center gap-3 transition-colors text-left"
            >
              <Zap size={18} />
              <div>
                <div className="text-sm">{EVENT_CARDS[eventId].name}</div>
                <div className="text-[10px] text-purple-400 normal-case">
                  {EVENT_CARDS[eventId].desc}
                </div>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const TradeModal = ({
  gameState,
  user,
  CITIES,
  COLORS,
  ROLES,
  onTrade,
  onClose,
}) => {
  const activePlayer = gameState.players[gameState.turnIndex];
  const loc = activePlayer.location;
  const coPlayers = gameState.players.filter(
    (p) => p.location === loc && p.id !== activePlayer.id,
  );
  const possibleTrades = [];

  coPlayers.forEach((target) => {
    activePlayer.hand.forEach((card) => {
      if (
        !card.startsWith("EVENT_") &&
        (activePlayer.role === "RESEARCHER" || card === loc)
      ) {
        possibleTrades.push({ type: "give", target, card });
      }
    });
    target.hand.forEach((card) => {
      if (
        !card.startsWith("EVENT_") &&
        (target.role === "RESEARCHER" || card === loc)
      ) {
        possibleTrades.push({ type: "take", target, card });
      }
    });
  });

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-[150] flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md w-full shadow-2xl flex flex-col max-h-[80vh]">
        <h3 className="text-xl font-bold text-cyan-400 mb-2 flex items-center gap-2">
          <BookOpen /> Share Knowledge
        </h3>
        <p className="text-slate-400 text-xs mb-4">
          You are in{" "}
          <strong className="text-white uppercase">{CITIES[loc].name}</strong>.
          You can only trade this city's card unless one of the agents is a
          Researcher.
        </p>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4">
          {coPlayers.length === 0 && (
            <div className="text-slate-500 italic p-4 text-center border border-dashed border-slate-700 rounded">
              No other agents in {CITIES[loc].name}.
            </div>
          )}
          {coPlayers.length > 0 && possibleTrades.length === 0 && (
            <div className="text-amber-500 italic p-4 text-center border border-dashed border-amber-900/50 bg-amber-900/10 rounded">
              Agents present, but neither of you hold the {CITIES[loc].name}{" "}
              card.
            </div>
          )}
          {possibleTrades.map((trade, idx) => {
            const city = CITIES[trade.card];
            const col = COLORS[city.color];
            return (
              <button
                key={idx}
                onClick={() => onTrade(trade.type, trade.target.id, trade.card)}
                className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${trade.type === "give" ? "bg-cyan-900 text-cyan-300" : "bg-fuchsia-900 text-fuchsia-300"}`}
                  >
                    {trade.type}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm ${col.bg}`}></div>
                    <span className="text-white font-bold uppercase tracking-wider text-xs">
                      {city.name}
                    </span>
                  </div>
                </div>
                <div className="text-slate-400 text-xs flex items-center gap-1">
                  {trade.type === "give" ? "to" : "from"}{" "}
                  <strong className="text-white">{trade.target.name}</strong>
                </div>
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition-colors"
        >
          Cancel Operation
        </button>
      </div>
    </div>
  );
};

const OpsFlightModal = ({ hand, CITIES, onSelect, onClose }) => {
  const cityCards = hand.filter(
    (c) => !c.startsWith("EVENT_") && c !== "EPIDEMIC",
  );
  return (
    <div className="fixed inset-0 bg-slate-950/90 z-[150] flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md w-full shadow-2xl flex flex-col text-center">
        <h3 className="text-xl font-bold text-green-400 mb-2 flex items-center justify-center gap-2">
          <Plane /> Ops Flight
        </h3>
        <p className="text-slate-400 text-xs mb-4">
          Select a city card to discard to fly anywhere.
        </p>
        <div className="flex flex-wrap gap-2 justify-center mb-6 max-h-64 overflow-y-auto custom-scrollbar p-2 border-y border-slate-800 bg-black/20">
          {cityCards.length === 0 && (
            <span className="text-slate-500 italic p-4">
              No city cards in hand.
            </span>
          )}
          {cityCards.map((c) => (
            <CardDisplay
              key={c}
              type={c}
              disabled={false}
              onClick={() => onSelect(c)}
            />
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const ForecastModal = ({
  cards,
  CITIES,
  COLORS,
  onReorder,
  onSubmit,
  onCancel,
}) => (
  <div className="fixed inset-0 bg-slate-950/95 z-[150] flex flex-col items-center justify-center p-4 backdrop-blur-md">
    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
      <h3 className="text-xl font-bold text-cyan-400 mb-2 flex items-center gap-2">
        <Zap /> Forecast
      </h3>
      <p className="text-slate-400 text-xs mb-4">
        Rearrange the top cards of the Infection Deck. The card at the{" "}
        <strong className="text-white">TOP (1)</strong> will be drawn next.
      </p>
      <div className="flex flex-col gap-2 mb-6">
        {cards.map((cityId, idx) => {
          const city = CITIES[cityId];
          const col = COLORS[city.color];
          return (
            <div
              key={cityId}
              className="flex items-center gap-3 bg-slate-800 p-2 rounded border border-slate-700"
            >
              <span className="text-slate-500 font-mono text-xs w-4">
                {idx + 1}.
              </span>
              <div className={`w-3 h-3 rounded-sm ${col.bg}`}></div>
              <span className="text-white text-sm font-bold flex-1 uppercase tracking-wider">
                {city.name}
              </span>
              <div className="flex flex-col gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => onReorder(idx, -1)}
                  className="p-1 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  disabled={idx === cards.length - 1}
                  onClick={() => onReorder(idx, 1)}
                  className="p-1 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          className="flex-1 py-3 bg-cyan-700 hover:bg-cyan-600 text-white rounded font-bold shadow-lg shadow-cyan-900/50"
        >
          Confirm Top 6
        </button>
      </div>
    </div>
  </div>
);

const ResilientPopModal = ({
  discardPile,
  CITIES,
  COLORS,
  onSelect,
  onCancel,
}) => (
  <div className="fixed inset-0 bg-slate-950/95 z-[150] flex flex-col items-center justify-center p-4 backdrop-blur-md">
    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-2xl w-full shadow-2xl h-[80vh] flex flex-col">
      <h3 className="text-xl font-bold text-fuchsia-400 mb-2 flex items-center gap-2">
        <Zap /> Resilient Population
      </h3>
      <p className="text-slate-400 text-xs mb-4">
        Select 1 card from the Infection Discard pile to remove from the game
        permanently.
      </p>
      <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-2 border-y border-slate-800 mb-4 bg-slate-950/50">
        {discardPile.map((cityId) => {
          const city = CITIES[cityId];
          const col = COLORS[city.color];
          return (
            <button
              key={cityId}
              onClick={() => onSelect(cityId)}
              className={`p-3 rounded border-2 bg-slate-800 hover:scale-105 transition-transform text-left shadow flex flex-col gap-2 ${col.border} hover:border-white`}
            >
              <div className={`w-3 h-3 rounded-sm ${col.bg}`}></div>
              <span className="text-white text-[10px] font-bold uppercase tracking-wider leading-tight">
                {city.name}
              </span>
            </button>
          );
        })}
      </div>
      <button
        onClick={onCancel}
        className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
      >
        Cancel Operation
      </button>
    </div>
  </div>
);

const AirliftPlayerModal = ({ players, onSelect, onCancel }) => (
  <div className="fixed inset-0 bg-slate-950/90 z-[150] flex items-center justify-center p-4">
    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center">
      <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center justify-center gap-2">
        <Plane /> Airlift: Select Agent
      </h3>
      <div className="flex flex-col gap-3 mb-6">
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-white font-bold uppercase tracking-wider flex justify-between items-center"
          >
            {p.name} <MapPin size={16} className="text-slate-500" />
          </button>
        ))}
      </div>
      <button
        onClick={onCancel}
        className="w-full py-3 bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded font-bold"
      >
        Cancel
      </button>
    </div>
  </div>
);

const HowToPlayModal = ({ ROLES, onClose }) => (
  <div className="fixed inset-0 bg-slate-950/95 z-[280] flex flex-col animate-in fade-in slide-in-from-bottom-4 backdrop-blur-md">
    <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900 shadow-lg shrink-0">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <BookOpen className="text-cyan-400" /> Operation Manual
      </h2>
      <button
        onClick={onClose}
        className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
      >
        <X size={20} />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar text-slate-300 space-y-6 max-w-3xl mx-auto w-full">
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
        <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Target size={18} /> Primary Objective
        </h3>
        <p className="text-sm leading-relaxed">
          Your elite team must discover cures for all{" "}
          <strong>4 deadly diseases</strong> (Blue, Yellow, Green, Red) before
          they wipe out humanity. You win the game immediately once all four
          cures are discovered.
        </p>
      </div>
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
        <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <AlertTriangle size={18} /> Losing Conditions
        </h3>
        <ul className="space-y-2 text-sm list-disc list-inside">
          <li>
            <strong>Global Panic:</strong> The Outbreak tracker reaches 8.
          </li>
          <li>
            <strong>Time Exhausted:</strong> A player needs to draw a card, but
            the Player Deck is empty.
          </li>
          <li>
            <strong>Supply Exhausted:</strong> Running out of the 24 disease
            cubes of any specific color.
          </li>
        </ul>
      </div>
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
          <Activity size={18} /> Turn Sequence
        </h3>
        <ol className="space-y-2 text-sm list-decimal list-inside font-medium text-slate-400">
          <li>
            <strong className="text-white">Take 4 Actions:</strong> Move, Treat,
            Build, Cure, or Share.
          </li>
          <li>
            <strong className="text-white">Draw 2 Player Cards:</strong> Hand
            limit is 7. If you draw an Epidemic, it resolves immediately!
          </li>
          <li>
            <strong className="text-white">Infect Cities:</strong> Draw cards
            from the Infection Deck based on the current Infection Rate and
            place 1 cube on each city (unless One Quiet Night is active).
          </li>
        </ol>
      </div>
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
          <Zap size={18} /> Available Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-black/40 rounded border border-slate-800">
            <strong className="text-cyan-300 block mb-1">Drive / Ferry</strong>
            Move to an adjacent connected city.
          </div>
          <div className="p-3 bg-black/40 rounded border border-slate-800">
            <strong className="text-cyan-300 block mb-1">Direct Flight</strong>
            Discard a City card to move to that exact city.
          </div>
          <div className="p-3 bg-black/40 rounded border border-slate-800">
            <strong className="text-cyan-300 block mb-1">Charter Flight</strong>
            Discard the card of your <em>current</em> city to move anywhere.
          </div>
          <div className="p-3 bg-black/40 rounded border border-slate-800">
            <strong className="text-cyan-300 block mb-1">Shuttle Flight</strong>
            Move from one Research Station to another.
          </div>
          <div className="p-3 bg-black/40 rounded border border-slate-800">
            <strong className="text-amber-500 block mb-1">Treat Disease</strong>
            Remove 1 disease cube. If cured, remove all cubes of that color.
          </div>
          <div className="p-3 bg-black/40 rounded border border-slate-800">
            <strong className="text-blue-400 block mb-1">Build Station</strong>
            Discard your current city's card to build a station (Free for Ops
            Expert).
          </div>
          <div className="p-3 bg-black/40 rounded border border-slate-800">
            <strong className="text-emerald-400 block mb-1">
              Share Knowledge
            </strong>
            Give or take a card with a teammate in your city. Must match your
            city unless you are the Researcher.
          </div>
          <div className="p-3 bg-black/40 rounded border border-slate-800">
            <strong className="text-fuchsia-400 block mb-1">
              Discover Cure
            </strong>
            At a Research Station, discard 5 cards of one color (4 for
            Scientist).
          </div>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
        <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Zap size={18} /> Event Cards (Instant Play)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-black/40 rounded border border-slate-800">
            <strong className="text-purple-300 block mb-0.5">Airlift</strong>
            <span className="text-slate-400 text-xs">
              Move any player's pawn to any city on the map.
            </span>
          </div>
          <div className="p-3 bg-black/40 rounded border border-slate-800">
            <strong className="text-purple-300 block mb-0.5">
              One Quiet Night
            </strong>
            <span className="text-slate-400 text-xs">
              Skip the upcoming Infection Phase entirely.
            </span>
          </div>
          <div className="p-3 bg-black/40 rounded border border-slate-800">
            <strong className="text-purple-300 block mb-0.5">
              Government Grant
            </strong>
            <span className="text-slate-400 text-xs">
              Build a Research Station in any city for free.
            </span>
          </div>
          <div className="p-3 bg-black/40 rounded border border-slate-800">
            <strong className="text-purple-300 block mb-0.5">Forecast</strong>
            <span className="text-slate-400 text-xs">
              View and rearrange the top 6 Infection cards.
            </span>
          </div>
          <div className="p-3 bg-black/40 rounded border border-slate-800 sm:col-span-2">
            <strong className="text-purple-300 block mb-0.5">
              Resilient Population
            </strong>
            <span className="text-slate-400 text-xs">
              Permanently remove 1 card from the Infection Discard pile.
            </span>
          </div>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
          <Shield size={18} /> Agent Roles & Abilities
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {Object.entries(ROLES).map(([id, role]) => {
            const Icon = role.icon;
            return (
              <div
                key={id}
                className="p-3 bg-black/40 rounded border border-slate-800 flex items-start gap-3"
              >
                <div
                  className={`p-2 rounded bg-slate-900 border border-slate-700 ${role.color}`}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <strong className={`block mb-0.5 ${role.color}`}>
                    {role.name}
                  </strong>
                  <span className="text-slate-400 text-xs leading-tight">
                    {role.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
        <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Skull size={18} /> Epidemics & Outbreaks
        </h3>
        <p className="text-sm mb-3">
          When an <strong>Epidemic</strong> card is drawn:
        </p>
        <ol className="space-y-1 text-sm list-decimal list-inside text-slate-400 mb-4">
          <li>
            <strong>Increase:</strong> Move the Infection Rate tracker up.
          </li>
          <li>
            <strong>Infect:</strong> Draw the bottom card of the Infection Deck
            and place 3 cubes on it.
          </li>
          <li>
            <strong>Intensify:</strong> Shuffle the Infection Discard pile and
            place it back on TOP of the Infection Deck.
          </li>
        </ol>
        <p className="text-sm">
          <strong>Outbreaks:</strong> A city can only hold 3 cubes of one color.
          If a 4th is added, an Outbreak occurs! The panic level rises, and 1
          cube spreads to every connected adjacent city.
        </p>
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
export default function OutbreakGame() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("splash");

  const [roomId, setRoomId] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem("gameHub_playerName") || "",
  );
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const [pendingEvent, setPendingEvent] = useState(null);
  const [forecastCards, setForecastCards] = useState(null);
  const [airliftTarget, setAirliftTarget] = useState(null);

  const [showTradeModal, setShowTradeModal] = useState(false);
  const [dispatcherTargetId, setDispatcherTargetId] = useState(null);
  const [showContingencyModal, setShowContingencyModal] = useState(false);
  const [showOpsFlightPicker, setShowOpsFlightPicker] = useState(false);
  const [opsFlightCardId, setOpsFlightCardId] = useState(null);

  // UI States
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [feedbackOverlay, setFeedbackOverlay] = useState(null);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  const triggerFeedback = (type, message, subtext = "", Icon = null) => {
    setFeedbackOverlay({ type, message, subtext, icon: Icon });
    setTimeout(() => setFeedbackOverlay(null), 2500);
  };

  const handleDisconnect = (msg) => {
    if (msg) setError(msg);
    setView("menu");
    setRoomId("");
    setGameState(null);
    setLoading(false);
    localStorage.removeItem("outbreak_room_id");
  };

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

  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const isInRoom = data.players.some((p) => p.id === user.uid);
          if (!isInRoom) {
            handleDisconnect("You were removed from the operation.");
            return;
          }
          setGameState(data);
          setView(data.status === "lobby" ? "lobby" : "game");
          setLoading(false);
        } else {
          handleDisconnect("HQ connection lost (Room Closed).");
        }
      },
    );
    return () => unsub();
  }, [roomId, user]);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "game_hub_settings", "config"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsMaintenance(!!data[GAME_ID]?.maintenance);
        }
      },
    );
    return () => unsub();
  }, []);

  const handleSplashStart = () => {
    const savedId = localStorage.getItem("outbreak_room_id");
    if (savedId) {
      setLoading(true);
      setRoomId(savedId);
      setView("menu");
    } else setView("menu");
  };

  const createRoom = async () => {
    if (!user) return setError("Uplink establishing... please wait.");
    if (!playerName) return setError("Operative Name required");
    setLoading(true);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let newId = "";
    for (let i = 0; i < 5; i++)
      newId += chars.charAt(Math.floor(Math.random() * chars.length));

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
            role: null,
            location: "atlanta",
            hand: [],
            ready: false,
          },
        ],
        logs: [{ type: "info", text: "HQ established." }],
      },
    );
    localStorage.setItem("outbreak_room_id", newId);
    setRoomId(newId);
    setRoomInput(newId);
  };

  const joinRoom = async () => {
    if (!user) return setError("Uplink establishing... please wait.");
    if (!roomInput || !playerName) return setError("Room ID and Name required");
    setLoading(true);
    const ref = doc(
      db,
      "artifacts",
      APP_ID,
      "public",
      "data",
      "rooms",
      roomInput.toUpperCase(),
    );
    const snap = await getDoc(ref);
    if (!snap.exists()) return handleDisconnect("HQ not found.");

    const data = snap.data();
    if (data.status !== "lobby" && !data.players.find((p) => p.id === user.uid))
      return handleDisconnect("Mission already underway.");

    if (!data.players.find((p) => p.id === user.uid)) {
      if (data.players.length >= 4)
        return handleDisconnect("Squad full (Max 4).");
      await updateDoc(ref, {
        players: [
          ...data.players,
          {
            id: user.uid,
            name: playerName,
            role: null,
            location: "atlanta",
            hand: [],
            ready: false,
          },
        ],
      });
    }
    localStorage.setItem("outbreak_room_id", roomInput.toUpperCase());
    setRoomId(roomInput.toUpperCase());
  };

  const leaveRoom = async () => {
    if (!roomId || !user || !gameState) return;
    const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);
    if (gameState.hostId === user.uid) await deleteDoc(ref);
    else
      await updateDoc(ref, {
        players: gameState.players.filter((p) => p.id !== user.uid),
      });
    handleDisconnect("");
    setShowLeaveConfirm(false);
    setGameState(null);
  };

  const kickPlayer = async (targetId) => {
    if (!roomId || !gameState || gameState.hostId !== user.uid) return;
    setLoading(true);
    try {
      const targetPlayer = gameState.players.find((p) => p.id === targetId);
      const updatedPlayers = gameState.players.filter((p) => p.id !== targetId);

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: updatedPlayers,
          logs: [
            ...gameState.logs,
            {
              type: "warning",
              text: `👢 ${targetPlayer?.name} was removed from the squad by the Host.`,
            },
          ].slice(-60),
        },
      );
    } catch (err) {
      console.error("Failed to kick player:", err);
      setError("Failed to remove player.");
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    if (gameState.hostId !== user.uid) return;
    setLoading(true);

    const availableRoles = shuffle(Object.keys(ROLES));
    const players = gameState.players.map((p, i) => ({
      ...p,
      role: availableRoles[i],
      location: "atlanta",
      hand: [],
      ready: false,
    }));

    let cityDeck = shuffle([
      ...Object.keys(CITIES),
      ...Object.keys(EVENT_CARDS),
    ]);
    const cardsPerPlayer =
      players.length === 1
        ? 4
        : players.length === 2
          ? 4
          : players.length === 3
            ? 3
            : 2;
    players.forEach((p) => {
      for (let i = 0; i < cardsPerPlayer; i++) p.hand.push(cityDeck.pop());
    });

    const difficulty = 4;
    const piles = Array.from({ length: difficulty }, () => []);
    cityDeck.forEach((card, i) => piles[i % difficulty].push(card));
    piles.forEach((pile) => {
      pile.push("EPIDEMIC");
      shuffle(pile);
    });
    const finalPlayerDeck = piles.flat();

    const infectionDeck = shuffle(Object.keys(CITIES));
    const infectionDiscard = [];
    let citiesState = {};
    Object.keys(CITIES).forEach(
      (c) =>
        (citiesState[c] = {
          cubes: { blue: 0, yellow: 0, green: 0, red: 0 },
          hasStation: c === "atlanta",
        }),
    );

    [3, 2, 1].forEach((amount) => {
      for (let i = 0; i < 3; i++) {
        const c = infectionDeck.pop();
        infectionDiscard.push(c);
        citiesState[c].cubes[CITIES[c].color] = amount;
      }
    });

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        phase: "ACTIONS",
        turnData: null,
        players,
        cities: citiesState,
        playerDeck: finalPlayerDeck,
        playerDiscard: [],
        infectionDeck,
        infectionDiscard,
        turnIndex: 0,
        actionsLeft: 4,
        infectionRateIdx: 0,
        outbreaks: 0,
        quietNight: false,
        cures: { blue: false, yellow: false, green: false, red: false },
        eradicated: { blue: false, yellow: false, green: false, red: false },
        logs: [{ type: "info", text: "Operation Launched. Good luck, team." }],
      },
    );
    setLoading(false);
  };

  const returnToLobby = async () => {
    try {
      if (!roomId || !user || !gameState) return;
      if (gameState.hostId !== user.uid) return;
      setLoading(true);
      const resetPlayers = gameState.players.map((p) => ({
        ...p,
        role: null,
        location: "atlanta",
        hand: [],
        ready: false,
      }));
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          status: "lobby",
          players: resetPlayers,
          logs: [
            {
              type: "info",
              text: "Team returned to HQ. Awaiting new deployment.",
            },
          ],
        },
      );
      setShowLeaveConfirm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyInfection = (
    state,
    cityId,
    color,
    amount,
    logs,
    visited = new Set(),
  ) => {
    // NEW: Instantly abort if a previous cascade already caused a Game Over
    if (state.status === "lost") return { state, logs };

    if (state.eradicated && state.eradicated[color]) return { state, logs };

    // Quarantine Specialist Passive Block
    const qs = state.players.find((p) => p.role === "QUARANTINE_SPEC");
    if (qs) {
      if (
        qs.location === cityId ||
        CITIES[qs.location].neighbors.includes(cityId)
      ) {
        logs.push({
          type: "info",
          text: `🛡️ Quarantine Specialist blocked infection in ${CITIES[cityId].name}.`,
        });
        return { state, logs };
      }
    }

    // Medic Passive Auto-Block for Cured diseases
    const medic = state.players.find((p) => p.role === "MEDIC");
    if (medic && medic.location === cityId && state.cures[color]) {
      return { state, logs };
    }

    let currentCubes = state.cities[cityId].cubes[color] || 0;

    // NEW: Calculate how many cubes we are actually attempting to place right now
    let cubesToPlace = Math.min(amount, 3 - currentCubes);

    // NEW: Check global supply (Official Rule: Max 24 cubes per disease color)
    const totalCubesOnBoard = Object.values(state.cities).reduce(
      (sum, c) => sum + (c.cubes[color] || 0),
      0,
    );

    if (totalCubesOnBoard + cubesToPlace > 24) {
      state.status = "lost";
      logs.push({
        type: "danger",
        text: `💀 SUPPLY EXHAUSTED! The ${color.toUpperCase()} disease has overrun the globe.`,
      });
      return { state, logs };
    }

    // Handle Placement and Outbreaks
    if (currentCubes + amount > 3) {
      if (visited.has(cityId)) return { state, logs }; // Prevent infinite cascade loop
      visited.add(cityId);

      state.outbreaks += 1;
      state.cities[cityId].cubes[color] = 3;
      logs.push({
        type: "danger",
        text: `💥 OUTBREAK in ${CITIES[cityId].name}! (${state.outbreaks}/8)`,
      });

      if (state.outbreaks >= 8) {
        state.status = "lost";
        logs.push({
          type: "danger",
          text: "💀 Global panic limit reached. Humanity falls.",
        });
        return { state, logs };
      }

      // Cascade to neighbors
      CITIES[cityId].neighbors.forEach((neighbor) => {
        const res = applyInfection(state, neighbor, color, 1, logs, visited);
        state = res.state;
        logs = res.logs;
      });
    } else {
      state.cities[cityId].cubes[color] += amount;
      if (amount > 0)
        logs.push({
          type: "warning",
          text: `🦠 ${CITIES[cityId].name} infected (+${amount} ${color}).`,
        });
    }
    return { state, logs };
  };

  const advancePhase = async () => {
    if (loading) return;
    setLoading(true);
    try {
      let state = JSON.parse(JSON.stringify(gameState));
      let player = state.players[state.turnIndex];
      let logs = [];

      const doInfectionPhase = () => {
        if (state.quietNight) {
          logs.push({
            type: "success",
            text: "🌙 Quiet Night active. Infection skipped.",
          });
          state.quietNight = false;
          state.phase = "INFECT";
          state.turnData = { infectedCities: [], skipped: true };
          return;
        }

        const rate = INFECTION_RATES[state.infectionRateIdx];
        let infectedCities = [];
        for (let i = 0; i < rate; i++) {
          if (state.infectionDeck.length === 0) break;
          const cityId = state.infectionDeck.pop();
          state.infectionDiscard.push(cityId);
          const color = CITIES[cityId].color;

          const startCubes = state.cities[cityId].cubes[color] || 0;
          const startOutbreaks = state.outbreaks;

          const infRes = applyInfection(state, cityId, color, 1, logs);
          state = infRes.state;
          logs = infRes.logs;

          const endCubes = state.cities[cityId].cubes[color] || 0;
          const outbreak = state.outbreaks > startOutbreaks;

          if (endCubes > startCubes || outbreak) {
            infectedCities.push({ cityId, color, amount: 1, outbreak });
          }
          if (state.status !== "playing") break;
        }
        state.phase = "INFECT";
        state.turnData = { infectedCities, skipped: false };
      };

      if (state.phase === "DRAW") {
        const epidemics = state.turnData.drawnCards.filter(
          (c) => c === "EPIDEMIC",
        );
        const normalCards = state.turnData.drawnCards.filter(
          (c) => c !== "EPIDEMIC",
        );

        normalCards.forEach((c) => {
          player.hand.push(c);
          logs.push({
            type: "info",
            text: `${player.name} drew ${CITIES[c]?.name || EVENT_CARDS[c]?.name || c}.`,
          });
        });

        if (epidemics.length > 0) {
          let epidemicReports = [];
          for (let i = 0; i < epidemics.length; i++) {
            state.infectionRateIdx = Math.min(
              state.infectionRateIdx + 1,
              INFECTION_RATES.length - 1,
            );

            if (state.infectionDeck.length > 0) {
              let bottomCity = state.infectionDeck.shift();
              if (bottomCity) {
                let infRes = applyInfection(
                  state,
                  bottomCity,
                  CITIES[bottomCity].color,
                  3,
                  logs,
                );
                state = infRes.state;
                logs = infRes.logs;
                state.infectionDiscard.push(bottomCity);

                const shuffledDiscard = shuffle([...state.infectionDiscard]);
                state.infectionDeck = [
                  ...state.infectionDeck,
                  ...shuffledDiscard,
                ];
                state.infectionDiscard = [];
                epidemicReports.push({
                  city: bottomCity,
                  newRate: INFECTION_RATES[state.infectionRateIdx],
                });
              }
            }
          }
          state.phase = "EPIDEMIC";
          state.turnData = { epidemicReports };
        } else {
          doInfectionPhase();
        }
      } else if (state.phase === "EPIDEMIC") {
        doInfectionPhase();
      } else if (state.phase === "INFECT") {
        state.phase = "ACTIONS";
        state.turnData = null;
        state.turnIndex = (state.turnIndex + 1) % state.players.length;
        state.actionsLeft = 4;
        state.opsExpertUsed = false; // Reset ability on turn end
      }

      state.logs = [...state.logs, ...logs].slice(-60);
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        state,
      );
    } catch (err) {
      console.error("FSM Crash:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (cityId) => {
    if (loading) {
      triggerFeedback("warning", "LOCKED", "Syncing with HQ...");
      return;
    }

    if (selectedAction === "GOV_GRANT")
      return resolveEventTargeting("GOV_GRANT", cityId);
    if (selectedAction === "AIRLIFT_MOVE")
      return resolveEventTargeting("AIRLIFT_MOVE", cityId);

    const currentPhase = gameState.phase || "ACTIONS";

    // Hand limit tracking inline to block clicks
    const overLimitPlayer = gameState.players.find((p) => p.hand.length > 7);
    const isOverLimit = !!overLimitPlayer;

    if (!selectedAction || currentPhase !== "ACTIONS" || isOverLimit) {
      if (selectedAction && isOverLimit)
        triggerFeedback("warning", "LOCKED", "Discard Required");
      return;
    }

    if (gameState.players[gameState.turnIndex].id !== user.uid) {
      triggerFeedback("warning", "LOCKED", "Wait your turn");
      return;
    }

    const activePlayer = gameState.players[gameState.turnIndex];
    const targetId = dispatcherTargetId || activePlayer.id;
    const targetPlayer = gameState.players.find((p) => p.id === targetId);
    const loc = targetPlayer.location;

    const executeMove = (type) => executeAction(type, { to: cityId, targetId });

    switch (selectedAction) {
      case "DRIVE":
        if (areConnected(loc, cityId)) executeMove("DRIVE");
        else triggerFeedback("warning", "INVALID MOVE", "Cities not connected");
        break;
      case "DIRECT":
        if (activePlayer.hand.includes(cityId)) executeMove("DIRECT");
        else
          triggerFeedback("warning", "MISSING CARD", "Need destination card");
        break;
      case "CHARTER":
        if (activePlayer.hand.includes(loc)) executeMove("CHARTER");
        else
          triggerFeedback(
            "warning",
            "MISSING CARD",
            `Need ${CITIES[loc].name} card`,
          );
        break;
      case "SHUTTLE":
        if (
          gameState.cities[loc].hasStation &&
          gameState.cities[cityId].hasStation
        )
          executeMove("SHUTTLE");
        else triggerFeedback("warning", "INVALID", "Both cities need stations");
        break;
      case "OPS_FLIGHT":
        executeMove("OPS_FLIGHT");
        break;
      case "JUMP":
        const agentsInDest = gameState.players.filter(
          (p) => p.location === cityId && p.id !== targetId,
        );
        if (agentsInDest.length > 0) executeMove("JUMP");
        else
          triggerFeedback(
            "warning",
            "INVALID",
            "Must jump to an occupied city",
          );
        break;
      default:
        break;
    }
  };

  const executeEvent = async (eventId) => {
    if (eventId === "EVENT_QUIET_NIGHT") {
      let state = JSON.parse(JSON.stringify(gameState));
      let player = state.players.find((p) => p.id === user.uid);

      player.hand = player.hand.filter((c) => c !== eventId);

      // FIX: Only exile if THIS specific card was retrieved via "Plan"
      if (player.contingencyCard === eventId) {
        state.logs.push({
          type: "warning",
          text: `⚡ ${EVENT_CARDS[eventId].name} was EXILED from the game.`,
        });
        player.contingencyCard = null; // Clear the slot
      } else {
        state.playerDiscard.push(eventId);
      }

      state.quietNight = true;
      state.logs.push({
        type: "success",
        text: `⚡ ${player.name} played ONE QUIET NIGHT!`,
      });
      triggerFeedback(
        "success",
        "QUIET NIGHT",
        "Next infection phase skipped",
        Zap,
      );
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        state,
      );
    } else if (eventId === "EVENT_GOV_GRANT") {
      setPendingEvent(eventId);
      setSelectedAction("GOV_GRANT");
    } else if (eventId === "EVENT_AIRLIFT") {
      setPendingEvent(eventId);
      setSelectedAction("AIRLIFT_PLAYER");
    } else if (eventId === "EVENT_FORECAST") {
      const topCount = Math.min(6, gameState.infectionDeck.length);
      if (topCount === 0)
        return triggerFeedback("warning", "INVALID", "Infection deck empty");
      setForecastCards(gameState.infectionDeck.slice(-topCount).reverse());
      setPendingEvent(eventId);
    } else if (eventId === "EVENT_RESILIENT_POP") {
      if (gameState.infectionDiscard.length === 0)
        return triggerFeedback("warning", "INVALID", "Discard pile empty");
      setPendingEvent(eventId);
    }
  };

  const resolveEventTargeting = async (action, cityId) => {
    let state = JSON.parse(JSON.stringify(gameState));
    let player = state.players.find((p) => p.id === user.uid);

    // 1. Remove from hand
    player.hand = player.hand.filter((c) => c !== pendingEvent);

    // FIX: Swapped "eventId" to "pendingEvent" here so it doesn't crash!
    if (player.contingencyCard === pendingEvent) {
      state.logs.push({
        type: "warning",
        text: `⚡ ${EVENT_CARDS[pendingEvent].name} was EXILED from the game.`,
      });
      player.contingencyCard = null; // Clear the slot
    } else {
      state.playerDiscard.push(pendingEvent);
    }

    // 2. Execute the Event
    if (action === "GOV_GRANT") {
      state.cities[cityId].hasStation = true;
      state.logs.push({
        type: "success",
        text: `⚡ ${player.name} used GOV GRANT to build a station in ${CITIES[cityId].name}.`,
      });
    } else if (action === "AIRLIFT_MOVE") {
      const targetPlayer = state.players.find((p) => p.id === airliftTarget);
      targetPlayer.location = cityId;
      state.logs.push({
        type: "success",
        text: `⚡ ${player.name} used AIRLIFT to move ${targetPlayer.name} to ${CITIES[cityId].name}.`,
      });
    }

    // 3. Save to database
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      state,
    );

    // 4. Clear UI states
    setSelectedAction(null);
    setPendingEvent(null);
    setAirliftTarget(null);
  };

  const submitForecast = async () => {
    let state = JSON.parse(JSON.stringify(gameState));
    let player = state.players.find((p) => p.id === user.uid);

    player.hand = player.hand.filter((c) => c !== pendingEvent);

    // FIX: Only exile if THIS specific card was retrieved via "Plan"
    if (player.contingencyCard === pendingEvent) {
      state.logs.push({
        type: "warning",
        text: `⚡ ${EVENT_CARDS[pendingEvent].name} was EXILED from the game.`,
      });
      player.contingencyCard = null; // Clear the slot
    } else {
      state.playerDiscard.push(pendingEvent);
    }

    state.infectionDeck.splice(
      -forecastCards.length,
      forecastCards.length,
      ...[...forecastCards].reverse(),
    );
    state.logs.push({
      type: "success",
      text: `⚡ ${player.name} used FORECAST to scout infections.`,
    });

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      state,
    );
    setPendingEvent(null);
    setForecastCards(null);
  };

  const submitResilientPop = async (cityId) => {
    let state = JSON.parse(JSON.stringify(gameState));
    let player = state.players.find((p) => p.id === user.uid);

    player.hand = player.hand.filter((c) => c !== pendingEvent);

    // FIX: Only exile if THIS specific card was retrieved via "Plan"
    if (player.contingencyCard === pendingEvent) {
      state.logs.push({
        type: "warning",
        text: `⚡ ${EVENT_CARDS[pendingEvent].name} was EXILED from the game.`,
      });
      player.contingencyCard = null; // Clear the slot
    } else {
      state.playerDiscard.push(pendingEvent);
    }

    state.infectionDiscard = state.infectionDiscard.filter((c) => c !== cityId);
    state.logs.push({
      type: "success",
      text: `⚡ ${player.name} used RESILIENT POPULATION to secure ${CITIES[cityId].name}.`,
    });

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      state,
    );
    setPendingEvent(null);
  };

  const executeAction = async (type, payload) => {
    if (loading) return;
    setLoading(true);

    try {
      let state = JSON.parse(JSON.stringify(gameState));
      let player = state.players[state.turnIndex];
      let logs = [];

      const consumeCard = (cardId) => {
        player.hand = player.hand.filter((c) => c !== cardId);
        state.playerDiscard.push(cardId);
      };

      const targetPlayerId = payload?.targetId || player.id;
      const targetPlayer = state.players.find((p) => p.id === targetPlayerId);

      if (
        [
          "DRIVE",
          "DIRECT",
          "CHARTER",
          "SHUTTLE",
          "JUMP",
          "OPS_FLIGHT",
        ].includes(type)
      ) {
        if (type === "DIRECT") consumeCard(payload.to);
        if (type === "CHARTER") consumeCard(targetPlayer.location);

        // NEW OPS FLIGHT CONSUMPTION
        if (type === "OPS_FLIGHT") {
          consumeCard(opsFlightCardId);
          state.opsExpertUsed = true;
          setOpsFlightCardId(null);
        }

        targetPlayer.location = payload.to;

        let moveText =
          targetPlayer.id === player.id
            ? `${player.name} moved to ${CITIES[payload.to].name}.`
            : `${player.name} dispatched ${targetPlayer.name} to ${CITIES[payload.to].name}.`;

        if (type === "OPS_FLIGHT")
          moveText = `✈️ ${player.name} used Ops Flight to travel to ${CITIES[payload.to].name}.`;

        logs.push({ type: "info", text: moveText });

        if (targetPlayer.role === "MEDIC") {
          Object.keys(state.cures).forEach((color) => {
            if (
              state.cures[color] &&
              state.cities[payload.to].cubes[color] > 0
            ) {
              state.cities[payload.to].cubes[color] = 0;
              logs.push({
                type: "success",
                text: `⚕️ ${targetPlayer.name}'s Medic passive instantly cleared ${color} in ${CITIES[payload.to].name}.`,
              });
              
              // New: Check for eradication after passive clear
              const cubesLeft = Object.values(state.cities).reduce(
                (sum, c) => sum + c.cubes[color],
                0,
              );
              
              if (cubesLeft === 0 && !state.eradicated[color]) {
                state.eradicated[color] = true;
                logs.push({
                  type: "success",
                  text: `🌟 The ${color} disease is ERADICATED!`,
                });
                triggerFeedback(
                  "success",
                  "ERADICATED",
                  `${color.toUpperCase()} removed globally`,
                  Globe2,
                );
              }
            }
          });
        }
      } else if (type === "TREAT") {
        const cityData = state.cities[player.location];
        const color = payload.color;
        if (player.role === "MEDIC" || state.cures[color]) {
          cityData.cubes[color] = 0;
          logs.push({
            type: "success",
            text: `${player.name} treated ALL ${color} in ${CITIES[player.location].name}.`,
          });
        } else {
          cityData.cubes[color] -= 1;
          logs.push({
            type: "success",
            text: `${player.name} treated 1 ${color} in ${CITIES[player.location].name}.`,
          });
        }
        if (state.cures[color]) {
          const cubesLeft = Object.values(state.cities).reduce(
            (sum, c) => sum + c.cubes[color],
            0,
          );
          if (cubesLeft === 0) {
            state.eradicated[color] = true;
            logs.push({
              type: "success",
              text: `🌟 The ${color} disease is ERADICATED!`,
            });
            triggerFeedback(
              "success",
              "ERADICATED",
              `${color.toUpperCase()} removed globally`,
              Globe2,
            );
          }
        }
      } else if (type === "TRADE") {
        const targetPlayer = state.players.find(
          (p) => p.id === payload.targetId,
        );

        if (payload.tradeType === "give") {
          player.hand = player.hand.filter((c) => c !== payload.cardId);
          targetPlayer.hand.push(payload.cardId);
          logs.push({
            type: "info",
            text: `${player.name} gave ${CITIES[payload.cardId].name} to ${targetPlayer.name}.`,
          });
        } else {
          targetPlayer.hand = targetPlayer.hand.filter(
            (c) => c !== payload.cardId,
          );
          player.hand.push(payload.cardId);
          logs.push({
            type: "info",
            text: `${player.name} took ${CITIES[payload.cardId].name} from ${targetPlayer.name}.`,
          });
        }
        setShowTradeModal(false);
      } else if (type === "BUILD") {
        if (player.role !== "OPS_EXPERT") consumeCard(player.location);
        state.cities[player.location].hasStation = true;
        logs.push({
          type: "info",
          text: `${player.name} built a station in ${CITIES[player.location].name}.`,
        });
      } else if (type === "CONTINGENCY") {
        state.playerDiscard = state.playerDiscard.filter(
          (c) => c !== payload.cardId,
        );
        player.hand.push(payload.cardId);
        player.contingencyCard = payload.cardId; // NEW: Track the specific retrieved card
        logs.push({
          type: "success",
          text: `📋 ${player.name} retrieved ${EVENT_CARDS[payload.cardId].name} from the discard pile.`,
        });
        setShowContingencyModal(false);
      } else if (type === "CURE") {
        payload.cards.forEach(consumeCard);
        state.cures[payload.color] = true;
        logs.push({
          type: "success",
          text: `🧪 ${player.name} DISCOVERED ${payload.color.toUpperCase()} CURE!`,
        });
        triggerFeedback(
          "success",
          "CURE FOUND",
          `${payload.color.toUpperCase()} disease cured!`,
          Syringe,
        );

        if (Object.values(state.cures).every((v) => v === true)) {
          state.status = "won";
          logs.push({
            type: "success",
            text: "🌍 Humanity is saved! YOU WIN!",
          });
        } else {
          const medic = state.players.find((p) => p.role === "MEDIC");
          if (medic && state.cities[medic.location].cubes[payload.color] > 0) {
            state.cities[medic.location].cubes[payload.color] = 0;
            logs.push({
              type: "success",
              text: `⚕️ Medic's presence automatically cleared ${payload.color} upon discovery.`,
            });
          }
        }
      }

      state.actionsLeft -= 1;

      if (state.actionsLeft <= 0 && state.status === "playing") {
        const drawnCards = [];
        for (let i = 0; i < 2; i++) {
          if (state.playerDeck.length === 0) {
            state.status = "lost";
            logs.push({
              type: "danger",
              text: "💀 Time ran out. The Player Deck is empty.",
            });
            break;
          }
          drawnCards.push(state.playerDeck.pop());
        }
        if (state.status !== "lost") {
          state.phase = "DRAW";
          state.turnData = { drawnCards };
        }
      }

      state.logs = [...state.logs, ...logs].slice(-60);
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        state,
      );
      setSelectedAction(null);
      setDispatcherTargetId(null);
      setActiveMenu(null);
    } catch (err) {
      console.error(err);
      triggerFeedback("failure", "ERROR", "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = async (cardId) => {
    if (loading) return;
    setLoading(true);
    try {
      let state = JSON.parse(JSON.stringify(gameState));
      let player = state.players.find((p) => p.id === user.uid);

      player.hand = player.hand.filter((c) => c !== cardId);

      // FIX: Only exile if THIS specific card was retrieved via "Plan"
      const isEvent = cardId.startsWith("EVENT_");
      if (isEvent && player.contingencyCard === cardId) {
        state.logs.push({
          type: "warning",
          text: `⚡ ${EVENT_CARDS[cardId].name} was EXILED from the game.`,
        });
        player.contingencyCard = null; // Clear the slot
      } else {
        state.playerDiscard.push(cardId);
      }

      const cardName =
        CITIES[cardId]?.name || EVENT_CARDS[cardId]?.name || cardId;
      state.logs.push({
        type: "warning",
        text: `🗑️ ${player.name} discarded ${cardName} (Hand limit).`,
      });

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        state,
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCureAttempt = (color) => {
    const activePlayer = gameState.players[gameState.turnIndex];
    const cardsOfColor = activePlayer.hand.filter(
      (c) => CITIES[c] && CITIES[c].color === color,
    );
    const required = activePlayer.role === "SCIENTIST" ? 4 : 5;

    if (
      cardsOfColor.length >= required &&
      gameState.cities[activePlayer.location].hasStation
    ) {
      executeAction("CURE", { color, cards: cardsOfColor.slice(0, required) });
    } else {
      triggerFeedback(
        "warning",
        "CANNOT CURE",
        `Need ${required} ${color} cards & a Station`,
        AlertTriangle,
      );
    }
  };

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <GameLogoBig />
        <div className="bg-amber-500/10 p-8 rounded-2xl border border-amber-500/30 text-center">
          <AlertTriangle
            size={64}
            className="text-amber-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-bold mb-2">
            Quarantine Protocol Active
          </h1>
          <p className="text-slate-400">
            HQ is undergoing maintenance. Stand by for deployment.
          </p>
        </div>
        <a
          href="/"
          className="mt-8 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <StepBack /> Back to Gamehub
        </a>
        <GameLogo />
      </div>
    );
  }

  if (view === "splash") return <SplashScreen onStart={handleSplashStart} />;

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative font-sans">
        <CyanAtmosphere />
        <nav className="absolute top-0 left-0 w-full p-4 z-50">
          <a
            href="/"
            className="flex items-center gap-2 text-cyan-700 hover:text-cyan-400 font-bold transition-colors w-fit"
          >
            <StepBack /> Back to Gamehub
          </a>
        </nav>

        <div className="z-10 mb-8"></div>
        <div className="z-10 text-center mb-10">
          <Globe2
            size={64}
            className="text-cyan-400 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-linear-to-b from-cyan-400 to-emerald-600 tracking-widest drop-shadow-md">
            OUTBREAK
          </h1>
          <p className="text-white-400/60 tracking-[0.3em] uppercase mt-2">
            RESCUE THE WORLD
          </p>
        </div>
        <div className="bg-slate-900/80 backdrop-blur border border-cyan-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 animate-in slide-in-from-bottom-10">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm border border-red-800">
              {error}
            </div>
          )}
          <input
            className="w-full bg-black/50 border border-slate-700 p-3 rounded mb-4 text-white focus:border-cyan-500 outline-none transition-colors"
            placeholder="Operative Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-cyan-700 hover:bg-cyan-600 p-4 rounded font-bold mb-4 flex items-center justify-center gap-2 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all"
          >
            <Globe2 size={20} /> Form New Squad
          </button>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              className="w-full sm:flex-1 bg-black/50 border border-slate-700 p-3 rounded text-white uppercase font-mono tracking-wider focus:border-cyan-500 outline-none"
              placeholder="ROOM CODE"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-600 px-6 py-3 rounded font-bold transition-colors"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative">
        <CyanAtmosphere />
        <GameLogoBig />
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onCancel={() => setShowLeaveConfirm(false)}
            onConfirmLeave={leaveRoom}
            onConfirmLobby={returnToLobby}
            isHost={isHost}
            inGame={false}
          />
        )}

        <div className="z-10 w-full max-w-lg bg-slate-900/90 backdrop-blur p-8 rounded-2xl border border-cyan-900/50 shadow-2xl mb-4">
          <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
            <div>
              <h2 className="text-lg text-cyan-500 font-bold uppercase">
                Operations Briefing
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <div className="text-3xl font-mono text-white font-black">
                  {roomId}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(roomId)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                  title="Copy"
                >
                  <Copy size={16} />
                </button>
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
            <h3 className="text-slate-500 text-xs uppercase tracking-wider mb-4">
              Squad ({gameState.players.length}/4)
            </h3>
            <div className="space-y-2">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-slate-800/50 p-3 rounded border border-slate-700/50 group"
                >
                  <span
                    className={`font-bold flex items-center gap-2 ${p.id === user.uid ? "text-cyan-400" : "text-slate-300"}`}
                  >
                    <User size={14} /> {p.name}{" "}
                    {p.id === gameState.hostId && (
                      <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-white ml-2">
                        Host
                      </span>
                    )}
                  </span>

                  {/* NEW: Host Kick Button (Always Visible) */}
                  {isHost && p.id !== user.uid && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      disabled={loading}
                      title={`Remove ${p.name}`}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-900/30 rounded transition-colors bg-black/20 border border-slate-700/50"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={startGame}
              disabled={gameState.players.length < 1 || loading}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${gameState.players.length >= 1 ? "bg-cyan-700 hover:bg-cyan-600 text-white" : "bg-slate-800 text-slate-500 cursor-not-allowed"}`}
            >
              Deploy Operation
            </button>
          ) : (
            <div className="text-center text-cyan-400/60 animate-pulse uppercase tracking-widest text-sm">
              Awaiting Deployment...
            </div>
          )}
        </div>
        <GameLogo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const activePlayer = gameState.players[gameState.turnIndex];
    const isMyTurn = activePlayer.id === user.uid;
    const me = gameState.players.find((p) => p.id === user.uid);
    const myLoc = gameState.cities[me.location];
    const isHost = gameState.hostId === user.uid;
    const currentPhase = gameState.phase || "ACTIONS";

    const overLimitPlayer = gameState.players.find((p) => p.hand.length > 7);
    const isOverLimit = !!overLimitPlayer;
    const amIOverLimit = overLimitPlayer?.id === user.uid;

    return (
      <div className="h-screen w-full bg-slate-950 text-slate-200 flex flex-col overflow-hidden font-sans select-none relative">
        <CyanAtmosphere />
        {feedbackOverlay && <FeedbackOverlay {...feedbackOverlay} />}
        {forecastCards && pendingEvent === "EVENT_FORECAST" && (
          <ForecastModal
            cards={forecastCards}
            CITIES={CITIES}
            COLORS={COLORS}
            onReorder={(idx, dir) => {
              let newCards = [...forecastCards];
              [newCards[idx], newCards[idx + dir]] = [
                newCards[idx + dir],
                newCards[idx],
              ];
              setForecastCards(newCards);
            }}
            onSubmit={submitForecast}
            onCancel={() => {
              setForecastCards(null);
              setPendingEvent(null);
            }}
          />
        )}
        {pendingEvent === "EVENT_RESILIENT_POP" && (
          <ResilientPopModal
            discardPile={gameState.infectionDiscard}
            CITIES={CITIES}
            COLORS={COLORS}
            onSelect={submitResilientPop}
            onCancel={() => setPendingEvent(null)}
          />
        )}
        {selectedAction === "AIRLIFT_PLAYER" && (
          <AirliftPlayerModal
            players={gameState.players}
            onSelect={(id) => {
              setAirliftTarget(id);
              setSelectedAction("AIRLIFT_MOVE");
            }}
            onCancel={() => {
              setSelectedAction(null);
              setPendingEvent(null);
            }}
          />
        )}
        {showLeaveConfirm && (
          <LeaveConfirmModal
            onCancel={() => setShowLeaveConfirm(false)}
            onConfirmLeave={leaveRoom}
            onConfirmLobby={returnToLobby}
            isHost={isHost}
            inGame={true}
          />
        )}
        {showTeamPanel && (
          <TeamPanelModal
            gameState={gameState}
            ROLES={ROLES}
            CITIES={CITIES}
            COLORS={COLORS}
            user={user}
            onClose={() => setShowTeamPanel(false)}
          />
        )}
        {currentPhase !== "ACTIONS" && (
          <PhaseReportModal
            gameState={gameState}
            user={user}
            CITIES={CITIES}
            COLORS={COLORS}
            onProceed={advancePhase}
          />
        )}
        {isOverLimit && !amIOverLimit && !pendingEvent && (
          <div className="fixed inset-0 bg-slate-950/80 z-[140] flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border-2 border-amber-500 p-6 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col text-center">
              <Loader
                size={32}
                className="text-amber-500 animate-spin mx-auto mb-4"
              />
              <h2 className="text-xl font-bold text-white uppercase tracking-widest mb-2">
                Awaiting Teammate
              </h2>
              <p className="text-slate-400 text-sm">
                <strong className="text-amber-400">
                  {overLimitPlayer.name}
                </strong>{" "}
                has exceeded their hand limit and must discard down to 7 cards.
              </p>
            </div>
          </div>
        )}
        {amIOverLimit && !pendingEvent && (
          <DiscardModal
            player={me}
            CITIES={CITIES}
            EVENT_CARDS={EVENT_CARDS}
            onDiscard={handleDiscard}
            onPlayEvent={executeEvent}
          />
        )}
        {showHowToPlay && (
          <HowToPlayModal
            ROLES={ROLES}
            onClose={() => setShowHowToPlay(false)}
          />
        )}
        {showTradeModal && (
          <TradeModal
            gameState={gameState}
            user={user}
            CITIES={CITIES}
            COLORS={COLORS}
            ROLES={ROLES}
            onTrade={(tradeType, targetId, cardId) =>
              executeAction("TRADE", { tradeType, targetId, cardId })
            }
            onClose={() => setShowTradeModal(false)}
          />
        )}
        {showContingencyModal && (
          <ContingencyModal
            discardPile={gameState.playerDiscard}
            EVENT_CARDS={EVENT_CARDS}
            onSelect={(cardId) => executeAction("CONTINGENCY", { cardId })}
            onClose={() => setShowContingencyModal(false)}
          />
        )}

        {showOpsFlightPicker && (
          <OpsFlightModal
            hand={me.hand}
            CITIES={CITIES}
            onSelect={(cardId) => {
              setOpsFlightCardId(cardId);
              setSelectedAction("OPS_FLIGHT");
              setShowOpsFlightPicker(false);
            }}
            onClose={() => setShowOpsFlightPicker(false)}
          />
        )}

        {/* Header - Compact for Mobile */}
        <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 md:px-6 shrink-0 z-[260] shadow-md">
          <div className="flex items-center gap-2 md:gap-3">
            <Globe2 className="text-cyan-500 w-5 h-5 md:w-6 md:h-6 animate-pulse" />
            <span className="font-bold tracking-widest text-cyan-400 hidden sm:block text-lg">
              OUTBREAK
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-8">
            <div
              className="flex flex-col items-center"
              title={`Outbreaks: ${gameState.outbreaks}/8`}
            >
              <span className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold">
                Outbreaks
              </span>
              <div className="flex gap-0.5 mt-0.5">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full ${i < gameState.outbreaks ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-slate-700"}`}
                  ></div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold">
                Infection
              </span>
              <span className="font-mono text-xs md:text-base text-emerald-400 font-bold leading-none mt-0.5">
                {INFECTION_RATES[gameState.infectionRateIdx]}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold">
                Cures
              </span>
              <div className="flex gap-1 mt-0.5">
                {Object.keys(gameState.cures).map((c) => (
                  <div
                    key={c}
                    className={`relative flex items-center justify-center w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-sm border ${
                      gameState.cures[c]
                        ? COLORS[c].bg
                        : "bg-transparent opacity-30"
                    } ${COLORS[c].border}`}
                  >
                    {/* NEW: Cross sign overlay if the disease is completely eradicated */}
                    {gameState.eradicated[c] && (
                      <X
                        className="absolute w-2.5 h-2.5 md:w-3 md:h-3 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]"
                        strokeWidth={4}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHowToPlay(true)}
              className="p-1.5 md:p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="How to Play"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setShowTeamPanel(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs md:text-sm font-bold text-slate-300 transition-colors shadow-sm"
            >
              <User size={16} />{" "}
              <span className="hidden md:inline">Team & Logs</span>
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-1.5 md:p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Full Bleed Map Area */}
        <div className="flex-1 relative w-full flex flex-col p-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 pointer-events-none"></div>

          {isMyTurn && selectedAction && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-cyan-900/95 text-cyan-100 pl-5 pr-2 py-2 rounded-full text-xs md:text-sm font-bold shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-cyan-500 animate-pulse backdrop-blur-md z-40 flex items-center gap-4 w-[90%] md:w-auto max-w-sm justify-between">
              <span className="truncate">
                Tap destination for: {selectedAction.replace("MOVE_", "")}
              </span>
              <button
                className="bg-slate-800 px-3 py-1.5 rounded-full text-xs hover:bg-slate-700 shrink-0"
                onClick={() => {
                  setSelectedAction(null);
                  setActiveMenu(null);
                  setPendingEvent(null);
                  setAirliftTarget(null);
                  setDispatcherTargetId(null);
                  setOpsFlightCardId(null);
                }}
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex-1 w-full h-full overflow-auto relative z-10 custom-scrollbar overscroll-contain touch-pan-x touch-pan-y">
            <div className="min-w-[1000px] xl:min-w-full min-h-[700px] xl:min-h-full h-full relative mx-auto">
              <div className="absolute inset-[4%] md:inset-[5%] z-10">
                {(() => {
                  const connections = [];
                  const wrapLabels = [];
                  const drawn = new Set();

                  Object.keys(CITIES).forEach((c1) => {
                    CITIES[c1].neighbors.forEach((c2) => {
                      const pair = [c1, c2].sort().join("-");
                      if (!drawn.has(pair)) {
                        drawn.add(pair);

                        const city1 = CITIES[c1];
                        const city2 = CITIES[c2];
                        const distanceX = Math.abs(city1.x - city2.x);

                        // NEW: Intercept wrap-around connections and draw labeled stubs
                        if (distanceX > 50) {
                          const westCity = city1.x < city2.x ? city1 : city2;
                          const eastCity = city1.x > city2.x ? city1 : city2;

                          // Calculate a slight Y offset so multiple wrap lines don't overlap (e.g. SF to Tokyo & SF to Manila)
                          const dY = eastCity.y - westCity.y;
                          const yOffset = dY * 0.15;

                          // --- WEST STUB (Points Left) ---
                          const wTargetX = westCity.x - 3;
                          const wTargetY = westCity.y + yOffset;

                          connections.push(
                            <line
                              key={`line-w-${pair}`}
                              x1={`${westCity.x}%`}
                              y1={`${westCity.y}%`}
                              x2={`${wTargetX}%`}
                              y2={`${wTargetY}%`}
                              stroke="rgba(255, 255, 255, 0.4)"
                              strokeWidth="3"
                              strokeDasharray="4 4"
                            />,
                          );
                          wrapLabels.push(
                            <div
                              key={`label-w-${pair}`}
                              className="absolute transform -translate-y-1/2 flex items-center justify-end z-0 pointer-events-none"
                              style={{
                                left: `calc(${wTargetX}% - 4px)`,
                                top: `${wTargetY}%`,
                                transform: "translate(-100%, -50%)",
                              }}
                            >
                              <div className="bg-slate-900/80 text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-slate-700/50 backdrop-blur-sm shadow-sm whitespace-nowrap">
                                {eastCity.name}
                              </div>
                            </div>,
                          );

                          // --- EAST STUB (Points Right) ---
                          const eTargetX = eastCity.x + 3;
                          const eTargetY = eastCity.y - yOffset; // Symmetric vertical shift pointing back

                          connections.push(
                            <line
                              key={`line-e-${pair}`}
                              x1={`${eastCity.x}%`}
                              y1={`${eastCity.y}%`}
                              x2={`${eTargetX}%`}
                              y2={`${eTargetY}%`}
                              stroke="rgba(255, 255, 255, 0.4)"
                              strokeWidth="3"
                              strokeDasharray="4 4"
                            />,
                          );
                          wrapLabels.push(
                            <div
                              key={`label-e-${pair}`}
                              className="absolute transform -translate-y-1/2 flex items-center justify-start z-0 pointer-events-none"
                              style={{
                                left: `calc(${eTargetX}% + 4px)`,
                                top: `${eTargetY}%`,
                              }}
                            >
                              <div className="bg-slate-900/80 text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-slate-700/50 backdrop-blur-sm shadow-sm whitespace-nowrap">
                                {westCity.name}
                              </div>
                            </div>,
                          );
                          return;
                        }

                        // Normal Connection Line
                        connections.push(
                          <line
                            key={pair}
                            x1={`${city1.x}%`}
                            y1={`${city1.y}%`}
                            x2={`${city2.x}%`}
                            y2={`${city2.y}%`}
                            stroke="rgba(255, 255, 255, 0.15)"
                            strokeWidth="3"
                            strokeDasharray="6 6"
                          />,
                        );
                      }
                    });
                  });

                  return (
                    <>
                      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
                        {connections}
                      </svg>
                      {wrapLabels}

                      {Object.keys(CITIES).map((cityId) => {
                        const city = CITIES[cityId];
                        const cityState = gameState.cities[cityId];

                        // Safety fallback in case old db state doesn't match new cities
                        if (!cityState) return null;

                        const playersHere = gameState.players.filter(
                          (p) => p.location === cityId,
                        );
                        const colStyle = COLORS[city.color];
                        // Checks if ANY single color has 3 cubes
                        const isAtRisk = Object.values(cityState.cubes).some(
                          (count) => count >= 3,
                        );
                        const isSelected =
                          selectedAction && selectedAction !== null;

                        return (
                          <div
                            key={cityId}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-10 hover:z-50 ${isSelected ? "animate-pulse" : ""}`}
                            style={{ left: `${city.x}%`, top: `${city.y}%` }}
                          >
                            <div
                              className="p-1.5 md:p-2 cursor-pointer group flex flex-col items-center justify-center relative"
                              onClick={() => handleNodeClick(cityId)}
                            >
                              {isAtRisk && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full animate-ping opacity-30 w-12 h-12 md:w-16 md:h-16 pointer-events-none"></div>
                              )}

                              {/* Main Visual Node (This now drives 100% of the centering) */}
                              {/* FIX: Same update for the Map Tab */}
                              <div
                                className={`relative w-8 h-8 md:w-12 md:h-12 rounded-full border-4 shadow-xl flex items-center justify-center bg-slate-950 animate-pulse ${colStyle.border}`}
                              >
                                {cityState.hasStation && (
                                  <Home className="text-white w-4 h-4 md:w-5 md:h-5 absolute -top-5 md:-top-7 drop-shadow-md" />
                                )}
                                <div className="flex flex-wrap gap-[2px] w-6 h-6 md:w-8 md:h-8 justify-center content-center items-center">
                                  {Object.keys(cityState.cubes).map((color) => {
                                    return Array.from({
                                      length: cityState.cubes[color],
                                    }).map((_, i) => (
                                      <div
                                        key={`${color}-${i}`}
                                        className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-[1px] ${COLORS[color].bg} shadow-sm`}
                                      ></div>
                                    ));
                                  })}
                                </div>
                              </div>

                              {/* FIX: Moved text & players into an absolutely positioned container hanging below the circle */}
                              <div className="absolute top-full flex flex-col items-center pointer-events-none z-20">
                                <div className="mt-1 px-2 py-1 bg-black/90 rounded text-[9px] md:text-[11px] font-bold text-white uppercase tracking-wider backdrop-blur-sm border border-slate-700 whitespace-nowrap drop-shadow-lg">
                                  {city.name}
                                </div>

                                {playersHere.length > 0 && (
                                  <div className="mt-1 flex gap-1">
                                    {playersHere.map((p, i) => {
                                      const roleDef = ROLES[p.role];
                                      const bgClass = roleDef
                                        ? roleDef.bgColor
                                        : "bg-white";
                                      return (
                                        <div
                                          key={p.id}
                                          className="relative flex items-center justify-center"
                                          style={{
                                            marginLeft: i > 0 ? "-8px" : "0",
                                          }}
                                        >
                                          <div
                                            className={`absolute inset-0 rounded-full animate-ping opacity-75 ${bgClass}`}
                                          ></div>
                                          <div
                                            className={`relative w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-black shadow-lg ${bgClass}`}
                                          ></div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Touch-Friendly Action Dashboard (Bottom) */}
        <div className="bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-3 md:p-5 z-40 shrink-0 shadow-[0_-15px_40px_rgba(0,0,0,0.6)] w-full">
          <div className="max-w-6xl mx-auto flex flex-col gap-3">
            <div className="flex justify-between items-center w-full mb-2">
              <div className="text-xs md:text-sm font-bold uppercase tracking-widest">
                {isMyTurn ? (
                  <span className="text-cyan-400 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />{" "}
                    YOUR TURN ({gameState.actionsLeft} Actions)
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Waiting for {activePlayer.name}...
                  </span>
                )}
              </div>
              {me && (
                <div className="flex items-center gap-1.5 md:gap-3 bg-black/50 px-3 py-1.5 rounded-full border border-slate-800 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border-2 border-black shadow-sm ${ROLES[me.role]?.bgColor || "bg-white"}`}
                    />
                    <span className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-wider hidden sm:inline">
                      {me.name}
                    </span>
                  </div>
                  <span className="text-slate-700 hidden sm:inline">|</span>
                  <div className="flex items-center gap-1">
                    <MapPin size={12} className="text-cyan-500" />
                    <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-wider">
                      {CITIES[me.location]?.name}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 custom-scrollbar">
                {me?.hand.map((card, i) => (
                  <CardDisplay
                    key={i}
                    type={card}
                    isEpidemic={card === "EPIDEMIC"}
                    mini={true}
                    onClick={() => {
                      if (card.startsWith("EVENT_")) {
                        executeEvent(card);
                      }
                    }}
                  />
                ))}
                {me?.hand.length === 0 && (
                  <div className="text-slate-600 text-xs italic px-6 py-4 border border-dashed border-slate-700 rounded h-14 flex items-center">
                    Hand Empty
                  </div>
                )}
              </div>

              <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto md:justify-end">
                {!activeMenu ? (
                  <>
                    <button
                      disabled={
                        !isMyTurn ||
                        selectedAction !== null ||
                        currentPhase !== "ACTIONS" ||
                        isOverLimit
                      }
                      onClick={() => {
                        setDispatcherTargetId(user.uid);
                        setActiveMenu("MOVE");
                      }}
                      className="flex-1 md:flex-none px-4 py-3.5 bg-slate-800 disabled:opacity-50 disabled:active:scale-100 rounded-xl font-bold text-xs md:text-sm uppercase text-white shadow-lg active:scale-95 transition-transform border border-slate-600"
                    >
                      {!isMyTurn
                        ? "Wait Turn"
                        : currentPhase !== "ACTIONS"
                          ? "Phase Locked"
                          : isOverLimit
                            ? "Discard Limit"
                            : "Move"}
                    </button>
                    {me.role === "DISPATCHER" && (
                      <button
                        disabled={
                          !isMyTurn ||
                          selectedAction !== null ||
                          currentPhase !== "ACTIONS" ||
                          isOverLimit
                        }
                        onClick={() => setActiveMenu("DISPATCH")}
                        className="flex-1 md:flex-none px-4 py-3.5 bg-fuchsia-800 disabled:opacity-50 disabled:active:scale-100 disabled:bg-slate-800 rounded-xl font-bold text-xs md:text-sm uppercase text-white shadow-lg active:scale-95 transition-transform border border-fuchsia-600"
                      >
                        Dispatch
                      </button>
                    )}
                    <button
                      disabled={
                        !isMyTurn ||
                        selectedAction !== null ||
                        currentPhase !== "ACTIONS" ||
                        isOverLimit ||
                        Object.values(myLoc?.cubes || {}).reduce(
                          (a, b) => a + b,
                          0,
                        ) === 0
                      }
                      onClick={() => setActiveMenu("TREAT")}
                      className="flex-1 md:flex-none px-4 py-3.5 bg-amber-700 disabled:opacity-50 disabled:active:scale-100 disabled:bg-slate-800 rounded-xl font-bold text-xs md:text-sm uppercase text-white shadow-lg active:scale-95 transition-transform border border-amber-600"
                    >
                      Treat
                    </button>
                    <button
                      disabled={
                        !isMyTurn ||
                        selectedAction !== null ||
                        currentPhase !== "ACTIONS" ||
                        isOverLimit ||
                        myLoc?.hasStation ||
                        (me.role !== "OPS_EXPERT" &&
                          !me.hand.includes(me.location))
                      }
                      onClick={() => executeAction("BUILD")}
                      className="flex-1 md:flex-none px-4 py-3.5 bg-blue-700 disabled:opacity-50 disabled:active:scale-100 disabled:bg-slate-800 rounded-xl font-bold text-xs md:text-sm uppercase text-white shadow-lg active:scale-95 transition-transform border border-blue-600"
                    >
                      Build
                    </button>
                    <button
                      disabled={
                        !isMyTurn ||
                        selectedAction !== null ||
                        currentPhase !== "ACTIONS" ||
                        isOverLimit ||
                        !myLoc?.hasStation
                      }
                      onClick={() => setActiveMenu("CURE")}
                      className="flex-1 md:flex-none px-4 py-3.5 bg-fuchsia-700 disabled:opacity-50 disabled:active:scale-100 disabled:bg-slate-800 rounded-xl font-bold text-xs md:text-sm uppercase text-white shadow-lg active:scale-95 transition-transform border border-fuchsia-600"
                    >
                      Cure
                    </button>
                    <button
                      disabled={
                        !isMyTurn ||
                        selectedAction !== null ||
                        currentPhase !== "ACTIONS" ||
                        isOverLimit ||
                        gameState.players.filter(
                          (p) =>
                            p.location === me.location && p.id !== user.uid,
                        ).length === 0
                      }
                      onClick={() => setShowTradeModal(true)}
                      className="flex-1 md:flex-none px-4 py-3.5 bg-emerald-700 disabled:opacity-50 disabled:active:scale-100 disabled:bg-slate-800 rounded-xl font-bold text-xs md:text-sm uppercase text-white shadow-lg active:scale-95 transition-transform border border-emerald-600"
                    >
                      Share
                    </button>
                    {me.role === "CONTINGENCY_PLAN" && (
                      <button
                        disabled={
                          !isMyTurn ||
                          selectedAction !== null ||
                          currentPhase !== "ACTIONS" ||
                          isOverLimit ||
                          gameState.playerDiscard.filter((c) =>
                            c.startsWith("EVENT_"),
                          ).length === 0 ||
                          !!me.contingencyCard
                        }
                        onClick={() => setShowContingencyModal(true)}
                        className="flex-1 md:flex-none px-4 py-3.5 bg-cyan-800 disabled:opacity-50 disabled:active:scale-100 disabled:bg-slate-800 rounded-xl font-bold text-xs md:text-sm uppercase text-cyan-100 shadow-lg active:scale-95 transition-transform border border-cyan-600"
                      >
                        Plan
                      </button>
                    )}
                  </>
                ) : activeMenu === "DISPATCH" ? (
                  <>
                    <button
                      onClick={() => setActiveMenu(null)}
                      className="px-4 py-3.5 bg-slate-700 rounded-xl active:scale-95 transition-transform border border-slate-600"
                    >
                      <StepBack size={18} />
                    </button>
                    {gameState.players
                      .filter((p) => p.id !== user.uid)
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setDispatcherTargetId(p.id);
                            setActiveMenu("MOVE");
                          }}
                          className={`flex-1 md:flex-none px-3 py-3.5 rounded-xl font-bold text-[10px] md:text-xs uppercase text-white active:scale-95 transition-transform border ${ROLES[p.role]?.bgColor || "bg-slate-700"} shadow-lg border-white/20`}
                        >
                          Move {p.name}
                        </button>
                      ))}
                  </>
                ) : activeMenu === "MOVE" ? (
                  <>
                    <button
                      onClick={() => setActiveMenu(null)}
                      className="px-4 py-3.5 bg-slate-700 rounded-xl active:scale-95 transition-transform border border-slate-600"
                    >
                      <StepBack size={18} />
                    </button>
                    <button
                      onClick={() => setSelectedAction("DRIVE")}
                      className="flex-1 md:flex-none px-3 py-3.5 bg-cyan-900 rounded-xl font-bold text-[10px] md:text-xs uppercase text-cyan-100 active:scale-95 transition-transform border border-cyan-700"
                    >
                      Drive/Ferry
                    </button>
                    <button
                      onClick={() => setSelectedAction("DIRECT")}
                      className="flex-1 md:flex-none px-3 py-3.5 bg-cyan-900 rounded-xl font-bold text-[10px] md:text-xs uppercase text-cyan-100 active:scale-95 transition-transform border border-cyan-700"
                    >
                      Direct Flight
                    </button>
                    <button
                      onClick={() => setSelectedAction("CHARTER")}
                      className="flex-1 md:flex-none px-3 py-3.5 bg-cyan-900 rounded-xl font-bold text-[10px] md:text-xs uppercase text-cyan-100 active:scale-95 transition-transform border border-cyan-700"
                    >
                      Charter
                    </button>
                    <button
                      onClick={() => setSelectedAction("SHUTTLE")}
                      className="flex-1 md:flex-none px-3 py-3.5 bg-cyan-900 rounded-xl font-bold text-[10px] md:text-xs uppercase text-cyan-100 active:scale-95 transition-transform border border-cyan-700"
                    >
                      Shuttle
                    </button>

                    {/* NEW OPS EXPERT ABILITY */}
                    {me.role === "OPS_EXPERT" && (
                      <button
                        onClick={() => setShowOpsFlightPicker(true)}
                        disabled={
                          !myLoc?.hasStation ||
                          gameState.opsExpertUsed ||
                          me.hand.filter(
                            (c) => !c.startsWith("EVENT_") && c !== "EPIDEMIC",
                          ).length === 0
                        }
                        className="flex-1 md:flex-none px-3 py-3.5 bg-green-900 rounded-xl font-bold text-[10px] md:text-xs uppercase text-green-100 active:scale-95 transition-transform border border-green-700 disabled:opacity-50 disabled:bg-slate-800"
                      >
                        Ops Flight
                      </button>
                    )}
                    {me.role === "DISPATCHER" && (
                      <button
                        onClick={() => setSelectedAction("JUMP")}
                        className="flex-1 md:flex-none px-3 py-3.5 bg-fuchsia-900 rounded-xl font-bold text-[10px] md:text-xs uppercase text-fuchsia-100 active:scale-95 transition-transform border border-fuchsia-700"
                      >
                        Jump to Agent
                      </button>
                    )}
                  </>
                ) : activeMenu === "TREAT" ? (
                  <>
                    <button
                      onClick={() => setActiveMenu(null)}
                      className="px-4 py-3.5 bg-slate-700 rounded-xl active:scale-95 transition-transform border border-slate-600"
                    >
                      <StepBack size={18} />
                    </button>
                    {Object.keys(myLoc?.cubes || {})
                      .filter((c) => myLoc.cubes[c] > 0)
                      .map((c) => (
                        <button
                          key={c}
                          onClick={() => executeAction("TREAT", { color: c })}
                          className={`flex-1 md:flex-none px-4 py-3.5 rounded-xl font-bold text-xs uppercase ${COLORS[c].bg} text-white shadow-lg active:scale-95 transition-transform border border-white/20`}
                        >
                          Treat {c}
                        </button>
                      ))}
                  </>
                ) : activeMenu === "CURE" ? (
                  <>
                    <button
                      onClick={() => setActiveMenu(null)}
                      className="px-4 py-3.5 bg-slate-700 rounded-xl active:scale-95 transition-transform border border-slate-600"
                    >
                      <StepBack size={18} />
                    </button>
                    {Object.keys(COLORS).map((c) => (
                      <button
                        key={c}
                        disabled={gameState.cures[c]}
                        onClick={() => handleCureAttempt(c)}
                        className={`flex-1 md:flex-none px-3 py-3.5 rounded-xl font-bold text-xs uppercase ${COLORS[c].bg} text-white disabled:opacity-20 shadow-lg active:scale-95 transition-transform border border-white/20`}
                      >
                        {c} Cure
                      </button>
                    ))}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Game Over Screen */}
        {(gameState.status === "won" || gameState.status === "lost") && (
          <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in">
            {gameState.status === "won" ? (
              <Globe2
                size={80}
                className="text-emerald-500 mb-6 animate-bounce"
              />
            ) : (
              <Skull size={80} className="text-red-500 mb-6 animate-pulse" />
            )}
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-widest uppercase">
              {gameState.status === "won" ? "Humanity Saved" : "World Collapse"}
            </h1>
            <p className="text-xl text-slate-400 mb-8 max-w-lg">
              {gameState.status === "won"
                ? "The team successfully engineered all 4 cures before the outbreak overwhelmed the globe."
                : "The infection spread too rapidly. The team has failed."}
            </p>
            <div className="flex flex-wrap gap-4 justify-center w-full mt-8">
              {gameState.hostId === user.uid ? (
                <>
                  <button
                    onClick={startGame}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform active:scale-95"
                  >
                    Instant Restart
                  </button>
                  <button
                    onClick={returnToLobby}
                    className="bg-blue-800 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform active:scale-95"
                  >
                    Return to Lobby
                  </button>
                </>
              ) : (
                <div className="text-cyan-400/60 animate-pulse uppercase tracking-widest text-sm self-center w-full text-center mb-4">
                  Awaiting Host Decision...
                </div>
              )}
              <button
                onClick={leaveRoom}
                className="bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-200 font-bold py-3 px-6 rounded-lg transition-colors shadow-lg"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
        <GameLogo />
      </div>
    );
  }

  return null;
}
