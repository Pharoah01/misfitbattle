/**
 * Toast Notification System
 * Styled to match the project's dark/purple theme.
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
}

class ToastManager {
  private container: HTMLDivElement | null = null;
  private toasts: Map<string, HTMLDivElement> = new Map();

  private initContainer(): void {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  private show(message: string, type: ToastType, options: ToastOptions = {}): void {
    this.initContainer();
    if (!this.container) return;

    const id = `toast-${Date.now()}-${Math.random()}`;
    const duration = options.duration || 4000;
    const colors = this.getColors(type);

    const toast = document.createElement('div');
    toast.id = id;
    toast.style.cssText = `
      padding: 0.875rem 1.25rem;
      border-radius: 0.5rem;
      max-width: 22rem;
      pointer-events: auto;
      animation: toastSlideIn 0.25s ease-out;
      background: #111111;
      border: 1px solid ${colors.border};
      color: #FFFFFF;
      font-size: 0.8125rem;
      font-family: 'Rajdhani', sans-serif;
      font-weight: 500;
      line-height: 1.4;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(107, 45, 255, 0.05);
    `;

    // Accent bar
    const bar = document.createElement('div');
    bar.style.cssText = `
      width: 3px;
      height: 100%;
      min-height: 1.25rem;
      border-radius: 2px;
      background: ${colors.accent};
      flex-shrink: 0;
    `;

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    messageSpan.style.cssText = `flex: 1; word-wrap: break-word;`;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&#215;';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: #B0B0B0;
      font-size: 1.125rem;
      cursor: pointer;
      padding: 0;
      width: 1.25rem;
      height: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.25rem;
      transition: color 0.15s, background 0.15s;
      flex-shrink: 0;
    `;
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.color = '#FFFFFF';
      closeBtn.style.background = 'rgba(255,255,255,0.1)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.color = '#B0B0B0';
      closeBtn.style.background = 'none';
    });
    closeBtn.addEventListener('click', () => this.remove(id));
    closeBtn.setAttribute('aria-label', 'Close');

    toast.appendChild(bar);
    toast.appendChild(messageSpan);
    toast.appendChild(closeBtn);

    this.container.appendChild(toast);
    this.toasts.set(id, toast);

    const timeout = setTimeout(() => this.remove(id), duration);
    (toast as any)._timeout = timeout;
  }

  private remove(id: string): void {
    const toast = this.toasts.get(id);
    if (!toast) return;
    clearTimeout((toast as any)._timeout);
    toast.style.animation = 'toastSlideOut 0.2s ease-in forwards';
    setTimeout(() => {
      toast.remove();
      this.toasts.delete(id);
    }, 200);
  }

  private getColors(type: ToastType) {
    switch (type) {
      case 'success': return { accent: '#10B981', border: 'rgba(16,185,129,0.25)' };
      case 'error': return { accent: '#EF4444', border: 'rgba(239,68,68,0.25)' };
      case 'warning': return { accent: '#F59E0B', border: 'rgba(245,158,11,0.25)' };
      case 'info': return { accent: '#6B2DFF', border: 'rgba(107,45,255,0.25)' };
      default: return { accent: '#6B7280', border: 'rgba(107,114,128,0.25)' };
    }
  }

  success(message: string, options?: ToastOptions) { this.show(message, 'success', options); }
  error(message: string, options?: ToastOptions) { this.show(message, 'error', options); }
  info(message: string, options?: ToastOptions) { this.show(message, 'info', options); }
  warning(message: string, options?: ToastOptions) { this.show(message, 'warning', options); }
  clearAll() { this.toasts.forEach((_, id) => this.remove(id)); }
}

// Inject keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes toastSlideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes toastSlideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

export const toast = new ToastManager();
