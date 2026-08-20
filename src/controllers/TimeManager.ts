// controllers/TimeManager.ts — Gestión del Temporizador de Partida (Byo-Yomi, Absoluto, Fischer, Japonés)
import type { PlayerId, GameSetupConfig } from '../types';
import { GameState } from '../core/GameState';
import { HUDController } from '../ui/HUDController';
import { SoundFX } from '../audio/SoundFX';
import { getLanguage } from '../i18n/i18n';

export class TimeManager {
    private static timerInterval: any = null;

    /**
     * Inicializa (o reinicia) el temporizador para la partida actual.
     * @param config       Configuración actual de la partida.
     * @param state        Estado actual de la partida.
     * @param onByoYomi    Callback cuando el tiempo por jugada expira → llama a passTurn + checkAITurn.
     * @param onFlagFallen Callback cuando el tiempo absoluto expira → llama a showFinalScoreModal.
     */
    public static init(
        config: GameSetupConfig,
        state: GameState,
        onByoYomi: () => void,
        onFlagFallen: () => void
    ): void {
        // Detener timer previo si existe
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        const timer = config.timer;
        if (!timer || timer.mode === 'none') {
            HUDController.updateTimers(state.playerTimers, state.currentPlayer, 'none');
            return;
        }

        for (let p = 1; p <= config.playerCount; p++) {
            const pid = p as PlayerId;
            const initialSecs = timer.mode === 'per_move' ? timer.byoYomiSeconds : timer.mainTimeSeconds;
            state.playerTimers[pid] = {
                timeRemainingSeconds: initialSecs,
                movesCount: 0,
                isFlagFallen: false,
                byoYomiPeriodsLeft: timer.mode === 'japanese' ? (timer.byoYomiPeriods || 3) : undefined,
                isInByoYomi: false
            };
        }

        HUDController.updateTimers(state.playerTimers, state.currentPlayer, timer.mode);

        this.timerInterval = window.setInterval(() => {
            if (state.isGameOver) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
                return;
            }

            const cp = state.currentPlayer;
            const curTimer = state.playerTimers[cp];
            if (!curTimer) return;

            curTimer.timeRemainingSeconds = Math.max(0, curTimer.timeRemainingSeconds - 1);
            HUDController.updateTimers(state.playerTimers, cp, timer.mode);

            // Pulso sonoro de tic-tac en los últimos 5 segundos (tensión de Byo-yomi)
            if (curTimer.timeRemainingSeconds <= 5 && curTimer.timeRemainingSeconds > 0) {
                SoundFX.playClockTick(curTimer.timeRemainingSeconds <= 2);
            }

            if (curTimer.timeRemainingSeconds <= 0) {
                const isEnNow = getLanguage() === 'en';

                if (timer.mode === 'per_move') {
                    curTimer.timeRemainingSeconds = timer.byoYomiSeconds;
                    HUDController.showAlert(
                        isEnNow
                            ? '⏰ Move time expired! Turn automatically passed.'
                            : '⏰ ¡Tiempo por jugada agotado! Pase automático de turno.'
                    );
                    SoundFX.playIllegal();
                    onByoYomi();
                } else if (timer.mode === 'japanese') {
                    if (!curTimer.isInByoYomi) {
                        // Transición de tiempo principal a Byo-yomi
                        curTimer.isInByoYomi = true;
                        curTimer.timeRemainingSeconds = timer.byoYomiSeconds;
                        HUDController.showAlert(
                            isEnNow
                                ? `⏱️ Main time expired! Entering Byo-yomi (${curTimer.byoYomiPeriodsLeft} periods of ${timer.byoYomiSeconds}s).`
                                : `⏱️ ¡Tiempo principal agotado! Entrando en Byo-yomi (${curTimer.byoYomiPeriodsLeft} periodos de ${timer.byoYomiSeconds}s).`
                        );
                        SoundFX.playClockTick(true);
                    } else {
                        // Consumo de 1 periodo de Byo-yomi
                        curTimer.byoYomiPeriodsLeft = (curTimer.byoYomiPeriodsLeft || 1) - 1;
                        if (curTimer.byoYomiPeriodsLeft > 0) {
                            curTimer.timeRemainingSeconds = timer.byoYomiSeconds;
                            HUDController.showAlert(
                                isEnNow
                                    ? `⏰ Byo-yomi period lost! ${curTimer.byoYomiPeriodsLeft} period(s) remaining.`
                                    : `⏰ ¡Periodo de Byo-yomi consumido! Te quedan ${curTimer.byoYomiPeriodsLeft} periodos.`
                            );
                            SoundFX.playIllegal();
                            onByoYomi();
                        } else {
                            // Sin periodos restantes: bandera caída
                            curTimer.isFlagFallen = true;
                            clearInterval(this.timerInterval);
                            this.timerInterval = null;
                            HUDController.showAlert(
                                isEnNow
                                    ? '⏱️ All Byo-yomi periods expired! Flag fallen.'
                                    : '⏱️ ¡Todos los periodos de Byo-yomi agotados! Bandera caída.'
                            );
                            SoundFX.playIllegal();
                            onFlagFallen();
                        }
                    }
                } else {
                    // Absolute o Fischer: bandera caída
                    curTimer.isFlagFallen = true;
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                    HUDController.showAlert(
                        isEnNow
                            ? '⏱️ Flag fallen! Time expired.'
                            : '⏱️ ¡Bandera caída! Tiempo agotado.'
                    );
                    SoundFX.playIllegal();
                    onFlagFallen();
                }
            }
        }, 1000);
    }

    /**
     * Llamar cuando un jugador completa una jugada o pasa turno para aplicar incrementos o reinicios de Byo-yomi.
     */
    public static onMovePlaced(config: GameSetupConfig, state: GameState, playerId: PlayerId): void {
        const timer = config.timer;
        if (!timer || timer.mode === 'none') return;

        const pTimer = state.playerTimers[playerId];
        if (!pTimer) return;

        pTimer.movesCount = (pTimer.movesCount || 0) + 1;

        if (timer.mode === 'per_move') {
            pTimer.timeRemainingSeconds = timer.byoYomiSeconds;
        } else if (timer.mode === 'fischer') {
            pTimer.timeRemainingSeconds += timer.incrementSeconds;
        } else if (timer.mode === 'japanese' && pTimer.isInByoYomi) {
            // En Byo-yomi japonés, jugar a tiempo reinicia el reloj del periodo actual sin perderlo
            pTimer.timeRemainingSeconds = timer.byoYomiSeconds;
        }

        HUDController.updateTimers(state.playerTimers, state.currentPlayer, timer.mode);
    }

    /** Detiene el intervalo del temporizador activo (llamar al abandonar o finalizar partida). */
    public static stop(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
}
