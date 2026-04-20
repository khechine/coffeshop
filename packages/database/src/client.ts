import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  (() => {
    if (globalForPrisma.prisma) {
      // In dev, sometimes the singleton survives schema pushes but misses new models.
      // We check if a known new model exists on the singleton.
      const hasMktBundle = 'mktBundle' in (globalForPrisma.prisma as any);
      if (hasMktBundle) return globalForPrisma.prisma;
    }
    
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  })();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
