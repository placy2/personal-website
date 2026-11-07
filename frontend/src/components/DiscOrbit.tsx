import React, { useEffect, useId, useRef, useState } from 'react';
import { TECHNOLOGIES } from '../constants';
import '../stylesheets/DiscOrbit.css';

/** Width of the fixed artboard in DiscOrbit.css; narrower containers scale it down. */
const STAGE_WIDTH = 560;
/** Must match --dgo-throw-duration in DiscOrbit.css. */
const THROW_MS = 2800;
/** Point in the throw where the disc hits the chains (54% keyframe). */
const ACE_AT_MS = THROW_MS * 0.54;
/** Chance a throw is an ace; every other throw flies past it. */
const ACE_ODDS = 1 / 3;

export interface OrbitLogo {
  name: string;
  icon: string;
}

interface DiscOrbitProps {
  /** Logos that orbit the disc. Defaults to the Home page's technologies. */
  logos?: readonly OrbitLogo[];
  /** Text stamped around the disc rim. */
  stamp?: string;
}

/**
 * Decorative disc-golf band: a stamped disc with tool logos orbiting it, a tee,
 * and a basket. "Throw" sends the disc on a low line at the basket: 1 in 5 throws
 * is an ace, the rest sail past.
 * The scene is aria-hidden; only the button and ace counter are exposed.
 */
const DiscOrbit: React.FC<DiscOrbitProps> = ({
  logos = TECHNOLOGIES,
  stamp = 'PARKER LACY • SHIP IT • ACE IT •',
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const aceTimer = useRef<number | undefined>(undefined);
  const [isThrowing, setIsThrowing] = useState(false);
  const [isAce, setIsAce] = useState(false);
  const [aces, setAces] = useState(0);

  // SVG ids must be unique per instance and safe inside url(#...).
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const gradientId = `dgo-grad-${uid}`;
  const arcId = `dgo-arc-${uid}`;

  // Scale the artboard to the container and pause animations while offscreen.
  // Both write straight to the DOM so neither causes a React re-render.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const fit = () => {
      root.style.setProperty('--dgo-s', String(Math.min(1, root.clientWidth / STAGE_WIDTH)));
    };
    fit();

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(fit);
      resizeObserver.observe(root);
    } else {
      window.addEventListener('resize', fit);
    }

    let intersectionObserver: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(entries => {
        for (const entry of entries) root.classList.toggle('is-paused', !entry.isIntersecting);
      });
      intersectionObserver.observe(root);
    }

    return () => {
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, []);

  useEffect(() => () => window.clearTimeout(aceTimer.current), []);

  const handleThrow = () => {
    if (isThrowing) return;
    const ace = Math.random() < ACE_ODDS;
    setIsAce(ace);
    setIsThrowing(true);
    if (ace) aceTimer.current = window.setTimeout(() => setAces(n => n + 1), ACE_AT_MS);
  };

  const handleDiscAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (event.animationName === 'dgo-throw') setIsThrowing(false);
  };

  return (
    <div
      ref={rootRef}
      className={`dgo${isThrowing ? ` is-throwing ${isAce ? 'is-ace' : 'is-miss'}` : ''}`}
    >
      <div className="dgo-stage" aria-hidden="true">
        <div className="dgo-floor" />

        {/* Tee pad and basket (behind the disc) */}
        <svg className="dgo-props" viewBox="0 0 560 280">
          <g className="dgo-props-lines">
            <rect className="dgo-tee" x="50" y="222" width="44" height="5" rx="2.5" />
            <path d="M482 109 V268 M468 268 H496" />
            <rect x="456" y="112" width="52" height="7" rx="3.5" />
            <g className="dgo-chains">
              <path
                strokeWidth="1.3"
                d="M459 119 C459 156 466 178 475 190 M466 119 C466 156 471 178 478 190 M474 119 C474 158 477 180 480 190 M490 119 C490 158 487 180 484 190 M498 119 C498 156 493 178 486 190 M505 119 C505 156 498 178 489 190"
              />
              <path
                strokeWidth="1"
                strokeOpacity="0.5"
                d="M462 119 C462 158 472 180 479 190 M502 119 C502 158 492 180 485 190"
              />
            </g>
            <ellipse cx="482" cy="194" rx="34" ry="5" strokeOpacity="0.6" />
          </g>
        </svg>

        <div className="dgo-scene">
          <div className="dgo-glow" />
          <div className="dgo-disc" onAnimationEnd={handleDiscAnimationEnd}>
            <svg viewBox="0 0 100 100">
              <defs>
                <radialGradient id={gradientId} cx="40%" cy="35%" r="70%">
                  <stop offset="0" style={{ stopColor: 'var(--theme-light-purple)' }} />
                  <stop offset="0.55" style={{ stopColor: 'var(--theme-purple)' }} />
                  <stop offset="1" style={{ stopColor: 'var(--theme-dark-purple)' }} />
                </radialGradient>
                <path id={arcId} d="M19 50 a31 31 0 1 1 62 0 a31 31 0 1 1 -62 0" />
              </defs>
              <circle cx="50" cy="50" r="48" fill={`url(#${gradientId})`} />
              <g className="dgo-disc-lines">
                <circle cx="50" cy="50" r="41" strokeOpacity="0.35" strokeWidth="1.2" />
                <circle cx="50" cy="50" r="22" strokeOpacity="0.2" strokeWidth="1" />
              </g>
              <text className="dgo-disc-text">
                <textPath href={`#${arcId}`} textLength="190" lengthAdjust="spacing">
                  {stamp}
                </textPath>
              </text>
              {/* basket stamp */}
              <g className="dgo-disc-lines" strokeWidth="2" strokeLinecap="round">
                <path d="M40 41 H60 M43 41 L47 56 M50 41 V56 M57 41 L53 56" />
                <path
                  d="M40 56 H60 L57 61 H43Z"
                  style={{ fill: 'var(--theme-white)' }}
                  fillOpacity="0.85"
                />
              </g>
            </svg>
          </div>
          <div className="dgo-plane">
            <div className="dgo-ring" />
            {logos.map((logo, i) => (
              <div
                key={logo.name}
                className="dgo-arm"
                style={{ '--a': `${(360 / logos.length) * i}deg` } as React.CSSProperties}
              >
                <div className="dgo-sat">
                  <img src={logo.icon} alt="" width={26} height={26} loading="lazy" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tray front lip: drawn over the disc so it lands *inside* the basket */}
        <svg className="dgo-props" viewBox="0 0 560 280">
          <path
            className="dgo-tray-front"
            d="M448 194 Q482 201 516 194 L512 213 Q482 220 452 213 Z"
          />
        </svg>

        <div className="dgo-flash" />
        <div className="dgo-missed">
          MISS<small>try again?</small>
        </div>
        <div className="dgo-ace">
          ACE<small>DEPLOYED TO PROD</small>
        </div>
      </div>

      <div className="dgo-ui">
        <button
          type="button"
          className="dgo-throw"
          onClick={handleThrow}
          aria-disabled={isThrowing}
          aria-label="Throw the disc"
        >
          THROW
        </button>
        <span className="dgo-aces" aria-live="polite">
          ACES <b>{aces}</b>
        </span>
      </div>
    </div>
  );
};

export default DiscOrbit;
