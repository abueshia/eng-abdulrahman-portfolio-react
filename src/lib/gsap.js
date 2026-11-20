/**
 * GSAP entry point: core + the plugins this site uses, registered once, plus
 * the signature eases. Imported ONLY from lazily loaded "director" modules,
 * so GSAP never weighs on the initial bundle.
 *
 * Ease vocabulary (mirrored as CSS tokens in styles/tokens.css and as
 * cubic-bezier tuples in utils/motion.js):
 *  - ember:   heavy arrival with a long settle (things with mass coming to rest)
 *  - shutter: holds, then opens decisively (camera slit, curtains)
 *  - snap:    fast, crisp response
 *  - drift:   slow ambient moves (background, depth layers)
 *  - weight:  a heavy object that overshoots a hair, then settles (portrait)
 */
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, CustomEase);

CustomEase.create('ember', '0.16,1,0.3,1');
CustomEase.create('shutter', '0.7,0,0.15,1');
CustomEase.create('snap', '0.5,0,0,1');
CustomEase.create('drift', '0.45,0.05,0.25,1');
CustomEase.create('weight', 'M0,0 C0.18,0 0.12,1.06 0.42,1.035 0.62,1.018 0.78,1 1,1');

// Mobile browsers resize the viewport when the URL bar shows or hides;
// refreshing every trigger on that would make pinned scenes jump.
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger, SplitText };
