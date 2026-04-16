import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import React, { useState, useEffect, useRef } from "react";
import { Search, Settings as SettingsIcon, Download, Star, Gamepad2, Layers, Info, Share2, Heart, ChevronRight, Youtube, Instagram, Github, MessageCircle, Send, ExternalLink, X, Palette, Music, Lock, Plus, Trash2, Play, Pause, SkipForward, SkipBack, Code, FileCode, Copy, Check, Database, Edit, LogIn, LogOut, User as UserIcon, Globe, ArrowLeft, ArrowRight, RotateCcw, Sparkles, Bookmark, History, Zap } from "lucide-react";
import { GAMES as INITIAL_GAMES, PLATFORMS, EMULATORS as INITIAL_EMULATORS, GUIDES, PRO_TIPS, APP_THEMES, OFFICIAL_PRODUCTS } from "../constants";
import { Game, Platform, Emulator, Guide } from "../types";
import { SOURCE_CODE } from "../data/sourceCode";
import { auth, db, loginWithGoogle, onAuthStateChanged, User, handleFirestoreError, OperationType, testConnection } from "../firebase";
import { collection, onSnapshot, query, doc, setDoc, deleteDoc, updateDoc, Timestamp, orderBy, getDoc, addDoc } from "firebase/firestore";

const THEMES = [
  { name: "Cyber Neon", primary: "#00f2ff", secondary: "#7000ff", accent: "#ff00c8" },
  { name: "Emerald City", primary: "#10b981", secondary: "#064e3b", accent: "#34d399" },
  { name: "Sunset Blaze", primary: "#f59e0b", secondary: "#7c2d12", accent: "#fbbf24" },
  { name: "Deep Sea", primary: "#3b82f6", secondary: "#1e3a8a", accent: "#60a5fa" },
  { name: "Royal Purple", primary: "#a855f7", secondary: "#4c1d95", accent: "#c084fc" },
];

const SOCIAL_LINKS = [
  { name: "Snapchat", url: "https://www.snapchat.com/add/gamesiteonline?share_id=mpxILdRHu8U&locale=en-GB", color: "bg-[#FFFC00] text-black" },
  { name: "YouTube", url: "https://www.youtube.com/@gamesiteonline", color: "bg-[#FF0000] text-white", icon: <Youtube size={20} /> },
  { name: "Instagram (Store)", url: "https://www.instagram.com/games_site_online?igsh=cnBpc25tNXZtYW52", color: "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white", icon: <Instagram size={20} /> },
  { name: "Instagram (Dev)", url: "https://www.instagram.com/d.e.m.o.x_11?igsh=NnQ3ZWVmYXh4b2Zn", color: "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white", icon: <Instagram size={20} /> },
  { name: "IG Channel", url: "https://www.instagram.com/channel/Aba9KPoJDIJ-im6Z/", color: "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white", icon: <Instagram size={20} /> },
  { name: "GitHub", url: "https://github.com/Gamesiteonline", color: "bg-[#333] text-white", icon: <Github size={20} /> },
  { name: "Telegram", url: "https://t.me/Gamesiteonline", color: "bg-[#0088cc] text-white", icon: <Send size={20} /> },
  { name: "Threads", url: "https://www.threads.com/@d.e.m.o.x_11", color: "bg-black text-white" },
  { name: "Pinterest", url: "https://pin.it/5aB39I8wy", color: "bg-[#E60023] text-white" },
  { name: "WhatsApp", url: "https://wa.me/qr/FYVTX2AFYSUVH1", color: "bg-[#25D366] text-white", icon: <MessageCircle size={20} /> },
  { name: "Linktree", url: "https://linktr.ee/fahadgroyne", color: "bg-[#43E660] text-black", icon: <ExternalLink size={20} /> },
];

