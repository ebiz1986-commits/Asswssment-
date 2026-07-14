import React, { useState, useEffect } from "react";
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, UserPlus, Trash2, Database, ShieldAlert, CheckCircle, Mail, Key, User, Shield, Info, Signal, Wifi, Battery } from "lucide-react";

interface UserProfile {
  email: string;
  password?: string;
  role: string;
  createdAt?: string;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("User");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Users list state
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Time state for simulator notch
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // Current user validation
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        // Only allow sankenoverseas admins or default admin
        if (!user.email?.endsWith("@sankenoverseas.com")) {
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    });

    // Sync profiles in real-time
    const unsubscribeProfiles = onSnapshot(collection(db, "user_profiles"), (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        list.push({ email: doc.id, ...doc.data() } as UserProfile);
      });
      setProfiles(list);
      setLoadingProfiles(false);
    }, (error) => {
      console.error("Profiles sync error:", error);
      setLoadingProfiles(false);
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
      unsubscribeProfiles();
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

    try {
      // Write user profile to Firestore
      const userRef = doc(db, "user_profiles", emailInput);
      await setDoc(userRef, {
        email: emailInput,
        password: passwordInput, // Admin-provided password
        role: newRole,
        createdAt: new Date().toISOString()
      });

      setSuccessMsg(`Successfully created profile for ${emailInput}!`);
      setNewEmail("");
      setNewPassword("");
      setNewRole("User");
    } catch (err: any) {
      console.error("Error creating profile:", err);
      setErrorMsg("Failed to create user profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (emailToDelete: string) => {
    if (emailToDelete === "admin@sankenoverseas.com") {
      alert("Cannot delete the master admin account!");
      return;
    }

    if (window.confirm(`Are you sure you want to delete the profile for ${emailToDelete}?`)) {
      try {
        await deleteDoc(doc(db, "user_profiles", emailToDelete));
      } catch (err) {
        console.error("Error deleting profile:", err);
        alert("Failed to delete profile.");
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

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 sm:p-5 md:p-8 select-none">
      <div className="w-full h-screen sm:w-[380px] sm:h-[820px] sm:rounded-[44px] bg-slate-950 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden sm:border-[10px] sm:border-slate-800 relative">
        
        {/* Notch */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6.5 bg-slate-800 rounded-b-2xl z-50">
          <div className="w-14 h-1 bg-slate-950 rounded-full mx-auto mt-1.5"></div>
        </div>

        {/* Status bar */}
        <div className="bg-slate-900 text-slate-300 px-6 pt-2 pb-1.5 flex items-center justify-between text-[10px] font-bold tracking-tight shrink-0">
          <span className="font-semibold">{currentTime || "9:41 AM"}</span>
          <div className="flex items-center space-x-1.5">
            <Signal className="w-3.5 h-3.5 text-slate-300" />
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <Battery className="w-4 h-4 text-slate-300" />
          </div>
        </div>

        {/* Header Block */}
        <div className="bg-white border-b border-slate-100 px-4 py-3 shrink-0 flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="p-1.5 hover:bg-slate-50 active:scale-95 text-slate-700 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-2xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>App</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1 justify-center">
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

        {/* Content Console */}
        <div className="flex-1 bg-slate-50 overflow-y-auto custom-scrollbar p-4 space-y-4">
          
          {/* Seeding & Full Backup Section */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-black tracking-tight uppercase text-blue-300">Database Administration</h2>
            </div>
            <p className="text-[10px] text-slate-300 leading-normal font-medium">
              Export all stored candidates assessments and active user credentials in a single backup package.
            </p>
            <button
              onClick={handleExportDatabase}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-xl text-2xs font-extrabold tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer text-white"
            >
              <Database className="w-3.5 h-3.5" />
              Export Full Database Backup
            </button>
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

          {/* Create Profile Module */}
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

          {/* Manage Active Profiles */}
          <div className="bg-white rounded-[20px] border border-slate-100 p-4 space-y-3.5 shadow-3xs">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-slate-800" />
                <h2 className="text-xs font-black text-slate-900 tracking-tight">Active Accounts ({profiles.length + 1})</h2>
              </div>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
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
                  <div key={p.email} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between hover:border-slate-200 transition-all shadow-3xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xs font-black text-slate-800 select-all">{p.email}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wider uppercase ${
                          p.role === "Admin" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {p.role}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1 font-mono">PWD: {p.password || "******"}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteProfile(p.email)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-90 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Home Indicator */}
        <div className="hidden sm:block absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-700/60 rounded-full z-50"></div>
      </div>
    </div>
  );
}
