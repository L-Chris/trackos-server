import { Get, JsonController, QueryParams } from 'routing-controllers';
import { Service } from 'typedi';
import { QueryStayPointsDto } from '../dto/query-stay-points.dto';
import { StayPointService } from '../services/stay-point.service';

@Service()
@JsonController('/stay-points')
export class StayPointController {
  constructor(private readonly stayPointService: StayPointService) {}

  @Get()
  async getStayPoints(@QueryParams() query: QueryStayPointsDto) {
    const result = await this.stayPointService.queryStayPoints(query);
    return { success: true, data: result };
  }
}
