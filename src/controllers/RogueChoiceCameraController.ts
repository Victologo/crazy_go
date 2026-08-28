import { SoundFX } from '../audio/SoundFX';

export class RogueChoiceCameraController {
  private cameraEl: HTMLElement | null = null;
  private sceneEl: HTMLElement | null = null;
  private bgLeft: HTMLElement | null = null;
  private bgRight: HTMLElement | null = null;
  private plaqueEl: HTMLElement | null = null;
  private items: NodeListOf<HTMLElement> | null = null;
  
  private initialized: boolean = false;
  private isHoverLocked: boolean = true;
  private unlockTimer: number | null = null;

  public init() {
    this.cameraEl = document.getElementById('rogue-choice-camera');
    this.sceneEl = document.getElementById('rogue-choice-scene');
    this.bgLeft = document.getElementById('rogue-bg-left');
    this.bgRight = document.getElementById('rogue-bg-right');
    this.plaqueEl = document.getElementById('saved-run-info-box');
    this.items = document.querySelectorAll('.rogue-choice-item');

    if (!this.cameraEl || !this.items || !this.sceneEl) return;

    // Periodo de gracia inicial (700ms) para que al abrir la pantalla no se active
    // automáticamente el lado izquierdo por la posición previa del cursor en el menú principal.
    this.isHoverLocked = true;
    if (this.unlockTimer !== null) {
      window.clearTimeout(this.unlockTimer);
    }
    this.unlockTimer = window.setTimeout(() => {
      this.isHoverLocked = false;
      this.unlockTimer = null;
    }, 700);

    if (!this.initialized) {
      this.items.forEach(item => {
        item.addEventListener('mouseenter', (e) => {
          if (this.isHoverLocked) return;
          this.onHoverEnter(e.currentTarget as HTMLElement);
          SoundFX.playPlaceStone();
        });
        item.addEventListener('mouseleave', () => {
          if (this.isHoverLocked) return;
          this.onHoverLeave();
        });
        // Si el usuario mueve el ratón activamente tras el periodo de gracia, se activa el hover
        item.addEventListener('mousemove', (e) => {
          if (!this.isHoverLocked && (!this.cameraEl?.style.transform || this.cameraEl?.style.transform === 'scale(1) translate3d(0px, 0px, 0px)')) {
            this.onHoverEnter(e.currentTarget as HTMLElement);
          }
        });
      });
      this.initialized = true;
    }
    
    // Initial reset to neutral composition (ambos caminos y textos visibles en paralelo)
    this.onHoverLeave();
  }

  private onHoverEnter(target: HTMLElement) {
    if (!this.cameraEl || !this.sceneEl) return;

    const isLeft = target.id === 'btn-rogue-start-fresh';
    const scale = 1.06;
    const deltaX = isLeft ? 120 : -120;
    const deltaY = -15;
    
    // Subtle cinematic camera pan & dolly-in
    this.cameraEl.style.transform = `scale(${scale}) translate3d(${deltaX}px, ${deltaY}px, 0)`;

    // Backgrounds DoF and brightness adjustment
    if (this.bgLeft && this.bgRight) {
      if (isLeft) {
        this.bgLeft.style.filter = 'grayscale(20%) brightness(0.85) contrast(1.05)';
        this.bgLeft.style.transform = 'scale(1.04)';
        this.bgRight.style.filter = 'grayscale(80%) brightness(0.25) blur(7px)';
        this.bgRight.style.transform = 'scale(0.98)';
      } else {
        this.bgRight.style.filter = 'saturate(1.65) brightness(1.05) contrast(1.15)';
        this.bgRight.style.transform = 'scale(1.04)';
        this.bgLeft.style.filter = 'grayscale(80%) brightness(0.2) blur(7px)';
        this.bgLeft.style.transform = 'scale(0.98)';
      }
    }

    // Central Plaque opacity & DoF
    if (this.plaqueEl) {
      this.plaqueEl.style.opacity = '0.45';
      this.plaqueEl.style.filter = 'blur(2px)';
    }

    // Hero standees & text labels
    this.items?.forEach(item => {
      const img = item.querySelector('.rogue-hero-img') as HTMLElement;
      const label = item.querySelector('.rogue-choice-label') as HTMLElement;
      const isThisTarget = item === target;
      
      if (!isThisTarget) {
        if (img) {
          const isImgLeft = img.id === 'rogue-hero-img-left';
          img.style.filter = 'grayscale(80%) brightness(0.25) blur(8px)';
          img.style.transform = isImgLeft ? 'scaleX(-1) rotate(-3deg) scale(0.92)' : 'scale(0.92)';
        }
        if (label) {
          label.style.opacity = '0.2';
          label.style.filter = 'blur(4px)';
          label.style.transform = 'translateY(12px) scale(0.95)';
        }
      } else {
        if (img) {
          const isImgLeft = img.id === 'rogue-hero-img-left';
          if (isImgLeft) {
            img.style.filter = 'grayscale(20%) brightness(1.1) drop-shadow(0 0 25px rgba(251, 191, 36, 0.5)) blur(0px)';
            img.style.transform = 'scaleX(-1) rotate(-3deg) scale(1.06)';
          } else {
            img.style.filter = 'saturate(1.4) brightness(1.2) drop-shadow(0 0 25px rgba(52, 211, 153, 0.6)) blur(0px)';
            img.style.transform = 'scale(1.06)';
          }
        }
        if (label) {
          label.style.opacity = '1';
          label.style.filter = 'blur(0px)';
          label.style.transform = 'translateY(-4px) scale(1.04)';
        }
      }
    });
  }

  private onHoverLeave() {
    if (!this.cameraEl) return;

    // Reset camera to neutral wide framing
    this.cameraEl.style.transform = 'scale(1) translate3d(0, 0, 0)';

    // Reset backgrounds (Left grayish/subdued, Right vivid/saturated)
    if (this.bgLeft) {
      this.bgLeft.style.filter = 'grayscale(60%) brightness(0.5) contrast(0.95)';
      this.bgLeft.style.transform = 'scale(1)';
    }
    if (this.bgRight) {
      this.bgRight.style.filter = 'saturate(1.4) brightness(0.8) contrast(1.1)';
      this.bgRight.style.transform = 'scale(1)';
    }

    // Reset central plaque
    if (this.plaqueEl) {
      this.plaqueEl.style.opacity = '1';
      this.plaqueEl.style.filter = 'blur(0px)';
    }

    // Reset hero standees and labels (Ambos textos claramente visibles con sus colores correspondientes)
    this.items?.forEach(item => {
      const img = item.querySelector('.rogue-hero-img') as HTMLElement;
      const label = item.querySelector('.rogue-choice-label') as HTMLElement;
      
      if (img) {
        const isImgLeft = img.id === 'rogue-hero-img-left';
        if (isImgLeft) {
          img.style.filter = 'grayscale(45%) brightness(0.7) drop-shadow(4px 8px 16px rgba(0,0,0,0.8)) blur(0px)';
          img.style.transform = 'scaleX(-1) rotate(-3deg)';
        } else {
          img.style.filter = 'saturate(1.25) brightness(0.9) drop-shadow(4px 8px 16px rgba(0,0,0,0.8)) blur(0px)';
          img.style.transform = 'scale(1)';
        }
      }
      if (label) {
        label.style.opacity = '0.92';
        label.style.filter = 'blur(0px)';
        label.style.transform = 'translateY(0px) scale(1)';
      }
    });
  }
}

