'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { config } from '@/lib/config';

interface ActivityMenuProps {
  activityId: string;
  athleteId: number;
}

const API_URL = config.apiUrl;

export default function ActivityMenu({
  activityId,
  athleteId,
}: ActivityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDelete = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete this activity? This action cannot be undone.'
      )
    ) {
      try {
        const response = await fetch(`${API_URL}/activity/${activityId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to delete activity.');
        }

        // On success, redirect to the athlete's profile page
        router.push(`/athlete/${athleteId}/profile`);
        router.refresh(); // Force a refresh to see the updated activity list
      } catch (error) {
        alert(
          `Error: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`
        );
      }
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-popover border border-border focus:outline-none"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1" role="none">
            <Link
              href={`/activity/${activityId}/edit`}
              className="text-popover-foreground block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              role="menuitem"
              key="edit"
            >
              Edit Activity
            </Link>
            <a
              href={`${API_URL}/activity/${activityId}/download`}
              className="text-popover-foreground block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              role="menuitem"
              download
              key="download"
            >
              Download (.fit)
            </a>
            <button
              onClick={handleDelete}
              className="w-full text-left text-destructive block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              role="menuitem"
              key="delete"
            >
              Delete Activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
