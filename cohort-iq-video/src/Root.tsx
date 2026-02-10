import React from 'react';
import { Composition } from 'remotion';
import { CohortIQVideo } from './CohortIQVideo';
import { FPS, TOTAL_FRAMES } from './styles';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="CohortIQIntro"
        component={CohortIQVideo}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
