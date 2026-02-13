import React, { useState, useEffect, useMemo, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  updateDoc,
  increment,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
// --- ICONS ---
import {
  Users,
  Bot,
  Crown,
  Ship,
  Origami,
  Siren,
  Citrus,
  Eye,
  ArrowRight,
  Gamepad2,
  Dice5,
  Ghost,
  Layers,
  Package,
  Handshake,
  Sparkles,
  Flame,
  Clock,
  Trash2,
  Smartphone,
  Heart,
  Shuffle,
  Zap,
  Server,
  History,
  Hammer,
  ChevronLeft,
  ChevronRight,
  PieChart as PieIcon,
  Laptop,
  Cpu,
  Banana,
  Biohazard,
  Skull,
  HatGlasses,
  PawPrint,
  Dices,
  Target,
  QrCode,
  Megaphone,
  Search,
  TrendingUp,
  X,
  ArrowDownAZ,
  Star,
  ChevronDown,
  Hexagon,
  Loader,
  Play,
  RotateCcw,
} from "lucide-react";
import CoverImage from "./assets/gamehub_cover.png";

// ---------------------------------------------------------------------------
// FIREBASE CONFIGURATION
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

// ---------------------------------------------------------------------------
// TRACKING HELPERS
// ---------------------------------------------------------------------------

// 1. Session ID
const SESSION_ID =
  sessionStorage.getItem("gh_session_v1") ||
  Math.random().toString(36).substring(2, 12);
sessionStorage.setItem("gh_session_v1", SESSION_ID);

// 2. Location Cache
let globalLocationData = { country: null, city: null };

// 3. Device Parser
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let device = "Desktop";
  let os = "Unknown";

  if (/Mobi|Android/i.test(ua)) device = "Mobile";
  else if (/iPad|Tablet/i.test(ua)) device = "Tablet";

  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "Mac";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return { device, os, fullAgent: ua };
};

// ---------------------------------------------------------------------------
// HELPER: Robust Logging (Async/Await version)
// ---------------------------------------------------------------------------
const logGameClick = async (game) => {
  const tasks = [];

  // --- Task 1: Update global click counter ---
  const statsRef = doc(db, "game_stats", `game_${game.id}`);

  const counterPromise = updateDoc(statsRef, { clicks: increment(1) }).catch(
    async (err) => {
      if (err.code === "not-found") {
        await setDoc(statsRef, { clicks: 1 });
      } else {
        console.error("Failed to update click counter:", err);
      }
    },
  );

  tasks.push(counterPromise);

  // --- Task 2: Create detailed activity log ---
  try {
    const logsRef = collection(db, "game_click_logs");
    const userId = auth.currentUser ? auth.currentUser.uid : "unknown";

    const primaryCategory =
      game.categories && game.categories.length > 0
        ? game.categories[0]
        : "Uncategorized";

    const deviceInfo = getDeviceInfo();

    const logPromise = addDoc(logsRef, {
      userId: userId,
      sessionId: SESSION_ID,
      gameId: game.id,
      gameTitle: game.title,
      category: primaryCategory,
      country: globalLocationData.country || "Unknown",
      city: globalLocationData.city || "Unknown",
      deviceType: deviceInfo.device,
      os: deviceInfo.os,
      device: navigator.userAgent,
      timestamp: serverTimestamp(),
      pageLocation: window.location.pathname,
      referrer: document.referrer || "Direct",
    });

    tasks.push(logPromise);
  } catch (err) {
    console.error("Error preparing log data:", err);
  }

  // Wait for all database operations to finish
  await Promise.allSettled(tasks);
};

