import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { COLORS, FONT_FAMILY } from '../styles';

const STEPS = [
  {
    icon: '📁',
    label: 'CSV 업로드',
    desc: '드래그 앤 드롭으로 데이터 입력',
    color: COLORS.cyan,
  },
  {
    icon: '⚡',
    label: '3초 분석',
    desc: '즉각적인 코호트 처리',
    color: COLORS.amber,
  },
  {
    icon: '📊',
    label: '인사이트 확인',
    desc: '히트맵, 이탈률, LTV 한눈에',
    color: COLORS.green,
  },
];

export const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT_FAMILY,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Header */}
      <div
        style={{
          opacity: headerOpacity,
          textAlign: 'center',
          marginBottom: 70,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: COLORS.green,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          해결책
        </div>
        <h2
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.textPrimary,
            margin: 0,
          }}
        >
          세 단계.{' '}
          <span
            style={{
              background: `linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.green})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            단 3초.
          </span>
        </h2>
      </div>

      {/* Steps */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {STEPS.map((step, i) => {
          const delay = 25 + i * 25;
          const stepProgress = spring({
            fps,
            frame: frame - delay,
            config: { damping: 12, stiffness: 80 },
            durationInFrames: 30,
          });
          const scale = interpolate(stepProgress, [0, 1], [0.6, 1]);
          const opacity = stepProgress;

          // Arrow between steps
          const arrowDelay = 35 + i * 25;
          const arrowOpacity = interpolate(
            frame,
            [arrowDelay, arrowDelay + 15],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
          );

          return (
            <React.Fragment key={i}>
              <div
                style={{
                  position: 'relative' as const,
                  opacity,
                  transform: `scale(${scale})`,
                  background: COLORS.bgCard,
                  borderRadius: 24,
                  padding: '48px 44px',
                  border: `1px solid ${COLORS.border}`,
                  textAlign: 'center' as const,
                  width: 280,
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Step number badge */}
                <div
                  style={{
                    position: 'absolute' as const,
                    top: -14,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: step.color,
                    color: COLORS.bgDark,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  {i + 1}
                </div>

                <div
                  style={{
                    fontSize: 56,
                    marginBottom: 20,
                    filter: `drop-shadow(0 0 20px ${step.color}50)`,
                  }}
                >
                  {step.icon}
                </div>
                <h3
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    margin: '0 0 8px 0',
                  }}
                >
                  {step.label}
                </h3>
                <p
                  style={{
                    fontSize: 16,
                    color: COLORS.textSecondary,
                    margin: 0,
                  }}
                >
                  {step.desc}
                </p>
              </div>

              {/* Arrow */}
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    opacity: arrowOpacity,
                    fontSize: 32,
                    color: COLORS.textMuted,
                  }}
                >
                  →
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
