import type { ReactNode } from 'react';

// Monitor shell: phosphor colour, scanlines, vignette and flicker live in CSS.
export default function CRT({ theme, alert, children }: { theme: 'uiu' | 'scip'; alert: boolean; children: ReactNode }) {
  return (
    <div className="crt" data-theme={theme} data-alert={alert || undefined}>
      <div className="screen">{children}</div>
    </div>
  );
}
