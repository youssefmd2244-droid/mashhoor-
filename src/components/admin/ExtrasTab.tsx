import { useEffect, useState, type ChangeEvent } from 'react';
import { listItems, saveItem, softDeleteItem } from '../../lib/store';
import { resizeImageToThumbnail, fileToDataUrl } from '../../lib/site';
import EmojiPickerButton from './EmojiPickerButton';
import TextColorField from './TextColorField';
import type { Extra } from '../../lib/types';

const emptyExtra: Omit<Extra, 'id'> = { nameAr: '', nameEn: '', price: 0, image: '', nameColor: undefined };

// An extra's "image" can be one of three things: a real picture (resized to
// a tiny thumbnail), an animated GIF/sticker (kept as-is so it stays
// animated — resizing would flatten it to a single static frame), or a
// direct link (any format: png/jpg/webp/gif/svg — including animated ones —
// hosted somewhere else), or a plain emoji character used as a mini icon.
// This helper tells the preview/list which way to render a given value.
function isImageSrc(value: string) {
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:');
}

// Settings → الإضافات. These are add-ons the customer can attach to the
// WHOLE order at checkout (not per menu item) — e.g. "صوص إضافي", "شمعة عيد
// ميلاد", "أكياس تقديم فاخرة". The thumbnail is force-resized down to a tiny
// 64×64 image at upload time (see resizeImageToThumbnail) so it always shows
// as a small badge next to the name and price, never a big photo.
export default function ExtrasTab() {
  const [extras, setExtras] = useState<Extra[]>([]);
  const [form, setForm] = useState<Omit<Extra, 'id'>>(emptyExtra);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resizing, setResizing] = useState(false);
  const [imageMode, setImageMode] = useState<'file' | 'url' | 'emoji'>('file');
  const [urlDraft, setUrlDraft] = useState('');

  async function refresh() {
    const list = await listItems<Extra>('extras');
    setExtras(list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  }
  useEffect(() => {
    refresh();
  }, []);

  async function handleImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResizing(true);
    try {
      // GIFs (and other already-animated formats) are kept as-is — resizing
      // through a canvas would bake them down to one static frame.
      const isAnimated = file.type === 'image/gif' || file.type === 'image/webp';
      const thumb = isAnimated ? await fileToDataUrl(file) : await resizeImageToThumbnail(file, 64, 0.8);
      setForm((p) => ({ ...p, image: thumb }));
    } finally {
      setResizing(false);
    }
  }

  function applyUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    setForm((p) => ({ ...p, image: url }));
    setUrlDraft('');
  }

  async function save() {
    if (!form.nameAr.trim() && !form.nameEn.trim()) return;
    const id = editingId ?? crypto.randomUUID();
    await saveItem('extras', { id, ...form } satisfies Extra);
    setForm(emptyExtra);
    setEditingId(null);
    refresh();
  }

  function editExtra(ex: Extra) {
    setEditingId(ex.id);
    const { id, ...rest } = ex;
    setForm(rest);
  }

  async function remove(id: string) {
    await softDeleteItem('extras', id);
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyExtra);
    }
    refresh();
  }

  return (
    <div className="space-y-5 text-sm">
      <p className="text-white/50 text-xs leading-relaxed">
        الإضافات دي بتظهر للعميل وهو بيدخل بياناته قبل إرسال الطلب، ويقدر يختار أكتر من واحدة. بتتضاف لإجمالي
        الطلب وبتتبعت في رسالة الواتساب زي أي صنف.
      </p>

      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {extras.map((ex) => (
          <li key={ex.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
            {ex.image && (
              isImageSrc(ex.image) ? (
                <img src={ex.image} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
              ) : (
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg shrink-0">
                  {ex.image}
                </span>
              )
            )}
            <div className="flex-1">
              <p>{ex.nameAr} / {ex.nameEn} — {ex.price}</p>
            </div>
            <button onClick={() => editExtra(ex)} className="text-white/60 text-xs underline">تعديل</button>
            <button onClick={() => remove(ex.id)} className="text-red-400 text-xs">حذف</button>
          </li>
        ))}
        {extras.length === 0 && <p className="text-white/40">لسه مفيش إضافات مضافة.</p>}
      </ul>

      <div className="border-t border-white/10 pt-4 space-y-3">
        <p className="text-white/60">{editingId ? 'تعديل إضافة' : 'إضافة جديدة'}</p>

        <div className="flex items-center gap-3">
          {form.image ? (
            isImageSrc(form.image) ? (
              <img src={form.image} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
            ) : (
              <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-2xl shrink-0">
                {form.image}
              </span>
            )
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
          )}
          {form.image && (
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, image: '' }))}
              className="text-white/40 text-xs underline"
            >
              مسح الصورة
            </button>
          )}
        </div>

        {/* Three ways to set the icon: upload a file, paste a link (works
            with any format incl. animated GIF/WEBP), or pick a plain emoji. */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
          {([
            { id: 'file', label: 'رفع صورة' },
            { id: 'url', label: 'رابط' },
            { id: 'emoji', label: 'إيموجي / ملصق' },
          ] as { id: 'file' | 'url' | 'emoji'; label: string }[]).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setImageMode(m.id)}
              className={`px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${
                imageMode === m.id ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {imageMode === 'file' && (
          <label className="text-xs text-white underline cursor-pointer block w-fit">
            {resizing ? 'جاري المعالجة…' : 'اختر صورة أو GIF (بتتصغر أوتوماتيك، والـ GIF بيفضل متحرك)'}
            <input type="file" accept="image/*,.gif,.webp" className="hidden" onChange={handleImage} disabled={resizing} />
          </label>
        )}

        {imageMode === 'url' && (
          <div className="flex gap-2">
            <input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="حط رابط الصورة أو الـ GIF هنا (أي صيغة)"
              dir="ltr"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none text-xs"
            />
            <button type="button" onClick={applyUrl} className="bg-white/10 text-white px-3 py-2 rounded-lg text-xs shrink-0">
              استخدام الرابط
            </button>
          </div>
        )}

        {imageMode === 'emoji' && (
          <div className="flex items-center gap-2">
            <EmojiPickerButton onPick={(emoji) => setForm((p) => ({ ...p, image: emoji }))} />
            <span className="text-white/40 text-xs">اختار إيموجي أو ملصق نصي يستخدم كأيقونة للإضافة</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.nameAr}
            onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
            placeholder="اسم الإضافة بالعربي"
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
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none col-span-2"
          />
          <div className="col-span-2">
            <TextColorField value={form.nameColor} onChange={(nameColor) => setForm({ ...form, nameColor })} />
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
                setForm(emptyExtra);
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
