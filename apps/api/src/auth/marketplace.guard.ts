import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { prisma } from '@coffeeshop/database';

/**
 * ✅ Anti-Leakage Guard — Phase 1
 * Protects marketplace endpoints from unauthenticated access.
 * Validates the temporary token format and resolves the userId.
 *
 * TODO (Phase 2): Replace with @nestjs/jwt RS256 signed tokens.
 */
@Injectable()
export class MarketplaceAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] as string | undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Token d\'authentification requis pour accéder à la marketplace.',
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // ── Temporary token format: "user-jwt-{userId}-{timestamp}" ──────────
    if (token.startsWith('user-jwt-')) {
      // CUIDs may contain hyphens, so we can't simply split by '-'
      // Instead, strip the prefix and extract userId and timestamp
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

      // Attach user context to the request for downstream use
      request.currentUser = user;
      return true;
    }

    throw new UnauthorizedException('Format de token invalide.');
  }
}
