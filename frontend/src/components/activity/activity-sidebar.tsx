'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity } from '@/lib/definitions';

interface ActivitySidebarProps {
  activity: Activity;
}

const navItems = [
  { id: 'overview', name: 'Overview', href: '/overview', icon: '📊' },
  { id: 'laps', name: 'Laps', href: '/laps', icon: '🏁' },
  {
    id: 'best_efforts',
    name: 'Best Efforts',
    href: '/best_efforts',
    icon: '🏆',
  },
  { id: 'zones', name: 'Zones', href: '/zones', icon: '📈' },
  { id: 'power', name: 'Power', href: '/power', icon: '⚡' },
];

export default function ActivitySidebar({ activity }: ActivitySidebarProps) {
  const pathname = usePathname();
  return (
    <aside className="flex flex-col w-64 bg-card text-card-foreground h-screen border-r flex-shrink-0">
      <nav className="flex-grow p-4">
        <ul>
          {navItems.map((item) => {
            const href = `/activity/${activity.activity_id}${item.href}`;
            const isActive = pathname === href;
            return (
              <li key={item.id}>
                <Link
                  href={href}
                  className={`w-full flex items-center p-2 my-1 rounded-md text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
