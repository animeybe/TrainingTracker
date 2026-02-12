import { User } from "../entities/User";

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(userData: Omit<User, "id">): Promise<User>;
  findById(id: string): Promise<User | null>;
}
