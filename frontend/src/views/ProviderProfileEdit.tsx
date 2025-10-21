'use client';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@/lib/router-compat';
import {
  providersApi, categoriesApi,
  type Category, type ProviderProfile, type VerificationDocument,
  type PricingModel, type ProviderProfileInput,
} from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { VERIFICATION_META } from '../lib/format';
import { Field, PageLoader } from '../components/ui';
import {
  IconCheck, IconMapPin, IconShieldCheck, IconUpload, IconDoc, IconArrowRight, IconAlert,
} from '../components/icons';

const PRICING: { value: PricingModel; label: string }[] = [
  { value: 'fixed', label: 'Fixed price' },
  { value: 'hourly', label: 'Hourly rate' },
  { value: 'quote', label: 'Custom quote' },
];

export default function ProviderProfileEdit() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<ProviderProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [docs, setDocs] = useState<VerificationDocument[]>([]);

  // form state
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [description, setDescription] = useState('');
  const [experience, setExperience] = useState('');
  const [radius, setRadius] = useState('10');
  const [pricing, setPricing] = useState<PricingModel>('quote');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  // doc upload
  const [docType, setDocType] = useState('id_card');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      categoriesApi.list().then(setCategories).catch(() => setCategories([])),
      providersApi.getMyProfile().then((p) => {
        if (p) {
          setExisting(p);
          const ids = (Array.isArray(p.serviceCategories) ? p.serviceCategories : [])
            .map((c) => (typeof c === 'string' ? c : c._id));
          setSelectedCats(new Set(ids));
          setDescription(p.serviceDescription || '');
          setExperience(String(p.yearsOfExperience ?? ''));
          setRadius(String(p.serviceRadiusKm ?? 10));
          setPricing(p.pricingModel || 'quote');
        }
      }),
      providersApi.myDocuments().then(setDocs).catch(() => setDocs([])),
    ]).finally(() => setLoading(false));
  }, []);

  const toggleCat = (id: string) => {
    setSelectedCats((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); toast.success('Location captured'); },
      () => { setLocating(false); toast.error('Could not get location'); },
    );
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body: ProviderProfileInput = {
      serviceCategories: Array.from(selectedCats),
      serviceDescription: description.trim(),
      yearsOfExperience: experience ? Number(experience) : 0,
      serviceRadiusKm: radius ? Number(radius) : 10,
      pricingModel: pricing,
    };
    if (coords) { body.latitude = coords.lat; body.longitude = coords.lng; }
    try {
      const saved = existing ? await providersApi.updateProfile(body) : await providersApi.createProfile(body);
      setExisting(saved);
      toast.success(existing ? 'Profile updated' : 'Profile created!');
      if (!existing) navigate('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const uploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) { toast.error('Choose a file to upload'); return; }
    setUploading(true);
    try {
      const doc = await providersApi.uploadDocumentFile(docFile, docType);
      setDocs((prev) => [doc, ...prev]);
      setDocFile(null);
      toast.success('Document submitted for review');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="page"><PageLoader /></div>;

  return (
    <div className="page-narrow">
      <Link to="/dashboard" className="btn-link small">← Back to dashboard</Link>
      <h1 className="page-title mt-8">{existing ? 'Edit your profile' : 'Create your provider profile'}</h1>
      <p className="page-sub">Tell customers what you offer. Fields marked optional can be filled later.</p>

      {/* Profile form */}
      <form className="card card-pad" onSubmit={save}>
        <Field label="Services you offer" hint="Select all categories that apply.">
          <div className="checkbox-grid">
            {categories.map((c) => {
              const on = selectedCats.has(c._id);
              return (
                <div key={c._id} className={`check-card${on ? ' sel' : ''}`} onClick={() => toggleCat(c._id)}>
                  <span className="tick">{on && <IconCheck />}</span>
                  {c.name}
                </div>
              );
            })}
            {categories.length === 0 && <p className="muted small">No categories available yet.</p>}
          </div>
        </Field>

        <Field label="Service description" hint="Describe your experience, specialties, and what makes you stand out." htmlFor="desc">
          <textarea id="desc" className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="e.g. Licensed plumber with 8 years of experience in residential repairs and installations." />
        </Field>

        <div className="grid grid-2">
          <Field label="Years of experience" htmlFor="exp">
            <input id="exp" className="input" type="number" min={0} max={50} value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="0" />
          </Field>
          <Field label="Service radius (km)" hint="How far you’re willing to travel." htmlFor="rad">
            <input id="rad" className="input" type="number" min={1} max={500} value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="10" />
          </Field>
        </div>

        <Field label="Pricing model">
          <div className="segmented">
            {PRICING.map((p) => (
              <button key={p.value} type="button" className={pricing === p.value ? 'on' : ''} onClick={() => setPricing(p.value)}>{p.label}</button>
            ))}
          </div>
        </Field>

        <Field label="Base location" hint="Used to match you with nearby customers in distance searches.">
          <button type="button" className={`btn ${coords ? 'btn-soft' : 'btn-ghost'}`} onClick={useMyLocation} disabled={locating}>
            <IconMapPin /> {locating ? 'Locating…' : coords ? `Captured (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})` : existing?.coordinates ? 'Update my location' : 'Use my current location'}
          </button>
        </Field>

        <button className="btn btn-primary btn-block btn-lg" disabled={saving}>
          {saving ? 'Saving…' : existing ? 'Save changes' : <>Create profile <IconArrowRight /></>}
        </button>
      </form>

      {/* Verification documents */}
      {existing && (
        <div className="card card-pad mt-24">
          <div className="section-head" style={{ marginBottom: 6 }}>
            <h2><IconShieldCheck style={{ width: 18, height: 18, verticalAlign: -3, color: 'var(--success)' }} /> Verification</h2>
            <span className={`badge ${VERIFICATION_META[existing.verificationStatus].cls}`}>{VERIFICATION_META[existing.verificationStatus].label}</span>
          </div>

          {existing.verificationStatus !== 'approved' && (
            <div className="banner banner-info mb-16">
              <IconAlert />
              <div className="small">Upload an ID or license so an admin can verify you. You’ll only appear in search once approved.</div>
            </div>
          )}

          <form className="row gap-8 wrap" onSubmit={uploadDoc} style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ marginBottom: 0, width: 170 }}>
              <label>Document type</label>
              <select className="select" value={docType} onChange={(e) => setDocType(e.target.value)}>
                <option value="id_card">ID card</option>
                <option value="passport">Passport</option>
                <option value="business_license">Business license</option>
                <option value="certification">Certification</option>
              </select>
            </div>
            <div className="field grow" style={{ marginBottom: 0, minWidth: 200 }}>
              <label>Document file</label>
              <input
                className="input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
              />
              <div className="tiny muted mt-4">Image or PDF, up to 5 MB.</div>
            </div>
            <button className="btn btn-dark" disabled={uploading}><IconUpload /> {uploading ? 'Uploading…' : 'Submit'}</button>
          </form>

          {docs.length > 0 && (
            <div className="mt-16">
              {docs.map((d) => (
                <div key={d._id} className="list-row">
                  <span className="empty-icon" style={{ margin: 0, width: 38, height: 38 }}><IconDoc /></span>
                  <div className="lr-main">
                    <div className="lr-title" style={{ textTransform: 'capitalize' }}>{d.documentType.replace(/_/g, ' ')}</div>
                    <div className="lr-sub"><a href={d.documentUrl} target="_blank" rel="noreferrer">{d.documentUrl.slice(0, 44)}…</a></div>
                  </div>
                  <span className={`badge ${VERIFICATION_META[d.status].cls}`}>{VERIFICATION_META[d.status].label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
