import React from "react";

export function EgyptianBorder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-[#D4AF37]" />
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-2 h-2 rotate-45 bg-[#D4AF37]" />
        ))}
      </div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#D4AF37] to-[#D4AF37]" />
    </div>
  );
}

export function HieroglyphicPattern() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="opacity-20"
    >
      <path
        d="M20 5 L20 15 M15 10 L25 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="25" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M10 35 L30 35 M15 32 L15 38 M25 32 L25 38"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SundialIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="14" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M12 14 L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14 L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6 L12 8 L16 6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function NileWave({ className = "" }: { className?: string }) {
  return (
    <svg
      width="100%"
      height="40"
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M0,20 Q150,5 300,20 T600,20 T900,20 T1200,20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
      />
      <path
        d="M0,25 Q150,10 300,25 T600,25 T900,25 T1200,25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.2"
      />
    </svg>
  );
}

export function PapyrusCard({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const bgUrl =
    "https://images.unsplash.com/photo-1686806372785-fcfe9efa9b70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXBlciUyMHRleHR1cmUlMjBiZWlnZXxlbnwxfHx8fDE3NjEyNTE5MTF8MA&ixlib=rb-4.1.0&q=80&w=1080";

  return (
    <div
      {...props}
      className={`relative rounded-lg border-2 border-[#D4AF37] shadow-lg overflow-hidden ${className}`}
    >
      {/* Background image optimized for LCP */}
      <img
        src={bgUrl}
        alt=""
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Warm Egyptian-style parchment overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5E6D3]/90 to-[#E8D5B7]/85 pointer-events-none" />

      {/* Gold top/bottom accent lines */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />

      {/* Card content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}


export function AnkhIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="10" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 8 L10 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 11 L15 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 18 L13 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
