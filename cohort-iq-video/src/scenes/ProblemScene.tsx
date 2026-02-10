import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { COLORS, FONT_FAMILY } from '../styles';

const PROBLEMS = [
  {
    icon: '⏰',
    title: '수 시간의 수작업',
    desc: '스프레드시트에서 반복적인 코호트 분석에 몇 시간씩 소요',
    color: COLORS.rose,
  },
  {
    icon: '💰',
    title: '월 $89 - $995',
    desc: '스타트업에게 부담되는 고가의 분석 도구 구독료',
    color: COLORS.amber,
  },
  {
    icon: '🔧',
    title: '복잡한 연동 과정',
    desc: 'SDK 설치와 이벤트 추적 설정에 개발 리소스 필요',
    color: COLORS.sky,
  },
];

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headerX = interpolate(frame, [0, 20], [-30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT_FAMILY,
        padding: '80px 120px',
        justifyContent: 'center',
      }}
    >
      {/* Section Header */}
      <div
        style={{
          opacity: headerOpacity,
          transform: `translateX(${headerX}px)`,
          marginBottom: 60,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: COLORS.rose,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          문제점
        </div>
        <h2
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.textPrimary,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          코호트 분석이
          <br />
          <span style={{ color: COLORS.rose }}>이렇게 오래 걸려선 안 됩니다.</span>
        </h2>
      </div>

      {/* Problem Cards */}
      <div style={{ display: 'flex', gap: 30 }}>
        {PROBLEMS.map((problem, i) => {
          const delay = 30 + i * 20;
          const cardProgress = spring({
            fps,
            frame: frame - delay,
            config: { damping: 14, stiffness: 80 },
            durationInFrames: 30,
          });
          const cardX = interpolate(cardProgress, [0, 1], [60, 0]);
          const cardOpacity = cardProgress;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                opacity: cardOpacity,
                transform: `translateX(${cardX}px)`,
                background: COLORS.bgCard,
                borderRadius: 20,
                padding: '36px 32px',
                border: `1px solid ${COLORS.border}`,
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  marginBottom: 16,
                  filter: `drop-shadow(0 0 10px ${problem.color}40)`,
                }}
              >
                {problem.icon}
              </div>
              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: problem.color,
                  margin: '0 0 10px 0',
                }}
              >
                {problem.title}
              </h3>
              <p
                style={{
                  fontSize: 17,
                  color: COLORS.textSecondary,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {problem.desc}
              </p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
