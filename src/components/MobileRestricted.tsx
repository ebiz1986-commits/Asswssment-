import { Smartphone, LogOut, ShieldAlert, Camera, CheckCircle2, Laptop } from "lucide-react";

interface MobileRestrictedProps {
  onBypass: () => void;
  onLogout: () => void;
  userEmail: string | null;
}

export default function MobileRestricted({ onBypass, onLogout, userEmail }: MobileRestrictedProps) {
  return (
    <div className="min-h-[100dvh] bg-slate-900 flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-md bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col items-center text-center space-y-6">
        
        {/* Header Alert Icon */}
        <div className="relative">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center animate-pulse">
            <Smartphone className="w-8 h-8 text-rose-400" />
          </div>
          <div className="absolute -top-1 -right-1 bg-rose-600 rounded-full p-1 border border-slate-950">
            <ShieldAlert className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* Branding & Alert Heading */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-rose-400 tracking-wider uppercase bg-rose-500/5 px-2.5 py-1 rounded-full border border-rose-500/10">
            Access Restricted
          </span>
          <h1 className="text-xl font-black text-white tracking-tight mt-3">
            Mobile Device Required
          </h1>
          <p className="text-2xs text-slate-400 font-medium">
            Signed in as: <strong className="text-slate-300 font-semibold">{userEmail}</strong>
          </p>
        </div>

        <div className="w-full h-px bg-slate-800/60" />

        {/* Informative Explanation */}
        <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
          To maintain data integrity, capture live on-site photographs of candidates, and utilize optimized mobile assessment rubrics, Sanken Overseas requires all non-administrator users to access this portal exclusively from a mobile smartphone or tablet.
        </p>

        {/* Feature Highlights of Mobile */}
        <div className="w-full bg-slate-900/40 rounded-2xl border border-slate-800/50 p-4 text-left space-y-3">
          <h2 className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-1">
            Why Mobile Only?
          </h2>
          
          <div className="flex items-start space-x-2.5 text-2xs">
            <Camera className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-slate-200">On-Site Candidate Verification</p>
              <p className="text-slate-400 mt-0.5">Capture live, high-quality photos of candidates during field practical tests.</p>
            </div>
          </div>

          <div className="flex items-start space-x-2.5 text-2xs">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-slate-200">Touch-Optimized Scorecard Rubrics</p>
              <p className="text-slate-400 mt-0.5">Quick-tap performance evaluations designed specifically for one-handed mobile layouts.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          <button
            onClick={onLogout}
            className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-rose-950/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Account</span>
          </button>

          <div className="pt-2 text-center">
            <p className="text-[10px] text-slate-500 font-medium">
              Want to see the Admin dashboard? Sign in with an Admin account on your computer.
            </p>
          </div>
        </div>

        {/* Bypass for Testing / Preview Mode */}
        <div className="w-full pt-4 border-t border-slate-800/40">
          <button
            onClick={onBypass}
            className="text-[10px] font-extrabold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center justify-center space-x-1.5 mx-auto py-1 px-2.5 rounded-lg hover:bg-indigo-500/5 border border-transparent hover:border-indigo-500/10 cursor-pointer active:scale-98"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Developer Preview: Bypass Restrictions</span>
          </button>
        </div>

      </div>
    </div>
  );
}
