import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, writeBatch } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { Candidate } from "./types";
import { INITIAL_CANDIDATES } from "./mockData";
import PositionSelect from "./components/PositionSelect";
import DashboardStats from "./components/DashboardStats";
import CandidateList from "./components/CandidateList";
import CandidateDetail from "./components/CandidateDetail";
import CandidateForm from "./components/CandidateForm";
import LoginPage from "./components/LoginPage";
import AdminPage from "./components/AdminPage";
import { RotateCcw, Download, Wifi, Battery, Signal, Shield, LogOut } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-bold text-sm">
        Initializing Sanken Portal...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={user ? <MainApp /> : <Navigate to="/login" />} />
      <Route path="/admin" element={user ? <AdminPage /> : <Navigate to="/login" />} />
    </Routes>
  );
}

function MainApp() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedRole, setSelectedRole] = useState<'bar_bender' | 'finishing_carpenter' | 'labour' | 'mason' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [screen, setScreen] = useState<'position_select' | 'candidate_list' | 'candidate_detail' | 'candidate_form'>('position_select');
  const [formSource, setFormSource] = useState<'select' | 'list'>('select');

  const [currentTime, setCurrentTime] = useState("");

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
        } catch (err) {
          console.error("Failed to seed candidates collection:", err);
        }
      } else {
        // Sort descending by ID or date so newest assessments appear first
        list.sort((a, b) => b.id.localeCompare(a.id));
        setCandidates(list);
      }
    }, (error) => {
      console.error("Firestore candidates subscription error:", error);
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

  const selectedCandidate = candidates.find((c) => c.id === selectedId) || null;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 sm:p-5 md:p-8 no-print select-none">
      <div className="w-full h-screen sm:w-[380px] sm:h-[820px] sm:rounded-[44px] bg-slate-950 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden sm:border-[10px] sm:border-slate-800 relative select-none">
        
        {/* Notch */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6.5 bg-slate-800 rounded-b-2xl z-50">
          <div className="w-14 h-1 bg-slate-950 rounded-full mx-auto mt-1.5"></div>
        </div>

        {/* Status bar */}
        <div className="bg-slate-900 text-slate-300 px-6 pt-2 pb-1.5 flex items-center justify-between text-[10px] font-bold tracking-tight select-none shrink-0 no-print">
          <span className="font-semibold">{currentTime || "9:41 AM"}</span>
          <div className="flex items-center space-x-1.5">
            <Signal className="w-3.5 h-3.5 text-slate-300" />
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <Battery className="w-4 h-4 text-slate-300" />
          </div>
        </div>

        {/* Unified Top Navigation Header */}
        <div className="bg-white border-b border-slate-100 px-4 py-2.5 shrink-0 flex items-center justify-between no-print shadow-4xs">
          <div>
            <h1 className="text-xs font-black text-slate-900 tracking-tight">Sanken Trades</h1>
            <p className="text-[8px] font-bold text-slate-400 font-mono leading-none mt-0.5 max-w-[150px] truncate">
              {auth.currentUser?.email}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate("/admin")}
              className="p-1.5 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 text-[9px] font-extrabold border border-slate-100 shadow-3xs"
            >
              <Shield className="w-3 h-3 text-slate-600" />
              <span>Admin</span>
            </button>
            <button
              onClick={() => {
                signOut(auth);
                navigate("/login");
              }}
              className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-lg transition-all active:scale-95 cursor-pointer border border-rose-50/50"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Screens */}
        <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden relative">
          {screen === 'position_select' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-between">
              <PositionSelect
                onSelectPosition={(roleId) => {
                  setSelectedRole(roleId);
                  setFormSource('select');
                  setEditingCandidate(null);
                  setScreen('candidate_form');
                }}
              />
              <div className="p-4 bg-slate-100/50 border-t border-slate-200/60 mt-auto flex items-center justify-between text-2xs text-slate-500">
                <button onClick={handleExportJSON} className="flex items-center space-x-1.5 hover:text-slate-800 transition-colors py-1 px-2.5 bg-white border border-slate-200 rounded-lg shadow-3xs cursor-pointer active:scale-95">
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export DB</span>
                </button>
                <button onClick={handleResetToDemo} className="flex items-center space-x-1.5 hover:text-rose-600 transition-colors py-1 px-2.5 bg-white border border-slate-200 rounded-lg shadow-3xs cursor-pointer active:scale-95">
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reset Demo</span>
                </button>
              </div>
            </div>
          )}

          {screen === 'candidate_list' && selectedRole && (
            <div className="flex flex-col h-full overflow-hidden">
              <DashboardStats candidates={candidates} positionId={selectedRole} />
              <div className="flex-1 overflow-hidden">
                <CandidateList
                  candidates={candidates}
                  selectedId={selectedId}
                  positionId={selectedRole}
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
