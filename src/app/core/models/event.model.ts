export type EventType = 'VACCINE' | 'MEDICINE' | 'DIARY' | 'BREED' | 'SERVICE';
export type RecurrenceFrequency = 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY';
export type EventStatus = 'PENDING' | 'DONE';

export interface Recurrence {
  frequency: RecurrenceFrequency;
  intervalCount: number;
  repetitions?: number;
  finalDate?: string; // format: date-time
}

export interface Event {
  id: number;
  type: EventType;
  description?: string;
  dateStart: string; // format: date-time
  recurrence?: Recurrence;
  status: EventStatus;
}

export interface EventInfo {
    id: number;
    type: EventType;
    dateStart: string; // format: date-time
}

export interface EventSummary {
  id: number;
  type: EventType;
  description?: string;
  dateStart: string; // format: date-time
  petId: number;
  status: EventStatus;
}

export interface EventsPage {
  items: EventSummary[];
  total: number;
  page: number;
  size: number;
}

export interface EventCreateRequest {
  petId: number;
  type: EventType;
  description: string;
  dateStart: string; // format: date-time
  frequency?: RecurrenceFrequency;
  intervalCount: number;
  repetitions?: number;
  finalDate?: string; // format: date-time
}

export interface EventUpdateRequest {
    type?: EventType;
    description?: string;
    dateStart?: string; // format: date-time
    frequency?: RecurrenceFrequency;
    intervalCount?: number;
    repetitions?: number;
    finalDate?: string; // format: date-time
}

// Helper functions for status conversion
export function isEventDone(status: EventStatus): boolean {
    return status === 'DONE';
}

export function getEventStatus(isDone: boolean): EventStatus {
    return isDone ? 'DONE' : 'PENDING';
}

export function statusToBoolean(status: EventStatus): boolean {
    return status === 'DONE';
}

export function booleanToStatus(done: boolean): EventStatus {
    return done ? 'DONE' : 'PENDING';
}
