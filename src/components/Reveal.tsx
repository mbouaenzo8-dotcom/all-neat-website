import type { CSSProperties, ReactNode } from 'react';
import { useReveal } from '../hooks/useReveal';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in milliseconds. */
  delay?: number;
  style?: CSSProperties;
}

/**
 * Thin wrapper that fades + lifts its children into view on scroll.
 * For semantic elements (section, article, li) use the useReveal() hook directly.
 */
export default function Reveal({ children, className = '', delay = 0, style }: RevealProps) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ ...style, ['--reveal-delay']: `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
