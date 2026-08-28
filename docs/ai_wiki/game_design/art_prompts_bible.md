# Biblia Maestra de Prompts de Arte y Estilo Visual (Crazy Go)

> **PROPÓSITO DE ESTE DOCUMENTO:**
> Este archivo centraliza la guía de estilo visual, paletas cromáticas, parámetros técnicos de generación de IA y la biblioteca completa de prompts exactos utilizados para todos los personajes (campeones frontales y traseros), enemigos (monjes y sabios), jefes finales (Gran Dragón Sabio Gris), fondos, mobiliario 2.5D y artefactos de **Crazy Go**.
> 
> Debe ser consultado y enriquecido obligatoriamente antes de generar cualquier nuevo asset gráfico para mantener una coherencia artística del 100%.

---

## 1. Reglas Maestras de Estilo Visual

Todos los assets generados para Crazy Go deben obedecer los siguientes pilares:

| Pilar | Regla Estilística |
| :--- | :--- |
| **Estilo Principal** | Fusión entre **Sumi-e japonés tradicional** (trazos de tinta negra caligráfica, fluidez orgánica) y **anime digital contemporáneo** (cel-shading limpio, volumen definido, alta definición). |
| **Transparencia** | **Fondo 100% transparente (PNG RGBA con canal alfa limpio)**. Sin halos blancos, bordes recortados ni artefactos de fondo. Sin rocas/suelos recortados a menos que se integren limpiamente. |
| **Encuadre y Proporción** | Plano de cuerpo entero o tres cuartos del personaje de pie, centrado verticalmente, con pies apoyados sutilmente sin cajas ni peanas. |
| **Orientación y Mirada** | • **Vista Frontal (Standee de Combate & Menús)**: Perfil 3/4 hacia el centro.<br>• **Vista Trasera Sendero (Continuar Expedición Roguelike)**: Visto de espaldas avanzando hacia el horizonte/mapa con colores saturados.<br>• **Vista Trasera Retorno (Nueva Expedición / Regreso a Casa)**: Visto de espaldas inclinado/girado sutilmente hacia la izquierda entrando de vuelta al dojo con paleta más tenue/grisácea. |
| **Iluminación** | *Rim light* (luz de contorno) atmosférica dorada, cian o etérea que despega la silueta del fondo oscuro. |

---

## 2. Prompts Maestros: Los 7 Campeones de Go (Frente y Espalda)

---

### 1. Ryūjin (Señor Dragón de las Mareas y el Fuego)
* **Fisonomía Clave**: Cabello **BLANCO / PLATEADO largo y liso** que sobrepasa la cintura. **Cuernos de dragón blancos bifurcados** en la cabeza. Traje ceremonial azul marino y zafiro con motivos de olas y bordado de dragón dorado.
* **Prompt Frontal (`ryujin.png`)**:
  ```text
  Full body standing portrait of Ryūjin the Japanese Dragon Lord, handsome young deity with long flowing silver-white hair cascading past his waist, white branching dragon horns protruding from head, wearing deep ocean blue and navy ceremonial samurai haori robes adorned with gold dragon and wave patterns, holding a glowing turquoise water/qi sphere in his raised hand, cyan dragon mist swirling, confident and focused gaze, Japanese sumi-e brush outlines with modern anime cel-shading, completely isolated on solid white background for transparency cropping, no background --ar 3:4
  ```
* **Prompt Trasero (`ryujin_back.png`)**:
  ```text
  Full body standing portrait from behind (back view) of Ryujin the Japanese Dragon Lord, long flowing straight white silver hair cascading down past his waist, long branching white dragon horns protruding from head, wearing deep ocean blue and navy ceremonial samurai haori robes adorned with gold dragon and wave patterns on the back, wisps of cyan water energy and dragon mist swirling around, feet standing on plain ground, isolated on solid white background for transparency cropping, Japanese sumi-e anime cel-shading, no cliff, no rocks --ar 3:4
  ```

---

### 2. Tengu (Señor de los Vientos de la Montaña)
* **Fisonomía Clave**: Cabello negro oscuro despuntado, **alas majestuosas de cuervo negro desplegadas en la espalda**, máscara roja de Tengu de nariz larga ladeada en la cabeza, ropas rojas y doradas de yamabushi con cordón shimenawa y rosario budista.
* **Prompt Frontal (`tengu.png`)**:
  ```text
  Full body standing portrait of an imposing Tengu warrior master with red mask and long nose tilted on the side of his spiky black hair, massive majestic black crow feathered wings spread wide, wearing red and gold yamabushi shugendo robes with rope belt and prayer beads, holding a ringed shakujo staff in one hand and a flaming volcanic Go stone in the other, turbulent wind gusts and ember particles swirling, Japanese ukiyo-e ink aesthetic with bold anime dynamic lighting, isolated on solid white background for transparency cropping --ar 3:4
  ```
