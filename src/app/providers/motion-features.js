/**
 * motion's DOM animation features, split out so `LazyMotion` can load them
 * after the first render instead of shipping them in the initial bundle.
 */
export { domAnimation as default } from 'motion/react';
