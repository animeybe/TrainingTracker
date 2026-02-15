import { UserDto, isUserDto } from "../types/user.dto";
import { UserId } from "../../common/types/ids";
import { User } from "../../domain/entities/user";

export class UserMapper {
  toDomain(dto: UserDto): User {
    this.validateDto(dto);
    return new User(
      UserId.create(dto.id),
      dto.login,
      dto.email,
      dto.password,
      dto.role,
      dto.isActive,
      dto.createdAt,
      dto.updatedAt,
    );
  }

  toDomainMany(dtos: UserDto[]): User[] {
    return dtos.filter(isUserDto).map((dto) => this.toDomain(dto));
  }

  private validateDto(dto: UserDto): asserts dto is UserDto {
    if (!isUserDto(dto)) throw new Error("Invalid UserDto");
  }
}
