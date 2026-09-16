import { useState, type ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function CollapsibleSection({ title, subtitle, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="card">
      <button
        type="button"
        className="flex min-h-touch w-full items-center justify-between gap-2 px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>
          <span className="block font-semibold">{title}</span>
          {subtitle && <span className="block text-sm text-stone-500 dark:text-stone-400">{subtitle}</span>}
        </span>
        <span aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          ⌄
        </span>
      </button>
      {open && <div className="border-t border-stone-100 px-4 py-3 dark:border-stone-700">{children}</div>}
    </section>
  );
}
