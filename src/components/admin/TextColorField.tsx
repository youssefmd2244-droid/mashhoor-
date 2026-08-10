// Small reusable "لون الخط" (font color) control — a tiny square swatch,
// used next to any text field across the admin forms (categories, items,
// extras, offers, poll/fastfood/signature cards, site identity...).
// Deliberately compact: this picks the color of a piece of text, not a
// full-width control like the card accent-color pickers elsewhere.
export default function TextColorField({
  value,
  onChange,
  label = 'لون الخط',
}: {
  value?: string;
  onChange: (color: string | undefined) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <label className="text-white/50 text-[11px] flex items-center gap-1.5 cursor-pointer">
        {label}:
        <input
          type="color"
          value={value || '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="w-4 h-4 rounded-sm border border-white/20 bg-transparent cursor-pointer p-0 shrink-0"
        />
      </label>
      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="text-white/40 text-[11px] underline"
        >
          الأصلي
        </button>
      )}
    </div>
  );
}
