'use client';
import { useState, useEffect } from 'react';
import { usersApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Avatar, Field, PageLoader } from '../components/ui';
import { IconMapPin, IconCheck } from '../components/icons';

export default function Account() {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersApi.me()
      .then((u) => {
        setName(u.name || '');
        setPhoto(u.profilePhoto || '');
        if (u.location) { setHasLocation(true); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setHasLocation(true); setLocating(false); toast.success('Location captured'); },
      () => { setLocating(false); toast.error('Could not get location'); },
    );
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: { name?: string; profilePhoto?: string; location?: { latitude: number; longitude: number } } = {
        name: name.trim(),
        profilePhoto: photo.trim() || undefined,
      };
      if (coords) body.location = { latitude: coords.lat, longitude: coords.lng };
      const updated = await usersApi.updateMe(body);
      if (user) setUser({ ...user, name: updated.name, profilePhoto: updated.profilePhoto, location: updated.location });
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page"><PageLoader /></div>;

  return (
    <div className="page-narrow">
      <h1 className="page-title">Account settings</h1>
      <p className="page-sub">Manage your personal details.</p>

      <form className="card card-pad" onSubmit={save}>
        <div className="row gap-16 mb-24">
          <Avatar name={name || 'U'} src={photo || null} size="lg" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{name || 'Your name'}</div>
            <div className="muted small" style={{ textTransform: 'capitalize' }}>{user?.role} · {user?.phoneNumber}</div>
          </div>
        </div>

        <Field label="Full name" htmlFor="name">
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </Field>

        <Field label="Profile photo URL" hint="Paste a link to an image." htmlFor="photo">
          <input id="photo" className="input" value={photo} onChange={(e) => setPhoto(e.target.value)} placeholder="https://…" />
        </Field>

        <Field label="Location" hint="Used to find nearby providers and match you locally.">
          <button type="button" className={`btn ${coords ? 'btn-soft' : 'btn-ghost'}`} onClick={useMyLocation} disabled={locating}>
            {coords ? <IconCheck /> : <IconMapPin />}
            {locating ? 'Locating…' : coords ? `Captured (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})` : hasLocation ? 'Update my location' : 'Use my current location'}
          </button>
        </Field>

        <button className="btn btn-primary btn-lg" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </form>
    </div>
  );
}
