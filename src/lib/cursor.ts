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

  // The framed element squares its corners (styles.css). Its own transition
  // list is extended with border-radius, so the corners ease instead of jump.
  const RADIUS = 'border-radius 0.25s ease';
  const eased = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
  const ease = (el: HTMLElement) => {
    clearTimeout(eased.get(el));
    // Pills use a huge radius (999px); easing from there to 0 only shows in the
    // last few percent, so it looks instant. Start from the radius you actually
    // see, half the height, applied before the transition is switched on.
    const r = el.getBoundingClientRect();
    const half = Math.min(r.width, r.height) / 2;
    if (!el.style.borderRadius && parseFloat(getComputedStyle(el).borderTopLeftRadius) > half) {
      el.style.transition = 'none';
      el.style.borderRadius = `${half}px`;
      void el.offsetWidth;
      el.style.transition = '';
    }
    const t = getComputedStyle(el).transition;
    if (!el.style.transition.includes('border-radius'))
      el.style.transition = !t || t.startsWith('all 0s') ? RADIUS : `${t}, ${RADIUS}`;
    void el.offsetWidth;
  };
  const mark = (el: Element) => {
    if (el instanceof HTMLElement) ease(el);
    el.setAttribute('data-cur-target', '');
  };
  const unmark = (el: Element) => {
    el.removeAttribute('data-cur-target');
    // keep the eased radius until the corners are round again
    if (el instanceof HTMLElement)
      eased.set(el, setTimeout(() => ((el.style.transition = ''), (el.style.borderRadius = '')), 300));
  };

  let mx = -100, my = -100; // pointer
  let x = mx, y = my, w = SIZE, h = SIZE; // ring, eased toward its target
  let target: Element | null = null;
  let theme: Element | null = null;

  const setTheme = (el: Element | null) => {
    // the nearest screen with its own palette: the minigame overlay, else the CRT
    const crt = el?.closest('.hack-overlay, .crt') ?? null;
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
    if (next !== target && target) unmark(target);
    target = next;
    root.classList.toggle('cur-lock', !!target);
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
    if (target && !target.hasAttribute('data-cur-target')) mark(target);
    // a count badge (the bell) takes the place of the top-right bracket. The bell
    // reports its count in data-unread, so the bracket returns the moment the
    // count drops to 0, not after the badge's exit animation.
    const unread = target?.getAttribute('data-unread');
    root.classList.toggle('cur-badge', unread != null ? Number(unread) > 0 : !!target?.querySelector('.bell-count'));
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
