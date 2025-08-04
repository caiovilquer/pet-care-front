import { Pet, PetInfo } from './pet.model';
import { Event } from './event.model';

export interface Tutor {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
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
