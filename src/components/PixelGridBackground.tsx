import { useMemo } from 'react';
import { Proximity} from '../lib';
const PixelGridBackground = () => {
  const pixels = useMemo(() => Array.from({ length: 50 }),[]);

  return (
    <div 
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
    >
      <Proximity
        selector=".bg-pixel"
        preset="scale-opacity-magnetic"
        reach={3.5}
        global={true}
        config={{
          scale: [0.7, 4],
          opacity:[0.1, 0.9],
          magnetic: [0, 0.15],
          duration: 2,
          resetDuration: 2,
          ease: "elastic",
          resetEase: "elastic"
        }}
        className="w-full h-full flex flex-wrap gap-5 p-4 justify-center items-start"
      >
        {pixels.map((_, i) => (
          <div 
            key={i} 
            className="bg-pixel w-1 h-1 bg-[var(--text-color)]"
          />
        ))}
      </Proximity>
    </div>
  );
};

export default PixelGridBackground;