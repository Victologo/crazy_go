// scripts/build_packages.js - Empaquetador determinista y oficial para Crazy Go
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');
const JavaScriptObfuscator = require('javascript-obfuscator');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('======================================================');
console.log('   EMPAQUETADOR OFICIAL DE CRAZY GO (VITE + EXE + ZIP)');
console.log('======================================================\n');

/**
 * Ofusca y blinda criptográficamente todos los bundles de código JavaScript en dist/assets
 */
function obfuscateDistDirectory(distDir) {
    const assetsDir = path.join(distDir, 'assets');
    if (!fs.existsSync(assetsDir)) return;

    const files = fs.readdirSync(assetsDir);
    let obfuscatedCount = 0;

    for (const file of files) {
        if (file.endsWith('.js')) {
            const filePath = path.join(assetsDir, file);
            const rawCode = fs.readFileSync(filePath, 'utf8');
            process.stdout.write(`   🔒 Ofuscando y protegiendo ${file}... `);

            const obfuscated = JavaScriptObfuscator.obfuscate(rawCode, {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.75,
                deadCodeInjection: true,
                deadCodeInjectionThreshold: 0.2,
                stringArray: true,
                stringArrayThreshold: 0.85,
                stringArrayEncoding: ['base64', 'rc4'],
                splitStrings: true,
                splitStringsChunkLength: 10,
                transformObjectKeys: true,
                identifierNamesGenerator: 'hexadecimal',
                renameGlobals: false,
                selfDefending: false, // Evitar bloqueos accidentales en devtools de usuario final
                simplify: true
            });

            fs.writeFileSync(filePath, obfuscated.getObfuscatedCode(), 'utf8');
            obfuscatedCount++;
            console.log('✅');
        }
    }
    console.log(`\n🛡️ ${obfuscatedCount} archivos JS blindados y ofuscados criptográficamente.`);
}

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
    console.log('[1/6] Compilando assets y código con TypeScript y Vite...');
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

    // 2. Ofuscación y blindaje de código JavaScript
    console.log('\n[2/6] Aplicando blindaje y ofuscación de código JavaScript...');
    const distSrc = path.join(rootDir, 'dist');
    obfuscateDistDirectory(distSrc);

    // 3. Compilar CrazyGo.exe desde Launcher.cs con csc.exe de .NET Framework
    console.log('\n[3/6] Compilando ejecutable nativo de Windows (CrazyGo.exe)...');
    const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
    const launcherPath = path.join(rootDir, 'scripts', 'Launcher.cs');
    const exePath = path.join(rootDir, 'CrazyGo.exe');

    if (fs.existsSync(cscPath)) {
        execSync(`"${cscPath}" /target:winexe /out:"${exePath}" "${launcherPath}"`, { cwd: rootDir, stdio: 'inherit' });
        console.log('✅ CrazyGo.exe compilado correctamente.');
    } else {
        console.warn('⚠️ No se encontró csc.exe en la ruta estándar de .NET 64-bit.');
    }

    // 4. Preparar carpeta distribuible CrazyGo_Portable
    console.log('\n[4/6] Preparando carpeta distribuible CrazyGo_Portable...');
    const portableDir = path.join(rootDir, 'CrazyGo_Portable');
    if (fs.existsSync(portableDir)) {
        fs.rmSync(portableDir, { recursive: true, force: true });
    }
    fs.mkdirSync(portableDir, { recursive: true });

    // Copiar dist a CrazyGo_Portable/dist
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

    const readmeText = `CRAZY GO - OFFICIAL PORTABLE GAME (WINDOWS)

HOW TO PLAY:
1. Extract all contents of this ZIP archive into any folder.
2. Double-click 'CrazyGo.exe' to launch the game instantly.
3. No installation or internet connection required.
4. Fully compatible with native Windows 10 & Windows 11.

Enjoy the game!
`;
    fs.writeFileSync(path.join(portableDir, 'README.txt'), readmeText, 'utf8');
    console.log('✅ Carpeta CrazyGo_Portable preparada con éxito.');

    // 5. Crear ZIP para Itch.io Browser (crazy_go_itchio_v14_browser.zip)
    console.log('\n[5/6] Generando ZIP para Itch.io Browser con estándar UNIX (crazy_go_itchio_v14_browser.zip)...');
    const browserZipPath = path.join(rootDir, 'crazy_go_itchio_v14_browser.zip');
    if (fs.existsSync(browserZipPath)) {
        fs.unlinkSync(browserZipPath);
    }

    await createStandardZip(distSrc, browserZipPath);
    const browserZipStat = fs.statSync(browserZipPath);
    const browserZipSizeMB = (browserZipStat.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ ZIP Browser creado: crazy_go_itchio_v14_browser.zip (${browserZipSizeMB} MB)`);

    // 6. Crear único ZIP Portable para Windows PC (crazy_go_windows_v14.zip)
    console.log('\n[6/6] Generando ZIP Portable para Windows PC (crazy_go_windows_v14.zip)...');
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
