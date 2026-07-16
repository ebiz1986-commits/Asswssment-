import { POSITIONS, PositionInfo } from "../types";
import { ChevronRight, Wrench, Hammer, HardHat, Building, Anchor, Layout, PaintBucket, Compass, Grid, Brush } from "lucide-react";

interface PositionSelectProps {
  onSelectPosition: (positionId: any) => void;
  darkMode?: boolean;
}

export default function PositionSelect({ onSelectPosition, darkMode = false }: PositionSelectProps) {
  
  // Render lucide icons dynamically based on name
  const renderIcon = (iconName: string) => {
    const iconClass = `w-5 h-5 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`;
    switch (iconName) {
      case "wrench":
        return <Wrench className={iconClass} />;
      case "hammer":
        return <Hammer className={iconClass} />;
      case "hard-hat":
        return <HardHat className={iconClass} />;
      case "building":
        return <Building className={iconClass} />;
      case "anchor":
        return <Anchor className={iconClass} />;
      case "layout":
        return <Layout className={iconClass} />;
      case "paint-bucket":
        return <PaintBucket className={iconClass} />;
      case "compass":
        return <Compass className={iconClass} />;
      case "grid":
        return <Grid className={iconClass} />;
      case "brush":
        return <Brush className={iconClass} />;
      default:
        return <Wrench className={iconClass} />;
    }
  };

  return (
    <div id="position-select-screen" className="flex flex-col items-center justify-center py-6 px-4 animate-fadeIn">
      
      {/* Centered Heading exactly as in attachment */}
      <div className="text-center max-w-xs mb-8 mt-4">
        <h1 className={`text-2xl font-extrabold tracking-tight font-display transition-colors ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>
          Select Position to Assess
        </h1>
        <p className={`text-sm mt-2 font-medium leading-relaxed transition-colors ${
          darkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Choose a position to begin the candidate assessment
        </p>
      </div>

      {/* Grid List of Positions identical to attachment */}
      <div className="w-full space-y-4 max-w-sm">
        {POSITIONS.map((pos) => (
          <button
            key={pos.id}
            id={`position-btn-${pos.id}`}
            onClick={() => onSelectPosition(pos.id)}
            className={`w-full rounded-2xl p-4 border transition-all duration-250 flex items-center justify-between text-left cursor-pointer group active:scale-98 ${
              darkMode
                ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850 shadow-md'
                : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md shadow-sm'
            }`}
          >
            <div className="flex items-center space-x-4">
              {/* Icon container - light gray box as in image */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                darkMode ? 'bg-slate-800' : 'bg-slate-100'
              }`}>
                {renderIcon(pos.iconName)}
              </div>
              
              {/* Labels */}
              <div>
                <h3 className={`font-bold text-sm tracking-tight font-sans transition-colors ${
                  darkMode ? 'text-slate-100' : 'text-slate-950'
                }`}>
                  {pos.title}
                </h3>
                <p className={`text-xs mt-0.5 font-medium line-clamp-1 transition-colors ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {pos.shortDescription}
                </p>
              </div>
            </div>

            {/* Chevron Right as in attachment */}
            <ChevronRight className={`w-5 h-5 group-hover:text-blue-500 transition-colors shrink-0 ${
              darkMode ? 'text-slate-500' : 'text-slate-400'
            }`} />
          </button>
        ))}
      </div>

      {/* Decorative Brand Accent */}
      <div className="mt-12 text-center">
        <span className={`text-[10px] font-mono font-bold tracking-widest px-3 py-1 rounded-full uppercase transition-colors ${
          darkMode ? 'text-slate-500 bg-slate-900 border border-slate-800' : 'text-slate-400 bg-slate-100'
        }`}>
          Trades Assessment Centre
        </span>
      </div>
    </div>
  );
}
