// Shared animation for cards in a filterable list (archive, field reports,
// personnel, and any list added later): spread onto a motion element inside
// <AnimatePresence mode="popLayout" initial={false}>, in a grid with
// position: relative (.filter-grid). The cards' CSS must not transition or set
// transform, motion owns it (layout moves and the hover lift).
export const FILTER_CARD = {
  layout: true,
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { duration: 0.25, ease: [0.25, 0.8, 0.25, 1] },
  whileHover: { y: -2 },
} as const;
