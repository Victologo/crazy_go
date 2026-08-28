# 🌋 Crazy Go Mega Update: 3 Living Dynamic Boards, Maw Devouring, Real-Time Sound Synthesis & Interactive Dojo!

Hey everyone! 👋 

We’ve had an enormous development cycle, and we’re beyond thrilled to drop one of our biggest updates yet for **Crazy Go**! 

Whether you love pure canonical Japanese Go or want wild tactical roguelite chaos with champions and spells, today's update brings massive new game modes, 3 living dynamic boards, visceral procedural audio, and a completely restructured Dojo to learn and master the game.

Here is the complete tour of what’s new! 👇

---

## 🌋 1. Three New "Living" Dynamic Boards (Volcano, Sky & Oni Mask)

We’ve added three full standalone board topologies, each with its own living ecosystem and unique board hazards that turn traditional Go strategy completely on its head:

### 🌋 The Volcano Board (`Volcano`)
* **Diegetic Magma Calderas**: The 4 corners of the goban are forged from dark basalt volcanic rock with glowing molten lava cracks and active smoke plumes.
* **Falling Magma Meteors**: Every 20 total turns, a fiery meteor projectile plunges from the sky, detonating an intersection and turning the ground into a scorched crater.
* **Topological Asphyxiation**: Any enemy (or allied!) group that loses its last remaining liberty due to the newly created lava hole is instantly suffocated and captured!

### ☁️ The Sky Board (`Sky`)
* **Infinite Perimeter Expansion**: Ever wanted a Go board that grows while you play?
* **Falling Cloud Islands**: Every 20 total turns, **5 square island blocks (2x2)** plummet smoothly from the heavens and dock onto the perimeter of the goban.
* **Expanding Battleground**: As new wooden grid lines latch onto the existing board, the match organically expands outwards (from 9x9 to 11x11, 13x13 to 15x15, 17x17, 21x21...), opening up brand new frontiers for territory and surprise invasion cuts!

### 👹 The 25x25 Oni Mask Board (`Oni Mask`)
* **Majestic 25x25 Demon Grid**: A massive board shaped as an ancient demon mask, featuring towering upper horns, hollow eye sockets, and a central cosmic maw.
* **Omnidirectional Inhalation (Every 14 Turns)**: The demon inhales with ferocious gravitational pull! Stones above slide down, stones below slide up, and stones on the sides slide inwards towards the mouth.
* **Heavy Formations Resist (4+ Stones)**: Strong, connected chains of 4 or more stones have enough mass to anchor down and resist the vortex completely.
* **The Devouring Maw (1–3 Stones)**: Small groups and single stones get sucked towards the center—and if they fall into the mouth, **the Oni devours them whole**, swallowing them into the void with a terrifying demon roar!
* **🩸 Soul Feast**: Capture 2 or more enemy stones in a single move to trigger the Soul Feast, empowering your champion with an immediate **bonus consecutive turn**!

---

## 🔊 2. Real-Time Web Audio Sound Synthesizer & BGM Overhaul

Board games should feel crisp, tactile, and satisfying. We built a dedicated real-time sound engine using the Web Audio API—no generic stock clips, but real-time acoustic synthesis tailored for each champion and spell:

* ☄️ **Tengu's Meteor Strike**: High-speed whistling drop + 32Hz subsonic ground impact + sizzling embers.
* 🐉 **Ryūjin's Dragon Flame**: Roaring thermal firestorm with dynamic resonant filters.
* ✨ **Himiko's Celestial Drop**: Shimmering pentatonic star chimes cascading across the board.
* ⚗️ **Alchemist's Transmutation**: Calligraphy brushstroke followed by effervescent magical energy.
* 🛡️ **Kitsune's Divine Shields**: Resonant Tibetan singing bowl upon cast, and sharp glass shatter when broken.
* 🌋 **Seismic Quakes & Dragon Breath**: Deep rumbling magma detonations and boss dragon roars.
* 🥁 **Taiko Victory Fanfare & Defeat Gong**: Martial Taiko drums + Hirajōshi chimes on victory, or a somber bronze temple gong on defeat.
* 🎵 **Silky Smooth Music**: Seamless ambient Zen music for peaceful matches and traditional martial taiko beats for intense duels.

---

## 🥋 3. Completely Restructured Interactive Dojo Tutorial

Learning Go should be fun, clear, and interactive—not a dry wall of text! We’ve split the **Dojo** into two clean, self-paced modules:

### 📗 Module I: Canonical Go Fundamentals (9 Interactive Lessons)
Learn the pure rules step by step by playing directly on the board:
1. **Liberties & Breathing Space**: How stones live and breathe.
2. **Capturing & Atari**: Surrounding stones to take prisoners.
3. **Making Eyes & True Life**: The secret to invincible groups.
4. **False Eyes & The Two-Eye Trap**: Spotting fake eyes before it's too late.
5. **Mutual Life (Seki)**: Sharing liberties in peaceful coexistence.
6. **Suicide Prevention**: Understanding illegal self-destruction.
7. **Snapback (Uttegaeshi)**: The classic tactical sacrifice trap.
8. **The Ko Rule**: Preventing infinite repetition loops.
9. **Territory & Japanese Scoring**: Counting surrounded points, dead stones, and Komi.

### 📕 Module II: Crazy Go Tactical Mechanics (Lessons 10–14)
Master our unique twists: destroyed terrain choke points, tactical polyomino shape stones, champion abilities, and map boss encounters.

---

## 💎 4. Roguelike Visuals, Previews & Multiplayer Polish

* 🔥 **Animated Elemental Difficulty Flames**: Beautiful animated flame auras in the roguelike expedition menu (Emerald Easy, Solar Amber Normal, Blood Crimson Hard, and Supreme Void Purple for Grandmaster).
* 🪟 **Borderless Glassmorphism UI**: Clean, modern frosted glass dialogs with smooth backdrops.
* 🌐 **100% Deterministic Multiplayer**: Volcano meteor strikes, falling sky islands, and Oni vortex pulls are computed with synchronized pseudo-random seeds across P2P online matches—zero desyncs!
* 👁️ **True Previews**: Setup wizard previews now show the exact real dimensions and intersection counts (like 25x25 Oni Mask) without ghost stone glitches when it's the opponent's turn.

---

### 🎮 Ready to Play?
* **Play in Your Browser**: Head over to our Itch.io page and hit play—zero downloads, zero waiting!
* **Download for Windows PC**: Grab `crazy_go_windows_v14.zip`, extract, and launch `CrazyGo.exe` for the native portable desktop experience.

Thank you so much to all the players, Go enthusiasts, and roguelite fans following the project. Jump in, try out the new boards, and let us know what you think in the comments! 🍵🎋
