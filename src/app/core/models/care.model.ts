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
  critical: boolean;
  escalationDelayMinutes?: number;
  escalationTutorId?: number;
  estimatedCostAmount?: number | null;
  estimatedCostCurrency?: string | null;
  active: boolean;
  timezone?: string;
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
  responsibleTutorId: number | null;
  critical: boolean;
  escalationDelayMinutes: number | null;
  escalationTutorId: number | null;
  estimatedCostAmount: number | null;
  estimatedCostCurrency: string | null;
}

export interface CareOccurrence {
  id: string;
  version?: number;
  planId: string;
  petId: number;
  responsibleTutorId: number;
  type: EventType;
  title: string;
  instructions?: string;
  dueAt: string;
  status: CareOccurrenceStatus;
  completedAt?: string;
  completedByTutorId?: number;
  completionNote?: string;
  critical: boolean;
  escalationDelayMinutes?: number;
  escalationTutorId?: number;
  estimatedCostAmount?: number | null;
  estimatedCostCurrency?: string | null;
  canUndoUntil?: string;
  timezone?: string;
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
  timezone?: string;
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
