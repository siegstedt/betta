'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from './button';

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const { setTheme, theme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant={theme === 'light' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setTheme('light')}
        className="h-8 w-8 p-0"
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only">Light mode</span>
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setTheme('dark')}
        className="h-8 w-8 p-0"
      >
        <Moon className="h-4 w-4" />
        <span className="sr-only">Dark mode</span>
      </Button>
      <Button
        variant={theme === 'system' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setTheme('system')}
        className="h-8 w-8 p-0"
      >
        <Monitor className="h-4 w-4" />
        <span className="sr-only">System mode</span>
      </Button>
    </div>
  );
}
