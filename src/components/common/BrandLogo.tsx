import { useBusinessSettings } from '@/hooks/useStoreQueries';

interface BrandLogoProps {
  compact?: boolean;
  dark?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Official Abadikala "Jam Pasir Bunga" Logo Component
 * - Top Tulip: Muted Blush (#D9A9A3) — kelembutan, cinta, kehangatan
 * - Bottom Tulip: Forest Green (#1F3D2F) on light bg / Warm Ivory (#F6F1E7) on dark bg — keteguhan, kesegaran, keberlanjutan
 * - Wordmark: ABADIKALA uppercase wide tracking
 * Supports optional override via Admin -> Business Settings (logo_url).
 */
export function JamPasirBungaMark({
  dark = false,
  className = 'h-9 w-8',
}: {
  dark?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {/* Tulip Atas — Muted Blush #D9A9A3 */}
      <path
        d="M60 69C44 69 32 56 32 39C32 30 35 22 39 17C44 21 48 27 51 33C53 23 56 15 60 10C64 15 67 23 69 33C72 27 76 21 81 17C85 22 88 30 88 39C88 56 76 69 60 69Z"
        fill="#D9A9A3"
      />
      {/* Tulip Bawah — Forest Green #1F3D2F (atau Warm Ivory #F6F1E7 di atas latar gelap) */}
      <path
        d="M60 71C76 71 88 84 88 101C88 110 85 118 81 123C76 119 72 113 69 107C67 117 64 125 60 130C56 125 53 117 51 107C48 113 44 119 39 123C35 118 32 110 32 101C32 84 44 71 60 71Z"
        fill={dark ? '#F6F1E7' : '#1F3D2F'}
      />
    </svg>
  );
}

export function BrandLogo({ compact = false, dark = false, size = 'md' }: BrandLogoProps) {
  const { data: settings } = useBusinessSettings();
  const logoUrl = settings?.brand_identity?.logo_url?.trim();
  const shortName = (settings?.brand_identity?.short_name || 'ABADIKALA').toUpperCase();

  if (logoUrl) {
    return (
      <div className="flex items-center gap-2.5">
        <img
          src={logoUrl}
          alt={settings?.brand_identity?.business_name || 'Abadikala Fresh Flowers'}
          className="h-9 w-auto object-contain"
        />
        {!compact && (
          <div className="leading-tight">
            <span
              className={`block font-sans text-base font-medium tracking-[0.28em] ${
                dark ? 'text-[#F6F1E7]' : 'text-brand-forest'
              }`}
            >
              {shortName}
            </span>
            <span
              className={`mt-0.5 block text-[9px] font-medium uppercase tracking-[0.24em] ${
                dark ? 'text-[#D9A9A3]' : 'text-ink-secondary'
              }`}
            >
              Fresh Flowers
            </span>
          </div>
        )}
      </div>
    );
  }

  const markSizes = {
    sm: 'h-8 w-7',
    md: 'h-10 w-8',
    lg: 'h-14 w-12',
  };

  return (
    <div className="flex items-center gap-2.5">
      <JamPasirBungaMark dark={dark} className={markSizes[size]} />
      {!compact && (
        <div className="leading-tight">
          <span
            className={`block font-sans font-medium tracking-[0.28em] ${
              size === 'lg' ? 'text-xl' : 'text-[15px]'
            } ${dark ? 'text-[#F6F1E7]' : 'text-brand-forest'}`}
          >
            {shortName}
          </span>
          <span
            className={`mt-0.5 block text-[9px] font-medium uppercase tracking-[0.24em] ${
              dark ? 'text-[#D9A9A3]' : 'text-ink-secondary'
            }`}
          >
            Fresh Flowers
          </span>
        </div>
      )}
    </div>
  );
}
