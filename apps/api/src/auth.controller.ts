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
      include: { store: { select: { name: true } } }
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
        // activationCode: null // On pourrait l'invalider, mais gardons-le pour debug pour l'instant
      }
    });

    return { 
      storeId: terminal.storeId, 
      storeName: terminal.store?.name,
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
        store: { select: { name: true } }
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
        vendorId,
        vendorName
      }
    };
  }
}
