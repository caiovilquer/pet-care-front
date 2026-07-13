import { HealthMeasurementType, HealthMeasurementUnit, HealthRecordType } from './health.model';

export interface VeterinaryPet { id: number; name: string; species: string; breed?: string; birthdate?: string; }
export interface CareAdherence { completed: number; overdue: number; upcoming: number; cancelled: number; adherencePercent?: number | null; }
export interface VeterinaryRecord {
  id: string; type: HealthRecordType; occurredAt: string; title: string; notes?: string | null;
  productName?: string | null; dosage?: string | null; batchNumber?: string | null;
  professionalName?: string | null; clinicName?: string | null; costAmount?: number | null; currency?: string | null;
}
export interface VeterinaryMeasurement {
  id: string; type: HealthMeasurementType; value: number; unit: HealthMeasurementUnit; measuredAt: string;
}
export interface VeterinaryDocument {
  mediaId: string; recordId: string; filename: string; contentType: string; sizeBytes: number; occurredAt: string;
}
export interface VeterinarySummary {
  pet: VeterinaryPet; from: string; to: string; generatedAt: string; adherence: CareAdherence;
  records: VeterinaryRecord[]; measurements: VeterinaryMeasurement[]; documents: VeterinaryDocument[]; truncated: boolean;
}
export interface VeterinaryShareRequest {
  petId: number; label: string; from: string; to: string; expiresInHours: number;
  includeNotes: boolean; includeCosts: boolean; includeDocuments: boolean;
}
export interface VeterinaryShareCreated { id: string; token: string; expiresAt: string; }
export interface VeterinaryShare {
  id: string; version: number; petId: number; label: string; from: string; to: string;
  includeNotes: boolean; includeCosts: boolean; includeDocuments: boolean; expiresAt: string;
  revokedAt?: string | null; createdAt: string; lastAccessedAt?: string | null; accessCount: number;
}
export interface PublicVeterinarySummary { shareId: string; label: string; expiresAt: string; summary: VeterinarySummary; }
