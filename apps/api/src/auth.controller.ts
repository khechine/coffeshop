import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';

@Controller('auth')
export class AuthController {
  
  @Get('health')
  health() { return { status: 'ok', time: new Date().toISOString() }; }

  @Get('verify-staff-pin')
  async verifyStaffPin(@Query('pin') pin: string, @Query('storeId') storeId: string) {
    console.log(`🔐 Verification PIN [${pin}] pour boutique [${storeId}]`);
    
    if (!pin || !storeId) {
      throw new UnauthorizedException('PIN et ID Boutique requis');
    }

    const user = await prisma.user.findFirst({
      where: {
        storeId: storeId.trim(),
        pinCode: pin.trim(),
      },
      select: {
        id: true,
        name: true,
        role: true,
      }
    });

    if (!user) {
      console.warn(`❌ PIN [${pin}] invalide pour boutique [${storeId}]`);
      throw new UnauthorizedException('Code PIN invalide pour cette boutique');
    }

    console.log(`✅ Bienvenue ${user.name} !`);
    return user;
  }
}

