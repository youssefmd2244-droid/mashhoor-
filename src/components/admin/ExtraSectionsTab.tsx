import { useEffect, useState } from 'react';
import { listItems, saveItem, softDeleteItem } from '../../lib/store';
import MediaUploadField from './MediaUploadField';
import TextColorField from './TextColorField';
import type { PollOption, FastFoodProduct, SignatureFeature } from '../../lib/types';

// Settings → المحتوى → أقسام إضافية. This houses the three homepage
// sections whose cards used to be hardcoded in the component source:
// قسم التصويت (poll options), قسم الفاست فود (product strip) and قسم
// الهوية "هويتنا العربية" (feature cards). Each behaves like أي قسم تاني —
// Add / Edit / Delete / Replace — and the site falls back to a small demo
// set only until the admin adds real cards, exactly like المنيو والعروض.
export default function ExtraSectionsTab() {
  const [sub, setSub] = useState<'poll' | 'fastfood' | 'signature'>('poll');
  return (
    <div className="space-y-5 text-sm">
      <p className="text-white/50 text-xs leading-relaxed">
        الأقسام دي كلها بتظهر في الصفحة الرئيسية. أي كارت تضيفه أو تعدّله أو تحذفه هنا بيتغيّر في الموقع على طول.
      </p>
      <div className="flex gap-2 border-b border-white/10 pb-3 flex-wrap">
        {[
          { id: 'poll', label: 'قسم التصويت' },
          { id: 'fastfood', label: 'قسم الفاست فود' },
          { id: 'signature', label: 'قسم الهوية العربية' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs ${
              sub === t.id ? 'bg-white text-black' : 'bg-white/10 text-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {sub === 'poll' && <PollOptionsPanel />}
      {sub === 'fastfood' && <FastFoodProductsPanel />}
      {sub === 'signature' && <SignatureFeaturesPanel />}
    </div>
  );
}

// ---------------------------------------------------------------------------

const emptyPoll: Omit<PollOption, 'id'> = {
  emoji: '🍔',
  titleAr: '',
  titleEn: '',
  color: '#C11E10',
  image: '',
  votes: 0,
};

function PollOptionsPanel() {
  const [items, setItems] = useState<PollOption[]>([]);
  const [form, setForm] = useState<Omit<PollOption, 'id'>>(emptyPoll);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function refresh() {
    const list = await listItems<PollOption>('pollOptions');
    setItems(list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  }
  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    if (!form.titleAr.trim() && !form.titleEn.trim()) return;
    const id = editingId ?? crypto.randomUUID();
    await saveItem('pollOptions', { id, ...form } satisfies PollOption);
    setForm(emptyPoll);
    setEditingId(null);
    refresh();
  }

  function editItem(o: PollOption) {
    setEditingId(o.id);
    const { id, ...rest } = o;
    setForm(rest);
  }

  async function remove(id: string) {
    await softDeleteItem('pollOptions', id);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyPoll);
    }
    refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-white/40 text-[11px]">
        دي الاختيارات اللي بتظهر في قسم "صوّت لطبقك المفضل". لو مفيش اختيارات مضافة، الموقع بيورّي عينة افتراضية.
      </p>
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {items.map((o) => (
          <li key={o.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
            {o.image && <img src={o.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />}
            <span className="text-xl">{o.emoji}</span>
            <div className="flex-1">
              <p>{o.titleAr} / {o.titleEn}</p>
              <p className="text-[10px] text-white/40">{o.votes ?? 0} صوت ابتدائي</p>
            </div>
            <button onClick={() => editItem(o)} className="text-white/60 text-xs underline">تعديل</button>
            <button onClick={() => remove(o.id)} className="text-red-400 text-xs">حذف</button>
          </li>
        ))}
        {items.length === 0 && <p className="text-white/40">لسه مفيش اختيارات مضافة — العينة الافتراضية ظاهرة دلوقتي.</p>}
      </ul>

      <div className="border-t border-white/10 pt-4 space-y-3">
        <p className="text-white/60">{editingId ? 'تعديل اختيار' : 'اختيار جديد'}</p>
        <MediaUploadField
          label="صورة الاختيار"
          value={form.image}
          onChange={(v) => setForm({ ...form, image: v })}
          previewClassName="w-16 h-16 rounded-lg object-cover"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.emoji}
            onChange={(e) => setForm({ ...form, emoji: e.target.value })}
            placeholder="إيموجي (مثال: 🌶️)"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="bg-white/10 border border-white/20 rounded-lg h-10 w-full"
          />
          <input
            value={form.titleAr}
            onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
            placeholder="الاسم بالعربي"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
          <input
            value={form.titleEn}
            onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
            placeholder="Name in English"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
          <input
            type="number"
            value={form.votes}
            onChange={(e) => setForm({ ...form, votes: Number(e.target.value) })}
            placeholder="عدد الأصوات الابتدائي"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none col-span-2"
          />
          <div className="col-span-2">
            <TextColorField value={form.titleColor} onChange={(titleColor) => setForm({ ...form, titleColor })} />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={save} className="bg-white text-black px-4 py-2 rounded-lg font-medium">
            {editingId ? 'حفظ التعديل' : 'إضافة'}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm(emptyPoll);
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

// ---------------------------------------------------------------------------

const emptyFF: Omit<FastFoodProduct, 'id'> = {
  nameAr: '',
  nameEn: '',
  price: 0,
  color: '#9B3734',
  image: '',
};

function FastFoodProductsPanel() {
  const [items, setItems] = useState<FastFoodProduct[]>([]);
  const [form, setForm] = useState<Omit<FastFoodProduct, 'id'>>(emptyFF);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function refresh() {
    const list = await listItems<FastFoodProduct>('fastFoodProducts');
    setItems(list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  }
  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    if (!form.nameAr.trim() && !form.nameEn.trim()) return;
    const id = editingId ?? crypto.randomUUID();
    await saveItem('fastFoodProducts', { id, ...form } satisfies FastFoodProduct);
    setForm(emptyFF);
    setEditingId(null);
    refresh();
  }

  function editItem(o: FastFoodProduct) {
    setEditingId(o.id);
    const { id, ...rest } = o;
    setForm(rest);
  }

  async function remove(id: string) {
    await softDeleteItem('fastFoodProducts', id);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyFF);
    }
    refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-white/40 text-[11px]">
        دي الكروت التلاتة اللي بتظهر في قسم الفاست فود. لو مفيش كروت مضافة، الموقع بيورّي عينة افتراضية.
      </p>
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {items.map((o) => (
          <li key={o.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
            {o.image && <img src={o.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />}
            <div className="flex-1">
              <p>{o.nameAr} / {o.nameEn} — {o.price} ج.م</p>
            </div>
            <button onClick={() => editItem(o)} className="text-white/60 text-xs underline">تعديل</button>
            <button onClick={() => remove(o.id)} className="text-red-400 text-xs">حذف</button>
          </li>
        ))}
        {items.length === 0 && <p className="text-white/40">لسه مفيش كروت مضافة — العينة الافتراضية ظاهرة دلوقتي.</p>}
      </ul>

      <div className="border-t border-white/10 pt-4 space-y-3">
        <p className="text-white/60">{editingId ? 'تعديل كارت' : 'كارت جديد'}</p>
        <MediaUploadField
          label="صورة خلفية الكارت (اختياري)"
          value={form.image ?? ''}
          onChange={(v) => setForm({ ...form, image: v })}
          previewClassName="w-16 h-16 rounded-lg object-cover"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.nameAr}
            onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
            placeholder="الاسم بالعربي"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
          <input
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            placeholder="Name in English"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            placeholder="السعر"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="bg-white/10 border border-white/20 rounded-lg h-10 w-full"
          />
          <div className="col-span-2">
            <TextColorField
              label="لون خط الاسم"
              value={form.nameColor}
              onChange={(nameColor) => setForm({ ...form, nameColor })}
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={save} className="bg-white text-black px-4 py-2 rounded-lg font-medium">
            {editingId ? 'حفظ التعديل' : 'إضافة'}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm(emptyFF);
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

// ---------------------------------------------------------------------------

const emptySig: Omit<SignatureFeature, 'id'> = {
  icon: '🌿',
  titleAr: '',
  titleEn: '',
  descAr: '',
  descEn: '',
};

function SignatureFeaturesPanel() {
  const [items, setItems] = useState<SignatureFeature[]>([]);
  const [form, setForm] = useState<Omit<SignatureFeature, 'id'>>(emptySig);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function refresh() {
    const list = await listItems<SignatureFeature>('signatureFeatures');
    setItems(list);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    if (!form.titleAr.trim() && !form.titleEn.trim()) return;
    const id = editingId ?? crypto.randomUUID();
    await saveItem('signatureFeatures', { id, ...form } satisfies SignatureFeature);
    setForm(emptySig);
    setEditingId(null);
    refresh();
  }

  function editItem(o: SignatureFeature) {
    setEditingId(o.id);
    const { id, ...rest } = o;
    setForm(rest);
  }

  async function remove(id: string) {
    await softDeleteItem('signatureFeatures', id);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptySig);
    }
    refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-white/40 text-[11px]">
        دي كروت المميزات اللي بتظهر في قسم "هويتنا العربية" (مكونات عضوية، شوي على الحطب... إلخ). لو مفيش كروت
        مضافة، الموقع بيورّي عينة افتراضية.
      </p>
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {items.map((o) => (
          <li key={o.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
            <span className="text-xl">{o.icon}</span>
            <div className="flex-1">
              <p>{o.titleAr} / {o.titleEn}</p>
              <p className="text-[10px] text-white/40">{o.descAr}</p>
            </div>
            <button onClick={() => editItem(o)} className="text-white/60 text-xs underline">تعديل</button>
            <button onClick={() => remove(o.id)} className="text-red-400 text-xs">حذف</button>
          </li>
        ))}
        {items.length === 0 && <p className="text-white/40">لسه مفيش كروت مضافة — العينة الافتراضية ظاهرة دلوقتي.</p>}
      </ul>

      <div className="border-t border-white/10 pt-4 space-y-3">
        <p className="text-white/60">{editingId ? 'تعديل كارت' : 'كارت جديد'}</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="إيموجي الأيقونة (مثال: 🌿)"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none col-span-2"
          />
          <input
            value={form.titleAr}
            onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
            placeholder="العنوان بالعربي"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
          <input
            value={form.titleEn}
            onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
            placeholder="Title in English"
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
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
          <div className="col-span-2">
            <TextColorField value={form.titleColor} onChange={(titleColor) => setForm({ ...form, titleColor })} />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={save} className="bg-white text-black px-4 py-2 rounded-lg font-medium">
            {editingId ? 'حفظ التعديل' : 'إضافة'}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm(emptySig);
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
