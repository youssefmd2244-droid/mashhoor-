import { useEffect, useState } from 'react';
import { saveItem } from '../../lib/store';
import { yieldToBrowser } from '../../lib/site';
import type { Category, MenuItem, Temperature } from '../../lib/types';
import MediaUploadField from './MediaUploadField';
import VideoUploadField from './VideoUploadField';

const MAX_FILES = 100;

interface Draft {
  id: string; // temp local id, becomes the MenuItem id on save
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  price: number;
  categoryId?: string;
  temperature: Temperature;
  available: boolean;
  mediaKind: 'image' | 'video';
  image?: string; // data url or pasted http link
  video?: string; // uploaded blob url
}

function emptyDraft(): Draft {
  return {
    id: crypto.randomUUID(),
    nameAr: '',
    nameEn: '',
    descAr: '',
    descEn: '',
    price: 0,
    categoryId: undefined,
    temperature: null,
    available: true,
    mediaKind: 'image',
    image: undefined,
    video: undefined,
  };
}

export default function BulkUploadModal({
  categories,
  slotsCount,
  onSlotsChange,
  onClose,
  onDone,
}: {
  categories: Category[];
  slotsCount: number;
  onSlotsChange: (n: number) => void;
  onClose: () => void;
  onDone: () => void;
}) {
  // Opens directly with `slotsCount` empty item slots — the +/- stepper on
  // the page (and the one below, mirrored for convenience) both control
  // this same number — and every slot is a full copy of the same "إضافة
  // صنف جديد" form (same fields, same media uploader with drag/drop + link
  // paste), not a stripped-down mini version.
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // Keep the local drafts array in sync with slotsCount, whichever side
  // changed it (the page-level stepper, or the one inside this panel).
  // Growing appends new empty slots at the end; shrinking trims from the
  // end — either way, slots the user already filled in are preserved.
  useEffect(() => {
    setDrafts((ds) => {
      if (slotsCount === ds.length) return ds;
      if (slotsCount > ds.length) {
        return [...ds, ...Array.from({ length: slotsCount - ds.length }, emptyDraft)];
      }
      return ds.slice(0, Math.max(0, slotsCount));
    });
  }, [slotsCount]);

  const [stage, setStage] = useState<'edit' | 'saving' | 'done'>('edit');
  const [saveProgress, setSaveProgress] = useState({ done: 0, total: 0 });
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('');

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function removeDraft(id: string) {
    setDrafts((ds) => ds.filter((d) => d.id !== id));
    onSlotsChange(Math.max(0, slotsCount - 1));
  }

  // The stepper: press "+" to add a slot (up to 100), press "−" to remove
  // the last one — going below 1 closes the whole panel (slotsCount hits 0
  // in the parent, which unmounts this component).
  function addSlot() {
    onSlotsChange(Math.min(MAX_FILES, slotsCount + 1));
  }
  function removeSlot() {
    onSlotsChange(Math.max(0, slotsCount - 1));
  }

  function applyDefaultCategoryToAll() {
    if (!defaultCategoryId) return;
    setDrafts((ds) => ds.map((d) => ({ ...d, categoryId: defaultCategoryId })));
  }

  async function saveAll() {
    // Skip slots the user left completely empty.
    const active = drafts.filter((d) => d.nameAr.trim() || d.nameEn.trim() || d.image || d.video);
    if (!active.length) return;

    setStage('saving');
    setSaveProgress({ done: 0, total: active.length });
    let done = 0;
    for (const d of active) {
      const item: MenuItem = {
        id: d.id,
        nameAr: d.nameAr,
        nameEn: d.nameEn,
        descAr: d.descAr,
        descEn: d.descEn,
        price: d.price || 0,
        categoryId: d.categoryId,
        temperature: d.temperature,
        available: d.available,
        image: d.mediaKind === 'image' ? d.image : undefined,
        gallery: d.mediaKind === 'video' && d.video ? [{ id: crypto.randomUUID(), kind: 'video', url: d.video }] : undefined,
      };
      await saveItem('menuItems', item);
      done++;
      setSaveProgress({ done, total: active.length });
      // Yield every few items so the tab never freezes ("تهنيج"), even
      // when saving close to 100 items at once.
      if (done % 5 === 0) await yieldToBrowser();
    }
    setStage('done');
    onDone();
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden" dir="rtl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold">رفع جماعي لعدة أصناف</h3>
        <button onClick={onClose} className="text-white/60 hover:text-white text-xl leading-none">
          ×
        </button>
      </div>

      <div className="p-4 text-sm space-y-4">
        {stage === 'edit' && (
          <>
            <div className="flex items-center justify-between gap-3 bg-white/5 rounded-lg p-2">
              <span className="text-white/50 text-xs">عدد الخانات — دوس + لصنف جديد ولحد ما تدوس − هتقفل</span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={removeSlot}
                  className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-lg leading-none"
                  aria-label="تقليل"
                >
                  −
                </button>
                <span className="w-10 text-center font-semibold">{drafts.length}</span>
                <button
                  onClick={addSlot}
                  disabled={drafts.length >= MAX_FILES}
                  className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-lg leading-none disabled:opacity-40"
                  aria-label="زيادة"
                >
                  +
                </button>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 bg-white/5 rounded-lg p-2">
                <span className="text-white/50 text-xs">حط قسم واحد لكل الخانات دفعة واحدة:</span>
                <select
                  value={defaultCategoryId}
                  onChange={(e) => setDefaultCategoryId(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 outline-none text-xs"
                >
                  <option value="">اختار قسم</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
                <button onClick={applyDefaultCategoryToAll} className="text-xs underline text-white/70">
                  تطبيق على الكل
                </button>
              </div>
            )}

            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {drafts.map((d, idx) => (
                <div key={d.id} className="border border-white/10 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-xs">صنف {idx + 1}</span>
                    <button
                      onClick={() => removeDraft(d.id)}
                      className="text-red-400 text-xs shrink-0"
                    >
                      حذف الخانة دي
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={d.nameAr}
                      onChange={(e) => updateDraft(d.id, { nameAr: e.target.value })}
                      placeholder="الاسم بالعربي"
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
                    />
                    <input
                      value={d.nameEn}
                      onChange={(e) => updateDraft(d.id, { nameEn: e.target.value })}
                      placeholder="Name in English"
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
                    />
                    <input
                      value={d.descAr}
                      onChange={(e) => updateDraft(d.id, { descAr: e.target.value })}
                      placeholder="الوصف بالعربي (اختياري)"
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none col-span-2"
                    />
                    <input
                      value={d.descEn}
                      onChange={(e) => updateDraft(d.id, { descEn: e.target.value })}
                      placeholder="Description in English (optional)"
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none col-span-2"
                    />
                    <input
                      type="number"
                      value={d.price || ''}
                      onChange={(e) => updateDraft(d.id, { price: Number(e.target.value) })}
                      placeholder="السعر"
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
                    />
                    <select
                      value={d.categoryId ?? ''}
                      onChange={(e) => updateDraft(d.id, { categoryId: e.target.value || undefined })}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none"
                    >
                      <option value="">بدون قسم</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameAr}
                        </option>
                      ))}
                    </select>
                    <select
                      value={d.temperature ?? ''}
                      onChange={(e) => updateDraft(d.id, { temperature: (e.target.value || null) as Temperature })}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none col-span-2"
                    >
                      <option value="">بدون علامة سخن/بارد</option>
                      <option value="hot">سخن 🔥</option>
                      <option value="cold">بارد ❄️</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 text-white/70 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={d.available}
                      onChange={(e) => updateDraft(d.id, { available: e.target.checked })}
                      className="w-4 h-4 accent-white"
                    />
                    {d.available ? 'متاح للطلب' : 'غير متاح حاليًا (هيظهر بس بدون إمكانية الطلب)'}
                  </label>

                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => updateDraft(d.id, { mediaKind: 'image' })}
                      className={`px-3 py-1.5 rounded-lg ${d.mediaKind === 'image' ? 'bg-white text-black' : 'bg-white/10 text-white/70'}`}
                    >
                      صورة
                    </button>
                    <button
                      onClick={() => updateDraft(d.id, { mediaKind: 'video' })}
                      className={`px-3 py-1.5 rounded-lg ${d.mediaKind === 'video' ? 'bg-white text-black' : 'bg-white/10 text-white/70'}`}
                    >
                      فيديو
                    </button>
                  </div>

                  {d.mediaKind === 'image' ? (
                    <MediaUploadField
                      label="صورة الصنف"
                      value={d.image}
                      onChange={(v) => updateDraft(d.id, { image: v })}
                    />
                  ) : (
                    <VideoUploadField
                      label="فيديو الصنف"
                      value={d.video}
                      onChange={(v) => updateDraft(d.id, { video: v || undefined })}
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {(stage === 'saving' || stage === 'done') && (
          <div className="space-y-3">
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all"
                style={{ width: `${(saveProgress.done / Math.max(1, saveProgress.total)) * 100}%` }}
              />
            </div>
            <p className="text-white/60 text-xs text-center">
              {stage === 'saving'
                ? `جاري الحفظ… ${saveProgress.done}/${saveProgress.total}`
                : `تم ✅ اتحفظ ${saveProgress.done} صنف بنجاح`}
            </p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-white/10 flex justify-end gap-2">
        {stage === 'edit' && (
          <button onClick={saveAll} className="bg-white text-black px-5 py-2 rounded-lg font-medium">
            حفظ الكل ({drafts.filter((d) => d.nameAr.trim() || d.nameEn.trim() || d.image || d.video).length})
          </button>
        )}
        {stage === 'done' ? (
          <button onClick={onClose} className="bg-white text-black px-5 py-2 rounded-lg font-medium">
            تمام
          </button>
        ) : (
          <button onClick={onClose} className="text-white/60 text-sm underline">
            إلغاء
          </button>
        )}
      </div>
    </div>
  );
}
