import { useState } from "react";
import { Candidate, POSITIONS, getPositionRubrics } from "../types";
import {
  calculateS1Score,
  calculateS2Score,
  calculateS3Score,
  calculateOverallScore,
  getStatusColor,
} from "../utils";
import {
  Printer,
  Edit,
  Trash2,
  Calendar,
  User,
  Phone,
  AlertTriangle,
  FileText,
  UserCheck,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Award,
  BookOpen,
  Heart,
  Hammer
} from "lucide-react";

interface CandidateDetailProps {
  candidate: Candidate;
  onEdit: (candidate: Candidate) => void;
  onDelete: (id: string) => void;
  onBackToList: () => void;
}

export default function CandidateDetail({
  candidate,
  onEdit,
  onDelete,
  onBackToList,
}: CandidateDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Accordion state for rubric sections on mobile
  const [expandedSection, setExpandedSection] = useState<string | null>("s1");

  const s1 = calculateS1Score(candidate);
  const s2 = calculateS2Score(candidate);
  const s3 = calculateS3Score(candidate);
  const overall = calculateOverallScore(candidate);

  // Get dynamic rubric definitions
  const rubrics = getPositionRubrics(candidate.positionId);
  const positionInfo = POSITIONS.find(p => p.id === candidate.positionId);

  const handlePrint = () => {
    window.print();
  };

  const getPracticalGrade = (required: boolean) => {
    if (required) {
      return { label: "Required", color: "text-amber-700 bg-amber-50 border-amber-100" };
    }
    return { label: "Not Required", color: "text-slate-600 bg-slate-100 border-slate-200" };
  };

  const practicalGrade = getPracticalGrade(candidate.practicalTestRequired);

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  return (
    <div id="candidate-detail-mobile" className="flex flex-col h-full bg-slate-50 animate-fadeIn overflow-hidden">
      
      {/* Mobile Top Navigation (Hidden on Print) */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 no-print">
        <div className="flex items-center space-x-2.5">
          <button
            id="btn-detail-back"
            onClick={onBackToList}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[9px] uppercase font-mono tracking-widest text-blue-400 font-bold block leading-none">Scorecard Details</span>
            <h1 className="text-sm font-bold text-white mt-0.5 line-clamp-1">
              {candidate.name}
            </h1>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-1">
          <button
            id="btn-detail-edit"
            onClick={() => onEdit(candidate)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-200 cursor-pointer"
            title="Edit Assessment"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            id="btn-detail-print"
            onClick={handlePrint}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-200 cursor-pointer"
            title="Print Scorecard"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Detail Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar print-container print:p-0">
        
        {/* PRINT ONLY HEADER - Preserves previous printable layout */}
        <div className="hidden print-only border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">CONSTRUCTION TRADES ASSESSMENT CENTRE</h1>
              <p className="text-xs text-slate-500 font-mono">STANDARDIZED {positionInfo?.title.toUpperCase()} SKILLS EVALUATION FORM</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold bg-slate-900 text-white px-2.5 py-1 rounded">
                SCORECARD: {positionInfo?.title.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Candidate Profile Metadata */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-3xs space-y-4 print:border-none print:shadow-none print:p-0 print:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-100/60">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase font-mono tracking-wider">
                  {positionInfo?.title}
                </span>
                <span className={`px-2 py-0.5 text-4xs font-bold rounded-full border tracking-wide uppercase ${getStatusColor(candidate.status)}`}>
                  {candidate.status === "Pending Practical" ? "Pending" : candidate.status}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-950 font-sans mt-1">
                {candidate.name}
              </h2>
            </div>

            {/* Overall Metric Circular Score */}
            <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 self-stretch sm:self-auto justify-center print:border-none print:bg-white print:p-0">
              <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="21" className="stroke-slate-200/60" strokeWidth="4.5" fill="transparent" />
                  <circle
                    cx="24"
                    cy="24"
                    r="21"
                    className="stroke-blue-600 transition-all duration-300"
                    strokeWidth="4.5"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 21}`}
                    strokeDashoffset={`${2 * Math.PI * 21 * (1 - overall / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-2xs font-extrabold text-slate-900">{overall}%</span>
              </div>
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">COMPETENCY</p>
                <p className="text-xs font-black text-slate-800 mt-1">Overall score</p>
              </div>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-3.5 text-2xs text-slate-600">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong className="text-slate-800 font-semibold">Ref No:</strong> {candidate.referenceId}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong className="text-slate-800 font-semibold">Date:</strong> {candidate.date}</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong className="text-slate-800 font-semibold">Assessor:</strong> {candidate.assessor || "N/A"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong className="text-slate-800 font-semibold">Contact:</strong> {candidate.contact || "N/A"}</span>
            </div>
          </div>
        </div>



        {/* Interactive Rubrics Container (Accordions on screen, fully expanded on print) */}
        <div className="space-y-3">
          
          {/* S1 Accordion */}
          <div className="bg-white rounded-2xl border-l-[6px] border-l-blue-600 border-y border-r border-slate-200 shadow-3xs overflow-hidden">
            <button
              onClick={() => toggleSection("s1")}
              className={`w-full px-4 py-3.5 flex items-center justify-between text-left cursor-pointer no-print active:bg-blue-50/40 transition-all ${expandedSection === "s1" ? "bg-blue-50/20" : ""}`}
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <Award className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 font-sans">Section 1: Experience & Quals</h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Subtotal: {s1.raw}/100 | Weight: 50%</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-blue-800 font-mono bg-blue-100/70 px-2.5 py-0.5 rounded-lg border border-blue-200/50">
                  {s1.weighted}%
                </span>
                {expandedSection === "s1" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            {/* Content block: visible when expanded or on print */}
            {(expandedSection === "s1" || window.matchMedia("print").matches) && (
              <div className="p-4 pt-4 border-t border-slate-100 space-y-4 bg-slate-50/30">
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-2xs font-semibold text-slate-600">
                      <span>{rubrics.s1.s1_siteExperience.label}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-500 font-medium">Mark: <strong className="text-slate-800 font-bold">{candidate.s1_siteExperience}/100</strong></span>
                        <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold">Res: {Math.round(((candidate.s1_siteExperience || 0) / 100) * 50 * 10) / 10}/50</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${candidate.s1_siteExperience}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">{rubrics.s1.s1_siteExperience.description}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-2xs font-semibold text-slate-600">
                      <span>{rubrics.s1.s1_nvqQualification.label}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-500 font-medium">Mark: <strong className="text-slate-800 font-bold">{candidate.s1_nvqQualification}/100</strong></span>
                        <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold">Res: {Math.round(((candidate.s1_nvqQualification || 0) / 100) * 30 * 10) / 10}/30</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${candidate.s1_nvqQualification}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">{rubrics.s1.s1_nvqQualification.description}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-2xs font-semibold text-slate-600">
                      <span>{rubrics.s1.s1_recommendation.label}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-500 font-medium">Mark: <strong className="text-slate-800 font-bold">{candidate.s1_recommendation}/100</strong></span>
                        <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold">Res: {Math.round(((candidate.s1_recommendation || 0) / 100) * 20 * 10) / 10}/20</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${candidate.s1_recommendation}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">{rubrics.s1.s1_recommendation.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* S2 Accordion */}
          <div className="bg-white rounded-2xl border-l-[6px] border-l-indigo-600 border-y border-r border-slate-200 shadow-3xs overflow-hidden">
            <button
              onClick={() => toggleSection("s2")}
              className={`w-full px-4 py-3.5 flex items-center justify-between text-left cursor-pointer no-print active:bg-indigo-50/40 transition-all ${expandedSection === "s2" ? "bg-indigo-50/20" : ""}`}
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <BookOpen className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 font-sans">Section 2: Knowledge & Practice</h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Subtotal: {s2.raw}/100 | Weight: 40%</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-indigo-800 font-mono bg-indigo-100/70 px-2.5 py-0.5 rounded-lg border border-indigo-200/50">
                  {s2.weighted}%
                </span>
                {expandedSection === "s2" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            {/* Content block: visible when expanded or on print */}
            {(expandedSection === "s2" || window.matchMedia("print").matches) && (
              <div className="p-4 pt-4 border-t border-slate-100 space-y-4 bg-slate-50/30">
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-2xs font-semibold text-slate-600">
                      <span>{rubrics.s2.s2_measurementReading.label}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-500 font-medium">Mark: <strong className="text-slate-800 font-bold">{candidate.s2_measurementReading}/100</strong></span>
                        <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">Res: {Math.round(((candidate.s2_measurementReading || 0) / 100) * 20 * 10) / 10}/20</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${candidate.s2_measurementReading}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">{rubrics.s2.s2_measurementReading.description}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-2xs font-semibold text-slate-600">
                      <span>{rubrics.s2.s2_machineKnowledge.label}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-500 font-medium">Mark: <strong className="text-slate-800 font-bold">{candidate.s2_machineKnowledge}/100</strong></span>
                        <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">Res: {Math.round(((candidate.s2_machineKnowledge || 0) / 100) * 20 * 10) / 10}/20</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${candidate.s2_machineKnowledge}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">{rubrics.s2.s2_machineKnowledge.description}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-2xs font-semibold text-slate-600">
                      <span>{rubrics.s2.s2_methodology.label}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-500 font-medium">Mark: <strong className="text-slate-800 font-bold">{candidate.s2_methodology}/100</strong></span>
                        <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">Res: {Math.round(((candidate.s2_methodology || 0) / 100) * 50 * 10) / 10}/50</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${candidate.s2_methodology}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">{rubrics.s2.s2_methodology.description}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-2xs font-semibold text-slate-600">
                      <span>{rubrics.s2.s2_hseEquipment.label}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-500 font-medium">Mark: <strong className="text-slate-800 font-bold">{candidate.s2_hseEquipment}/100</strong></span>
                        <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">Res: {Math.round(((candidate.s2_hseEquipment || 0) / 100) * 10 * 10) / 10}/10</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${candidate.s2_hseEquipment}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">{rubrics.s2.s2_hseEquipment.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* S3 Accordion */}
          <div className="bg-white rounded-2xl border-l-[6px] border-l-amber-500 border-y border-r border-slate-200 shadow-3xs overflow-hidden">
            <button
              onClick={() => toggleSection("s3")}
              className={`w-full px-4 py-3.5 flex items-center justify-between text-left cursor-pointer no-print active:bg-amber-50/40 transition-all ${expandedSection === "s3" ? "bg-amber-50/20" : ""}`}
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                  <Heart className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 font-sans">Section 3: Appearance & Attitude</h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Subtotal: {s3.raw}/100 | Weight: 10%</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-amber-800 font-mono bg-amber-100/70 px-2.5 py-0.5 rounded-lg border border-amber-200/50">
                  {s3.weighted}%
                </span>
                {expandedSection === "s3" ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            {/* Content block: visible when expanded or on print */}
            {(expandedSection === "s3" || window.matchMedia("print").matches) && (
              <div className="p-4 pt-4 border-t border-slate-100 space-y-4 bg-slate-50/30">
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-2xs font-semibold text-slate-600">
                      <span>{rubrics.s3.s3_physicalAppearance.label}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-500 font-medium">Mark: <strong className="text-slate-800 font-bold">{candidate.s3_physicalAppearance}/100</strong></span>
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold">Res: {Math.round(((candidate.s3_physicalAppearance || 0) / 100) * 25 * 10) / 10}/25</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-600 h-full rounded-full" style={{ width: `${candidate.s3_physicalAppearance}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">{rubrics.s3.s3_physicalAppearance.description}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-2xs font-semibold text-slate-600">
                      <span>{rubrics.s3.s3_healthCondition.label}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-500 font-medium">Mark: <strong className="text-slate-800 font-bold">{candidate.s3_healthCondition}/100</strong></span>
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold">Res: {Math.round(((candidate.s3_healthCondition || 0) / 100) * 25 * 10) / 10}/25</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-600 h-full rounded-full" style={{ width: `${candidate.s3_healthCondition}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">{rubrics.s3.s3_healthCondition.description}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-2xs font-semibold text-slate-600">
                      <span>{rubrics.s3.s3_characterAttitude.label}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-500 font-medium">Mark: <strong className="text-slate-800 font-bold">{candidate.s3_characterAttitude}/100</strong></span>
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold">Res: {Math.round(((candidate.s3_characterAttitude || 0) / 100) * 30 * 10) / 10}/30</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-600 h-full rounded-full" style={{ width: `${candidate.s3_characterAttitude}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">{rubrics.s3.s3_characterAttitude.description}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-2xs font-semibold text-slate-600">
                      <span>{rubrics.s3.s3_extendedHours.label}</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-500 font-medium">Mark: <strong className="text-slate-800 font-bold">{candidate.s3_extendedHours}/100</strong></span>
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold">Res: {Math.round(((candidate.s3_extendedHours || 0) / 100) * 20 * 10) / 10}/20</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-600 h-full rounded-full" style={{ width: `${candidate.s3_extendedHours}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">{rubrics.s3.s3_extendedHours.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Practical Field Test Section Card */}
        <div className="bg-white rounded-2xl border-l-[6px] border-l-emerald-600 border-y border-r border-slate-200/80 p-4.5 shadow-3xs space-y-4">
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 font-sans">
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
              <Hammer className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span>Field Bench Practical Test</span>
          </h3>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between items-center text-2xs font-semibold text-slate-600">
                <span>Bench Fabrication Test Status</span>
                <div className="flex items-center space-x-1.5">
                  {candidate.practicalTestRequired ? (
                    <span className="font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100 text-3xs">
                      REQUIRED (YES)
                    </span>
                  ) : (
                    <span className="font-extrabold text-slate-700 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-100 text-3xs">
                      NOT REQUIRED (NO)
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                Practical assessment of speed, accuracy, safety compliance, and trade-specific blueprint execution under real site conditions.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-200/80 bg-slate-50/50 text-center shrink-0 min-w-[120px]">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">RATING</span>
              <span className={`mt-1.5 px-2.5 py-0.5 text-3xs font-extrabold rounded-md border tracking-wide uppercase ${practicalGrade.color}`}>
                {practicalGrade.label}
              </span>
            </div>
          </div>
        </div>

        {/* Remarks & Signatures */}
        <div className="bg-white rounded-2xl border-l-[6px] border-l-slate-700 border-y border-r border-slate-200/80 p-4.5 shadow-3xs space-y-4">
          <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 font-sans">
            <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
              <UserCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span>Assessor Final Remarks</span>
          </h3>
          <p className="text-xs text-slate-600 italic bg-slate-50/60 p-3.5 rounded-xl border border-slate-100/50 leading-relaxed">
            &ldquo;{candidate.notes || "No custom evaluation comments entered. Subject evaluated under standardized trade protocols."}&rdquo;
          </p>

          {/* SIGNATURES BLOCK FOR PRINT LAYOUT */}
          <div className="hidden print-only pt-10 grid grid-cols-2 gap-12 text-center text-xs">
            <div className="space-y-4">
              <div className="border-b border-slate-400 h-8"></div>
              <p className="font-bold text-slate-700">Assessor Signature</p>
              <p className="text-3xs text-slate-400">Date: ________________________</p>
            </div>
            <div className="space-y-4">
              <div className="border-b border-slate-400 h-8"></div>
              <p className="font-bold text-slate-700">Candidate Signature</p>
              <p className="text-3xs text-slate-400">Date: ________________________</p>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Box */}
        <div className="no-print pt-2">
          {showDeleteConfirm ? (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 space-y-3 shadow-3xs">
              <p className="text-xs font-bold text-rose-800">
                Are you absolutely sure you want to delete this scorecard record? This action cannot be undone.
              </p>
              <div className="flex items-center space-x-2">
                <button
                  id="btn-confirm-delete"
                  onClick={() => {
                    onDelete(candidate.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
                >
                  Yes, Delete Record
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-slate-200 bg-white text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              id="btn-detail-delete-trigger"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3.5 hover:bg-rose-50 border border-dashed border-rose-200 rounded-2xl text-xs font-bold text-rose-600 transition-colors flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Candidate Assessment</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
