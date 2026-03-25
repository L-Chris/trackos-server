import { createApp } from './app';
import { prisma } from './lib/prisma';

async function bootstrap() {
  const { app, port } = createApp();

  await prisma.$connect();

  app.listen(port, () => {
    console.log(`TrackOS server listening on port ${port}`);
  });
}

bootstrap().catch(async (error) => {
  console.error('Failed to start TrackOS server', error);
  await prisma.$disconnect();
  process.exit(1);
});