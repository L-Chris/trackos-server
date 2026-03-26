import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export const usageEventTypes = [
  'ACTIVITY_RESUMED',
  'ACTIVITY_PAUSED',
  'MOVE_TO_FOREGROUND',
  'MOVE_TO_BACKGROUND',
  'SCREEN_INTERACTIVE',
  'SCREEN_NON_INTERACTIVE',
  'KEYGUARD_SHOWN',
  'KEYGUARD_HIDDEN',
] as const;

export class ReportUsageEventRecordDto {
  @IsString()
  @IsNotEmpty()
  recordKey!: string;

  @IsString()
  @IsIn(usageEventTypes)
  eventType!: string;

  @IsOptional()
  @IsString()
  packageName?: string;

  @IsOptional()
  @IsString()
  className?: string;

  @Type(() => Date)
  @IsDate()
  occurredAt!: Date;

  @IsString()
  @IsNotEmpty()
  source!: string;

  @IsOptional()
  @IsString()
  metadata?: string;
}

export class ReportUsageEventDto extends ReportUsageEventRecordDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;
}

export class ReportUsageEventBatchDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => ReportUsageEventRecordDto)
  records!: ReportUsageEventRecordDto[];
}

export class QueryUsageEventsDto {
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