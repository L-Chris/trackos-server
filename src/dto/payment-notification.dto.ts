import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ReportPaymentNotificationRecordDto {
  @IsString()
  @IsNotEmpty()
  recordKey!: string;

  @IsString()
  @IsNotEmpty()
  packageName!: string;

  @IsString()
  @IsNotEmpty()
  notificationKey!: string;

  @Type(() => Date)
  @IsDate()
  postedAt!: Date;

  @Type(() => Date)
  @IsDate()
  receivedAt!: Date;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsOptional()
  @IsString()
  bigText?: string;

  @IsOptional()
  @IsString()
  tickerText?: string;

  @IsOptional()
  @IsString()
  sourceMetadata?: string;
}

export class ReportPaymentNotificationBatchDto {
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
  @Type(() => ReportPaymentNotificationRecordDto)
  records!: ReportPaymentNotificationRecordDto[];
}
