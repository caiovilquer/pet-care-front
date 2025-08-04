export interface PetInfo {
  id: number;
  name: string;
  specie: string;
}

export interface PetSummary {
  id: number;
  name: string;
  specie: string;
}

export interface PetDetailResult {
  id: number;
  name: string;
  specie: string;
  race?: string;
  birthdate: string;
  events: EventInfo[];
}

export interface PetCreatedResult {
  petId: number;
}

export interface PetsPageResult {
  items: PetSummary[];
  total: number;
  page: number;
  size: number;
}

export interface EventInfo {
  id: number;
  type: EventType;
  dateStart: string;
}

export enum EventType {
  VACCINE = 'VACCINE',
  MEDICINE = 'MEDICINE',
  DIARY = 'DIARY',
  BREED = 'BREED',
  SERVICE = 'SERVICE'
}
