import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import CRT from './components/CRT';
import PowerOn from './scenes/PowerOn';
import Breach from './scenes/Breach';
import Login from './scenes/Login';
import Session from './scenes/Session';

type Stage = 'off' | 'breach' | 'login' | 'session';

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.35 },
};

export default function App() {
  const [stage, setStage] = useState<Stage>('off');
  const [alert, setAlert] = useState(false);

  return (
    <CRT theme={stage === 'login' || stage === 'session' ? 'scip' : 'uiu'} alert={alert}>
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
            <Login onSuccess={() => setStage('session')} />
          </motion.div>
        )}
        {stage === 'session' && (
          <motion.div key="session" className="fill" {...fade}>
            <Session />
          </motion.div>
        )}
      </AnimatePresence>
    </CRT>
  );
}
