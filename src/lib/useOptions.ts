import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { OptionCategory, OptionItem } from '../types';
import { storage } from './storage';

export function useOptions(category: OptionCategory): OptionItem[] {
  const rows = useLiveQuery(() => db.options.where('category').equals(category).toArray(), [category]);
  return (rows ?? [])
    .map((r) => r.item)
    .sort((a, b) => b.usageCount - a.usageCount || a.order - b.order);
}

export function addOptionFactory(category: OptionCategory) {
  return (label: string) => storage.addOption(category, label);
}
