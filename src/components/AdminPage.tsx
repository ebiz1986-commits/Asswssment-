import React, { useState, useEffect } from "react";
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { exportToExcel, calculateOverallScore, getStatusBadgeClass, getStatusColor } from "../utils";
import { 
  ArrowLeft, LogOut, UserPlus, Trash2, Database, ShieldAlert, CheckCircle, 
  Mail, Key, User, Shield, Info, Signal, Wifi, Battery, Landmark, UserCheck,
  Search, Filter, Download, LayoutDashboard, Users, CheckCircle2, XCircle, 
  AlertCircle, TrendingUp, BarChart3, HelpCircle, Eye, RefreshCw
} from "lucide-react";
import { UserProfile, Candidate, POSITIONS } from "../types";

export default function AdminPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("User");
  const [newProjectName, setNewProjectName] = useState("");
  const [newEngineerName, setNewEngineerName] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Users list state
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Candidates list state
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);

  // Requirement Companies list state
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [newCompanyName, setNewCompanyName] = useState("");

  // Active view tab state
  const [activeTab, setActiveTab] = useState<"dashboard" | "accounts">("dashboard");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPosition, setFilterPosition] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPractical, setFilterPractical] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");

  // Time state for simulator notch
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    // Current user validation
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        const email = user.email?.trim().toLowerCase();
        
        // Only allow sankenoverseas domains or tester email
        if (!email || (!email.endsWith("@sankenoverseas.com") && email !== "ebiz1986@gmail.com")) {
          navigate("/login");
          return;
        }

        if (email === "admin@sankenoverseas.com" || email === "ebiz1986@gmail.com") {
          // Master admin always allowed
        } else {
          // Check role from Firestore user profile query
          const q = query(collection(db, "user_profiles"), where("email", "==", email));
          unsubscribeProfile = onSnapshot(q, (snapshot) => {
            let isAdminUser = false;
            snapshot.forEach((docSnap) => {
              if (docSnap.data().role === "Admin") {
                isAdminUser = true;
              }
            });
            if (!snapshot.empty && isAdminUser) {
              // Admin allowed
            } else {
              // Not an Admin! Redirect to home list screen
              navigate("/");
            }
          }, (error) => {
            console.error("Profiles admin auth check error:", error);
            navigate("/");
          });
        }
      } else {
        navigate("/login");
      }
    });

    // Sync profiles in real-time
    const unsubscribeProfiles = onSnapshot(collection(db, "user_profiles"), (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setProfiles(list);
      setLoadingProfiles(false);
    }, (error) => {
      console.error("Profiles sync error:", error);
      setLoadingProfiles(false);
    });

    // Sync candidates in real-time
    const unsubscribeCandidates = onSnapshot(collection(db, "candidates"), (snapshot) => {
      const list: Candidate[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Candidate);
      });
      setCandidates(list);
      setLoadingCandidates(false);
    }, (error) => {
      console.error("Candidates sync error:", error);
      setLoadingCandidates(false);
    });

    // Sync requirement companies in real-time
    const unsubscribeCompanies = onSnapshot(collection(db, "requirement_companies"), (snapshot) => {
      const list: { id: string; name: string }[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, name: doc.data().name });
      });

      if (snapshot.empty) {
        // Seed default companies if collection is empty
        const defaults = ["Sanken Overseas", "Sobha", "Al Nakheel", "Emaar", "Damac"];
        defaults.forEach(async (comp) => {
          const slug = comp.toLowerCase().replace(/[^a-z0-9]/g, "_");
          await setDoc(doc(db, "requirement_companies", slug), { id: slug, name: comp });
        });
      } else {
        // Sort alphabetically
        list.sort((a, b) => a.name.localeCompare(b.name));
        setCompanies(list);
        setLoadingCompanies(false);
      }
    }, (error) => {
      console.error("Companies sync error:", error);
      setLoadingCompanies(false);
    });

    // Time ticker
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

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
      unsubscribeProfiles();
      unsubscribeCandidates();
      unsubscribeCompanies();
      clearInterval(interval);
    };
  }, [navigate]);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    setLoading(true);

    const emailInput = newEmail.trim().toLowerCase();
    const passwordInput = newPassword.trim();
    const projectInput = newProjectName.trim();
    const engineerInput = newEngineerName.trim();

    if (!emailInput.endsWith("@sankenoverseas.com")) {
      setErrorMsg("Email must end with @sankenoverseas.com");
      setLoading(false);
      return;
    }

    if (passwordInput.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (!projectInput) {
      setErrorMsg("Project Name is required.");
      setLoading(false);
      return;
    }

    if (!engineerInput) {
      setErrorMsg("Engineer Name is required.");
      setLoading(false);
      return;
    }

    try {
      // Create a composite document ID: email_projectslug
      const projectSlug = projectInput.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const compositeId = `${emailInput}_${projectSlug}`;

      const userRef = doc(db, "user_profiles", compositeId);
      await setDoc(userRef, {
        id: compositeId,
        email: emailInput,
        password: passwordInput, // Admin-provided password
        role: newRole,
        projectName: projectInput,
        engineerName: engineerInput,
        createdAt: new Date().toISOString()
      });

      setSuccessMsg(`Successfully created profile for ${emailInput} on "${projectInput}"!`);
      setNewEmail("");
      setNewPassword("");
      setNewRole("User");
      setNewProjectName("");
      setNewEngineerName("");
    } catch (err: any) {
      console.error("Error creating profile:", err);
      setErrorMsg("Failed to create user profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (profileId: string, email: string, project?: string) => {
    if (email === "admin@sankenoverseas.com") {
      alert("Cannot delete the master admin account!");
      return;
    }

    const displayStr = project ? `${email} (${project})` : email;
    if (window.confirm(`Are you sure you want to delete the profile for ${displayStr}?`)) {
      try {
        await deleteDoc(doc(db, "user_profiles", profileId));
        setSuccessMsg("Successfully deleted user profile.");
      } catch (err) {
        console.error("Error deleting profile:", err);
        alert("Failed to delete profile.");
      }
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    const compName = newCompanyName.trim();
    if (!compName) return;

    try {
      const slug = compName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const docRef = doc(db, "requirement_companies", slug);
      await setDoc(docRef, {
        id: slug,
        name: compName,
        createdAt: new Date().toISOString()
      });
      setNewCompanyName("");
      setSuccessMsg(`Successfully added company "${compName}"!`);
    } catch (err) {
      console.error("Error creating company:", err);
      setErrorMsg("Failed to add requirement company.");
    }
  };

  const handleDeleteCompany = async (compId: string, compName: string) => {
    if (window.confirm(`Are you sure you want to delete "${compName}" from the requirement companies list?`)) {
      try {
        await deleteDoc(doc(db, "requirement_companies", compId));
        setSuccessMsg(`Successfully deleted company "${compName}".`);
      } catch (err) {
        console.error("Error deleting company:", err);
        setErrorMsg("Failed to delete company.");
      }
    }
  };

  const handleExportDatabase = async () => {
    try {
      setLoading(true);
      // Fetch all Candidates
      const candSnap = await getDocs(collection(db, "candidates"));
      const candidatesList: any[] = [];
      candSnap.forEach((doc) => {
        candidatesList.push({ id: doc.id, ...doc.data() });
      });

      // Fetch all User Profiles
      const profileSnap = await getDocs(collection(db, "user_profiles"));
      const profilesList: any[] = [];
      profileSnap.forEach((doc) => {
        profilesList.push({ email: doc.id, ...doc.data() });
      });

      // Prepare unified package
      const backupData = {
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser?.email || "Admin",
        candidates: candidatesList,
        user_profiles: profilesList
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Sanken_Trades_Backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      alert("Full database successfully exported!");
    } catch (err) {
      console.error("Export database error:", err);
      alert("Failed to export complete database.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      const candSnap = await getDocs(collection(db, "candidates"));
      const candidatesList: any[] = [];
      candSnap.forEach((doc) => {
        candidatesList.push({ id: doc.id, ...doc.data() });
      });
      exportToExcel(candidatesList, "Sanken_Full_Candidates_Database");
    } catch (err) {
      console.error("Export excel error:", err);
      alert("Failed to export database to Excel.");
    } finally {
      setLoading(false);
    }
  };

  // Stats Calculations
  const totalCount = candidates.length;
  const selectedCount = candidates.filter((c) => c.status === "Selected").length;
  const onHoldCount = candidates.filter((c) => c.status === "On Hold").length;
  const rejectedCount = candidates.filter((c) => c.status === "Rejected").length;
  const pendingCount = candidates.filter((c) => c.status === "Pending Practical").length;

  const barBenderCount = candidates.filter((c) => c.positionId === "bar_bender").length;
  const carpenterCount = candidates.filter((c) => c.positionId === "finishing_carpenter").length;
  const labourCount = candidates.filter((c) => c.positionId === "labour").length;
  const masonCount = candidates.filter((c) => c.positionId === "mason").length;

  const passRate = totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0;

  // Filter logic
  const filteredCandidates = candidates.filter((c) => {
    // 1. Search Query
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchName = c.name.toLowerCase().includes(query);
      const matchNic = (c.nicNumber || "").toLowerCase().includes(query);
      const matchPassport = (c.passportNumber || "").toLowerCase().includes(query);
      const matchAssessor = (c.assessor || "").toLowerCase().includes(query);
      const matchRef = (c.referenceId || "").toLowerCase().includes(query);
      if (!matchName && !matchNic && !matchPassport && !matchAssessor && !matchRef) {
        return false;
      }
    }

    // 2. Position Filter
    if (filterPosition !== "all" && c.positionId !== filterPosition) {
      return false;
    }

    // 3. Project Filter
    if (filterProject !== "all" && (c.projectName || "").trim() !== filterProject) {
      return false;
    }

    // 4. Status Filter
    if (filterStatus !== "all" && c.status !== filterStatus) {
      return false;
    }

    // 5. Practical Test Required Filter
    if (filterPractical !== "all") {
      const isReq = filterPractical === "true";
      if (c.practicalTestRequired !== isReq) {
        return false;
      }
    }

    // 6. Company Filter
    if (filterCompany !== "all" && (c.requirementCompany || "").trim() !== filterCompany) {
      return false;
    }

    return true;
  });

  const uniqueProjects = Array.from(
    new Set(candidates.map((c) => (c.projectName || "").trim()).filter(Boolean))
  );

  const uniqueCompanies = Array.from(
    new Set(candidates.map((c) => (c.requirementCompany || "").trim()).filter(Boolean))
  );

  return (
    <div className="min-h-[100dvh] bg-slate-900 flex items-center justify-center p-0 sm:p-5 md:p-8 select-none">
      <div className="w-full h-[100dvh] md:w-full md:max-w-6xl md:h-[85vh] md:rounded-[32px] bg-slate-950 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden md:border-[10px] md:border-slate-800 relative">
        
        {/* Notch */}
        <div className="hidden sm:block md:hidden absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6.5 bg-slate-800 rounded-b-2xl z-50">
          <div className="w-14 h-1 bg-slate-950 rounded-full mx-auto mt-1.5"></div>
        </div>

        {/* Status bar */}
        <div className="bg-slate-900 text-slate-300 px-6 pt-2 pb-1.5 hidden sm:flex md:hidden items-center justify-between text-[10px] font-bold tracking-tight shrink-0">
          <span className="font-semibold">{currentTime || "9:41 AM"}</span>
          <div className="flex items-center space-x-1.5">
            <Signal className="w-3.5 h-3.5 text-slate-300" />
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <Battery className="w-4 h-4 text-slate-300" />
          </div>
        </div>

        {/* Header Block */}
        <div className="bg-white border-b border-slate-100 px-4 py-3 md:px-6 shrink-0 flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="p-1.5 hover:bg-slate-50 active:scale-95 text-slate-700 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-2xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>App</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1 justify-center md:text-sm">
              <Shield className="w-3.5 h-3.5 text-slate-800" />
              Sanken Admin
            </h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5">Control Center</p>
          </div>

          <button 
            onClick={() => {
              auth.signOut();
              navigate("/login");
            }}
            className="p-1.5 hover:bg-rose-50 active:scale-95 text-rose-600 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-2xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="bg-white border-b border-slate-100 px-4 md:px-6 shrink-0 flex items-center gap-4">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`py-3 px-2 border-b-2 text-2xs font-extrabold tracking-tight transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "dashboard"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard & Candidates ({candidates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("accounts")}
            className={`py-3 px-2 border-b-2 text-2xs font-extrabold tracking-tight transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "accounts"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>User Access & System Settings</span>
          </button>
        </div>

        {/* Content Console */}
        <div className="flex-1 bg-slate-50 overflow-y-auto custom-scrollbar p-4 md:p-6">
          
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* Dashboard stats panel */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Total Candidates Card */}
                <div className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-3 shadow-3xs hover:border-slate-200 transition-all">
                  <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Total Candidates</p>
                    <p className="text-lg font-black text-slate-900 mt-1 font-mono">{totalCount}</p>
                  </div>
                </div>

                {/* Selected Card */}
                <div className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-3 shadow-3xs hover:border-slate-200 transition-all">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Passed & Selected</p>
                    <p className="text-lg font-black text-emerald-600 mt-1 font-mono">{selectedCount}</p>
                  </div>
                </div>

                {/* Pending Practical Card */}
                <div className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-3 shadow-3xs hover:border-slate-200 transition-all">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Pending Practical</p>
                    <p className="text-lg font-black text-blue-600 mt-1 font-mono">{pendingCount}</p>
                  </div>
                </div>

                {/* On Hold Card */}
                <div className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-3 shadow-3xs hover:border-slate-200 transition-all">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">On Hold</p>
                    <p className="text-lg font-black text-amber-500 mt-1 font-mono">{onHoldCount}</p>
                  </div>
                </div>

                {/* Rejected Card */}
                <div className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-3 shadow-3xs hover:border-slate-200 transition-all col-span-2 md:col-span-1">
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Rejected</p>
                    <p className="text-lg font-black text-rose-600 mt-1 font-mono">{rejectedCount}</p>
                  </div>
                </div>
              </div>

              {/* Trade Analysis Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trade distribution */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-3xs">
                  <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
                    <BarChart3 className="w-4 h-4 text-slate-700" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Candidate Trade Distribution</h4>
                  </div>
                  <div className="space-y-2.5">
                    {POSITIONS.map((pos, index) => {
                      const count = candidates.filter((c) => c.positionId === pos.id).length;
                      const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                      const colors = [
                        "bg-blue-500", "bg-amber-500", "bg-slate-500", "bg-emerald-500",
                        "bg-indigo-500", "bg-amber-600", "bg-rose-500", "bg-cyan-500",
                        "bg-teal-500", "bg-orange-500"
                      ];
                      const color = colors[index % colors.length];
                      return (
                        <div key={pos.id} className="space-y-1">
                          <div className="flex justify-between text-2xs font-extrabold text-slate-700">
                            <span>{pos.title}</span>
                            <span className="font-mono text-slate-500">{count} candidates ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* KPI/Average Scores */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-3xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3 border-b border-slate-50 pb-2">
                      <TrendingUp className="w-4 h-4 text-slate-700" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Key Performance Metrics</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center mt-2">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Overall Pass Rate</p>
                        <p className="text-xl font-black text-emerald-600 font-mono mt-1">{passRate}%</p>
                        <p className="text-[8px] text-slate-400 font-semibold mt-1">Ratio of status "Selected"</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Practical Required</p>
                        <p className="text-xl font-black text-blue-600 font-mono mt-1">
                          {candidates.filter(c => c.practicalTestRequired).length}
                        </p>
                        <p className="text-[8px] text-slate-400 font-semibold mt-1">Requires hands-on test</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900 text-slate-100 p-2.5 rounded-xl flex items-center justify-between text-[10px] mt-3 font-semibold">
                    <span>Export ready standard Excel file.</span>
                    <button 
                      onClick={() => exportToExcel(candidates, "Sanken_Full_Assessments_Backup")}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-900 rounded font-black tracking-tight text-3xs cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Download className="w-2.5 h-2.5" />
                      Full Excel Export
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter controls */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 shadow-3xs">
                <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
                  <Filter className="w-4 h-4 text-slate-700" />
                  <span>Interactive Search & Filters</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Search Query */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Search Candidates</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Name, ID, Passport..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Trade / Position Filter */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Trade / Position</label>
                    <select
                      value={filterPosition}
                      onChange={(e) => setFilterPosition(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold"
                    >
                      <option value="all">All Trades</option>
                      {POSITIONS.map((pos) => (
                        <option key={pos.id} value={pos.id}>{pos.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Project Filter */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Project Name</label>
                    <select
                      value={filterProject}
                      onChange={(e) => setFilterProject(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold"
                    >
                      <option value="all">All Projects</option>
                      {uniqueProjects.map(proj => (
                        <option key={proj} value={proj}>{proj}</option>
                      ))}
                    </select>
                  </div>

                  {/* Requirement Company Filter */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Req. Company</label>
                    <select
                      value={filterCompany}
                      onChange={(e) => setFilterCompany(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold"
                    >
                      <option value="all">All Companies</option>
                      {uniqueCompanies.map(comp => (
                        <option key={comp} value={comp}>{comp}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status / Final Result Filter */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Final Result / Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold"
                    >
                      <option value="all">All Results</option>
                      <option value="Selected">Selected (Passed)</option>
                      <option value="Pending Practical">Pending Practical</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>

                  {/* Practical Test required Filter */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Practical Test</label>
                    <select
                      value={filterPractical}
                      onChange={(e) => setFilterPractical(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold"
                    >
                      <option value="all">All Settings</option>
                      <option value="true">Test Required</option>
                      <option value="false">Test Not Required</option>
                    </select>
                  </div>
                </div>

                {/* Reset Filters button and Download buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-50 pt-3">
                  <div className="text-[10px] text-slate-500 font-semibold">
                    Showing <span className="font-extrabold text-slate-800">{filteredCandidates.length}</span> of <span className="font-extrabold text-slate-800">{candidates.length}</span> candidate records
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setFilterPosition("all");
                        setFilterProject("all");
                        setFilterStatus("all");
                        setFilterPractical("all");
                        setFilterCompany("all");
                      }}
                      className="px-3 py-1.5 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg text-2xs font-extrabold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reset Filters
                    </button>

                    <button
                      onClick={() => exportToExcel(filteredCandidates, "Sanken_Filtered_Candidates")}
                      className="px-3 py-1.5 text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg text-2xs font-extrabold transition-all active:scale-95 shadow-3xs cursor-pointer flex items-center gap-1"
                      disabled={filteredCandidates.length === 0}
                    >
                      <Download className="w-3 h-3" />
                      Download Filtered Excel
                    </button>
                  </div>
                </div>
              </div>

              {/* Candidates Records Table */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-3xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Candidate Assessments Database</h3>
                  <div className="text-[9px] text-slate-400 font-mono">Real-time sync active</div>
                </div>

                {loadingCandidates ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-bold">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-500" />
                    Loading candidates records...
                  </div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <p className="text-xs font-bold">No candidates found matching the selected filters.</p>
                    <p className="text-[10px] leading-normal text-slate-400 max-w-md mx-auto font-medium">Try broadening your search query or choosing "All" in the drop-down filters to see the available records.</p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-slate-900 text-white font-extrabold uppercase tracking-wider text-[9px]">
                          <th className="px-2 py-1.5 text-center whitespace-nowrap">#</th>
                          <th className="px-2 py-1.5 whitespace-nowrap">Photo</th>
                          <th className="px-2 py-1.5 whitespace-nowrap">Candidate Name</th>
                          <th className="px-2 py-1.5 whitespace-nowrap">ID Card / NIC</th>
                          <th className="px-2 py-1.5 whitespace-nowrap">Passport</th>
                          <th className="px-2 py-1.5 whitespace-nowrap">Trade / Position</th>
                          <th className="px-2 py-1.5 whitespace-nowrap">Project Name</th>
                          <th className="px-2 py-1.5 whitespace-nowrap">Req. Company</th>
                          <th className="px-2 py-1.5 whitespace-nowrap">Assessor / Engineer</th>
                          <th className="px-2 py-1.5 whitespace-nowrap">Date</th>
                          <th className="px-2 py-1.5 text-center whitespace-nowrap">Test Required</th>
                          <th className="px-2 py-1.5 text-right whitespace-nowrap">Result / Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCandidates.map((c, index) => {
                          const overallScore = calculateOverallScore(c);
                          
                          // Label for trade
                          let tradeLabel = c.positionId;
                          if (c.positionId === "bar_bender") tradeLabel = "Bar Bender";
                          else if (c.positionId === "finishing_carpenter") tradeLabel = "Finishing Carpenter";
                          else if (c.positionId === "labour") tradeLabel = "Labour";
                          else if (c.positionId === "mason") tradeLabel = "Mason";

                          return (
                            <tr key={c.id} className="hover:bg-slate-50 transition-all font-semibold text-slate-700">
                              {/* Serial number */}
                              <td className="px-2 py-1.5 text-center font-mono text-slate-400 text-[9px] font-bold border-r border-slate-50 bg-slate-50/30 whitespace-nowrap">
                                {index + 1}
                              </td>

                              {/* Photo */}
                              <td className="px-2 py-1.5 whitespace-nowrap">
                                {c.photoUrl ? (
                                  <img 
                                    src={c.photoUrl} 
                                    alt={c.name} 
                                    referrerPolicy="no-referrer"
                                    className="w-7 h-7 rounded-full object-cover border border-slate-200 bg-slate-100 shadow-3xs" 
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center font-bold text-[9px] shadow-3xs">
                                    {c.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                                  </div>
                                )}
                              </td>

                              {/* Name */}
                              <td className="px-2 py-1.5 font-extrabold text-slate-900 whitespace-nowrap">
                                <div className="leading-tight text-[11px]">{c.name}</div>
                                <div className="text-[9px] text-slate-400 font-mono mt-0.5">{c.referenceId}</div>
                              </td>

                              {/* NIC */}
                              <td className="px-2 py-1.5 font-mono text-slate-500 text-[10px] whitespace-nowrap">
                                {c.nicNumber || "—"}
                              </td>

                              {/* Passport */}
                              <td className="px-2 py-1.5 font-mono text-slate-500 text-[10px] whitespace-nowrap">
                                {c.passportNumber || "—"}
                              </td>

                              {/* Position */}
                              <td className="px-2 py-1.5 whitespace-nowrap">
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] border border-slate-200/50 whitespace-nowrap font-medium">
                                  {tradeLabel}
                                </span>
                              </td>

                              {/* Project */}
                              <td className="px-2 py-1.5 text-slate-600 font-bold text-[10px] whitespace-nowrap">
                                {c.projectName || "Default Project"}
                              </td>

                              {/* Requirement Company */}
                              <td className="px-2 py-1.5 text-slate-600 text-[10px] whitespace-nowrap">
                                {c.requirementCompany || "—"}
                              </td>

                              {/* Assessor / Engineer */}
                              <td className="px-2 py-1.5 font-bold text-slate-800 text-[10px] whitespace-nowrap">
                                {c.assessor || "—"}
                              </td>

                              {/* Date */}
                              <td className="px-2 py-1.5 font-mono text-slate-500 text-[9px] whitespace-nowrap">
                                {c.date}
                              </td>

                              {/* Practical Test */}
                              <td className="px-2 py-1.5 text-center whitespace-nowrap">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider whitespace-nowrap ${
                                  c.practicalTestRequired 
                                    ? "bg-amber-100 text-amber-700 border border-amber-200" 
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                }`}>
                                  {c.practicalTestRequired ? "YES" : "NO"}
                                </span>
                              </td>

                              {/* Result / Score */}
                              <td className="px-2 py-1.5 text-right border-l border-slate-50 whitespace-nowrap">
                                <div className="flex flex-col items-end leading-none">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-center w-fit whitespace-nowrap ${getStatusBadgeClass(c.status)}`}>
                                    {c.status}
                                  </span>
                                  <span className="text-[9px] font-extrabold text-slate-900 mt-1 font-mono block">
                                    {overallScore}% Comp.
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === "accounts" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start">
                      {/* Left Column: DB Admin & feedback banners */}
              <div className="md:col-span-4 space-y-4">
                {/* Seeding & Full Backup Section */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    <h2 className="text-xs font-black tracking-tight uppercase text-blue-300">Database Administration</h2>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-normal font-medium">
                    Export stored candidates assessments or user accounts details in Microsoft Excel or JSON formats.
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={handleExportExcel}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl text-2xs font-extrabold tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer text-white"
                    >
                      <Database className="w-3.5 h-3.5 text-emerald-100" />
                      Download Candidates Excel
                    </button>
                    <button
                      onClick={handleExportDatabase}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl text-2xs font-extrabold tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer text-slate-200 border border-slate-700"
                    >
                      <Database className="w-3.5 h-3.5 text-slate-400" />
                      Export Full JSON Backup
                    </button>
                  </div>
                </div>

                {/* Requirement Companies Management Card */}
                <div className="bg-white rounded-[20px] border border-slate-100 p-4 space-y-3.5 shadow-3xs">
                  <div className="flex items-center gap-1.5 border-b border-slate-50 pb-2">
                    <Landmark className="w-4 h-4 text-slate-800" />
                    <h2 className="text-xs font-black text-slate-900 tracking-tight">Requirement Companies ({companies.length})</h2>
                  </div>

                  <form onSubmit={handleCreateCompany} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add Company (e.g. Sobha)"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-2xs font-extrabold tracking-tight cursor-pointer active:scale-95 shadow-3xs whitespace-nowrap"
                    >
                      Add
                    </button>
                  </form>

                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                    {loadingCompanies ? (
                      <p className="text-[10px] text-slate-400 font-bold text-center py-2">Syncing companies...</p>
                    ) : companies.length === 0 ? (
                      <p className="text-[10px] text-slate-400 font-bold text-center py-2">No companies added yet.</p>
                    ) : (
                      companies.map((comp) => (
                        <div key={comp.id} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between">
                          <span className="text-2xs font-bold text-slate-800 select-all">{comp.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCompany(comp.id, comp.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-90 cursor-pointer shrink-0"
                            title="Delete Company"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Feedback banners */}
                {successMsg && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl flex items-start gap-2 text-2xs font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl flex items-start gap-2 text-2xs font-bold">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              {/* Middle Column: Create User Profile */}
              <div className="md:col-span-4">
                <div className="bg-white rounded-[20px] border border-slate-100 p-4 space-y-3.5 shadow-3xs">
                  <div className="flex items-center gap-1.5 border-b border-slate-50 pb-2">
                    <UserPlus className="w-4 h-4 text-slate-800" />
                    <h2 className="text-xs font-black text-slate-900 tracking-tight">Create User Profile</h2>
                  </div>

                  <form onSubmit={handleCreateProfile} className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="user@sankenoverseas.com"
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700">Password</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Admin assigned password"
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700">Project Name</label>
                      <div className="relative">
                        <Landmark className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="e.g. Colombo Mall, Marina Heights"
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700">Engineer Name</label>
                      <div className="relative">
                        <UserCheck className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={newEngineerName}
                          onChange={(e) => setNewEngineerName(e.target.value)}
                          placeholder="e.g. Eng. Ruwan, Eng. Perera"
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700">Access Level / Role</label>
                      <div className="flex gap-2">
                        {["User", "Admin"].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setNewRole(r)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              newRole === r
                                ? "bg-slate-900 text-white border-slate-900 shadow-3xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-2xs font-extrabold tracking-tight transition-all active:scale-95 shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Save Profile Credentials</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Manage Active Profiles */}
              <div className="md:col-span-4">
                <div className="bg-white rounded-[20px] border border-slate-100 p-4 space-y-3.5 shadow-3xs">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-slate-800" />
                      <h2 className="text-xs font-black text-slate-900 tracking-tight">Active Accounts ({profiles.length + 1})</h2>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                    {/* Default Admin Card */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-2xs font-black text-slate-800 select-all">admin@sankenoverseas.com</span>
                          <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wider uppercase">System</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold mt-1 font-mono">PWD: SankenAdmin2026!</p>
                      </div>
                      <div className="text-[8px] text-slate-400 font-extrabold">MASTER</div>
                    </div>

                    {/* Firestore Custom Users */}
                    {loadingProfiles ? (
                      <p className="text-[10px] text-slate-400 font-bold text-center py-4">Syncing profiles...</p>
                    ) : profiles.length === 0 ? (
                      <div className="text-center py-4 text-slate-400 space-y-1">
                        <p className="text-[10px] font-bold">No custom profiles yet.</p>
                        <p className="text-[9px] leading-normal px-2">Created users will appear here and can log in instantly.</p>
                      </div>
                    ) : (
                      profiles.map((p) => (
                        <div key={p.id || p.email} className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col gap-1.5 hover:border-slate-200 transition-all shadow-3xs relative group">
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-2xs font-black text-slate-800 select-all">{p.email}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wider uppercase ${
                                  p.role === "Admin" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                                }`}>
                                  {p.role}
                                </span>
                              </div>
                              {p.engineerName && (
                                <p className="text-2xs font-extrabold text-slate-700">
                                  {p.engineerName}
                                </p>
                              )}
                              {p.projectName && (
                                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold mt-1">
                                  <Landmark className="w-2.5 h-2.5 text-slate-500" />
                                  <span>{p.projectName}</span>
                                </div>
                              )}
                              <p className="text-[9px] text-slate-400 font-medium font-mono mt-0.5">PWD: {p.password || "******"}</p>
                            </div>
                            
                            <button
                              onClick={() => handleDeleteProfile(p.id, p.email, p.projectName)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-90 cursor-pointer shrink-0"
                              title="Delete Profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Home Indicator */}
        <div className="hidden sm:block md:hidden absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-700/60 rounded-full z-50"></div>
      </div>
    </div>
  );
}
