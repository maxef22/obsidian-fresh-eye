import { RangeSetBuilder, StateEffect } from '@codemirror/state';
import { Decoration, ViewPlugin } from '@codemirror/view';
import type { DecorationSet, EditorView, PluginValue, ViewUpdate } from '@codemirror/view';

import { checkProse } from './prose.ts';
import { clusterFindings, describeCluster } from '../core/cluster.ts';
import type { Cluster } from '../core/cluster.ts';
import type { FreshEyeSettings } from './settings.ts';

/** Dispatched to force a recheck, for example from a command or after a settings change. */
export const refreshEffect = StateEffect.define<null>();

const DEBOUNCE_MS = 400;

function buildDecorations(clusters: readonly Cluster[]): DecorationSet {
  const items = clusters
    .flatMap((cluster) => cluster.spans.map((span) => ({ span, cluster })))
    .sort((a, b) => a.span.start - b.span.start);

  const builder = new RangeSetBuilder<Decoration>();
  let lastEnd = -1;

  for (const { span, cluster } of items) {
    // CodeMirror requires sorted, non-overlapping ranges.
    if (span.start < lastEnd) continue;

    const strong = cluster.maxBadness >= 1000;
    builder.add(
      span.start,
      span.end,
      Decoration.mark({
        class: strong ? 'fe-hit fe-hit-strong' : 'fe-hit',
        attributes: { title: `${describeCluster(cluster)} · ${Math.round(cluster.maxBadness)}` },
      }),
    );
    lastEnd = span.end;
  }

  return builder.finish();
}

export interface FreshEyeExtensionOptions {
  readonly getSettings: () => FreshEyeSettings;
  readonly onReport: (view: EditorView, count: number) => void;
}

/** Editor extension that underlines words taking part in a suspicious pair. */
export function createFreshEyeExtension(options: FreshEyeExtensionOptions) {
  class FreshEyeViewPlugin implements PluginValue {
    decorations: DecorationSet = Decoration.none;
    private readonly view: EditorView;
    private timer: ReturnType<typeof setTimeout> | null = null;

    constructor(view: EditorView) {
      this.view = view;
      this.rebuild(false);
    }

    update(update: ViewUpdate): void {
      const forced = update.transactions.some((tr) => tr.effects.some((e) => e.is(refreshEffect)));
      if (forced) {
        this.cancel();
        this.rebuild(true);
        return;
      }
      if (update.docChanged) this.schedule();
    }

    destroy(): void {
      this.cancel();
    }

    private schedule(): void {
      this.cancel();
      this.timer = setTimeout(() => {
        this.timer = null;
        this.rebuild(false);
      }, DEBOUNCE_MS);
    }

    private cancel(): void {
      if (this.timer !== null) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }

    private rebuild(force: boolean): void {
      const settings = options.getSettings();

      if (!force && !settings.liveCheck) {
        this.decorations = Decoration.none;
        options.onReport(this.view, 0);
        return;
      }

      const text = this.view.state.doc.toString();
      const findings = checkProse(text, {
        contextSize: settings.contextSize,
        sensitivityThreshold: settings.threshold,
        excludeProperNames: settings.excludeProperNames,
      });
      const clusters = clusterFindings(findings);

      this.decorations = buildDecorations(clusters);

      options.onReport(this.view, findings.length);
    }

  }

  return ViewPlugin.fromClass(FreshEyeViewPlugin, {
    decorations: (value: FreshEyeViewPlugin) => value.decorations,
  });
}
