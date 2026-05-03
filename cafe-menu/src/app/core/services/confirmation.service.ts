import { Injectable, signal } from '@angular/core';

/**
 * Confirmation Dialog Configuration
 */
export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

/**
 * Confirmation Service
 *
 * Provides a custom confirmation dialog to replace browser's confirm()
 * More flexible, styleable, and consistent with the app design
 *
 * Usage:
 * ```typescript
 * const confirmed = await this.confirmationService.confirm({
 *   title: 'Delete Item',
 *   message: 'Are you sure you want to delete this item?',
 *   type: 'danger'
 * });
 *
 * if (confirmed) {
 *   // User confirmed
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  // Signals for dialog state
  isOpen = signal(false);
  config = signal<ConfirmationConfig | null>(null);

  private resolveCallback: ((value: boolean) => void) | null = null;

  /**
   * Show confirmation dialog
   *
   * @param config - Configuration for the confirmation dialog
   * @returns Promise that resolves to true if confirmed, false if canceled
   */
  async confirm(config: ConfirmationConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.config.set({
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        type: 'warning',
        ...config
      });
      this.isOpen.set(true);
      this.resolveCallback = resolve;
    });
  }

  /**
   * Handle user confirmation
   */
  handleConfirm(): void {
    this.close(true);
  }

  /**
   * Handle user cancellation
   */
  handleCancel(): void {
    this.close(false);
  }

  /**
   * Close the dialog
   *
   * @param result - The result to resolve the promise with
   */
  private close(result: boolean): void {
    this.isOpen.set(false);
    if (this.resolveCallback) {
      this.resolveCallback(result);
      this.resolveCallback = null;
    }
    // Clear config after a delay to allow animation
    setTimeout(() => this.config.set(null), 300);
  }
}
