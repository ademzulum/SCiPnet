import { motion } from 'motion/react';
import ScpLogo from '../components/ScpLogo';
import { STOLEN } from '../lib/creds';

// Placeholder for the SCiPnet interior.
export default function Session() {
  return (
    <div className="scip">
      <ScpLogo size={64} />
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        WILLKOMMEN, {STOLEN.name.toUpperCase()}
      </motion.h2>
      <p className="motto">
        FREIGABESTUFE {STOLEN.clearance} · {STOLEN.site.toUpperCase()}
      </p>
      <p className="legal">SCiPnet-Innenbereich im Aufbau.</p>
    </div>
  );
}
