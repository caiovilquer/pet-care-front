export enum EventType {
  VACCINE = 'VACCINE',
  MEDICINE = 'MEDICINE',
  DIARY = 'DIARY',
  BREED = 'BREED',
  SERVICE = 'SERVICE'
}

export enum Frequency {
  YEARLY = 'YEARLY',
  MONTHLY = 'MONTHLY',
  WEEKLY = 'WEEKLY',
  DAILY = 'DAILY'
}

export interface Recurrence {
  frequency: Frequency;
  intervalCount: number;
  repetitions?: number;
  finalDate?: string;
}

export interface EventSummary {
  id: number;
  type: EventType;
  description?: string;
  dateStart: string;
  petId: number;
}

export interface EventDetailResult {
  id: number;
  type: EventType;
  description?: string;
  dateStart: string;
  recurrence?: Recurrence;
}

export interface EventRegisteredResult {
  eventId: number;
}

export interface EventsPageResult {
  items: EventSummary[];
  total: number;
  page: number;
  size: number;
}

export interface RegisterRequest {
  petId: number;
  type: string;
  description: string;
  dateStart: string;
  frequency?: Frequency;
  intervalCount: number;
  repetitions?: number;
  finalDate?: string;
}
