import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from 'remotion';
import { COLORS, FONT_FAMILY } from './styles';

export const Thumbnail: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    fps,
    frame,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: 30,
  });

  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pulse = 1 + Math.sin(frame * 0.08) * 0.02;

  // Animated orbs
  const orb1X = 30 + Math.sin(frame * 0.01) * 5;
  const orb1Y = 25 + Math.cos(frame * 0.008) * 5;
  const orb2X = 70 + Math.cos(frame * 0.012) * 4;
  const orb2Y = 65 + Math.sin(frame * 0.009) * 6;

  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(ellipse 600px 600px at ${orb1X}% ${orb1Y}%, rgba(99, 102, 241, 0.15) 0%, transparent 70%),
          radial-gradient(ellipse 500px 500px at ${orb2X}% ${orb2Y}%, rgba(139, 92, 246, 0.12) 0%, transparent 70%),
          radial-gradient(ellipse 400px 400px at 50% 50%, rgba(34, 211, 238, 0.06) 0%, transparent 70%),
          linear-gradient(180deg, ${COLORS.bgDark} 0%, ${COLORS.bgMid} 50%, ${COLORS.bgDark} 100%)
        `,
        fontFamily: FONT_FAMILY,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Logo + Title */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${logoScale * pulse})`,
          opacity: logoScale,
        }}
      >
        {/* SVG Chart Icon */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 100 100"
          fill="none"
          style={{
            marginBottom: 16,
            filter: 'drop-shadow(0 0 30px rgba(129, 140, 248, 0.4))',
          }}
        >
          <rect x="10" y="60" width="16" height="30" rx="4" fill={COLORS.cyan} opacity={0.8} />
          <rect x="32" y="40" width="16" height="50" rx="4" fill={COLORS.indigo} opacity={0.9} />
          <rect x="54" y="25" width="16" height="65" rx="4" fill={COLORS.violet} />
          <rect x="76" y="15" width="16" height="75" rx="4" fill={COLORS.green} opacity={0.9} />
          <path d="M18 55 L40 35 L62 20 L84 10" stroke={COLORS.amber} strokeWidth="3" strokeLinecap="round" fill="none" opacity={0.9} />
          <circle cx="18" cy="55" r="4" fill={COLORS.amber} />
          <circle cx="40" cy="35" r="4" fill={COLORS.amber} />
          <circle cx="62" cy="20" r="4" fill={COLORS.amber} />
          <circle cx="84" cy="10" r="4" fill={COLORS.amber} />
        </svg>

        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-2px',
            background: `linear-gradient(135deg, ${COLORS.indigo} 0%, ${COLORS.violet} 40%, ${COLORS.cyan} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          CohortIQ
        </h1>

        <p
          style={{
            fontSize: 22,
            color: COLORS.textSecondary,
            margin: '12px 0 0 0',
            fontWeight: 400,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            opacity: subtitleOpacity,
          }}
        >
          구독 비즈니스 코호트 분석 도구
        </p>
      </div>

      {/* Play Button Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 50,
          padding: '14px 32px 14px 20px',
          backdropFilter: 'blur(12px)',
          opacity: subtitleOpacity,
        }}
      >
        {/* Play circle */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            background: `linear-gradient(135deg, ${COLORS.indigo}, ${COLORS.violet})`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 0 20px rgba(129, 140, 248, 0.4)',
          }}
        >
          <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
            <path d="M2 1.5L16 10L2 18.5V1.5Z" fill="white" />
          </svg>
        </div>
        <span
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: COLORS.textPrimary,
            letterSpacing: '0.5px',
          }}
        >
          소개 영상 보기
        </span>
        <span
          style={{
            fontSize: 14,
            color: COLORS.textMuted,
          }}
        >
          0:25
        </span>
      </div>
    </AbsoluteFill>
  );
};
