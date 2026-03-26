import { Body, Get, JsonController, Post, QueryParams } from 'routing-controllers';
import { Service } from 'typedi';
import {
  QueryUsageEventsDto,
  ReportUsageEventBatchDto,
  ReportUsageEventDto,
} from '../dto/usage-event.dto';
import { UsageEventService } from '../services/usage-event.service';

@Service()
@JsonController('/usage-events')
export class UsageEventController {
  constructor(private readonly usageEventService: UsageEventService) {}

  @Post('/report')
  async report(@Body({ required: true }) body: ReportUsageEventDto) {
    const result = await this.usageEventService.reportUsageEvent(body);

    return {
      success: true,
      data: result,
    };
  }

  @Post('/report/batch')
  async reportBatch(@Body({ required: true }) body: ReportUsageEventBatchDto) {
    const result = await this.usageEventService.reportUsageEventBatch(body);

    return {
      success: true,
      data: result,
    };
  }

  @Get()
  async getUsageEvents(@QueryParams() query: QueryUsageEventsDto) {
    const result = await this.usageEventService.queryUsageEvents(query);

    return {
      success: true,
      data: result,
    };
  }
}