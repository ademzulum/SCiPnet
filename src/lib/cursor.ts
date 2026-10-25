// Custom mouse cursor: a dot on the pointer with a ring around it. Over
// something clickable the ring glides to frame that element with corner
// brackets; the frame is cut off where the dock covers the element. Colours come from the theme of the screen under the pointer.
// Touch screens and pens keep their own cursor (see styles.css).
const CLICKABLE = 'button:not(:disabled), a[href], [role="button"], select, summary, label[for], .chip, .link';
const TEXT = 'input:not([type="range"]):not([type="checkbox"]):not([type="button"]), textarea, [contenteditable="true"]';
const SIZE = 30;

export function customCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const root = document.documentElement;
  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'cur-dot';
  ring.className = 'cur-ring';
  ring.innerHTML = '<i></i><i></i><i></i><i></i>';
  document.body.append(ring, dot);
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
    target = el.closest?.(CLICKABLE) ?? null;
    root.classList.toggle('cur-lock', !!target);
    root.classList.toggle('cur-text', !!el.closest?.(TEXT));
    root.classList.add('cur-on');
    setTheme(el);
  }, { passive: true });
  addEventListener('pointerdown', () => root.classList.add('cur-down'));
  addEventListener('pointerup', () => root.classList.remove('cur-down'));
  document.addEventListener('mouseleave', () => root.classList.remove('cur-on'));
  // theme switches (light/dark, alerts) change the colours under a still pointer
  setInterval(() => { theme = null; setTheme(document.elementFromPoint(mx, my)); }, 1000);

  const frame = () => {
    let tx = mx - SIZE / 2, ty = my - SIZE / 2, tw = SIZE, th = SIZE;
    if (target?.isConnected) {
      const r = target.getBoundingClientRect();
      tx = r.left - 5; ty = r.top - 5; tw = r.width + 10; th = r.height + 10;
    }
    // the ring sits on the pointer; only the move into and out of a frame is eased
    const k = target || w > SIZE + 1 || h > SIZE + 1 ? 0.35 : 1;
    x += (tx - x) * k; y += (ty - y) * k; w += (tw - w) * k; h += (th - h) * k;
    dot.style.transform = `translate(${mx}px, ${my}px)` + (root.classList.contains('cur-down') ? ' scale(0.6)' : '');
    ring.style.transform = `translate(${x}px, ${y}px)`;
    ring.style.width = `${w}px`;
    ring.style.height = `${h}px`;
    // the dock stays on top: hide the part of a frame that reaches under it
    const dock = target && !target.closest('.dock') ? document.querySelector('.dock')?.getBoundingClientRect() : null;
    const under = dock && x < dock.right && x + w > dock.left ? y + h - dock.top : 0;
    ring.style.clipPath = under > 0 ? `inset(0 0 ${Math.min(under, h)}px 0)` : '';
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
