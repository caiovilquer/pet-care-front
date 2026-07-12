import { EventInfo } from "./event.model";

export interface Pet {
    id: number;
    name: string;
    species: string;
    breed?: string;
    birthdate?: string; // format: date
    photoUrl?: string; // URL da foto do pet
    photoAssetId?: string;
    events: EventInfo[];
}

export interface PetInfo {
    id: number;
    name: string;
    species: string;
    photoUrl?: string;
    photoAssetId?: string;
}

export interface PetSummary {
    id: number;
    name: string;
    species: string;
    photoUrl?: string; // URL da foto do pet
    photoAssetId?: string;
}

export interface PetsPage {
    items: PetSummary[];
    total: number;
    page: number;
    size: number;
}

export interface PetCreateRequest {
    name: string;
    species: string;
    breed?: string;
    birthdate?: string | null; // format: date
    photoUrl?: string | null; // URL da foto do pet
}

export interface PetUpdateRequest {
    name: string;
    breed: string | null;
    birthdate: string | null; // format: date
    photoUrl: string | null; // URL da foto do pet
}
