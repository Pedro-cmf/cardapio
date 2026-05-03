import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from '../../../core/models';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-card.component.html',
  styleUrls: ['./item-card.component.scss']
})
export class ItemCardComponent {
  @Input({ required: true }) item!: MenuItem;
}
