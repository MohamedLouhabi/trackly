/**
 * The Trackly lockup, used everywhere the wordmark used to be typeset.
 *
 * Width is derived from the height so the two attributes always match the
 * asset's own proportions and the header never reflows while the PNG loads.
 * Plain <img> rather than next/image: it is a fixed-size static asset in the
 * first paint of every page, so there is nothing for the optimizer to do.
 */
const LOGO_RATIO = 1011 / 297;

export function Brandmark({ height = 22 }: { height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static asset, fixed size
    <img
      className="brand-logo"
      src="/logo.png"
      alt="Trackly"
      width={Math.round(height * LOGO_RATIO)}
      height={height}
    />
  );
}
