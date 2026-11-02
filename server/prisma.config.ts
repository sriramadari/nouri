// Prisma CLI config (migrations, generate). The running app does not read this file.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Migrations must use Neon's direct (unpooled) connection, not PgBouncer.
    url: process.env['DIRECT_URL'],
  },
});
