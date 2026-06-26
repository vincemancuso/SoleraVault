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
            <path d="M68 18h44l8 78c24 18 38 48 38 82v120c0 25-20 45-45 45H67c-25 0-45-20-45-45V178c0-34 14-64 38-82l8-78Z" />
          </clipPath>
        </defs>
        <path d="M68 18h44l8 78c24 18 38 48 38 82v120c0 25-20 45-45 45H67c-25 0-45-20-45-45V178c0-34 14-64 38-82l8-78Z" fill="#FFFFFF" stroke="#1F2A33" strokeWidth="8" />
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
          <path d="M36 230c35-34 70-34 105 0" stroke="#F2B24A" strokeWidth="9" strokeLinecap="round" opacity="0.78" />
          <path d="M36 258c35 34 70 34 105 0" stroke="#1F2A33" strokeWidth="9" strokeLinecap="round" opacity="0.28" />
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
