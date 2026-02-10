import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { COLORS, FONT_FAMILY } from '../styles';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    fps,
    frame,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: 30,
  });

  const titleY = spring({
    fps,
    frame: frame - 15,
    config: { damping: 14, stiffness: 80 },
    durationInFrames: 35,
  });
  const titleTranslateY = interpolate(titleY, [0, 1], [40, 0]);

  const subtitleOpacity = interpolate(frame, [45, 65], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subtitleY = interpolate(frame, [45, 65], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const lineWidth = interpolate(frame, [60, 90], [0, 120], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pulse = 1 + Math.sin(frame * 0.08) * 0.02;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: FONT_FAMILY,
      }}
    >
      {/* Logo Icon */}
      <div
        style={{
          transform: `scale(${logoScale * pulse})`,
          fontSize: 80,
          marginBottom: 20,
          filter: 'drop-shadow(0 0 30px rgba(129, 140, 248, 0.4))',
        }}
      >
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          fill="none"
          style={{ display: 'block' }}
        >
          {/* Chart bars */}
          <rect
            x="10"
            y="60"
            width="16"
            height="30"
            rx="4"
            fill={COLORS.cyan}
            opacity={0.8}
          />
          <rect
            x="32"
            y="40"
            width="16"
            height="50"
            rx="4"
            fill={COLORS.indigo}
            opacity={0.9}
          />
          <rect
            x="54"
            y="25"
            width="16"
            height="65"
            rx="4"
            fill={COLORS.violet}
          />
          <rect
            x="76"
            y="15"
            width="16"
            height="75"
            rx="4"
            fill={COLORS.green}
            opacity={0.9}
          />
          {/* Trend line */}
          <path
            d="M18 55 L40 35 L62 20 L84 10"
            stroke={COLORS.amber}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity={0.9}
          />
          <circle cx="18" cy="55" r="4" fill={COLORS.amber} />
          <circle cx="40" cy="35" r="4" fill={COLORS.amber} />
          <circle cx="62" cy="20" r="4" fill={COLORS.amber} />
          <circle cx="84" cy="10" r="4" fill={COLORS.amber} />
        </svg>
      </div>

      {/* Title */}
      <div
        style={{
          transform: `translateY(${titleTranslateY}px)`,
          opacity: titleY,
        }}
      >
        <h1
          style={{
            fontSize: 96,
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-2px',
            background: `linear-gradient(135deg, ${COLORS.indigo} 0%, ${COLORS.violet} 40%, ${COLORS.cyan} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textAlign: 'center',
          }}
        >
          CohortIQ
        </h1>
      </div>

      {/* Decorative line */}
      <div
        style={{
          width: lineWidth,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${COLORS.indigo}, transparent)`,
          marginTop: 16,
          marginBottom: 16,
          borderRadius: 2,
        }}
      />

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
        }}
      >
        <p
          style={{
            fontSize: 28,
            color: COLORS.textSecondary,
            margin: 0,
            fontWeight: 400,
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}
        >
          구독 비즈니스 코호트 분석 도구
        </p>
      </div>
    </AbsoluteFill>
  );
};
