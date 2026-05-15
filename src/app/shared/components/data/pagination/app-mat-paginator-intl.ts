import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

@Injectable()
export class AppMatPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Itens por página:';
  override nextPageLabel = 'Página seguinte';
  override previousPageLabel = 'Página anterior';
  override firstPageLabel = 'Primeira página';
  override lastPageLabel = 'Última página';

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return '0 de 0';
    }
    const safeLength = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, safeLength);
    return `${startIndex + 1} – ${endIndex} de ${safeLength}`;
  };
}
