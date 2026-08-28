// ui/modals/SocialModalRenderer.ts
import { DatabaseManager } from '../../network/DatabaseManager';

export class SocialModalRenderer {
    public static async show() {
        const modal = document.getElementById('modal-social');
        if (!modal) {
            this.createModal();
            return;
        }
        
        await this.refreshContent();
        modal.style.display = 'flex';
    }

    public static hide() {
        const modal = document.getElementById('modal-social');
        if (modal) modal.style.display = 'none';
    }

    private static createModal() {
        const modal = document.createElement('div');
        modal.id = 'modal-social';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h2 style="color: #fbbf24; text-align: center;">👥 Perfil y Amigos</h2>
                <div style="margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.4); border-radius: 8px;">
                    <h3 style="margin-top: 0;">Tu Perfil</h3>
                    <p>Nombre actual: <strong id="social-my-name">Cargando...</strong></p>
                    <p>Tu ID: <code id="social-my-id" style="user-select: all; background: #333; padding: 2px 6px; border-radius: 4px;"></code></p>
                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                        <input type="text" id="social-name-input" placeholder="Nuevo nombre" class="lobby-input" style="flex: 1;" />
                        <button id="btn-change-name" class="btn btn-primary btn-sm">Cambiar Nombre</button>
                    </div>
                    <small id="social-name-error" style="color: #ef4444; display: none; margin-top: 5px;"></small>
                </div>

                <div style="margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.4); border-radius: 8px;">
                    <h3 style="margin-top: 0;">Añadir Amigo</h3>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" id="social-friend-input" placeholder="ID del amigo" class="lobby-input" style="flex: 1;" />
                        <button id="btn-add-friend" class="btn btn-primary btn-sm">Añadir</button>
                    </div>
                    <small id="social-friend-error" style="color: #ef4444; display: none; margin-top: 5px;"></small>
                </div>

                <div style="padding: 15px; background: rgba(0,0,0,0.4); border-radius: 8px;">
                    <h3 style="margin-top: 0;">Lista de Amigos</h3>
                    <ul id="social-friends-list" style="list-style: none; padding: 0; margin: 0; max-height: 200px; overflow-y: auto;">
                        <li>Cargando amigos...</li>
                    </ul>
                </div>

                <div style="margin-top: 20px; text-align: center;">
                    <button id="btn-close-social" class="btn btn-secondary">Cerrar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('btn-close-social')?.addEventListener('click', () => this.hide());
        
        document.getElementById('btn-change-name')?.addEventListener('click', async () => {
            const input = document.getElementById('social-name-input') as HTMLInputElement;
            const err = document.getElementById('social-name-error');
            const newName = input.value.trim();
            if (!newName) return;

            const btn = document.getElementById('btn-change-name') as HTMLButtonElement;
            btn.disabled = true;
            
            const result = await DatabaseManager.changeDisplayName(newName);
            if (err) {
                err.innerText = result.message;
                err.style.display = 'block';
                err.style.color = result.success ? '#10b981' : '#ef4444';
            }
            if (result.success) {
                import('../../network/NetworkManager').then(nm => {
                    nm.NetworkManager.localName = newName;
                });
                input.value = '';
                await this.refreshContent();
            }
            btn.disabled = false;
        });

        document.getElementById('btn-add-friend')?.addEventListener('click', async () => {
            const input = document.getElementById('social-friend-input') as HTMLInputElement;
            const err = document.getElementById('social-friend-error');
            const friendId = input.value.trim();
            if (!friendId) return;

            const btn = document.getElementById('btn-add-friend') as HTMLButtonElement;
            btn.disabled = true;
            
            const result = await DatabaseManager.addFriend(friendId);
            if (err) {
                err.innerText = result.message;
                err.style.display = 'block';
                err.style.color = result.success ? '#10b981' : '#ef4444';
            }
            if (result.success) {
                input.value = '';
                await this.refreshContent();
            }
            btn.disabled = false;
        });

        this.refreshContent();
    }

    private static async refreshContent() {
        await DatabaseManager.initialize();
        
        const myId = DatabaseManager.getUserId();
        const profile = await DatabaseManager.getProfile(myId);
        
        const nameEl = document.getElementById('social-my-name');
        const idEl = document.getElementById('social-my-id');
        if (nameEl) nameEl.innerText = profile?.displayName || 'Desconocido';
        if (idEl) idEl.innerText = myId;

        const friends = await DatabaseManager.getFriends();
        const listEl = document.getElementById('social-friends-list');
        if (listEl) {
            listEl.innerHTML = '';
            if (friends.length === 0) {
                listEl.innerHTML = '<li style="color: #aaa;">No tienes amigos añadidos.</li>';
            } else {
                friends.forEach(f => {
                    const li = document.createElement('li');
                    li.style.display = 'flex';
                    li.style.justifyContent = 'space-between';
                    li.style.alignItems = 'center';
                    li.style.padding = '8px';
                    li.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
                    li.innerHTML = `
                        <div>
                            <strong>${f.friendName}</strong><br>
                            <small style="color: #888;">${f.friendId}</small>
                        </div>
                        <button class="btn btn-primary btn-sm" onclick="navigator.clipboard.writeText('${f.friendId}'); alert('ID copiado al portapapeles para invitar a sala online.');">Invitar</button>
                    `;
                    listEl.appendChild(li);
                });
            }
        }
    }
}
