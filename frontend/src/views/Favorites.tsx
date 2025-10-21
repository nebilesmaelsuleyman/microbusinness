'use client';
import { useState, useEffect } from 'react';
import { Link } from '@/lib/router-compat';
import { favoritesApi, type ProviderProfile } from '../api/client';
import { useToast } from '../contexts/ToastContext';
import ProviderCard from '../components/ProviderCard';
import { ProviderCardSkeleton, EmptyState } from '../components/ui';
import { IconHeart } from '../components/icons';

export default function Favorites() {
  const toast = useToast();
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = () => {
    favoritesApi.list()
      .then((favs) => {
        const list = favs
          .map((f) => (typeof f.providerId === 'object' ? f.providerId : null))
          .filter((p): p is ProviderProfile => !!p && !!p._id);
        setProviders(list);
      })
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (p: ProviderProfile) => {
    setRemoving(p._id);
    try {
      await favoritesApi.remove(p._id);
      setProviders((prev) => prev.filter((x) => x._id !== p._id));
      toast.success('Removed from saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not remove');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Saved providers</h1>
      <p className="page-sub">Providers you’ve bookmarked for later.</p>

      {loading ? (
        <div className="grid grid-providers">
          {Array.from({ length: 3 }).map((_, i) => <ProviderCardSkeleton key={i} />)}
        </div>
      ) : providers.length === 0 ? (
        <div className="card card-pad">
          <EmptyState icon={<IconHeart />} title="No saved providers yet">
            Tap the heart on any provider to save them here. <Link to="/">Browse providers</Link>.
          </EmptyState>
        </div>
      ) : (
        <div className="grid grid-providers">
          {providers.map((p) => (
            <ProviderCard
              key={p._id}
              provider={p}
              favorited={removing !== p._id}
              onToggleFavorite={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