// ---------------------------------------------------------------------------
// GAME DATA
// ---------------------------------------------------------------------------
const INITIAL_GAMES = [
  {
    id: 1,
    title: "Conspiracy",
    description:
      "In the gilded halls of power, whispers are deadlier than daggers. A secret cabal moves in the shadows.",
    icon: <Eye className="w-12 h-12 text-white" />,
    color: "from-purple-600 to-indigo-900",
    shadow: "shadow-purple-500/50",
    categories: ["Bluffing", "Social Deduction"],
    minPlayers: 2,
    maxPlayers: 6,
    hasBots: false,
    complexity: "Medium",
    duration: "10-20m",
    link: "./conspiracy/",
  },
  {
    id: 2,
    title: "Investigation",
    description:
      "A crime has shattered the peace. Sift through a labyrinth of lies and fragmented clues before the trail goes cold.",
    icon: <HatGlasses className="w-12 h-12 text-white" />,
    color: "from-green-600 to-cyan-800",
    shadow: "shadow-green-500/50",
    categories: ["Social Deduction"],
    minPlayers: 4,
    maxPlayers: 10,
    hasBots: false,
    complexity: "Hard",
    duration: "20-40m",
    link: "./investigation/",
  },
  {
    id: 3,
    title: "Police Hunt",
    description:
      "Sirens wail as the city goes into lockdown. Coordinate the dragnet to trap the target.",
    icon: <Siren className="w-12 h-12 text-white" />,
    color: "from-red-700 to-blue-900",
    shadow: "shadow-red-500/50",
    categories: ["Party"],
    minPlayers: 1,
    maxPlayers: 4,
    hasBots: true,
    complexity: "Easy",
    duration: "5-15m",
    link: "./police-hunt/",
  },
  {
    id: 4,
    title: "Emperor",
    description:
      "Navigate the cutthroat politics of the court and command armies to seize the seven kingdoms.",
    icon: <Crown className="w-12 h-12 text-white" />,
    color: "from-yellow-500 to-amber-700",
    shadow: "shadow-amber-500/50",
    categories: ["Strategy", "Drafting"],
    minPlayers: 2,
    maxPlayers: 2,
    hasBots: false,
    complexity: "Hard",
    duration: "15-20m",
    link: "./emperor/",
  },
  {
    id: 5,
    title: "Pirates",
    description:
      "Hoist the black flag. Bluff your way out of a tight spot, fight for every doubloon, and plunder your rivals.",
    icon: <Ship className="w-12 h-12 text-white" />,
    color: "from-red-600 to-orange-800",
    shadow: "shadow-orange-500/50",
    categories: ["Strategy", "Social Deduction"],
    minPlayers: 2,
    maxPlayers: 8,
    hasBots: false,
    complexity: "Medium",
    duration: "15-20m",
    link: "./pirates/",
  },
  {
    id: 6,
    title: "Fruit Seller",
    description:
      "The bazaar is alive with commerce. Use cunning psychology to outwit your rivals and corner the market.",
    icon: <Citrus className="w-12 h-12 text-white" />,
    color: "from-orange-500 to-red-600",
    shadow: "shadow-orange-500/50",
    categories: ["Party"],
    minPlayers: 1,
    maxPlayers: 6,
    hasBots: true,
    complexity: "Easy",
    duration: "5-10m",
    link: "./fruit-seller/",
  },
  {
    id: 7,
    title: "Ghost Dice",
    description:
      "Step into a spectral tavern where souls are currency. Bid on the unknown and challenge the liars.",
    icon: <Dices className="w-12 h-12 text-white" />,
    color: "from-indigo-500 to-zinc-700",
    shadow: "shadow-indigo-500/50",
    categories: ["Bluffing"],
    minPlayers: 2,
    maxPlayers: 6,
    hasBots: false,
    complexity: "Medium",
    duration: "10-35m",
    link: "./ghost-dice/",
  },
  {
    id: 8,
    title: "Protocol: Sabotage",
    description:
      "The system is compromised. Identify the saboteurs before the network collapses.",
    icon: <Server className="w-12 h-12 text-white" />,
    color: "from-cyan-600 to-blue-800",
    shadow: "shadow-cyan-500/50",
    categories: ["Social Deduction"],
    minPlayers: 5,
    maxPlayers: 10,
    hasBots: false,
    complexity: "Medium",
    duration: "20-45m",
    link: "./protocol/",
  },
  {
    id: 9,
    title: "Equilibrium",
    description:
      "Forge a world of vibrant biomes and wildlife. Draft terrain tokens and build vertically to shape the landscape.",
    icon: <Hexagon className="w-12 h-12 text-white" />,
    color: "from-emerald-600 to-yellow-950",
    shadow: "shadow-emerald-500/50",
    categories: ["Strategy"],
    minPlayers: 1,
    maxPlayers: 4,
    hasBots: false,
    complexity: "Hard",
    duration: "40-60m",
    link: "./equilibrium/",
  },
  {
    id: 10,
    title: "Neon Draft",
    description:
      "Siphon the best code fragments to build the ultimate cyber-rig. Connect the nodes and optimize throughput.",
    icon: <Layers className="w-12 h-12 text-white" />,
    color: "from-cyan-400 to-purple-600",
    shadow: "shadow-cyan-500/50",
    categories: ["Drafting", "Strategy"],
    minPlayers: 2,
    maxPlayers: 6,
    hasBots: false,
    complexity: "Hard",
    duration: "10-20m",
    link: "./neon-draft/",
  },
  {
    id: 12,
    title: "Contraband",
    description:
      "The Inspector has eyes like a hawk. Lie to their face and smuggle your illicit goods.",
    icon: <Package className="w-12 h-12 text-white" />,
    color: "from-emerald-500 to-green-800",
    shadow: "shadow-emerald-500/50",
    categories: ["Bluffing", "Set Collection"],
    minPlayers: 3,
    maxPlayers: 6,
    hasBots: false,
    complexity: "Medium",
    duration: "25-45m",
    link: "./contraband/",
  },
  {
    id: 15,
    title: "Guild of Shadows",
    description:
      "Assemble a team of thieves, assassins, and merchants. Steal gold, protect your assets, and race to 15 gold.",
    icon: <Ghost className="w-12 h-12 text-white" />,
    color: "from-zinc-900 to-purple-900",
    shadow: "shadow-purple-900/50",
    categories: ["Strategy"],
    minPlayers: 2,
    maxPlayers: 4,
    hasBots: false,
    complexity: "Hard",
    duration: "10-20m",
    link: "./guild-of-shadows/",
    isNew: true,
  },
  {
    id: 17,
    title: "Masquerade Protocol",
    description:
      "You are a rogue AI attending a digital gala. Trade data packets, hack your rivals, and activate your Glitch.",
    icon: <Cpu className="w-12 h-12 text-white" />,
    color: "from-fuchsia-600 to-cyan-700",
    shadow: "shadow-fuchsia-500/50",
    categories: ["Social Deduction", "Set Collection"],
    minPlayers: 3,
    maxPlayers: 6,
    hasBots: false,
    complexity: "Medium",
    duration: "20-40m",
    link: "./masquerade-protocol/",
    isNew: true,
  },
  {
    id: 18,
    title: "Paper Oceans",
    description:
      "Craft your hand in this colorful set-collection game. Draft cards, play duo effects, and push your luck.",
    icon: <Origami className="w-12 h-12 text-white" />,
    color: "from-blue-500 to-cyan-400",
    shadow: "shadow-cyan-500/50",
    categories: ["Strategy", "Set Collection", "Push-Your-Luck"],
    minPlayers: 2,
    maxPlayers: 4,
    hasBots: false,
    complexity: "Medium",
    duration: "15-20m",
    link: "./paper-oceans/",
    isNew: true,
  },
  {
    id: 19,
    title: "Royal Menagerie",
    description:
      "The Queen's court is a masquerade of lies. Offer 'gifts' to your rivals—a noble Dog, or a repulsive Rat?",
    icon: <PawPrint className="w-12 h-12 text-white" />,
    color: "from-purple-600 to-pink-900",
    shadow: "shadow-purple-500/50",
    categories: ["Bluffing"],
    minPlayers: 2,
    maxPlayers: 7,
    hasBots: false,
    complexity: "Easy",
    duration: "15-25m",
    link: "./royal-menagerie/",
    isNew: true,
  },
  {
    id: 20,
    title: "Fructose Fury",
    description:
      "Pluck sweet victories from the deck, but beware the rot of greed. One duplicate fruit is all it takes.",
    icon: <Banana className="w-12 h-12 text-white" />,
    color: "from-yellow-500 to-orange-600",
    shadow: "shadow-yellow-500/50",
    categories: ["Push-Your-Luck"],
    minPlayers: 2,
    maxPlayers: 6,
    hasBots: false,
    complexity: "Easy",
    duration: "10-20m",
    link: "./fructose-fury/",
    isNew: true,
  },
  {
    id: 21,
    title: "Angry Virus",
    description:
      "A contagious game of calculated risks. Pass the infection or bite the bullet?",
    icon: <Biohazard className="w-12 h-12 text-white" />,
    color: "from-green-600 to-lime-800",
    shadow: "shadow-lime-500/50",
    categories: ["Push-Your-Luck", "Drafting"],
    minPlayers: 2,
    maxPlayers: 7,
    hasBots: false,
    complexity: "Medium",
    duration: "15-20m",
    link: "./angry-virus/",
    isNew: true,
  },
  {
    id: 22,
    title: "Last of Us",
    description:
      "A strategic shedding game. Use even-numbered Antidotes to cage the odd-numbered Zombies.",
    icon: <Skull className="w-12 h-12 text-white" />,
    color: "from-red-700 to-lime-900",
    shadow: "shadow-red-900/50",
    categories: ["Shedding"],
    minPlayers: 2,
    maxPlayers: 6,
    hasBots: false,
    complexity: "Hard",
    duration: "10-20m",
    link: "./last-of-us/",
    isNew: true,
  },
  {
    id: 23,
    title: "Together",
    description:
      "Two minds, one silent purpose. Synchronize your strategies without a single word to complete patterns.",
    icon: <Handshake className="w-12 h-12 text-white" />,
    color: "from-pink-600 to-yellow-500",
    shadow: "shadow-pink-500/50",
    categories: ["Set Collection", "Party"],
    minPlayers: 4,
    maxPlayers: 6,
    hasBots: false,
    complexity: "Medium",
    duration: "20-40m",
    link: "./together/",
  },
  {
    id: 24,
    title: "Spectrum",
    description:
      "A tactical duel of numerical frequencies. Navigate the shifting colors to win tricks and calibrate your score.",
    icon: <Target className="w-12 h-12 text-white" />,
    color: "from-fuchsia-600 to-indigo-950",
    shadow: "shadow-fuchsia-500/50",
    categories: ["Strategy", "Trick-Taking"],
    minPlayers: 3,
    maxPlayers: 4,
    hasBots: false,
    complexity: "Hard",
    duration: "20-30m",
    link: "./spectrum/",
  },
];

