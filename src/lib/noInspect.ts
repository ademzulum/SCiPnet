// Keeps casual visitors out of the browser tools: no context menu, and the
// usual DevTools / view-source shortcuts do nothing. This is a deterrent only;
// anyone can still open the tools from the browser menu.
export function blockInspect() {
  window.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener(
    'keydown',
    (e) => {
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      const blocked =
        e.key === 'F12' ||
        (mod && e.shiftKey && ['i', 'j', 'c', 'k'].includes(k)) || // DevTools, console, inspector
        (mod && e.altKey && ['i', 'j', 'c', 'u'].includes(k)) || // the same on macOS
        (mod && !e.shiftKey && k === 'u'); // view source
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );
}
