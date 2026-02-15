export interface LoginRequestDto {
  login: string;
  password: string;
}

export interface RegisterRequestDto {
  login: string;
  email?: string;
  password: string;
}

export interface AuthResponseDto {
  userId: string;
  login: string;
  token: string;
}
