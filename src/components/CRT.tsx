import type { ReactNode } from 'react';
import { usePrefs } from '../lib/prefs';

// Monitor shell: phosphor colour, scanlines, vignette and flicker live in CSS.
export default function CRT({ theme, alert, children }: { theme: 'uiu' | 'scip'; alert: boolean; children: ReactNode }) {
  const { light } = usePrefs();
  // light mode only applies to the SCiPnet theme; the UIU terminal stays amber
  return (
    <div className="crt" data-theme={theme} data-mode={light && theme === 'scip' ? 'light' : undefined} data-alert={alert || undefined}>
      <div className="screen">{children}</div>
    </div>
  );
}
