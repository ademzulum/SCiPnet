// Chrome keeps painting a scrollbar in its old colours after the light/dark
// switch (or not at all) until something forces it to redraw. When the theme
// attributes on a .crt screen change, briefly hide its scrollbars and show
// them again, which makes the browser paint them fresh.
export function repaintScrollbarsOnThemeChange() {
  const style = document.createElement('style');
  style.textContent = '.crt.sb-reset, .crt.sb-reset * { scrollbar-width: none !important; }';
  document.head.append(style);
  new MutationObserver((changes) => {
    for (const c of changes) {
      const el = c.target as HTMLElement;
      if (!el.classList.contains('crt')) continue;
      el.classList.add('sb-reset');
      void el.offsetWidth;
      requestAnimationFrame(() => el.classList.remove('sb-reset'));
    }
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-mode', 'data-theme'] });
}
