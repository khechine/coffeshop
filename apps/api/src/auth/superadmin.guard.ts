import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@coffeeshop/database';

/**
 * SuperAdminGuard — Phase 4 Anti-Leakage
 *
 * Restricts monitoring endpoints (/admin/*) to SUPERADMIN users only.
 * Requires MarketplaceAuthGuard to have run first.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'] as string | undefined;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token requis.');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token.startsWith('user-jwt-')) {
      throw new UnauthorizedException('Format de token invalide.');
    }

    const parts = token.split('-');
    const userId = parts[2];
    if (!userId) throw new UnauthorizedException('Token malformé.');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) throw new UnauthorizedException('Utilisateur inconnu.');

    if (user.role !== 'SUPERADMIN') {
      throw new ForbiddenException(
        'Accès réservé aux Super Administrateurs de la plateforme.',
      );
    }

    request.currentUser = user;
    return true;
  }
}
