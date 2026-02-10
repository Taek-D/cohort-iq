import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
} from 'remotion';
import { IntroScene } from './scenes/IntroScene';
import { ProblemScene } from './scenes/ProblemScene';
import { SolutionScene } from './scenes/SolutionScene';
import { FeaturesScene } from './scenes/FeaturesScene';
import { ClosingScene } from './scenes/ClosingScene';
import { SCENE, COLORS } from './styles';

const SceneFade: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}> = ({
  children,
  durationInFrames,
  fadeInDuration = 12,
  fadeOutDuration = 10,
}) => {
  const frame = useCurrentFrame();
  const fadeIn =
    fadeInDuration > 0
      ? interpolate(frame, [0, fadeInDuration], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;
  const fadeOut =
    fadeOutDuration > 0
      ? interpolate(
          frame,
          [durationInFrames - fadeOutDuration, durationInFrames],
          [1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        )
      : 1;
  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      {children}
    </AbsoluteFill>
  );
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
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
      }}
    />
  );
};

export const CohortIQVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDark }}>
      <Background />

      <Sequence from={SCENE.intro.from} durationInFrames={SCENE.intro.duration}>
        <SceneFade durationInFrames={SCENE.intro.duration} fadeInDuration={0}>
          <IntroScene />
        </SceneFade>
      </Sequence>

      <Sequence
        from={SCENE.problem.from}
        durationInFrames={SCENE.problem.duration}
      >
        <SceneFade durationInFrames={SCENE.problem.duration}>
          <ProblemScene />
        </SceneFade>
      </Sequence>

      <Sequence
        from={SCENE.solution.from}
        durationInFrames={SCENE.solution.duration}
      >
        <SceneFade durationInFrames={SCENE.solution.duration}>
          <SolutionScene />
        </SceneFade>
      </Sequence>

      <Sequence
        from={SCENE.features.from}
        durationInFrames={SCENE.features.duration}
      >
        <SceneFade durationInFrames={SCENE.features.duration}>
          <FeaturesScene />
        </SceneFade>
      </Sequence>

      <Sequence
        from={SCENE.closing.from}
        durationInFrames={SCENE.closing.duration}
      >
        <SceneFade
          durationInFrames={SCENE.closing.duration}
          fadeOutDuration={0}
        >
          <ClosingScene />
        </SceneFade>
      </Sequence>
    </AbsoluteFill>
  );
};
