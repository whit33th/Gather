type ThemePresetCardProps = {
  active: boolean;
  description: string;
  label: string;
  onClick: () => void;
  preview: [string, string, string];
};

export function ThemePresetCard({ active, description, label, onClick, preview }: ThemePresetCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.5rem] border p-4 text-left transition ${active
        ? "border-[var(--accent)] bg-white/[0.08] shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
        : "border-white/10 bg-white/[0.04] hover:border-white/18 hover:bg-white/[0.06]"
        }`}
    >
      <div className="flex items-center gap-2">
        {preview.map((color) => (
          <span
            key={color}
            className="h-4 w-4 rounded-full border border-white/10"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <p className="mt-4 text-base font-semibold tracking-[-0.04em] text-white">{label}</p>
      <p className="mt-2 text-sm leading-6 text-white/58">{description}</p>
    </button>
  );
}
