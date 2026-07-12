import { EventType, RecurrenceFrequency } from './event.model';

export type CareOccurrenceStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface CarePlan {
  id: string;
  version?: number;
  petId: number;
  responsibleTutorId: number;
  type: EventType;
  title: string;
  instructions?: string;
  startAt: string;
  recurrence?: {
    frequency: RecurrenceFrequency;
    intervalCount: number;
    repetitions?: number | null;
    finalDate?: string | null;
  };
  reminderMinutesBefore: number;
  active: boolean;
}

export interface CarePlanRequest {
  petId: number;
  type: EventType;
  title: string;
  instructions: string | null;
  startAt: string;
  frequency: RecurrenceFrequency | null;
  intervalCount: number;
  repetitions: number | null;
  finalDate: string | null;
  reminderMinutesBefore: number;
}

export interface CareOccurrence {
  id: string;
  version?: number;
  planId: string;
  petId: number;
  type: EventType;
  title: string;
  instructions?: string;
  dueAt: string;
  status: CareOccurrenceStatus;
  completedAt?: string;
  completedByTutorId?: number;
  completionNote?: string;
  canUndoUntil?: string;
}

export interface CareOccurrencesPage {
  items: CareOccurrence[];
  total: number;
  page: number;
  size: number;
}

export interface CarePlansPage {
  items: CarePlan[];
  total: number;
  page: number;
  size: number;
}

export interface TodayCare {
  date: string;
  overdue: CareOccurrence[];
  today: CareOccurrence[];
  completedToday: CareOccurrence[];
  upcomingSevenDays: number;
}

export interface CareSearch {
  from: string;
  to: string;
  petId?: number | null;
  type?: EventType | null;
  status?: CareOccurrenceStatus | null;
  page: number;
  size: number;
}
