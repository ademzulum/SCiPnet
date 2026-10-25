// Custom mouse cursor: four corner brackets around the pointer. Over
// something clickable the brackets glide out to frame that element
// The dock covers a frame that reaches under it. Colours come from the theme of the screen under the pointer.
// Touch screens and pens keep their own cursor (see styles.css).
const CLICKABLE = 'button:not(:disabled), a[href], [role="button"], select, summary, label[for], .chip, .link';
const TEXT = 'input:not([type="range"]):not([type="checkbox"]):not([type="button"]), textarea, [contenteditable="true"]';
const SIZE = 22;

export function customCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const root = document.documentElement;
  const ring = document.createElement('div');
  ring.className = 'cur-ring';
  ring.innerHTML = '<i></i><i></i><i></i><i></i>';
  document.body.append(ring);
  root.classList.add('has-cursor');

  let mx = -100, my = -100; // pointer
  let x = mx, y = my, w = SIZE, h = SIZE; // ring, eased toward its target
  let target: Element | null = null;
  let theme: Element | null = null;

  const setTheme = (el: Element | null) => {
    const crt = el?.closest('.crt') ?? null;
    if (crt === theme && crt) return;
    theme = crt;
    const cs = getComputedStyle(crt ?? document.body);
    for (const v of ['hi', 'fg', 'bg', 'accent']) root.style.setProperty(`--cur-${v}`, cs.getPropertyValue(`--${v}`) || '');
  };

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX;
    my = e.clientY;
    const el = e.target as Element;
    const next = el.closest?.(CLICKABLE) ?? null;
    // the framed element squares its corners to match the frame (styles.css)
    if (next !== target) target?.removeAttribute('data-cur-target');
    target = next;
    root.classList.toggle('cur-lock', !!target);
    // a count badge (the bell) takes the place of the top-right bracket
    root.classList.toggle('cur-badge', !!target?.querySelector('.bell-count'));
    root.classList.toggle('cur-text', !!el.closest?.(TEXT));
    root.classList.add('cur-on');
    setTheme(el);
  }, { passive: true });
  document.addEventListener('mouseleave', () => root.classList.remove('cur-on'));
  // theme switches (light/dark, alerts) change the colours under a still pointer
  setInterval(() => { theme = null; setTheme(document.elementFromPoint(mx, my)); }, 1000);

  const frame = () => {
    let tx = mx - SIZE / 2, ty = my - SIZE / 2, tw = SIZE, th = SIZE;
    // a click can re-render or replace the framed element: find it again and
    // keep it marked (an attribute, so React's className updates don't drop it)
    if (target && !target.isConnected) {
      target = document.elementFromPoint(mx, my)?.closest(CLICKABLE) ?? null;
    }
    if (target && !target.hasAttribute('data-cur-target')) target.setAttribute('data-cur-target', '');
    if (target?.isConnected) {
      const r = target.getBoundingClientRect();
      // exactly on the element's edges, so the frame never spills onto its neighbours
      tx = r.left; ty = r.top; tw = r.width; th = r.height;
    }
    // The dock stays on top: a frame reaching under the dock is drawn next to
    // it, one layer below, so the dock covers it like it covers the element.
    // Dock buttons are framed from the top layer.
    // Anything else (menus, the notification panel) stays on the top layer.
    const dock = document.querySelector('.dock');
    const d = dock?.getBoundingClientRect();
    const under = !!d && !!target && !target.closest('.dock') && d.left < tx + tw && d.right > tx && d.top < ty + th && d.bottom > ty;
    const host = under && dock?.parentElement ? dock.parentElement : document.body;
    if (ring.parentElement !== host) {
      host.append(ring);
      const z = host === document.body ? '' : String(Math.max(0, (parseInt(getComputedStyle(dock!).zIndex) || 1) - 1));
      ring.style.zIndex = z;
    }
    // the ring sits on the pointer; only the move into and out of a frame is eased
    const k = target || w > SIZE + 1 || h > SIZE + 1 ? 0.35 : 1;
    x += (tx - x) * k; y += (ty - y) * k; w += (tw - w) * k; h += (th - h) * k;
    ring.style.transform = `translate(${x}px, ${y}px)`;
    ring.style.width = `${w}px`;
    ring.style.height = `${h}px`;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
