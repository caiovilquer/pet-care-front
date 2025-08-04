export interface TutorSummary {
  id: number;
  fullName: string;
  email: string;
  petsCount: number;
}

export interface TutorDetailResult {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  pets: PetInfo[];
}

export interface TutorCreatedResult {
  tutorId: number;
}

export interface TutorsPageResult {
  items: TutorSummary[];
  total: number;
  page: number;
  size: number;
}

export interface PetInfo {
  id: number;
  name: string;
  specie: string;
}
