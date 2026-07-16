import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, writeBatch, query, where } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { Candidate } from "./types";
import { INITIAL_CANDIDATES } from "./mockData";
import { exportToExcel } from "./utils";
import PositionSelect from "./components/PositionSelect";
import DashboardStats from "./components/DashboardStats";
import CandidateList from "./components/CandidateList";
import CandidateDetail from "./components/CandidateDetail";
import CandidateForm from "./components/CandidateForm";
import LoginPage from "./components/LoginPage";
import AdminPage from "./components/AdminPage";
import MobileRestricted from "./components/MobileRestricted";
import SankenLogo from "./components/SankenLogo";
import { RotateCcw, Download, Wifi, Battery, Signal, Shield, LogOut, Landmark, UserCheck, ArrowRight, Sparkles, WifiOff, RefreshCw, Sun, Moon } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  
  // Dark mode option
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("sanken_dark_mode") === "true";
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem("sanken_dark_mode", String(next));
      return next;
    });
  };
  
  // Project profile states
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [availableProfiles, setAvailableProfiles] = useState<any[]>([]);

  // Mobile device restriction logic for non-admins
  const [isMobile, setIsMobile] = useState(() => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  });
  const [bypassMobileCheck, setBypassMobileCheck] = useState(() => {
    // Auto-bypass in development/preview environments (e.g. *.run.app, localhost, or inside iframe)
    const isDevEnv = window.location.hostname.includes("run.app") || 
                     window.location.hostname === "localhost" || 
                     window.location.hostname === "127.0.0.1" ||
                     window.self !== window.top;
    return isDevEnv || localStorage.getItem("bypass_mobile_check") === "true";
  });

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        const email = currentUser.email.trim().toLowerCase();
        if (email === "admin@sankenoverseas.com" || email === "ebiz1986@gmail.com") {
          setIsAdmin(true);
          setActiveProfile({
            id: "admin",
            email: email,
            role: "Admin",
            projectName: "All Projects",
            engineerName: "Master Admin"
          });
          setLoading(false);
        } else {
          // Query user profiles where email matches to get all available projects
          const q = query(collection(db, "user_profiles"), where("email", "==", email));
          unsubscribeProfile = onSnapshot(q, (snapshot) => {
            const list: any[] = [];
            let isUserAdmin = false;
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              list.push({ id: docSnap.id, ...data });
              if (data.role === "Admin") {
                isUserAdmin = true;
              }
            });

            setIsAdmin(isUserAdmin);

            if (list.length === 0) {
              // No user profile exists yet in DB (e.g. deleted by Admin)
              signOut(auth);
              setActiveProfile(null);
              setAvailableProfiles([]);
              setLoading(false);
              return;
            }

            setAvailableProfiles(list);

            // Read the active profile from cache
            const cached = localStorage.getItem("active_profile");
            let parsedCached = cached ? JSON.parse(cached) : null;

            // Verify cached profile is still valid (in the retrieved profile list)
            let validCached = parsedCached ? list.find((p) => p.id === parsedCached.id) : null;

            if (validCached) {
              setActiveProfile(validCached);
              localStorage.setItem("active_profile", JSON.stringify(validCached));
            } else if (list.length === 1) {
              setActiveProfile(list[0]);
              localStorage.setItem("active_profile", JSON.stringify(list[0]));
            } else {
              // Multiple profiles found but none cached yet - user must select
              setActiveProfile(null);
            }
            setLoading(false);
          }, (error) => {
            console.error("Error reading user profiles:", error);
            setIsAdmin(false);
            setLoading(false);
          });
        }
      } else {
        setIsAdmin(false);
        setActiveProfile(null);
        setAvailableProfiles([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-bold text-sm">
        Initializing Sanken Portal...
      </div>
    );
  }

  const viewPortal = searchParams.get("view") === "portal";
  const showMobileCheck = user && !isAdmin && !isMobile && !bypassMobileCheck;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route
        path="/"
        element={
          showMobileCheck ? (
            <MobileRestricted
              onBypass={() => {
                setBypassMobileCheck(true);
                localStorage.setItem("bypass_mobile_check", "true");
              }}
              onLogout={() => signOut(auth)}
              userEmail={user?.email}
            />
          ) : user ? (
            !activeProfile ? (
              <ProjectSelectionScreen
                profiles={availableProfiles}
                onSelect={(p) => {
                  setActiveProfile(p);
                  localStorage.setItem("active_profile", JSON.stringify(p));
                }}
                onLogout={() => {
                  signOut(auth);
                  setActiveProfile(null);
                  localStorage.removeItem("active_profile");
                }}
              />
            ) : (isAdmin && !viewPortal) ? (
              <Navigate to="/admin" replace />
            ) : (
              <MainApp 
                isAdmin={isAdmin} 
                activeProfile={activeProfile} 
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                onSwitchProfile={() => {
                  setActiveProfile(null);
                  localStorage.removeItem("active_profile");
                }} 
              />
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="/admin" element={(user && isAdmin) ? <AdminPage /> : (user ? <Navigate to="/" /> : <Navigate to="/login" />)} />
    </Routes>
  );
}

function MainApp({
  isAdmin,
  activeProfile,
  darkMode,
  toggleDarkMode,
  onSwitchProfile
}: {
  isAdmin: boolean;
  activeProfile: any;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onSwitchProfile: () => void;
}) {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filterByProject, setFilterByProject] = useState(activeProfile?.id !== "admin");

  const [selectedRole, setSelectedRole] = useState<'bar_bender' | 'finishing_carpenter' | 'labour' | 'mason' | 'rigger' | 'shoutering_carpenter' | 'spray_painter' | 'survey_helper' | 'tile_mason' | 'wall_painter' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [screen, setScreen] = useState<'position_select' | 'candidate_list' | 'candidate_detail' | 'candidate_form'>('position_select');
  const [formSource, setFormSource] = useState<'select' | 'list'>('select');

  const [currentTime, setCurrentTime] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>(navigator.onLine ? 'synced' : 'offline');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('synced');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleReSync = async () => {
    if (!navigator.onLine) {
      alert("You are currently offline. Please check your internet connection.");
      return;
    }
    setSyncStatus('syncing');
    try {
      const snapshot = await getDocs(collection(db, "candidates"));
      const list: Candidate[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Candidate);
      });
      if (list.length > 0) {
        list.sort((a, b) => b.id.localeCompare(a.id));
        setCandidates(list);
      }
      setSyncStatus('synced');
    } catch (err) {
      console.error("Manual re-sync failed:", err);
      setSyncStatus('error');
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    if (filterByProject && activeProfile?.projectName && activeProfile.id !== "admin") {
      const cProject = (c.projectName || "").trim().toLowerCase();
      const pProject = (activeProfile.projectName || "").trim().toLowerCase();
      return cProject === pProject;
    }
    return true;
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Listen to candidates in Firestore in real-time
  useEffect(() => {
    setSyncStatus(navigator.onLine ? 'syncing' : 'offline');
    const unsubscribe = onSnapshot(collection(db, "candidates"), async (snapshot) => {
      const list: Candidate[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Candidate);
      });
      
      if (list.length === 0) {
        // Seeding initial data once if Firestore is completely empty
        try {
          const batch = writeBatch(db);
          INITIAL_CANDIDATES.forEach((cand) => {
            const docRef = doc(db, "candidates", cand.id);
            batch.set(docRef, cand);
          });
          await batch.commit();
          setSyncStatus('synced');
        } catch (err) {
          console.error("Failed to seed candidates collection:", err);
          setSyncStatus('error');
        }
      } else {
        // Sort descending by ID or date so newest assessments appear first
        list.sort((a, b) => b.id.localeCompare(a.id));
        setCandidates(list);
        setSyncStatus('synced');
      }
    }, (error) => {
      console.error("Firestore candidates subscription error:", error);
      setSyncStatus('error');
    });

    return unsubscribe;
  }, []);

  const handleSaveCandidate = async (saved: Candidate) => {
    try {
      const docRef = doc(db, "candidates", saved.id);
      await setDoc(docRef, saved);
      
      setSelectedId(saved.id);
      setScreen('candidate_detail');
      setEditingCandidate(null);
    } catch (err) {
      console.error("Failed to save candidate to Firestore:", err);
      alert("Failed to save candidate to database.");
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    try {
      await deleteDoc(doc(db, "candidates", id));
      setSelectedId(null);
      setScreen('candidate_list');
      setEditingCandidate(null);
    } catch (err) {
      console.error("Failed to delete candidate from Firestore:", err);
      alert("Failed to delete candidate.");
    }
  };

  const handleResetToDemo = async () => {
    if (window.confirm("Are you sure you want to restore the default candidate assessments?")) {
      try {
        const snapshot = await getDocs(collection(db, "candidates"));
        const batch = writeBatch(db);
        snapshot.forEach((d) => {
          batch.delete(d.ref);
        });
        
        INITIAL_CANDIDATES.forEach((cand) => {
          const docRef = doc(db, "candidates", cand.id);
          batch.set(docRef, cand);
        });
        await batch.commit();

        setSelectedRole(null);
        setSelectedId(null);
        setScreen('position_select');
        setEditingCandidate(null);
      } catch (err) {
        console.error("Reset demo error:", err);
        alert("Failed to restore default assessments.");
      }
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(candidates, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "Trades_Assessment_Database_Export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportExcel = () => {
    exportToExcel(candidates, "Sanken_Trades_Full_Database");
  };

  const selectedCandidate = candidates.find((c) => c.id === selectedId) || null;

  return (
    <div className={`min-h-[100dvh] bg-gradient-to-br flex items-center justify-center p-0 sm:p-5 md:p-8 no-print select-none relative overflow-hidden transition-all duration-300 ${
      darkMode 
        ? "from-slate-900 via-slate-950 to-slate-900" 
        : "from-sky-400 via-sky-200 to-blue-300"
    }`}>
      {/* Decorative background branding shapes */}
      <div className="absolute -left-12 -top-12 opacity-15 pointer-events-none">
        <SankenLogo className="w-64 h-64" />
      </div>
      <div className="absolute -right-12 -bottom-12 opacity-15 pointer-events-none">
        <SankenLogo className="w-64 h-64" />
      </div>

      <div className={`w-full h-[100dvh] sm:w-[380px] sm:h-[820px] sm:rounded-[44px] flex flex-col overflow-hidden sm:border-[10px] relative select-none z-10 transition-all duration-300 ${
        darkMode
          ? "bg-slate-950 sm:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]"
          : "bg-sky-950 sm:border-sky-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)]"
      }`}>
        
        {/* Notch */}
        <div className={`hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6.5 rounded-b-2xl z-50 transition-colors ${
          darkMode ? "bg-slate-800" : "bg-sky-900"
        }`}>
          <div className={`w-14 h-1 rounded-full mx-auto mt-1.5 ${
            darkMode ? "bg-slate-950" : "bg-sky-950"
          }`}></div>
        </div>

        {/* Status bar */}
        <div className={`${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-[#1e88e5] text-white'} px-6 pt-2 pb-1.5 hidden sm:flex items-center justify-between text-[10px] font-bold tracking-tight select-none shrink-0 no-print transition-colors`}>
          <span className="font-semibold">{currentTime || "9:41 AM"}</span>
          <div className="flex items-center space-x-1.5">
            <Signal className="w-3.5 h-3.5" />
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
            )}
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Unified Top Navigation Header */}
        <div className={`border-b px-4 py-2 shrink-0 flex items-center justify-between no-print shadow-4xs transition-colors duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div>
            <div className="flex items-center gap-1.5">
              <SankenLogo className="w-5 h-5" />
              <h1 className={`text-xs font-black tracking-tight leading-none transition-colors ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}>Sanken Trades</h1>
              {syncStatus === 'offline' || !isOnline ? (
                <span className="flex items-center gap-0.5 text-[7px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-1 py-0.5 rounded-full shrink-0 animate-fade-in" title="Device is offline">
                  <WifiOff className="w-2 h-2 text-amber-500 animate-pulse" />
                  <span>OFFLINE</span>
                </span>
              ) : syncStatus === 'syncing' ? (
                <span className="flex items-center gap-0.5 text-[7px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-1 py-0.5 rounded-full shrink-0 animate-fade-in" title="Syncing with Firestore...">
                  <RefreshCw className="w-2 h-2 text-blue-500 animate-spin" />
                  <span>SYNCING</span>
                </span>
              ) : syncStatus === 'error' ? (
                <span className="flex items-center gap-0.5 text-[7px] font-black text-rose-700 bg-rose-50 border border-rose-100 px-1 py-0.5 rounded-full shrink-0 animate-fade-in" title="Sync error occurred">
                  <WifiOff className="w-2 h-2 text-rose-500" />
                  <span>ERROR</span>
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-[7px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded-full shrink-0 animate-fade-in" title="Synced with Firestore">
                  <Wifi className="w-2 h-2 text-emerald-500" />
                  <span>SYNCED</span>
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5 mt-1">
              <p className={`text-[9px] font-black leading-none flex items-center gap-0.5 transition-colors ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <Landmark className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                <span className="truncate max-w-[120px]">{activeProfile?.projectName || "All Projects"}</span>
              </p>
              <p className={`text-[8px] font-extrabold leading-none truncate max-w-[120px] transition-colors ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {activeProfile?.engineerName || auth.currentUser?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Dark Mode Option Toggle Switch */}
            <button
              onClick={toggleDarkMode}
              className={`p-1 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center border shadow-3xs ${
                darkMode 
                  ? 'bg-slate-800 hover:bg-slate-750 text-amber-400 border-slate-700' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleReSync}
              disabled={syncStatus === 'syncing'}
              className={`p-1 px-1.5 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-0.5 text-[9px] font-bold border shadow-3xs disabled:opacity-50 ${
                darkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-100 bg-white'
              }`}
              title="Manual Re-sync"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''} ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              <span>Sync</span>
            </button>
            {activeProfile?.id !== "admin" && (
              <button
                onClick={onSwitchProfile}
                className={`p-1 px-1.5 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-0.5 text-[9px] font-bold border shadow-3xs ${
                  darkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-100 bg-white'
                }`}
                title="Switch Project"
              >
                <RotateCcw className={`w-2.5 h-2.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <span>Switch</span>
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className={`p-1 px-1.5 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-0.5 text-[9px] font-bold border shadow-3xs ${
                  darkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-100 bg-white'
                }`}
              >
                <Shield className={`w-2.5 h-2.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
                <span>Admin</span>
              </button>
            )}
            <button
              onClick={() => {
                signOut(auth);
                navigate("/login");
              }}
              className={`p-1 rounded-lg transition-all active:scale-95 cursor-pointer border ${
                darkMode
                  ? 'hover:bg-rose-950/40 text-rose-400 border-rose-950/30'
                  : 'hover:bg-rose-50 text-rose-500 hover:text-rose-600 border-rose-50/50'
              }`}
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Content Screens */}
        <div className={`flex-1 flex flex-col overflow-hidden relative transition-colors duration-300 ${
          darkMode ? 'bg-slate-950' : 'bg-slate-50'
        }`}>
          {(!isOnline || syncStatus === 'offline') && (
            <div className="bg-amber-500 text-white px-4 py-1.5 text-center text-[10px] font-extrabold flex items-center justify-center gap-1.5 no-print shrink-0 shadow-sm animate-fade-in">
              <WifiOff className="w-3 h-3 text-white animate-pulse" />
              <span>Offline Mode — Changes will sync when connection is restored</span>
            </div>
          )}
          {/* Project Context Toggle Bar */}
          {activeProfile && activeProfile.id !== "admin" && (
            <div className={`px-4 py-2 border-b flex items-center justify-between no-print shrink-0 text-2xs shadow-4xs select-none transition-colors duration-300 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <div className={`flex items-center gap-1 font-extrabold text-[10px] transition-colors ${
                darkMode ? 'text-slate-200' : 'text-slate-700'
              }`}>
                <Landmark className="w-3.5 h-3.5 text-slate-500" />
                <span>Project: {activeProfile.projectName}</span>
              </div>
              <button
                onClick={() => setFilterByProject(!filterByProject)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all cursor-pointer active:scale-95 ${
                  filterByProject
                    ? darkMode
                      ? "bg-slate-100 text-slate-950 shadow-3xs"
                      : "bg-slate-900 text-white shadow-3xs"
                    : darkMode
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700"
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
                }`}
              >
                {filterByProject ? "My Project Only" : "Show All Projects"}
              </button>
            </div>
          )}

          {screen === 'position_select' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-between">
              <PositionSelect
                darkMode={darkMode}
                onSelectPosition={(roleId) => {
                  setSelectedRole(roleId);
                  setFormSource('select');
                  setEditingCandidate(null);
                  setScreen('candidate_form');
                }}
              />
              <div className={`p-4 border-t mt-auto flex flex-col gap-2 no-print shrink-0 transition-colors ${
                darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-100/50 border-slate-200/60'
              }`}>
                <div className="flex items-center justify-between text-2xs text-slate-500">
                  <span className={`font-bold font-mono text-[9px] transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>EXPORTS:</span>
                  <button onClick={handleResetToDemo} className={`flex items-center space-x-1.5 transition-colors py-1 px-2 border rounded-lg shadow-3xs cursor-pointer active:scale-95 font-bold text-[10px] ${
                    darkMode
                      ? 'bg-slate-850 hover:bg-slate-800 text-rose-400 border-rose-950/40'
                      : 'bg-white hover:text-rose-600 border-rose-100 text-rose-500'
                  }`}>
                    <RotateCcw className="w-3 h-3 text-rose-400" />
                    <span>Reset Demo</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleExportExcel} className={`flex items-center justify-center space-x-1.5 transition-all py-1.5 px-2 rounded-lg shadow-3xs cursor-pointer active:scale-95 font-black text-[10px] ${
                    darkMode
                      ? 'bg-emerald-950/40 hover:bg-emerald-900/30 border border-emerald-900 text-emerald-400'
                      : 'bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800'
                  }`}>
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download Excel</span>
                  </button>
                  <button onClick={handleExportJSON} className={`flex items-center justify-center space-x-1.5 transition-all py-1.5 px-2 rounded-lg shadow-3xs cursor-pointer active:scale-95 font-black text-[10px] ${
                    darkMode
                      ? 'bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300'
                      : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'
                  }`}>
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {screen === 'candidate_list' && selectedRole && (
            <div className="flex flex-col h-full overflow-hidden">
              <DashboardStats candidates={filteredCandidates} positionId={selectedRole} darkMode={darkMode} />
              <div className="flex-1 overflow-hidden">
                <CandidateList
                  candidates={filteredCandidates}
                  selectedId={selectedId}
                  positionId={selectedRole}
                  darkMode={darkMode}
                  onSelect={(id) => {
                    setSelectedId(id);
                    setScreen('candidate_detail');
                  }}
                  onAddNew={() => {
                    setFormSource('list');
                    setEditingCandidate(null);
                    setScreen('candidate_form');
                  }}
                  onBackToPositions={() => {
                    setSelectedRole(null);
                    setScreen('position_select');
                  }}
                />
              </div>
            </div>
          )}

          {screen === 'candidate_detail' && selectedCandidate && (
            <div className="flex-1 overflow-hidden">
              <CandidateDetail
                candidate={selectedCandidate}
                darkMode={darkMode}
                onEdit={(c) => {
                  setEditingCandidate(c);
                  setScreen('candidate_form');
                }}
                onDelete={handleDeleteCandidate}
                onBackToList={() => setScreen('candidate_list')}
              />
            </div>
          )}

          {screen === 'candidate_form' && selectedRole && (
            <div className="flex-1 overflow-hidden">
              <CandidateForm
                candidate={editingCandidate}
                positionId={selectedRole}
                activeProfile={activeProfile}
                candidates={candidates}
                darkMode={darkMode}
                onSave={handleSaveCandidate}
                onCancel={() => {
                  if (editingCandidate) setScreen('candidate_detail');
                  else if (formSource === 'list') setScreen('candidate_list');
                  else setScreen('position_select');
                  setEditingCandidate(null);
                }}
              />
            </div>
          )}
        </div>

        <div className="hidden sm:block absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-700/60 rounded-full z-50"></div>
      </div>
    </div>
  );
}

function ProjectSelectionScreen({
  profiles,
  onSelect,
  onLogout
}: {
  profiles: any[];
  onSelect: (p: any) => void;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-sky-400 via-sky-200 to-blue-300 flex items-center justify-center p-0 sm:p-5 md:p-8 select-none relative overflow-hidden">
      {/* Dynamic background brand watermark */}
      <div className="absolute -left-16 -top-16 opacity-15 pointer-events-none">
        <SankenLogo className="w-64 h-64" />
      </div>
      <div className="absolute -right-16 -bottom-16 opacity-15 pointer-events-none">
        <SankenLogo className="w-64 h-64" />
      </div>

      <div className="w-full h-[100dvh] sm:w-[380px] sm:h-[820px] sm:rounded-[44px] bg-sky-950 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden sm:border-[10px] sm:border-sky-900 relative z-10">
        <div className="bg-[#1e88e5] text-white px-6 pt-2 pb-1.5 hidden sm:flex items-center justify-between text-[10px] font-bold tracking-tight shrink-0">
          <span className="font-semibold">9:41 AM</span>
          <div className="flex items-center space-x-1.5">
            <Signal className="w-3.5 h-3.5 text-white" />
            <Wifi className="w-3.5 h-3.5 text-white" />
            <Battery className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="flex-1 bg-slate-50 flex flex-col justify-between overflow-y-auto custom-scrollbar p-6">
          <div className="my-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <SankenLogo className="w-24 h-14" />
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Sanken Projects</h1>
              <p className="text-xs text-[#2ea1e5] font-black uppercase tracking-wider">
                Select your active project profile:
              </p>
            </div>

            <div className="space-y-2.5 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 p-4 rounded-xl transition-all active:scale-98 cursor-pointer flex items-center justify-between group shadow-3xs"
                >
                  <div className="space-y-1 pr-2">
                    <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span>{p.projectName || "Default Project"}</span>
                    </p>
                    {p.engineerName && (
                      <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{p.engineerName}</span>
                      </p>
                    )}
                    <span className="inline-block bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide mt-1">
                      {p.role}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
                </button>
              ))}
            </div>

            <button
              onClick={onLogout}
              className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
