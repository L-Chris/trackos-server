import { Body, Get, JsonController, Post, QueryParams } from 'routing-controllers';
import { Service } from 'typedi';
import {
  QueryMoveEventsDto,
  ReportMoveEventBatchDto,
} from '../dto/move-event.dto';
import { MoveEventService } from '../services/move-event.service';

@Service()
@JsonController('/move-events')
export class MoveEventController {
  constructor(private readonly moveEventService: MoveEventService) {}

  @Post('/report/batch')
  async reportBatch(@Body({ required: true }) body: ReportMoveEventBatchDto) {
    const result = await this.moveEventService.reportMoveEventBatch(body);

    return {
      success: true,
      data: result,
    };
  }

  @Get()
  async getMoveEvents(@QueryParams() query: QueryMoveEventsDto) {
    const result = await this.moveEventService.queryMoveEvents(query);

    return {
      success: true,
      data: result,
    };
  }
}
