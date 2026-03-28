import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export const moveTypes = [
  'STILL',
  'WALKING',
  'RUNNING',
  'IN_VEHICLE',
  'ON_BICYCLE',
  'UNKNOWN',
] as const;

export class ReportMoveEventRecordDto {
  @IsString()
  @IsNotEmpty()
  recordKey!: string;

  @IsString()
  @IsIn(moveTypes)
  moveType!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence?: number;

  @Type(() => Date)
  @IsDate()
  occurredAt!: Date;
}

export class ReportMoveEventBatchDto {
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
  @Type(() => ReportMoveEventRecordDto)
  records!: ReportMoveEventRecordDto[];
}

export class QueryMoveEventsDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  @IsIn(moveTypes)
  moveType?: string;

  @Type(() => Date)
  @IsDate()
  startAt!: Date;

  @Type(() => Date)
  @IsDate()
  endAt!: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
