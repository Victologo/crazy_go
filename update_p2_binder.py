import re

with open('src/events/SetupEventBinder.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# For P2 prev
p2_prev_old = """        document.getElementById("btn-setup-p2-prev")?.addEventListener("click", () => {
            const currentHero = (tempConfig.enemyHeroId && !tempConfig.enemyHeroId.startsWith('random') ? tempConfig.enemyHeroId : "normal") as HeroId;
            let idx = heroes.indexOf(currentHero);
            if (idx === -1) idx = 0;
            tempConfig.enemyHeroId = heroes[(idx - 1 + heroes.length) % heroes.length];
            refreshUI();
            SoundFX.playPlaceStone();
        });"""
p2_prev_new = """        document.getElementById("btn-setup-p2-prev")?.addEventListener("click", () => {
            const currentHero = (tempConfig.enemyHeroId && !tempConfig.enemyHeroId.startsWith('random') ? tempConfig.enemyHeroId : "normal") as HeroId;
            let idx = heroes.indexOf(currentHero);
            if (idx === -1) idx = 0;
            const newHero = heroes[(idx - 1 + heroes.length) % heroes.length];
            tempConfig.enemyHeroId = newHero;
            if (!tempConfig.enemyHeroIds) tempConfig.enemyHeroIds = {2: 'normal', 3: 'normal', 4: 'normal'};
            tempConfig.enemyHeroIds[2] = newHero;
            refreshUI();
            SoundFX.playPlaceStone();
        });"""

content = content.replace(p2_prev_old, p2_prev_new)

# For P2 next
p2_next_old = """        document.getElementById("btn-setup-p2-next")?.addEventListener("click", () => {
            const currentHero = (tempConfig.enemyHeroId && !tempConfig.enemyHeroId.startsWith('random') ? tempConfig.enemyHeroId : "normal") as HeroId;
            let idx = heroes.indexOf(currentHero);
            if (idx === -1) idx = 0;
            tempConfig.enemyHeroId = heroes[(idx + 1) % heroes.length];
            refreshUI();
            SoundFX.playPlaceStone();
        });"""
p2_next_new = """        document.getElementById("btn-setup-p2-next")?.addEventListener("click", () => {
            const currentHero = (tempConfig.enemyHeroId && !tempConfig.enemyHeroId.startsWith('random') ? tempConfig.enemyHeroId : "normal") as HeroId;
            let idx = heroes.indexOf(currentHero);
            if (idx === -1) idx = 0;
            const newHero = heroes[(idx + 1) % heroes.length];
            tempConfig.enemyHeroId = newHero;
            if (!tempConfig.enemyHeroIds) tempConfig.enemyHeroIds = {2: 'normal', 3: 'normal', 4: 'normal'};
            tempConfig.enemyHeroIds[2] = newHero;
            refreshUI();
            SoundFX.playPlaceStone();
        });"""

content = content.replace(p2_next_old, p2_next_new)

# For P2 thumb strip
p2_thumb_old = """        document.querySelectorAll('#setup-p2-hero-thumb-strip .hero-thumb-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const h = btn.getAttribute('data-hero') as HeroId;
                if (h) {
                    tempConfig.enemyHeroId = h;
                    refreshUI();
                    SoundFX.playPlaceStone();
                }
            });
        });"""
p2_thumb_new = """        document.querySelectorAll('#setup-p2-hero-thumb-strip .hero-thumb-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const h = btn.getAttribute('data-hero') as HeroId;
                if (h) {
                    tempConfig.enemyHeroId = h;
                    if (!tempConfig.enemyHeroIds) tempConfig.enemyHeroIds = {2: 'normal', 3: 'normal', 4: 'normal'};
                    tempConfig.enemyHeroIds[2] = h;
                    refreshUI();
                    SoundFX.playPlaceStone();
                }
            });
        });"""
content = content.replace(p2_thumb_old, p2_thumb_new)

with open('src/events/SetupEventBinder.ts', 'w', encoding='utf-8') as f:
    f.write(content)
