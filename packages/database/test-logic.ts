import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const vendor = await prisma.vendorProfile.findFirst({ include: { wallet: true } });
  if (!vendor) return console.log("No vendor");
  
  const order = await prisma.supplierOrder.create({
    data: {
      storeId: (await prisma.store.findFirst()).id,
      vendorId: vendor.id,
      total: 701,
      status: 'CONFIRMED'
    }
  });

  const commissionAmount = 7.01;
  const walletId = vendor.wallet ? vendor.wallet.id : (await prisma.vendorWallet.create({ data: { vendorId: vendor.id, balance: 0 } })).id;

  try {
    const settlement = await (prisma as any).marketplaceSettlement.create({
      data: {
        orderId: order.id,
        commissionAmount,
        isProcessed: true,
        processedAt: new Date()
      }
    });
    console.log("Settlement created:", settlement);

    await prisma.vendorWallet.update({
      where: { id: walletId },
      data: { balance: { decrement: commissionAmount } }
    });
    console.log("Wallet updated");

    const tx = await (prisma as any).walletTransaction.create({
      data: {
        walletId,
        amount: -commissionAmount,
        type: 'COMMISSION',
        description: `Test Commission`,
        settlementId: settlement.id
      }
    });
    console.log("Transaction created:", tx);
  } catch(e) {
    console.error("Error:", e);
  }
}
run().finally(() => prisma.$disconnect());
