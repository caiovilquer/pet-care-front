export interface Location {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone?: string;
  rating: number;
  reviewCount: number;
  distance: number; // distância em km
  distanceText?: string; // texto formatado da distância (ex: "2.5 km")
  durationText?: string; // tempo de viagem (ex: "5 min")
  isOpen: boolean;
  openingHours: OpeningHours;
  services: string[];
  type: 'petshop' | 'veterinary';
}

export interface OpeningHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string; // HH:mm format
  closeTime?: string; // HH:mm format
}

export interface Petshop extends Location {
  type: 'petshop';
  hasGrooming: boolean;
  hasDaycare: boolean;
  hasHotel: boolean;
  hasVaccination: boolean;
  acceptedPetTypes: PetType[];
}

export interface Veterinary extends Location {
  type: 'veterinary';
  hasEmergency: boolean;
  hasLaboratory: boolean;
  hasSurgery: boolean;
  hasRadiology: boolean;
  specialties: VeterinarySpecialty[];
  acceptedPetTypes: PetType[];
}

export enum PetType {
  DOG = 'dog',
  CAT = 'cat',
  BIRD = 'bird',
  FISH = 'fish',
  RABBIT = 'rabbit',
  HAMSTER = 'hamster',
  OTHER = 'other'
}

export enum VeterinarySpecialty {
  GENERAL = 'general',
  CARDIOLOGY = 'cardiology',
  DERMATOLOGY = 'dermatology',
  ORTHOPEDICS = 'orthopedics',
  ONCOLOGY = 'oncology',
  OPHTHALMOLOGY = 'ophthalmology',
  NEUROLOGY = 'neurology',
  DENTISTRY = 'dentistry'
}

export interface LocationSearchParams {
  zipCode: string;
  radius: number; // em km
  type: 'petshop' | 'veterinary';
  services?: string[];
  petTypes?: PetType[];
  isOpenNow?: boolean;
  sortBy?: 'distance' | 'rating' | 'name';
}

export interface LocationSearchResponse {
  locations: (Petshop | Veterinary)[];
  total: number;
  searchParams: LocationSearchParams;
}
