import { Body, Get, JsonController, Post, QueryParams } from 'routing-controllers';
import { Service } from 'typedi';
import {
  QueryAppUsageSummariesDto,
  QueryDailyAppUsageSummaryDto,
  QueryUsageRankingDto,
  QueryUsageTrendDto,
  ReportAppUsageSummaryBatchDto,
  ReportAppUsageSummaryDto,
} from '../dto/app-usage-summary.dto';
import { AppUsageSummaryService } from '../services/app-usage-summary.service';

@Service()
@JsonController('/app-usage-summaries')
export class AppUsageSummaryController {
  constructor(private readonly appUsageSummaryService: AppUsageSummaryService) {}

  @Post('/report')
  async report(@Body({ required: true }) body: ReportAppUsageSummaryDto) {
    const result = await this.appUsageSummaryService.reportAppUsageSummary(body);

    return {
      success: true,
      data: result,
    };
  }

  @Post('/report/batch')
  async reportBatch(@Body({ required: true }) body: ReportAppUsageSummaryBatchDto) {
    const result = await this.appUsageSummaryService.reportAppUsageSummaryBatch(body);

    return {
      success: true,
      data: result,
    };
  }

  @Get()
  async getAppUsageSummaries(@QueryParams() query: QueryAppUsageSummariesDto) {
    const result = await this.appUsageSummaryService.queryAppUsageSummaries(query);

    return {
      success: true,
      data: result,
    };
  }

  @Get('/daily-summary')
  async getDailySummary(@QueryParams() query: QueryDailyAppUsageSummaryDto) {
    const result = await this.appUsageSummaryService.queryDailySummary(query);

    return {
      success: true,
      data: result,
    };
  }

  @Get('/ranking')
  async getRanking(@QueryParams() query: QueryUsageRankingDto) {
    const result = await this.appUsageSummaryService.queryUsageRanking(query);

    return {
      success: true,
      data: result,
    };
  }

  @Get('/trend')
  async getTrend(@QueryParams() query: QueryUsageTrendDto) {
    const result = await this.appUsageSummaryService.queryUsageTrend(query);

    return {
      success: true,
      data: result,
    };
  }
}