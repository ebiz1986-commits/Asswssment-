import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { Shield, Key, Mail, AlertCircle, Info, Signal, Wifi, Battery } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        navigate("/");
        return;
      }

      // 2. Check user profiles collection in Firestore for custom users
      const userDocRef = doc(db, "user_profiles", trimmedEmail);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setError("Account not found. Please contact an admin to create your profile.");
        setLoading(false);
        return;
      }

      const profile = userDocSnap.data();
      if (profile.password !== password) {
        setError("Incorrect password.");
        setLoading(false);
        return;
      }

      // 3. Authenticate with Firebase Auth (auto-register if not yet in Auth)
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
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Failed to sign in. Please try again.");
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

            {/* Form */}
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
