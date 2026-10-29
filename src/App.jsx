import './App.css';
import { useEffect, useRef } from 'react';
const LETTERS = {
  S: ['#######', '##     ', '##     ', '##     ', ' ##### ', '     ##', '     ##', '     ##', '###### '],
  O: [' ##### ', '##   ##', '##   ##', '##   ##', '##   ##', '##   ##', '##   ##', '##   ##', ' ##### '],
  D: ['###### ', '##   ##', '##    #', '##    #', '##    #', '##    #', '##    #', '##   ##', '###### '],
  U: ['##   ##', '##   ##', '##   ##', '##   ##', '##   ##', '##   ##', '##   ##', '##   ##', ' ##### '],
  R: ['###### ', '##   ##', '##   ##', '##   ##', '###### ', '## ##  ', '##  ## ', '##   ##', '##   ##'],
  A: [' ##### ', '##   ##', '##   ##', '##   ##', '#######', '##   ##', '##   ##', '##   ##', '##   ##'],
  L: ['##     ', '##     ', '##     ', '##     ', '##     ', '##     ', '##     ', '##     ', '#######'],
};

const LOGO_ROWS = Array.from({ length: 9 }, (_, sourceRow) =>
  [...'SODURAL'].flatMap((letter, index) => [
    ...[...LETTERS[letter][sourceRow]].flatMap((pixel) => [pixel, pixel]),
    ...(index < 6 ? [' ', ' ', ' ', ' '] : []),
  ]),
);

function App() {
  const vortexRef = useRef(null);

  useEffect(() => {
    const canvas = vortexRef.current;
    if (!window.CanvasRenderingContext2D) return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const glyphs = '.:-=+*xX#%@';
    let animationFrame;
    let lastFrame = 0;

    function draw(timestamp) {
      if (timestamp - lastFrame >= 45 || reducedMotion) {
        lastFrame = timestamp;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        const canvasWidth = Math.round(width * pixelRatio);
        const canvasHeight = Math.round(height * pixelRatio);

        if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        }

        const fontSize = Math.max(8, Math.min(12, width / 100));
        const cellWidth = fontSize * 0.68;
        const rowHeight = fontSize * 1.25;
        const time = timestamp / 1000;

        context.clearRect(0, 0, width, height);
        context.font = `${fontSize}px 'Courier New', monospace`;
        context.textBaseline = 'top';

        for (let row = 0, y = 0; y < height; row += 1, y += rowHeight) {
          for (let column = 0, x = 0; x < width; column += 1, x += cellWidth) {
            const horizontal = (x - width / 2) / (width * 0.56);
            const vertical = (y - height / 2) / (height * 0.46);
            const radius = Math.hypot(horizontal, vertical);
            const noise = Math.abs(Math.sin(column * 127.1 + row * 311.7) * 43758.5453) % 1;

            if (radius > 1.28) {
              if (noise > 0.997) {
                context.fillStyle = 'rgba(160, 205, 255, 0.35)';
                context.fillText('.', x, y);
              }
              continue;
            }

            const angle = Math.atan2(vertical, horizontal);
            const spiral = angle * 4 - radius * 8 + time * 0.48;
            const arm = Math.pow((Math.sin(spiral) + 1) / 2, 2.4);
            const core = Math.exp(-radius * 6);
            const dustLane = (Math.sin(radius * 28 - angle * 4 + time * 0.35) + 1) / 2;
            const density = Math.min(0.96, 0.16 + arm * 0.62 + core * 0.35 + dustLane * 0.12);

            if (noise > density) continue;

            const glyphIndex = Math.floor((noise * 19 + arm * 7 + time * 1.4) % glyphs.length);
            const opacity = Math.min(0.94, 0.22 + arm * 0.42 + core * 0.3);

            context.fillStyle = core > 0.48 || arm > 0.82
              ? `rgba(225, 242, 255, ${opacity})`
              : `rgba(119, 190, 255, ${opacity})`;
            context.fillText(glyphs[glyphIndex], x, y);
          }
        }
      }

      if (!reducedMotion) animationFrame = window.requestAnimationFrame(draw);
    }

    function resize() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(draw);
    }

    animationFrame = window.requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <main className="screen">
      <canvas className="ascii-vortex" ref={vortexRef} aria-hidden="true" />
      <a
        className="logo-link"
        href="https://www.linkedin.com/in/pascalso/"
        aria-label="Sodural, profil LinkedIn de Pascal So"
        title="Profil LinkedIn"
        target="_blank"
        rel="noreferrer"
      >
        <pre className="ascii-logo" aria-hidden="true">
          {LOGO_ROWS.map((row, rowIndex) => (
            <span className="ascii-row" key={rowIndex}>
              {row.map((pixel, columnIndex) => (
                <span
                  className={pixel === '#' ? 'ascii-pixel' : undefined}
                  key={columnIndex}
                  style={{ '--wave-delay': `${(columnIndex + rowIndex * 2) * -40}ms` }}
                >
                  {pixel}
                </span>
              ))}
            </span>
          ))}
        </pre>
      </a>
    </main>
  );
}

export default App;
