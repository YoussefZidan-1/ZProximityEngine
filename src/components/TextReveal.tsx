import React, { useRef, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

export interface TextRevealProps {
  children: React.ReactNode;
  animateOnScroll?: boolean;
  delay?: number;
  duration?: number;
  stagger?: number;
  className?: string;
  once?: boolean;
}

export default function TextReveal({
  children,
  animateOnScroll = true,
  delay = 0,
  duration = 1.2,
  stagger = 0.1,
  className = "",
  once = true
}: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    const initReveal = () => {
      const container = containerRef.current;
      if (!container) return null;

      // Ensure content is visible
      gsap.set(container, { visibility: 'visible' });

      // Split text into words
      const text = new SplitType(container, { 
        types: 'words',
        tagName: 'span'
      });

      if (!text.words || text.words.length === 0) {
        gsap.to(container, { y: 0, duration: 0.5 });
        return text;
      }

      // Wrap each word in a mask container
      text.words.forEach(word => {
        const wrapper = document.createElement('span');
        wrapper.style.overflow = 'hidden';
        wrapper.style.display = 'inline-block';
        wrapper.style.verticalAlign = 'bottom';
        wrapper.style.paddingBottom = '0.3em';
        wrapper.style.marginBottom = '-0.3em';
        wrapper.style.paddingRight = '0.2em';
        wrapper.style.marginRight = '-0.2em';
        wrapper.style.paddingLeft = '0.2em';
        wrapper.style.marginLeft = '-0.2em';
        wrapper.style.paddingTop = '0.1em';
        wrapper.style.marginTop = '-0.1em';
        wrapper.className = 'word-mask';
        word.parentNode?.insertBefore(wrapper, word);
        wrapper.appendChild(word);
        
        // Ensure the word itself is block/inline-block for transform
        word.style.display = 'inline-block';
      });

      // Position words below the mask
      gsap.set(text.words, { y: '150%' });

      const tweenProps: gsap.TweenVars = {
        y: '0%',
        duration: duration,
        stagger: stagger,
        ease: 'power4.out',
        delay: delay,
      };

      if (animateOnScroll) {
        gsap.to(text.words, {
          ...tweenProps,
          scrollTrigger: {
            trigger: container,
            start: "top 95%",
            once: once,
          }
        });
      } else {
        gsap.to(text.words, tweenProps);
      }
      return text;
    };

    // Small delay to ensure layout and fonts are ready
    const timeoutId = setTimeout(() => {
      let splitInstance = initReveal();
      
      const handleResize = () => {
        if (splitInstance) splitInstance.revert();
        splitInstance = initReveal();
      };

      window.addEventListener('resize', handleResize);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, { scope: containerRef, dependencies: [children, animateOnScroll, delay] });

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {children}
    </div>
  );
}
