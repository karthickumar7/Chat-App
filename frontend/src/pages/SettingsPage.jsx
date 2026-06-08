import { useThemeStore } from "../components/useThemeStore";
import { THEMES } from "../components";

const SettingsPage = () => {
  const { theme, setTheme, soundMuted, toggleSoundMuted, soundPreset, setSoundPreset } = useThemeStore();

  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl">
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-sm text-base-content/70">Customize your chat experience</p>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              className={`group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${theme === t ? "bg-base-200" : "hover:bg-base-200/50"}`}
              onClick={() => setTheme(t)}
            >
              <div className="relative h-8 w-full rounded-md overflow-hidden" data-theme={t}>
                <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                  <div className="rounded bg-primary"></div>
                  <div className="rounded bg-secondary"></div>
                  <div className="rounded bg-accent"></div>
                  <div className="rounded bg-neutral"></div>
                </div>
              </div>
              <span className="text-[10px] font-medium truncate w-full text-center">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            </button>
          ))}
        </div>

        {/* Notification Sound Toggle & Preset Selector */}
        <div className="bg-base-200 p-4 rounded-xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Notification Sounds</h3>
              <p className="text-xs text-base-content/60">Play sound effects for incoming and outgoing messages</p>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary toggle-sm sm:toggle-md"
              checked={!soundMuted}
              onChange={toggleSoundMuted}
            />
          </div>

          {!soundMuted && (
            <div className="border-t border-base-300 pt-3">
              <h4 className="font-semibold text-xs mb-2 text-base-content/85">Sound Preset Alert Synthesizer</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "classic", label: "Classic Tone" },
                  { id: "retro", label: "8-Bit Retro" },
                  { id: "bubble", label: "Water Bubble" },
                  { id: "digital", label: "Digital Trill" }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSoundPreset(p.id)}
                    className={`btn btn-xs sm:btn-sm font-semibold ${soundPreset === p.id ? "btn-primary" : "btn-ghost bg-base-300 hover:bg-base-300/80"} text-xs rounded-lg`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview Section */}
        <h3 className="text-lg font-semibold mt-4">Preview</h3>
        <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
          <div className="p-4 bg-base-200">
            <div className="max-w-lg mx-auto">
              <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-base-300 bg-base-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">JD</div>
                  <div><h3 className="font-medium text-sm">John Doe</h3><p className="text-xs text-base-content/70">Online</p></div>
                </div>
                <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                  <div className="flex justify-start"><div className="max-w-[80%] rounded-xl p-3 shadow-sm bg-base-200 text-sm">Hey, how's the app coming along?</div></div>
                  <div className="flex justify-end"><div className="max-w-[80%] rounded-xl p-3 shadow-sm bg-primary text-primary-content text-sm">It's almost ready! Integrating themes now.</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;