import { useState, useMemo } from "react";
import { Candidate, POSITIONS } from "../types";
import { calculateOverallScore, getStatusColor } from "../utils";
import { Search, Plus, ArrowLeft, SlidersHorizontal, Award, Scale, Phone } from "lucide-react";

interface CandidateListProps {
  candidates: Candidate[];
  selectedId: string | null;
  positionId: 'bar_bender' | 'finishing_carpenter' | 'labour' | 'mason';
  onSelect: (id: string) => void;
  onAddNew: () => void;
  onBackToPositions: () => void;
}

export default function CandidateList({
  candidates,
  selectedId,
  positionId,
  onSelect,
  onAddNew,
  onBackToPositions,
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
    <div id="candidate-list-mobile" className="flex flex-col h-full bg-slate-50 animate-fadeIn relative pb-20">
      
      {/* Mobile Top Navigation Header */}
      <div className="bg-slate-900 text-white px-4 py-4.5 flex items-center space-x-3 shadow-md shrink-0">
        <button
          id="btn-back-to-positions"
          onClick={onBackToPositions}
          className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer active:scale-95 text-slate-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[9px] uppercase font-mono tracking-widest text-blue-400 font-bold block leading-none">Assessment List</span>
          <h1 className="text-base font-bold text-white tracking-tight mt-0.5">
            {tradeInfo?.title || "Trade"} Directory
          </h1>
        </div>
      </div>

      {/* Directory Search & Filters bar */}
      <div className="p-3.5 bg-white border-b border-slate-100 shadow-3xs shrink-0 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            id="mobile-search-input"
            type="text"
            placeholder={`Search ${tradeInfo?.title || "worker"} by name...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                    ? "bg-slate-900 text-white border-slate-900"
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
              showSortDropdown ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Sort Selector */}
        {showSortDropdown && (
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 animate-slideDown flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold">Sorting Criteria:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setShowSortDropdown(false);
              }}
              className="bg-white border border-slate-200 text-slate-800 font-bold py-1 px-2.5 rounded-lg focus:outline-hidden text-xs cursor-pointer"
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
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-100/60 shadow-3xs">
            <p className="text-sm font-semibold text-slate-400">No candidates found</p>
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
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative active:scale-99 ${
                  isSelected
                    ? "bg-blue-50/60 border-blue-200 shadow-xs ring-1 ring-blue-100"
                    : "bg-white hover:bg-slate-50 border-slate-100/80 shadow-3xs"
                }`}
              >


                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight font-sans line-clamp-1">{c.name}</h3>
                    <p className="text-4xs text-slate-400 font-mono tracking-widest mt-0.5">{c.referenceId}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-4xs font-bold rounded-full border tracking-wide uppercase ${getStatusColor(
                      c.status
                    )}`}
                  >
                    {c.status === "Pending Practical" ? "Pending" : c.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100/60 text-2xs">
                  <div className="flex items-center space-x-1.5 text-slate-600">
                    <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[9px] text-slate-400 leading-none">Competency</p>
                      <p className="font-extrabold text-slate-800 mt-0.5">{overallScore}%</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 text-slate-600">
                    <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[9px] text-slate-400 leading-none">Practical Test</p>
                      <p className="font-extrabold text-slate-800 mt-0.5">
                        {c.practicalTestRequired ? "Required" : "Not Required"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 text-[10px] text-slate-400 font-medium">
                  <span>Assessor: {c.assessor || "N/A"}</span>
                  <span className="flex items-center gap-1 font-mono text-[9px]">
                    <Phone className="w-2.5 h-2.5 text-slate-300" />
                    {c.contact ? c.contact : "No Contact"}
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
