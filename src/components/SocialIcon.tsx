import type { SocialPlatform } from '../lib/socialLinks';

// Small, dependency-free inline SVG icons (no icon package installed in this
// project) so Facebook / Instagram / TikTok / X / location links all get a
// recognizable glyph instead of plain text.
export default function SocialIcon({ platform, className = 'w-4 h-4' }: { platform: SocialPlatform; className?: string }) {
  switch (platform) {
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M13.5 21v-7.5h2.5l.5-3H13.5V8.5c0-.9.25-1.5 1.55-1.5H16.6V4.35C16.3 4.3 15.3 4.2 14.2 4.2c-2.3 0-3.9 1.4-3.9 4v2.3H7.8v3h2.5V21h3.2z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M16.6 3c.4 2.3 1.9 3.9 4.4 4.1v3c-1.6 0-3-.5-4.4-1.5v6.6c0 3.4-2.4 5.8-5.5 5.8-3.1 0-5.6-2.4-5.6-5.6 0-3.1 2.4-5.6 5.4-5.6.3 0 .6 0 .9.1v3.1a2.5 2.5 0 1 0 1.8 2.4V3h3z" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M4 3h3.6l4 5.4L16.2 3H20l-6.4 8.2L20.4 21h-3.6l-4.4-5.9L7 21H3.2l6.8-8.7L4 3z" />
        </svg>
      );
    case 'location':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <path d="M12 21s7-6.1 7-11.5S16 3 12 3 5 4.6 5 9.5 12 21 12 21z" />
          <circle cx="12" cy="9.5" r="2.4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
          <path d="M9.5 14.5 14.5 9.5" />
          <path d="M11 6.5 12.3 5.2a3.5 3.5 0 0 1 5 5L16 11.5" />
          <path d="M13 17.5 11.7 18.8a3.5 3.5 0 0 1-5-5L8 12.5" />
        </svg>
      );
  }
}
