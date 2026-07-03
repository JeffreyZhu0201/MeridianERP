import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateStoreSettingsDto {
  @IsOptional()
  @IsBoolean()
  storePublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isFlagship?: boolean;
}
