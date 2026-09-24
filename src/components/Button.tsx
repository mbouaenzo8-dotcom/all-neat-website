import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold leading-none transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

// Single locked accent (teal) for the primary CTA; navy for secondary.
const variants: Record<Variant, string> = {
  primary: 'bg-teal-600 text-white shadow-soft hover:bg-teal-700 hover:shadow-card',
  secondary: 'bg-navy-800 text-white shadow-soft hover:bg-navy-700',
  ghost: 'border border-navy-200 bg-white/70 text-navy-800 hover:border-teal-500 hover:text-teal-700',
};

interface CommonProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsAnchor = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type Props = ButtonAsButton | ButtonAsAnchor;

export default function Button({ variant = 'primary', children, className = '', ...props }: Props) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if ('href' in props && props.href) {
    return (
      <a className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
