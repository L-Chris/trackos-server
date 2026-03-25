import { Body, Get, JsonController, Post, QueryParams } from 'routing-controllers';
import { Service } from 'typedi';
import {
  QueryDailySummaryDto,
  QueryLocationsDto,
  ReportLocationBatchDto,
  ReportLocationDto,
} from '../dto/location.dto';
import { LocationService } from '../services/location.service';

@Service()
@JsonController('/locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('/report')
  async report(@Body({ required: true }) body: ReportLocationDto) {
    const result = await this.locationService.reportLocation(body);

    return {
      success: true,
      data: result,
    };
  }

  @Post('/report/batch')
  async reportBatch(@Body({ required: true }) body: ReportLocationBatchDto) {
    const result = await this.locationService.reportLocationBatch(body);

    return {
      success: true,
      data: result,
    };
  }

  @Get()
  async getLocations(@QueryParams() query: QueryLocationsDto) {
    const result = await this.locationService.queryLocations(query);

    return {
      success: true,
      data: result,
    };
  }

  @Get('/daily-summary')
  async getDailySummary(@QueryParams() query: QueryDailySummaryDto) {
    const result = await this.locationService.queryDailySummary(query);

    return {
      success: true,
      data: result,
    };
  }
}