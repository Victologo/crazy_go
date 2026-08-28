const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index-CgLkxJsy.js","./index-VhJBfn87.css"])))=>i.map(i=>d[i]);
import{n as e}from"./index-CgLkxJsy.js";import{DatabaseManager as t}from"./DatabaseManager-CpAUOEvW.js";var n=class{static async show(){let e=document.getElementById(`modal-social`);if(!e){this.createModal();return}await this.refreshContent(),e.style.display=`flex`}static hide(){let e=document.getElementById(`modal-social`);e&&(e.style.display=`none`)}static createModal(){let n=document.createElement(`div`);n.id=`modal-social`,n.className=`modal-overlay`,n.style.display=`flex`,n.innerHTML=`
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
        `,document.body.appendChild(n),document.getElementById(`btn-close-social`)?.addEventListener(`click`,()=>this.hide()),document.getElementById(`btn-change-name`)?.addEventListener(`click`,async()=>{let n=document.getElementById(`social-name-input`),r=document.getElementById(`social-name-error`),i=n.value.trim();if(!i)return;let a=document.getElementById(`btn-change-name`);a.disabled=!0;let o=await t.changeDisplayName(i);r&&(r.innerText=o.message,r.style.display=`block`,r.style.color=o.success?`#10b981`:`#ef4444`),o.success&&(e(()=>import(`./index-CgLkxJsy.js`).then(e=>e.t).then(e=>{e.NetworkManager.localName=i}),__vite__mapDeps([0,1]),import.meta.url),n.value=``,await this.refreshContent()),a.disabled=!1}),document.getElementById(`btn-add-friend`)?.addEventListener(`click`,async()=>{let e=document.getElementById(`social-friend-input`),n=document.getElementById(`social-friend-error`),r=e.value.trim();if(!r)return;let i=document.getElementById(`btn-add-friend`);i.disabled=!0;let a=await t.addFriend(r);n&&(n.innerText=a.message,n.style.display=`block`,n.style.color=a.success?`#10b981`:`#ef4444`),a.success&&(e.value=``,await this.refreshContent()),i.disabled=!1}),this.refreshContent()}static async refreshContent(){await t.initialize();let e=t.getUserId(),n=await t.getProfile(e),r=document.getElementById(`social-my-name`),i=document.getElementById(`social-my-id`);r&&(r.innerText=n?.displayName||`Desconocido`),i&&(i.innerText=e);let a=await t.getFriends(),o=document.getElementById(`social-friends-list`);o&&(o.innerHTML=``,a.length===0?o.innerHTML=`<li style="color: #aaa;">No tienes amigos añadidos.</li>`:a.forEach(e=>{let t=document.createElement(`li`);t.style.display=`flex`,t.style.justifyContent=`space-between`,t.style.alignItems=`center`,t.style.padding=`8px`,t.style.borderBottom=`1px solid rgba(255,255,255,0.1)`,t.innerHTML=`
                        <div>
                            <strong>${e.friendName}</strong><br>
                            <small style="color: #888;">${e.friendId}</small>
                        </div>
                        <button class="btn btn-primary btn-sm" onclick="navigator.clipboard.writeText('${e.friendId}'); alert('ID copiado al portapapeles para invitar a sala online.');">Invitar</button>
                    `,o.appendChild(t)}))}};export{n as SocialModalRenderer};