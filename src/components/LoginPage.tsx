import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { Shield, Key, Mail, AlertCircle, Info, Signal, Wifi, Battery, Landmark, UserCheck, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Multi-profile selection states
  const [matchingProfiles, setMatchingProfiles] = useState<any[]>([]);
  const [showProjectSelector, setShowProjectSelector] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail.endsWith("@sankenoverseas.com")) {
      setError("Unauthorized domain. Please use a @sankenoverseas.com email.");
      setLoading(false);
      return;
    }

    try {
      // 1. Check for Default Master Admin
      if (trimmedEmail === "admin@sankenoverseas.com" && password === "SankenAdmin2026!") {
        try {
          await signInWithEmailAndPassword(auth, trimmedEmail, password);
        } catch (authErr: any) {
          if (authErr.code === "auth/user-not-found" || authErr.code === "auth/invalid-credential") {
            // Auto-register default admin if they don't exist yet in Auth
            await createUserWithEmailAndPassword(auth, trimmedEmail, password);
          } else {
            throw authErr;
          }
        }
        localStorage.setItem("active_profile", JSON.stringify({
          id: "admin",
          email: "admin@sankenoverseas.com",
          role: "Admin",
          projectName: "All Projects",
          engineerName: "Master Admin"
        }));
        navigate("/");
        return;
      }

      // 2. Query user profiles collection in Firestore for custom users matching email
      const q = query(collection(db, "user_profiles"), where("email", "==", trimmedEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Account not found. Please contact an admin to create your profile.");
        setLoading(false);
        return;
      }

      const foundProfiles: any[] = [];
      querySnapshot.forEach((doc) => {
        foundProfiles.push({ id: doc.id, ...doc.data() });
      });

      // Filter profiles where password matches
      const passwordMatched = foundProfiles.filter((p) => p.password === password);

      if (passwordMatched.length === 0) {
        setError("Incorrect password.");
        setLoading(false);
        return;
      }

      if (passwordMatched.length === 1) {
        // Exactly one project profile matches
        const selectedProfile = passwordMatched[0];
        localStorage.setItem("active_profile", JSON.stringify(selectedProfile));

        // Authenticate with Firebase Auth (auto-register if not yet in Auth)
        try {
          await signInWithEmailAndPassword(auth, trimmedEmail, password);
        } catch (authErr: any) {
          if (authErr.code === "auth/user-not-found" || authErr.code === "auth/invalid-credential") {
            await createUserWithEmailAndPassword(auth, trimmedEmail, password);
          } else {
            throw authErr;
          }
        }
        navigate("/");
      } else {
        // Multiple projects match! Let the user select
        setMatchingProfiles(passwordMatched);
        setShowProjectSelector(true);
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Failed to sign in. Please try again.");
      setLoading(false);
    }
  };

  const handleSelectProfile = async (profile: any) => {
    setError("");
    setLoading(true);
    try {
      localStorage.setItem("active_profile", JSON.stringify(profile));

      // Authenticate with Firebase Auth
      try {
        await signInWithEmailAndPassword(auth, profile.email, password);
      } catch (authErr: any) {
        if (authErr.code === "auth/user-not-found" || authErr.code === "auth/invalid-credential") {
          await createUserWithEmailAndPassword(auth, profile.email, password);
        } else {
          throw authErr;
        }
      }
      navigate("/");
    } catch (err: any) {
      console.error("Profile selection login error:", err);
      setError("Failed to complete login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-900 flex items-center justify-center p-0 sm:p-5 md:p-8 select-none">
      <div className="w-full h-[100dvh] sm:w-[380px] sm:h-[820px] sm:rounded-[44px] bg-slate-950 sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden sm:border-[10px] sm:border-slate-800 relative">
        
        {/* Notch */}
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6.5 bg-slate-800 rounded-b-2xl z-50">
          <div className="w-14 h-1 bg-slate-950 rounded-full mx-auto mt-1.5"></div>
        </div>

        {/* Status bar */}
        <div className="bg-slate-900 text-slate-300 px-6 pt-2 pb-1.5 hidden sm:flex items-center justify-between text-[10px] font-bold tracking-tight shrink-0">
          <span className="font-semibold">9:41 AM</span>
          <div className="flex items-center space-x-1.5">
            <Signal className="w-3.5 h-3.5 text-slate-300" />
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <Battery className="w-4 h-4 text-slate-300" />
          </div>
        </div>

        {/* Login Form Content */}
        <div className="flex-1 bg-slate-50 flex flex-col justify-between overflow-y-auto custom-scrollbar p-6">
          <div className="my-auto space-y-6">
            
            {/* Logo/Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Sanken Overseas
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Trades Assessment Portal
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl flex items-start gap-2 text-xs font-semibold animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Selector OR Form */}
            {showProjectSelector ? (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                    <Landmark className="w-5 h-5 text-slate-700" />
                  </div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">Select Project</h2>
                  <p className="text-[10px] text-slate-500 font-semibold leading-tight">
                    Multiple project accounts found for <span className="font-black text-slate-800">{email}</span>. Please choose:
                  </p>
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                  {matchingProfiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProfile(p)}
                      disabled={loading}
                      className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 p-3 rounded-xl transition-all active:scale-98 cursor-pointer flex items-center justify-between group shadow-3xs disabled:opacity-55"
                    >
                      <div className="space-y-0.5 pr-2">
                        <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                          <Landmark className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{p.projectName || "Default Project"}</span>
                        </p>
                        {p.engineerName && (
                          <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{p.engineerName}</span>
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowProjectSelector(false);
                    setMatchingProfiles([]);
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer text-center"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@sankenoverseas.com"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium transition-all"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium transition-all"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-black tracking-tight transition-all active:scale-95 shadow-md shadow-slate-900/10 flex items-center justify-center cursor-pointer disabled:opacity-55"
                >
                  {loading ? "Authenticating..." : "Sign In"}
                </button>
              </form>
            )}

            {/* Admin Provided Login Guide Block */}
            <div className="bg-slate-100 border border-slate-200/60 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-2xs uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>Default Admin Credentials</span>
              </div>
              <div className="text-2xs text-slate-600 space-y-1 font-medium">
                <div className="flex justify-between border-b border-slate-200/40 pb-1">
                  <span>Username:</span>
                  <span className="font-bold text-slate-800 select-all font-mono">admin@sankenoverseas.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Password:</span>
                  <span className="font-bold text-slate-800 select-all font-mono">SankenAdmin2026!</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 text-center leading-normal pt-1">
                Use the admin panel once logged in to create new user profiles.
              </p>
            </div>

          </div>
        </div>

        {/* Home Indicator */}
        <div className="hidden sm:block absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-700/60 rounded-full z-50"></div>
      </div>
    </div>
  );
}
