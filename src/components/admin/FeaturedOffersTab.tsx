import { useEffect, useState } from 'react';
import { listItems, saveItem, softDeleteItem } from '../../lib/store';
import MediaUploadField from './MediaUploadField';
import TextColorField from './TextColorField';
import type { FeaturedOffer } from '../../lib/types';

const emptyOffer: Omit<FeaturedOffer, 'id'> = {
  titleAr: '',
  titleEn: '',
  descAr: '',
  descEn: '',
  price: '',
  oldPrice: '',
  image: '',
  tagAr: 'جديد',
  tagEn: 'New',
};

// Settings → العروض المميزة. These power the "هذا الأسبوع فقط" poster
// carousel on the homepage — the big rotating offer showcase. Add, edit,
// reorder (drag isn't wired yet, but delete + re-add works), or delete
// offers here; the site falls back to a few sample offers if the list is
// empty so the section never looks broken before the admin fills it in.
export default function FeaturedOffersTab() {
  const [offers, setOffers] = useState<FeaturedOffer[]>([]);
  const [form, setForm] = useState<Omit<FeaturedOffer, 'id'>>(emptyOffer);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function refresh() {
    const list = await listItems<FeaturedOffer>('featuredOffers');
    setOffers(list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  }
  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    if (!form.titleAr.trim() && !form.titleEn.trim()) return;
    const id = editingId ?? crypto.randomUUID();
    await saveItem('featuredOffers', { id, ...form } satisfies FeaturedOffer);
    setForm(emptyOffer);
    setEditingId(null);
    refresh();
  }

  function editOffer(o: FeaturedOffer) {
    setEditingId(o.id);
    const { id, ...rest } = o;
    setForm(rest);
  }

  async function remove(id: string) {
    await softDeleteItem('featuredOffers', id);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyOffer);
    }
    refresh();
  }

  return (
    <div className="space-y-5 text-sm">
      <p className="text-white/50 text-xs leading-relaxed">
        العروض دي بتظهر في قسم "هذا الأسبوع فقط" — كاروسيل بيتقلب بين العروض واحد واحد. لو مفيش عروض مضافة، الموقع
        بيورّي عينة افتراضية لحد ما تضيف عروضك.
      </p>

      <ul className="space-y-2 max-h-72 overflow-y-auto">
        {offers.map((o) => (
          <li key={o.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
            {o.image && <img src={o.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />}
            <div className="flex-1">
              <p>{o.titleAr} / {o.titleEn} — {o.price} {o.oldPrice && <span className="line-through text-white/30">{o.oldPrice}</span>}</p>
              <p className="text-[10px] text-white/40">{o.tagAr} / {o.tagEn}</p>
            </div>
            <button onClick={() => editOffer(o)} className="text-white/60 text-xs underline">تعديل</button>
            <button onClick={() => remove(o.id)} className="text-red-400 text-xs">حذف</button>
          </li>
        ))}
        {offers.length === 0 && <p className="text-white/40">لسه مفيش عروض مضافة — العينة الافتراضية ظاهرة دلوقتي.</p>}
      </ul>

      <div className="border-t border-white/10 pt-4 space-y-3">
        <p className="text-white/60">{editingId ? 'تعديل عرض' : 'عرض جديد'}</p>

        <MediaUploadField
          label="صورة العرض"
          value={form.image}
          onChange={(v) => setForm({ ...form, image: v })}
          previewClassName="w-16 h-16 rounded-lg object-cover"
          hint="تقدر ترفع صورة من جهازك، أو تلصق رابط (بيدعم أي صيغة زي gif متحرك)."
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.titleAr}
            onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
            placeholder="اسم العرض بالعربي"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
          <input
            value={form.titleEn}
            onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
            placeholder="Offer name in English"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
          <div className="col-span-2">
            <TextColorField value={form.titleColor} onChange={(titleColor) => setForm({ ...form, titleColor })} />
          </div>
          <input
            value={form.descAr}
            onChange={(e) => setForm({ ...form, descAr: e.target.value })}
            placeholder="الوصف بالعربي"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none col-span-2"
          />
          <input
            value={form.descEn}
            onChange={(e) => setForm({ ...form, descEn: e.target.value })}
            placeholder="Description in English"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none col-span-2"
          />
          <input
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="السعر (مثال: 120)"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
          <input
            value={form.oldPrice}
            onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
            placeholder="السعر قبل الخصم (اختياري)"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
          <input
            value={form.tagAr}
            onChange={(e) => setForm({ ...form, tagAr: e.target.value })}
            placeholder="وسم العرض بالعربي (مثال: جديد)"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
          <input
            value={form.tagEn}
            onChange={(e) => setForm({ ...form, tagEn: e.target.value })}
            placeholder="Tag in English (e.g. New)"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={save} className="bg-white text-black px-4 py-2 rounded-lg font-medium">
            {editingId ? 'حفظ التعديل' : 'إضافة'}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm(emptyOffer);
              }}
              className="text-white/50 text-sm underline"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
