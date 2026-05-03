import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from '../../../core/services/confirmation.service';

/**
 * Confirmation Dialog Component
 *
 * A reusable confirmation dialog component
 * Controlled by ConfirmationService
 */
@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="confirmationService.isOpen()" class="modal-backdrop" (click)="confirmationService.handleCancel()">
      <div class="modal-content confirmation-dialog" (click)="$event.stopPropagation()" [attr.data-type]="confirmationService.config()?.type">
        <div class="modal-header">
          <h3>{{ confirmationService.config()?.title }}</h3>
        </div>

        <div class="modal-body">
          <p>{{ confirmationService.config()?.message }}</p>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            (click)="confirmationService.handleCancel()">
            {{ confirmationService.config()?.cancelText }}
          </button>
          <button
            type="button"
            class="btn"
            [class.btn-danger]="confirmationService.config()?.type === 'danger'"
            [class.btn-primary]="confirmationService.config()?.type !== 'danger'"
            (click)="confirmationService.handleConfirm()">
            {{ confirmationService.config()?.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      max-width: 400px;
    }

    .confirmation-dialog[data-type="danger"] .modal-header h3 {
      color: var(--danger, #dc3545);
    }

    .confirmation-dialog[data-type="warning"] .modal-header h3 {
      color: var(--warning, #ffc107);
    }

    .modal-body p {
      margin: 0;
      line-height: 1.6;
      color: var(--color-text, #333);
    }
  `]
})
export class ConfirmationDialogComponent {
  confirmationService = inject(ConfirmationService);
}
