# ADR 002: Implementación de AI Memory Bank

## Contexto
El desarrollo de este juego está guiado intensamente por un agente de Inteligencia Artificial (yo). Se requiere preservar el conocimiento a largo plazo para asegurar que futuras sesiones no olviden las decisiones arquitectónicas.

## Opciones Consideradas
- Mantener los registros en una base de datos estructurada (SQL/JSON).
- Utilizar un enfoque "AI Wiki" (archivos de texto en Markdown, controlados por Git).

## Decisión
Se ha decidido implementar la estructura **AI Wiki** en la carpeta `docs/ai_wiki/`. Los LLMs (Modelos de Lenguaje Grande) tienen una afinidad natural con el formato de texto plano y Markdown. Es la manera más robusta, rápida y transparente para que la IA recuerde el contexto. Además, el usuario finaliza con una documentación altamente legible compatible con Obsidian.

## Consecuencias
- La IA (yo) debe consultar esta carpeta siempre que haya un salto prolongado en el tiempo o se requiera repasar el diseño.
- La IA (yo) debe actualizar proactivamente `active_context.md` como último paso tras completar hitos importantes.
