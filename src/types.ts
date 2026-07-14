export interface Candidate {
  id: string;
  positionId: 'bar_bender' | 'finishing_carpenter' | 'labour' | 'mason';
  name: string;
  referenceId: string;
  date: string;
  assessor: string;
  contact: string;
  
  // Section 1: Experience & Qualification (50% weight total)
  s1_siteExperience: number; // Max 50
  s1_nvqQualification: number; // Max 30
  s1_recommendation: number; // Max 20
  
  // Section 2: Knowledge & Practice (40% weight total)
  s2_measurementReading: number; // Max 20
  s2_machineKnowledge: number; // Max 20
  s2_methodology: number; // Max 50
  s2_hseEquipment: number; // Max 10
  
  // Section 3: Appearance & Attitude (10% weight total)
  s3_physicalAppearance: number; // Max 25
  s3_healthCondition: number; // Max 25
  s3_characterAttitude: number; // Max 30
  s3_extendedHours: number; // Max 20
  
  // Section 4: Practical Test
  practicalTestRequired: boolean;
  
  // General Remarks
  notes: string;
  status: 'Selected' | 'On Hold' | 'Rejected' | 'Pending Practical' | 'Draft';
  isHundredScale?: boolean;
}

export interface ScoreItemConfig {
  label: string;
  maxScore: number;
  weightPercent: number;
  description: string;
}

export interface PositionInfo {
  id: 'bar_bender' | 'finishing_carpenter' | 'labour' | 'mason';
  title: string;
  description: string;
  shortDescription: string;
  iconName: 'wrench' | 'hammer' | 'hard-hat' | 'building';
  colorClass: string;
}

