import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReportAppUsageSummaryRecordDto {
  @IsString()
  @IsNotEmpty()
  recordKey!: string;

  @IsString()
  @IsNotEmpty()
  packageName!: string;

  @IsString()
  @IsNotEmpty()
  appName!: string;

  @Type(() => Date)
  @IsDate()
  windowStartAt!: Date;

  @Type(() => Date)
  @IsDate()
  windowEndAt!: Date;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  foregroundTimeMs!: number;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  lastUsedAt?: Date;
}

export class ReportAppUsageSummaryDto extends ReportAppUsageSummaryRecordDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;
}

export class ReportAppUsageSummaryBatchDto {
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
  @Type(() => ReportAppUsageSummaryRecordDto)
  records!: ReportAppUsageSummaryRecordDto[];
}

export class QueryAppUsageSummariesDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  packageName?: string;

  @Type(() => Date)
  @IsDate()
  startAt!: Date;

  @Type(() => Date)
  @IsDate()
  endAt!: Date;
}

export class QueryDailyAppUsageSummaryDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  packageName?: string;

  @Type(() => Date)
  @IsDate()
  startAt!: Date;

  @Type(() => Date)
  @IsDate()
  endAt!: Date;
}

export class QueryUsageRankingDto extends QueryAppUsageSummariesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class QueryUsageTrendDto extends QueryAppUsageSummariesDto {
  @IsOptional()
  @IsString()
  bucket?: string;
}