import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  (() => {
    if (globalForPrisma.prisma) {
      // In dev, sometimes the singleton survives schema pushes but misses new models.
      // We check if known new models exist on the singleton.
      const hasNewModels = 
        'storeVendorRelationship' in (globalForPrisma.prisma as any) &&
        'vendorInteraction' in (globalForPrisma.prisma as any);
      
      if (hasNewModels) return globalForPrisma.prisma;
    }
    
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  })();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
