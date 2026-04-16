// data/repositories/common/base-repository.interface.ts
export interface BaseRepository<TCreate, TUpdate, TDto> {
  create(data: TCreate): Promise<TDto>;
  update(id: string, data: TUpdate): Promise<TDto | null>;
  findById(id: string): Promise<TDto | null>;
  findAll(): Promise<TDto[]>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}
