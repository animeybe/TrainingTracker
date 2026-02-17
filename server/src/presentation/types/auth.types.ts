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
  role: string;
  isActive: boolean;
  token: string;
}

export interface MeResponseDto {
  userId: string;
  login: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user: {
    id: string;
    login: string;
    role: string;
  };
}
