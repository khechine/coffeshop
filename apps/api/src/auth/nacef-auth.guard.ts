import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@coffeeshop/database';

/**
 * NACEF Auth Guard — Enforces tenant isolation for fiscal operations.
 *
 * - Validates auth token (same format as MarketplaceAuthGuard)
 * - Ensures the storeId in the URL/body matches the authenticated user's storeId
 * - SUPERADMIN can access any store
 * - Prevents cross-tenant access to fiscal operations (sign, init, sync)
 */
@Injectable()
export class NacefAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] as string | undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Token d\'authentification requis pour les opérations fiscales.',
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // ── Temporary token format: "user-jwt-{userId}-{timestamp}" ──────────
    if (!token.startsWith('user-jwt-')) {
      throw new UnauthorizedException('Format de token invalide.');
    }

    const tokenBody = token.replace('user-jwt-', '');
    const lastDash = tokenBody.lastIndexOf('-');
    const userId = lastDash > 0 ? tokenBody.substring(0, lastDash) : tokenBody;

    if (!userId) {
      throw new UnauthorizedException('Token malformé.');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, storeId: true },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur inconnu.');
    }

    // SUPERADMIN can access any store
    if (user.role === 'SUPERADMIN') {
      request.currentUser = user;
      return true;
    }

    // Extract storeId from URL params or body
    const storeIdFromUrl = request.params?.storeId;
    const storeIdFromBody = request.body?.storeId;
    const saleId = request.params?.saleId;

    let targetStoreId = storeIdFromUrl || storeIdFromBody;

    // If the endpoint uses saleId, resolve the store from the sale
    if (saleId && !targetStoreId) {
      const sale = await prisma.sale.findUnique({
        where: { id: saleId },
        select: { storeId: true },
      });
      if (sale) {
        targetStoreId = sale.storeId;
      }
    }

    // If still no target store, reject
    if (!targetStoreId) {
      throw new ForbiddenException('Store ID manquant dans la requête.');
    }

    // Enforce tenant isolation: user can only access their own store
    if (user.storeId && user.storeId !== targetStoreId) {
      throw new ForbiddenException(
        `Accès refusé: vous n'êtes pas autorisé à effectuer des opérations fiscales sur ce magasin.`,
      );
    }

    // Attach user context to the request
    request.currentUser = user;
    return true;
  }
}
