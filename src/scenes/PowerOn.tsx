import { useEffect, useRef } from 'react';
import { initAudio, play } from '../lib/sound';
import UiuLogo from '../components/UiuLogo';
import anthemUrl from '../../sounds/national_anthem.mp3';

export default function PowerOn({ onStart }: { onStart: () => void }) {
  const started = useRef(false);
  const start = () => {
    if (started.current) return;
    started.current = true;
    // First user gesture: browsers only allow audio after this.
    initAudio().then(() => play('enter', 0.8));
    onStart();
  };
  const startRef = useRef(start);
  startRef.current = start;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Enter' && startRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // National anthem under the seal. Browsers usually block sound before the
  // first gesture, so if autoplay fails it starts on the first click or key
  // instead. Fades out once the terminal powers on.
  useEffect(() => {
    const anthem = new Audio(anthemUrl);
    anthem.volume = 0.5;
    const tryPlay = () => void anthem.play().catch(() => {});
    tryPlay();
    const gestures = ['pointerdown', 'keydown'] as const;
    const onGesture = () => {
      if (anthem.paused) tryPlay();
      gestures.forEach((g) => window.removeEventListener(g, onGesture));
    };
    gestures.forEach((g) => window.addEventListener(g, onGesture));
    return () => {
      gestures.forEach((g) => window.removeEventListener(g, onGesture));
      const fade = setInterval(() => {
        anthem.volume = Math.max(0, anthem.volume - 0.05);
        if (anthem.volume === 0) {
          clearInterval(fade);
          anthem.pause();
        }
      }, 100);
    };
  }, []);

  return (
    <div className="power">
      <UiuLogo className="seal-intro" />
      <span className="power-title power-late">UIU FELDTERMINAL WS-07</span>
      <span className="power-late">
        <span className="blink">[ENTER] ZUM EINSCHALTEN</span>
      </span>
    </div>
  );
}
