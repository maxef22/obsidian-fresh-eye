import { PluginSettingTab, Setting } from 'obsidian';
import type { App } from 'obsidian';
import type FreshEyePlugin from './main.ts';

export interface FreshEyeSettings {
  /** Pairs with badness below this value are ignored. */
  threshold: number;
  /** How many preceding words each word is compared with. */
  contextSize: number;
  /** Skip capitalized words that are not at the start of a sentence. */
  excludeProperNames: boolean;
  /** Recheck the note while typing. */
  liveCheck: boolean;
}

export const DEFAULT_SETTINGS: FreshEyeSettings = {
  threshold: 800,
  contextSize: 20,
  excludeProperNames: false,
  liveCheck: true,
};

export class FreshEyeSettingTab extends PluginSettingTab {
  private readonly plugin: FreshEyePlugin;

  constructor(app: App, plugin: FreshEyePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Порог чувствительности')
      .setDesc(
        'Чем ниже, тем больше находок. 400 — как в оригинальной программе (много шума), 800 — рабочий режим для прозы, 1000 — только очевидные повторы.',
      )
      .addSlider((slider) =>
        slider
          .setLimits(400, 1400, 50)
          .setValue(this.plugin.settings.threshold)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.threshold = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Размер окна')
      .setDesc('С каким количеством предыдущих слов сравнивать каждое слово. По умолчанию 20.')
      .addSlider((slider) =>
        slider
          .setLimits(5, 40, 1)
          .setValue(this.plugin.settings.contextSize)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.contextSize = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Не подсвечивать имена собственные')
      .setDesc('Пропускать слова с заглавной буквы, если они не в начале предложения.')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.excludeProperNames).onChange(async (value) => {
          this.plugin.settings.excludeProperNames = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName('Проверять при наборе')
      .setDesc('Если выключить, проверка будет запускаться только командой «Проверить заметку».')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.liveCheck).onChange(async (value) => {
          this.plugin.settings.liveCheck = value;
          await this.plugin.saveSettings();
        }),
      );
  }
}
