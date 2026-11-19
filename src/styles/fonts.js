/**
 * Self-hosted font faces (Fontsource).
 *
 * Why self-hosted: no render-blocking request to a third-party origin, and
 * every face ships `unicode-range` subsets, so an English visitor never
 * downloads Arabic glyphs (and vice versa).
 */
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/alexandria';
import '@fontsource-variable/geist';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/instrument-serif/400-italic.css';
