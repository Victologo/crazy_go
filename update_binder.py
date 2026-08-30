import re

with open('src/events/SetupEventBinder.ts', 'r', encoding='utf-8') as f:
    content = f.read()

p34_block = '''
        document.getElementById("btn-setup-p3-prev")?.addEventListener("click", () => {
            if (!tempConfig.enemyHeroIds) tempConfig.enemyHeroIds = {2: 'normal', 3: 'normal', 4: 'normal'};
            const currentHero = (tempConfig.enemyHeroIds[3] && !tempConfig.enemyHeroIds[3].startsWith('random') ? tempConfig.enemyHeroIds[3] : "normal") as HeroId;
            let idx = heroes.indexOf(currentHero);
            if (idx === -1) idx = 0;
            tempConfig.enemyHeroIds[3] = heroes[(idx - 1 + heroes.length) % heroes.length];
            refreshUI();
            SoundFX.playPlaceStone();
        });
        document.getElementById("btn-setup-p3-next")?.addEventListener("click", () => {
            if (!tempConfig.enemyHeroIds) tempConfig.enemyHeroIds = {2: 'normal', 3: 'normal', 4: 'normal'};
            const currentHero = (tempConfig.enemyHeroIds[3] && !tempConfig.enemyHeroIds[3].startsWith('random') ? tempConfig.enemyHeroIds[3] : "normal") as HeroId;
            let idx = heroes.indexOf(currentHero);
            if (idx === -1) idx = 0;
            tempConfig.enemyHeroIds[3] = heroes[(idx + 1) % heroes.length];
            refreshUI();
            SoundFX.playPlaceStone();
        });

        document.getElementById("btn-setup-p4-prev")?.addEventListener("click", () => {
            if (!tempConfig.enemyHeroIds) tempConfig.enemyHeroIds = {2: 'normal', 3: 'normal', 4: 'normal'};
            const currentHero = (tempConfig.enemyHeroIds[4] && !tempConfig.enemyHeroIds[4].startsWith('random') ? tempConfig.enemyHeroIds[4] : "normal") as HeroId;
            let idx = heroes.indexOf(currentHero);
            if (idx === -1) idx = 0;
            tempConfig.enemyHeroIds[4] = heroes[(idx - 1 + heroes.length) % heroes.length];
            refreshUI();
            SoundFX.playPlaceStone();
        });
        document.getElementById("btn-setup-p4-next")?.addEventListener("click", () => {
            if (!tempConfig.enemyHeroIds) tempConfig.enemyHeroIds = {2: 'normal', 3: 'normal', 4: 'normal'};
            const currentHero = (tempConfig.enemyHeroIds[4] && !tempConfig.enemyHeroIds[4].startsWith('random') ? tempConfig.enemyHeroIds[4] : "normal") as HeroId;
            let idx = heroes.indexOf(currentHero);
            if (idx === -1) idx = 0;
            tempConfig.enemyHeroIds[4] = heroes[(idx + 1) % heroes.length];
            refreshUI();
            SoundFX.playPlaceStone();
        });
'''

# insert after btn-setup-p2-next
target = '''        document.getElementById("btn-setup-p2-next")?.addEventListener("click", () => {
            const currentHero = (tempConfig.enemyHeroId && !tempConfig.enemyHeroId.startsWith('random') ? tempConfig.enemyHeroId : "normal") as HeroId;
            let idx = heroes.indexOf(currentHero);
            if (idx === -1) idx = 0;
            tempConfig.enemyHeroId = heroes[(idx + 1) % heroes.length];
            refreshUI();
            SoundFX.playPlaceStone();
        });'''

content = content.replace(target, target + '\n' + p34_block)

with open('src/events/SetupEventBinder.ts', 'w', encoding='utf-8') as f:
    f.write(content)
