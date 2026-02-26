export abstract class BaseMapper<TPrismaDto, TDomain> {
  toDomain(prismaData: unknown): TDomain {
    const validated = this.validatePrismaDto(prismaData);
    return this.doMap(validated);
  }

  toDomainMany(prismaData: unknown[]): TDomain[] {
    return prismaData
      .filter((data): data is TPrismaDto => this.isValidPrismaDto(data))
      .map((data) => this.toDomain(data));
  }

  protected abstract doMap(prismaDto: TPrismaDto): TDomain;
  protected abstract validatePrismaDto(prismaData: unknown): TPrismaDto;
  protected abstract isValidPrismaDto(data: unknown): data is TPrismaDto;
}
