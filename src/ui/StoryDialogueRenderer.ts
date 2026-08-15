import { type StoryDialogueLine } from '../story/StoryCampaign';
import { StoryController } from '../story/StoryController';

export class StoryDialogueRenderer {
    private static containerId = 'story-dialogue-overlay';

    public static show() {
        let container = document.getElementById(this.containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = this.containerId;
            container.className = 'story-dialogue-overlay';
            
            const gameScreen = document.getElementById('game-screen');
            if (gameScreen) {
                gameScreen.appendChild(container);
            }

            // Click to advance
            container.addEventListener('click', () => {
                StoryController.advanceDialogue();
            });
        }
        container.style.display = 'flex';
        container.classList.remove('hidden');
    }

    public static hide() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.style.display = 'none';
            container.classList.add('hidden');
            container.innerHTML = '';
        }
    }

    public static renderLine(line: StoryDialogueLine) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const isLeft = line.position === 'left';
        const hasImage = line.speakerImage && line.speakerImage.length > 0;
        
        container.innerHTML = `
            <div class="story-dialogue-box ${line.position}">
                ${(isLeft && hasImage) ? `<img src="${line.speakerImage}" class="story-portrait left-portrait" onerror="this.style.display='none'" />` : ''}
                <div class="story-text-content">
                    <div class="story-speaker-name">${line.speakerName}</div>
                    <div class="story-text-body">${line.text}</div>
                    <div class="story-continue-hint">Haz clic para continuar...</div>
                </div>
                ${(!isLeft && hasImage) ? `<img src="${line.speakerImage}" class="story-portrait right-portrait" onerror="this.style.display='none'" />` : ''}
            </div>
        `;
    }
}
