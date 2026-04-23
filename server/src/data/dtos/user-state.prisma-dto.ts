// data/dtos/user-state.prisma-dto.ts

export type UserStateDto = {
  id: string;
  userId: string;
  currentWeek: number; // 1…
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserStateDto = {
  userId: string;
  currentWeek?: number; // по умолчанию 1
};

export type UpdateUserStateDto = {
  currentWeek?: number;
  updatedAt?: Date; // обычно не нужно, будет обновляться автоматом
};
