import { useEffect, useState } from 'react';
import { listItems, saveItem, softDeleteItem } from '../../lib/store';
import { getSiteIdentity, setSiteIdentity, type SiteIdentity } from '../../lib/site';
import type { MenuItem, Category, Temperature, MenuItemSize } from '../../lib/types';
import MediaUploadField from './MediaUploadField';
import VideoUploadField from './VideoUploadField';
import GalleryUploadField from './GalleryUploadField';
import BulkUploadModal from './BulkUploadModal';
import EmojiPickerButton from './EmojiPickerButton';
import TextColorField from './TextColorField';

type ContentSubTab = 'identity' | 'categories' | 'items';

export default function ContentTab() {
  const [sub, setSub] = useState<ContentSubTab>('items');
  return (
    <div className="space-y-4 text-sm">
      <div className="flex gap-2 flex-wrap">
        {([
          { id: 'identity', label: 'اسم الموقع واللوجو' },
          { id: 'categories', label: 'الأقسام' },
          { id: 'items', label: 'الأصناف' },
        ] as { id: ContentSubTab; label: string }[]).map((s) => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs ${
              sub === s.id ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {sub === 'identity' && <IdentitySection />}
      {sub === 'categories' && <CategoriesSection />}
      {sub === 'items' && <ItemsSection />}
    </div>
  );
}

function IdentitySection() {
  const [identity, setIdentity] = useState<SiteIdentity>({ nameAr: '', nameEn: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSiteIdentity().then(setIdentity);
  }, []);

  async function save() {
    await setSiteIdentity(identity);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="space-y-3 max-w-sm">
      <label className="block text-white/60">اسم الموقع بالعربي</label>
      <input value={identity.nameAr} onChange={(e) => setIdentity({ ...identity, nameAr: e.target.value })}
        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none" />
      <label className="block text-white/60">اسم الموقع بالإنجليزي</label>
      <input value={identity.nameEn} onChange={(e) => setIdentity({ ...identity, nameEn: e.target.value })}
        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none" />

      <TextColorField
        value={identity.nameColor}
        onChange={(nameColor) => setIdentity({ ...identity, nameColor })}
      />

      <MediaUploadField
        label="اللوجو"
        value={identity.logo}
        onChange={(v) => setIdentity({ ...identity, logo: v })}
        previewClassName="w-20 h-20 object-cover rounded-xl"
      />

      <VideoUploadField
        label="الفيديو التعريفي (يظهر في أول الموقع)"
        value={identity.introVideo}
        onChange={(v) => setIdentity({ ...identity, introVideo: v || undefined })}
        hint="بيترفع فعليًا على Vercel Blob Storage ويشتغل بس لما الموقع يكون منشور على Vercel."
      />

      <button onClick={save} className="bg-white text-black px-4 py-2 rounded-lg font-medium">حفظ</button>
      {saved && <span className="text-emerald-400 text-xs ms-2">اتحفظ ✅</span>}
    </div>
  );
}

function CategoriesSection() {
  const [cats, setCats] = useState<Category[]>([]);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');

  async function refresh() {
    setCats(await listItems<Category>('categories'));
  }
  useEffect(() => {
    refresh();
  }, []);

  async function add() {
    if (!nameAr.trim() && !nameEn.trim()) return;
    await saveItem('categories', { id: crypto.randomUUID(), nameAr, nameEn } satisfies Category);
    setNameAr('');
    setNameEn('');
    refresh();
  }

  async function remove(id: string) {
    await softDeleteItem('categories', id);
    refresh();
  }

  async function changeColor(c: Category, nameColor: string | undefined) {
    await saveItem('categories', { ...c, nameColor });
    refresh();
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {cats.map((c) => (
          <li key={c.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 gap-3">
            <span className="flex-1">{c.nameAr} / {c.nameEn}</span>
            <TextColorField value={c.nameColor} onChange={(v) => changeColor(c, v)} />
            <button onClick={() => remove(c.id)} className="text-red-400 text-xs shrink-0">حذف</button>
          </li>
        ))}
        {cats.length === 0 && <p className="text-white/40">لسه مفيش أقسام مضافة.</p>}
      </ul>
      <div className="flex flex-wrap gap-2">
        <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="اسم القسم بالعربي"
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none flex-1 min-w-[140px]" />
        <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Category name in English"
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none flex-1 min-w-[140px]" />
        <button onClick={add} className="bg-white text-black px-4 py-2 rounded-lg font-medium">إضافة قسم</button>
      </div>
      <p className="text-white/40 text-xs">حذف قسم بيروح سلة المهملات، تقدر ترجعه من هناك.</p>
    </div>
  );
}

const emptyItem: Omit<MenuItem, 'id'> = {
  nameAr: '',
  nameEn: '',
  descAr: '',
  descEn: '',
  price: 0,
  image: '',
  gallery: [],
  categoryId: undefined,
  temperature: null,
  available: true,
  sizesEnabled: false,
  sizes: [],
};

function ItemsSection() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState<Omit<MenuItem, 'id'>>(emptyItem);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkCount, setBulkCount] = useState(0);

  async function refresh() {
    setItems(await listItems<MenuItem>('menuItems'));
    setCats(await listItems<Category>('categories'));
  }
  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    if (!form.nameAr.trim() && !form.nameEn.trim()) return;
    const id = editingId ?? crypto.randomUUID();
    await saveItem('menuItems', { id, ...form } satisfies MenuItem);
    setForm(emptyItem);
    setEditingId(null);
    refresh();
  }

  function editItem(item: MenuItem) {
    setEditingId(item.id);
    const { id, ...rest } = item;
    setForm({ sizesEnabled: false, sizes: [], gallery: [], ...rest });
  }

  async function remove(id: string) {
    await softDeleteItem('menuItems', id);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyItem);
    }
    refresh();
  }

  function addSizeRow() {
    setForm((p) => ({
      ...p,
      sizes: [...(p.sizes ?? []), { id: crypto.randomUUID(), label: '', labelEn: '', price: p.price || 0 }],
    }));
  }
  function updateSizeRow(idx: number, patch: Partial<MenuItemSize>) {
    setForm((p) => ({
      ...p,
      sizes: (p.sizes ?? []).map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  }
  function removeSizeRow(idx: number) {
    setForm((p) => ({ ...p, sizes: (p.sizes ?? []).filter((_, i) => i !== idx) }));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-white/60 text-xs">{items.length} صنف</p>
        <div className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-lg px-1 py-1">
          <button
            onClick={() => setBulkCount((c) => Math.max(0, c - 1))}
            className="w-7 h-7 rounded-md hover:bg-white/20 text-base leading-none"
            aria-label="تقليل"
          >
            −
          </button>
          <span className="text-xs px-1 whitespace-nowrap">
            {bulkCount > 0 ? `رفع جماعي (${bulkCount})` : 'رفع جماعي (لحد 100 صنف)'}
          </span>
          <button
            onClick={() => setBulkCount((c) => (c === 0 ? 2 : Math.min(100, c + 1)))}
            className="w-7 h-7 rounded-md hover:bg-white/20 text-base leading-none"
            aria-label="زيادة"
          >
            +
          </button>
        </div>
      </div>

      {bulkCount > 0 && (
        <BulkUploadModal
          categories={cats}
          slotsCount={bulkCount}
          onSlotsChange={setBulkCount}
          onClose={() => setBulkCount(0)}
          onDone={refresh}
        />
      )}

      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
            {it.image && <img src={it.image} className="w-10 h-10 rounded-lg object-cover" />}
            <div className="flex-1">
              <p>{it.nameAr} / {it.nameEn} — {it.price}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {it.temperature && <span className="text-[10px] text-white/40">{it.temperature === 'hot' ? 'سخن' : 'بارد'}</span>}
                {it.available === false && (
                  <span className="text-[10px] text-red-400 font-medium">غير متاح حاليًا</span>
                )}
                {it.sizesEnabled && it.sizes?.length ? (
                  <span className="text-[10px] text-white/40">{it.sizes.length} أحجام</span>
                ) : null}
                {it.gallery?.length ? (
                  <span className="text-[10px] text-white/40">{it.gallery.length} وسائط إضافية</span>
                ) : null}
              </div>
            </div>
            <button onClick={() => editItem(it)} className="text-white/60 text-xs underline">تعديل</button>
            <button onClick={() => remove(it.id)} className="text-red-400 text-xs">حذف</button>
          </li>
        ))}
        {items.length === 0 && <p className="text-white/40">لسه مفيش أصناف مضافة.</p>}
      </ul>

      <div className="border-t border-white/10 pt-4 space-y-2">
        <p className="text-white/60">{editingId ? 'تعديل صنف' : 'إضافة صنف جديد'}</p>
        <div className="grid grid-cols-2 gap-2">
          <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} placeholder="الاسم بالعربي"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none" />
          <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="Name in English"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none" />
          <div className="col-span-2">
            <TextColorField value={form.nameColor} onChange={(nameColor) => setForm({ ...form, nameColor })} />
          </div>
          <input value={form.descAr} onChange={(e) => setForm({ ...form, descAr: e.target.value })} placeholder="الوصف بالعربي (اختياري)"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none col-span-2" />
          <input value={form.descEn} onChange={(e) => setForm({ ...form, descEn: e.target.value })} placeholder="Description in English (optional)"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none col-span-2" />
          <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="السعر"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none" />
          <select value={form.categoryId ?? ''} onChange={(e) => setForm({ ...form, categoryId: e.target.value || undefined })}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none">
            <option value="">بدون قسم</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
          </select>
          <select value={form.temperature ?? ''} onChange={(e) => setForm({ ...form, temperature: (e.target.value || null) as Temperature })}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none col-span-2">
            <option value="">بدون علامة سخن/بارد</option>
            <option value="hot">سخن 🔥</option>
            <option value="cold">بارد ❄️</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-white/70 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={form.available !== false}
            onChange={(e) => setForm({ ...form, available: e.target.checked })}
            className="w-4 h-4 accent-white"
          />
          {form.available !== false ? 'متاح للطلب' : 'غير متاح حاليًا (هيظهر بس بدون إمكانية الطلب)'}
        </label>

        <MediaUploadField
          label="صورة الصنف"
          value={form.image}
          onChange={(v) => setForm({ ...form, image: v })}
        />

        <GalleryUploadField
          value={form.gallery ?? []}
          onChange={(gallery) => setForm({ ...form, gallery })}
        />

        <div className="border border-white/10 rounded-lg p-3 space-y-2">
          <label className="flex items-center gap-2 text-white/70 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={!!form.sizesEnabled}
              onChange={(e) => setForm({ ...form, sizesEnabled: e.target.checked })}
              className="w-4 h-4 accent-white"
            />
            الصنف ده له أحجام مختلفة (سمول / ميديم / لارج...) بدل سعر واحد
          </label>
          {form.sizesEnabled && (
            <div className="space-y-2">
              {(form.sizes ?? []).map((s, idx) => (
                <div key={s.id} className="flex items-center gap-2">
                  <input
                    value={s.label}
                    onChange={(e) => updateSizeRow(idx, { label: e.target.value })}
                    placeholder="اسم الحجم، مثال: وسط"
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 outline-none text-xs"
                  />
                  <input
                    value={s.labelEn ?? ''}
                    onChange={(e) => updateSizeRow(idx, { labelEn: e.target.value })}
                    placeholder="Size in English"
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 outline-none text-xs"
                  />
                  <input
                    type="number"
                    value={s.price}
                    onChange={(e) => updateSizeRow(idx, { price: Number(e.target.value) })}
                    placeholder="السعر"
                    className="w-20 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 outline-none text-xs"
                  />
                  <button onClick={() => removeSizeRow(idx)} className="text-red-400 text-xs shrink-0">حذف</button>
                </div>
              ))}
              <button onClick={addSizeRow} className="text-xs text-white/70 underline">+ إضافة حجم</button>
              {!(form.sizes ?? []).length && (
                <p className="text-white/40 text-[11px]">لسه مفيش أحجام مضافة — ضيف واحد على الأقل قبل الحفظ.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={save} className="bg-white text-black px-4 py-2 rounded-lg font-medium">
            {editingId ? 'حفظ التعديل' : 'إضافة الصنف'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setForm(emptyItem); }} className="text-white/50 text-sm underline">
              إلغاء
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
