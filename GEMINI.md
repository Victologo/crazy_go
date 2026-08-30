# Reglas de Agente (AI Wiki Protocol)

> [!IMPORTANT]
> **INSTRUCCIÓN CRÍTICA PARA CUALQUIER IA (Antigravity/Gemini) QUE LEA ESTO:**
> Estás trabajando en el proyecto "Crazy Go", un roguelite basado en Go con topologías asimétricas y reglas canónicas.
> 
> Antes de escribir cualquier código o proponer un plan, DEBES hacer lo siguiente:
> 1. Lee el archivo `docs/ai_wiki/active_context.md` para saber exactamente en qué estado quedó el proyecto.
> 2. Revisa `docs/ai_wiki/go_rules.md` para tener siempre presentes las reglas puras del Go (Komi, libertades, capturas, Ko, suicidio y territorio).
> 3. Revisa `docs/ai_wiki/task.md` para entender el Roadmap global.
> 4. **Lee `docs/ai_wiki/codebase_map.md`** — es el índice completo del proyecto: qué hace cada archivo, sus responsabilidades y los flujos de jugada principales. Úsalo para navegar el código sin buscar a ciegas.
> 5. Si necesitas contexto sobre reglas especiales de Crazy Go o decisiones arquitectónicas pasadas, busca en `docs/ai_wiki/game_design/rules.md` y la carpeta `docs/ai_wiki/ADRs/`.
> 6. **Regla de Empaquetado**: En los paquetes distribuibles y ejecutables portables de Windows (`CrazyGo_Portable`, `.zip`), el archivo de instrucciones NUNCA debe llamarse `LEEME.txt` ni estar en español; **SIEMPRE debe llamarse `README.txt` y estar completamente en inglés**.
> 7. **Registro Horario en el Log**: Al documentar en `docs/ai_wiki/log_crazy_go.md`, SIEMPRE incluye en el encabezado de cada sesión no solo la fecha y número de sesión, sino también la **hora o rango horario exacto** (ej. `## 28 de Agosto de 2026 - Día 12 (Sesión 157) [Horario: 12:00 - 21:00]`).
> 
> **Tu tarea final en cada sesión grande:**
> Antes de terminar tu trabajo, asegúrate de actualizar `active_context.md`, registrar la sesión en `log_crazy_go.md` con su horario, y marcar las tareas en `task.md`.

