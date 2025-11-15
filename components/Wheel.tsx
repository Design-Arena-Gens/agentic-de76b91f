"use client";
import React from "react";
import { normalizeDegrees } from "../lib/astro";

type WheelProps = {
  sunLongitude: number;
  ascendant: number;
  midheaven: number;
  houses: number[];
  size?: number;
};

// Convert ecliptic longitude (0? Aries) to canvas angle (0 rad at +X, clockwise)
// We set 0? Aries to angle 0 (pointing right). To have 0? at right, use angle = -lon.
function angleFromLongitude(lonDeg: number): number {
  const a = (-normalizeDegrees(lonDeg) * Math.PI) / 180; // clockwise
  return a;
}

export default function Wheel({ sunLongitude, ascendant, midheaven, houses, size = 420 }: WheelProps) {
  const r = size / 2;
  const cx = r;
  const cy = r;
  const innerR = r * 0.55;
  const houseR = r * 0.9;

  const signNames = ["?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?"];

  const toXY = (ang: number, rad: number) => ({ x: cx + rad * Math.cos(ang), y: cy + rad * Math.sin(ang) });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Roulette du th?me astral">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Outer circle */}
      <circle cx={cx} cy={cy} r={r - 2} fill="#fff" stroke="#111827" strokeWidth={2} filter="url(#shadow)" />

      {/* Zodiac ring with 12 segments */}
      {Array.from({ length: 12 }, (_, i) => {
        const start = angleFromLongitude(i * 30);
        const end = angleFromLongitude((i + 1) * 30);
        // Draw tick at each sign boundary
        const a = start;
        const p1 = toXY(a, r * 0.98);
        const p2 = toXY(a, innerR);
        return <line key={`tick-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#111827" strokeWidth={2} />;
      })}

      {/* Sign labels */}
      {Array.from({ length: 12 }, (_, i) => {
        const midLon = i * 30 + 15;
        const a = angleFromLongitude(midLon);
        const p = toXY(a, (r + innerR) / 2);
        return (
          <text key={`label-${i}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={18} fontWeight={700}>
            {signNames[i]}
          </text>
        );
      })}

      {/* House lines (Equal houses from Ascendant) */}
      {houses.map((h, i) => {
        const a = angleFromLongitude(h);
        const p1 = toXY(a, houseR);
        const p2 = toXY(a, innerR * 0.6);
        return <line key={`house-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#9ca3af" strokeWidth={1.5} />;
      })}

      {/* Ascendant marker */}
      {(() => {
        const a = angleFromLongitude(ascendant);
        const p1 = toXY(a, r * 0.98);
        const p2 = toXY(a, innerR * 0.4);
        return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#10b981" strokeWidth={3} />;
      })()}
      <text x={cx} y={cy - innerR * 0.5} textAnchor="middle" fontSize={12} fill="#10b981">ASC</text>

      {/* MC marker */}
      {(() => {
        const a = angleFromLongitude(midheaven);
        const p1 = toXY(a, r * 0.98);
        const p2 = toXY(a, innerR * 0.4);
        return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#3b82f6" strokeWidth={3} />;
      })()}
      <text x={cx} y={cy + innerR * 0.5} textAnchor="middle" fontSize={12} fill="#3b82f6">MC</text>

      {/* Sun marker */}
      {(() => {
        const a = angleFromLongitude(sunLongitude);
        const p = toXY(a, (innerR + houseR) / 2);
        return <circle cx={p.x} cy={p.y} r={6} fill="#ef4444" stroke="#991b1b" strokeWidth={1} />;
      })()}
    </svg>
  );
}
