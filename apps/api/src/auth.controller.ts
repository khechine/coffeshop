import { Controller, Get, Post, Body, Query, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';
import * as bcrypt from 'bcrypt';

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
        permissions: true,
      }
    });

    if (!user) {
      console.warn(`❌ PIN [${pin}] invalide pour boutique [${storeId}]`);
      throw new UnauthorizedException('Code PIN invalide pour cette boutique');
    }

    console.log(`✅ Bienvenue ${user.name} !`);
    return user;
  }

  @Get('activate-terminal')
  async activateTerminal(
    @Query('code') code: string,
    @Query('storeId') storeId: string
  ) {
    if (!code || code.length !== 6 || !storeId) {
      throw new UnauthorizedException('Code (6 chiffres) et ID Boutique requis');
    }

    const terminal = await prisma.posTerminal.findFirst({
      where: { 
        activationCode: code,
        storeId: storeId.trim()
      },
      include: { 
        store: { 
          include: { 
            subscription: { include: { plan: true } } 
          } 
        } 
      }
    });

    if (!terminal) {
      throw new UnauthorizedException('Code d\'activation invalide pour cette boutique');
    }

    // Activer le terminal et stocker un token si nécessaire
    await prisma.posTerminal.update({
      where: { id: terminal.id },
      data: { 
        status: 'ACTIVE',
        lastUsedAt: new Date(),
        activationCode: null // Code invalidé après usage pour empêcher la réutilisation
      }
    });

    return { 
      storeId: terminal.storeId, 
      storeName: terminal.store?.name,
      isFiscalEnabled: terminal.store?.isFiscalEnabled ?? false,
      planName: terminal.store?.subscription?.plan?.name || 'FREE',
      terminalId: terminal.id,
      terminalNickname: terminal.nickname
    };
  }

  @Post('login')
  async login(@Body() body: any) {
    const { email, password } = body;
    if (!email || !password) {
      throw new UnauthorizedException('Email et mot de passe requis');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { 
        store: { 
          include: { 
            subscription: { include: { plan: true } } 
          }
        }
      }
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Mot de passe incorrect');
    }

    let vendorId = null;
    let vendorName = null;

    if (user.role === 'VENDOR') {
      try {
        const profile = await (prisma as any).vendorProfile.findUnique({
          where: { userId: user.id }
        });
        if (profile) {
          vendorId = profile.id;
          vendorName = profile.companyName;
        }
      } catch (e) {
        console.error("❌ Erreur fetch vendorProfile:", e);
      }
    }

    // In a real app we'd use JwtService, but let's follow the established pattern or simple JWT
    return {
      token: `user-jwt-${user.id}-${Date.now()}`, // Temporary token format
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        storeId: user.storeId,
        storeName: user.store?.name,
        isFiscalEnabled: user.store?.isFiscalEnabled ?? false,
        planName: user.store?.subscription?.plan?.name || 'FREE',
        vendorId,
        vendorName
      }
    };
  }

  @Post('update-profile')
  async updateProfile(@Body() body: { id: string; name?: string; email?: string; pinCode?: string }) {
    console.log(`👤 Mise à jour profil pour [${body.id}]`);
    
    if (!body.id) throw new UnauthorizedException('ID Utilisateur requis');

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email.toLowerCase().trim();
    if (body.pinCode) updateData.pinCode = body.pinCode.trim();

    const user = await prisma.user.update({
      where: { id: body.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        pinCode: true,
      }
    });

    return user;
  }
}
