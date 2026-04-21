import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { prisma } from '@coffeeshop/database';

/**
 * SubscriptionGuard — Phase 3 Anti-Leakage
 *
 * Ensures the requesting store has an active subscription with marketplace access.
 * Acts as the platform's "paywall" — if the store churns or is suspended,
 * they lose access to the vendor catalog, forcing them to re-subscribe (not go direct).
 *
 * Usage: @UseGuards(SubscriptionGuard) on any marketplace route.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Requires MarketplaceAuthGuard to have run first (sets request.currentUser)
    const currentUser = request.currentUser;
    if (!currentUser?.storeId) {
      throw new ForbiddenException('Compte boutique requis pour accéder à la marketplace.');
    }

    const storeId = currentUser.storeId;

    // Check store status
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        status: true,
        forceMarketplaceAccess: true,
        subscription: {
          select: {
            status: true,
            expiresAt: true,
            plan: { select: { hasMarketplace: true, name: true } },
          },
        },
      },
    });

    if (!store) throw new ForbiddenException('Boutique introuvable.');

    // Store suspended → no access
    if (store.status === 'SUSPENDED') {
      throw new ForbiddenException('Votre boutique est suspendue. Contactez le support.');
    }

    // Force access override (for grace periods, manual admin unlock)
    if (store.forceMarketplaceAccess) return true;

    const sub = store.subscription;

    // No subscription
    if (!sub) {
      throw new ForbiddenException(
        'Aucun abonnement actif. Souscrivez à un plan pour accéder à la marketplace.',
      );
    }

    // Expired subscription
    if (sub.status !== 'ACTIVE' || new Date(sub.expiresAt) < new Date()) {
      throw new ForbiddenException(
        `Votre abonnement "${sub.plan.name}" a expiré. Renouvelez pour accéder au catalogue fournisseurs.`,
      );
    }

    // Plan doesn't include marketplace
    if (!sub.plan.hasMarketplace) {
      throw new ForbiddenException(
        `Votre plan "${sub.plan.name}" n'inclut pas l'accès marketplace. Passez à un plan supérieur.`,
      );
    }

    this.logger.debug(`[SubscriptionGuard] ✅ Store ${storeId} cleared for marketplace access.`);
    return true;
  }
}
