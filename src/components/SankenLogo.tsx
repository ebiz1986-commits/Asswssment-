import React from "react";

interface SankenLogoProps {
  className?: string;
  showText?: boolean;
  textSize?: "sm" | "md" | "lg" | "xl";
  lightText?: boolean;
}

export function SankenLogo({
  className = "w-10 h-10",
  showText = false,
  textSize = "md",
  lightText = false,
}: SankenLogoProps) {
  const textClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  return (
    <div className="flex items-center gap-2.5 select-none shrink-0">
      {/* 3 Overlapping Sky Blue/Light Blue diamonds */}
      <svg
        className={className}
        viewBox="0 0 120 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Diamond 1 (Left, base layer) */}
        <path
          d="M 30 10 L 55 35 L 30 60 L 5 35 Z"
          fill="url(#sanken-logo-grad)"
          opacity="0.5"
        />
        {/* Diamond 2 (Middle) */}
        <path
          d="M 45 10 L 70 35 L 45 60 L 20 35 Z"
          fill="url(#sanken-logo-grad)"
          opacity="0.8"
        />
        {/* Diamond 3 (Right, top layer) */}
        <path
          d="M 60 10 L 85 35 L 60 60 L 35 35 Z"
          fill="url(#sanken-logo-grad)"
        />

        <defs>
          <linearGradient
            id="sanken-logo-grad"
            x1="5"
            y1="10"
            x2="85"
            y2="60"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#2ea1e5" />
            <stop offset="50%" stopColor="#4db7eb" />
            <stop offset="100%" stopColor="#7fccf7" />
          </linearGradient>
        </defs>
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`${textClasses[textSize]} font-black tracking-tight ${
              lightText ? "text-white" : "text-slate-900"
            }`}
          >
            Sanken
          </span>
          <span
            className="text-[8px] font-extrabold tracking-widest uppercase mt-0.5"
            style={{ color: lightText ? "#7fccf7" : "#2ea1e5" }}
          >
            Overseas
          </span>
        </div>
      )}
    </div>
  );
}

export default SankenLogo;
