import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/vt323';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
// themed Group of Interest pages
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/800.css';
import './styles.css';
import { loadEntries } from './data/store';
import { blockInspect } from './lib/noInspect';
import { customCursor } from './lib/cursor';
import { repaintScrollbarsOnThemeChange } from './lib/scrollbars';

blockInspect();
customCursor();
repaintScrollbarsOnThemeChange();

// The archive comes from the database; the app is imported only afterwards,
// because some modules index the entries when they load.
const root = createRoot(document.getElementById('root')!);
loadEntries().then(async (error) => {
  if (error) {
    root.render(
      <div className="boot-error">
        <strong>SCiPnet</strong>
        <p>{error}</p>
        <button onClick={() => location.reload()}>Erneut versuchen</button>
      </div>,
    );
    return;
  }
  const { default: App } = await import('./App');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
