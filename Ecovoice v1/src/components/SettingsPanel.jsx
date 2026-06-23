import React, { useState, useEffect } from 'react';
import { Volume2, Settings, MessageSquare, Gauge, Palette } from 'lucide-react';

const DEFAULT_SETTINGS = {
  voiceEnabled: true,
  speed: 0.92,
  volume: 1.0,
  theme: 'cream',
};

export default function SettingsPanel() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('ecovoice:settings');
      if (raw) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }, []);

  const updateSetting = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      window.localStorage.setItem('ecovoice:settings', JSON.stringify(next));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }

    // Apply theme change in real-time if key is 'theme'
    if (key === 'theme') {
      applyTheme(value);
    }
  };

  const applyTheme = (themeName) => {
    // Implement mock theme class switching on document body or root
    const body = document.body;
    body.className = body.className.replace(/\btheme-\S+/g, '');
    body.classList.add(`theme-${themeName}`);
    console.log(`[Theme] Switched to: ${themeName}`);
  };

  return (
    <div className="flex flex-col h-full mt-4 sm:mt-6 min-h-[450px]">
      {/* Header */}
      <div className="mb-6 px-1 shrink-0">
        <h2 className="text-xl sm:text-2xl font-bold text-stone-800">Settings</h2>
        <p className="text-xs text-stone-400 mt-0.5">Customize your voice assistant and interface preferences</p>
      </div>

      <div className="space-y-4 px-1 max-w-xl pb-4">
        {/* Voice Feedback Toggle */}
        <div className="bg-white border border-stone-200/60 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-forest-50 flex items-center justify-center text-forest-700">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-stone-700">Voice Feedback</span>
              <span className="text-[10px] text-stone-400 mt-0.5 block">Let EcoVoice speak responses to your commands</span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.voiceEnabled}
              onChange={(e) => updateSetting('voiceEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-forest-600"></div>
          </label>
        </div>

        {/* Speech Speed Control */}
        <div className="bg-white border border-stone-200/60 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-forest-50 flex items-center justify-center text-forest-700">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-stone-700">Speech Speed</span>
              <span className="text-[10px] text-stone-400 mt-0.5 block">Adjust the pacing of TTS voice responses</span>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-1">
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              disabled={!settings.voiceEnabled}
              value={settings.speed}
              onChange={(e) => updateSetting('speed', parseFloat(e.target.value))}
              className="flex-1 accent-forest-700 h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
            <span className={`text-xs font-semibold w-8 text-right font-mono ${settings.voiceEnabled ? 'text-stone-600' : 'text-stone-300'}`}>
              {settings.speed.toFixed(1)}x
            </span>
          </div>
        </div>

        {/* Speech Volume Control */}
        <div className="bg-white border border-stone-200/60 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-forest-50 flex items-center justify-center text-forest-700">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-stone-700">Speech Volume</span>
              <span className="text-[10px] text-stone-400 mt-0.5 block">Adjust output volume of verbal feedback</span>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-1">
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              disabled={!settings.voiceEnabled}
              value={settings.volume}
              onChange={(e) => updateSetting('volume', parseFloat(e.target.value))}
              className="flex-1 accent-forest-700 h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
            <span className={`text-xs font-semibold w-8 text-right font-mono ${settings.voiceEnabled ? 'text-stone-600' : 'text-stone-300'}`}>
              {Math.round(settings.volume * 100)}%
            </span>
          </div>
        </div>

        {/* Theme Placeholder */}
        <div className="bg-white border border-stone-200/60 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-forest-50 flex items-center justify-center text-forest-700">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-stone-700">App Theme</span>
              <span className="text-[10px] text-stone-400 mt-0.5 block">Select interface visual theme styles</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { id: 'cream', name: 'Cream Default', color: 'bg-[#fbfbf9] border-stone-300 text-stone-700' },
              { id: 'dark', name: 'Classic Dark', color: 'bg-slate-900 border-slate-700 text-slate-300' },
              { id: 'forest', name: 'Eco Forest', color: 'bg-emerald-950 border-emerald-800 text-emerald-300' },
            ].map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => updateSetting('theme', theme.id)}
                className={`py-2 rounded-xl border text-[11px] font-semibold text-center transition-all ${
                  settings.theme === theme.id
                    ? `${theme.color} ring-2 ring-forest-600 ring-offset-2 shadow-sm`
                    : 'bg-white border-stone-200 text-stone-400 hover:bg-stone-50/50'
                }`}
              >
                {theme.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