* **Prompt Trasero (`tengu_back.png`)**:
  ```text
  Full body portrait from behind (back view) of an imposing Tengu warrior master with massive black crow feathered wings spread wide on his back, spiky black hair with red tengu mask visible on side, wearing red and black-gold yamabushi robes, walking forward away from the viewer, Japanese ukiyo-e ink aesthetic with bold anime cel-shading and dynamic golden rim lighting, isolated on solid white background for transparency cropping, clean floor, no rocks --ar 3:4
  ```

---

### 3. Kitsune (Espíritu del Zorro de Nueve Colas)
* **Fisonomía Clave**: Cabello **negro / castaño oscuro largo**, **orejas de zorro blancas** con lazo rojo y cascabel dorado, **9 colas de zorro blancas y esponjosas con puntas doradas**, túnica tradicional de sacerdotisa Shinto (miko) blanca y roja con hakama carmesí.
* **Prompt Frontal (`kitsune.png`)**:
  ```text
  Full body standing portrait of a graceful Kitsune maiden Go master, long dark black-brown hair, white fox ears with red ribbon and golden bell, nine majestic fluffy white fox tails with golden tips fanning out behind her, wearing an elegant red and white Shinto miko shrine maiden robe with crimson hakama skirt, holding a floating blue foxfire flame in her palm, floating sakura cherry blossom petals, Japanese sumi-e ink brush outlines with modern anime shading, isolated on solid white background for transparency cropping --ar 3:4
  ```
* **Prompt Trasero (`kitsune_back.png`)**:
  ```text
  Full body standing portrait from behind (back view) of graceful Kitsune maiden Go master, long straight dark black brown hair cascading down, white fox ears with red ribbon on top of head, nine majestic fluffy white fox tails with golden tips flowing behind her, wearing red and white Shinto miko priestess kimono robe with bright red hakama skirt, Japanese sumi-e anime cel-shading, isolated on solid white background for transparency cropping, clean floor, no rocks --ar 3:4
  ```

---

### 4. Ronin (Samurai Errante del Acero Veloz)
* **Fisonomía Clave**: Sombrero cónico de paja (**kasa**), cabello oscuro alborotado, haori azul índigo desgastado y remendado con patrones de nubes/olas, petate/manta enrollada en la espalda, katana al cinto con chispas de relámpago cian.
* **Prompt Frontal (`ronin.png`)**:
  ```text
  Full body standing portrait of a stoic wanderer Ronin samurai with conical straw bamboo hat (kasa) on head, weathered dark indigo patched haori over samurai armor, hand gripping the hilt of a katana that emits an ethereal cyan electric lightning glow, rolled traveler bedroll on back, sharp intense eyes, atmospheric wind lines, crisp Japanese sumi-e brush strokes and anime cel-shading, isolated on solid white background for transparency cropping --ar 3:4
  ```
* **Prompt Trasero (`ronin_back.png`)**:
  ```text
  Full body portrait from behind (back view) of a stoic wanderer Ronin samurai with straw bamboo hat (kasa) on head/back, wearing a weathered dark indigo haori over samurai garb, carrying rolled traveler bedroll and katana scabbard at hip, walking forward away from the viewer, wind blowing his cloak, Japanese sumi-e brush strokes and clean anime cel-shading, isolated on solid white background for transparency cropping, clean floor, no rocks --ar 3:4
  ```

---

### 5. Himiko (Emperatriz Chamánica Solar)
* **Fisonomía Clave**: Corona imperial dorada/bronce con cuentas **magatama verdes** y colgantes, cabello negro liso larguísimo, túnica imperial carmesí y blanca con bordados dorados del sol radiante, collar de jade magatama, partículas solares cósmicas.
* **Prompt Frontal (`himiko.png`)**:
  ```text
  Full body portrait of divine ancient Japanese shaman Queen Himiko with ornate golden solar crown headdress adorned with green magatama beads, flowing imperial crimson and white robes with embroidered golden sunbursts, green jade magatama necklace, long straight black hair, floating gracefully, hands channeling celestial glowing stardust particles, majestic regal presence, high-end anime character concept art with clean ink outlines, isolated on solid white background for transparency cropping --ar 3:4
  ```
* **Prompt Trasero (`himiko_back.png`)**:
  ```text
  Full body portrait from behind (back view) of ancient Japanese Shaman Queen Himiko with ornate golden solar crown headdress, flowing imperial crimson and white-gold ceremonial robes billowing gracefully with embroidered sunbursts on back, long black hair, floating gently, celestial stardust and glowing solar runes floating around her, traditional Japanese ink lineart with modern anime vibrant cel-shading, isolated on solid white background for transparency cropping, clean floor, no rocks --ar 3:4
  ```

