// Injected into every page of a tour. Playwright's video capture does not draw
// the OS cursor, so a silent screen recording of clicks looks like the UI is
// changing on its own. This paints a synthetic pointer that follows the
// Playwright mouse and pulses on click, so a viewer can read the interaction.

(() => {
  if (window.__tourCursorInstalled) return;
  window.__tourCursorInstalled = true;

  const install = () => {
    const dot = document.createElement('div');
    dot.id = '__tour-cursor';
    dot.setAttribute('aria-hidden', 'true');
    Object.assign(dot.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '22px',
      height: '22px',
      marginLeft: '-11px',
      marginTop: '-11px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.55)',
      border: '2px solid rgba(20,20,30,0.65)',
      boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
      pointerEvents: 'none',
      zIndex: '2147483647',
      transition: 'transform 90ms ease-out',
      willChange: 'transform',
    });

    const ring = document.createElement('div');
    ring.setAttribute('aria-hidden', 'true');
    Object.assign(ring.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '22px',
      height: '22px',
      marginLeft: '-11px',
      marginTop: '-11px',
      borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.9)',
      pointerEvents: 'none',
      zIndex: '2147483646',
      opacity: '0',
      willChange: 'transform, opacity',
    });

    document.body.append(dot, ring);

    let x = -100;
    let y = -100;

    document.addEventListener(
      'mousemove',
      (e) => {
        x = e.clientX;
        y = e.clientY;
        dot.style.transform = `translate(${x}px, ${y}px)`;
        ring.style.transform = `translate(${x}px, ${y}px) scale(1)`;
      },
      true,
    );

    document.addEventListener(
      'mousedown',
      () => {
        dot.style.transform = `translate(${x}px, ${y}px) scale(0.75)`;
        ring.style.transition = 'none';
        ring.style.opacity = '0.95';
        ring.style.transform = `translate(${x}px, ${y}px) scale(1)`;
        // Force a reflow so the expand animation restarts on every click.
        void ring.offsetWidth;
        ring.style.transition = 'transform 420ms ease-out, opacity 420ms ease-out';
        ring.style.opacity = '0';
        ring.style.transform = `translate(${x}px, ${y}px) scale(2.6)`;
      },
      true,
    );

    document.addEventListener(
      'mouseup',
      () => {
        dot.style.transform = `translate(${x}px, ${y}px) scale(1)`;
      },
      true,
    );
  };

  if (document.body) install();
  else document.addEventListener('DOMContentLoaded', install, { once: true });
})();
