import { StoryModeController } from './StoryModeController';

export class StoryDebugUI {
    public static init(): void {
        // ── Collapse/expand the debug body ──────────────────────────────────
        const toggleBtn = document.getElementById('btn-story-debug-toggle');
        const body = document.getElementById('story-debug-body');
        const arrow = document.getElementById('story-debug-arrow');
        toggleBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = body?.classList.toggle('hidden');
            if (arrow) arrow.textContent = isHidden ? '▼' : '▲';
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!body?.classList.contains('hidden')) {
                const target = e.target as HTMLElement;
                if (!target.closest('#story-debug-panel')) {
                    body?.classList.add('hidden');
                    if (arrow) arrow.textContent = '▼';
                }
            }
        });

        // ── Jump to chapter ─────────────────────────────────────────────────
        document.getElementById('btn-story-debug-jump')?.addEventListener('click', () => {
            const sel = document.getElementById('story-debug-chapter') as HTMLSelectElement | null;
            if (!sel) return;
            const idx = parseInt(sel.value, 10);
            if (!isNaN(idx)) StoryModeController.loadChapter(idx);
        });

        // ── Win / Lose ──────────────────────────────────────────────────────
        document.getElementById('btn-story-debug-win')?.addEventListener('click', () =>
            StoryModeController.onWinCurrentChapter());
        document.getElementById('btn-story-debug-lose')?.addEventListener('click', () =>
            StoryModeController.onLoseCurrentChapter());

        // ── Effect tests ────────────────────────────────────────────────────
        document.getElementById('btn-story-debug-earthquake')?.addEventListener('click', () =>
            StoryModeController.debugTestEarthquake());
        document.getElementById('btn-story-debug-dialogue-left')?.addEventListener('click', () =>
            StoryModeController.debugTestDialogue('left'));
        document.getElementById('btn-story-debug-dialogue-right')?.addEventListener('click', () =>
            StoryModeController.debugTestDialogue('right'));
        document.getElementById('btn-story-debug-alert')?.addEventListener('click', () =>
            StoryModeController.debugTestAlert());
        document.getElementById('btn-story-debug-shatter')?.addEventListener('click', () =>
            StoryModeController.debugTestShatter());

        // ── Cinematic intro replay ──────────────────────────────────────────
        document.getElementById('btn-story-debug-intro')?.addEventListener('click', () =>
            StoryModeController.showCinematicIntro(false));

        // ── Keyboard toggle ~ / F3 ──────────────────────────────────────────
        window.addEventListener('keydown', (e) => {
            if ((e.key === '~' || e.key === '`' || e.key === 'F3') && StoryModeController.isStoryActive) {
                document.getElementById('story-debug-panel')?.classList.toggle('hidden');
            }
        });
    }
}
