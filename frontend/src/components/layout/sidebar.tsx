'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  athleteId: string;
}

type MenuItem = {
  name: string;
  href: string;
  icon: string;
};

const navItems: MenuItem[] = [
  { name: 'Profile', href: '/profile', icon: '👤' },
  { name: 'Activity Log', href: '/activities', icon: '🗒️' },
  { name: 'Calendar', href: '/calendar', icon: '📅' },
  { name: 'Goals', href: '/goals', icon: '🎯' },
  { name: 'Performance', href: '/performance', icon: '📈' },
  { name: 'Equipment', href: `/equipment`, icon: '🔧' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Sidebar({ athleteId }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 bg-card text-card-foreground h-screen border-r flex-shrink-0">
      <nav className="flex-grow p-4">
        <ul>
          {navItems.map((item) => {
            const href = `/athlete/${athleteId}${item.href}`;
            const isActive = pathname === href;
            return (
              <li key={item.name}>
                <Link
                  href={href}
                  className={`w-full flex items-center p-2 my-1 rounded-md text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t">
        <Link
          href="/"
          className="block text-sm text-primary hover:underline text-center"
        >
          &larr; Back to Roster
        </Link>
      </div>
    </aside>
  );
}
