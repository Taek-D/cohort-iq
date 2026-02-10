import React from 'react';
import { Composition } from 'remotion';
import { CohortIQVideo } from './CohortIQVideo';
import { Thumbnail } from './Thumbnail';
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
      <Composition
        id="Thumbnail"
        component={Thumbnail}
        durationInFrames={60}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
