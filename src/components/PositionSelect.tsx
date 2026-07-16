import { POSITIONS, PositionInfo } from "../types";
import { ChevronRight, Wrench, Hammer, HardHat, Building, Anchor, Layout, PaintBucket, Compass, Grid, Brush } from "lucide-react";

interface PositionSelectProps {
  onSelectPosition: (positionId: any) => void;
}

export default function PositionSelect({ onSelectPosition }: PositionSelectProps) {
  
  // Render lucide icons dynamically based on name
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "wrench":
        return <Wrench className="w-5 h-5 text-slate-800" />;
      case "hammer":
        return <Hammer className="w-5 h-5 text-slate-800" />;
      case "hard-hat":
        return <HardHat className="w-5 h-5 text-slate-800" />;
      case "building":
        return <Building className="w-5 h-5 text-slate-800" />;
      case "anchor":
        return <Anchor className="w-5 h-5 text-slate-800" />;
      case "layout":
        return <Layout className="w-5 h-5 text-slate-800" />;
      case "paint-bucket":
        return <PaintBucket className="w-5 h-5 text-slate-800" />;
      case "compass":
        return <Compass className="w-5 h-5 text-slate-800" />;
      case "grid":
        return <Grid className="w-5 h-5 text-slate-800" />;
      case "brush":
        return <Brush className="w-5 h-5 text-slate-800" />;
      default:
        return <Wrench className="w-5 h-5 text-slate-800" />;
    }
  };

  return (
    <div id="position-select-screen" className="flex flex-col items-center justify-center py-6 px-4 animate-fadeIn">
      
      {/* Centered Heading exactly as in attachment */}
      <div className="text-center max-w-xs mb-8 mt-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
          Select Position to Assess
        </h1>
        <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
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
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-250 flex items-center justify-between text-left cursor-pointer group active:scale-98"
          >
            <div className="flex items-center space-x-4">
              {/* Icon container - light gray box as in image */}
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                {renderIcon(pos.iconName)}
              </div>
              
              {/* Labels */}
              <div>
                <h3 className="font-bold text-slate-950 text-sm tracking-tight font-sans">
                  {pos.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium line-clamp-1">
                  {pos.shortDescription}
                </p>
              </div>
            </div>

            {/* Chevron Right as in attachment */}
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
          </button>
        ))}
      </div>

      {/* Decorative Brand Accent */}
      <div className="mt-12 text-center">
        <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">
          Trades Assessment Centre
        </span>
      </div>
    </div>
  );
}
