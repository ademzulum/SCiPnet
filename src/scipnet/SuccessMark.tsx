// Success animation: a ring draws itself, the check mark follows, then two
// pulses ripple outward. Used wherever access is granted.
export default function SuccessMark({ size = 110, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`success-mark ${className}`} style={{ width: size, height: size }} aria-hidden>
      <span className="success-ripple" />
      <span className="success-ripple r2" />
      <svg viewBox="0 0 52 52">
        <circle className="success-ring" cx="26" cy="26" r="24" />
        <path className="success-check" d="M15 27 l7.5 7.5 L37.5 18.5" />
      </svg>
    </span>
  );
}
