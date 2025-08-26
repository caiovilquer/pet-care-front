import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateTimeService {

  /**
   * Formata uma data para envio à API no formato correto do timezone local
   * Resolve problema de diferença de 3 horas
   */
  formatDateTimeForAPI(date: Date): string {
    if (!date) {
      console.warn('DateTimeService.formatDateTimeForAPI - Date is null/undefined');
      return '';
    }

    console.log('DateTimeService.formatDateTimeForAPI - Input date:', date);

    // Usar timezone local em vez de UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Obter offset do timezone local em minutos
    const timezoneOffset = date.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const offsetMinutes = Math.abs(timezoneOffset) % 60;
    const offsetSign = timezoneOffset <= 0 ? '+' : '-';
    const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

    const result = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetString}`;
    console.log('DateTimeService.formatDateTimeForAPI - Output:', result);
    return result;
  }

  /**
   * Formata apenas a data (sem hora) para API
   * Resolve problema de mudança de dia
   */
  formatDateOnlyForAPI(date: Date | string): string {
    if (!date) return '';

    let dateObj: Date;
    if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }

    // Usar timezone local para evitar mudança de dia
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Converte string de data da API para Date local
   * Resolve problemas de interpretação de timezone
   */
  parseAPIDate(dateString: string): Date | null {
    if (!dateString) return null;

    // Se a string tem timezone (Z ou +/-), usar parsing normal
    if (dateString.includes('Z') || dateString.includes('+') || (dateString.includes('-') && dateString.length > 10)) {
      return new Date(dateString);
    }

    // Se é apenas data (YYYY-MM-DD), criar date local
    if (dateString.length === 10 && dateString.includes('-')) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    // Se é datetime sem timezone (YYYY-MM-DDTHH:mm:ss), criar date local
    if (dateString.includes('T')) {
      const [datePart, timePart] = dateString.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes, seconds = 0] = timePart.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes, seconds);
    }

    // Fallback para parsing normal
    return new Date(dateString);
  }

  /**
   * Formata data para exibição no formato brasileiro
   */
  formatForDisplay(dateString: string): string {
    const date = this.parseAPIDate(dateString);
    if (!date) return 'N/A';

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formata data e hora para exibição no formato brasileiro
   */
  formatDateTimeForDisplay(dateString: string): string {
    const date = this.parseAPIDate(dateString);
    if (!date) return 'N/A';

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Combina data e hora em um objeto Date local
   */
  combineDateAndTime(date: Date, timeString: string): Date {
    if (!date || !timeString) return date;

    const [hours, minutes] = timeString.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  }

  /**
   * Extrai a hora de uma string de datetime
   */
  extractTime(dateString: string): string {
    const date = this.parseAPIDate(dateString);
    if (!date) return '';

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Verifica se uma data está no passado
   */
  isPastDate(dateString: string): boolean {
    const date = this.parseAPIDate(dateString);
    if (!date) return false;

    const now = new Date();
    return date < now;
  }
}
