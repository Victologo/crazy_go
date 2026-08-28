// ui/modals/SocialModalRenderer.ts
import { DatabaseManager } from '../../network/DatabaseManager';
import { t } from '../../i18n/i18n';

export class SocialModalRenderer {
    private static tabEventsBound = false;

    public static async refreshTabContent() {
        await DatabaseManager.initialize();

        const myId = DatabaseManager.getUserId();
        const profile = await DatabaseManager.getProfile(myId);

        const nameEl = document.getElementById('social-tab-my-name');
        const idEl = document.getElementById('social-tab-my-id');
        if (nameEl) nameEl.innerText = profile?.displayName || t('social.unknown_user');
        if (idEl) idEl.innerText = myId;

        const friends = await DatabaseManager.getFriends();
        const listEl = document.getElementById('social-tab-friends-list');
        const emptyEl = document.getElementById('social-tab-friends-empty');

        if (listEl) {
            listEl.innerHTML = '';
            if (friends.length === 0) {
                if (emptyEl) emptyEl.style.display = 'block';
            } else {
                if (emptyEl) emptyEl.style.display = 'none';
                friends.forEach(f => {
                    const li = document.createElement('li');
                    li.style.display = 'flex';
                    li.style.justifyContent = 'space-between';
                    li.style.alignItems = 'center';
                    li.style.padding = '8px 12px';
                    li.style.margin = '4px 0';
                    li.style.background = 'rgba(255,255,255,0.04)';
                    li.style.borderRadius = '8px';
                    li.style.border = '1px solid rgba(255,255,255,0.08)';
                    li.innerHTML = `
                        <div>
                            <strong style="color: #f8fafc; font-size: 0.95rem;">${f.friendName}</strong><br>
                            <small style="color: #94a3b8; font-family: monospace;">${f.friendId}</small>
                        </div>
                        <button class="btn btn-primary btn-sm btn-invite-friend" data-id="${f.friendId}" style="padding: 4px 10px; font-size: 0.8rem;">${t('social.invite_btn')}</button>
                    `;
                    listEl.appendChild(li);
                });

                listEl.querySelectorAll('.btn-invite-friend').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const targetId = (e.currentTarget as HTMLElement).getAttribute('data-id') || '';
                        if (targetId) {
                            navigator.clipboard.writeText(targetId);
                            alert(t('social.copied_invite'));
                        }
                    });
                });
            }
        }

        if (!this.tabEventsBound) {
            this.bindTabEvents();
            this.tabEventsBound = true;
        }
    }

    private static bindTabEvents() {
        document.getElementById('btn-tab-change-name')?.addEventListener('click', async () => {
            const input = document.getElementById('social-tab-name-input') as HTMLInputElement | null;
            const msg = document.getElementById('social-tab-name-msg');
            const newName = input?.value.trim();
            if (!newName) return;

            const btn = document.getElementById('btn-tab-change-name') as HTMLButtonElement | null;
            if (btn) btn.disabled = true;

            const result = await DatabaseManager.changeDisplayName(newName);
            if (msg) {
                msg.innerText = result.success ? t('social.name_changed') : result.message;
                msg.style.display = 'block';
                msg.style.color = result.success ? '#10b981' : '#ef4444';
            }
            if (result.success) {
                import('../../network/NetworkManager').then(nm => {
                    nm.NetworkManager.localName = newName;
                });
                if (input) input.value = '';
                await this.refreshTabContent();
            }
            if (btn) btn.disabled = false;
        });

        document.getElementById('btn-tab-add-friend')?.addEventListener('click', async () => {
            const input = document.getElementById('social-tab-friend-input') as HTMLInputElement | null;
            const msg = document.getElementById('social-tab-friend-msg');
            const friendId = input?.value.trim();
            if (!friendId) return;

            const btn = document.getElementById('btn-tab-add-friend') as HTMLButtonElement | null;
            if (btn) btn.disabled = true;

            const result = await DatabaseManager.addFriend(friendId);
            if (msg) {
                msg.innerText = result.success ? t('social.friend_added') : result.message;
                msg.style.display = 'block';
                msg.style.color = result.success ? '#10b981' : '#ef4444';
            }
            if (result.success) {
                if (input) input.value = '';
                await this.refreshTabContent();
            }
            if (btn) btn.disabled = false;
        });
    }

    public static async show() {
        await this.refreshTabContent();
    }

    public static hide() {
        // Handled by modal tab switching
    }
}
