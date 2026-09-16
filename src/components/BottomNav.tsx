import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Kalendarz', icon: '📅' },
  { to: '/statystyki', label: 'Statystyki', icon: '📊' },
  { to: '/ustawienia', label: 'Ustawienia', icon: '⚙️' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur dark:border-stone-700 dark:bg-stone-800/95">
      <ul className="mx-auto flex max-w-md justify-around">
        {items.map((it) => (
          <li key={it.to} className="flex-1">
            <NavLink
              to={it.to}
              end={it.to === '/'}
              className={({ isActive }) =>
                `flex min-h-touch flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium ${
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-stone-500 dark:text-stone-400'
                }`
              }
            >
              <span aria-hidden className="text-lg">{it.icon}</span>
              <span>{it.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
