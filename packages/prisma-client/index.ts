import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';


const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
});

// Export the Prisma client instance
export const prisma = new PrismaClient({ adapter });

// Re-export all types from the generated Prisma client
export type {
  Asset,
  OrderType,
  OrderStatus,
} from './generated/prisma/enums';

// Re-export the PrismaClient type itself
// export { PrismaClient } from './generated/prisma';