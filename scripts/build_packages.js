// scripts/build_packages.js - Empaquetador determinista y oficial para Crazy Go
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('======================================================');
console.log('   EMPAQUETADOR OFICIAL DE CRAZY GO (VITE + EXE + ZIP)');
console.log('======================================================\n');

/**
 * Comprime un directorio en un archivo ZIP garantizando separadores UNIX (/) en las rutas internas
 * para que los servidores Linux de Itch.io descompriman correctamente carpetas como assets/, audio/, etc.
 */
function createStandardZip(sourceDir, outPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = new ZipArchive({ zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));

        archive.pipe(output);
        // false hace que el contenido de sourceDir quede DIRECTAMENTE en la raíz del ZIP (sin carpeta contenedora extra)
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

async function main() {
    // 1. Compilación con Vite
    console.log('[1/5] Compilando assets y código con TypeScript y Vite...');
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

    // 2. Compilar CrazyGo.exe desde Launcher.cs con csc.exe de .NET Framework
    console.log('\n[2/5] Compilando ejecutable nativo de Windows (CrazyGo.exe)...');
    const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
    const launcherPath = path.join(rootDir, 'scripts', 'Launcher.cs');
    const exePath = path.join(rootDir, 'CrazyGo.exe');

    if (fs.existsSync(cscPath)) {
        execSync(`"${cscPath}" /target:winexe /out:"${exePath}" "${launcherPath}"`, { cwd: rootDir, stdio: 'inherit' });
        console.log('✅ CrazyGo.exe compilado correctamente.');
    } else {
        console.warn('⚠️ No se encontró csc.exe en la ruta estándar de .NET 64-bit.');
    }

    // 3. Preparar carpeta distribuible CrazyGo_Portable
    console.log('\n[3/5] Preparando carpeta distribuible CrazyGo_Portable...');
    const portableDir = path.join(rootDir, 'CrazyGo_Portable');
    if (fs.existsSync(portableDir)) {
        fs.rmSync(portableDir, { recursive: true, force: true });
    }
    fs.mkdirSync(portableDir, { recursive: true });

    // Copiar dist a CrazyGo_Portable/dist
    const distSrc = path.join(rootDir, 'dist');
    const distDest = path.join(portableDir, 'dist');
    fs.cpSync(distSrc, distDest, { recursive: true });

    // Copiar ejecutable y archivos de ayuda
    if (fs.existsSync(exePath)) {
        fs.copyFileSync(exePath, path.join(portableDir, 'CrazyGo.exe'));
    }
    const jugarBat = path.join(rootDir, 'JUGAR_CRAZY_GO.bat');
    if (fs.existsSync(jugarBat)) {
        fs.copyFileSync(jugarBat, path.join(portableDir, 'JUGAR_CRAZY_GO.bat'));
    }

    const readmeText = `CRAZY GO - JUEGO OFICIAL PORTABLE (WINDOWS)

INSTRUCCIONES PARA JUGAR:
1. Descomprime todo el contenido de este archivo ZIP en cualquier carpeta.
2. Haz doble clic en 'CrazyGo.exe' para iniciar el juego inmediatamente.
3. No requiere instalar nada ni disponer de conexión a internet.
4. Funciona en Windows 10 y Windows 11 de forma nativa.

¡Disfruta del juego!
`;
    fs.writeFileSync(path.join(portableDir, 'LEEME.txt'), readmeText, 'utf8');
    console.log('✅ Carpeta CrazyGo_Portable preparada con éxito.');

    // 4. Crear ZIP para Itch.io Browser (crazy_go_itchio_v14_browser.zip)
    console.log('\n[4/5] Generando ZIP para Itch.io Browser con estándar UNIX (crazy_go_itchio_v14_browser.zip)...');
    const browserZipPath = path.join(rootDir, 'crazy_go_itchio_v14_browser.zip');
    if (fs.existsSync(browserZipPath)) {
        fs.unlinkSync(browserZipPath);
    }

    await createStandardZip(distSrc, browserZipPath);
    const browserZipStat = fs.statSync(browserZipPath);
    const browserZipSizeMB = (browserZipStat.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ ZIP Browser creado: crazy_go_itchio_v14_browser.zip (${browserZipSizeMB} MB)`);

    // 5. Crear único ZIP Portable para Windows PC (crazy_go_windows_v14.zip)
    console.log('\n[5/5] Generando ZIP Portable para Windows PC (crazy_go_windows_v14.zip)...');
    const windowsV14ZipPath = path.join(rootDir, 'crazy_go_windows_v14.zip');
    const oldPortableZip = path.join(rootDir, 'CrazyGo_Portable.zip');

    if (fs.existsSync(windowsV14ZipPath)) fs.unlinkSync(windowsV14ZipPath);
    if (fs.existsSync(oldPortableZip)) fs.unlinkSync(oldPortableZip);

    await createStandardZip(portableDir, windowsV14ZipPath);
    const portableZipStat = fs.statSync(windowsV14ZipPath);
    const portableZipSizeMB = (portableZipStat.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ ZIP Windows creado: crazy_go_windows_v14.zip (${portableZipSizeMB} MB)`);

    console.log('\n======================================================');
    console.log('  🎉 EMPAQUETADO COMPLETADO EXITOSAMENTE 🎉');
    console.log('======================================================');
    console.log(`1. Navegador Web (Itch.io): crazy_go_itchio_v14_browser.zip`);
    console.log(`2. Windows PC (.exe):       crazy_go_windows_v14.zip\n`);
}

main().catch(err => {
    console.error('Error fatal durante el empaquetado:', err);
    process.exit(1);
});
