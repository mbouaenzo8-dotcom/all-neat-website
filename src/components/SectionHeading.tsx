import type { ReactNode } from 'react';

interface Props {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'light' | 'dark';
  /** id for the <h2>, so a section can use aria-labelledby. */
  id?: string;
  className?: string;
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  tone = 'light',
  id,
  className = '',
}: Props) {
  const dark = tone === 'dark';
  const alignClass = align === 'center' ? 'mx-auto items-center text-center' : 'items-start text-left';

  return (
    <div className={`flex max-w-2xl flex-col gap-4 ${alignClass} ${className}`}>
      {eyebrow && (
        <span
          className={`text-[13px] font-semibold uppercase tracking-[0.16em] ${
            dark ? 'text-teal-300' : 'text-teal-600'
          }`}
        >
          {eyebrow}
        </span>
      )}
      <h2
        id={id}
        className={`text-balance font-display text-[1.9rem] font-semibold leading-[1.08] sm:text-4xl lg:text-[2.7rem] ${
          dark ? 'text-white' : 'text-navy-900'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`text-pretty text-base leading-relaxed sm:text-[1.075rem] ${
            dark ? 'text-navy-100' : 'text-navy-500'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
