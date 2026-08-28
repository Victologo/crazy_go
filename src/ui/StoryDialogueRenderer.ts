import { type StoryDialogueLine } from '../story/StoryCampaign';
import type { HeroId } from '../types';
import { getLanguage } from '../i18n/i18n';
import { SoundFX } from '../audio/SoundFX';

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

            // Click to dismiss/advance
            container.addEventListener('click', (e) => {
                // Si el clic fue en un modal de selección de poder, no avanzar diálogo
                if ((e.target as HTMLElement).closest('.story-power-container')) return;
                StoryDialogueRenderer.hide();
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
        const hintText = getLanguage() === 'en' ? 'Click to continue...' : 'Haz clic para continuar...';
        
        container.innerHTML = `
            <div class="story-dialogue-box ${line.position}">
                ${(isLeft && hasImage) ? `<img src="${line.speakerImage}" class="story-portrait left-portrait" onerror="this.style.display='none'" />` : ''}
                <div class="story-text-content">
                    <div class="story-speaker-name">${line.speakerName}</div>
                    <div class="story-text-body">${line.text}</div>
                    <div class="story-continue-hint">${hintText}</div>
                </div>
                ${(!isLeft && hasImage) ? `<img src="${line.speakerImage}" class="story-portrait right-portrait" onerror="this.style.display='none'" />` : ''}
            </div>
        `;
    }

    /**
     * Muestra el modal interactivo de selección de poder místico tras sellar la reliquia
     */
    public static showPowerDraftModal(onSelected: (heroId: HeroId) => void): Promise<HeroId> {
        return new Promise((resolve) => {
            const isEn = getLanguage() === 'en';

            const title = isEn ? '⚡ Awakening of the Primordial Qi' : '⚡ Despertar del Qi Primordial';
            const subtitle = isEn 
                ? 'The sacred relic has resonated with your soul. Choose which Grand Master blessing or Champion skill to master:' 
                : 'La reliquia sagrada ha resonado con tu alma. Elige qué bendición de los Grandes Maestros o habilidad de Campeón dominar:';

            const powers: Array<{ id: HeroId; name: string; skill: string; badge: string; desc: string; avatar: string }> = [
                {
                    id: 'tengu',
                    name: isEn ? 'Tengu the Crow' : 'Tengu el Cuervo',
                    skill: isEn ? 'Meteor Rain ☄️' : 'Lluvia Meteórica ☄️',
                    badge: isEn ? 'Active (1 Charge)' : 'Activa (1 Carga)',
                    desc: isEn ? 'Summons an astral meteor storm destroying enemy stones in a strategic area.' : 'Invoca una lluvia meteórica que destruye piedras enemigas en un área estratégica.',
                    avatar: './heroes/tengu_face.jpg'
                },
                {
                    id: 'alchemist',
                    name: isEn ? 'Mystic Alchemist' : 'Alquimista Místico',
                    skill: isEn ? 'Chromatic Inversion 🔄' : 'Inversión Cromática 🔄',
                    badge: isEn ? 'Active (1 Charge)' : 'Activa (1 Carga)',
                    desc: isEn ? 'Transmutes enemy stones into your own Qi, instantly resolving cascade captures.' : 'Transmuta piedras del rival al color de tu propio Qi, resolviendo capturas en cascada.',
                    avatar: './heroes/alchemist_face.jpg'
                },
                {
                    id: 'kitsune',
                    name: isEn ? 'Celestial Kitsune' : 'Kitsune Celestial',
                    skill: isEn ? 'Divine Shield 🛡️' : 'Escudo Divino 🛡️',
                    badge: isEn ? 'Active (3 Charges)' : 'Activa (3 Cargas)',
                    desc: isEn ? 'Consecrates your stones making them indestructible and immune to capture for 2 turns.' : 'Consagra tus piedras haciéndolas indestructibles e inmunes a capturas durante 2 turnos.',
                    avatar: './heroes/kitsune_face.jpg'
                },
                {
                    id: 'ryujin',
                    name: isEn ? 'Dragon God Ryūjin' : 'Dios Dragón Ryūjin',
                    skill: isEn ? 'Dragon Fury 🔥' : 'Furia del Dragón 🔥',
                    badge: isEn ? 'Passive (True Eyes)' : 'Pasiva (Ojos Vivos)',
                    desc: isEn ? 'Upon forming 2+ alive eyes or groups, incinerates and obliterates rival stones.' : 'Al formar 2 o más ojos vivos en el Goban, calcina y destruye piedras enemigas.',
                    avatar: './heroes/ryujin_face.jpg'
                },
                {
                    id: 'ronin',
                    name: isEn ? 'Storm Ronin' : 'Ronin de la Tormenta',
                    skill: isEn ? 'Samurai Blade ⚔️' : 'Filo del Samurai ⚔️',
                    badge: isEn ? 'Passive (Every 25 Turns)' : 'Pasiva (Cada 25 Turnos)',
                    desc: isEn ? 'Unsheathes a spirit katana slicing and destroying random enemy stones.' : 'Desenvaina su katana cada 25 turnos y corta automáticamente una piedra rival.',
                    avatar: './heroes/ronin_face.jpg'
                }
            ];

            const overlay = document.createElement('div');
            overlay.className = 'story-power-overlay';
            overlay.innerHTML = `
                <div class="story-power-container">
                    <div class="story-power-header">
                        <div class="story-power-title">${title}</div>
                        <div class="story-power-subtitle">${subtitle}</div>
                    </div>
                    <div class="story-power-cards">
                        ${powers.map(p => `
                            <div class="story-power-card" data-hero="${p.id}">
                                <img src="${p.avatar}" class="story-power-avatar" onerror="this.src='./heroes/normal_face.jpg'" />
                                <div class="story-power-hero-name">${p.name}</div>
                                <div class="story-power-skill-badge">${p.skill}</div>
                                <div class="story-power-desc">${p.desc}</div>
                                <button class="story-power-btn">${isEn ? '⚡ Select Power' : '⚡ Elegir Poder'}</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            overlay.querySelectorAll('.story-power-card').forEach(card => {
                card.addEventListener('click', () => {
                    const heroId = card.getAttribute('data-hero') as HeroId;
                    SoundFX.playSpecial();
                    overlay.remove();
                    onSelected(heroId);
                    resolve(heroId);
                });
            });
        });
    }
}
