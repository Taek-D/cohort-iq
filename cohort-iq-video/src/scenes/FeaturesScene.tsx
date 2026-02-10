import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';
import { COLORS, FONT_FAMILY } from '../styles';

const FEATURES = [
  {
    icon: '🔥',
    title: '리텐션 히트맵',
    desc: '코호트 × 주차 매트릭스에 색상 코딩된 리텐션율 시각화',
    color: COLORS.rose,
  },
  {
    icon: '⚠️',
    title: '이탈 위험 스코어링',
    desc: 'RFM 기반 위험도 분석 및 실행 가능한 인사이트 제공',
    color: COLORS.amber,
  },
  {
    icon: '💎',
    title: 'LTV 예측',
    desc: 'BG/NBD + Gamma-Gamma 통계 모델 기반 고객 생애 가치 예측',
    color: COLORS.violet,
  },
  {
    icon: '📐',
    title: '통계 검정',
    desc: '카이제곱, 카플란-마이어, 로그랭크 생존 분석',
    color: COLORS.cyan,
  },
  {
    icon: '🧪',
    title: 'A/B 테스트 시뮬레이션',
    desc: '검정력 분석 및 필요 표본 크기 자동 계산',
    color: COLORS.green,
  },
  {
    icon: '📄',
    title: 'PDF 리포트',
    desc: '건강도 점수가 포함된 1-페이지 요약 보고서 자동 생성',
    color: COLORS.indigo,
  },
];

export const FeaturesScene: React.FC = () => {
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
        padding: '60px 100px',
        justifyContent: 'center',
      }}
    >
      {/* Header */}
      <div style={{ opacity: headerOpacity, textAlign: 'center', marginBottom: 50 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: COLORS.indigo,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          주요 기능
        </div>
        <h2
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: COLORS.textPrimary,
            margin: 0,
          }}
        >
          필요한 모든 것.{' '}
          <span style={{ color: COLORS.textSecondary }}>불필요한 것은 없이.</span>
        </h2>
      </div>

      {/* Feature Grid - 3 columns × 2 rows */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap' as const,
          gap: 24,
          justifyContent: 'center',
        }}
      >
        {FEATURES.map((feature, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const delay = 20 + row * 18 + col * 8;

          const cardProgress = spring({
            fps,
            frame: frame - delay,
            config: { damping: 13, stiffness: 90 },
            durationInFrames: 25,
          });
          const scale = interpolate(cardProgress, [0, 1], [0.7, 1]);
          const y = interpolate(cardProgress, [0, 1], [30, 0]);

          return (
            <div
              key={i}
              style={{
                opacity: cardProgress,
                transform: `scale(${scale}) translateY(${y}px)`,
                background: COLORS.bgCard,
                borderRadius: 18,
                padding: '28px 30px',
                border: `1px solid ${COLORS.border}`,
                width: 520,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 20,
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Icon circle */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: `${feature.color}15`,
                  border: `1px solid ${feature.color}30`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: 28,
                  flexShrink: 0,
                }}
              >
                {feature.icon}
              </div>

              <div>
                <h3
                  style={{
                    fontSize: 21,
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    margin: '0 0 6px 0',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    color: COLORS.textSecondary,
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {feature.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
