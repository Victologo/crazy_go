// scripts/share.js - Script de conexion en vivo P2P via tunel seguro para jugar con amigos
import localtunnel from 'localtunnel';
import http from 'http';
import https from 'https';

async function getPublicIP() {
    return new Promise((resolve) => {
        https.get('https://api.ipify.org', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data.trim()));
        }).on('error', () => {
            resolve('Ver en: https://loca.lt/mytunnelpassword');
        });
    });
}

function checkDevServer(port = 5173) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}/`, () => resolve(true));
        req.on('error', () => resolve(false));
        req.setTimeout(2000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

async function startShare() {
    console.log('\n============================================================');
    console.log('   CRAZY GO - COMPARTIR PARTIDA CON AMIGOS EN VIVO');
    console.log('============================================================\n');

    console.log('Obteniendo enlace y credenciales de acceso seguro...');
    const publicIp = await getPublicIP();

    try {
        const tunnel = await localtunnel({ port: 5173 });

        console.log('\n============================================================');
        console.log('   >>> ¡TUNEL ACTIVO Y LISTO PARA JUGAR! <<<');
        console.log('============================================================');
        console.log('\n[1] ENLACE PARA TU AMIGO:');
        console.log(`    👉 ${tunnel.url}`);
        console.log('\n[2] CONTRASEÑA DE ACCESO: (Si a tu amigo le sale una pantalla de bienvenida)');
        console.log(`    🔑 ${publicIp}`);
        console.log('\n[3] PASOS PARA JUGAR:');
        console.log('    1. Copia y pasale el enlace y la contraseña a tu amigo por chat.');
        console.log('    2. Tu amigo abre el enlace, escribe la contraseña y pulsa "Click to Submit".');
        console.log('    3. Entras tu en tu PC a: http://localhost:5173');
        console.log('    4. Vas a "Modo Online" -> "Crear Sala", eliges tu Campeon y le das el codigo GO-XXXX.');
        console.log('    5. Tu amigo en su pantalla va a "Modo Online" -> "Unirse a Sala", pone el codigo y ¡A JUGAR!');
        console.log('\n------------------------------------------------------------');
        console.log(' Mantén esta ventana abierta mientras juegues.');
        console.log(' Pulsa Ctrl+C para cerrarla cuando termines.');
        console.log('============================================================\n');

        tunnel.on('close', () => {
            console.log('\nEl tunel se ha cerrado.');
            process.exit(0);
        });

        tunnel.on('error', (err) => {
            console.error('\nAviso en el tunel:', err);
        });
    } catch (err) {
        console.error('\nNo se pudo abrir el tunel:', err);
    }
}

startShare();
