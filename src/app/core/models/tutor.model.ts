import { PetInfo } from './pet.model';

export interface Tutor {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  avatarAssetId?: string;
  pets: PetInfo[];
}

export interface TutorSummary {
  id: number;
  fullName: string;
  email: string;
  petsCount: number;
}

export interface TutorsPage {
  items: TutorSummary[];
  total: number;
  page: number;
  size: number;
}

export interface TutorUpdateRequest {
  firstName: string;
  lastName: string | null;
  phoneNumber: string | null;
  avatar: string | null;
}

export interface TutorCreatedResult {
  tutorId: number;
}
