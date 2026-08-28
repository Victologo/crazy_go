// controllers/MenuCameraController.ts
// Controlador de Cámara Espacial 2.5D para el Menú Principal con Zoom Óptico Focal y Aceleración Logarítmica

import { SoundFX } from '../audio/SoundFX';

export class MenuCameraController {
  private static instance: MenuCameraController | null = null;

  private cameraEl: HTMLElement | null = null;
  private menuCard: HTMLElement | null = null;
  private items: NodeListOf<HTMLElement> | null = null;
  private brand: HTMLElement | null = null;
  
  private currentTarget: HTMLElement | null = null;
  private leaveTimeout: number | null = null;
  
  constructor() {
    MenuCameraController.instance = this;
    this.cameraEl = document.getElementById('menu-camera');
    this.menuCard = document.getElementById('dojo-spatial-scene');
    this.brand = document.getElementById('menu-title-board') || document.getElementById('btn-menu-title');
    this.items = document.querySelectorAll('.dojo-item:not(#menu-title-board):not(#btn-menu-title)');
  }

  public static reset(): void {
    if (this.instance) {
      this.instance.resetCamera();
    }
  }

  public init(): void {
    if (!this.cameraEl || !this.items || !this.menuCard) return;

    this.items.forEach(item => {
      // Hover del ratón
      item.addEventListener('mouseenter', (e) => this.onHoverEnter(e.currentTarget as HTMLElement));
      item.addEventListener('mouseleave', (e) => this.onHoverLeave(e.currentTarget as HTMLElement));
      
      // Accesibilidad con teclado (Tab / Focus)
      item.addEventListener('focus', (e) => this.onHoverEnter(e.currentTarget as HTMLElement));
      item.addEventListener('blur', (e) => this.onHoverLeave(e.currentTarget as HTMLElement));

      // Feedback táctil al hacer clic / activar
      item.addEventListener('click', (e) => this.onItemClick(e.currentTarget as HTMLElement));
    });
  }

  private onHoverEnter(target: HTMLElement): void {
    if (!this.cameraEl || !this.menuCard) return;

    // Si había un temporizador de salida pendiente, cancelarlo de inmediato para una transición fluida entre botones
    if (this.leaveTimeout !== null) {
      window.clearTimeout(this.leaveTimeout);
      this.leaveTimeout = null;
    }

    if (this.currentTarget === target) return;
    this.currentTarget = target;

    // Feedback sonoro sutil de piedra Go al posar la mirada sobre un elemento
    SoundFX.playPlaceStone();

    // 1. Obtener la silueta / imagen 3D específica del objeto (o el contenedor como fallback)
    const focalImg = (target.querySelector('img') || target) as HTMLElement;

    // 2. Calcular la posición central de la imagen relativa a la escena espacial del dojo
    const sceneRect = this.menuCard.getBoundingClientRect();
    const focalRect = focalImg.getBoundingClientRect();

    const targetCenterX = focalRect.left + focalRect.width / 2 - sceneRect.left;
    const targetCenterY = focalRect.top + focalRect.height / 2 - sceneRect.top;

    const sceneWidth = sceneRect.width || 1920;
    const sceneHeight = sceneRect.height || 1080;

    // Porcentaje focal exacto de la silueta para transform-origin (hace zoom directo a la imagen)
    const originX = Math.max(5, Math.min(95, (targetCenterX / sceneWidth) * 100));
    const originY = Math.max(5, Math.min(95, (targetCenterY / sceneHeight) * 100));

    // Zoom óptico centrado directamente en la silueta/imagen física
    this.cameraEl.style.transformOrigin = `${originX.toFixed(2)}% ${originY.toFixed(2)}%`;
    this.cameraEl.style.transform = 'scale(1.045) translateZ(15px)';

    // Efectos de Profundidad de Campo (Depth of Field)
    this.items?.forEach(item => {
      if (item !== target) {
        item.classList.add('dof-blur');
        item.classList.remove('dof-focus');
      } else {
        item.classList.add('dof-focus');
        item.classList.remove('dof-blur');
      }
    });

    if (this.brand) {
      this.brand.classList.add('dof-blur-heavy');
    }
  }

  private onHoverLeave(target: HTMLElement): void {
    if (this.currentTarget !== target) return;

    if (this.leaveTimeout !== null) {
      window.clearTimeout(this.leaveTimeout);
    }

    // Buffer mínimo de amortiguación (15ms) para respuesta ultrarrápida e inmediata
    this.leaveTimeout = window.setTimeout(() => {
      this.resetCamera();
      this.leaveTimeout = null;
    }, 15);
  }

  private onItemClick(target: HTMLElement): void {
    target.classList.add('is-activated');
    window.setTimeout(() => {
      target.classList.remove('is-activated');
    }, 250);
  }

  public resetCamera(): void {
    this.currentTarget = null;
    if (this.leaveTimeout !== null) {
      window.clearTimeout(this.leaveTimeout);
      this.leaveTimeout = null;
    }

    if (!this.cameraEl) return;

    // Restaurar encuadre general neutral
    this.cameraEl.style.transform = 'scale(1) translate3d(0, 0, 0)';
    window.setTimeout(() => {
      if (!this.currentTarget && this.cameraEl) {
        this.cameraEl.style.transformOrigin = 'center center';
      }
    }, 200);

    // Quitar efectos DoF
    this.items?.forEach(item => {
      item.classList.remove('dof-blur');
      item.classList.remove('dof-focus');
    });

    if (this.brand) {
      this.brand.classList.remove('dof-blur-heavy');
    }
  }
}
