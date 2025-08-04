export interface LoginDto {
  email: string;
  password: string;
}

export interface TokenDto {
  token: string;
}

export interface CreateRequest {
  firstName: string;
  lastName?: string;
  email: string;
  rawPassword: string;
  phoneNumber?: string;
  avatar?: string;
}

export interface UpdateRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
}
