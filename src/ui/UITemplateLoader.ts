import modalTutorialHtml from './templates/modal-tutorial.html?raw';
import modalOnlineHtml from './templates/modal-online.html?raw';
import modalRoguelikeSetupHtml from './templates/modal-roguelike-setup.html?raw';
import modalRogueChoiceHtml from './templates/modal-rogue-choice.html?raw';
import modalLocalSetupHtml from './templates/modal-local-setup.html?raw';
import modalOptionsHtml from './templates/modal-options.html?raw';
import modalScoreHtml from './templates/modal-score.html?raw';
import modalSandboxHtml from './templates/modal-sandbox.html?raw';
import modalStoryHtml from './templates/modal-story.html?raw';
import modalColorPickerHtml from './templates/modal-color-picker.html?raw';

export class UITemplateLoader {
    /**
     * Inyecta todos los modales HTML extraídos síncronamente en el DOM
     * Garantiza que estén disponibles antes de vincular eventos.
     */
    public static loadAll() {
        const container = document.getElementById('modals-container');
        if (!container) {
            console.error('CRITICAL: modals-container no encontrado en index.html');
            return;
        }

        // Inserción síncrona y eficiente
        const combinedHtml = 
            modalTutorialHtml + 
            modalOnlineHtml + 
            modalRoguelikeSetupHtml + 
            modalRogueChoiceHtml + 
            modalLocalSetupHtml + 
            modalOptionsHtml + 
            modalScoreHtml + 
            modalSandboxHtml + 
            modalStoryHtml +
            modalColorPickerHtml;

        container.insertAdjacentHTML('beforeend', combinedHtml);
        console.log('✅ UI Templates cargados correctamente vía Vite ?raw');
    }
}
