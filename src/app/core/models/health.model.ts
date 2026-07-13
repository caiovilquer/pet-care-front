export type HealthRecordType =
  | 'VACCINE' | 'MEDICATION' | 'CONSULTATION' | 'EXAM' | 'SYMPTOM' | 'DAILY_CARE';

export type HealthMeasurementType = 'WEIGHT' | 'TEMPERATURE' | 'BODY_CONDITION_SCORE';
export type HealthMeasurementUnit = 'KILOGRAM' | 'CELSIUS' | 'SCORE_1_TO_9';

export interface HealthAttachment {
  id: string;
  mediaAssetId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  contentUrl: string;
}

export interface HealthRecord {
  id: string;
  version: number;
  petId: number;
  type: HealthRecordType;
  occurredAt: string;
  title: string;
  notes?: string | null;
  productName?: string | null;
  dosage?: string | null;
  batchNumber?: string | null;
  professionalName?: string | null;
  clinicName?: string | null;
  costAmount?: number | null;
  currency?: string | null;
  createdByTutorId: number;
  attachments: HealthAttachment[];
}

export interface HealthRecordRequest {
  type: HealthRecordType;
  occurredAt: string;
  title: string;
  notes: string | null;
  productName: string | null;
  dosage: string | null;
  batchNumber: string | null;
  professionalName: string | null;
  clinicName: string | null;
  costAmount: number | null;
  currency: string | null;
}

export interface HealthRecordsPage {
  items: HealthRecord[];
  total: number;
  page: number;
  size: number;
}

export interface HealthMeasurement {
  id: string;
  version: number;
  petId: number;
  type: HealthMeasurementType;
  value: number;
  unit: HealthMeasurementUnit;
  measuredAt: string;
  notes?: string | null;
  createdByTutorId: number;
}

export interface HealthMeasurementRequest {
  type: HealthMeasurementType;
  value: number;
  measuredAt: string;
  notes: string | null;
}

export const HEALTH_RECORD_META: Record<HealthRecordType, { label: string; icon: string; tone: string }> = {
  VACCINE: { label: 'Vacina', icon: 'vaccines', tone: 'vaccine' },
  MEDICATION: { label: 'Medicamento', icon: 'medication', tone: 'medication' },
  CONSULTATION: { label: 'Consulta', icon: 'local_hospital', tone: 'consultation' },
  EXAM: { label: 'Exame', icon: 'biotech', tone: 'exam' },
  SYMPTOM: { label: 'Sintoma', icon: 'sick', tone: 'symptom' },
  DAILY_CARE: { label: 'Cuidado diário', icon: 'favorite', tone: 'daily' }
};

export const HEALTH_MEASUREMENT_META: Record<HealthMeasurementType, { label: string; shortUnit: string; icon: string }> = {
  WEIGHT: { label: 'Peso', shortUnit: 'kg', icon: 'monitor_weight' },
  TEMPERATURE: { label: 'Temperatura', shortUnit: '°C', icon: 'device_thermostat' },
  BODY_CONDITION_SCORE: { label: 'Condição corporal', shortUnit: '/9', icon: 'pets' }
};
