import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryStayPointsDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @Type(() => Date)
  @IsDate()
  startAt!: Date;

  @Type(() => Date)
  @IsDate()
  endAt!: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(5000)
  eps1?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(60)
  @Max(86400)
  eps2?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(100)
  minPts?: number;
}
