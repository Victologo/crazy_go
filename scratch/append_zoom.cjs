const fs = require('fs');
let content = fs.readFileSync('src/ui/modals/OptionsModalRenderer.ts', 'utf8');
content = content.trim().replace(/\n\}$/g, '').replace(/\n\}$/g, ''); // Ensure closing braces are removed safely
content += `
    // ==================== FEEDBACK MODAL ====================
    public static openFeedbackModal() {
        const feedbackContainer = document.querySelector('.modal-feedback')?.closest('.modal-backdrop');
        if (feedbackContainer) feedbackContainer.classList.remove('hidden');
    }

    public static closeFeedbackModal() {
        const feedbackContainer = document.querySelector('.modal-feedback')?.closest('.modal-backdrop');
        if (feedbackContainer) feedbackContainer.classList.add('hidden');
    }

    // ==================== SISTEMA DE ZOOM Y ESCALADO GLOBAL ====================
    public static currentZoom: number = 100;

    public static setZoom(percent: number, showToast: boolean = true) {
        let clamped = Math.max(50, Math.min(200, percent));
        this.currentZoom = clamped;

        document.documentElement.style.setProperty('--ui-scale', (clamped / 100).toString());

        if ('zoom' in document.body.style) {
            (document.body.style as any).zoom = \`\${clamped}%\`;
        } else {
            document.body.style.transform = \`scale(\${clamped / 100})\`;
            document.body.style.transformOrigin = 'top left';
            document.body.style.width = \`\${100 / (clamped / 100)}%\`;
            document.body.style.height = \`\${100 / (clamped / 100)}%\`;
        }

        const zoomSlider = document.getElementById('opt-zoom-slider') as HTMLInputElement;
        const zoomText = document.getElementById('opt-zoom-text');
        if (zoomSlider) zoomSlider.value = clamped.toString();
        if (zoomText) zoomText.innerText = \`\${clamped}%\`;

        if (showToast) {
            let toast = document.getElementById('zoom-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'zoom-toast';
                toast.className = 'zoom-toast';
                document.body.appendChild(toast);
            }
            toast.innerText = \`🔍 Zoom: \${clamped}%\`;
            toast.classList.add('show');
            setTimeout(() => {
                if (toast && toast.innerText === \`🔍 Zoom: \${clamped}%\`) {
                    toast.classList.remove('show');
                }
            }, 1500);
        }
    }

    public static initZoom() {
        this.setZoom(100, false);
    }
}
`;
fs.writeFileSync('src/ui/modals/OptionsModalRenderer.ts', content);
console.log('Appended zoom code successfully');
