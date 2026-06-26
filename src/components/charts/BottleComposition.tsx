"use client";

import type { ComponentBreakdown } from "@/lib/blendMath";

const palette = ["#D8871C", "#F2B24A", "#B96A14", "#1F2A33", "#69727A", "#E3A437", "#A65E12"];

export function BottleComposition({ components }: { components: ComponentBreakdown[] }) {
  const layers = components.slice(0, 6);
  const otherShare = components.slice(6).reduce((total, component) => total + component.sharePct, 0);
  const displayLayers = otherShare > 0
    ? [...layers, { ...components[0], displayName: "Other", category: "Other", sharePct: otherShare }]
    : layers;
  let offset = 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[210px_1fr]">
      <svg viewBox="0 0 180 360" role="img" aria-label="Conceptual bottle composition visualization" className="mx-auto h-80 w-48">
        <defs>
          <clipPath id="bottleClip">
            <path d="M66 20h48v36l-10 20v42c28 8 48 34 48 65v122c0 22-18 40-40 40H68c-22 0-40-18-40-40V183c0-31 20-57 48-65V76L66 56V20Z" />
          </clipPath>
        </defs>
        <path d="M66 20h48v36l-10 20v42c28 8 48 34 48 65v122c0 22-18 40-40 40H68c-22 0-40-18-40-40V183c0-31 20-57 48-65V76L66 56V20Z" fill="#FFFFFF" stroke="#1F2A33" strokeWidth="8" strokeLinejoin="round" />
        <rect x="66" y="20" width="48" height="22" rx="5" fill="#1F2A33" />
        <rect x="74" y="56" width="32" height="10" rx="2" fill="#F2B24A" />
        <g clipPath="url(#bottleClip)">
          <rect x="0" y="0" width="180" height="360" fill="#FFFFFF" />
          {displayLayers.map((component, index) => {
            const height = Math.max(1, component.sharePct * 2.45);
            const y = 342 - offset - height;
            offset += height;
            return (
              <rect key={`${component.displayName}-${index}`} x="0" y={y} width="180" height={height} fill={palette[index % palette.length]}>
                <title>{`${component.displayName}: ${component.sharePct.toFixed(1)}%`}</title>
              </rect>
            );
          })}
        </g>
      </svg>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-smoke">Conceptual composition, not literal physical layers.</p>
        {displayLayers.map((component, index) => (
          <div key={`${component.displayName}-label-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-parchment/70 p-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ background: palette[index % palette.length] }} />
              <div>
                <p className="font-bold text-oak">{component.displayName}</p>
                <p className="text-xs font-semibold text-smoke">{component.category}</p>
              </div>
            </div>
            <p className="text-right text-sm font-black text-barrel">{component.sharePct.toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
