import { create } from "zustand";

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem("chat-theme") || "coffee",
  soundMuted: localStorage.getItem("chat-sound-muted") === "true",
  soundPreset: localStorage.getItem("chat-sound-preset") || "classic",
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },
  toggleSoundMuted: () => {
    const current = get().soundMuted;
    localStorage.setItem("chat-sound-muted", (!current).toString());
    set({ soundMuted: !current });
  },
  setSoundPreset: (preset) => {
    localStorage.setItem("chat-sound-preset", preset);
    set({ soundPreset: preset });
  },
}));