import { Body, JsonController, Post } from 'routing-controllers';
import { Service } from 'typedi';
import { ReportPaymentNotificationBatchDto } from '../dto/payment-notification.dto';
import { PaymentNotificationService } from '../services/payment-notification.service';

@Service()
@JsonController('/payment-notifications')
export class PaymentNotificationController {
  constructor(
    private readonly paymentNotificationService: PaymentNotificationService,
  ) {}

  @Post('/report/batch')
  async reportBatch(
    @Body({ required: true }) body: ReportPaymentNotificationBatchDto,
  ) {
    const result = await this.paymentNotificationService.reportBatch(body);

    return {
      success: true,
      data: result,
    };
  }
}
