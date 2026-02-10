import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { COLORS, FONT_FAMILY, MONO_FONT } from '../styles';

const STATS = [
  { value: '102', label: '테스트 통과', color: COLORS.green },
  { value: '<3s', label: '분석 시간', color: COLORS.cyan },
  { value: '6', label: '분석 모듈', color: COLORS.violet },
  { value: '0', label: '서버 필요', color: COLORS.amber },
];

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoProgress = spring({
    fps,
    frame,
    config: { damping: 12, stiffness: 80 },
    durationInFrames: 30,
  });
  const logoScale = interpolate(logoProgress, [0, 1], [0.5, 1]);

  const taglineOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const taglineY = interpolate(frame, [30, 50], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const urlOpacity = interpolate(frame, [55, 75], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const badgeOpacity = interpolate(frame, [75, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pulse = 1 + Math.sin(frame * 0.1) * 0.015;

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT_FAMILY,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Glow effect behind logo */}
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(129, 140, 248, 0.2) 0%, transparent 70%)`,
          filter: 'blur(40px)',
          transform: `scale(${logoProgress})`,
        }}
      />

      {/* Logo Title */}
      <div
        style={{
          opacity: logoProgress,
          transform: `scale(${logoScale * pulse})`,
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            fontSize: 88,
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
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          marginBottom: 40,
        }}
      >
        <p
          style={{
            fontSize: 28,
            color: COLORS.textSecondary,
            margin: 0,
            fontWeight: 500,
          }}
        >
          무료 &bull; 빠름 &bull; 오픈소스
        </p>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'flex',
          gap: 40,
          marginBottom: 48,
          opacity: taglineOpacity,
        }}
      >
        {STATS.map((stat, i) => {
          const statDelay = 35 + i * 8;
          const statProgress = spring({
            fps,
            frame: frame - statDelay,
            config: { damping: 15, stiffness: 100 },
            durationInFrames: 20,
          });

          return (
            <div
              key={i}
              style={{
                opacity: statProgress,
                transform: `scale(${interpolate(statProgress, [0, 1], [0.8, 1])})`,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: stat.color,
                  fontFamily: MONO_FONT,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: COLORS.textMuted,
                  marginTop: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* URL */}
      <div style={{ opacity: urlOpacity, textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block',
            background: COLORS.bgCard,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 14,
            padding: '16px 36px',
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontFamily: MONO_FONT,
              color: COLORS.cyan,
              fontWeight: 500,
            }}
          >
            cohort-iq.vercel.app
          </span>
        </div>
      </div>

      {/* GitHub Badge */}
      <div style={{ opacity: badgeOpacity }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: COLORS.textMuted,
            fontSize: 16,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <span style={{ fontFamily: MONO_FONT }}>Taek-D/cohort-iq</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