---

### 6. Alquimista (Maestro Onmyōji de la Inversión Yin-Yang)
* **Fisonomía Clave**: **Gorro alto ceremonial negro (eboshi)** con cordón morado, túnica verde esmeralda y púrpura de astrólogo/erudito con constelaciones celestiales y emblemas del Yin-Yang, talismanes de papel (ofuda) en mano y orbe armilar flotante.
* **Prompt Frontal (`alchemist.png`)**:
  ```text
  Full body standing portrait of an enigmatic Taoist/Onmyoji Alchemist Go scholar wearing a tall black eboshi court cap with purple cord, long black hair, flowing royal emerald green and deep purple layered robes adorned with arcane celestial constellations and Yin-Yang crests, holding paper ofuda talismans in one hand and a floating glowing Yin-Yang armillary sphere in the other, clean anime vector art style with ink outlines, isolated on solid white background for transparency cropping --ar 3:4
  ```
* **Prompt Trasero (`alchemist_back.png`)**:
  ```text
  Full body standing portrait from behind (back view) of an enigmatic Taoist/Onmyoji Alchemist Go scholar wearing a tall black eboshi court cap, long black hair, flowing deep royal purple and emerald green layered robes adorned with glowing celestial Yin-Yang and constellation embroidery on the back, carrying an ancient scroll pouch, walking forward away from the viewer, glowing arcane transmutation sparks floating around, Japanese ink brush lineart with clean anime cel-shading, isolated on solid white background for transparency cropping, clean floor, no rocks --ar 3:4
  ```

---

### 7. Persona Normal (El Aprendiz Sin Rostro)
* **Fisonomía Clave**: **Rostro liso sin facciones (sin ojos, cejas, nariz ni boca)**, cabello negro recogido en moño con lazo azul, **kimono superior blanco puro y pantalón hakama azul marino oscuro**, cuenco de madera para piedras de Go (goki).
* **Prompt Frontal (`normal.png`)**:
  ```text
  Full body standing portrait of a young Japanese Go apprentice player with a completely blank smooth anime faceless featureless face (no eyes, no nose, no mouth), dark hair tied in a neat topknot bun with blue ribbon, wearing a clean pure white kimono top and dark navy blue pleated hakama pants, holding a wooden Go bowl (goki) in one hand and placing a black Go stone with the other, clean Japanese ink lineart with anime cel-shading, isolated on solid white background for transparency cropping --ar 3:4
  ```
* **Prompt Trasero (`normal_back.png`)**:
  ```text
  Full body standing portrait from behind (back view) of a young Japanese Go apprentice player with dark hair tied in a neat topknot bun with blue ribbon, wearing a clean pure white kimono top and dark navy blue pleated hakama pants, carrying a wooden Go bowl on hip, walking forward away from the viewer, traditional Japanese ink lineart with clean anime cel-shading, warm rim lighting, isolated on solid white background for transparency cropping, clean floor, no rocks --ar 3:4
  ```

---

## 3. Prompts Maestros: Rivales, Monjes y Sabios

### 1. Monje Novicio / Joven Monje (Enemigos Monjes Tier 1-2)
```text
Humble and serene young Japanese Buddhist monk standing peacefully, wearing saffron and grey kasaya robes, holding wooden prayer beads (juzu) in one hand and placing a Go stone with the other, calm meditative expression, Japanese ink brush lineart, clean anime cel-shading, warm golden rim light, completely isolated on solid white background for transparency cropping --ar 3:4
```

### 2. Sabio de la Niebla / Ermitaño Ancestral (Enemigos Sabios Tier 3-4)
```text
Ancient Japanese mountain hermit sage with long white beard and eyebrows, wearing dark emerald and charcoal layered robes, holding a rustic calligraphy brush and an unpolished raw slate Go stone, wisps of mountain mist around his feet, clean anime sumi-e aesthetic, isolated on solid white background for transparency cropping --ar 3:4
```

### 3. Gran Dragón Sabio Gris (Jefe Final del Roguelike)
```text
Full body profile illustration of the Great Grey Sage Dragon (Gran Dragón Sabio Gris) of Go, an ancient colossal Japanese Ryu dragon with shimmering pearl-grey and slate scales, long flowing white whiskers, wise glowing amber eyes, curling serpentine body floating gracefully in the air, exhaling a swirling plume of mystical incinerating fire and cosmic ash, dramatic cinematic lighting, Japanese sumi-e calligraphy brush outlines combined with top-tier anime concept art, facing left towards the viewer, completely isolated on solid transparent background PNG, no background, 8k resolution --ar 3:4
```

---

