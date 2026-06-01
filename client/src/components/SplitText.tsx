import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  startDelay?: number;
  duration?: number;
  ease?: string | ((t: number) => number);
  splitType?: 'chars' | 'words' | 'lines' | 'words, chars' | 'none';
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  textAlign?: React.CSSProperties['textAlign'];
  onLetterAnimationComplete?: () => void;
  showCallback?: boolean;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 50,
  startDelay = 0,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete,
  showCallback = false
}) => {
  const ref = useRef<HTMLElement>(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);

  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useGSAP(
    () => {
      if (!ref.current || !text) return;
      if (animationCompletedRef.current) return;

      const el = ref.current;

      // Parse and construct standard scrolltrigger scroll targets and positions
      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
      const sign =
        marginValue === 0
          ? ''
          : marginValue < 0
            ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      // Select targeting elements inside raw markup depending on splitType
      let targets: Element[] = [];
      if (splitType === 'none') {
        targets = Array.from(el.querySelectorAll('.split-char'));
      } else if (splitType.includes('chars')) {
        targets = Array.from(el.querySelectorAll('.split-char'));
      } else if (splitType.includes('words')) {
        targets = Array.from(el.querySelectorAll('.split-word'));
      } else {
        targets = Array.from(el.querySelectorAll('.split-word'));
      }

      if (!targets.length) {
        targets = [el];
      }

      const tween = gsap.fromTo(
        targets,
        { ...from },
        {
          ...to,
          duration,
          ease,
          delay: startDelay, // Stagger delay before this specific line reveals
          stagger: delay / 1000,
          scrollTrigger: {
            trigger: el,
            start,
            once: true,
            fastScrollEnd: true,
            anticipatePin: 0.4
          },
          onComplete: () => {
            animationCompletedRef.current = true;
            if (onCompleteRef.current) {
              onCompleteRef.current();
            }
          },
          willChange: 'transform, opacity',
          force3D: true
        }
      );

      return () => {
        ScrollTrigger.getAll().forEach(st => {
          if (st.trigger === el) st.kill();
        });
        tween.kill();
      };
    },
    {
      dependencies: [
        text,
        delay,
        startDelay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin
      ],
      scope: ref
    }
  );

  // Parse text into spans dynamically (chars/words structure)
  const renderContent = () => {
    if (splitType === 'none') {
      return (
        <span
          className={`split-char inline-block ${className}`}
          style={{ willChange: 'transform, opacity' }}
        >
          {text}
        </span>
      );
    }

    if (splitType === 'words') {
      return text.split(' ').map((word, i) => (
        <span
          key={i}
          className="split-word inline-block"
          style={{ willChange: 'transform, opacity' }}
        >
          {word}
          {i < text.split(' ').length - 1 ? '\u00A0' : ''}
        </span>
      ));
    }

    // Default: splitType = "chars"
    return text.split(' ').map((word, wordIndex, wordArr) => {
      const chars = word.split('');
      return (
        <span
          key={wordIndex}
          className="split-word inline-block whitespace-nowrap"
          style={{ willChange: 'transform, opacity' }}
        >
          {chars.map((char, charIndex) => (
            <span
              key={charIndex}
              className="split-char inline-block"
              style={{ willChange: 'transform, opacity' }}
            >
              {char}
            </span>
          ))}
          {wordIndex < wordArr.length - 1 ? '\u00A0' : ''}
        </span>
      );
    });
  };

  const style: React.CSSProperties = {
    textAlign,
    overflow: 'hidden',
    display: 'inline-block',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    willChange: 'transform, opacity'
  };
  
  // If splitType is "none", we put the gradient styling class directly on the child span rather than the parent wrapper to support background-clip text safely.
  const parentClass = splitType === 'none' ? `split-parent` : `split-parent ${className}`;
  const content = renderContent();

  switch (tag) {
    case 'h1':
      return (
        <h1 ref={ref as React.RefObject<HTMLHeadingElement | null>} style={style} className={parentClass}>
          {content}
        </h1>
      );
    case 'h2':
      return (
        <h2 ref={ref as React.RefObject<HTMLHeadingElement | null>} style={style} className={parentClass}>
          {content}
        </h2>
      );
    case 'h3':
      return (
        <h3 ref={ref as React.RefObject<HTMLHeadingElement | null>} style={style} className={parentClass}>
          {content}
        </h3>
      );
    case 'h4':
      return (
        <h4 ref={ref as React.RefObject<HTMLHeadingElement | null>} style={style} className={parentClass}>
          {content}
        </h4>
      );
    case 'h5':
      return (
        <h5 ref={ref as React.RefObject<HTMLHeadingElement | null>} style={style} className={parentClass}>
          {content}
        </h5>
      );
    case 'h6':
      return (
        <h6 ref={ref as React.RefObject<HTMLHeadingElement | null>} style={style} className={parentClass}>
          {content}
        </h6>
      );
    case 'span':
      return (
        <span ref={ref as React.RefObject<HTMLSpanElement | null>} style={style} className={parentClass}>
          {content}
        </span>
      );
    case 'p':
    default:
      return (
        <p ref={ref as React.RefObject<HTMLParagraphElement | null>} style={style} className={parentClass}>
          {content}
        </p>
      );
  }
};

export default SplitText;
