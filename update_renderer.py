import re

with open('src/ui/modals/SetupModalRenderer.ts', 'r', encoding='utf-8') as f:
    content = f.read()

four_players_logic = '''
        const stageViewport = document.getElementById('wizard-scenery-stage-viewport');
        if (stageViewport) {
            stageViewport.style.backgroundImage = `url('./bg_${config.background || 'combat'}.jpg')`;
            if (config.playerCount === 4) {
                stageViewport.classList.add('four-players');
                document.getElementById('wizard-stage-p3-combatant')?.classList.remove('hidden');
                document.getElementById('wizard-stage-p4-combatant')?.classList.remove('hidden');
                
                const p3HeroId = (config.enemyHeroIds && config.enemyHeroIds[3] ? config.enemyHeroIds[3] : 'normal');
                const p4HeroId = (config.enemyHeroIds && config.enemyHeroIds[4] ? config.enemyHeroIds[4] : 'normal');

                const p3Hero = RoguelikeRunManager.HEROES[p3HeroId as import('../types').HeroId] || RoguelikeRunManager.HEROES['normal'];
                const p4Hero = RoguelikeRunManager.HEROES[p4HeroId as import('../types').HeroId] || RoguelikeRunManager.HEROES['normal'];
                
                const p3Img = document.getElementById('wizard-stage-p3-img') as HTMLImageElement;
                if (p3Img) p3Img.src = p3Hero.image || p3Hero.faceImage || './heroes/normal.png';
                
                const p4Img = document.getElementById('wizard-stage-p4-img') as HTMLImageElement;
                if (p4Img) p4Img.src = p4Hero.image || p4Hero.faceImage || './heroes/normal.png';
            } else {
                stageViewport.classList.remove('four-players');
                document.getElementById('wizard-stage-p3-combatant')?.classList.add('hidden');
                document.getElementById('wizard-stage-p4-combatant')?.classList.add('hidden');
            }
        }
'''

content = content.replace("""        const stageViewport = document.getElementById('wizard-scenery-stage-viewport');
        if (stageViewport) stageViewport.style.backgroundImage = `url('./bg_${config.background || 'combat'}.jpg')`;""", four_players_logic)

fix_step5_p2_logic = '''        const enemyHeroId = config.playerCount === 4 ? ((config.enemyHeroIds && config.enemyHeroIds[2]) ? config.enemyHeroIds[2] : 'normal') : (config.enemyHeroId || 'random');'''
content = content.replace("""        const enemyHeroId = config.enemyHeroId || 'random';""", fix_step5_p2_logic)

with open('src/ui/modals/SetupModalRenderer.ts', 'w', encoding='utf-8') as f:
    f.write(content)
