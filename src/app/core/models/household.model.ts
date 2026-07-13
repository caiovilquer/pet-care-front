export type HouseholdRole = 'OWNER' | 'CAREGIVER' | 'VIEWER';

export interface HouseholdSummary {
  id: string; version?: number; name: string; role: HouseholdRole; isDefault: boolean; memberCount: number;
}
export interface HouseholdMember {
  id: string; version?: number; tutorId: number; firstName: string; lastName?: string; email: string;
  avatarAssetId?: string; role: HouseholdRole; joinedAt: string;
}
export interface HouseholdInvitation { id: string; email: string; role: HouseholdRole; expiresAt: string; createdAt: string; }
export interface HouseholdInvitationPreview { householdName: string; inviterName: string; role: HouseholdRole; expiresAt: string; }
export interface HouseholdActivity {
  id: string; type: string; actorName?: string; targetName?: string; petName?: string; summary: string; happenedAt: string;
}
export interface HouseholdHandoff { id: string; fromName: string; toName?: string; note: string; createdAt: string; }
export interface HouseholdOverview {
  household: HouseholdSummary; members: HouseholdMember[]; pendingInvitations: HouseholdInvitation[];
  recentActivity: HouseholdActivity[]; recentHandoffs: HouseholdHandoff[];
}

export const HOUSEHOLD_STORAGE_KEY = 'rp-household-id';
export const roleLabel = (role: HouseholdRole): string => ({ OWNER: 'Proprietário', CAREGIVER: 'Cuidador', VIEWER: 'Visualizador' })[role];
