import { EventInfo } from "./event.model";

export interface Pet {
    id: number;
    name: string;
    specie: string;
    race: string;
    birthdate: string; // format: date
    events: EventInfo[];
}

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

export interface PetsPage {
    items: PetSummary[];
    total: number;
    page: number;
    size: number;
}

export interface PetCreateRequest {
    name: string;
    specie: string;
    race?: string;
    birthdate: string; // format: date
}

export interface PetUpdateRequest {
    name?: string;
    specie?: string;
    race?: string;
    birthdate?: string; // format: date
}
