'use client';
import { Link } from '@/lib/router-compat';
import type { ProviderProfile } from '../api/client';
import { providerName, providerUserId, providerPhoto, categoryNames, PRICING_LABEL } from '../lib/format';
import { Avatar, Stars } from './ui';
import { IconShieldCheck, IconHeart, IconHeartFill, IconBriefcase } from './icons';

interface Props {
  provider: ProviderProfile;
  favorited?: boolean;
  onToggleFavorite?: (p: ProviderProfile) => void;
  showFullDescription?: boolean;
}

export default function ProviderCard({ provider, favorited, onToggleFavorite, showFullDescription = false }: Props) {
  const name = providerName(provider);
  const uid = providerUserId(provider);
  const cats = categoryNames(provider);
  const verified = provider.verificationStatus === 'approved';

  return (
    <div className={`card card-hover pcard${showFullDescription ? ' pcard-service-result' : ''}`}>
      <div className="pcard-top">
        <Avatar name={name} src={providerPhoto(provider)} size="md" />
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="pcard-name">
            <Link to={`/provider/${uid}`} style={{ color: 'inherit' }}>{name}</Link>
            {verified && <span className="verif" title="Verified provider"><IconShieldCheck /></span>}
          </div>
          <div className="pcard-rating">
            {provider.reviewCount > 0 ? (
              <>
                <Stars value={provider.ratingAverage} />
                <span className="rating-num">{provider.ratingAverage.toFixed(1)}</span>
                <span>({provider.reviewCount})</span>
              </>
            ) : (
              <span>New on Servio</span>
            )}
          </div>
        </div>
        {onToggleFavorite && (
          <button
            className={`fav-btn${favorited ? ' on' : ''}`}
            title={favorited ? 'Remove from saved' : 'Save provider'}
            onClick={(e) => { e.preventDefault(); onToggleFavorite(provider); }}
          >
            {favorited ? <IconHeartFill /> : <IconHeart />}
          </button>
        )}
      </div>

      <p className="pcard-desc">{provider.serviceDescription || 'This provider hasn’t added a description yet.'}</p>

      {cats.length > 0 && (
        <div className="pcard-cats">
          {cats.slice(0, 3).map((c) => <span key={c} className="tag">{c}</span>)}
          {cats.length > 3 && <span className="tag">+{cats.length - 3}</span>}
        </div>
      )}

      <div className="pcard-foot">
        <span className="pcard-meta">
          <IconBriefcase style={{ width: 14, height: 14 }} />
          {provider.yearsOfExperience > 0 ? `${provider.yearsOfExperience}y exp` : 'New'} · {PRICING_LABEL[provider.pricingModel]}
        </span>
        <Link to={`/provider/${uid}`} className="btn btn-soft btn-sm">View</Link>
      </div>
    </div>
  );
}
