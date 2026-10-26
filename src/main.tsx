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
import App from './App';
import { blockInspect } from './lib/noInspect';
import { customCursor } from './lib/cursor';
import { repaintScrollbarsOnThemeChange } from './lib/scrollbars';

blockInspect();
customCursor();
repaintScrollbarsOnThemeChange();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
