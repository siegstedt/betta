'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { config } from '@/lib/config';
import { Input } from '@/components/ui';
import { FormField, FormError } from '@/components/forms';

const API_URL = config.apiUrl;

export default function NewAthletePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for the profile form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dob || null,
    };

    try {
      const response = await fetch(`${API_URL}/athlete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create profile.');
      }

      // On success, redirect to the homepage to see the new athlete tile
      router.push('/');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-card-foreground">
          Create New Athlete
        </h1>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <FormField label="First Name" required>
            <Input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="mt-1"
            />
          </FormField>
          <FormField label="Last Name" required>
            <Input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="mt-1"
            />
          </FormField>
          <FormField label="Date of Birth">
            <Input
              type="date"
              id="dob"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="mt-1"
            />
          </FormField>
          {error && <FormError>{error}</FormError>}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Athlete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
