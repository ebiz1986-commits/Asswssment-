import { useState, useEffect, FormEvent } from "react";
import { Candidate, POSITIONS, getPositionRubrics } from "../types";
import { migrateCandidateToHundredScale } from "../utils";
import { ArrowLeft, Calendar, ClipboardCheck, Save, Award, BookOpen, Heart, Hammer } from "lucide-react";

interface CandidateFormProps {
  candidate?: Candidate | null; // If null, we are adding new
  positionId: 'bar_bender' | 'finishing_carpenter' | 'labour' | 'mason';
  onSave: (candidate: Candidate) => void;
  onCancel: () => void;
}

export default function CandidateForm({
  candidate,
  positionId,
  onSave,
  onCancel,
}: CandidateFormProps) {
  // Load candidate and ensure values are scaled to 100-point representation
  const initialCandidate = candidate ? migrateCandidateToHundredScale(candidate) : null;

  // Base profile fields
  const [name, setName] = useState(initialCandidate?.name || "");
  const [referenceId, setReferenceId] = useState(initialCandidate?.referenceId || "");
  const [date, setDate] = useState(initialCandidate?.date || new Date().toISOString().split("T")[0]);
  const [assessor, setAssessor] = useState(initialCandidate?.assessor || "");
  const [contact, setContact] = useState(initialCandidate?.contact || "");

  // Section 1: Experience & Quals (Marks out of 100)
  const [s1_siteExperience, setS1SiteExperience] = useState<number | "">(
    initialCandidate ? initialCandidate.s1_siteExperience : 0
  );
  const [s1_nvqQualification, setS1NvqQualification] = useState<number | "">(
    initialCandidate ? initialCandidate.s1_nvqQualification : 0
  );
  const [s1_recommendation, setS1Recommendation] = useState<number | "">(
    initialCandidate ? initialCandidate.s1_recommendation : 0
  );

  // Section 2: Knowledge & Practice (Marks out of 100)
  const [s2_measurementReading, setS2MeasurementReading] = useState<number | "">(
    initialCandidate ? initialCandidate.s2_measurementReading : 0
  );
  const [s2_machineKnowledge, setS2MachineKnowledge] = useState<number | "">(
    initialCandidate ? initialCandidate.s2_machineKnowledge : 0
  );
  const [s2_methodology, setS2Methodology] = useState<number | "">(
    initialCandidate ? initialCandidate.s2_methodology : 0
  );
  const [s2_hseEquipment, setS2HseEquipment] = useState<number | "">(
    initialCandidate ? initialCandidate.s2_hseEquipment : 0
  );

  // Section 3: Appearance & Attitude (Marks out of 100)
  const [s3_physicalAppearance, setS3PhysicalAppearance] = useState<number | "">(
    initialCandidate ? initialCandidate.s3_physicalAppearance : 0
  );
  const [s3_healthCondition, setS3HealthCondition] = useState<number | "">(
    initialCandidate ? initialCandidate.s3_healthCondition : 0
  );
  const [s3_characterAttitude, setS3CharacterAttitude] = useState<number | "">(
    initialCandidate ? initialCandidate.s3_characterAttitude : 0
  );
  const [s3_extendedHours, setS3ExtendedHours] = useState<number | "">(
    initialCandidate ? initialCandidate.s3_extendedHours : 0
  );

  // Section 4: Practical Test & Remarks
  const [practicalTestRequired, setPracticalTestRequired] = useState<boolean>(
    initialCandidate ? initialCandidate.practicalTestRequired : false
  );
  const [notes, setNotes] = useState(initialCandidate?.notes || "");

  // Automatically generate reference ID prefix for new candidates
  useEffect(() => {
    if (!candidate && !referenceId) {
      const prefix =
        positionId === 'bar_bender' ? 'BB' :
        positionId === 'finishing_carpenter' ? 'FC' :
        positionId === 'labour' ? 'LA' : 'MA';
      const randNum = Math.floor(1000 + Math.random() * 9000);
      setReferenceId(`${prefix}-${randNum}`);
    }
  }, [candidate, positionId, referenceId]);

  // Position definitions and trade-specific rubrics
  const currentTrade = POSITIONS.find((p) => p.id === positionId);
  const rubrics = getPositionRubrics(positionId);

  // Safe number parser helper
  const num = (v: number | string | ""): number => {
    if (v === "" || isNaN(Number(v))) return 0;
    return Number(v);
  };

  // Live weighted contribution calculations
  const s1_siteExp_w = (num(s1_siteExperience) / 100) * 50;
  const s1_nvq_w = (num(s1_nvqQualification) / 100) * 30;
  const s1_rec_w = (num(s1_recommendation) / 100) * 20;
  const s1SubtotalRaw = s1_siteExp_w + s1_nvq_w + s1_rec_w; // out of 100
  const s1Subtotal = Math.round((s1SubtotalRaw * 0.5) * 10) / 10; // 50% section weight (out of 50)

  const s2_meas_w = (num(s2_measurementReading) / 100) * 20;
  const s2_mach_w = (num(s2_machineKnowledge) / 100) * 20;
  const s2_meth_w = (num(s2_methodology) / 100) * 50;
  const s2_hse_w = (num(s2_hseEquipment) / 100) * 10;
  const s2SubtotalRaw = s2_meas_w + s2_mach_w + s2_meth_w + s2_hse_w; // out of 100
  const s2Subtotal = Math.round((s2SubtotalRaw * 0.4) * 10) / 10; // 40% section weight (out of 40)

  const s3_phys_w = (num(s3_physicalAppearance) / 100) * 25;
  const s3_heal_w = (num(s3_healthCondition) / 100) * 25;
  const s3_char_w = (num(s3_characterAttitude) / 100) * 30;
  const s3_ext_w = (num(s3_extendedHours) / 100) * 20;
  const s3SubtotalRaw = s3_phys_w + s3_heal_w + s3_char_w + s3_ext_w; // out of 100
  const s3Subtotal = Math.round((s3SubtotalRaw * 0.1) * 10) / 10; // 10% section weight (out of 10)

  const estimatedOverallScore = Math.round((s1Subtotal + s2Subtotal + s3Subtotal) * 10) / 10;

  // Handles safe capping of user number inputs
  const handleNumberChange = (
    setter: (v: number | "") => void,
    valStr: string,
    maxVal: number
  ) => {
    if (valStr === "") {
      setter("");
      return;
    }
    let parsed = parseFloat(valStr);
    if (isNaN(parsed)) return;
    if (parsed < 0) parsed = 0;
    if (parsed > maxVal) parsed = maxVal;
    setter(parsed);
  };

  // Helper to compute automated status selection on submit
  const computeStatus = (
    overallScore: number,
    practicalRequired: boolean
  ): Candidate["status"] => {
    // If it's required, we don't know if they passed until updated elsewhere,
    // but the request is to ONLY ASK if it's required.
    // For now, if required is true, let's keep it "Pending Practical"
    if (practicalRequired) {
      return "Pending Practical";
    }
    if (overallScore >= 80) {
      return "Selected";
    }
    if (overallScore >= 55) {
      return "On Hold";
    }
    return "Rejected";
  };

  const handleSave = (isDraft: boolean) => {
    if (!name.trim()) {
      alert("Please enter the candidate's name.");
      return;
    }

    const calculatedStatus = isDraft
      ? "Draft"
      : computeStatus(estimatedOverallScore, practicalTestRequired);

    const savedCandidate: Candidate = {
      id: candidate?.id || `cand-${Date.now()}`,
      positionId,
      name: name.trim(),
      referenceId: referenceId.trim() || `REF-${Date.now()}`,
      date,
      assessor: assessor.trim() || "Assessor",
      contact: contact.trim() || "+94 77 000 0000",
      s1_siteExperience: num(s1_siteExperience),
      s1_nvqQualification: num(s1_nvqQualification),
      s1_recommendation: num(s1_recommendation),
      s2_measurementReading: num(s2_measurementReading),
      s2_machineKnowledge: num(s2_machineKnowledge),
      s2_methodology: num(s2_methodology),
      s2_hseEquipment: num(s2_hseEquipment),
      s3_physicalAppearance: num(s3_physicalAppearance),
      s3_healthCondition: num(s3_healthCondition),
      s3_characterAttitude: num(s3_characterAttitude),
      s3_extendedHours: num(s3_extendedHours),
      practicalTestRequired,
      notes: notes.trim(),
      status: calculatedStatus,
      isHundredScale: true,
    };

    onSave(savedCandidate);
  };

  const handleSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    handleSave(false);
  };

  return (
    <div id="candidate-form-v2" className="flex flex-col h-full bg-[#f8fafc] animate-fadeIn overflow-hidden">
      
      {/* 1. Header: Back Arrow, Position title Assessment, Subtitle */}
      <div className="bg-white px-6 pt-6 pb-4 flex items-start gap-4 shrink-0 border-b border-slate-100/80">
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-slate-800 shrink-0 mt-0.5"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-950 tracking-tight font-sans">
            {currentTrade?.title} Assessment
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
            Evaluate candidate competency across all criteria
          </p>
        </div>
      </div>

      {/* Form and Content container scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar pb-10">
        
        {/* 2. Total Score Card (Black rounded card with dynamic content) */}
        <div className="bg-[#141414] rounded-[20px] p-5 text-white flex flex-col justify-between shadow-xs">
          <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Total Score</span>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold text-white font-sans">{estimatedOverallScore}</span>
            <span className="text-slate-400 text-sm font-medium">/ 100</span>
          </div>
        </div>

        {/* 3. Candidate Information Card */}
        <div className="bg-white rounded-[20px] border border-slate-100 p-6 space-y-4 shadow-3xs">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight border-b border-slate-50 pb-2.5">
            Candidate Information
          </h2>

          <div className="space-y-4">
            {/* Candidate Name */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 tracking-tight mb-1.5">
                Candidate Name *
              </label>
              <input
                type="text"
                required
                placeholder="Enter candidate name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all font-semibold"
              />
            </div>

            {/* NRIC / Passport No */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 tracking-tight mb-1.5">
                NRIC / Passport No.
              </label>
              <input
                type="text"
                placeholder="e.g. 880123-14-1234"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all font-medium"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 tracking-tight mb-1.5">
                Position
              </label>
              <input
                type="text"
                readOnly
                value={currentTrade?.title || ""}
                className="w-full px-4 py-3 border border-slate-100 rounded-xl text-sm bg-slate-50 text-slate-500 font-bold focus:outline-none select-none"
              />
            </div>

            {/* Assessment Date */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 tracking-tight mb-1.5">
                Assessment Date
              </label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all font-semibold appearance-none"
                />
                <Calendar className="w-4 h-4 text-slate-500 absolute right-4 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Section 1: Experience & Qualification */}
        <div className="bg-white rounded-[20px] border-l-[6px] border-l-blue-600 border-y border-r border-slate-200/80 overflow-hidden shadow-3xs">
          <div className="bg-blue-50/40 px-5 py-4 flex justify-between items-center border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                <Award className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight font-sans">
                Section 1: Experience & Quals
              </h3>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-blue-800 text-xs font-black font-mono bg-blue-100/60 px-2.5 py-1 rounded-lg">
                {s1Subtotal} / 50
              </span>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">50% Weight</span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Site Experience */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 leading-normal">
                {rubrics.s1.s1_siteExperience.label}
              </label>
              <div className="flex gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-[#f1f5f9] text-slate-600 tracking-tight">
                  Weight: 50
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-50 text-emerald-700 tracking-tight">
                  Result: ({num(s1_siteExperience)}/100) * 50 = {Math.round(s1_siteExp_w * 10) / 10}
                </span>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={s1_siteExperience}
                  onChange={(e) => handleNumberChange(setS1SiteExperience, e.target.value, 100)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-bold"
                />
                <span className="text-slate-400 text-sm font-bold shrink-0">/ 100 marks</span>
              </div>
            </div>

            {/* NVQ Qualification */}
            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 leading-normal">
                {rubrics.s1.s1_nvqQualification.label}
              </label>
              <div className="flex gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-[#f1f5f9] text-slate-600 tracking-tight">
                  Weight: 30
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-50 text-emerald-700 tracking-tight">
                  Result: ({num(s1_nvqQualification)}/100) * 30 = {Math.round(s1_nvq_w * 10) / 10}
                </span>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={s1_nvqQualification}
                  onChange={(e) => handleNumberChange(setS1NvqQualification, e.target.value, 100)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-bold"
                />
                <span className="text-slate-400 text-sm font-bold shrink-0">/ 100 marks</span>
              </div>
            </div>

            {/* 3rd Party Recommendation */}
            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 leading-normal">
                {rubrics.s1.s1_recommendation.label}
              </label>
              <div className="flex gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-[#f1f5f9] text-slate-600 tracking-tight">
                  Weight: 20
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-50 text-emerald-700 tracking-tight">
                  Result: ({num(s1_recommendation)}/100) * 20 = {Math.round(s1_rec_w * 10) / 10}
                </span>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={s1_recommendation}
                  onChange={(e) => handleNumberChange(setS1Recommendation, e.target.value, 100)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-bold"
                />
                <span className="text-slate-400 text-sm font-bold shrink-0">/ 100 marks</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Section 2: Knowledge & Practice */}
        <div className="bg-white rounded-[20px] border-l-[6px] border-l-indigo-600 border-y border-r border-slate-200/80 overflow-hidden shadow-3xs">
          <div className="bg-indigo-50/40 px-5 py-4 flex justify-between items-center border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                <BookOpen className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight font-sans">
                Section 2: Knowledge & Practice
              </h3>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-indigo-800 text-xs font-black font-mono bg-indigo-100/60 px-2.5 py-1 rounded-lg">
                {s2Subtotal} / 40
              </span>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">40% Weight</span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Measurement Reading */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 leading-normal">
                {rubrics.s2.s2_measurementReading.label}
              </label>
              <div className="flex gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-[#f1f5f9] text-slate-600 tracking-tight">
                  Weight: 20
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-50 text-emerald-700 tracking-tight">
                  Result: ({num(s2_measurementReading)}/100) * 20 = {Math.round(s2_meas_w * 10) / 10}
                </span>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={s2_measurementReading}
                  onChange={(e) => handleNumberChange(setS2MeasurementReading, e.target.value, 100)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-bold"
                />
                <span className="text-slate-400 text-sm font-bold shrink-0">/ 100 marks</span>
              </div>
            </div>

            {/* Knowledge in Machines */}
            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 leading-normal">
                {rubrics.s2.s2_machineKnowledge.label}
              </label>
              <div className="flex gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-[#f1f5f9] text-slate-600 tracking-tight">
                  Weight: 20
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-50 text-emerald-700 tracking-tight">
                  Result: ({num(s2_machineKnowledge)}/100) * 20 = {Math.round(s2_mach_w * 10) / 10}
                </span>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={s2_machineKnowledge}
                  onChange={(e) => handleNumberChange(setS2MachineKnowledge, e.target.value, 100)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-bold"
                />
                <span className="text-slate-400 text-sm font-bold shrink-0">/ 100 marks</span>
              </div>
            </div>

            {/* Knowledge & Practise Methodology */}
            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 leading-normal">
                {rubrics.s2.s2_methodology.label}
              </label>
              <div className="flex gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-[#f1f5f9] text-slate-600 tracking-tight">
                  Weight: 50
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-50 text-emerald-700 tracking-tight">
                  Result: ({num(s2_methodology)}/100) * 50 = {Math.round(s2_meth_w * 10) / 10}
                </span>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={s2_methodology}
                  onChange={(e) => handleNumberChange(setS2Methodology, e.target.value, 100)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-bold"
                />
                <span className="text-slate-400 text-sm font-bold shrink-0">/ 100 marks</span>
              </div>
            </div>

            {/* Knowledge & Practise with HSE */}
            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 leading-normal">
                {rubrics.s2.s2_hseEquipment.label}
              </label>
              <div className="flex gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-[#f1f5f9] text-slate-600 tracking-tight">
                  Weight: 10
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-50 text-emerald-700 tracking-tight">
                  Result: ({num(s2_hseEquipment)}/100) * 10 = {Math.round(s2_hse_w * 10) / 10}
                </span>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={s2_hseEquipment}
                  onChange={(e) => handleNumberChange(setS2HseEquipment, e.target.value, 100)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-bold"
                />
                <span className="text-slate-400 text-sm font-bold shrink-0">/ 100 marks</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Section 3: Appearance & Attitude */}
        <div className="bg-white rounded-[20px] border-l-[6px] border-l-amber-500 border-y border-r border-slate-200/80 overflow-hidden shadow-3xs">
          <div className="bg-amber-50/40 px-5 py-4 flex justify-between items-center border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                <Heart className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight font-sans">
                Section 3: Appearance & Attitude
              </h3>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-amber-800 text-xs font-black font-mono bg-amber-100/60 px-2.5 py-1 rounded-lg">
                {s3Subtotal} / 10
              </span>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">10% Weight</span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Physical Appearance & Fitness */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 leading-normal">
                {rubrics.s3.s3_physicalAppearance.label}
              </label>
              <div className="flex gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-[#f1f5f9] text-slate-600 tracking-tight">
                  Weight: 25
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-50 text-emerald-700 tracking-tight">
                  Result: ({num(s3_physicalAppearance)}/100) * 25 = {Math.round(s3_phys_w * 10) / 10}
                </span>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={s3_physicalAppearance}
                  onChange={(e) => handleNumberChange(setS3PhysicalAppearance, e.target.value, 100)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-bold"
                />
                <span className="text-slate-400 text-sm font-bold shrink-0">/ 100 marks</span>
              </div>
            </div>

            {/* Health Condition */}
            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 leading-normal">
                {rubrics.s3.s3_healthCondition.label}
              </label>
              <div className="flex gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-[#f1f5f9] text-slate-600 tracking-tight">
                  Weight: 25
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-50 text-emerald-700 tracking-tight">
                  Result: ({num(s3_healthCondition)}/100) * 25 = {Math.round(s3_heal_w * 10) / 10}
                </span>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={s3_healthCondition}
                  onChange={(e) => handleNumberChange(setS3HealthCondition, e.target.value, 100)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-bold"
                />
                <span className="text-slate-400 text-sm font-bold shrink-0">/ 100 marks</span>
              </div>
            </div>

            {/* Character & Attitude */}
            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 leading-normal">
                {rubrics.s3.s3_characterAttitude.label}
              </label>
              <div className="flex gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-[#f1f5f9] text-slate-600 tracking-tight">
                  Weight: 30
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-50 text-emerald-700 tracking-tight">
                  Result: ({num(s3_characterAttitude)}/100) * 30 = {Math.round(s3_char_w * 10) / 10}
                </span>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={s3_characterAttitude}
                  onChange={(e) => handleNumberChange(setS3CharacterAttitude, e.target.value, 100)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-bold"
                />
                <span className="text-slate-400 text-sm font-bold shrink-0">/ 100 marks</span>
              </div>
            </div>

            {/* Ability to Work Extended Hours */}
            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 leading-normal">
                {rubrics.s3.s3_extendedHours.label}
              </label>
              <div className="flex gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-[#f1f5f9] text-slate-600 tracking-tight">
                  Weight: 20
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-emerald-50 text-emerald-700 tracking-tight">
                  Result: ({num(s3_extendedHours)}/100) * 20 = {Math.round(s3_ext_w * 10) / 10}
                </span>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={s3_extendedHours}
                  onChange={(e) => handleNumberChange(setS3ExtendedHours, e.target.value, 100)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-bold"
                />
                <span className="text-slate-400 text-sm font-bold shrink-0">/ 100 marks</span>
              </div>
            </div>
          </div>
        </div>

        {/* 7. Section 4: Practical Test & Remarks */}
        <div className="bg-white rounded-[20px] border-l-[6px] border-l-emerald-600 border-y border-r border-slate-200/80 overflow-hidden shadow-3xs">
          <div className="bg-emerald-50/40 px-5 py-4 flex items-center space-x-2.5 border-b border-slate-100">
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
              <Hammer className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight font-sans">
              Section 4: Practical Test & Remarks
            </h3>
          </div>

          <div className="p-5 space-y-4">
            {/* Practical Test */}
            <div>
              <label className="block text-xs font-bold text-slate-800 leading-normal mb-1">
                Practical Test Status
              </label>
              <p className="text-[10px] text-slate-400 font-semibold tracking-tight mb-3">
                Check if a practical field test is required
              </p>
              
              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer select-none group py-1">
                  <input
                    type="checkbox"
                    checked={practicalTestRequired}
                    onChange={(e) => setPracticalTestRequired(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer accent-slate-950"
                  />
                  <div className="text-sm font-extrabold text-slate-800 group-hover:text-slate-950 transition-colors">
                    Practical Test Required
                  </div>
                </label>
              </div>
            </div>

            {/* Remarks */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Remarks
              </label>
              <textarea
                rows={3}
                placeholder="Additional remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all font-medium resize-none"
              />
            </div>
          </div>
        </div>

        {/* 9. Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Submit Assessment */}
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="w-full bg-black hover:bg-zinc-900 active:scale-98 text-white py-4 rounded-[14px] flex items-center justify-center gap-2.5 text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            <ClipboardCheck className="w-5 h-5 text-white stroke-[2.2]" />
            <span>Submit Assessment</span>
          </button>

          {/* Save as Draft */}
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="w-full bg-white hover:bg-slate-50 active:scale-98 text-slate-800 py-4 border border-slate-200 rounded-[14px] flex items-center justify-center gap-2.5 text-sm font-bold shadow-3xs transition-all cursor-pointer"
          >
            <Save className="w-5 h-5 text-slate-500 stroke-[2.2]" />
            <span>Save as Draft</span>
          </button>
        </div>

      </div>
    </div>
  );
}
