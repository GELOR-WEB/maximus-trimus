import React from "react";
import "./BarberPole.css";

/**
 * Greek-themed Barber Pole indicator.
 * When `isActive` is true  → the pole glows, the stripes spin, and the laurel wreath illuminates.
 * When `isActive` is false → everything is still and dimmed.
 */
const BarberPole = ({ isActive = false, size = 50, onClick, title, style }) => {
  const poleHeight = size * 0.85;
  const poleWidth = size * 0.28;
  const capWidth = poleWidth + 6;
  const capHeight = 7;
  const knobRadius = 5;

  return (
    <div
      className={`barber-pole-wrapper ${isActive ? "barber-pole--active" : "barber-pole--inactive"}`}
      onClick={onClick}
      style={{ width: size, height: size, cursor: onClick ? "pointer" : "default", ...style }}
      title={title}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        className="barber-pole-svg"
      >
        <defs>
          {/* Greek key / meander pattern for the caps */}
          <pattern id="greekKey" x="0" y="0" width="8" height="4" patternUnits="userSpaceOnUse">
            <rect width="8" height="4" fill="#b8860b" />
            <path d="M0 0h2v2h2v-2h2v4h-2v-2h-2v2h-2z" fill="#d4af37" opacity="0.6" />
          </pattern>

          {/* Barber stripe pattern – animated when active */}
          <pattern
            id="barberStripes"
            x="0"
            y="0"
            width="14"
            height="20"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-25)"
          >
            <rect width="14" height="20" fill="#f5f5f5" />
            <rect x="0" y="0" width="14" height="5" fill="#1a6fb5" />
            <rect x="0" y="10" width="14" height="5" fill="#c0392b" />
            {isActive && (
              <animateTransform
                attributeName="patternTransform"
                type="translate"
                from="0 0"
                to="0 20"
                dur="0.8s"
                repeatCount="indefinite"
                additive="sum"
              />
            )}
          </pattern>

          {/* Glow filter for active state */}
          <filter id="poleGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#d4af37" floodOpacity="0.6" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle inner shadow on the pole cylinder */}
          <linearGradient id="cylinderShade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
            <stop offset="30%" stopColor="rgba(0,0,0,0)" />
            <stop offset="70%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
          </linearGradient>
        </defs>

        <g transform={`translate(${(size - poleWidth) / 2}, ${(size - poleHeight) / 2})`}
          filter={isActive ? "url(#poleGlow)" : "none"}
          className="barber-pole-group"
        >
          {/* ───── Top ornamental finial (Greek sphere + laurel) ───── */}
          <circle
            cx={poleWidth / 2}
            cy={-knobRadius + 1}
            r={knobRadius}
            fill={isActive ? "#d4af37" : "#555"}
            className="pole-knob pole-knob--top"
          />
          {/* Tiny laurel leaves on the top knob */}
          <path
            d={`M${poleWidth / 2 - 7} ${-knobRadius + 1} Q${poleWidth / 2 - 3} ${-knobRadius - 5} ${poleWidth / 2} ${-knobRadius - 2}`}
            fill="none"
            stroke={isActive ? "#d4af37" : "#555"}
            strokeWidth="1.2"
            className="laurel laurel-left"
          />
          <path
            d={`M${poleWidth / 2 + 7} ${-knobRadius + 1} Q${poleWidth / 2 + 3} ${-knobRadius - 5} ${poleWidth / 2} ${-knobRadius - 2}`}
            fill="none"
            stroke={isActive ? "#d4af37" : "#555"}
            strokeWidth="1.2"
            className="laurel laurel-right"
          />

          {/* ───── Top cap with Greek key border ───── */}
          <rect
            x={-(capWidth - poleWidth) / 2}
            y={0}
            width={capWidth}
            height={capHeight}
            rx={2}
            fill={isActive ? "#b8860b" : "#444"}
            className="pole-cap pole-cap--top"
          />
          {/* Greek key decorative line on top cap */}
          <rect
            x={-(capWidth - poleWidth) / 2 + 1}
            y={capHeight - 2}
            width={capWidth - 2}
            height={1.5}
            fill={isActive ? "#d4af37" : "#666"}
            opacity="0.7"
          />

          {/* ───── Main pole body (the spinning stripes) ───── */}
          <clipPath id="poleClip">
            <rect x={0} y={capHeight} width={poleWidth} height={poleHeight - capHeight * 2} rx={1} />
          </clipPath>
          <rect
            x={0}
            y={capHeight}
            width={poleWidth}
            height={poleHeight - capHeight * 2}
            rx={1}
            fill="url(#barberStripes)"
            clipPath="url(#poleClip)"
            className="pole-body"
          />
          {/* Cylinder shading overlay */}
          <rect
            x={0}
            y={capHeight}
            width={poleWidth}
            height={poleHeight - capHeight * 2}
            rx={1}
            fill="url(#cylinderShade)"
            clipPath="url(#poleClip)"
          />

          {/* ───── Column fluting lines (Greek column detail) ───── */}
          {[0.25, 0.5, 0.75].map((pct, i) => (
            <line
              key={i}
              x1={poleWidth * pct}
              y1={capHeight + 2}
              x2={poleWidth * pct}
              y2={poleHeight - capHeight - 2}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
          ))}

          {/* ───── Bottom cap with Greek key border ───── */}
          <rect
            x={-(capWidth - poleWidth) / 2}
            y={poleHeight - capHeight}
            width={capWidth}
            height={capHeight}
            rx={2}
            fill={isActive ? "#b8860b" : "#444"}
            className="pole-cap pole-cap--bottom"
          />
          {/* Greek key decorative line on bottom cap */}
          <rect
            x={-(capWidth - poleWidth) / 2 + 1}
            y={poleHeight - capHeight}
            width={capWidth - 2}
            height={1.5}
            fill={isActive ? "#d4af37" : "#666"}
            opacity="0.7"
          />

          {/* ───── Bottom ornamental finial ───── */}
          <circle
            cx={poleWidth / 2}
            cy={poleHeight + knobRadius - 1}
            r={knobRadius}
            fill={isActive ? "#d4af37" : "#555"}
            className="pole-knob pole-knob--bottom"
          />
        </g>

        {/* ───── Greek Meander / border ring around the pole ───── */}
        {isActive && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 2}
            fill="none"
            stroke="#d4af37"
            strokeWidth="1"
            strokeDasharray="3 2"
            opacity="0.4"
            className="meander-ring"
          />
        )}
      </svg>

      {/* Status dot indicator */}
      <span className={`pole-status-dot ${isActive ? "pole-status-dot--on" : "pole-status-dot--off"}`} />
    </div>
  );
};

export default BarberPole;
