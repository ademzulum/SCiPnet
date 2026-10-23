import { useEffect, useState } from 'react';
import { play } from './lib/sound';
import { savedSession } from './lib/persist';
import { resetSessionState } from './scipnet/session';
import { AnimatePresence, motion } from 'motion/react';
import CRT from './components/CRT';
import PowerOn from './scenes/PowerOn';
import Breach from './scenes/Breach';
import Login from './scenes/Login';
import Startup from './scenes/Startup';
import Shell from './scipnet/Shell';

type Stage = 'off' | 'breach' | 'login' | 'startup' | 'session';

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.35 },
};

export default function App() {
  // A login from the last 15 minutes skips straight back into SCiPnet.
  const [stage, setStage] = useState<Stage>(() => (savedSession.active() ? 'session' : 'off'));
  const [fresh, setFresh] = useState(false); // true right after a real login
  const [alert, setAlert] = useState(false);

  // Click sound for every enabled button, unless it opts out with data-sound="none".
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const btn = (e.target as Element).closest('button');
      if (btn && !btn.disabled && btn.dataset.sound !== 'none') play('click', 0.5);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, []);

  return (
    <CRT theme={stage === 'login' || stage === 'startup' || stage === 'session' ? 'scip' : 'uiu'} alert={alert}>
      <AnimatePresence mode="wait">
        {stage === 'off' && (
          <motion.div key="off" className="fill" {...fade}>
            <PowerOn onStart={() => setStage('breach')} />
          </motion.div>
        )}
        {stage === 'breach' && (
          <motion.div
            key="breach"
            className="fill"
            initial={{ scaleY: 0.004, scaleX: 0, filter: 'brightness(4)' }}
            animate={{ scaleY: [0.004, 0.004, 1], scaleX: [0, 1, 1], filter: 'brightness(1)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, times: [0, 0.4, 1], ease: 'easeOut' }}
          >
            <Breach
              onAlert={setAlert}
              onDone={() => {
                setAlert(false);
                setStage('login');
              }}
            />
          </motion.div>
        )}
        {stage === 'login' && (
          <motion.div key="login" className="fill" {...fade}>
            <Login onSuccess={() => setStage('startup')} />
          </motion.div>
        )}
        {stage === 'startup' && (
          <motion.div key="startup" className="fill" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Startup
              onDone={() => {
                resetSessionState();
                savedSession.start();
                setFresh(true);
                setStage('session');
              }}
            />
          </motion.div>
        )}
        {stage === 'session' && (
          <motion.div key="session" className="fill" {...fade}>
            <Shell
              fresh={fresh}
              onLogout={() => {
                savedSession.end();
                resetSessionState();
                setFresh(false);
                setStage('off');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </CRT>
  );
}
