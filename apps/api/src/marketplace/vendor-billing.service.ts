import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';
import { Cron, CronExpression } from '@nestjs/schedule';
import { decideBillingAction } from '../domains';

@Injectable()
export class VendorBillingService {
  private readonly logger = new Logger(VendorBillingService.name);

  /**
   * Daily check of vendor balances and grace periods.
   * Runs every day at midnight.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async manageGracePeriods() {
    this.logger.log('🚀 Starting daily vendor billing safeguard scan...');

    const vendorsWithWallet = await (prisma as any).vendorProfile.findMany({
      include: { wallet: true, user: { select: { email: true, name: true } } }
    });

    for (const vendor of vendorsWithWallet) {
      const balance = Number(vendor.wallet?.balance || 0);
      const now = new Date();

      const decision = decideBillingAction({
        balance,
        gracePeriodEndsAt: vendor.gracePeriodEndsAt,
        status: vendor.status,
        now,
      });

      switch (decision.type) {
        case 'INIT_GRACE':
          await (prisma as any).vendorProfile.update({
            where: { id: vendor.id },
            data: { gracePeriodEndsAt: decision.gracePeriodEndsAt },
          });
          this.logger.warn(`⚠️ Vendor ${vendor.companyName} entered grace period until ${decision.gracePeriodEndsAt.toISOString()}`);
          break;

        case 'ALERT':
          this.logger.warn(`🔔 Alerting vendor ${vendor.companyName}: ${decision.daysLeft} days left before marketplace hiding.`);
          await (prisma as any).vendorProfile.update({
            where: { id: vendor.id },
            data: { lastBillingAlertAt: now }
          });
          break;

        case 'SUSPEND':
          this.logger.error(`🚨 Grace period expired for ${vendor.companyName}. Suspending marketplace presence.`);
          await (prisma as any).vendorProfile.update({
            where: { id: vendor.id },
            data: { status: 'SUSPENDED' }
          });
          break;

        case 'RESTORE':
          this.logger.log(`🎉 Vendor ${vendor.companyName} recovered positive balance. Restoring status.`);
          await (prisma as any).vendorProfile.update({
            where: { id: vendor.id },
            data: { status: 'ACTIVE', gracePeriodEndsAt: null, lastBillingAlertAt: null }
          });
          break;
      }
    }

    this.logger.log('✅ Vendor billing safeguard scan completed.');
  }

  /**
   * Manual trigger for testing or admin purposes.
   */
  async runSyncManually() {
    return this.manageGracePeriods();
  }
}
