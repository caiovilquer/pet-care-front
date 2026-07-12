export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  token: string;
  access_token?: string;
  token_type?: string;
}

export interface SignupRequest {
  firstName: string;
  lastName?: string | null;
  email: string;
  rawPassword: string;
  phoneNumber?: string | null;
  avatar?: string | null;
}

export interface TutorCreatedResult {
  tutorId: number;
}
