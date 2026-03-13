/**
 * Toast Notification System
 * Simple toast notifications for user feedback
 * 
 * Note: This is a minimal implementation for Phase 1
 * Can be replaced with a library like react-hot-toast later
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

class ToastManager {
  private container: HTMLDivElement | null = null;
  private toasts: Map<string, HTMLDivElement> = new Map();

  /**
   * Initialize toast container
   */
  private initContainer(): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Show a toast notification
   */
  private show(message: string, type: ToastType, options: ToastOptions = {}): void {
    this.initContainer();
    if (!this.container) return;

    const id = `toast-${Date.now()}-${Math.random()}`;
    const duration = options.duration || 5000;

    const toast = document.createElement('div');
    toast.id = id;
    toast.style.cssText = `
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      max-width: 24rem;
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      background-color: ${this.getBackgroundColor(type)};
      color: white;
      font-size: 0.875rem;
      line-height: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      position: relative;
    `;

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    messageSpan.style.cssText = `
      flex: 1;
      word-wrap: break-word;
    `;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 1.25rem;
      font-weight: bold;
      cursor: pointer;
      padding: 0;
      margin: 0;
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.25rem;
      transition: background-color 0.2s ease;
      flex-shrink: 0;
    `;

    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    });

    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'transparent';
    });

    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.remove(id);
    });

    closeButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        this.remove(id);
      }
    });

    closeButton.setAttribute('tabindex', '0');
    closeButton.setAttribute('aria-label', 'Close notification');

    toast.appendChild(messageSpan);
    toast.appendChild(closeButton);

    this.container.appendChild(toast);
    this.toasts.set(id, toast);

    const timeoutId = setTimeout(() => {
      this.remove(id);
    }, duration);

    (toast as any).timeoutId = timeoutId;
  }

  /**
   * Remove a toast
   */
  private remove(id: string): void {
    const toast = this.toasts.get(id);
    if (!toast) return;

    if ((toast as any).timeoutId) {
      clearTimeout((toast as any).timeoutId);
    }

    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      toast.remove();
      this.toasts.delete(id);
    }, 300);
  }

  /**
   * Get background color for toast type
   */
  private getBackgroundColor(type: ToastType): string {
    switch (type) {
      case 'success':
        return '#10B981'; // green-500
      case 'error':
        return '#EF4444'; // red-500
      case 'warning':
        return '#F59E0B'; // amber-500
      case 'info':
        return '#3B82F6'; // blue-500
      default:
        return '#6B7280'; // gray-500
    }
  }

  /**
   * Clear all toasts
   */
  clearAll(): void {
    this.toasts.forEach((_, id) => {
      this.remove(id);
    });
  }

  /**
   * Public API
   */
  success(message: string, options?: ToastOptions): void {
    this.show(message, 'success', options);
  }

  error(message: string, options?: ToastOptions): void {
    this.show(message, 'error', options);
  }

  info(message: string, options?: ToastOptions): void {
    this.show(message, 'info', options);
  }

  warning(message: string, options?: ToastOptions): void {
    this.show(message, 'warning', options);
  }
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  /* Toast close button accessibility */
  #toast-container button:focus {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 1px;
  }

  /* Prevent text selection on toast close button */
  #toast-container button {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
`;
document.head.appendChild(style);

export const toast = new ToastManager();
