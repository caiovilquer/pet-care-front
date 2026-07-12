import { EventSummary } from './event.model';
import { PetSummary } from './pet.model';

export interface DashboardOverview {
  firstName: string;
  lastName?: string;
  email: string;
  avatar?: string;
  avatarAssetId?: string;
  totalPets: number;
  totalEvents: number;
  pets: PetSummary[];
  upcomingEvents: EventSummary[];
}
