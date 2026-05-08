import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { prisma } from '@coffeeshop/database';

@Injectable()
export class StoreStatusGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.currentUser; // Set by MarketplaceAuthGuard

    if (!user || !user.storeId) {
      return true; // If no store context, we can't check restriction here
    }

    const store = await prisma.store.findUnique({
      where: { id: user.storeId },
      select: { isRestricted: true },
    });

    if ((store as any)?.isRestricted) {
      throw new ForbiddenException(
        'ACCES_RESTREINT : Votre accès aux services est restreint en raison d\'un solde négatif. Veuillez alimenter votre wallet.',
      );
    }

    return true;
  }
}
