'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Equipment } from '@/lib/definitions';
import { config } from '@/lib/config';
import { Input, Textarea } from '@/components/ui';
import { FormField, FormError, FormSelect } from '@/components/forms';

const API_URL = config.apiUrl;
const EQUIPMENT_TYPES = ['bike', 'shoes', 'trainer', 'device'];

export default function EditEquipmentPage() {
  const router = useRouter();
  const params = useParams();
  const athleteId = params.id as string;
  const equipmentId = params.equipmentId as string;
  const isNew = equipmentId === 'new';

  // Form state
  const [name, setName] = useState('');
  const [equipmentType, setEquipmentType] = useState('bike');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [weight, setWeight] = useState<number | string>('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isNew || !equipmentId) return;

    const fetchEquipment = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/equipment/${equipmentId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch equipment data.');
        }
        const data: Equipment = await response.json();
        setName(data.name);
        setEquipmentType(data.equipment_type);
        setBrand(data.brand || '');
        setModel(data.model || '');
        setWeight(data.weight || '');
        setNotes(data.notes || '');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [equipmentId, isNew]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const url = isNew
      ? `${API_URL}/athlete/${athleteId}/equipment`
      : `${API_URL}/equipment/${equipmentId}`;

    const method = isNew ? 'POST' : 'PUT';

    const payload = {
      name,
      equipment_type: equipmentType,
      brand: brand || null,
      model: model || null,
      weight: weight ? parseFloat(String(weight)) : null,
      notes: notes || null,
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save equipment.');
      }

      // On success, redirect back to the equipment list
      router.push(`/athlete/${athleteId}/equipment`);
      router.refresh(); // Force a refresh to show the new/updated item
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading equipment...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-card-foreground">
            {isNew ? 'Add New Gear' : 'Edit Gear'}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Name" required>
              <Input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., Road Bike, Daily Trainers"
              />
            </FormField>

            <FormSelect
              label="Type"
              value={equipmentType}
              onValueChange={setEquipmentType}
              options={EQUIPMENT_TYPES.map((type) => ({
                value: type,
                label: type.charAt(0).toUpperCase() + type.slice(1),
              }))}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Brand">
                <Input
                  type="text"
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </FormField>
              <FormField label="Model">
                <Input
                  type="text"
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </FormField>
            </div>

            {equipmentType === 'bike' && (
              <FormField label="Weight (kg)">
                <Input
                  type="number"
                  step="0.1"
                  id="weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </FormField>
            )}

            <FormField label="Notes">
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </FormField>

            {error && <FormError>{error}</FormError>}

            <div className="flex items-center justify-between pt-4">
              <Link
                href={`/athlete/${athleteId}/equipment`}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Gear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
