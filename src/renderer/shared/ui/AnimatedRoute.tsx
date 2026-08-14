// AnimatedRoute — framer-motion fade/slide wrapper for route transitions.
// §2 of docs/05. Honors `prefers-reduced-motion`: when reduced, we fall back to
// a plain fade-only transition with the shortest duration (no slide + no scale).
import { motion, useReducedMotion } from 'framer-motion';
import { type HTMLAttributes, type ReactNode } from 'react';

import { cn } from './cn';

export interface AnimatedRouteProps extends HTMLAttributes<HTMLDivElement> {
  /** Trigger for the enter animation; default varies the key on location pathname. */
  routeKey?: string | number;
  children: ReactNode;
}

export function AnimatedRoute({ routeKey, className, children, ...props }: AnimatedRouteProps) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
      };

  return (
    <motion.div
      key={routeKey}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: prefersReduced ? 0.12 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn('min-h-0 flex-1', className)}
      {...(props as object)}
    >
      {children}
    </motion.div>
  );
}