// ---------------------------------------------------------------------------
// COMPONENTS
// ---------------------------------------------------------------------------

const AnnouncementBanner = ({ message }) => {
  if (!message || typeof message !== "string" || message.trim().length === 0)
    return null;

  return (
    <div className="relative z-50 bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-600 border-b border-white/20 shadow-xl">
      <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-3 text-white">
        <Megaphone className="w-5 h-5 animate-pulse shrink-0 fill-white/20" />
        <span className="font-bold text-sm md:text-base text-center tracking-wide drop-shadow-md">
          {message}
        </span>
      </div>
    </div>
  );
};

const MaintenanceContent = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in min-h-[50vh]">
    <div className="relative mb-8">
      <div className="absolute inset-0 bg-orange-500 blur-3xl opacity-20 rounded-full"></div>
      <Hammer
        size={80}
        className="text-orange-500 relative z-10 animate-bounce"
      />
    </div>
    <h1 className="text-4xl font-black text-white mb-4">Under Maintenance</h1>
    <p className="text-slate-400 max-w-md text-lg leading-relaxed">
      We are currently deploying updates to the GameHub. The portal will be back
      online shortly.
    </p>
  </div>
);

const RandomGameModal = ({ isOpen, onClose, games, onSelect }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayedGame, setDisplayedGame] = useState(null);

  useEffect(() => {
    if (isOpen && games.length > 0) {
      setIsSpinning(true);
      let interval;
      let counter = 0;
      interval = setInterval(() => {
        const random = games[Math.floor(Math.random() * games.length)];
        setDisplayedGame(random);
        counter++;
        if (counter > 15) {
          clearInterval(interval);
          setIsSpinning(false);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isOpen, games]);
  if (!isOpen || !displayedGame) return null;

  return (
    <div className="fixed inset-0 z-110 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6 flex justify-center items-center gap-2">
          {isSpinning ? (
            <Shuffle className="animate-spin" />
          ) : (
            <Dice5 className="text-indigo-500" />
          )}
          {isSpinning ? "Rolling the dice..." : "Fate has chosen!"}
        </h2>

        <div
          className={`transition-all duration-300 ${
            isSpinning ? "blur-sm scale-90" : "scale-100"
          }`}
        >
          <div
            className={`mx-auto w-24 h-24 mb-4 rounded-full bg-linear-to-br ${displayedGame.color} flex items-center justify-center shadow-xl`}
          >
            {React.cloneElement(displayedGame.icon, {
              className: "w-12 h-12 text-white",
            })}
          </div>
          <h3 className="text-3xl font-black text-white mb-2">
            {displayedGame.title}
          </h3>
          <p className="text-slate-400 mb-6">{displayedGame.description}</p>

          <button
            disabled={isSpinning || displayedGame.maintenance}
            onClick={() => onSelect(displayedGame)}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {displayedGame.maintenance ? (
              <>
                <Hammer size={20} /> Under Maintenance
              </>
            ) : (
              <>
                Play Now <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const NewReleaseSlider = ({ games, onGameClick }) => {
  const heroGames = useMemo(() => {
    const featuredGames = games.filter((g) => g.isFeatured && g.visible);
    const newGames = games.filter((g) => g.isNew && g.visible);
    const upcomingGames = games.filter((g) => g.isUpcoming && g.visible);

    const combined = [...featuredGames, ...newGames, ...upcomingGames];
    const uniqueGames = Array.from(
      new Map(combined.map((game) => [game.id, game])).values(),
    );

    if (uniqueGames.length > 0) return uniqueGames;
    return games.filter((g) => g.isHot && g.visible).slice(0, 3);
  }, [games]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef(null);

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    resetTimeout();
    timeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % heroGames.length);
    }, 5000);

    return () => resetTimeout();
  }, [currentIndex, heroGames.length]);
  const handleManualSlide = (idx) => {
    resetTimeout();
    setCurrentIndex(idx);
  };

  if (!heroGames || heroGames.length === 0) return null;
  const safeIndex = currentIndex >= heroGames.length ? 0 : currentIndex;
  const currentGame = heroGames[safeIndex];
  if (!currentGame) return null;

  // Function to call the parent handler
  const handleHeroClick = (e) => {
    e.preventDefault();
    onGameClick(currentGame);
  };

  let badgeText = "Featured";
  let badgeColor = "bg-emerald-500/20 border-emerald-500/30 text-emerald-300";

  if (currentGame.isUpcoming) {
    badgeText = "Upcoming Release";
    badgeColor = "bg-pink-500/20 border-pink-500/30 text-pink-300";
  } else if (currentGame.maintenance) {
    badgeText = "Maintenance Break";
    badgeColor = "bg-orange-500/20 border-orange-500/30 text-orange-300";
  } else if (currentGame.isFeatured) {
    badgeText = "Featured";
    badgeColor = "bg-emerald-500/20 border-emerald-500/30 text-emerald-300";
  } else if (currentGame.isNew) {
    badgeText = "New Release";
    badgeColor = "bg-red-700/20 border-red-500/30 text-red-400";
  } else if (currentGame.isHot) {
    badgeText = "Hot";
    badgeColor = "bg-orange-700/20 border-orange-500/30 text-orange-300";
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto mb-16 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 group animate-in slide-in-from-top-10 duration-700">
      <div
        key={currentGame.id}
        className={`absolute inset-0 bg-linear-to-br ${currentGame.color} opacity-20 transition-opacity duration-1000`}
      />
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      <div className="relative p-6 md:p-12 flex flex-col md:flex-row items-center gap-8 text-center md:text-left min-h-[400px]">
        <button
          onClick={() =>
            handleManualSlide(
              (safeIndex - 1 + heroGames.length) % heroGames.length,
            )
          }
          className="hidden md:block absolute left-4 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700 text-white z-20"
        >
          <ChevronLeft />
        </button>

        <div className="flex-1 flex flex-col md:flex-row items-center gap-8 w-full justify-center">
          <div
            className={`p-6 rounded-2xl bg-linear-to-br ${currentGame.color} ${currentGame.shadow} shadow-2xl transform transition-all duration-500 scale-100`}
          >
            {React.cloneElement(currentGame.icon, {
              className: "w-16 h-16 md:w-24 md:h-24 text-white",
            })}
          </div>

          <div className="flex-1 max-w-xl">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase animate-pulse tracking-widest mb-4 ${badgeColor}`}
            >
              {currentGame.isUpcoming ? (
                <Clock size={12} />
              ) : currentGame.maintenance ? (
                <Hammer size={12} />
              ) : (
                <Sparkles size={12} />
              )}{" "}
              {badgeText}
            </div>
            <h2
              key={currentGame.id}
              className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              {currentGame.title}
            </h2>
            <p className="text-base text-slate-300 mb-6 leading-relaxed">
              {currentGame.description}
            </p>

            {!currentGame.isUpcoming && (
              <button
                onClick={handleHeroClick}
                disabled={currentGame.maintenance}
                className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold shadow-lg transition-colors ${
                  currentGame.maintenance
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600"
                    : "bg-white text-slate-900 hover:bg-slate-200 shadow-white/10"
                }`}
              >
                {currentGame.maintenance ? (
                  <>
                    <Hammer size={20} /> Under Maintenance
                  </>
                ) : (
                  <>
                    Play Now <ArrowRight size={20} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => handleManualSlide((safeIndex + 1) % heroGames.length)}
          className="hidden md:block absolute right-4 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700 text-white z-20"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
        {heroGames.map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleManualSlide(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === safeIndex
                ? "w-8 bg-white"
                : "bg-slate-600 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const GameCard = ({
  game,
  isUpcoming,
  isFavorite,
  onToggleFavorite,
  onGameClick,
}) => {
  // Function to call the parent handler
  const handleClick = (e) => {
    e.preventDefault();
    if (isUpcoming || game.maintenance) return;
    onGameClick(game);
  };

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(game.id);
  };
  return (
    <a
      href={isUpcoming || game.maintenance ? undefined : game.link}
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`group relative block h-full animate-in fade-in zoom-in duration-500 ${
        isUpcoming || game.maintenance
          ? "cursor-default opacity-80"
          : "cursor-pointer"
      }`}
    >
      <div
        className={`absolute -inset-0.5 bg-linear-to-r ${
          game.color
        } rounded-2xl opacity-0 ${
          isUpcoming || game.maintenance
            ? "group-hover:opacity-30"
            : "group-hover:opacity-75"
        } blur transition duration-500 group-hover:duration-200`}
      />
      <div className="relative h-full flex flex-col bg-slate-900 rounded-xl p-6 border border-slate-800 hover:border-transparent transition-colors duration-300">
        {!isUpcoming && (
          <button
            onClick={handleFavorite}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-950/50 hover:bg-slate-800 transition-colors"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavorite ? "fill-red-500 text-red-500" : "text-slate-400"
              }`}
            />
          </button>
        )}

        <div className="flex justify-between items-start mb-6 h-8">
          <div className="flex gap-2 flex-wrap max-w-[80%]">
            {game.maintenance && (
              <span className="bg-orange-700/50 border border-orange-500 text-orange-200 text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                <Hammer size={10} /> MAINTENANCE BREAK
              </span>
            )}
            {!game.maintenance && game.isNew && !isUpcoming && (
              <span className="bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-pulse flex items-center gap-1 shadow-red-500/50">
                <Sparkles size={10} /> NEW
              </span>
            )}
            {!game.maintenance && game.isHot && !isUpcoming && (
              <span className="bg-orange-700 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 shadow-orange-500/50">
                <Flame size={10} /> HOT
              </span>
            )}
            {!game.maintenance && game.isPopular && !isUpcoming && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 shadow-blue-500/50">
                <Star size={10} /> POPULAR
              </span>
            )}
            {isUpcoming && (
              <span className="bg-pink-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-pulse flex items-center gap-1 shadow-pink-500/50">
                <Clock size={10} /> COMING SOON
              </span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div
            className={`inline-block p-3 rounded-xl bg-linear-to-br ${
              game.maintenance
                ? "from-slate-700 to-slate-800 shadow-none grayscale opacity-50"
                : game.color
            } ${
              game.shadow
            } shadow-lg transform group-hover:scale-110 transition-transform duration-300`}
          >
            {game.icon}
          </div>
        </div>

        <div className="grow">
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
            {game.title}
          </h3>
          <p className="text-slate-400 leading-relaxed mb-4 text-sm">
            {game.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {game.categories &&
              game.categories.map((cat, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-slate-800 text-slate-300 text-[10px] uppercase font-bold rounded flex items-center gap-1"
                >
                  {cat}
                </span>
              ))}
            <span className="px-2 py-1 bg-slate-800 text-indigo-300 text-[10px] uppercase font-bold rounded flex items-center gap-1">
              <Clock size={10} /> {game.duration}
            </span>
            <span
              className={`px-2 py-1 bg-slate-800 text-[10px] uppercase font-bold rounded flex items-center gap-1 ${
                game.complexity === "Hard"
                  ? "text-red-400"
                  : game.complexity === "Medium"
                    ? "text-yellow-400"
                    : "text-green-400"
              }`}
            >
              <Zap size={10} /> {game.complexity}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/50 mt-auto flex items-center justify-between group/btn">
          <div className="flex items-center text-slate-400 text-sm">
            <span className="px-3 py-1 bg-slate-800/50 text-slate-300 text-xs font-semibold tracking-wider rounded-full border border-slate-700/50 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {game.minPlayers}-{game.maxPlayers}
            </span>
            <div className="ml-2 flex items-center gap-2">
              {game.hasBots && (
                <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  +Bot
                </div>
              )}
            </div>
          </div>

          {!isUpcoming && (
            <div className="flex items-center font-medium text-sm group-hover/btn:translate-x-1 transition-transform">
              {game.maintenance ? (
                <span className="text-slate-500 flex items-center gap-1">
                  <Hammer size={12} /> Offline
                </span>
              ) : (
                <span className="text-white flex items-center">
                  Play <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </a>
  );
};

const FloatingBackground = ({ games }) => {
  const particles = useMemo(() => {
    const visibleGames = games.filter((g) => g.visible);
    if (visibleGames.length === 0) return [];

    const getColor = (gradient) => {
      const match = gradient.match(/from-([a-z]+)-/);
      return match ? `text-${match[1]}-500` : "text-slate-500";
    };

    return [...Array(25)].map((_, i) => {
      const game = visibleGames[i % visibleGames.length];
      return {
        id: i,
        icon: game.icon,
        color: getColor(game.color),
        size: Math.floor(Math.random() * 30) + 20,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: Math.random() * 20 + 20,
        delay: Math.random() * 20 * -1,
        xMove: (Math.random() - 0.5) * 40,
        yMove: (Math.random() - 0.5) * 40,
        rotation: Math.random() * 360,
      };
    });
  }, [games]);
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black" />
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute ${p.color} opacity-[0.07] animate-float`}
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            "--tx": `${p.xMove}vw`,
            "--ty": `${p.yMove}vh`,
            "--rot": `${p.rotation}deg`,
          }}
        >
          {React.cloneElement(p.icon, { size: "100%", strokeWidth: 1.5 })}
        </div>
      ))}
      <div className="absolute top-0 left-0 w-full h-full bg-slate-950/60 backdrop-blur-[1px]" />
      <style>{`@keyframes float { 0% { transform: translate(0, 0) rotate(0deg);
} 50% { transform: translate(var(--tx), var(--ty)) rotate(180deg); } 100% { transform: translate(0, 0) rotate(360deg); } } .animate-float { animation-name: float;
animation-timing-function: ease-in-out; animation-iteration-count: infinite; }`}</style>
    </div>
  );
};

const WebsiteQrModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const currentUrl = window.location.href;
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    currentUrl,
  )}&bgcolor=ffffff`;

  return (
    <div className="fixed inset-0 z-120 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-8 text-center shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2 flex justify-center items-center gap-2">
          <Smartphone className="text-indigo-500" /> Mobile Access
        </h2>
        <p className="text-slate-400 mb-6 text-sm">
          Scan to play on your mobile device
        </p>

        <div className="bg-white p-4 rounded-xl inline-block shadow-lg shadow-indigo-500/10 mb-6">
          <img
            src={qrImage}
            alt="Website QR Code"
            className="w-48 h-48 md:w-56 md:h-56 mix-blend-multiply"
          />
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// SPLASH SCREEN COMPONENT
// ---------------------------------------------------------------------------
const SplashScreen = ({ onStart }) => {
  // State 1: Image is downloaded and ready to show
  const [isLoaded, setIsLoaded] = useState(false);
  // State 2: Button is ready to slide in (after zoom)
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Preload the image
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
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-end pb-20 md:justify-center md:pb-0 font-sans overflow-hidden">
      {/* --- LOADING INDICATOR --- */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-indigo-500/50">
          <Loader size={48} className="animate-spin mb-4" />
          <div className="font-mono text-xs tracking-[0.3em] animate-pulse">
            INITIALIZING AWESOMENESS...
          </div>
        </div>
      )}

      {/* Background Image Container */}
      <div
        className={`absolute inset-0 z-0 overflow-hidden transition-opacity duration-1000 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className={`w-full h-full bg-cover bg-center transition-transform duration-[2000ms] ease-out ${
            isLoaded ? "scale-100" : "scale-140"
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
            className="group relative px-12 py-5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 hover:border-indigo-400 text-indigo-300 font-black text-2xl tracking-widest rounded-none transform transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] backdrop-blur-md overflow-hidden"
          >
            {/* Animated Scanline overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-400/10 to-transparent translate-y-[-100%] animate-[scan_2s_infinite_linear]" />

            <span className="relative z-10 flex items-center gap-3 animate-pulse">
              ENTER GAMEHUB
            </span>
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 text-slate-500 text-xs text-center z-10">
        Developed by <strong>RAWFID K SHUVO</strong>
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

// --- MAIN COMPONENT ---
const GameHub = () => {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem("gh_splash_done");
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [playerCount, setPlayerCount] = useState(0);
  const [selectedComplexity, setSelectedComplexity] = useState("All");
  const [selectedDuration, setSelectedDuration] = useState("All");
  const [favorites, setFavorites] = useState(new Set());
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
  const [gameOverrides, setGameOverrides] = useState({});
  const [clickStats, setClickStats] = useState({});
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [systemMessage, setSystemMessage] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [isNavigating, setIsNavigating] = useState(false);

  // 1. Use a Ref to store location (PERSISTS across re-renders and Fast Refresh)
  const locationRef = useRef({ country: "Unknown", city: "Unknown" });

  useEffect(() => {
    setIsNavigating(false);
    const handlePageShow = (event) => {
      if (event.persisted) setIsNavigating(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  useEffect(() => {
    const fetchLocation = async () => {
      // If we already have data (from a previous render), don't fetch again
      if (
        globalLocationData.country &&
        globalLocationData.country !== "Unknown"
      ) {
        locationRef.current = globalLocationData;
        return;
      }

      try {
        // Primary API
        let response = await fetch("https://ipwho.is/");

        // Backup API if primary fails
        if (!response.ok) {
          response = await fetch("https://ipapi.co/json/");
        }

        const data = await response.json();

        if (data.success || data.city) {
          const loc = {
            country: data.country || data.country_name || "Unknown",
            city: data.city || "Unknown",
          };

          // 1. Update the Ref (for React)
          locationRef.current = loc;

          // 2. Update the Global Variable (for your logGameClick function)
          globalLocationData = loc;

          console.log("Location initialized:", loc);
        }
      } catch (error) {
        console.warn(
          "Location fetch failed (likely AdBlock or Rate Limit). Defaulting to Unknown.",
        );
      }
    };

    fetchLocation();

    const storedFavs = localStorage.getItem("gamehub_favorites");
    if (storedFavs) {
      setFavorites(new Set(JSON.parse(storedFavs)));
    }
    const storedHistory = localStorage.getItem("gamehub_history");
    if (storedHistory) {
      setRecentlyPlayed(JSON.parse(storedHistory));
    }
  }, []);

  useEffect(() => {
    const unsubConfig = onSnapshot(
      doc(db, "game_hub_settings", "config"),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setGameOverrides(data);
          setMaintenanceMode(data.maintenanceMode || false);
          setSystemMessage(data.systemMessage || "");
        }
      },
    );

    const unsubStats = onSnapshot(collection(db, "game_stats"), (snapshot) => {
      const stats = {};
      snapshot.docs.forEach((doc) => {
        const id = parseInt(doc.id.replace("game_", ""));
        stats[id] = doc.data().clicks || 0;
      });
      setClickStats(stats);
    });

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) signInAnonymously(auth);
    });
    return () => {
      unsubConfig();
      unsubStats();
      unsubAuth();
    };
  }, []);

  const handleToggleFavorite = (id) => {
    const newFavs = new Set(favorites);
    if (newFavs.has(id)) {
      newFavs.delete(id);
    } else {
      newFavs.add(id);
    }
    setFavorites(newFavs);
    localStorage.setItem("gamehub_favorites", JSON.stringify([...newFavs]));
  };

  const processedGames = useMemo(() => {
    return INITIAL_GAMES.map((game) => {
      const override = gameOverrides[game.id] || {};
      const realClicks = clickStats[game.id] || 0;
      const manualBoost = override.popularity || 0;
      return {
        ...game,
        visible: override.visible ?? true,
        isNew: override.isNew ?? false,
        isHot: override.isHot ?? false,
        isFeatured: override.isFeatured || false,
        isUpcoming: override.isUpcoming || false,
        maintenance: override.maintenance || false,
        manualBoost: manualBoost,
        popularity: realClicks + manualBoost,
      };
    });
  }, [gameOverrides, clickStats]);

  const categories = [
    "All",
    ...new Set(
      processedGames
        .filter((g) => g.visible && !g.isUpcoming)
        .flatMap((g) => g.categories),
    ),
  ];

  const isFiltering =
    searchTerm !== "" ||
    selectedCategory !== "All" ||
    playerCount !== 0 ||
    selectedComplexity !== "All" ||
    selectedDuration !== "All";

  const filteredGames = useMemo(() => {
    return processedGames
      .filter((game) => {
        const matchesSearch =
          game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          game.categories.some((c) =>
            c.toLowerCase().includes(searchTerm.toLowerCase()),
          );

        const matchesCategory =
          selectedCategory === "All" ||
          game.categories.includes(selectedCategory);

        const matchesPlayers =
          playerCount === 0 ||
          (playerCount >= game.minPlayers && playerCount <= game.maxPlayers);

        const matchesComplexity =
          selectedComplexity === "All" ||
          game.complexity === selectedComplexity;
        const matchesDuration =
          selectedDuration === "All" ||
          (selectedDuration === "Short"
            ? [
                "15-20m",
                "10-20m",
                "5-10m",
                "10-35m",
                "5-15m",
                "15-25m",
              ].includes(game.duration)
            : selectedDuration === "Medium"
              ? [
                  "25-45m",
                  "10-35m",
                  "20-40m",
                  "20-45m",
                  "15-25m",
                  "20-30m",
                ].includes(game.duration)
              : selectedDuration === "Long"
                ? ["25-45m", "20-40m", "20-45m", "40-60m"].includes(
                    game.duration,
                  )
                : true);

        const isPlayable = !game.isUpcoming;
        if (selectedCategory === "Favorites") {
          return favorites.has(game.id) && game.visible;
        }

        if (isFiltering) {
          return (
            matchesSearch &&
            matchesCategory &&
            matchesPlayers &&
            matchesComplexity &&
            matchesDuration &&
            game.visible
          );
        } else {
          return isPlayable && game.visible;
        }
      })
      .sort((a, b) => {
        if (sortBy === "alphabetical") {
          return a.title.localeCompare(b.title);
        }
        return (b.popularity || 0) - (a.popularity || 0);
      });
  }, [
    searchTerm,
    selectedCategory,
    playerCount,
    selectedComplexity,
    selectedDuration,
    processedGames,
    isFiltering,
    favorites,
    sortBy,
  ]);

  const upcomingGames = useMemo(
    () => processedGames.filter((g) => g.visible && g.isUpcoming),
    [processedGames],
  );

  const popularGames = useMemo(() => {
    return [...processedGames]
      .filter((g) => g.visible && !g.isUpcoming)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 2);
  }, [processedGames]);

  const historyGames = useMemo(() => {
    return recentlyPlayed
      .map((id) => processedGames.find((g) => g.id === id))
      .filter(Boolean);
  }, [recentlyPlayed, processedGames]);

  // --- MASTER CLICK HANDLER ---
  // This function controls the loading screen, logging, and navigation
  const handleGameLaunch = async (game) => {
    if (game.maintenance || game.isUpcoming) return;

    // 1. Show Loading Screen
    setIsNavigating(true);

    // 2. Update History
    const newHistory = [
      game.id,
      ...recentlyPlayed.filter((id) => id !== game.id),
    ].slice(0, 5);
    setRecentlyPlayed(newHistory);
    localStorage.setItem("gamehub_history", JSON.stringify(newHistory));

    // 3. Log Analytics (Wait for it!)
    await logGameClick(game);

    // 4. Navigate
    window.location.href = game.link;
  };

  const handleRandomSelect = (game) => {
    setIsRandomModalOpen(false);
    handleGameLaunch(game);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setPlayerCount(0);
    setSelectedComplexity("All");
    setSelectedDuration("All");
  };

  // --- RENDER SPLASH ---
  if (showSplash) {
    return (
      <SplashScreen
        onStart={() => {
          // CHANGED: Mark splash as done in session storage
          sessionStorage.setItem("gh_splash_done", "true");
          setShowSplash(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500 selection:text-white relative flex flex-col">
      <FloatingBackground games={processedGames} />

      <AnnouncementBanner message={systemMessage} />

      <style>{`
        @keyframes rainbow {
          0%, 100% { color: #9333ea; }
          14% { color: #16a34a; }
          28% { color: #dc2626; }
          42% { color: #eab308; }
          57% { color: #ea580c; }
          71% { color: #0891b2; }
          85% { color: #db2777; }
        }
        .animate-rainbow {
          animation: rainbow 8s linear infinite;
        }
      `}</style>

      <RandomGameModal
        isOpen={isRandomModalOpen}
        onClose={() => setIsRandomModalOpen(false)}
        games={filteredGames}
        onSelect={handleRandomSelect}
      />

      <WebsiteQrModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-7xl grow flex flex-col">
        <header className="text-center mb-12 space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-4 animate-fade-in-down">
            <Gamepad2 className="w-6 h-6 text-indigo-400 mr-2" />
            <span className="text-indigo-300 font-medium tracking-wide text-sm uppercase">
              Multiplayer Board Game Hub
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-linear-to-r from-white via-slate-200 to-slate-400 tracking-tight mb-4">
            Board Games{" "}
            <span className="animate-pulse animate-rainbow">Online</span>
          </h1>
        </header>

        {maintenanceMode ? (
          <MaintenanceContent />
        ) : (
          <>
            {/* --- RECENTLY PLAYED --- */}
            {!isFiltering && historyGames.length > 0 && (
              <div className="w-full max-w-5xl mx-auto mb-8 animate-in slide-in-from-top-4 min-w-0">
                <div className="flex items-center gap-2 mb-3 text-slate-400 text-sm font-bold uppercase tracking-wider">
                  <History size={16} /> Jump back in
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide w-full">
                  {historyGames.map((game) => (
                    <div
                      key={game.id}
                      onClick={() =>
                        !game.maintenance && handleGameLaunch(game)
                      }
                      className={`shrink-0 group flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 transition-all pr-6 ${
                        game.maintenance
                          ? "opacity-50 cursor-not-allowed border-orange-900"
                          : "hover:border-indigo-500/50 cursor-pointer"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg bg-linear-to-br ${game.color}`}
                      >
                        {React.cloneElement(game.icon, {
                          size: 20,
                          className: "text-white",
                        })}
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm truncate max-w-[150px]">
                          {game.title}
                        </div>
                        <div className="text-slate-500 text-xs">
                          {game.maintenance ? "Maintenance" : "Resume"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- NEW RELEASES SLIDER --- */}
            {!isFiltering && (
              <NewReleaseSlider
                games={processedGames}
                onGameClick={handleGameLaunch}
              />
            )}

            {/* --- SEARCH & ACTIONS --- */}
            <div className="max-w-5xl mx-auto mb-12 space-y-6">
              <div className="flex gap-2">
                {/* SEARCH BAR */}
                <div className="flex-1 relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search games..."
                    className="block w-full pl-11 pr-4 py-4 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all backdrop-blur-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* FAVORITES BUTTON */}
                <button
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === "Favorites" ? "All" : "Favorites",
                    )
                  }
                  title="View Favorites"
                  className={`px-5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center shrink-0 border ${
                    selectedCategory === "Favorites"
                      ? "bg-red-600 border-red-500 text-white shadow-red-500/20"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-red-500 hover:border-red-500/50"
                  }`}
                >
                  <Heart
                    size={24}
                    className={
                      selectedCategory === "Favorites" ? "fill-white" : ""
                    }
                  />
                </button>

                {/* PICK FOR ME BUTTON */}
                <button
                  onClick={() => setIsRandomModalOpen(true)}
                  title="Pick for me"
                  className="px-5 bg-linear-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0"
                >
                  <Dice5 size={24} />
                </button>
              </div>

              {/* --- DROPDOWNS ROW --- */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[140px] md:min-w-[160px] md:flex-none">
                  <select
                    value={playerCount}
                    onChange={(e) => setPlayerCount(parseInt(e.target.value))}
                    className="appearance-none w-full bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block pl-9 pr-10 py-2.5 cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <option value="0">Players</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "Player" : "Players"}
                      </option>
                    ))}
                  </select>
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>

                <div className="relative flex-1 min-w-[140px] md:min-w-[160px] md:flex-none">
                  <select
                    value={
                      selectedCategory === "Favorites"
                        ? "All"
                        : selectedCategory
                    }
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="appearance-none w-full bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block pl-9 pr-10 py-2.5 cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "All" ? "Categories" : cat}
                      </option>
                    ))}
                  </select>
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>

                <div className="relative flex-1 min-w-[140px] md:min-w-[160px] md:flex-none">
                  <select
                    value={selectedComplexity}
                    onChange={(e) => setSelectedComplexity(e.target.value)}
                    className="appearance-none w-full bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block pl-9 pr-10 py-2.5 cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <option value="All">Complexity</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>

                <div className="relative flex-1 min-w-[140px] md:min-w-[160px] md:flex-none">
                  <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="appearance-none w-full bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block pl-9 pr-10 py-2.5 cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <option value="All">Duration</option>
                    <option value="Short">Short</option>
                    <option value="Medium">Medium</option>
                    <option value="Long">Long</option>
                  </select>
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>

                <button
                  onClick={resetFilters}
                  disabled={!isFiltering}
                  className={`p-2.5 rounded-lg border transition-all shrink-0 flex items-center justify-center ${
                    isFiltering
                      ? "bg-red-900/20 border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white cursor-pointer"
                      : "bg-slate-800/50 border-slate-700 text-slate-600 grayscale cursor-not-allowed"
                  }`}
                  title="Clear Filters"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* MAIN GAMES GRID HEADER */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 shrink-0">
                  <Gamepad2 className="w-5 h-5 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-wide truncate">
                  {isFiltering
                    ? `Results (${filteredGames.length})`
                    : "All Games"}
                </h2>
              </div>

              <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 flex items-center shrink-0">
                <button
                  onClick={() => setSortBy("popular")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                    sortBy === "popular"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Star size={14} />
                  <span className="hidden sm:inline">Popular</span>
                  <span className="sm:hidden">Popular</span>
                </button>
                <button
                  onClick={() => setSortBy("alphabetical")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                    sortBy === "alphabetical"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <ArrowDownAZ size={14} /> A-Z
                </button>
              </div>
            </div>

            {/* Grid starts here... */}
            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-20">
              {filteredGames.length > 0 ? (
                filteredGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={{
                      ...game,
                      isPopular: popularGames.some((pg) => pg.id === game.id),
                    }}
                    isUpcoming={game.isUpcoming}
                    isFavorite={favorites.has(game.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onGameClick={handleGameLaunch}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 animate-in fade-in">
                  <Dice5 className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-400">
                    No games match your filters
                  </h3>
                  <button
                    onClick={resetFilters}
                    className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </main>

            {/* UPCOMING RELEASES */}
            {!isFiltering && upcomingGames.length > 0 && (
              <section className="mb-16 animate-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
                    <Clock className="w-5 h-5 text-pink-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-wide">
                    Upcoming Releases
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {upcomingGames.map((game) => (
                    <GameCard key={game.id} game={game} isUpcoming={true} />
                  ))}
                </div>
              </section>
            )}

            <div className="text-center pb-12 animate-pulse">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900/50 rounded-full border border-indigo-500/20 text-indigo-300 font-bold tracking-widest text-sm uppercase backdrop-blur-sm">
                <Sparkles size={16} /> Stay tuned... More games coming soon...{" "}
                <Sparkles size={16} />
              </div>
            </div>
          </>
        )}

        <footer className="border-t border-slate-800/50 pt-8 mt-auto text-center text-slate-500 text-sm">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 mb-4">
            <button
              onClick={() => setIsQrOpen(true)}
              className="hover:text-white transition-colors flex items-center gap-2 group"
            >
              <div className="p-2 bg-slate-800 rounded-full group-hover:bg-indigo-600 transition-colors">
                <QrCode className="w-4 h-4" />
              </div>{" "}
              Share / Mobile QR
            </button>

            <span className="hidden md:inline w-1 h-1 rounded-full bg-slate-700"></span>
            <p className="flex items-center gap-2">
              Developed by{" "}
              <span className="text-slate-300 font-bold">Rawfid K Shuvo</span>
            </p>
          </div>
          <p className="opacity-60">
            &copy; {new Date().getFullYear()} Game Hub Portal. All rights
            reserved.
          </p>
        </footer>
      </div>

      {/* --- LOADING OVERLAY --- */}
      {isNavigating && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-6 bg-slate rounded-xl shadow-2xl">
            {/* Simple Tailwind Spinner */}
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-indigo-800 font-semibold">Opening Game...</p>
          </div>
        </div>
      )}
    </div>
  );
};
export default GameHub;
