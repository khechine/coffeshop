import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';
import { Cron, CronExpression } from '@nestjs/schedule';

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
      
      if (balance < 0) {
        await this.handleNegativeBalance(vendor);
      } else {
        await this.handlePositiveBalance(vendor);
      }
    }

    this.logger.log('✅ Vendor billing safeguard scan completed.');
  }

  private async handleNegativeBalance(vendor: any) {
    let gracePeriodEndsAt = vendor.gracePeriodEndsAt;

    // 1. Initialize grace period if not already set
    if (!gracePeriodEndsAt) {
      gracePeriodEndsAt = new Date();
      gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 10); // 10 days grace
      
      await (prisma as any).vendorProfile.update({
        where: { id: vendor.id },
        data: { gracePeriodEndsAt }
      });
      
      this.logger.warn(`⚠️ Vendor ${vendor.companyName} entered grace period until ${gracePeriodEndsAt.toISOString()}`);
      // Initial alert could be sent here (Whatsapp/Email)
    }

    // 2. Check for alert milestones (7, 5, 3 days left)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(gracePeriodEndsAt);
    endDate.setHours(0, 0, 0, 0);

    const timeLeftMs = endDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeLeftMs / (1000 * 60 * 60 * 24));

    if ([7, 5, 3].includes(daysLeft)) {
      this.logger.warn(`🔔 Alerting vendor ${vendor.companyName}: ${daysLeft} days left before marketplace hiding.`);
      
      // Update last alert timestamp
      await (prisma as any).vendorProfile.update({
        where: { id: vendor.id },
        data: { lastBillingAlertAt: new Date() }
      });

      // TODO: Integrate with WhatsappService or EmailService for real notifications
    }

    // 3. Suspend if grace period expired
    if (daysLeft <= 0 && vendor.status !== 'SUSPENDED') {
      this.logger.error(`🚨 Grace period expired for ${vendor.companyName}. Suspending marketplace presence.`);
      await (prisma as any).vendorProfile.update({
        where: { id: vendor.id },
        data: { status: 'SUSPENDED' }
      });
    }
  }

  private async handlePositiveBalance(vendor: any) {
    // Restore if balance was negative but now recovered
    if (vendor.gracePeriodEndsAt || vendor.status === 'SUSPENDED') {
      this.logger.log(`🎉 Vendor ${vendor.companyName} recovered positive balance. Restoring status.`);
      await (prisma as any).vendorProfile.update({
        where: { id: vendor.id },
        data: { 
          status: 'ACTIVE', 
          gracePeriodEndsAt: null,
          lastBillingAlertAt: null 
        }
      });
    }
  }

  /**
   * Manual trigger for testing or admin purposes.
   */
  async runSyncManually() {
    return this.manageGracePeriods();
  }
}
