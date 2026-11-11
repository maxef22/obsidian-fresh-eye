import { MarkdownView, Notice, Plugin } from 'obsidian';
import type { EditorView } from '@codemirror/view';

import { createFreshEyeExtension, refreshEffect } from './editor.ts';
import { DEFAULT_SETTINGS, FreshEyeSettingTab } from './settings.ts';
import type { FreshEyeSettings } from './settings.ts';

const STATUS_IDLE = 'Свежий взгляд';

export default class FreshEyePlugin extends Plugin {
  settings: FreshEyeSettings = { ...DEFAULT_SETTINGS };

  private statusBar: HTMLElement | null = null;
  private lastCount = 0;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.statusBar = this.addStatusBarItem();
    this.statusBar.addClass('fe-status');
    this.statusBar.setText(STATUS_IDLE);

    this.registerEditorExtension(
      createFreshEyeExtension({
        getSettings: () => this.settings,
        onReport: (view, count) => this.report(view, count),
      }),
    );

    this.addSettingTab(new FreshEyeSettingTab(this.app, this));

    this.addCommand({
      id: 'check-note',
      name: 'Проверить заметку',
      callback: () => {
        this.refreshActive();
        new Notice(
          this.lastCount === 0 ? 'Свежий взгляд: находок нет' : `Свежий взгляд: находок ${this.lastCount}`,
        );
      },
    });

    this.addCommand({
      id: 'toggle-live-check',
      name: 'Включить или выключить проверку при наборе',
      callback: async () => {
        this.settings.liveCheck = !this.settings.liveCheck;
        await this.saveSettings();
        new Notice(
          this.settings.liveCheck ? 'Проверка при наборе включена' : 'Проверка при наборе выключена',
        );
      },
    });

    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.refreshActive()));
    this.app.workspace.onLayoutReady(() => this.refreshActive());
  }

  onunload(): void {
    this.statusBar?.remove();
    this.statusBar = null;
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.refreshAll();
  }

  private report(view: EditorView, count: number): void {
    const active = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!active || this.editorView(active) !== view) return;

    this.lastCount = count;
    this.statusBar?.setText(count > 0 ? `${STATUS_IDLE}: ${count}` : STATUS_IDLE);
  }

  private editorView(view: MarkdownView): EditorView | undefined {
    // `Editor.cm` is the underlying CodeMirror view; it is not part of the public typings.
    return (view.editor as unknown as { cm?: EditorView }).cm;
  }

  private refreshActive(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;
    this.editorView(view)?.dispatch({ effects: refreshEffect.of(null) });
  }

  private refreshAll(): void {
    for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
      const view = leaf.view;
      if (view instanceof MarkdownView) {
        this.editorView(view)?.dispatch({ effects: refreshEffect.of(null) });
      }
    }
  }
}
