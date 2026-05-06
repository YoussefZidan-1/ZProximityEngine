import { useMemo } from 'react';
import { Proximity } from '../lib';

const PixelGridBackground = () => {
  // We define separate arrays for the horizontal (top/bottom) and vertical (left/right) edges
  const horizontalPixels = useMemo(() => Array.from({ length: 25 }),[]);
  const verticalPixels = useMemo(() => Array.from({ length: 15 }),[]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      <Proximity
        selector=".bg-pixel"
        preset="scale-opacity-rotate-skew-magnetic"
        reach={3.5}
        global={true}
        config={{
          scale: [0.7, 4],
          opacity:[0.3, 0.9],
          rotate: [0, 360],
          skew:[0, 5],
          duration: 2,
          resetDuration: 2,
          ease: "elastic",
          resetEase: "elastic"
        }}
        // The main container fills the space but doesn't dictate layout
        className="absolute inset-0 w-full h-full"
      >
        {/* Top Border */}
        <div className="absolute top-0 left-0 right-0 flex justify-between p-4">
          {horizontalPixels.map((_, i) => (
            <div key={`t-${i}`} className="bg-pixel w-1 h-1 bg-[var(--text-color)]" />
          ))}
        </div>
        
        {/* Bottom Border */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between p-4">
          {horizontalPixels.map((_, i) => (
            <div key={`b-${i}`} className="bg-pixel w-1 h-1 bg-[var(--text-color)]" />
          ))}
        </div>

        {/* Left Border (Pushed down/up slightly to avoid corner overlap with Top/Bottom) */}
        <div className="absolute top-10 bottom-10 left-0 flex flex-col justify-between p-4">
          {verticalPixels.map((_, i) => (
            <div key={`l-${i}`} className="bg-pixel w-1 h-1 bg-[var(--text-color)]" />
          ))}
        </div>

        {/* Right Border */}
        <div className="absolute top-10 bottom-10 right-0 flex flex-col justify-between p-4">
          {verticalPixels.map((_, i) => (
            <div key={`r-${i}`} className="bg-pixel w-1 h-1 bg-[var(--text-color)]" />
          ))}
        </div>
      </Proximity>
    </div>
  );
};

export default PixelGridBackground;