## 4. Prompts Maestros: Escenarios y Fondos

### 1. Interior del Dojo Tradicional (`bg_choice_dojo.jpg` / `bg_dojo_empty.jpg`)
```text
Interior entrance of a traditional serene Japanese cedar wood dojo looking inward, warm amber paper lanterns hanging, polished tatami floor, shoji sliding doors slightly open, incense smoke curling softly, Japanese anime watercolor background art style, warm cozy lighting, atmospheric and peaceful, 16:9 widescreen --ar 16:9
```

### 2. Sendero de la Expedición Roguelike con Nodos de Go (`bg_choice_map.jpg`)
```text
Cinematic landscape of an ancient Japanese mountain trail winding through misty peaks and pine trees, looking like a living parchment ink map with glowing spiritual Go stone nodes connected by golden brush stroke paths, an ethereal red torii gate in the distance along the road, Japanese sumi-e anime watercolor painting, mystical glowing atmosphere, 16:9 widescreen, 8k resolution --ar 16:9
```

### 3. Arenas de Combate (`bg_combat.jpg`, `bg_boss.jpg`, `bg_story.jpg`)
```text
Atmospheric Japanese zen garden with mystical kaya wood Goban pavilion, misty bamboo groves and cherry blossoms, soft lantern glow at twilight, anime background painting, clean framing with center space open for Goban board --ar 16:9
```

---

## 5. Prompts Maestros: Mobiliario 2.5D y Objetos Interactivos del Menú

| Objeto | Archivo | Prompt de Generación |
| :--- | :--- | :--- |
| **Estantería de Dojo** | `furniture_bookshelf.png` | `Traditional Japanese cedar wood open 3-shelf bookcase furniture, clean straight shelves, warm wood grain finish, isolated on transparent background PNG.` |
| **Soporte de Pergaminos** | `furniture_stand.png` | `Traditional Japanese floor stand for emakimono scrolls and maps (Emakimono Stand), dark polished lacquer wood with golden brass fittings, isolated on transparent background PNG.` |
| **Mapa Roguelike** | `item_map_roguelike_*.png` | `Ancient Japanese rolled parchment map on wooden display stand, painted with brush calligraphy nodes and mountain routes, warm glowing aura, isolated on transparent background PNG.` |
| **Farolillo Local (Ámbar)** | `item_lantern_local_*.png` | `Traditional Japanese hanging paper lantern (Andon/Chochin) with warm glowing amber light and black calligraphy kanji, isolated on transparent background PNG.` |
| **Farolillo Online (Azul)** | `item_lantern_online_*.png` | `Traditional Japanese hanging paper lantern emitting a celestial electric blue and cyan spiritual glow, isolated on transparent background PNG.` |
| **Libro de Historia** | `item_book_story_*.png` | `Ancient Japanese bound leather and silk chronicle book with golden cherry blossom crest and bookmark ribbon, isolated on transparent background PNG.` |
| **Grulla de Feedback** | `item_feedback_crane_*.png` | `Delicate Japanese origami paper crane with glowing golden ink calligraphy along its wings, isolated on transparent background PNG.` |
| **Muñeco de Dojo** | `item_dummy_tutorial_*.png` | `Traditional Japanese straw and bamboo martial arts training dummy wearing a white headband, isolated on transparent background PNG.` |

---

## 6. Prompts Maestros: Fichas Poliminó y Hechizos Tácticos

| Elemento | Prompt de Icono / Artefacto |
| :--- | :--- |
| **Ficha Duplicidad (2x1)** | `Isometric 3D icon of a twin domino Go stone block, two joined stones in a single rectangular slate piece with glowing cyan runic border #38bdf8, traditional Japanese lacquered wood finish, floating with soft drop shadow on transparent background PNG.` |
| **Ficha Monolito (2x2)** | `Colossal 2x2 square monolithic Go titan block, heavy dark obsidian slab with engraved golden amber kanji runes #f59e0b, solid indestructible stone texture, isometric icon on transparent background PNG.` |
| **Piedra Germinante (1x1)** | `Magical living wood Go stone with glowing emerald leaf sprouts emerging from its center, sacred nature energy swirl #10b981, transparent background PNG.` |
| **Pergamino Rebobinar (⏳)** | `Ancient rolled parchment scroll with glowing hourglass chronomancy crest, golden ribbon, floating time distortion particles, transparent background PNG.` |
| **Pergamino Escudo Divino (🛡️)** | `Sacred Shinto ofuda talisman scroll with glowing golden circular barrier seal, radiant defensive aura, transparent background PNG.` |
| **Pergamino Inversión Yin-Yang (☯️)** | `Swirling Yin-Yang dual energy sphere in purple and golden light, transmuting Go stones, transparent background PNG.` |
