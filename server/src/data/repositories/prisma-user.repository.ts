import { PrismaClient, Role } from "@prisma/client";
import { UserDto, isUserDto } from "../types/user.dto";
import { UserMapper } from "../mappers/user.mapper";
import { UserId } from "../../common/types/ids";
import { IUserRepository } from "../../domain/repositories/i-user.repository";
import { User } from "../../domain/entities/user";

export class PrismaUserRepository implements IUserRepository {
  private readonly mapper = new UserMapper();
  constructor(private prisma: PrismaClient) {}

  async findById(id: UserId): Promise<User> {
    const dto = (await this.prisma.user.findUnique({
      where: { id: id.value },
    })) as UserDto | null;

    if (!dto || !isUserDto(dto)) {
      throw new Error(`User ${id.value} not found`);
    }
    return this.mapper.toDomain(dto);
  }

  async findByLogin(login: string): Promise<User | null> {
    const dto = (await this.prisma.user.findUnique({
      where: { login },
    })) as UserDto | null;
    return dto && isUserDto(dto) ? this.mapper.toDomain(dto) : null;
  }

  async create(data: {
    login: string;
    email: string | null;
    password: string;
    role: Role;
    isActive: boolean;
  }): Promise<User> {
    const dto = (await this.prisma.user.create({ data })) as UserDto;
    return this.mapper.toDomain(dto);
  }
}
    