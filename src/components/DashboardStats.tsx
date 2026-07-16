import { useMemo } from "react";
import { Candidate } from "../types";
import { calculateOverallScore } from "../utils";
import { Users, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

interface DashboardStatsProps {
  candidates: Candidate[];
  positionId: 'bar_bender' | 'finishing_carpenter' | 'labour' | 'mason' | 'rigger' | 'shoutering_carpenter' | 'spray_painter' | 'survey_helper' | 'tile_mason' | 'wall_painter';
  darkMode?: boolean;
}

export default function DashboardStats({ candidates, positionId, darkMode = false }: DashboardStatsProps) {
  const stats = useMemo(() => {
    // Filter candidates by current position
    const tradeCandidates = candidates.filter((c) => c.positionId === positionId);
    
    const total = tradeCandidates.length;
    const selected = tradeCandidates.filter((c) => c.status === "Selected").length;
    const pending = tradeCandidates.filter((c) => c.status === "Pending Practical").length;
    const onHold = tradeCandidates.filter((c) => c.status === "On Hold").length;
    const rejected = tradeCandidates.filter((c) => c.status === "Rejected").length;

    // Calculate averages
    const avgScore =
      total > 0
        ? Math.round(
            tradeCandidates.reduce((sum, c) => sum + calculateOverallScore(c), 0) / total
          )
        : 0;

    const selectionRate = total > 0 ? Math.round((selected / total) * 100) : 0;

    return {
      total,
      selected,
      pending,
      onHold,
      rejected,
      avgScore,
      selectionRate,
    };
  }, [candidates, positionId]);

  return (
    <div id="dashboard-stats-mobile" className={`grid grid-cols-3 gap-2.5 p-3.5 border-b shrink-0 no-print transition-colors duration-300 ${
      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
    }`}>
      
      {/* Total Assessed Bento Card */}
      <div className={`rounded-xl p-2.5 border text-center flex flex-col justify-between shadow-3xs transition-colors duration-300 ${
        darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-100'
      }`}>
        <span className={`text-[8px] font-bold uppercase tracking-widest block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Assessed</span>
        <div className="my-1.5 flex items-center justify-center gap-1">
          <Users className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          <span className={`text-sm font-black leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stats.total}</span>
        </div>
        <span className={`text-[8px] leading-none block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Total workers</span>
      </div>

      {/* Average Competency Bento Card */}
      <div className={`rounded-xl p-2.5 border text-center flex flex-col justify-between shadow-3xs transition-colors duration-300 ${
        darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-100'
      }`}>
        <span className={`text-[8px] font-bold uppercase tracking-widest block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Avg Score</span>
        <div className="my-1.5 flex items-center justify-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className={`text-sm font-black leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stats.avgScore}%</span>
        </div>
        <span className={`text-[8px] leading-none block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Comp level</span>
      </div>

      {/* Selection Rate Bento Card */}
      <div className={`rounded-xl p-2.5 border text-center flex flex-col justify-between shadow-3xs transition-colors duration-300 ${
        darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-100'
      }`}>
        <span className={`text-[8px] font-bold uppercase tracking-widest block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Pass Rate</span>
        <div className="my-1.5 flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className={`text-sm font-black leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stats.selectionRate}%</span>
        </div>
        <span className={`text-[8px] leading-none block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Selected rate</span>
      </div>
    </div>
  );
}
