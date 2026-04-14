import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: '././pagination.component.html',
})
export class PaginationComponent {

  @Input() currentPage: number = 1;
  @Input() totalPages: number[] = [];
  @Input() paginationInfo: string = '';

  @Output() pageChange = new EventEmitter<number>();
  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  goToPage(page: number): void {
    this.pageChange.emit(page);
  }

  goPrevious(): void {
    this.previous.emit();
  }

  goNext(): void {
    this.next.emit();
  }
}