export default function Store() {
  const [activeTab, setActiveTab] = useState<'games' | 'roms' | 'platforms' | 'settings' | 'guides' | 'apps'>('games');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState("");
  const [showSocial, setShowSocial] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showSourceCode, setShowSourceCode] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [pendingSourceCode, setPendingSourceCode] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkImportText, setBulkImportText] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showProTips, setShowProTips] = useState(false);
  const [browserUrl, setBrowserUrl] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Theme State
  const [currentTheme, setCurrentTheme] = useState(APP_THEMES[0]);
  
  // Music State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Developer State
  const [isDevMode, setIsDevMode] = useState(false);
  const [showDevPrompt, setShowDevPrompt] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [devPassword, setDevPassword] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [emulators, setEmulators] = useState<Emulator[]>(INITIAL_EMULATORS);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Parallax values
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const backgroundRotate = useTransform(scrollYProgress, [0, 1], [0, 10]);

  // Firebase Real-time Sync
  useEffect(() => {
    testConnection();
    
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recent_searches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });

    const gamesQuery = query(collection(db, "games"), orderBy("title", "asc"));
    const unsubscribeGames = onSnapshot(gamesQuery, (snapshot) => {
      const firebaseGames = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Game[];
      
      const merged = [...INITIAL_GAMES];
      firebaseGames.forEach(fg => {
        const index = merged.findIndex(mg => mg.id === fg.id);
        if (index !== -1) {
          merged[index] = fg;
        } else {
          merged.push(fg);
        }
      });
      setGames(merged);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "games");
    });

    // Real-time Comments
    const commentsQuery = query(collection(db, "comments"), orderBy("createdAt", "desc"));
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Real-time Likes for current user
    let unsubscribeLikes = () => {};
    let unsubscribeUserDoc = () => {};

    if (user) {
      // Actually we just need to know which games the user liked
      unsubscribeLikes = onSnapshot(collection(db, "likes"), (snapshot) => {
        const likedIds = snapshot.docs
          .filter(doc => doc.data().userId === user.uid)
          .map(doc => doc.data().gameId);
        setUserLikes(likedIds);
      });

      // Real-time User Document (for Wishlist)
      unsubscribeUserDoc = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
          setWishlist(doc.data().wishlist || []);
        }
      });
    }

    // Real-time Users for Admin
    let unsubscribeUsers = () => {};
    if (user && (user.email === "fahadgroyne@gmail.com" || user.email === "12345678demox@gmail.com" || user.email === "demoxgroyne@outlook.com")) {
      unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    return () => {
      unsubscribeAuth();
      unsubscribeGames();
      unsubscribeComments();
      unsubscribeLikes();
      unsubscribeUsers();
      unsubscribeUserDoc();
    };
  }, [user]);

  const [newGameForm, setNewGameForm] = useState({
    title: "",
    platform: "PC" as Platform,
    category: "Action",
    downloadUrl: "",
    size: "",
    image: "",
    description: "",
    screenshots: "" // Comma separated URLs
  });

  const filteredGames = games.filter(game => {
    const matchesPlatform = selectedPlatform === 'All' || game.platform === selectedPlatform;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const handleDownload = async (item: Game | Emulator) => {
    if (item.downloadUrl) {
      setIsPreparingDownload(true);
      setDownloadProgress(0);
      
      // Anti-scraper delay
      const duration = 3000;
      const interval = 50;
      const steps = duration / interval;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        setDownloadProgress((currentStep / steps) * 100);
        if (currentStep >= steps) {
          clearInterval(timer);
          setIsPreparingDownload(false);
          setBrowserUrl(item.downloadUrl);
        }
      }, interval);
      
      // Track download in Firestore if it's a game
      if ('id' in item && !item.id.startsWith('emulator-')) {
        const gameRef = doc(db, "games", item.id);
        try {
          const gameSnap = await getDoc(gameRef);
          if (gameSnap.exists()) {
            const currentDownloads = parseInt(gameSnap.data().downloadsCount || "0");
            await updateDoc(gameRef, {
              downloadsCount: currentDownloads + 1,
              downloads: (currentDownloads + 1).toString()
            });
          } else {
            // If it's an initial game not yet in Firestore, we might want to initialize it
            // but for now we only track cloud games
          }
        } catch (err) {
          console.error("Error tracking download:", err);
        }
      }
    }
  };

  const handleLike = async (gameId: string) => {
    if (!user) {
      alert("Please sign in to like games!");
      return;
    }

    const likeId = `${user.uid}_${gameId}`;
    const likeRef = doc(db, "likes", likeId);
    const gameRef = doc(db, "games", gameId);

    try {
      if (userLikes.includes(gameId)) {
        // Unlike
        await deleteDoc(likeRef);
        const gameSnap = await getDoc(gameRef);
        if (gameSnap.exists()) {
          const currentLikes = gameSnap.data().likesCount || 0;
          await updateDoc(gameRef, { likesCount: Math.max(0, currentLikes - 1) });
        }
      } else {
        // Like
        await setDoc(likeRef, {
          userId: user.uid,
          gameId: gameId,
          createdAt: Timestamp.now()
        });
        const gameSnap = await getDoc(gameRef);
        if (gameSnap.exists()) {
          const currentLikes = gameSnap.data().likesCount || 0;
          await updateDoc(gameRef, { likesCount: currentLikes + 1 });
        } else {
          // Initialize game in cloud if it was a base game
          const game = games.find(g => g.id === gameId);
          if (game) {
            await setDoc(gameRef, {
              ...game,
              likesCount: 1,
              createdAt: Timestamp.now()
            });
          }
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "likes");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedGame || !newComment.trim()) return;

    try {
      await addDoc(collection(db, "comments"), {
        gameId: selectedGame.id,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        text: newComment.trim(),
        createdAt: Timestamp.now()
      });
      setNewComment("");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "comments");
    }
  };

  const handleToggleWishlist = async (gameId: string) => {
    if (!user) {
      alert("Please sign in to add games to your wishlist!");
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const newWishlist = wishlist.includes(gameId)
      ? wishlist.filter(id => id !== gameId)
      : [...wishlist, gameId];

    try {
      await updateDoc(userRef, { wishlist: newWishlist });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "users");
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && !recentSearches.includes(query.trim())) {
      const updated = [query.trim(), ...recentSearches].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  const updateTheme = (theme: typeof APP_THEMES[0]) => {
    setCurrentTheme(theme);
    document.documentElement.style.setProperty('--game-primary', theme.primary);
    document.documentElement.style.setProperty('--game-secondary', theme.secondary);
    document.documentElement.style.setProperty('--game-accent', theme.accent);
    
    // Apply background class
    document.body.className = `${theme.bg} text-white transition-colors duration-500`;
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCurrentTrack(file.name);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDevLogin = () => {
    if (devPassword === "DEMOXGROYNE") {
      setIsDevMode(true);
      setShowDevPrompt(false);
      setDevPassword("");
      if (pendingSourceCode) {
        setShowSourceCode(true);
        setPendingSourceCode(false);
      }
    } else {
      alert("Incorrect Password");
    }
  };

  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameForm.title || !newGameForm.downloadUrl) return;

    if (editingId) {
      const gameRef = doc(db, "games", editingId);
      const updatedData = {
        ...newGameForm,
        screenshots: typeof newGameForm.screenshots === 'string' 
          ? newGameForm.screenshots.split(',').map(s => s.trim()).filter(s => s)
          : newGameForm.screenshots
      };
      
      updateDoc(gameRef, updatedData)
        .then(() => {
          setEditingId(null);
          alert("Game updated in Cloud!");
        })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `games/${editingId}`));
    } else {
      const newId = `custom-${Date.now()}`;
      const newGameData = {
        id: newId,
        ...newGameForm,
        screenshots: newGameForm.screenshots ? newGameForm.screenshots.split(',').map(s => s.trim()).filter(s => s) : [],
        rating: 5.0,
        downloads: '0',
        description: newGameForm.description || `Experience ${newGameForm.title} on ${newGameForm.platform}.`,
        createdAt: Timestamp.now(),
        authorUid: user?.uid || 'anonymous'
      };

      setDoc(doc(db, "games", newId), newGameData)
        .then(() => alert("Game added to Cloud!"))
        .catch(err => handleFirestoreError(err, OperationType.CREATE, "games"));
    }
    
    // Reset form
    setNewGameForm({
      title: "",
      platform: "PC",
      category: "Action",
      downloadUrl: "",
      size: "",
      image: "",
      description: "",
      screenshots: ""
    });
  };

  const handleBulkImport = () => {
    try {
      const importedData = JSON.parse(bulkImportText);
      const gamesToAdd = Array.isArray(importedData) ? importedData : [importedData];
      
      const newGames: Game[] = gamesToAdd.map((g: any) => ({
        id: g.id || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: g.title || "Untitled Game",
        platform: g.platform || "PC",
        category: g.category || "Action",
        downloadUrl: g.downloadUrl || "",
        size: g.size || "Unknown",
        image: g.image || "https://picsum.photos/seed/game/800/600",
        description: g.description || `Experience ${g.title} on ${g.platform}.`,
        rating: g.rating || 5.0,
        downloads: g.downloads || "0",
        screenshots: Array.isArray(g.screenshots) ? g.screenshots : (g.screenshots ? g.screenshots.split(',').map((s: string) => s.trim()) : [])
      }));

      const updatedGames = [...games, ...newGames];
      setGames(updatedGames);
      localStorage.setItem('custom_games', JSON.stringify(updatedGames.filter(g => g.id.startsWith('custom-'))));
      setBulkImportText("");
      alert(`Successfully imported ${newGames.length} games!`);
    } catch (err) {
      alert("Invalid JSON format. Please check your database code.");
      console.error(err);
    }
  };

  const startEditing = (game: Game) => {
    setEditingId(game.id);
    setNewGameForm({
      title: game.title,
      platform: game.platform as Platform,
      category: game.category,
      downloadUrl: game.downloadUrl,
      size: game.size,
      image: game.image,
      description: game.description,
      screenshots: Array.isArray(game.screenshots) ? game.screenshots.join(', ') : ""
    });
    // Scroll to form
    const formElement = document.getElementById('add-game-form');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCopyCode = (code: string, fileName: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleShare = async (game: Game) => {
    const shareData = {
      title: game.title,
      text: `Check out ${game.title} on Game Site Online Store!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleDownloadCode = (code: string, fileName: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeGame = (id: string) => {
    deleteDoc(doc(db, "games", id))
      .then(() => alert("Game removed from Cloud!"))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `games/${id}`));
  };

  return (
    <div 
      ref={containerRef} 
      className="min-h-screen bg-slate-950 pb-24 relative overflow-hidden"
      style={{ position: 'relative' }} // Explicitly ensuring non-static position for scroll offset calculation
    >
      {/* 3D Background Elements with Parallax */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          style={{ y: backgroundY, rotate: backgroundRotate }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-game-primary/10 blur-[120px] rounded-full animate-pulse" 
        />
        <motion.div 
          style={{ y: backgroundY, rotate: backgroundRotate, animationDelay: '2s' }}
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-game-secondary/10 blur-[120px] rounded-full animate-pulse" 
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03]" 
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 glass-dark px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-game-primary tracking-tight">GAME SITE ONLINE STORE</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Premium Downloads</p>
        </div>
        <div className="flex gap-4">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-game-primary"
          >
            <Search size={20} />
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('settings')}
            className={`w-10 h-10 rounded-full glass flex items-center justify-center ${activeTab === 'settings' ? 'text-game-accent' : 'text-slate-300'}`}
          >
            <SettingsIcon size={20} />
          </motion.button>
        </div>
      </header>

      <main className="px-6 pt-6">
        <AnimatePresence mode="wait">
          {activeTab === 'games' && (
            <motion.div
              key="games"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Search Bar & Recent Searches */}
              <div className="relative mb-8">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search games..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 px-12 text-sm focus:outline-none focus:border-game-primary/50 transition-colors"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {recentSearches.length > 0 && !searchQuery && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex flex-wrap gap-2"
                  >
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold mr-2">
                      <History size={12} />
                      Recent:
                    </div>
                    {recentSearches.map((s, i) => (
                      <button 
                        key={i}
                        onClick={() => setSearchQuery(s)}
                        className="px-3 py-1 glass rounded-full text-[10px] text-slate-400 hover:text-game-primary hover:border-game-primary/30 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                    <button 
                      onClick={clearRecentSearches}
                      className="text-[10px] text-red-500/50 hover:text-red-500 font-bold uppercase ml-auto"
                    >
                      Clear
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Platform Filter */}
              <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
                <button 
                  onClick={() => setSelectedPlatform('All')}
                  className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedPlatform === 'All' ? 'bg-game-primary text-slate-950 shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'glass text-slate-400'}`}
                >
                  ALL
                </button>
                {PLATFORMS.map(p => (
                  <button 
                    key={p}
                    onClick={() => setSelectedPlatform(p)}
                    className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedPlatform === p ? 'bg-game-primary text-slate-950 shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'glass text-slate-400'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Featured Game */}
              <div className="mb-10">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Featured Today</h3>
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="relative h-64 rounded-3xl overflow-hidden group perspective-1000"
                >
                  <img 
                    src={games[0]?.image || "https://picsum.photos/seed/featured/800/400"} 
                    alt={games[0]?.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-game-accent/20 border border-game-accent/30 rounded text-[10px] font-bold text-game-accent uppercase">{games[0]?.platform}</span>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star size={12} fill="currentColor" />
                        <span className="text-xs font-bold">{games[0]?.rating}</span>
                      </div>
                    </div>
                    <h4 className="text-2xl font-display font-black mb-2">{games[0]?.title}</h4>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => games[0] && handleDownload(games[0])}
                      className="flex items-center gap-2 bg-white text-slate-950 px-6 py-2 rounded-xl font-bold text-sm"
                    >
                      <Download size={16} />
                      Download Now
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              {/* Game Grid */}
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Popular Games</h3>
                  <span className="text-[10px] font-bold text-game-primary uppercase">{filteredGames.length} Found</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {filteredGames.map((game, idx) => (
                    <motion.div 
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ 
                        y: -12,
                        rotateX: 5,
                        rotateY: -5,
                        scale: 1.05,
                        transition: { duration: 0.3, ease: "easeOut" }
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDownload(game)}
                      className="glass-dark rounded-[1.5rem] sm:rounded-[2.5rem] p-3 sm:p-5 flex flex-col gap-3 sm:gap-4 relative overflow-hidden group perspective-1000 preserve-3d shadow-xl hover:shadow-game-primary/20 transition-all border border-white/5 cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-game-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {/* Card Header: Image & Platform */}
                      <div className="relative aspect-[4/3] rounded-[1rem] sm:rounded-[2rem] overflow-hidden shadow-2xl">
                        <img 
                          src={game.image} 
                          alt={game.title} 
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Floating Platform Tag */}
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-full">
                          <span className="text-[8px] sm:text-[10px] font-black text-game-primary uppercase tracking-tighter">{game.platform}</span>
                        </div>

                        {/* Info Button */}
                        <motion.button 
                          whileTap={{ scale: 0.8 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGame(game);
                          }}
                          className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-game-primary hover:text-slate-950 transition-all"
                        >
                          <Info size={14} className="sm:w-5 sm:h-5" />
                        </motion.button>

                        {/* Wishlist Button */}
                        <motion.button 
                          whileTap={{ scale: 0.8 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist(game.id);
                          }}
                          className={`absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all ${wishlist.includes(game.id) ? 'bg-game-accent text-white border-game-accent' : 'bg-black/40 text-white/70 border-white/10 hover:bg-black/60'}`}
                        >
                          <Bookmark size={14} fill={wishlist.includes(game.id) ? "currentColor" : "none"} className="sm:w-5 sm:h-5" />
                        </motion.button>
                        {/* Rating Badge */}
                        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-1">
                          <Star size={8} className="text-yellow-400 fill-yellow-400 sm:w-2.5 sm:h-2.5" />
                          <span className="text-[8px] sm:text-[10px] font-bold text-white">{game.rating}</span>
                        </div>
                      </div>

                      {/* Card Body: Info */}
                      <div className="flex-1 space-y-2 sm:space-y-3">
                        <div>
                          <p className="text-[8px] sm:text-[10px] text-game-accent font-black uppercase tracking-widest mb-0.5 sm:mb-1">{game.category}</p>
                          <h4 className="font-display font-black text-sm sm:text-lg leading-tight group-hover:text-game-primary transition-colors line-clamp-1">{game.title}</h4>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <div className="flex items-center gap-2 sm:gap-4">
                            <div className="flex flex-col">
                              <span className="text-[7px] sm:text-[8px] text-slate-500 uppercase font-bold">Size</span>
                              <span className="text-[8px] sm:text-[10px] font-mono text-slate-300">{game.size}</span>
                            </div>
                            <div className="hidden xs:flex flex-col">
                              <span className="text-[7px] sm:text-[8px] text-slate-500 uppercase font-bold">DLs</span>
                              <span className="text-[8px] sm:text-[10px] font-mono text-slate-300">{game.downloads}</span>
                            </div>
                          </div>

                          <motion.button 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(game);
                            }}
                            className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-game-primary to-game-secondary flex items-center justify-center text-slate-950 shadow-lg shadow-game-primary/20"
                          >
                            <Download size={14} className="sm:w-5 sm:h-5" strokeWidth={3} />
                          </motion.button>
                        </div>
                      </div>

                      {/* 3D Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'roms' && (
            <motion.div
              key="roms"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-display font-bold text-game-primary">ROMs & Emulators</h3>
              <div className="grid grid-cols-1 gap-4">
                {emulators.map(emu => (
                  <motion.div 
                    key={emu.id}
                    onClick={() => handleDownload(emu)}
                    whileHover={{ scale: 1.01 }}
                    className="glass-dark p-4 rounded-3xl flex items-center gap-4 group cursor-pointer hover:border-game-primary/30 transition-all"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <img 
                        src={emu.icon} 
                        alt={emu.name} 
                        className="w-10 h-10 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-sm">{emu.name}</h4>
                        <span className="text-[10px] font-bold text-game-primary bg-game-primary/10 px-2 py-0.5 rounded uppercase">{emu.platform}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">{emu.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">{emu.version}</span>
                        <motion.button 
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDownload(emu)}
                          className="text-[10px] font-bold text-game-accent uppercase flex items-center gap-1"
                        >
                          <Download size={12} />
                          Download
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="glass-dark p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold">How to install ROMs?</h4>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('guides')}
                    className="text-[10px] font-black text-game-primary uppercase border border-game-primary/30 px-3 py-1 rounded-lg"
                  >
                    View Setup Guides
                  </motion.button>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-game-primary/20 flex items-center justify-center text-game-primary text-[10px] font-bold flex-shrink-0">1</div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-white font-bold">Download Emulator:</span> Go to the list above and download the emulator matching your platform (e.g., PPSSPP for PSP games).
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-game-primary/20 flex items-center justify-center text-game-primary text-[10px] font-bold flex-shrink-0">2</div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-white font-bold">Get Game File:</span> Download the game from our <span className="text-game-accent">Games</span> tab. Files are usually in .ISO, .CSO, or .BIN format.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-game-primary/20 flex items-center justify-center text-game-primary text-[10px] font-bold flex-shrink-0">3</div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-white font-bold">Organize Storage:</span> Place your games in a dedicated folder on your device (e.g., /Games/PSP/).
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-game-primary/20 flex items-center justify-center text-game-primary text-[10px] font-bold flex-shrink-0">4</div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-white font-bold">Load & Play:</span> Open the emulator, navigate to your folder, and select the game.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'guides' && (
            <motion.div
              key="guides"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-display font-bold text-game-primary">Setup Guides</h3>
                <button onClick={() => setActiveTab('roms')} className="text-xs text-slate-500 font-bold uppercase">Back</button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {GUIDES.map(guide => (
                  <motion.div 
                    key={guide.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedGuide(guide)}
                    className="glass-dark p-5 rounded-3xl flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-game-accent">
                        <Info size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold">{guide.emulator} Guide</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{guide.platform} Platform</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-700 group-hover:text-game-primary transition-colors" />
                  </motion.div>
                ))}
              </div>

              <AnimatePresence>
                {selectedGuide && (
                  <motion.div 
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed inset-0 z-[80] bg-slate-950 p-6 overflow-y-auto no-scrollbar"
                  >
                    <div className="max-w-md mx-auto space-y-8 pb-12">
                      <header className="flex items-center justify-between">
                        <h3 className="text-2xl font-display font-black text-game-primary uppercase">{selectedGuide.emulator} SETUP</h3>
                        <button 
                          onClick={() => setSelectedGuide(null)}
                          className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400"
                        >
                          <X size={20} />
                        </button>
                      </header>

                      <section className="space-y-6">
                        <h4 className="text-xs font-black text-game-accent uppercase tracking-[0.2em]">Installation Steps</h4>
                        <div className="space-y-4">
                          {selectedGuide.steps.map((step, i) => (
                            <div key={i} className="flex gap-4">
                              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-game-primary font-mono text-sm flex-shrink-0">
                                {i + 1}
                              </div>
                              <p className="text-sm text-slate-300 leading-relaxed pt-1">{step}</p>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="space-y-4">
                        <h4 className="text-xs font-black text-game-primary uppercase tracking-[0.2em]">Pro Tips</h4>
                        <div className="glass-dark rounded-[2rem] p-6 space-y-4">
                          {selectedGuide.tips.map((tip, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-game-accent mt-1.5 flex-shrink-0" />
                              <p className="text-xs text-slate-400 leading-relaxed italic">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </section>

                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedGuide(null)}
                        className="w-full py-4 glass rounded-2xl text-xs font-black uppercase tracking-widest text-slate-300"
                      >
                        Close Guide
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'platforms' && (
            <motion.div
              key="platforms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-display font-bold text-game-accent">Gaming Platforms</h3>
              <div className="grid grid-cols-1 gap-4">
                {PLATFORMS.map(p => (
                  <motion.div 
                    key={p}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedPlatform(p);
                      setActiveTab('games');
                    }}
                    className="glass-dark p-5 rounded-3xl flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-game-primary group-hover:text-game-accent transition-colors">
                        <Gamepad2 size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold">{p}</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Explore Games</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-700 group-hover:text-game-accent transition-colors" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'apps' && (
            <motion.div
              key="apps"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-display font-black text-game-primary uppercase tracking-tight">Official Apps</h3>
                <p className="text-xs text-slate-500 uppercase tracking-[0.3em] font-bold">Game Site Online Products</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {OFFICIAL_PRODUCTS.map((product, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -5 }}
                    onClick={() => setBrowserUrl(product.url)}
                    className="glass-dark rounded-[2.5rem] p-8 border border-white/5 hover:border-game-primary/30 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-game-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-game-primary/10 transition-colors" />
                    
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-game-primary shadow-2xl group-hover:scale-110 transition-transform">
                        {product.icon === 'Globe' ? <Globe size={32} /> : <Zap size={32} />}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-display font-black group-hover:text-game-primary transition-colors">{product.name}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mt-1">{product.description}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-500 group-hover:text-game-primary transition-colors">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="glass-dark rounded-3xl p-6 border border-white/5 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">More products coming soon</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-game-primary to-game-secondary p-[1px]">
                  <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
                    <Gamepad2 size={32} className="text-game-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold">User Settings</h3>
                  <p className="text-xs text-slate-500">v1.0.4 Stable Build</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* User Profile Section */}
                <div className="glass-dark p-6 rounded-3xl border border-white/5 mb-3">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-black text-game-primary uppercase tracking-[0.2em]">User Profile</h4>
                    {user ? (
                      <button 
                        onClick={() => auth.signOut()}
                        className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    ) : (
                      <button 
                        onClick={loginWithGoogle}
                        className="flex items-center gap-2 text-game-primary text-[10px] font-bold uppercase"
                      >
                        <LogIn size={14} />
                        Sign In
                      </button>
                    )}
                  </div>

                  {user ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-game-primary/30">
                          <img src={user.photoURL || ""} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h5 className="font-display font-black text-lg">{user.displayName}</h5>
                          <p className="text-xs text-slate-500">{user.email}</p>
                          <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 bg-game-primary/10 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-game-primary animate-pulse" />
                            <span className="text-[10px] font-black text-game-primary uppercase">Online</span>
                          </div>
                        </div>
                      </div>

                      {wishlist.length > 0 && (
                        <div className="pt-4 border-t border-white/5">
                          <div className="flex items-center gap-3 mb-4">
                            <Bookmark size={16} className="text-game-accent" />
                            <h4 className="text-[10px] font-black text-game-accent uppercase tracking-widest">My Wishlist ({wishlist.length})</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {games.filter(g => wishlist.includes(g.id)).slice(0, 4).map(game => (
                              <motion.div 
                                key={game.id} 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setSelectedGame(game);
                                  setActiveTab('games');
                                }}
                                className="glass p-2 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                              >
                                <img src={game.image} className="w-8 h-8 rounded-lg object-cover" alt="" loading="lazy" />
                                <div className="min-w-0">
                                  <p className="text-[9px] font-bold truncate">{game.title}</p>
                                  <p className="text-[7px] text-slate-500 uppercase">{game.platform}</p>
                                </div>
                              </motion.div>
                            ))}
                            {wishlist.length > 4 && (
                              <button 
                                onClick={() => setActiveTab('games')}
                                className="col-span-2 text-center py-2 text-[8px] font-black text-slate-500 uppercase tracking-widest hover:text-game-primary transition-colors"
                              >
                                View all in store
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <UserIcon size={32} className="mx-auto mb-3 text-slate-700" />
                      <p className="text-xs text-slate-500 mb-4">Sign in to sync your data across devices.</p>
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={loginWithGoogle}
                        className="w-full bg-white text-black font-black py-3 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
                        Sign in with Google
                      </motion.button>
                    </div>
                  )}
                </div>

                <SettingsItem icon={<Gamepad2 size={20} />} label="Games Library" sub={`${games.length} Games Available`} />
                
                {/* Theme Switcher */}
                <div className="glass-dark rounded-2xl p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-game-primary">
                      <Palette size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">App Theme</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{currentTheme.type} Mode</p>
                    </div>
                  </div>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {APP_THEMES.map(t => (
                      <button 
                        key={t.name}
                        onClick={() => updateTheme(t)}
                        className={`w-12 h-12 rounded-xl border-2 transition-all flex-shrink-0 relative group ${currentTheme.name === t.name ? 'border-white scale-110' : 'border-transparent opacity-60'}`}
                        style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})` }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-1 h-1 rounded-full bg-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Music Player */}
                <div className="glass-dark rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-game-accent">
                        <Music size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">Background Music</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider line-clamp-1">{currentTrack || "No file selected"}</p>
                      </div>
                    </div>
                    <label className="cursor-pointer glass px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase hover:bg-white/20 transition-colors">
                      Upload
                      <input type="file" accept="audio/*" onChange={handleMusicUpload} className="hidden" />
                    </label>
                  </div>
                  {currentTrack && (
                    <div className="flex items-center justify-center gap-6">
                      <SkipBack size={20} className="text-slate-500" />
                      <button 
                        onClick={toggleMusic}
                        className="w-12 h-12 rounded-full bg-game-accent flex items-center justify-center text-white shadow-lg shadow-game-accent/20"
                      >
                        {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                      </button>
                      <SkipForward size={20} className="text-slate-500" />
                    </div>
                  )}
                  <audio ref={audioRef} loop className="hidden" />
                </div>

                <SettingsItem 
                  icon={<Info size={20} />} 
                  label="Pro Tips" 
                  sub={`${PRO_TIPS.length} Expert Guides`} 
                  onClick={() => setShowProTips(true)}
                />
                <SettingsItem 
                  icon={<Share2 size={20} />} 
                  label="Social Support" 
                  sub="Join our community" 
                  onClick={() => setShowSocial(true)}
                />
                
                {/* Developer Options */}
                <div className="pt-4">
                  {!isDevMode ? (
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDevPrompt(true)}
                      className="w-full glass-dark rounded-2xl p-4 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-500 group-hover:text-game-primary transition-colors">
                          <Lock size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">Developer Options</h4>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Protected Access</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-600" />
                    </motion.button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-xs font-black text-game-primary uppercase tracking-widest">Dev Mode Active</h4>
                        <button onClick={() => setIsDevMode(false)} className="text-[10px] text-red-500 font-bold uppercase">Logout</button>
                      </div>
                      <motion.button 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAdminPanel(true)}
                        className="w-full bg-game-primary/10 border border-game-primary/30 rounded-2xl p-4 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-game-primary">
                            <Plus size={20} />
                          </div>
                          <span className="font-bold text-sm">Open Admin Panel</span>
                        </div>
                        <ExternalLink size={18} className="text-game-primary" />
                      </motion.button>
                    </div>
                  )}
                </div>

                <SettingsItem 
                  icon={isDevMode ? <Code size={20} /> : <Lock size={20} />} 
                  label="Source Code" 
                  sub={isDevMode ? "View & Download Code" : "Protected Access"} 
                  onClick={() => {
                    if (isDevMode) {
                      setShowSourceCode(true);
                    } else {
                      setPendingSourceCode(true);
                      setShowDevPrompt(true);
                    }
                  }}
                />
                <SettingsItem icon={<Heart size={20} />} label="Donate & Support" sub="Help us grow" />
              </div>

              {/* Pro Tips Modal */}
              <AnimatePresence>
                {showProTips && (
                  <motion.div 
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    className="fixed inset-0 z-[110] bg-slate-950 flex flex-col"
                  >
                    <header className="p-6 flex items-center justify-between border-b border-white/10 sticky top-0 bg-slate-950 z-20">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-game-accent/20 flex items-center justify-center text-game-accent">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <h3 className="font-display font-black text-xl uppercase tracking-tight">Pro Tips</h3>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Expert Gaming Guides</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowProTips(false)}
                        className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white"
                      >
                        <X size={20} />
                      </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                      <div className="glass-dark p-6 rounded-3xl border border-game-accent/20 mb-6">
                        <h4 className="font-bold text-game-accent mb-2">Master the Store</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Explore our curated collection of expert tips to optimize your gaming performance, save storage, and get the most out of every emulator.
                        </p>
                      </div>

                      <div className="grid gap-4">
                        {PRO_TIPS.map((tip, i) => (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-dark p-5 rounded-3xl border border-white/5 group hover:border-game-primary/30 transition-all"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="px-2 py-0.5 bg-game-primary/10 text-game-primary text-[8px] font-black uppercase tracking-widest rounded-md">
                                {tip.category}
                              </span>
                              <div className="w-1.5 h-1.5 rounded-full bg-game-primary/30 group-hover:bg-game-primary transition-colors" />
                            </div>
                            <h5 className="font-bold text-sm mb-2 group-hover:text-game-primary transition-colors">{tip.title}</h5>
                            <p className="text-xs text-slate-500 leading-relaxed">{tip.text}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Anti-Scraper Loading Overlay */}
              <AnimatePresence>
                {isPreparingDownload && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-8"
                  >
                    <div className="w-full max-w-xs text-center space-y-6">
                      <div className="relative w-24 h-24 mx-auto">
                        <svg className="w-full h-full rotate-[-90deg]">
                          <circle
                            cx="48"
                            cy="48"
                            r="44"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-slate-800"
                          />
                          <motion.circle
                            cx="48"
                            cy="48"
                            r="44"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeDasharray="276.46"
                            strokeDashoffset={276.46 - (276.46 * downloadProgress) / 100}
                            className="text-game-primary"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Zap size={32} className="text-game-primary animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-black text-white uppercase tracking-tight mb-2">Securing Connection</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Anti-Bot Verification in Progress...</p>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-game-primary"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-slate-600 uppercase font-black">Please wait while we prepare your secure link</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* In-App Browser Modal */}
              <AnimatePresence>
                {browserUrl && (
                  <motion.div 
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    className="fixed inset-0 z-[200] bg-slate-950 flex flex-col"
                  >
                    <header className="p-4 flex items-center justify-between border-b border-white/10 bg-slate-900 sticky top-0 z-20">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button 
                          onClick={() => setBrowserUrl(null)}
                          className="w-8 h-8 rounded-full glass flex items-center justify-center text-slate-400"
                        >
                          <X size={18} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Globe size={12} className="text-game-primary" />
                            <p className="text-[10px] text-slate-400 truncate uppercase tracking-widest font-bold">{new URL(browserUrl).hostname}</p>
                          </div>
                          <p className="text-[8px] text-slate-600 truncate">{browserUrl}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="w-8 h-8 rounded-full glass flex items-center justify-center text-slate-500"><ArrowLeft size={16} /></button>
                        <button className="w-8 h-8 rounded-full glass flex items-center justify-center text-slate-500"><ArrowRight size={16} /></button>
                        <button className="w-8 h-8 rounded-full glass flex items-center justify-center text-slate-400"><RotateCcw size={16} /></button>
                        <button 
                          onClick={() => window.open(browserUrl, '_blank')}
                          className="w-8 h-8 rounded-full bg-game-primary/20 flex items-center justify-center text-game-primary"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </header>
                    <div className="flex-1 bg-white relative">
                      <iframe 
                        src={browserUrl} 
                        className="w-full h-full border-none"
                        title="In-App Browser"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 pointer-events-none border-t border-white/10" />
                    </div>
                    <footer className="p-3 bg-slate-900 border-t border-white/10 text-center">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Secure In-App Browser</p>
                    </footer>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {showSourceCode && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="fixed inset-0 z-[100] bg-slate-950 flex flex-col"
                  >
                    <header className="p-6 flex items-center justify-between border-b border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-game-primary/20 flex items-center justify-center text-game-primary">
                          <Code size={20} />
                        </div>
                        <div>
                          <h3 className="font-display font-black text-xl uppercase tracking-tight">Source Code</h3>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Project Explorer</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowSourceCode(false)}
                        className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white"
                      >
                        <X size={20} />
                      </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                      <div className="glass-dark p-6 rounded-3xl border border-game-primary/20">
                        <h4 className="font-bold text-game-primary mb-2">Developer Note</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          This project is built with <span className="text-white font-bold">React 19</span>, <span className="text-white font-bold">Vite</span>, and <span className="text-white font-bold">Tailwind CSS</span>. You can view individual files below, copy their content, or download them. To download the entire project structure, please use the <span className="text-game-accent font-bold">Export</span> feature in the AI Studio settings menu.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {[
                          { name: 'App.tsx', path: 'src/App.tsx', type: 'typescript' },
                          { name: 'constants.ts', path: 'src/constants.ts', type: 'typescript' },
                          { name: 'types.ts', path: 'src/types.ts', type: 'typescript' },
                          { name: 'index.css', path: 'src/index.css', type: 'css' },
                          { name: 'package.json', path: 'package.json', type: 'json' }
                        ].map((file) => (
                          <div key={file.name} className="glass-dark rounded-2xl overflow-hidden border border-white/5">
                            <div className="p-4 flex items-center justify-between bg-white/5">
                              <div className="flex items-center gap-3">
                                <FileCode size={18} className="text-game-primary" />
                                <span className="text-sm font-bold font-mono">{file.name}</span>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleCopyCode(SOURCE_CODE[file.name] || "// Content not found", file.name)}
                                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                                  title="Copy Code"
                                >
                                  {copiedFile === file.name ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                                <button 
                                  onClick={() => handleDownloadCode(SOURCE_CODE[file.name] || "// Content not found", file.name)}
                                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                                  title="Download File"
                                >
                                  <Download size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="p-4 bg-black/40">
                              <pre className="text-[10px] font-mono text-slate-500 overflow-x-auto whitespace-pre-wrap max-h-40">
                                {SOURCE_CODE[file.name] ? SOURCE_CODE[file.name].substring(0, 300) + "..." : `// Path: ${file.path}\n// Click copy or download to get the full source code for this file.`}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="glass-dark p-6 rounded-3xl border border-dashed border-white/10 text-center">
                        <Github size={32} className="mx-auto mb-4 text-slate-700" />
                        <h5 className="font-bold mb-2">Want the full repository?</h5>
                        <p className="text-xs text-slate-500 mb-6">You can export this entire project to GitHub or download as a ZIP from the AI Studio platform settings.</p>
                        <a 
                          href="https://github.com/Gamesiteonline" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-white text-slate-950 px-6 py-2 rounded-xl font-bold text-sm"
                        >
                          <ExternalLink size={16} />
                          Visit GitHub
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {selectedGame && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="fixed inset-0 z-[90] bg-slate-950 flex flex-col overflow-y-auto no-scrollbar"
                  >
                    {/* Hero Section */}
                    <div className="relative h-[45vh] flex-shrink-0">
                      <img 
                        src={selectedGame.image} 
                        alt={selectedGame.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                      
                      <motion.button 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setSelectedGame(null)}
                        className="absolute top-6 left-6 w-10 h-10 rounded-full glass flex items-center justify-center text-white z-10"
                      >
                        <X size={20} />
                      </motion.button>

                      <div className="absolute bottom-8 left-8 right-8">
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 mb-3"
                        >
                          <span className="px-3 py-1 bg-game-primary/20 border border-game-primary/30 rounded-full text-[10px] font-black text-game-primary uppercase tracking-widest">{selectedGame.platform}</span>
                          <span className="px-3 py-1 bg-game-accent/20 border border-game-accent/30 rounded-full text-[10px] font-black text-game-accent uppercase tracking-widest">{selectedGame.category}</span>
                        </motion.div>
                        <motion.h2 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="text-4xl font-display font-black text-white mb-2"
                        >
                          {selectedGame.title}
                        </motion.h2>
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-center gap-4"
                        >
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star size={14} fill="currentColor" />
                            <span className="text-sm font-bold">{selectedGame.rating}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <Download size={14} />
                            <span className="text-sm font-bold">{selectedGame.downloads}</span>
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="px-8 py-8 space-y-8">
                      <div className="flex gap-4">
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDownload(selectedGame)}
                          className="flex-1 bg-game-primary text-slate-950 h-14 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,242,255,0.3)]"
                        >
                          <Download size={20} strokeWidth={3} />
                          Download ({selectedGame.size})
                        </motion.button>
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleLike(selectedGame.id)}
                          className={`w-14 h-14 glass rounded-2xl flex items-center justify-center transition-colors ${userLikes.includes(selectedGame.id) ? 'text-red-500 bg-red-500/10 border-red-500/30' : 'text-white'}`}
                        >
                          <Heart size={20} fill={userLikes.includes(selectedGame.id) ? "currentColor" : "none"} />
                        </motion.button>
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleShare(selectedGame)}
                          className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-white"
                        >
                          <Share2 size={20} />
                        </motion.button>
                      </div>

                      <section>
                        <h4 className="text-xs font-black text-game-primary uppercase tracking-[0.2em] mb-4">Description</h4>
                        <p className="text-slate-400 leading-relaxed text-sm">
                          {selectedGame.description}
                        </p>
                      </section>

                      {/* Comments Section */}
                      <section>
                        <h4 className="text-xs font-black text-game-primary uppercase tracking-[0.2em] mb-6">Community Comments</h4>
                        
                        {user ? (
                          <form onSubmit={handleAddComment} className="mb-8">
                            <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                                <img src={user.photoURL || ""} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 space-y-3">
                                <textarea 
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder="Write a comment..."
                                  className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-game-primary h-24 resize-none"
                                />
                                <motion.button 
                                  whileTap={{ scale: 0.98 }}
                                  type="submit"
                                  disabled={!newComment.trim()}
                                  className="bg-game-primary text-slate-950 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                                >
                                  Post Comment
                                </motion.button>
                              </div>
                            </div>
                          </form>
                        ) : (
                          <div className="glass-dark p-6 rounded-3xl text-center mb-8 border border-dashed border-white/10">
                            <p className="text-xs text-slate-500 mb-4">Sign in to join the conversation.</p>
                            <button onClick={loginWithGoogle} className="text-game-primary font-black text-[10px] uppercase tracking-widest">Sign In Now</button>
                          </div>
                        )}

                        <div className="space-y-6">
                          {comments.filter(c => c.gameId === selectedGame.id).map(comment => (
                            <div key={comment.id} className="flex gap-4">
                              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900">
                                <img src={comment.userPhoto} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="text-sm font-bold">{comment.userName}</h5>
                                  <span className="text-[10px] text-slate-500">
                                    {comment.createdAt?.toDate().toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                          {comments.filter(c => c.gameId === selectedGame.id).length === 0 && (
                            <div className="text-center py-8">
                              <MessageCircle size={32} className="mx-auto mb-3 text-slate-800" />
                              <p className="text-xs text-slate-600 italic">No comments yet. Be the first!</p>
                            </div>
                          )}
                        </div>
                      </section>

                      {selectedGame.screenshots && selectedGame.screenshots.length > 0 && (
                        <section>
                          <h4 className="text-xs font-black text-game-primary uppercase tracking-[0.2em] mb-4">Screenshots</h4>
                          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                            {selectedGame.screenshots.map((screen, i) => (
                              <motion.div 
                                key={i}
                                whileHover={{ scale: 1.05 }}
                                className="w-64 aspect-video rounded-2xl overflow-hidden flex-shrink-0 border border-white/10"
                              >
                                <img src={screen} alt={`Screenshot ${i+1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </motion.div>
                            ))}
                          </div>
                        </section>
                      )}

                      <section className="pb-12">
                        <h4 className="text-xs font-black text-game-primary uppercase tracking-[0.2em] mb-4">Game Info</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="glass-dark p-4 rounded-2xl">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Platform</p>
                            <p className="text-sm font-bold">{selectedGame.platform}</p>
                          </div>
                          <div className="glass-dark p-4 rounded-2xl">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Category</p>
                            <p className="text-sm font-bold">{selectedGame.category}</p>
                          </div>
                          <div className="glass-dark p-4 rounded-2xl">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">File Size</p>
                            <p className="text-sm font-bold">{selectedGame.size}</p>
                          </div>
                          <div className="glass-dark p-4 rounded-2xl">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Rating</p>
                            <p className="text-sm font-bold">{selectedGame.rating} / 5.0</p>
                          </div>
                        </div>
                      </section>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {showAdminPanel && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="fixed inset-0 z-[70] bg-slate-950 flex flex-col"
                  >
                    <header className="p-6 flex items-center justify-between border-b border-white/10 sticky top-0 bg-slate-950 z-20">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-game-primary/20 flex items-center justify-center text-game-primary">
                          <Lock size={20} />
                        </div>
                        <div>
                          <h3 className="font-display font-black text-xl uppercase tracking-tight">Admin Panel</h3>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Database Management</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setShowAdminPanel(false);
                          setEditingId(null);
                          setNewGameForm({
                            title: "",
                            platform: "PC",
                            category: "Action",
                            downloadUrl: "",
                            size: "",
                            image: "",
                            description: "",
                            screenshots: ""
                          });
                        }}
                        className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white"
                      >
                        <X size={20} />
                      </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 space-y-12 no-scrollbar">
                      {/* User Monitoring Section */}
                      <section>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-lg bg-game-primary/20 flex items-center justify-center text-game-primary">
                            <UserIcon size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-game-primary uppercase tracking-[0.2em]">Active Users</h4>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest">{allUsers.length} Registered Accounts</p>
                          </div>
                        </div>
                        <div className="grid gap-3">
                          {allUsers.map(u => (
                            <div key={u.id} className="glass-dark p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                                  <img src={u.photoURL || ""} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <h5 className="text-sm font-bold">{u.displayName}</h5>
                                  <p className="text-[10px] text-slate-500">{u.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${u.role === 'admin' ? 'bg-game-primary/20 text-game-primary' : 'bg-slate-800 text-slate-400'}`}>
                                  {u.role}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* Add/Edit Game Form */}
                      <section id="add-game-form">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-xs font-black text-game-primary uppercase tracking-[0.2em]">{editingId ? 'Edit Game' : 'Add New Game'}</h4>
                          {editingId && (
                            <button 
                              onClick={() => {
                                setEditingId(null);
                                setNewGameForm({
                                  title: "",
                                  platform: "PC",
                                  category: "Action",
                                  downloadUrl: "",
                                  size: "",
                                  image: "",
                                  description: "",
                                  screenshots: ""
                                });
                              }}
                              className="text-[10px] text-red-500 font-bold uppercase"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>
                        <form onSubmit={handleAddGame} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Platform</label>
                              <select 
                                value={newGameForm.platform}
                                onChange={(e) => setNewGameForm({...newGameForm, platform: e.target.value as Platform})}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-game-primary appearance-none"
                              >
                                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Category</label>
                              <input 
                                type="text"
                                placeholder="Action, RPG, etc."
                                value={newGameForm.category}
                                onChange={(e) => setNewGameForm({...newGameForm, category: e.target.value})}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-game-primary"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Game Title</label>
                            <input 
                              type="text"
                              placeholder="Enter game name"
                              value={newGameForm.title}
                              onChange={(e) => setNewGameForm({...newGameForm, title: e.target.value})}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-game-primary"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Download Link</label>
                            <input 
                              type="url"
                              placeholder="https://..."
                              value={newGameForm.downloadUrl}
                              onChange={(e) => setNewGameForm({...newGameForm, downloadUrl: e.target.value})}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-game-primary"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Game Size</label>
                              <input 
                                type="text"
                                placeholder="e.g. 1.2GB"
                                value={newGameForm.size}
                                onChange={(e) => setNewGameForm({...newGameForm, size: e.target.value})}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-game-primary"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Cover Image URL</label>
                              <input 
                                type="url"
                                placeholder="https://..."
                                value={newGameForm.image}
                                onChange={(e) => setNewGameForm({...newGameForm, image: e.target.value})}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-game-primary"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Screenshots (Comma separated URLs)</label>
                            <input 
                              type="text"
                              placeholder="https://img1.jpg, https://img2.jpg"
                              value={newGameForm.screenshots}
                              onChange={(e) => setNewGameForm({...newGameForm, screenshots: e.target.value})}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-game-primary"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Description (Optional)</label>
                            <textarea 
                              placeholder="Brief game description..."
                              value={newGameForm.description}
                              onChange={(e) => setNewGameForm({...newGameForm, description: e.target.value})}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-game-primary h-24 resize-none"
                            />
                          </div>

                          <motion.button 
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="w-full bg-game-primary text-slate-950 font-black py-4 rounded-2xl uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(0,242,255,0.3)]"
                          >
                            {editingId ? 'Update Game Details' : 'Add to Database'}
                          </motion.button>
                        </form>
                      </section>

                      {/* Bulk Import Section */}
                      <section className="glass-dark p-6 rounded-3xl border border-white/5">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-lg bg-game-accent/20 flex items-center justify-center text-game-accent">
                            <Database size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-game-accent uppercase tracking-[0.2em]">Bulk Database Import</h4>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Paste JSON Array</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <textarea 
                            value={bulkImportText}
                            onChange={(e) => setBulkImportText(e.target.value)}
                            placeholder='[{"title": "Game 1", "platform": "PS2", ...}, ...]'
                            className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono focus:outline-none focus:border-game-accent h-32 resize-none"
                          />
                          <motion.button 
                            whileTap={{ scale: 0.98 }}
                            onClick={handleBulkImport}
                            className="w-full bg-game-accent/10 border border-game-accent/30 text-game-accent font-black py-3 rounded-xl uppercase tracking-widest text-[10px] hover:bg-game-accent hover:text-slate-950 transition-all"
                          >
                            Process Bulk Import
                          </motion.button>
                        </div>
                      </section>

                      {/* Manage Games */}
                      <section className="pb-12">
                        <div className="flex flex-col gap-4 mb-6">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-game-accent uppercase tracking-[0.2em]">Manage All Games</h4>
                            <span className="text-[10px] font-bold text-slate-500">{games.length} Total</span>
                          </div>
                          
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                              type="text"
                              placeholder="Search games to manage..."
                              value={adminSearch}
                              onChange={(e) => setAdminSearch(e.target.value)}
                              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-game-primary"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          {games.filter(g => g.title.toLowerCase().includes(adminSearch.toLowerCase())).map(g => (
                            <div key={g.id} className="glass-dark p-4 rounded-2xl flex items-center justify-between group border border-white/5 hover:border-game-primary/20 transition-all">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                                  <img src={g.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div>
                                  <h5 className="font-bold text-sm line-clamp-1">{g.title}</h5>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-slate-400 font-bold uppercase">{g.platform}</span>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">{g.category}</span>
                                    {g.id.startsWith('custom-') && (
                                      <span className="text-[9px] px-1.5 py-0.5 bg-game-primary/10 text-game-primary rounded font-bold uppercase">Custom</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => startEditing(g)}
                                  className="w-10 h-10 rounded-xl bg-game-primary/10 text-game-primary flex items-center justify-center hover:bg-game-primary hover:text-slate-950 transition-all"
                                  title="Edit Game"
                                >
                                  <Edit size={18} />
                                </button>
                                <button 
                                  onClick={() => {
                                    if(confirm(`Are you sure you want to remove "${g.title}"?`)) {
                                      removeGame(g.id);
                                    }
                                  }}
                                  className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                  title="Remove Game"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                          {games.length === 0 && (
                            <div className="text-center py-12 glass-dark rounded-3xl border-dashed border-white/5">
                              <Gamepad2 size={32} className="mx-auto mb-3 text-slate-700" />
                              <p className="text-xs text-slate-500 italic">No games in database.</p>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {showDevPrompt && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center px-6 bg-slate-950/90 backdrop-blur-xl"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-full max-w-xs glass-dark rounded-3xl p-6 text-center"
                    >
                      <Lock size={32} className="mx-auto mb-4 text-game-primary" />
                      <h3 className="font-bold mb-2">Developer Access</h3>
                      <p className="text-xs text-slate-500 mb-6">Enter password to unlock developer tools.</p>
                      <input 
                        type="password" 
                        value={devPassword}
                        onChange={(e) => setDevPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-center mb-4 focus:outline-none focus:border-game-primary"
                      />
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setShowDevPrompt(false)}
                          className="flex-1 glass py-3 rounded-xl text-xs font-bold uppercase"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleDevLogin}
                          className="flex-1 bg-game-primary text-slate-950 py-3 rounded-xl text-xs font-bold uppercase"
                        >
                          Unlock
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showSocial && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-slate-950/90 backdrop-blur-xl"
                  >
                    <motion.div 
                      initial={{ scale: 0.8, rotateY: 45, opacity: 0 }}
                      animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                      exit={{ scale: 0.8, rotateY: -45, opacity: 0 }}
                      transition={{ type: "spring", damping: 20, stiffness: 100 }}
                      className="w-full max-w-md glass-dark rounded-[2.5rem] p-8 relative overflow-hidden"
                    >
                      <button 
                        onClick={() => setShowSocial(false)}
                        className="absolute top-6 right-6 w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                      >
                        <X size={20} />
                      </button>

                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-display font-black text-game-primary mb-2">CONNECT WITH US</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-[0.3em]">Official Channels</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto no-scrollbar py-2">
                        {SOCIAL_LINKS.map((social, idx) => (
                          <motion.button
                            key={social.name}
                            onClick={() => {
                              setBrowserUrl(social.url);
                              setShowSocial(false);
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ 
                              scale: 1.05, 
                              rotateX: -5,
                              rotateY: 5,
                              translateZ: 20
                            }}
                            whileTap={{ scale: 0.95 }}
                            className={`${social.color} p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg perspective-500`}
                          >
                            <div className="w-10 h-10 flex items-center justify-center">
                              {social.icon || <Share2 size={20} />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tighter text-center">{social.name}</span>
                          </motion.button>
                        ))}
                      </div>

                      <div className="mt-8 text-center">
                        <p className="text-[10px] text-slate-600 uppercase font-bold">© 2024 Game Site Online Store</p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4 mt-8">
                <div className="glass-dark rounded-3xl p-6">
                  <h4 className="font-display font-black text-game-primary uppercase tracking-wider mb-3">About GAME SITE ONLINE STORE</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    GAME SITE ONLINE STORE is the premier hub for retro and modern gaming enthusiasts. Our mission is to preserve gaming history by providing easy access to high-quality ROMs, emulators, and setup guides. We believe that every classic game deserves to be played and enjoyed by new generations, regardless of the original hardware. We provide a secure, fast, and curated library to ensure your gaming journey is smooth and nostalgic.
                  </p>
                </div>

                <div className="glass-dark rounded-3xl p-6 border border-game-accent/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-game-accent to-game-secondary flex items-center justify-center text-white font-black text-xl">
                      F
                    </div>
                    <div>
                      <h4 className="font-display font-black text-game-accent uppercase tracking-wider">The Developer</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Fahad Mohamed</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Fahad Mohamed is a visionary full-stack developer and the creative force behind GAME SITE ONLINE STORE. With a deep passion for software engineering and retro gaming, Fahad has meticulously crafted this platform to provide a seamless, high-performance experience for users worldwide. His expertise in modern web technologies and commitment to quality ensures that GAME SITE ONLINE STORE remains at the forefront of the gaming community.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <a href="https://github.com/Gamesiteonline" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-game-accent uppercase border border-game-accent/30 px-3 py-1 rounded-lg hover:bg-game-accent hover:text-white transition-all">GitHub</a>
                    <a href="https://linktr.ee/fahadgroyne" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-game-accent uppercase border border-game-accent/30 px-3 py-1 rounded-lg hover:bg-game-accent hover:text-white transition-all">Contact</a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-6 left-6 right-6 h-16 glass-dark rounded-2xl flex items-center justify-around px-2 z-40">
        <NavButton 
          active={activeTab === 'games'} 
          onClick={() => setActiveTab('games')} 
          icon={<Gamepad2 size={24} />} 
          label="Games" 
        />
        <NavButton 
          active={activeTab === 'roms'} 
          onClick={() => setActiveTab('roms')} 
          icon={<Layers size={24} />} 
          label="ROMs" 
        />
        <NavButton 
          active={activeTab === 'platforms'} 
          onClick={() => setActiveTab('platforms')} 
          icon={<Layers size={24} />} 
          label="Platforms" 
        />
        <NavButton 
          active={activeTab === 'apps'} 
          onClick={() => setActiveTab('apps')} 
          icon={<Globe size={24} />} 
          label="Apps" 
        />
        <NavButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
          icon={<SettingsIcon size={24} />} 
          label="Options" 
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 transition-colors ${active ? 'text-game-primary' : 'text-slate-500'}`}
    >
      <div className={`relative ${active ? 'text-glow' : ''}`}>
        {icon}
        {active && (
          <motion.div 
            layoutId="nav-glow"
            className="absolute -inset-2 bg-game-primary/20 blur-lg rounded-full -z-10"
          />
        )}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </motion.button>
  );
}

function SettingsItem({ icon, label, sub, onClick }: { icon: React.ReactNode, label: string, sub: string, onClick?: () => void }) {
  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-dark rounded-2xl p-4 flex items-center justify-between group cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-400 group-hover:text-game-primary transition-colors">
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-sm">{label}</h4>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{sub}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-600 group-hover:text-game-primary transition-colors" />
    </motion.div>
  );
}
