

export class SandboxModalRenderer {
    // ==================== 6. MODAL LABORATORIO DE PRUEBAS (SANDBOX) ====================
    public static openSandboxModal() {
        document.getElementById('modal-sandbox')?.classList.remove('hidden');
    }

    public static closeSandboxModal() {
        document.getElementById('modal-sandbox')?.classList.add('hidden');
    }

    public static switchSandboxTab(tabId: string) {
        document.querySelectorAll('.sandbox-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        document.querySelectorAll('.sandbox-tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === tabId);
        });
    }
}
