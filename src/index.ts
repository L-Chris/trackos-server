import { createApp } from './app';
import { startPaymentParseWorker } from './lib/payment-parse-worker';
import { prisma } from './lib/prisma';
import { PaymentNotificationRepository } from './repositories/payment-notification.repository';

async function bootstrap() {
  const { app, port } = createApp();

  await prisma.$connect();

  startPaymentParseWorker(new PaymentNotificationRepository());

  app.listen(port, () => {
    console.log(`TrackOS server listening on port ${port}`);
  });
}

bootstrap().catch(async (error) => {
  console.error('Failed to start TrackOS server', error);
  await prisma.$disconnect();
  process.exit(1);
});