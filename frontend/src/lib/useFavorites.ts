'use client';
import { useState, useEffect, useCallback } from 'react';
import { favoritesApi, type ProviderProfile } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

/** Manages the customer's saved-provider set (keyed by provider profile _id). */
export function useFavorites() {
  const { user } = useAuth();
  const toast = useToast();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  const isCustomer = user?.role === 'customer';

  useEffect(() => {
    if (!isCustomer) { setIds(new Set()); return; }
    favoritesApi.list()
      .then((favs) => {
        const s = new Set<string>();
        favs.forEach((f) => {
          const pid = typeof f.providerId === 'string' ? f.providerId : f.providerId?._id;
          if (pid) s.add(pid);
        });
        setIds(s);
      })
      .catch(() => { /* not critical */ });
  }, [isCustomer]);

  const toggle = useCallback(async (p: ProviderProfile) => {
    if (!isCustomer) { toast.error('Sign in as a customer to save providers'); return; }
    const id = p._id;
    setBusy(id);
    const has = ids.has(id);
    try {
      if (has) {
        await favoritesApi.remove(id);
        setIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        toast.success('Removed from saved');
      } else {
        await favoritesApi.add(id);
        setIds((prev) => new Set(prev).add(id));
        toast.success('Saved provider');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update saved list');
    } finally {
      setBusy(null);
    }
  }, [ids, isCustomer, toast]);

  return { ids, toggle, busy, enabled: isCustomer };
}
