import { useState, useMemo } from "react";
import { Candidate, POSITIONS } from "../types";
import { calculateOverallScore, getStatusColor, exportToExcel } from "../utils";
import { Search, Plus, ArrowLeft, SlidersHorizontal, Award, Scale, Phone, Download, User } from "lucide-react";
import SankenLogo from "./SankenLogo";

interface CandidateListProps {
  candidates: Candidate[];
  selectedId: string | null;
  positionId: 'bar_bender' | 'finishing_carpenter' | 'labour' | 'mason' | 'rigger' | 'shoutering_carpenter' | 'spray_painter' | 'survey_helper' | 'tile_mason' | 'wall_painter';
  onSelect: (id: string) => void;
  onAddNew: () => void;
  onBackToPositions: () => void;
  darkMode?: boolean;
}

export default function CandidateList({
  candidates,
  selectedId,
  positionId,
  onSelect,
  onAddNew,
  onBackToPositions,
  darkMode = false,
}: CandidateListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"score-desc" | "score-asc" | "name" | "date">("score-desc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Get current trade info
  const tradeInfo = POSITIONS.find((p) => p.id === positionId);

  // Filter candidates specifically for this selected position
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((c) => {
        // Must belong to this position
        if (c.positionId !== positionId) return false;

        const matchesSearch =
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.referenceId.toLowerCase().includes(search.toLowerCase()) ||
          (c.nicNumber && c.nicNumber.toLowerCase().includes(search.toLowerCase())) ||
          (c.passportNumber && c.passportNumber.toLowerCase().includes(search.toLowerCase())) ||
          (c.assessor && c.assessor.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = statusFilter === "All" || c.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "score-desc") {
          return calculateOverallScore(b) - calculateOverallScore(a);
        }
        if (sortBy === "score-asc") {
          return calculateOverallScore(a) - calculateOverallScore(b);
        }
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "date") {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return 0;
      });
  }, [candidates, positionId, search, statusFilter, sortBy]);

  return (
    <div id="candidate-list-mobile" className={`flex flex-col h-full animate-fadeIn relative pb-20 transition-colors duration-300 ${
      darkMode ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      
      {/* Mobile Top Navigation Header */}
      <div className="bg-gradient-to-r from-[#2ea1e5] to-[#1e88e5] text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center space-x-2.5">
          <button
            id="btn-back-to-positions"
            onClick={onBackToPositions}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer active:scale-95 text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <SankenLogo className="w-7 h-7" />
            <div>
              <span className="text-[8px] uppercase font-mono tracking-widest text-sky-100 font-bold block leading-none">Assessment List</span>
              <h1 className="text-sm font-black text-white tracking-tight mt-0.5">
                {tradeInfo?.title || "Trade"} Directory
              </h1>
            </div>
          </div>
        </div>

        {/* Excel Export Button */}
        <button
          onClick={() => {
            const filterText = statusFilter !== "All" ? `_${statusFilter}` : "";
            exportToExcel(filteredCandidates, `${positionId}_candidates${filterText}`);
          }}
          className="p-1.5 hover:bg-white/10 text-white border border-white/20 bg-white/10 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 text-[10px] font-black shadow-3xs px-2.5"
          title="Download filtered assessments as Excel"
        >
          <Download className="w-3.5 h-3.5 text-white" />
          <span>Excel</span>
        </button>
      </div>

      {/* Directory Search & Filters bar */}
      <div className={`p-3.5 border-b shadow-3xs shrink-0 space-y-3 transition-colors duration-300 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            id="mobile-search-input"
            type="text"
            placeholder={`Search ${tradeInfo?.title || "worker"} by name...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9.5 pr-4 py-2 border rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              darkMode
                ? 'bg-slate-950/70 border-slate-800 text-slate-100 focus:bg-slate-900'
                : 'bg-slate-50/50 border-slate-200 text-slate-800 focus:bg-white'
            }`}
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar flex-1 max-w-[82%]">
            {["All", "Selected", "Pending Practical", "On Hold", "Rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === status
                    ? "bg-[#1e88e5] text-white border-[#1e88e5]"
                    : darkMode
                      ? "bg-slate-800 hover:bg-slate-755 text-slate-300 border-slate-700"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {status === "Pending Practical" ? "Pending" : status}
              </button>
            ))}
          </div>

          {/* Sort button */}
          <button
            id="btn-toggle-sort"
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              showSortDropdown 
                ? "bg-[#1e88e5] text-white border-[#1e88e5]" 
                : darkMode
                  ? "bg-slate-800 text-slate-300 border-slate-700"
                  : "bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Sort Selector */}
        {showSortDropdown && (
          <div className={`p-2 rounded-xl border animate-slideDown flex items-center justify-between text-xs transition-colors ${
            darkMode ? 'bg-slate-850 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'
          }`}>
            <span className="font-semibold">Sorting Criteria:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setShowSortDropdown(false);
              }}
              className={`font-bold py-1 px-2.5 rounded-lg focus:outline-hidden text-xs cursor-pointer border ${
                darkMode
                  ? 'bg-slate-900 border-slate-700 text-slate-200'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="score-desc">Highest Score</option>
              <option value="score-asc">Lowest Score</option>
              <option value="name">Name (A-Z)</option>
              <option value="date">Evaluation Date</option>
            </select>
          </div>
        )}
      </div>

      {/* Candidate List Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4.5 custom-scrollbar">
        {filteredCandidates.length === 0 ? (
          <div className={`text-center py-16 px-4 rounded-2xl border shadow-3xs transition-colors duration-300 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100/60'
          }`}>
            <p className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>No candidates found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
              Tap the &ldquo;+&rdquo; button below to add your first assessment.
            </p>
          </div>
        ) : (
          filteredCandidates.map((c) => {
            const overallScore = calculateOverallScore(c);
            const isSelected = selectedId === c.id;
            return (
              <div
                key={c.id}
                id={`candidate-row-${c.id}`}
                onClick={() => onSelect(c.id)}
                className={`p-4 pl-6 rounded-2xl border cursor-pointer relative overflow-hidden transition-all duration-200 active:scale-99 ${
                  isSelected
                    ? darkMode
                      ? "bg-blue-950/40 border-blue-500 shadow-lg ring-1 ring-blue-500/30"
                      : "bg-blue-50/70 border-blue-200 shadow-md ring-1 ring-blue-100"
                    : darkMode
                      ? "bg-slate-900 hover:bg-slate-800 border-slate-800 shadow-md hover:shadow-lg"
                      : "bg-white hover:bg-slate-50/50 border-slate-200/60 shadow-sm hover:shadow-md"
                }`}
              >
                {/* Visual left colored status accent bar for "cards need to be see separtly" */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${
                  overallScore > 59 ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />

                <div className="flex items-start space-x-3">
                  {c.photoUrl ? (
                    <img referrerPolicy="no-referrer" src={c.photoUrl} alt={c.name} className={`w-12 h-12 rounded-xl object-cover border shadow-3xs shrink-0 ${
                      darkMode ? 'border-slate-750' : 'border-slate-150'
                    }`} />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-600' : 'bg-slate-50 border-slate-100 text-slate-300'
                    }`}>
                      <User className="w-5 h-5 stroke-[1.8]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className={`font-extrabold text-sm tracking-tight font-sans line-clamp-1 transition-colors ${
                          darkMode ? 'text-slate-100' : 'text-slate-900'
                        }`}>{c.name}</h3>
                        <p className={`text-4xs font-mono tracking-widest mt-0.5 transition-colors ${
                          darkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}>{c.referenceId}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-4xs font-bold rounded-full border tracking-wide uppercase shrink-0 ${getStatusColor(
                          c.status
                        )}`}
                      >
                        {c.status === "Pending Practical" ? "Pending" : c.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`grid grid-cols-2 gap-2 mt-3 pt-3 border-t text-2xs transition-colors ${
                  darkMode ? 'border-slate-800' : 'border-slate-100/60'
                }`}>
                  <div className="flex items-center space-x-1.5">
                    <Award className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                    <div>
                      <p className={`text-[9px] leading-none transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Competency</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`font-extrabold transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{overallScore}%</span>
                        <span className={`px-1 py-0.2 text-[7px] font-black tracking-wider rounded uppercase border ${overallScore > 59 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
                          {overallScore > 59 ? "Pass" : "Fail"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <Scale className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                    <div>
                      <p className={`text-[9px] leading-none transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Practical Test</p>
                      <p className={`font-extrabold mt-0.5 transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        {c.practicalTestRequired ? "Required" : "Not Required"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center justify-between mt-2 pt-2 border-t text-[10px] font-medium transition-colors ${
                  darkMode ? 'border-slate-800/60 text-slate-500' : 'border-slate-50 text-slate-400'
                }`}>
                  <span className="truncate">Assessor: {c.assessor || "N/A"}</span>
                  <span className="flex items-center gap-1 font-mono text-[9px] shrink-0">
                    <Phone className={`w-2.5 h-2.5 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                    <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{c.contact ? c.contact : "No Contact"}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FLOATING ACTION BUTTON (FAB) - For native mobile feel */}
      <button
        id="btn-fab-add"
        onClick={onAddNew}
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95 z-40 border border-blue-500/35"
        title="Assess new candidate"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>
    </div>
  );
}
