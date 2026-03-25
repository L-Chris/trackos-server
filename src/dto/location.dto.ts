import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReportLocationRecordDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @Type(() => Date)
  @IsDate()
  recordedAt!: Date;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  speed?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  altitude?: number;
}

export class ReportLocationDto extends ReportLocationRecordDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  declare latitude: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  declare longitude: number;
}

export class ReportLocationBatchDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ReportLocationRecordDto)
  records!: ReportLocationRecordDto[];
}

export class QueryLocationsDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @Type(() => Date)
  @IsDate()
  startAt!: Date;

  @Type(() => Date)
  @IsDate()
  endAt!: Date;
}

export class QueryDailySummaryDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @Type(() => Date)
  @IsDate()
  startAt!: Date;

  @Type(() => Date)
  @IsDate()
  endAt!: Date;
}