export const POSITIONS: PositionInfo[] = [
  {
    id: 'bar_bender',
    title: 'Bar Bender',
    description: 'Rebar bending and steel reinforcement operations',
    shortDescription: 'Rebar bending and steel reinforc...',
    iconName: 'wrench',
    colorClass: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  {
    id: 'finishing_carpenter',
    title: 'Finishing Carpenter',
    description: 'High-precision wood joinery, finishing, and trim carpentry',
    shortDescription: 'Finishing and trim carpentry work',
    iconName: 'hammer',
    colorClass: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  {
    id: 'labour',
    title: 'Labour',
    description: 'General construction manual work, site preparation, and hauling',
    shortDescription: 'General construction labour',
    iconName: 'hard-hat',
    colorClass: 'bg-slate-50 text-slate-700 border-slate-200',
  },
  {
    id: 'mason',
    title: 'Mason',
    description: 'Bricklaying, stone blockwork, cementing, and plastering masonry',
    shortDescription: 'Brickwork and masonry',
    iconName: 'building',
    colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
];

export function getPositionRubrics(positionId: string) {
  const isCarpenter = positionId === 'finishing_carpenter';
  const isLabour = positionId === 'labour';
  const isMason = positionId === 'mason';
  
  return {
    s1: {
      s1_siteExperience: {
        label: isCarpenter ? "Woodwork Site Experience" : isLabour ? "General Site Exposure & Track Record" : isMason ? "Masonry / Blockwork Site Experience" : "Site Experience (KSJ/SO/Overseas/Worked sites)",
        maxScore: 50,
        weightPercent: 25.0,
        description: isCarpenter 
          ? "Years on trim/veneer installs, cabinetry fitting, and complex residential/commercial sites."
          : isLabour 
            ? "Familiarity with active construction environment, excavation, sorting, and manual team tasks."
            : isMason 
              ? "Experience in building brick walls, cement pouring, structural plastering, and block layering."
              : "Evaluates years and depth of experience across key projects, overseas assignments, and specific relevant sites."
      },
      s1_nvqQualification: {
        label: isLabour ? "Basic Safety Induction / CSC Card" : "NVQ Qualification",
        maxScore: 30,
        weightPercent: 15.0,
        description: isLabour
          ? "National safety certificates, site induction checklist accuracy, and basic labor licenses."
          : "National Vocational Qualification level alignment, trade certification verification, and verified training records."
      },
      s1_recommendation: {
        label: "3rd Party Recommendation",
        maxScore: 20,
        weightPercent: 10.0,
        description: isCarpenter 
          ? "Reference letters from senior carpenters, interior fit-out leads, or master craftsmen."
          : isLabour
            ? "Vouching from shift supervisors, contractors, or site logistics managers."
            : isMason
              ? "Vouching by principal civil engineers or veteran head masons."
              : "Strength of professional references and direct contractor recommendations."
      }
    },
    s2: {
      s2_measurementReading: {
        label: isCarpenter ? "Precision Measurements & Detail Reading" : isLabour ? "Tape Measuring & Sorting Literacy" : isMason ? "Plumb, Level, & Ratio Scale Literacy" : "Measurement Reading (mm) & Drawing Literacy",
        maxScore: 20,
        weightPercent: 8.0,
        description: isCarpenter
          ? "Reading detail drawings, executing millimeter cuts without errors, and matching wood veneers."
          : isLabour
            ? "Reading dual-unit tapes, basic material sorting by specifications, and simple stock logs."
            : isMason
              ? "Reading level indicators, matching layout sketches, measuring plaster thickness, and water ratios."
              : "Ability to read construction blueprints, structural drawings, and perform precise metric measurements in millimeters."
      },
      s2_machineKnowledge: {
        label: isCarpenter ? "Power Saw & Routing Machinery" : isLabour ? "Hauling & Compactor Machinery" : isMason ? "Cement Mixers & Wet Cutter Machinery" : "Knowledge in Machines",
        maxScore: 20,
        weightPercent: 8.0,
        description: isCarpenter
          ? "Safe setups and operations of table saws, routing jigs, miter saws, and specialized sanders."
          : isLabour
            ? "Operation of standard motorized wheelbarrows, mechanical compactors, and basic power drills."
            : isMason
              ? "Safe startup of mechanical drum mixers, grout pumps, and masonry wet-stone cutters."
              : "Familiarity, operation, and safety standards for benders, cutters, and reinforcement fabrication machinery."
      },
      s2_methodology: {
        label: isCarpenter ? "Wood Joinery & Veneer Methodology" : isLabour ? "Manual Handling & Digging Methods" : isMason ? "Brickwork Bonding & Mortar Ratios" : "Knowledge & Practice Methodology in Construction",
        maxScore: 50,
        weightPercent: 20.0,
        description: isCarpenter
          ? "Hands-on mastery of mortise & tenon, dovetails, edge-bandings, door frames, and trim alignment."
          : isLabour
            ? "Stance techniques for lifting bags, trenching, waste sorting, scaffolding assembly support."
            : isMason
              ? "Laying English/Flemish brick bonds, trowel work, joint spacing, rendering, and block alignments."
              : "Expertise in standard bar bending schedules, reinforcement anchoring, overlapping, and structural joint techniques."
      },
      s2_hseEquipment: {
        label: isCarpenter ? "Dust-Extraction & Blade-Guard Safety" : isLabour ? "Safety Signs & Lift-Stance Safety" : isMason ? "Dust-Inhalation & Scaffold Safety" : "Knowledge & Practice with HSE Equipments",
        maxScore: 10,
        weightPercent: 4.0,
        description: isCarpenter
          ? "Strict compliance with wood dust masks, safety goggles, and blade-guard lockouts."
          : isLabour
            ? "Correct utilization of high-vis vests, steel-toed boots, helmet, and lifting belts."
            : isMason
              ? "Compliance with respiratory silica masks, safety boots, and secure high-scaffolding walks."
              : "Adherence to Health, Safety, and Environment protocols, and correct usage of personal protective equipment."
      }
    },
    s3: {
      s3_physicalAppearance: {
        label: "Physical Appearance & Fitness",
        maxScore: 25,
        weightPercent: 2.5,
        description: isCarpenter
          ? "Steady hand-eye control, capacity to lift custom doors, and balance on ladders."
          : isLabour
            ? "High lifting limits (25kg+), consistent muscle stamina, and ability to load/unload heavy vehicles."
            : isMason
              ? "Strong core strength for lifting clay/concrete bricks and repetitive bending-troweling motions."
              : "Physical capability to handle heavy steel reinforcement bars and work under demanding site conditions."
      },
      s3_healthCondition: {
        label: "Health Condition",
        maxScore: 25,
        weightPercent: 2.5,
        description: isCarpenter
          ? "Excellent visual acuity and absence of chronic wood dust respiratory allergies."
          : isLabour
            ? "High cardiovascular stamina, clear joint flexibility, and thermal resilience under heat/rain."
            : isMason
              ? "Healthy respiratory profile and excellent hand-joint flexibility (avoiding carpal stress)."
              : "General health assessments, stamina levels, and absence of chronic physical limitations."
      },
      s3_characterAttitude: {
        label: "Character & Attitude",
        maxScore: 30,
        weightPercent: 3.0,
        description: "Discipline, respect for safety orders, team collaboration, and professional work ethic."
      },
      s3_extendedHours: {
        label: "Ability to Work Extended Hours",
        maxScore: 20,
        weightPercent: 2.0,
        description: isLabour
          ? "Willingness to support night deliveries, heavy cleanup sessions, or tight deadlines."
          : isMason
            ? "Availability to continue work until cement sets or brick rows reach locking joints."
            : "Willingness and stamina to support concrete pouring sessions, tight project deadlines, and shift extensions."
      }
    }
  };
}
