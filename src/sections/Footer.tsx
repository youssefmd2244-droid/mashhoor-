import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useDirection } from '../hooks/useDirection';
import { getSiteIdentity, type SiteIdentity } from '../lib/site';
import { getComplaintNumbers, type ComplaintNumber } from '../lib/complaints';
import { getSiteText, type TextOverride } from '../lib/siteTexts';
import { getSocialLinks, visibleSocialLinks, type SocialLink } from '../lib/socialLinks';
import { getIconCodeSettings, getIconCodeFlags, type IconCodeSettings, type IconCodeFlag } from '../lib/iconCode';
import SocialIcon from '../components/SocialIcon';
import BrandBadge from '../components/BrandBadge';
import FlagStrip from '../components/FlagStrip';

export default function Footer() {
  const { dir } = useDirection();
  const isRTL = dir === 'rtl';
  const [identity, setIdentity] = useState<SiteIdentity>({ nameAr: 'مشهور', nameEn: 'Mashhoor' });
  const [complaintNumbers, setComplaintNumbers] = useState<ComplaintNumber[]>([]);
  const [socialLinks, setSocialLinksState] = useState<SocialLink[]>([]);
  const [tagline, setTagline] = useState<TextOverride>({
    ar: 'تجربة طعام تتجاوز التوقعات — من المطبخ إلى مائدتك',
    en: 'A dining experience beyond expectations — from kitchen to your table',
  });
  const [newsletterTitle, setNewsletterTitle] = useState<TextOverride | null>(null);
  useEffect(() => {
    getSiteText('footer.newsletterTitle', '', '').then(setNewsletterTitle);
  }, []);
  const [col1, setCol1] = useState<TextOverride>({
    ar: 'الرئيسية|القائمة،الفروع،الحجوزات،الوظائف',
    en: 'Main|Menu,Locations,Reservations,Careers',
  });
  const [col2, setCol2] = useState<TextOverride>({
    ar: 'خدمات|التوصيل،الطلبات الخاصة،الهدايا،العضوية',
    en: 'Services|Delivery,Catering,Gift Cards,Membership',
  });
  const [col3, setCol3] = useState<TextOverride>({
    ar: 'المزيد|من نحن،المدونة،الخصوصية،الشروط',
    en: 'More|About,Journal,Privacy,Terms',
  });
  const [connectLabel, setConnectLabel] = useState<TextOverride>({ ar: 'تواصل', en: 'Connect' });
  const [newsletterSub, setNewsletterSub] = useState<TextOverride>({
    ar: 'احصل على عروض حصرية ووصفات جديدة كل أسبوع',
    en: 'Get exclusive offers and new recipes every week',
  });
  const [emailPlaceholder, setEmailPlaceholder] = useState<TextOverride>({ ar: 'بريدك الإلكتروني', en: 'your@email.com' });
  const [joinButton, setJoinButton] = useState<TextOverride>({ ar: 'اشترك', en: 'Join' });
  const [copyrightText, setCopyrightText] = useState<TextOverride>({ ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' });
  const [madeWith, setMadeWith] = useState<TextOverride>({ ar: 'صُنع بـ ❤️', en: 'Made with ❤️' });
  const [complaintsLabel, setComplaintsLabel] = useState<TextOverride>({
    ar: 'الشكاوي وخدمة العملاء',
    en: 'Complaints & customer support',
  });
  useEffect(() => {
    getSiteText('footer.column1', col1.ar, col1.en).then(setCol1);
    getSiteText('footer.column2', col2.ar, col2.en).then(setCol2);
    getSiteText('footer.column3', col3.ar, col3.en).then(setCol3);
    getSiteText('footer.connectLabel', connectLabel.ar, connectLabel.en).then(setConnectLabel);
    getSiteText('footer.newsletterSubtitle', newsletterSub.ar, newsletterSub.en).then(setNewsletterSub);
    getSiteText('footer.emailPlaceholder', emailPlaceholder.ar, emailPlaceholder.en).then(setEmailPlaceholder);
    getSiteText('footer.joinButton', joinButton.ar, joinButton.en).then(setJoinButton);
    getSiteText('footer.copyrightText', copyrightText.ar, copyrightText.en).then(setCopyrightText);
    getSiteText('footer.madeWith', madeWith.ar, madeWith.en).then(setMadeWith);
    getSiteText('footer.complaintsLabel', complaintsLabel.ar, complaintsLabel.en).then(setComplaintsLabel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Column format is "Title|link1,link2,link3" — kept as one editable text
  // field per column (Settings → كل نصوص الموقع) so the admin can rename or
  // reorder the footer links without a code change, same as any other slot.
  function parseFooterColumn(raw: string): { title: string; links: string[] } {
    const [title, linksPart] = raw.split('|');
    const links = (linksPart ?? '')
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return { title: title?.trim() ?? '', links };
  }
  const [iconCode, setIconCode] = useState<IconCodeSettings | null>(null);
  const [iconCodeFlags, setIconCodeFlags] = useState<IconCodeFlag[]>([]);
  useEffect(() => {
    getSiteIdentity().then(setIdentity);
    getComplaintNumbers().then(setComplaintNumbers);
    getSiteText('footer.tagline', tagline.ar, tagline.en).then(setTagline);
    getSocialLinks().then(setSocialLinksState);
    getIconCodeSettings().then(setIconCode);
    getIconCodeFlags().then(setIconCodeFlags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const displayName = isRTL ? identity.nameAr : identity.nameEn;
  const activeSocialLinks = visibleSocialLinks(socialLinks);

  return (
    <footer dir={dir} className="relative bg-[#0a0a0a] text-white overflow-hidden">
      {/* Top wave */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#EEC31C]/50 to-transparent" />

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-20 lg:py-32">
        {/* Big logo */}
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.65, 0, 0.35, 1] }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-[13vw] lg:text-[10.5rem] font-black italic leading-[0.85] tracking-tighter">
            <span className="text-white">M</span>
            <span className="text-[#EEC31C]">a</span>
            <span className="text-white">s</span>
            <span className="text-[#EEC31C]">h</span>
            <span className="text-white">h</span>
            <span className="text-[#EEC31C]">o</span>
            <span className="text-white">o</span>
            <span className="text-[#EEC31C]">r</span>
            <span className="text-white">.</span>
          </h2>
          <p
            className="text-sm lg:text-base text-white/60 mt-4 max-w-md mx-auto font-light"
            style={tagline.color ? { color: tagline.color } : undefined}
          >
            {isRTL ? tagline.ar : tagline.en}
          </p>
        </motion.div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-16">
          {[col1, col2, col3].map((colText, i) => {
            const col = parseFooterColumn(isRTL ? colText.ar : colText.en);
            return (
            <motion.div
              key={i}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <h3 className="text-[#EEC31C] text-xs uppercase tracking-[0.3em] font-bold mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-white/70 text-sm hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
            );
          })}

          {/* Connect — driven by Settings → السوشيال والموقع. Only shows
              platforms the admin has turned on and filled a real URL for. */}
          {activeSocialLinks.length > 0 && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <h3 className="text-[#EEC31C] text-xs uppercase tracking-[0.3em] font-bold mb-4">
                {isRTL ? connectLabel.ar : connectLabel.en}
              </h3>
              <ul className="space-y-2">
                {activeSocialLinks.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-white/70 text-sm hover:text-white transition-colors"
                    >
                      <SocialIcon platform={link.platform} className="w-3.5 h-3.5 shrink-0" />
                      <span>{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* Quick icon row — the same links as above, as tappable badges.
            Configured in Settings → السوشيال والموقع. */}
        {activeSocialLinks.length > 0 && (
          <div className="flex items-center justify-center gap-3 mb-16">
            {activeSocialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                title={link.label}
                aria-label={link.label}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-[#EEC31C] hover:border-[#EEC31C]/50 transition-colors"
              >
                <SocialIcon platform={link.platform} className="w-[18px] h-[18px]" />
              </a>
            ))}
          </div>
        )}

        {/* Newsletter */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6 lg:p-10 mb-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-2xl lg:text-3xl font-display font-black italic mb-2">
                {newsletterTitle && (isRTL ? newsletterTitle.ar : newsletterTitle.en)
                  ? isRTL ? newsletterTitle.ar : newsletterTitle.en
                  : isRTL ? `انضم لعائلة ${displayName}` : `Join the ${displayName} family`}
              </h3>
              <p className="text-white/60 text-sm">
                {isRTL ? newsletterSub.ar : newsletterSub.en}
              </p>
            </div>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder={isRTL ? emailPlaceholder.ar : emailPlaceholder.en}
                className="flex-1 bg-white/10 border border-white/20 rounded-full px-5 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#EEC31C]"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[#EEC31C] text-[#750001] rounded-full px-6 py-3 font-bold text-sm uppercase tracking-widest"
                type="submit"
              >
                {isRTL ? joinButton.ar : joinButton.en}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10 text-white/40 text-xs mb-10">
          <div>© 2026 {displayName}. {isRTL ? copyrightText.ar : copyrightText.en}.</div>
          <div className="flex items-center gap-4">
            <span>{isRTL ? madeWith.ar : madeWith.en}</span>
            <span className="hidden md:inline">·</span>
            <span>v2.4.0</span>
          </div>
        </div>

        {/* Complaints / customer support numbers — configured from Settings → الشكاوي */}
        {complaintNumbers.length > 0 && (
          <div className="border-t border-white/10 pt-10 mb-10">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
              {isRTL ? complaintsLabel.ar : complaintsLabel.en}
            </p>
            <div className="flex flex-wrap gap-3">
              {complaintNumbers.map((c) => (
                <div key={c.id} className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-2 text-xs">
                  <span className="text-white/70">
                    {isRTL ? c.labelAr : c.labelEn}: <span dir="ltr">{c.phone}</span>
                  </span>
                  <a href={`tel:+${c.phone}`} className="text-[#EEC31C] hover:underline" aria-label="call">
                    📞
                  </a>
                  {c.whatsapp && (
                    <a
                      href={`https://wa.me/${c.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline"
                      aria-label="whatsapp"
                    >
                      🟢
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Designed & developed by — Icon Code (editable only from Settings → Icon Code, password-gated) */}
        {iconCode && (
          <div className="border-t border-white/10 pt-10 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-4">
              {iconCode.logoUrl ? (
                <img src={iconCode.logoUrl} alt={iconCode.brandText} className="w-[78px] h-[78px] rounded-full object-cover" />
              ) : (
                <BrandBadge label={iconCode.brandText} color="#1C1F21" size={78} />
              )}
              <div>
                <p className="text-white/50 text-xs uppercase tracking-widest mb-1">
                  {isRTL ? iconCode.labelAr : iconCode.labelEn}
                </p>
                <h4 className="text-xl font-display font-black italic text-white">{iconCode.brandText}</h4>
                <p className="text-white/50 text-xs max-w-sm mt-1 leading-relaxed">
                  {isRTL ? iconCode.taglineAr : iconCode.taglineEn}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 items-start md:items-end">
              <div className="flex flex-col gap-2 text-xs">
                <p className="text-white/40 uppercase tracking-widest">
                  {isRTL ? `أرقام فريق ${iconCode.brandText}` : `${iconCode.brandText} team numbers`}
                </p>
                {iconCode.numbers.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-2">
                    <span className="text-white/70" dir="ltr">{c.label}: {c.phone}</span>
                    <a href={`tel:+${c.phone}`} className="text-[#EEC31C] hover:underline" aria-label="call">
                      📞
                    </a>
                    {c.whatsapp && (
                      <a
                        href={`https://wa.me/${c.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline"
                        aria-label="whatsapp"
                      >
                        🟢
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <FlagStrip flags={iconCodeFlags} isRTL={isRTL} />
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
