# 🛡️ Seguridad, Blindaje Criptográfico y Empaquetado en Crazy Go

Este documento describe en detalle los mecanismos de **protección de código fuente**, **ofuscación criptográfica** y el **pipeline oficial de empaquetado** utilizados en Crazy Go para evitar la ingeniería inversa, copia no autorizada o descompilación del juego, tanto en la versión web (Itch.io) como en la versión ejecutable de escritorio (Windows PC).

---

## 1. Contexto y Objetivos de Seguridad

Crazy Go es un juego desarrollado con TypeScript, HTML5 y Web Audio, compilado con Vite. Al distribuirse públicamente en plataformas como Itch.io o como juego portable de PC, los bundles estándar de JavaScript pueden ser inspeccionados si no cuentan con una capa de protección activa.

Para proteger la propiedad intelectual del proyecto (lógica canónica y asimétrica de Go, algoritmos de IA, fórmulas de habilidades de campeones, sincronización de red P2P y mecánicas roguelite), se ha implementado un sistema de **blindaje multicapa** que se ejecuta de forma automática en cada proceso de empaquetado.

---

## 2. Pipeline de Empaquetado Automatizado (`scripts/build_packages.js`)

El script principal de empaquetado (`npm run package`) ejecuta un flujo secuencial en 6 pasos:

1. **Compilación Base (`tsc && vite build`)**:
   - Convierte el código fuente TypeScript (`src/**/*.ts`) en bundles modulares JavaScript minificados y genera los assets en la carpeta `dist/`.
   - Los archivos `.ts` originales nunca se incluyen en los paquetes finales.

2. **Ofuscación Criptográfica (`obfuscateDistDirectory`)**:
   - Escanea todos los archivos `.js` generados en `dist/assets/`.
   - Transforma cada bundle aplicando algoritmos de ofuscación de nivel industrial (`javascript-obfuscator`) antes de empaquetar.

3. **Compilación Nativa de Windows (`CrazyGo.exe`)**:
   - Utiliza el compilador nativo de C# (`csc.exe` de Microsoft .NET Framework) para generar el ejecutable binario `CrazyGo.exe` a partir de `scripts/Launcher.cs`.
   - El ejecutable actúa como un host de aplicación aislado con servidor HTTP embebido en memoria.

4. **Preparación de la Estructura Portable (`CrazyGo_Portable`)**:
   - Crea una estructura limpia que incluye `CrazyGo.exe`, la carpeta protegida `dist/`, el lanzador auxiliar `JUGAR_CRAZY_GO.bat` y las instrucciones obligatorias en inglés `README.txt`.

5. **Generación de Paquete Web para Itch.io (`crazy_go_itchio_v14_browser.zip`)**:
   - Comprime directamente el contenido de `dist/` garantizando separadores de ruta estándar UNIX (`/`) para compatibilidad con los servidores Linux de Itch.io.

6. **Generación de Paquete Portable de Windows (`crazy_go_windows_v14.zip`)**:
   - Comprime la carpeta `CrazyGo_Portable` lista para descomprimir y jugar con doble clic en Windows 10 y Windows 11 sin necesidad de instalación.

---

## 3. Técnicas de Ofuscación y Protección Aplicadas

La protección aplicada sobre los bundles de código (`javascript-obfuscator`) incluye las siguientes configuraciones de seguridad:

| Técnica de Protección | Configuración | Efecto y Blindaje |
| :--- | :--- | :--- |
| **Control Flow Flattening** | `threshold: 0.75` | Desarma la estructura lineal de funciones y condiciones, convirtiéndolas en máquinas de estados complejas y bucles entrelazados imposibles de seguir visualmente. |
| **Dead Code Injection** | `threshold: 0.20` | Inyecta bloques de código señuelo y ramificaciones ficticias que confunden herramientas automáticas de análisis estático y descompiladores. |
| **String Array Encoding** | `['base64', 'rc4']` | Extrae todos los literales de texto, nombres de eventos de red y strings del juego, cifrándolos con algoritmos Base64 y RC4 en tablas dinámicas. |
| **Identifier Names Generator** | `'hexadecimal'` | Reemplaza nombres de funciones, variables y parámetros por identificadores hexadecimales aleatorios (ej. `_0x4f1a`, `_0x2c8b`). |
| **Transform Object Keys** | `true` | Ofusca los accesos a propiedades de objetos y diccionarios para que no se puedan deducir nombres de módulos o configuraciones. |
| **Split Strings** | `chunkLength: 10` | Fragmenta cadenas de texto en micro-bloques concatenados en tiempo de ejecución. |

---

## 4. Diferencia entre Entornos (Desarrollo vs Producción)

- **Modo Desarrollo (`npm run dev`)**:
  - Utiliza Vite con Hot Module Replacement (HMR) y TypeScript puro para iteración rápida con depuración clara y sourcemaps activos.
- **Modo Compilación Local (`npm run build`)**:
  - Compila y minifica en `dist/` sin ofuscación profunda para pruebas rápidas de build.
- **Modo Empaquetado Oficial (`npm run package`)**:
  - Aplica la ofuscación criptográfica completa y genera los archivos `.zip` protegidos listos para distribución comercial y pública.

---

## 5. Instrucciones de Uso

Para generar una nueva versión protegida del juego con todos los cambios y blindaje criptográfico al día:

```bash
npm run package
```

Al finalizar, se habrán actualizado los dos archivos oficiales en la raíz del proyecto:
- `crazy_go_itchio_v14_browser.zip`
- `crazy_go_windows_v14.zip`
