// domain/entities/user-state.entity.ts

export type UserStateEntity = {
  id: string;
  userId: string;
  currentWeek: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserStateEntity = {
  userId: string;
  currentWeek: number;
};

export type UpdateUserStateEntity = {
  currentWeek?: number;
};
