import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, BadRequestException, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as bcrypt from 'bcrypt';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { prisma, seedTunisianStarterPack } from '@coffeeshop/database';
import { MarketplaceAuthGuard } from './auth/marketplace.guard';
import { InteractionService } from './marketplace/interaction.service';

interface CreateMarketplaceProductDto {
// ...
  name: string;
  price: number;
  categoryId: string;
  subcategoryId?: string;
  vendorId: string;
  minOrderQty?: number;
  image?: string;
  unit?: string;
  isFeatured?: boolean;
  isFlashSale?: boolean;
  discountPrice?: number;
  flashStart?: string | Date;
  flashEnd?: string | Date;
}

import { StoreStatusGuard } from './auth/store-status.guard';

@Controller('management')
@UseGuards(MarketplaceAuthGuard, StoreStatusGuard)
export class ManagementController {
  constructor(private readonly interactionService: InteractionService) {}

  @Post('seed-tunisia/:storeId')
  async seedTunisia(@Param('storeId') storeId: string): Promise<any> {
    try {
      return await seedTunisianStarterPack(prisma as any, storeId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PRODUCTS CRUD
  // ═══════════════════════════════════════════════════════════

  @Get('products/:storeId')
  async getProducts(@Param('storeId') storeId: string): Promise<any> {
    return prisma.product.findMany({
      where: { storeId },
      include: { category: true, unit: true, recipe: { include: { stockItem: true } } },
      orderBy: { name: 'asc' },
    });
  }

  @Post('products')
  async createProduct(@Body() body: {
    name: string; price: number; categoryId: string; storeId: string; 
    unitId?: string; taxRate?: number; canBeTakeaway?: boolean;
    icon?: string; image?: string;
    recipeItems?: { stockItemId: string; quantity: number; isPackaging?: boolean; consumeType?: string }[];
  }): Promise<any> {
    if (!body.name || body.price === undefined || body.price === null) {
      throw new BadRequestException("Nom et Prix sont requis.");
    }
    const product = await prisma.product.create({
      data: {
        name: body.name,
        price: Number(body.price),
        category: { connect: { id: body.categoryId } },
        store: { connect: { id: body.storeId } },
        unit: body.unitId ? { connect: { id: body.unitId } } : undefined,
        taxRate: body.taxRate !== undefined ? body.taxRate : 0.19,
        canBeTakeaway: body.canBeTakeaway ?? true,
        icon: body.icon || null,
        image: body.image || null,
        active: true,
      },
      include: { category: true },
    });

    if (body.recipeItems && body.recipeItems.length > 0) {
      await prisma.recipeItem.createMany({
        data: body.recipeItems.map(ri => ({
          productId: product.id,
          stockItemId: ri.stockItemId,
          quantity: ri.quantity,
          isPackaging: ri.isPackaging || false,
          consumeType: ri.consumeType || 'BOTH'
        }))
      });
    }

    return product;
  }

  @Put('products/:id')
  async updateProduct(@Param('id') id: string, @Body() body: {
    name?: string; price?: number; categoryId?: string; unitId?: string; 
    active?: boolean; taxRate?: number; canBeTakeaway?: boolean;
    icon?: string; image?: string;
    recipeItems?: { stockItemId: string; quantity: number; isPackaging?: boolean; consumeType?: string }[];
  }): Promise<any> {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.price !== undefined && { price: Number(body.price) }),
        ...(body.categoryId && { category: { connect: { id: body.categoryId } } }),
        ...(body.unitId !== undefined && { 
          unit: body.unitId ? { connect: { id: body.unitId } } : { disconnect: true } 
        }),
        ...(body.active !== undefined && { active: body.active }),
        ...(body.taxRate !== undefined && { taxRate: body.taxRate }),
        ...(body.canBeTakeaway !== undefined && { canBeTakeaway: body.canBeTakeaway }),
        ...(body.icon !== undefined && { icon: body.icon || null }),
        ...(body.image !== undefined && { image: body.image || null }),
      },
      include: { category: true },
    });

    if (body.recipeItems) {
      await prisma.$transaction([
        prisma.recipeItem.deleteMany({ where: { productId: id } }),
        prisma.recipeItem.createMany({
          data: body.recipeItems.map(ri => ({
            productId: id,
            stockItemId: ri.stockItemId,
            quantity: ri.quantity,
            isPackaging: ri.isPackaging || false,
            consumeType: ri.consumeType || 'BOTH'
          }))
        })
      ]);
    }

    return product;
  }


  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string): Promise<any> {
    // Safety check for sales history
    const salesCount = await prisma.saleItem.count({ where: { productId: id } });
    if (salesCount > 0) {
      throw new BadRequestException(`Ce produit est lié à ${salesCount} ventes. Suppression impossible.`);
    }

    // Safety check for special orders (B2B)
    const specialOrdersCount = await prisma.specialOrder.count({ where: { productId: id } });
    if (specialOrdersCount > 0) {
      throw new BadRequestException(`Ce produit est lié à ${specialOrdersCount} commandes B2B. Suppression impossible.`);
    }

    // 1. Delete recipe
    await prisma.recipeItem.deleteMany({ where: { productId: id } });
    
    // 2. Delete product
    return prisma.product.delete({ where: { id } });
  }


  // Categories helper
  @Get('stores/:id')
  async getStore(@Param('id') id: string) {
    return prisma.store.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        lat: true,
        lng: true,
        preferredSearchRadius: true,
      }
    });
  }

  @Get('categories/:storeId')
  async getCategories(@Param('storeId') storeId: string): Promise<any> {
    return prisma.category.findMany({ 
      where: { OR: [{ storeId }, { storeId: null }] },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' } 
    });
  }

  @Post('categories')
  async createCategory(@Body() body: { name: string; icon?: string; storeId?: string; parentId?: string; active?: boolean }): Promise<any> {
    return prisma.category.create({ 
      data: { 
        name: body.name, 
        icon: body.icon,
        storeId: body.storeId,
        parentId: body.parentId || null,
        active: body.active ?? true
      } 
    });
  }

  @Put('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() body: { name?: string; icon?: string; parentId?: string; active?: boolean }): Promise<any> {
    return prisma.category.update({
      where: { id },
      data: { 
        name: body.name,
        icon: body.icon,
        parentId: body.parentId || undefined,
        active: body.active
      },
    });
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string): Promise<any> {
    return prisma.$transaction(async (tx) => {
      // 0. Check for child categories
      const childrenCount = await tx.category.count({ where: { parentId: id } });
      if (childrenCount > 0) {
        throw new BadRequestException(`Impossible de supprimer : cette catégorie contient ${childrenCount} sous-catégories.`);
      }

      // 1. Check if any product in this category has sales
      const products = await tx.product.findMany({ where: { categoryId: id } });
      const productIds = products.map(p => p.id);
      
      const salesCount = await tx.saleItem.count({
        where: { productId: { in: productIds } }
      });

      if (salesCount > 0) {
        throw new BadRequestException(`Impossible de supprimer : ${salesCount} ventes sont liées à des produits de cette catégorie.`);
      }

      // 2. Delete recipes for these products
      await tx.recipeItem.deleteMany({
        where: { productId: { in: productIds } }
      });

      // 3. Delete products
      await tx.product.deleteMany({
        where: { categoryId: id }
      });

      // 4. Delete the category
      return tx.category.delete({ where: { id } });
    });
  }
  
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        // More robust path detection: check if we are in apps/api or root
        let base = process.env.UPLOAD_DIR;
        if (!base) {
          const isAtRoot = existsSync(join(process.cwd(), 'apps', 'api'));
          base = isAtRoot 
            ? join(process.cwd(), 'apps', 'api', 'public', 'uploads')
            : join(process.cwd(), 'public', 'uploads');
        }

        if (!existsSync(base)) {
          mkdirSync(base, { recursive: true });
        }
        cb(null, base);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  uploadFile(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Aucun fichier reçu');
    return { 
      url: `/uploads/${file.filename}` 
    };
  }

  // ═══════════════════════════════════════════════════════════
  // TABLES CRUD
  // ═══════════════════════════════════════════════════════════

  @Get('tables/:storeId')
  async getTables(@Param('storeId') storeId: string): Promise<any> {
    return (prisma as any).storeTable.findMany({
      where: { storeId },
      include: { zone: true },
      orderBy: { label: 'asc' },
    });
  }

  @Get('zones/:storeId')
  async getZones(@Param('storeId') storeId: string): Promise<any> {
    return (prisma as any).storeZone.findMany({
      where: { storeId },
      include: { tables: true },
      orderBy: { name: 'asc' },
    });
  }



  // ═══════════════════════════════════════════════════════════
  // RECIPES management
  // ═══════════════════════════════════════════════════════════

  @Post('products/:id/recipe')
  async updateRecipe(@Param('id') productId: string, @Body() body: {
    items: { stockItemId: string; quantity: number; isPackaging?: boolean; consumeType?: string }[];
  }): Promise<any> {
    // Transaction to ensure atomicity
    return prisma.$transaction([
      // 1. Delete old recipe
      prisma.recipeItem.deleteMany({ where: { productId } }),
      // 2. Create new recipe items
      prisma.recipeItem.createMany({
        data: body.items.map(item => ({
          productId,
          stockItemId: item.stockItemId,
          quantity: item.quantity,
          isPackaging: item.isPackaging || false,
          consumeType: item.consumeType || 'BOTH',
        })),
      }),
    ]);
  }


  // ═══════════════════════════════════════════════════════════
  // STOCK ITEMS (Matieres Premieres) CRUD
  // ═══════════════════════════════════════════════════════════

  @Get('stock/:storeId')
  async getStock(@Param('storeId') storeId: string): Promise<any> {
    return prisma.stockItem.findMany({
      where: { storeId },
      include: {
        unit: true,
        preferredSupplier: { select: { id: true, name: true } },
        preferredVendor: { select: { id: true, companyName: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  @Post('stock')
  async createStockItem(@Body() body: {
    name: string; storeId: string; unitId?: string;
    quantity?: number; cost?: number; minThreshold?: number;
    preferredSupplierId?: string;
  }): Promise<any> {
    return prisma.stockItem.create({
      data: {
        name: body.name,
        storeId: body.storeId,
        unitId: body.unitId || null,
        quantity: body.quantity || 0,
        cost: body.cost || 0,
        minThreshold: body.minThreshold || 0,
        preferredSupplierId: body.preferredSupplierId || null,
      },
      include: { unit: true, preferredSupplier: true },
    });
  }

  @Put('stock/:id')
  async updateStockItem(@Param('id') id: string, @Body() body: {
    name?: string; quantity?: number; cost?: number;
    minThreshold?: number; unitId?: string; preferredSupplierId?: string;
  }): Promise<any> {
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.quantity !== undefined) data.quantity = body.quantity;
    if (body.cost !== undefined) data.cost = body.cost;
    if (body.minThreshold !== undefined) data.minThreshold = body.minThreshold;
    if (body.unitId !== undefined) data.unitId = body.unitId || null;
    if (body.preferredSupplierId !== undefined) data.preferredSupplierId = body.preferredSupplierId || null;

    return prisma.stockItem.update({
      where: { id },
      data,
      include: { unit: true, preferredSupplier: true },
    });
  }

  @Delete('stock/:id')
  async deleteStockItem(@Param('id') id: string): Promise<any> {
    // Delete recipe items first
    await prisma.recipeItem.deleteMany({ where: { stockItemId: id } });
    return prisma.stockItem.delete({ where: { id } });
  }

  // Units helper
  @Get('units')
  async getUnits(): Promise<any> {
    return prisma.globalUnit.findMany({ orderBy: { name: 'asc' } });
  }

  // ═══════════════════════════════════════════════════════════
  // SUPPLIERS CRUD
  // ═══════════════════════════════════════════════════════════

  @Get('suppliers/:storeId')
  async getSuppliers(@Param('storeId') storeId: string): Promise<any> {
    return (prisma as any).supplier.findMany({
      where: { storeId },
      include: {
        _count: { select: { stockItems: true, orders: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  @Post('suppliers')
  async createSupplier(@Body() body: {
    name: string; contact?: string; phone?: string; storeId: string;
  }): Promise<any> {
    return (prisma as any).supplier.create({
      data: {
        name: body.name,
        contact: body.contact || null,
        phone: body.phone || null,
        store: { connect: { id: body.storeId } },
      },
    });
  }

  @Put('suppliers/:id')
  async updateSupplier(@Param('id') id: string, @Body() body: {
    name?: string; contact?: string; phone?: string;
  }): Promise<any> {
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.contact !== undefined) data.contact = body.contact;
    if (body.phone !== undefined) data.phone = body.phone;

    return prisma.supplier.update({ where: { id }, data });
  }

  @Delete('suppliers/:id')
  async deleteSupplier(@Param('id') id: string): Promise<any> {
    return prisma.supplier.delete({ where: { id } });
  }

  // ═══════════════════════════════════════════════════════════
  // ORDERS (SupplierOrder) CRUD
  // ═══════════════════════════════════════════════════════════

  @Get('orders/:storeId')
  async getOrders(@Param('storeId') storeId: string): Promise<any> {
    return prisma.supplierOrder.findMany({
      where: { storeId },
      include: {
        supplier: { select: { name: true } },
        vendor: { select: { companyName: true } },
        items: { include: { stockItem: { select: { name: true } } } },
        settlement: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('orders')
  async createOrder(@Body() body: {
    storeId: string; supplierId?: string; vendorId?: string;
    total: number; needsDelivery?: boolean;
    items: { stockItemId?: string; name?: string; quantity: number; price: number }[];
  }): Promise<any> {
    const order = await prisma.supplierOrder.create({
      data: {
        storeId: body.storeId,
        supplierId: body.supplierId || null,
        vendorId: body.vendorId || null,
        total: body.total,
        needsDelivery: body.needsDelivery || false,
        items: {
          create: body.items.map(item => ({
            stockItemId: item.stockItemId || null,
            name: item.name || null,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true, supplier: true },
    });

    // ✅ Anti-leakage: log marketplace order interaction for BehaviorScoring
    if (body.vendorId) {
      this.interactionService.logOrder(body.storeId, body.vendorId, body.total).catch(() => {});

    }

    return order;
  }

  @Put('orders/:id/status')
  async updateOrderStatus(@Param('id') id: string, @Body() body: {
    status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  }): Promise<any> {
    const order = await prisma.supplierOrder.update({
      where: { id },
      data: { status: body.status },
      include: { items: { include: { stockItem: true } } },
    });
    return order;
  }

  @Post('orders/:id/receive')
  async receiveOrder(@Param('id') id: string): Promise<any> {
    const order = await prisma.supplierOrder.update({
      where: { id },
      data: { status: 'STOCKED' as any },
      include: { items: { include: { stockItem: true } } },
    });

    for (const item of order.items) {
      if (item.stockItemId && item.stockItem) {
        await prisma.stockItem.update({
          where: { id: item.stockItemId },
          data: { quantity: { increment: Number(item.quantity) } },
        });
      }
    }

    return order;
  }

  @Delete('orders/:id')
  async deleteOrder(@Param('id') id: string): Promise<any> {
    await prisma.supplierOrderItem.deleteMany({ where: { orderId: id } });
    return prisma.supplierOrder.delete({ where: { id } });
  }

  // ═══════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════

  @Get('notifications/:storeId')
  async getNotifications(@Param('storeId') storeId: string): Promise<any> {
    const notifications: any[] = [];

    // Fetch all stock and filter in memory
    const allStock = await prisma.stockItem.findMany({
      where: { storeId },
      include: { unit: true },
    });

    for (const item of allStock) {
      if (Number(item.quantity) <= Number(item.minThreshold)) {
        notifications.push({
          id: `low-stock-${item.id}`,
          type: 'LOW_STOCK',
          title: `Stock bas: ${item.name}`,
          message: `Reste ${Number(item.quantity).toFixed(2)} ${item.unit?.name || ''} (seuil: ${Number(item.minThreshold)})`,
          severity: Number(item.quantity) <= 0 ? 'critical' : 'warning',
          createdAt: new Date().toISOString(),
          data: { stockItemId: item.id },
        });
      }
    }

    // Pending orders
    const pendingOrders = await prisma.supplierOrder.findMany({
      where: { storeId, status: 'PENDING' },
      include: { supplier: { select: { name: true } } },
    });

    for (const order of pendingOrders) {
      notifications.push({
        id: `pending-order-${order.id}`,
        type: 'PENDING_ORDER',
        title: `Commande en attente`,
        message: `Commande #${order.id.substring(0, 8)} - ${order.supplier?.name || 'Fournisseur'} - ${Number(order.total).toFixed(3)} DT`,
        severity: 'info',
        createdAt: order.createdAt.toISOString(),
        data: { orderId: order.id },
      });
    }

    // Sort by severity then date
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    notifications.sort((a, b) => (severityOrder[a.severity as keyof typeof severityOrder] || 2) - (severityOrder[b.severity as keyof typeof severityOrder] || 2));

    return notifications;
  }
  // ═══════════════════════════════════════════════════════════
  // MARKETPLACE / VENDOR SPECIFIC  🔒 Protected by MarketplaceAuthGuard
  // ═══════════════════════════════════════════════════════════

  @Get('xyz-categories-test')
  async getXyzCategories(): Promise<any> {
    return prisma.mktCategory.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
  }

  @Get('marketplace/categories')
  async getMarketplaceCategories(@Query('vendorId') vendorId?: string): Promise<any> {
    if (vendorId) {
      const vendor = await prisma.vendorProfile.findUnique({
        where: { id: vendorId },
        include: { mktSectors: { include: { subcategories: true } } }
      });
      if (vendor && vendor.mktSectors.length > 0) {
        return vendor.mktSectors;
      }
    }

    return (prisma as any).marketplaceCategory.findMany({
      where: { parentId: null },
      include: { children: { include: { children: true } } },
      orderBy: { name: 'asc' },
    });
  }

  @Get('marketplace/messages')
  async getMarketplaceMessages(@Query('storeId') storeId: string): Promise<any> {
    if (!storeId) return [];
    return (prisma as any).tradeMessage.findMany({
      where: {
        OR: [
          { senderId: storeId },
          { receiverId: storeId }
        ]
      },
      include: {
        vendor: { select: { companyName: true, id: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Get('marketplace/products')
  async getMarketplaceProducts(
    @Query('vendorId') vendorId?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('eco') eco?: string,
    @Query('tunisia') tunisia?: string,
  ): Promise<any> {
    const skipNum = skip ? Number(skip) : 0;
    const takeNum = take ? Number(take) : 50;
    const isEco = eco === 'true';
    const isTunisia = tunisia === 'true';

    // Helper: Haversine distance in km
    const haversine = (lat1: number, lng1: number, lat2: number | null, lng2: number | null): number => {
      if (lat2 == null || lng2 == null) return 9999;
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Fetch all eligible products with Prisma
    const allProducts = await prisma.vendorProduct.findMany({
      where: {
        ...(vendorId ? { vendorId } : {}),
        ...(isEco ? { tags: { has: 'BIO' } } : {}),
        ...(isTunisia ? { tags: { has: 'Tunisie' } } : {}),
        vendor: {
          status: { not: 'SUSPENDED' },
          // Note: Full billing check is done in memory below to handle gracePeriod and order counts accurately
        }
      },
      include: {
        vendor: {
          include: { wallet: true }
        },
        productStandard: true
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const vendorOrderCounts = new Map<string, number>();

    // 1. Pre-calculate order counts for vendors who might be in grace period
    const potentialGraceVendors = [...new Set(allProducts.map(p => p.vendorId))];
    if (potentialGraceVendors.length > 0) {
      const recentOrders = await prisma.supplierOrder.groupBy({
        by: ['vendorId'],
        where: {
          vendorId: { in: potentialGraceVendors },
          status: { not: 'CANCELLED' }
        },
        _count: { id: true }
      });
      recentOrders.forEach(o => vendorOrderCounts.set(o.vendorId, o._count.id));
    }

    // 2. Filter products based on vendor billing status
    const eligibleProducts = allProducts.filter(p => {
      const v = p.vendor as any;
      const balance = Number(v.wallet?.balance || 0);
      const isNegative = balance < 0;
      const hasWallet = !!v.wallet;
      
      // If balance is healthy, they are visible
      if (balance >= 0) return true;
      
      // If negative, check grace period and order limits
      const graceExpired = v.gracePeriodEndsAt ? new Date(v.gracePeriodEndsAt) < now : true;
      const orderCount = vendorOrderCounts.get(v.id) || 0;
      
      // Hidden if negative AND (grace expired OR limit reached)
      if (isNegative && (graceExpired || orderCount >= 2)) {
        return false;
      }
      
      return true;
    });

    // For products with proximity, sort and filter by distance
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusKm = radius ? parseFloat(radius) : 50;

      const withDistance = eligibleProducts
        .map(p => ({
          ...p,
          distance: haversine(latitude, longitude, (p.vendor as any).lat, (p.vendor as any).lng)
        }))
        .filter(p => p.distance <= radiusKm || (p.vendor as any).lat == null) // Include those without coordinates
        .sort((a, b) => a.distance - b.distance)
        .slice(skipNum, skipNum + takeNum);

      return withDistance;
    }

    return eligibleProducts.slice(skipNum, skipNum + takeNum);
  }

  @UseGuards(MarketplaceAuthGuard)
  @Post('marketplace/products')
  async createMarketplaceProduct(@Body() body: CreateMarketplaceProductDto): Promise<any> {
    return prisma.vendorProduct.create({
      data: {
        name: body.name,
        price: body.price,
        categoryId: body.categoryId || null,
        subcategoryId: body.subcategoryId || null,
        vendorId: body.vendorId,
        minOrderQty: body.minOrderQty || 1,
        unit: body.unit || 'pièce',
        image: body.image || null,
        images: (body as any).images || [],
        isFeatured: body.isFeatured || false,
        isFlashSale: body.isFlashSale || false,
        discountPrice: body.discountPrice || null,
        flashStart: body.flashStart ? new Date(body.flashStart) : null,
        flashEnd: body.flashEnd ? new Date(body.flashEnd) : null,
      } as any,
    });
  }

  @Put('marketplace/products/:id')
  async updateMarketplaceProduct(@Param('id') id: string, @Body() body: {
    name?: string; price?: number; categoryId?: string; subcategoryId?: string; 
    minOrderQty?: number; image?: string; active?: boolean; unit?: string;
    isFeatured?: boolean; isFlashSale?: boolean; discountPrice?: number;
    flashStart?: string | Date; flashEnd?: string | Date;
  }): Promise<any> {
    return prisma.vendorProduct.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.subcategoryId !== undefined && { subcategoryId: body.subcategoryId || null }),
        ...(body.minOrderQty !== undefined && { minOrderQty: body.minOrderQty }),
        ...(body.image !== undefined && { image: body.image }),
        ...((body as any).images !== undefined && { images: (body as any).images }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.isFlashSale !== undefined && { isFlashSale: body.isFlashSale }),
        ...(body.discountPrice !== undefined && { discountPrice: body.discountPrice }),
        ...(body.flashStart !== undefined && { flashStart: body.flashStart ? new Date(body.flashStart) : null }),
        ...(body.flashEnd !== undefined && { flashEnd: body.flashEnd ? new Date(body.flashEnd) : null }),
      },
    });
  }

  @Delete('marketplace/products/:id')
  async deleteMarketplaceProduct(@Param('id') id: string): Promise<any> {
    return prisma.vendorProduct.delete({
      where: { id }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // UPSELLS (VendorProductUpsell)
  // ═══════════════════════════════════════════════════════════

  @Get('marketplace/products/:productId/upsells')
  async getProductUpsells(@Param('productId') productId: string): Promise<any> {
    return prisma.vendorProductUpsell.findMany({
      where: { sourceProductId: productId },
      include: {
        targetProduct: {
          select: { id: true, name: true, price: true, image: true, unit: true }
        }
      }
    } as any);
  }

  @UseGuards(MarketplaceAuthGuard)
  @Post('vendor/upsells')
  async configureUpsell(@Req() req: any, @Body() body: {
    sourceProductId: string;
    targetProductId: string;
    quantity?: number;
    discountPercent?: number;
    text?: string;
    isActive?: boolean;
  }): Promise<any> {
    const user = req.currentUser;
    // Verify the vendor owns the source product
    const product = await prisma.vendorProduct.findUnique({ where: { id: body.sourceProductId } });
    if (!product) throw new BadRequestException('Produit source introuvable.');
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
    if (!vendor || product.vendorId !== vendor.id) {
      throw new BadRequestException('Vous ne pouvez pas configurer d\'upsell sur ce produit.');
    }
    const upsell = await prisma.vendorProductUpsell.upsert({
      where: {
        sourceProductId_targetProductId: {
          sourceProductId: body.sourceProductId,
          targetProductId: body.targetProductId,
        }
      },
      update: {
        quantity: body.quantity,
        discountPercent: body.discountPercent,
        text: body.text,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
      create: {
        sourceProductId: body.sourceProductId,
        targetProductId: body.targetProductId,
        quantity: body.quantity,
        discountPercent: body.discountPercent,
        text: body.text,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    } as any);
    return { success: true, upsell };
  }

  @UseGuards(MarketplaceAuthGuard)
  @Delete('vendor/upsells/:id')
  async deleteUpsell(@Req() req: any, @Param('id') id: string): Promise<any> {
    const user = req.currentUser;
    const upsell = await (prisma as any).vendorProductUpsell.findUnique({
      where: { id },
      include: { sourceProduct: { select: { vendorId: true } } }
    });
    if (!upsell) throw new BadRequestException('Upsell introuvable.');
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: user.id } });
    if (!vendor || upsell.sourceProduct.vendorId !== vendor.id) {
      throw new BadRequestException('Accès refusé.');
    }
    await prisma.vendorProductUpsell.delete({ where: { id } } as any);
    return { success: true };
  }

  @UseGuards(MarketplaceAuthGuard)
  @Get('vendor/summary/:vendorId')
  async getVendorSummary(@Param('vendorId') vendorId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [orders, products, wallet] = await Promise.all([
      prisma.supplierOrder.findMany({
        where: { vendorId },
        select: { total: true, status: true, store: { select: { name: true } }, createdAt: true },
      }),
      prisma.vendorProduct.count({ where: { vendorId } }),
      (prisma as any).vendorWallet.findUnique({ where: { vendorId } }),
    ]);

    const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    const pendingOrders = orders.filter((o: any) => o.status === 'PENDING').length;
    
    // Visibility Logic
    const isNegative = Number(wallet?.balance || 0) < 0;
    const graceExpired = wallet?.vendor?.gracePeriodEndsAt ? new Date(wallet.vendor.gracePeriodEndsAt) < new Date() : false;
    
    // Count orders since last alert or negative balance (Simplified: count total for now or we need a date)
    // The user said "limit to 2 orders in grace period". 
    // We'll assume grace orders are those since lastBillingAlertAt or just count all if negative.
    const graceOrdersCount = isNegative ? orders.filter(o => o.status !== 'CANCELLED').length : 0; 
    const isHidden = isNegative && (graceExpired || graceOrdersCount >= 2);

    // Group by store for top clients
    const clientMap: Record<string, number> = {};
    orders.forEach((o: any) => {
      const name = o.status === 'PENDING' ? 'Client Masqué' : (o.store?.name || 'Inconnu');
      clientMap[name] = (clientMap[name] || 0) + Number(o.total || 0);
    });

    const topClients = Object.entries(clientMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totalRevenue,
      pendingOrders,
      activeProducts: products,
      walletBalance: Number(wallet?.balance || 0),
      orderCount: orders.length,
      topClients,
      isHidden,
      suspensionReason: isHidden ? (graceExpired ? "Période de grâce expirée" : "Limite de commandes atteinte (Solde négatif)") : null
    };
  }

  @UseGuards(MarketplaceAuthGuard)
  @Get('vendor/notifications/:vendorId')
  async getVendorNotifications(@Param('vendorId') vendorId: string): Promise<any> {
    const notifications = [];

    // 1. PENDING Orders
    const pendingOrders = await prisma.supplierOrder.findMany({
      where: { vendorId, status: 'PENDING' },
      include: { store: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    for (const po of pendingOrders) {
      notifications.push({
        id: `order-pending-${po.id}`,
        type: 'ORDER',
        title: `Nouvelle Commande PENDING`,
        message: `Commande de Client Masqué pour ${po.total} DT`,
        date: po.createdAt,
      });
    }

    // 2. DELIVERED Orders (last 72h)
    const threeDaysAgo = new Date();
    threeDaysAgo.setHours(threeDaysAgo.getHours() - 72);
    const deliveredOrders = await prisma.supplierOrder.findMany({
      where: { vendorId, status: 'DELIVERED', updatedAt: { gte: threeDaysAgo } },
      include: { store: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' }
    });
    for (const do_ of deliveredOrders) {
      notifications.push({
        id: `order-delivered-${do_.id}`,
        type: 'SUCCESS',
        title: `Commande Réceptionnée`,
        message: `La commande pour ${do_.store?.name || 'Magasin Inconnu'} a bien été réceptionnée.`,
        date: do_.updatedAt,
      });
    }

    // 3. LOW STOCK & OUT OF STOCK
    const lowStockProducts = await prisma.vendorProduct.findMany({
      where: { vendorId, stockStatus: { in: ['LOW_STOCK', 'OUT_OF_STOCK'] } },
      include: { productStandard: { select: { name: true } } }
    });
    for (const prod of lowStockProducts) {
      const name = prod.productStandard?.name || prod.name || 'Produit inconnu';
      notifications.push({
        id: `stock-${prod.stockStatus}-${prod.id}`,
        type: 'STOCK',
        title: prod.stockStatus === 'OUT_OF_STOCK' ? `⚠️ Rupture de Stock` : `Stock Faible`,
        message: `Le produit "${name}" nécessite votre attention.`,
        date: prod.updatedAt || new Date(),
      });
    }

    notifications.sort((a, b) => b.date.getTime() - a.date.getTime());

    return notifications;
  }

  @UseGuards(MarketplaceAuthGuard)
  @Get('vendor/wallet/:vendorId')
  async getVendorWallet(@Param('vendorId') vendorId: string): Promise<any> {
    const wallet = await (prisma as any).vendorWallet.findUnique({
      where: { vendorId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });
    return wallet;
  }

  @UseGuards(MarketplaceAuthGuard)
  @Get('vendor/profile/:vendorId')
  async getVendorProfile(@Param('vendorId') vendorId: string): Promise<any> {
    const profile = await (prisma as any).vendorProfile.findUnique({
      where: { id: vendorId },
      include: {
        mktSectors: true,
        user: { select: { email: true, name: true } }
      }
    });
    return profile;
  }

  @UseGuards(MarketplaceAuthGuard)
  @Put('vendor/profile/:vendorId')
  async updateVendorProfile(@Param('vendorId') vendorId: string, @Body() data: any): Promise<any> {
    const { mktSectors, ...rest } = data;
    const updateData: any = { ...rest };
    
    if (mktSectors) {
      updateData.mktSectors = {
         set: mktSectors.map((id: string) => ({ id }))
      };
    }

    return (prisma as any).vendorProfile.update({
      where: { id: vendorId },
      data: updateData
    });
  }

  @Get('marketplace/sectors')
  async getMarketplaceSectors(): Promise<any> {
    return (prisma as any).mktCategory.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' }
    });
  }

  @Get('marketplace/categories-legacy')
  async getAllMarketplaceCategories(): Promise<any> {
    return (prisma as any).mktCategory.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sortOrder: 'asc' }
    });
  }

  @Get('marketplace/bundles')
  async getAllMarketplaceBundles(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
  ): Promise<any> {
    const bundles = await (prisma as any).$queryRawUnsafe(`
      SELECT b.*
      FROM "MktBundle" b
      JOIN "VendorProfile" v ON b."vendorId" = v.id
      LEFT JOIN "VendorWallet" vw ON vw."vendorId" = v.id
      WHERE 
        b."isActive" = true
        AND v.status != 'SUSPENDED'
        AND (
          vw.balance >= 0 
          OR (
            v."gracePeriodEndsAt" > NOW()
            AND (
              SELECT COUNT(*) FROM "SupplierOrder" so 
              WHERE so."vendorId" = v.id 
              AND so.status != 'CANCELLED'
              AND so."createdAt" > COALESCE(v."lastBillingAlertAt", v."createdAt")
            ) < 2
          )
        )
      ORDER BY b."createdAt" DESC
    `);

    // Fetch details with Prisma for better structure
    const bundleIds = (bundles as any[]).map(b => b.id);
    const bundleResults = await (prisma as any).mktBundle.findMany({
      where: { id: { in: bundleIds } },
      include: { 
        items: { include: { vendorProduct: { include: { productStandard: true } } } },
        vendor: { select: { id: true, companyName: true, city: true, lat: true, lng: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusKm = radius ? parseFloat(radius) : 50;
      
      const haversine = (lat1: number, lng1: number, lat2: number | null, lng2: number | null): number => {
        if (lat2 == null || lng2 == null) return 9999;
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      return bundleResults.filter(b => {
        const dist = haversine(latitude, longitude, (b.vendor as any)?.lat, (b.vendor as any)?.lng);
        return dist <= radiusKm || (b.vendor as any)?.lat == null;
      });
    }

    return bundleResults;
  }

  @Get('marketplace/vendors')
  async getAllMarketplaceVendors(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
  ): Promise<any> {
    const allVendors = await prisma.vendorProfile.findMany({
      where: {
        status: { not: 'SUSPENDED' },
      },
      include: { 
        wallet: true,
        mktSectors: true,
        _count: { select: { vendorProducts: true } }
      },
      orderBy: { companyName: 'asc' }
    });

    const now = new Date();
    const vendorOrderCounts = new Map<string, number>();

    const potentialGraceVendors = allVendors.map(v => v.id);

    if (potentialGraceVendors.length > 0) {
      const recentOrders = await prisma.supplierOrder.groupBy({
        by: ['vendorId'],
        where: {
          vendorId: { in: potentialGraceVendors },
          status: { not: 'CANCELLED' }
        },
        _count: { id: true }
      });
      recentOrders.forEach(ro => vendorOrderCounts.set(ro.vendorId, ro._count.id));
    }

    const eligibleVendors = allVendors.filter(v => {
      const balance = Number(v.wallet?.balance || 0);
      const isNegative = balance < 0;
      
      // If balance is healthy, they are visible
      if (balance >= 0) return true;
      
      // If negative, check grace period and order limits
      const graceExpired = v.gracePeriodEndsAt ? new Date(v.gracePeriodEndsAt) < now : true;
      const orderCount = vendorOrderCounts.get(v.id) || 0;
      
      // Hidden if negative AND (grace expired OR limit reached)
      if (isNegative && (graceExpired || orderCount >= 2)) {
        return false;
      }
      
      return true;
    });

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusKm = radius ? parseFloat(radius) : 50;

      const haversine = (lat1: number, lng1: number, lat2: number | null, lng2: number | null): number => {
        if (lat2 == null || lng2 == null) return 9999;
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      return eligibleVendors.filter(v => {
        const dist = haversine(latitude, longitude, v.lat, v.lng);
        return dist <= radiusKm || v.lat == null;
      });
    }

    return eligibleVendors;
  }

  @UseGuards(MarketplaceAuthGuard)
  @Get('vendor/bundles/:vendorId')
  async getVendorBundles(@Param('vendorId') vendorId: string): Promise<any> {
    return (prisma as any).mktBundle.findMany({
      where: { vendorId },
      include: { items: { include: { vendorProduct: true } } }
    });
  }

  @UseGuards(MarketplaceAuthGuard)
  @Post('vendor/bundles/:vendorId')
  async createVendorBundle(@Param('vendorId') vendorId: string, @Body() data: any): Promise<any> {
    const { items, ...rest } = data;
    return (prisma as any).mktBundle.create({
      data: {
        ...rest,
        vendorId,
        items: items ? {
          create: items.map((item: any) => ({
            vendorProductId: item.vendorProductId,
            quantity: item.quantity || 1
          }))
        } : undefined
      }
    });
  }

  @UseGuards(MarketplaceAuthGuard)
  @Put('vendor/bundles/:bundleId')
  async updateVendorBundle(@Param('bundleId') bundleId: string, @Body() data: any): Promise<any> {
    const { items, ...rest } = data;
    
    // Simple update for items: delete old ones and create new ones
    if (items) {
      await (prisma as any).mktBundleItem.deleteMany({
        where: { bundleId }
      });
      rest.items = {
        create: items.map((item: any) => ({
          vendorProductId: item.vendorProductId,
          quantity: item.quantity || 1
        }))
      };
    }

    return (prisma as any).mktBundle.update({
      where: { id: bundleId },
      data: rest
    });
  }

  @UseGuards(MarketplaceAuthGuard)
  @Delete('vendor/bundles/:bundleId')
  async deleteVendorBundle(@Param('bundleId') bundleId: string): Promise<any> {
    return (prisma as any).mktBundle.delete({
      where: { id: bundleId }
    });
  }

  @UseGuards(MarketplaceAuthGuard)
  @Get('vendor/orders/:vendorId')
  async getVendorOrders(@Param('vendorId') vendorId: string): Promise<any> {
    const orders = await prisma.supplierOrder.findMany({
      where: { vendorId },
      include: {
        store: { select: { id: true, name: true, city: true } },
        items: { include: { stockItem: true } },
        settlement: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(order => {
      if (order.status === 'PENDING') {
        return {
          ...order,
          store: {
             id: order.store?.id,
             name: 'Client Masqué (Acceptez pour voir)',
             city: '*****',
          }
        };
      }
      return order;
    });
  }

  // ═══════════════════════════════════════════════════════════
  // COMMISSION RULES (SUPERADMIN)
  // ═══════════════════════════════════════════════════════════

  @UseGuards(MarketplaceAuthGuard)
  @Get('admin/commission-rules')
  async getCommissionRules(): Promise<any[]> {
    return (prisma as any).commissionRule.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  @UseGuards(MarketplaceAuthGuard)
  @Post('admin/commission-rules')
  async createCommissionRule(@Body() data: any): Promise<any> {
    if (data.isDefault) {
      await (prisma as any).commissionRule.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }
    return (prisma as any).commissionRule.create({
      data
    });
  }

  @UseGuards(MarketplaceAuthGuard)
  @Put('admin/commission-rules/:id')
  async updateCommissionRule(@Param('id') id: string, @Body() data: any): Promise<any> {
    if (data.isDefault) {
      await (prisma as any).commissionRule.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }
    return (prisma as any).commissionRule.update({
      where: { id },
      data
    });
  }

  @UseGuards(MarketplaceAuthGuard)
  @Delete('admin/commission-rules/:id')
  async deleteCommissionRule(@Param('id') id: string): Promise<any> {
    return (prisma as any).commissionRule.delete({
      where: { id }
    });
  }

  @UseGuards(MarketplaceAuthGuard)
  @Post('admin/vendors/:vendorId/assign-rule')
  async assignCommissionRule(@Param('vendorId') vendorId: string, @Body() body: { ruleId: string | null }): Promise<any> {
    return (prisma as any).vendorProfile.update({
      where: { id: vendorId },
      data: {
        commissionRuleId: body.ruleId
      }
    });
  }


  @UseGuards(MarketplaceAuthGuard)
  @Put('vendor/orders/:id/status')
  async updateVendorOrderStatus(@Param('id') id: string, @Body() body: {
    status: string;
  }): Promise<any> {
    // Only vendor-actionable statuses — STOCKED is reserved for the café (via /receive)
    const vendorAllowedStatuses = ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!vendorAllowedStatuses.includes(body.status)) {
      throw new BadRequestException(`Status '${body.status}' is not vendor-actionable.`);
    }

    const order = await prisma.supplierOrder.findUnique({ where: { id } });
    if (!order) throw new BadRequestException("Order not found");

    const previousStatus = order.status;

    const updatedOrder = await prisma.supplierOrder.update({
      where: { id },
      data: { status: body.status as any },
      include: { items: { include: { stockItem: true } }, store: { select: { id: true, name: true, city: true } } }
    });

    // 💳 Marketplace Commission Deduction on Acceptance (CONFIRMED)
    if (body.status === 'CONFIRMED' && previousStatus === 'PENDING' && updatedOrder.vendorId) {
      try {
        const vendor = await (prisma as any).vendorProfile.findUnique({
          where: { id: updatedOrder.vendorId },
          include: { 
            wallet: true,
            commissionRule: true
          }
        });

        // Check if settlement already exists to prevent double deduction
        const existingSettlement = await (prisma as any).marketplaceSettlement.findFirst({
           where: { orderId: updatedOrder.id }
        });

        if (vendor && !existingSettlement) {
          const totalNum = Number(updatedOrder.total || 0);
          
          let baseRate = 0.01;
          let tiersRaw: any = null;

          // 1. Priority: Assigned Rule
          if (vendor.commissionRule) {
            baseRate = Number(vendor.commissionRule.baseRate);
            tiersRaw = vendor.commissionRule.tiers;
          } else {
            // 2. Default Global Rule
            const defaultRule = await (prisma as any).commissionRule.findFirst({
              where: { isDefault: true }
            });
            if (defaultRule) {
              baseRate = Number(defaultRule.baseRate);
              tiersRaw = defaultRule.tiers;
            } else {
              // 3. Fallback: Vendor Override
              baseRate = Number(vendor.commissionRate);
              if (isNaN(baseRate) || baseRate === 0) {
                baseRate = 0.01;
              }
              tiersRaw = vendor.commissionTiers;
            }
          }

          let finalRate = baseRate;
          if (tiersRaw) {
            try {
              const tiers = Array.isArray(tiersRaw) ? tiersRaw : (typeof tiersRaw === 'string' ? JSON.parse(tiersRaw) : []);
              if (tiers.length > 0) {
                const sortedTiers = tiers.sort((a: any, b: any) => b.minAmount - a.minAmount);
                for (const tier of sortedTiers) {
                  if (totalNum >= tier.minAmount) {
                    finalRate = tier.rate;
                    break;
                  }
                }
              }
            } catch (e) {
              console.warn("[Marketplace] Error parsing tiers for calculation", e);
            }
          }


          const commissionAmount = totalNum * finalRate;

          if (commissionAmount > 0) {
            const walletId = vendor.wallet ? vendor.wallet.id : (await (prisma as any).vendorWallet.create({
              data: { vendorId: vendor.id, balance: 0 }
            })).id;

            // 1. Create Settlement
            const settlement = await (prisma as any).marketplaceSettlement.create({
              data: {
                orderId: updatedOrder.id,
                commissionAmount,
                isProcessed: true,
                processedAt: new Date()
              }
            });

            // 2. Decrement Balance
            await prisma.vendorWallet.update({
              where: { id: walletId },
              data: { balance: { decrement: commissionAmount } }
            });

            // 3. Log Wallet Transaction connected to Settlement
            await (prisma as any).walletTransaction.create({
              data: {
                walletId,
                amount: -commissionAmount, // Deduction
                type: 'COMMISSION',
                description: `Commission Marketplace (${(finalRate * 100).toFixed(2)}%) sur commande #${updatedOrder.id.slice(-6)}`,
                settlementId: settlement.id
              }
            });
          }
        }
      } catch (err) {
        console.error("Commission processing error on acceptance:", err);
      }
    }

    return updatedOrder;
  }

  // ═══════════════════════════════════════════════════════════
  // EXPENSES CRUD
  // ═══════════════════════════════════════════════════════════

  @Get('expenses/:storeId')
  async getExpenses(@Param('storeId') storeId: string, @Query('limit') limit?: number): Promise<any> {
    return prisma.expense.findMany({
      where: { storeId },
      orderBy: { date: 'desc' },
      take: limit ? Number(limit) : 50,
    });
  }

  @Post('expenses')
  async createExpense(@Body() body: {
    storeId: string; category: string; amount: number; description?: string; date?: string;
  }): Promise<any> {
    return prisma.expense.create({
      data: {
        storeId: body.storeId,
        category: body.category,
        amount: body.amount,
        description: body.description,
        date: body.date ? new Date(body.date) : new Date(),
      }
    });
  }

  @Put('expenses/:id')
  async updateExpense(@Param('id') id: string, @Body() body: {
    category?: string; amount?: number; description?: string; date?: string;
  }): Promise<any> {
    return prisma.expense.update({
      where: { id },
      data: {
        ...(body.category && { category: body.category }),
        ...(body.amount !== undefined && { amount: body.amount }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.date && { date: new Date(body.date) }),
      }
    });
  }

  @Delete('expenses/:id')
  async deleteExpense(@Param('id') id: string): Promise<any> {
    return prisma.expense.delete({ where: { id } });
  }

  // ═══════════════════════════════════════════════════════════
  // REPORTING SUMMARY
  // ═══════════════════════════════════════════════════════════

  @Get('reports/summary/:storeId')
  async getReportSummary(@Param('storeId') storeId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - 6); // last 7 days

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const endOfYesterday = new Date(today);

    // Parallel queries for performance
    const [todaySales, yesterdaySales, weeklySales, monthSales, allTimeSales, todayExpenses] = await Promise.all([
      prisma.sale.aggregate({
        where: { storeId, isVoid: false, createdAt: { gte: today } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { storeId, isVoid: false, createdAt: { gte: yesterday, lt: endOfYesterday } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { storeId, isVoid: false, createdAt: { gte: firstDayOfWeek } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { storeId, isVoid: false, createdAt: { gte: firstDayOfMonth } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { storeId, isVoid: false },
        _sum: { total: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { storeId, date: { gte: today } },
        _sum: { amount: true },
      }),
    ]);

    // Low stock: items where quantity < minThreshold (field-to-field comparison via raw)
    const lowStockResult = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM "StockItem"
      WHERE "storeId" = ${storeId}
        AND "quantity" < "minThreshold"
        AND "minThreshold" > 0
    `;
    const lowStock = Number(lowStockResult?.[0]?.count ?? 0);

    // Last 7 days chart
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      const dayTotal = await prisma.sale.aggregate({
        where: { storeId, isVoid: false, createdAt: { gte: d, lt: nextD } },
        _sum: { total: true },
      });
      chartData.push({
        date: d.toISOString().split('T')[0],
        total: Number(dayTotal._sum.total || 0),
      });
    }

    const totalSalesDay = Number(todaySales._sum.total || 0);
    const totalExpensesDay = Number(todayExpenses._sum.amount || 0);

    // Top Products (today) — group by product name via raw
    const topProductsRaw = await prisma.$queryRaw<{ name: string; qty: bigint; revenue: number }[]>`
      SELECT p.name, SUM(si.quantity) as qty, SUM(si.quantity * si.price) as revenue
      FROM "SaleItem" si
      JOIN "Sale" s ON si."saleId" = s.id
      JOIN "Product" p ON si."productId" = p.id
      WHERE s."storeId" = ${storeId}
        AND s."isVoid" = false
        AND s."createdAt" >= ${today}
      GROUP BY p.name
      ORDER BY qty DESC
      LIMIT 10
    `;
    const topProducts = topProductsRaw.map(r => ({
      name: r.name,
      qty: Number(r.qty),
      revenue: Number(r.revenue),
    }));

    // Top Staff (today) — group by takenBy user
    const topStaffRaw = await prisma.$queryRaw<{ name: string; revenue: number; count: bigint }[]>`
      SELECT u.name, SUM(s.total) as revenue, COUNT(s.id) as count
      FROM "Sale" s
      JOIN "User" u ON s."takenById" = u.id
      WHERE s."storeId" = ${storeId}
        AND s."isVoid" = false
        AND s."createdAt" >= ${today}
      GROUP BY u.name
      ORDER BY revenue DESC
      LIMIT 5
    `;
    const topStaff = topStaffRaw.map(r => ({
      name: r.name,
      revenue: Number(r.revenue),
      count: Number(r.count),
    }));

    // Top Tables (today)
    const topTablesRaw = await prisma.$queryRaw<{ tableName: string; revenue: number }[]>`
      SELECT "tableName", SUM(total) as revenue
      FROM "Sale"
      WHERE "storeId" = ${storeId}
        AND "isVoid" = false
        AND "tableName" IS NOT NULL
        AND "createdAt" >= ${today}
      GROUP BY "tableName"
      ORDER BY revenue DESC
      LIMIT 5
    `;
    const topTables = topTablesRaw.map(r => ({
      name: r.tableName,
      revenue: Number(r.revenue),
    }));

    return {
      // ── Flat KPIs for mobile ──────────────────────────────────
      totalSales: totalSalesDay,
      orderCount: todaySales._count || 0,
      yesterdaySales: Number(yesterdaySales._sum.total || 0),
      yesterdayOrderCount: yesterdaySales._count || 0,
      totalExpenses: totalExpensesDay,
      weeklySales: Number(weeklySales._sum.total || 0),
      weeklyOrderCount: weeklySales._count || 0,
      monthlySales: Number(monthSales._sum.total || 0),
      monthlyOrderCount: monthSales._count || 0,
      allTimeSales: Number(allTimeSales._sum.total || 0),
      allTimeOrderCount: allTimeSales._count || 0,
      lowStockCount: typeof lowStock === 'number' ? lowStock : 0,
      margin: totalSalesDay > 0 ? ((totalSalesDay - totalExpensesDay) / totalSalesDay) * 100 : 0,
      netProfit: totalSalesDay - totalExpensesDay,
      // ── Rich analytics ───────────────────────────────────────
      topProducts,
      topStaff,
      topTables,
      topVendor: topStaff[0] || null,
      // ── Legacy nested keys (web consumer) ────────────────────
      today: { total: totalSalesDay, count: todaySales._count },
      month: {
        total: Number(monthSales._sum.total || 0),
        count: monthSales._count || 0,
        expenses: totalExpensesDay,
        net: Number(monthSales._sum.total || 0) - totalExpensesDay,
      },
      chart: chartData,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // TERMINALS
  // ═══════════════════════════════════════════════════════════

  @Get('terminals/:storeId')
  async getTerminals(@Param('storeId') storeId: string): Promise<any> {
    return prisma.posTerminal.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Post('terminals')
  async createTerminal(@Body() body: { storeId: string; nickname: string }): Promise<any> {
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
    return prisma.posTerminal.create({
      data: {
        storeId: body.storeId,
        nickname: body.nickname,
        activationCode,
        status: 'INACTIVE'
      }
    });
  }

  @Delete('terminals/:id')
  async deleteTerminal(@Param('id') id: string): Promise<any> {
    try {
      return await prisma.posTerminal.delete({ where: { id } });
    } catch (e) {
      return await prisma.posTerminal.update({
        where: { id },
        data: { status: 'REVOKED', activationCode: null }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // EMPLOYEES
  // ═══════════════════════════════════════════════════════════

  @Get('employees/:storeId')
  async getEmployees(@Param('storeId') storeId: string): Promise<any> {
    return prisma.user.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        pinCode: true,
        permissions: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Post('employees')
  async createEmployee(@Body() body: { storeId: string; name: string; role: string; pinCode: string }): Promise<any> {
    const defaultEmail = `staff_${Math.random().toString(36).substring(7)}@coffeeshop.internal`;
    const defaultPassword = await bcrypt.hash(body.pinCode, 10);
    
    return prisma.user.create({
      data: {
        storeId: body.storeId,
        name: body.name,
        email: defaultEmail,
        password: defaultPassword,
        role: body.role as any,
        pinCode: body.pinCode,
      },
      select: { id: true, name: true, role: true, pinCode: true }
    });
  }

  @Put('employees/:id')
  async updateEmployee(@Param('id') id: string, @Body() body: { name?: string; role?: string; pinCode?: string }): Promise<any> {
    const dataToUpdate: any = {};
    if (body.name) dataToUpdate.name = body.name;
    if (body.role) dataToUpdate.role = body.role as any;
    if (body.pinCode) dataToUpdate.pinCode = body.pinCode;

    return prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: { id: true, name: true, role: true, pinCode: true }
    });
  }

  @Delete('employees/:id')
  async deleteEmployee(@Param('id') id: string): Promise<any> {
    try {
      return await prisma.user.delete({ where: { id } });
    } catch(e) {
      return await prisma.user.update({
        where: { id },
        data: { pinCode: null, storeId: null }
      });
    }
  }

  @Post('vendor/deposit-request')
  async createDepositRequest(@Body() body: {
    vendorId: string;
    amount: number;
    proofImage?: string;
  }): Promise<any> {
    if (!body.vendorId || !body.amount) {
      throw new BadRequestException('ID vendeur et montant requis');
    }
    return (prisma as any).walletDepositRequest.create({
      data: {
        vendorId: body.vendorId,
        amount: body.amount,
        proofImage: body.proofImage,
        status: 'PENDING'
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // MESSAGES (TradeMessage)
  // ═══════════════════════════════════════════════════════════

  @UseGuards(MarketplaceAuthGuard)
  @Get('vendor/messages')
  async getVendorMessages(@Req() req: any, @Query('otherUserId') otherUserId?: string): Promise<any> {
    const userId = req.currentUser.id;
    const where: any = otherUserId
      ? {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        }
      : {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        };
    const messages = await (prisma as any).tradeMessage.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, image: true, price: true } },
      },
      orderBy: { createdAt: otherUserId ? 'asc' : 'desc' },
    });
    if (otherUserId) {
      return { success: true, data: messages };
    }
    // Group by conversation
    const convMap = new Map<string, any>();
    for (const msg of messages as any[]) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!convMap.has(otherUser.id)) {
        convMap.set(otherUser.id, {
          otherUser: { id: otherUser.id, name: otherUser.name },
          lastMessage: msg,
          unread: msg.senderId !== userId && !msg.isRead,
        });
      }
    }
    return { success: true, data: Array.from(convMap.values()) };
  }

  @UseGuards(MarketplaceAuthGuard)
  @Post('vendor/messages')
  async sendVendorMessage(@Req() req: any, @Body() body: { receiverId: string; content: string; productId?: string }): Promise<any> {
    if (!body.receiverId || !body.content) {
      throw new BadRequestException('Destinataire et contenu requis.');
    }
    const msg = await (prisma as any).tradeMessage.create({
      data: {
        senderId: req.currentUser.id,
        receiverId: body.receiverId,
        content: body.content,
        productId: body.productId || null,
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });
    return { success: true, data: msg };
  }

  @UseGuards(MarketplaceAuthGuard)
  @Get('vendor/orders/:orderId/client')
  async getOrderClientInfo(@Req() req: any, @Param('orderId') orderId: string): Promise<any> {
    const order = await (prisma as any).supplierOrder.findUnique({
      where: { id: orderId },
      include: {
        store: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });
    if (!order) throw new BadRequestException('Commande introuvable.');
    const vendor = await (prisma as any).vendorProfile.findUnique({ where: { userId: req.currentUser.id } });
    if (!vendor || order.vendorId !== vendor.id) {
      throw new BadRequestException('Accès refusé.');
    }
    const contactUnlocked = order.status !== 'PENDING' && order.status !== 'CANCELLED';
    return {
      success: true,
      data: {
        clientName: order.store?.name || order.store?.user?.name || 'Client',
        city: order.deliveryCity || order.store?.city || '',
        address: order.deliveryAddress || order.store?.address || '',
        phone: contactUnlocked ? (order.store?.user?.phone || order.phone || '') : '********',
        email: contactUnlocked ? (order.store?.user?.email || '') : '********',
        contactUnlocked,
      },
    };
  }

  // ─── RFQ (Request For Quote) ─────────────────────────────────────────────

  @UseGuards(MarketplaceAuthGuard)
  @Get('vendor/rfq')
  async getVendorRFQs(
    @Req() req: any,
    @Query('type') type?: string,
  ): Promise<any> {
    const vendor = await (prisma as any).vendorProfile.findUnique({ where: { userId: req.currentUser.id } });
    if (!vendor) throw new BadRequestException('Profil vendeur introuvable.');

    // Auto-expire RFQs
    const now = new Date();
    await (prisma as any).marketplaceRFQ.updateMany({
      where: { status: 'OPEN', expiresAt: { lt: now } },
      data: { status: 'EXPIRED' },
    });

    const filterType = type || 'open';

    let whereClause: any = {};
    if (filterType === 'my') {
      // RFQs where vendor has submitted a quote (any status)
      const myQuoteRfqIds = await (prisma as any).marketplaceQuote.findMany({
        where: { vendorId: vendor.id },
        select: { rfqId: true },
      });
      whereClause = { id: { in: myQuoteRfqIds.map((q: any) => q.rfqId) } };
    } else {
      // Default: only OPEN
      whereClause = { status: 'OPEN' };
    }

    const rfqs = await (prisma as any).marketplaceRFQ.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        store: { select: { name: true, city: true } },
        quotes: { where: { vendorId: vendor.id } },
      },
    });

    return {
      success: true,
      data: rfqs.map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        quantity: Number(r.quantity),
        budget: r.budget ? Number(r.budget) : null,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
        status: r.status,
        store: r.store,
        hasSubmittedQuote: r.quotes.length > 0,
        myQuote: r.quotes.length > 0
          ? {
              id: r.quotes[0].id,
              price: Number(r.quotes[0].price),
              notes: r.quotes[0].notes,
              status: r.quotes[0].status,
              createdAt: r.quotes[0].createdAt,
            }
          : null,
      })),
    };
  }

  @UseGuards(MarketplaceAuthGuard)
  @Post('vendor/rfq')
  async submitRFQQuote(@Req() req: any, @Body() body: { rfqId: string; price: number; notes?: string }): Promise<any> {
    const vendor = await (prisma as any).vendorProfile.findUnique({ where: { userId: req.currentUser.id } });
    if (!vendor) throw new BadRequestException('Profil vendeur introuvable.');
    if (!body.rfqId || !body.price) throw new BadRequestException('rfqId et prix requis.');

    const existing = await (prisma as any).marketplaceQuote.findFirst({
      where: { rfqId: body.rfqId, vendorId: vendor.id },
    });
    if (existing) {
      throw new BadRequestException('Vous avez déjà envoyé une proposition pour cette demande.');
    }

    const quote = await (prisma as any).marketplaceQuote.create({
      data: {
        rfqId: body.rfqId,
        vendorId: vendor.id,
        price: Number(body.price),
        notes: body.notes || null,
      },
    });

    const rfq = await (prisma as any).marketplaceRFQ.findUnique({
      where: { id: body.rfqId },
      include: { store: { include: { owner: true } } },
    });
    if (rfq?.store?.owner) {
      await (prisma as any).tradeNotification.create({
        data: {
          userId: rfq.store.owner.id,
          type: 'RFQ_QUOTE',
          title: 'Nouvelle proposition RFQ',
          content: `Un vendeur a soumis une proposition pour votre demande : ${rfq.title}`,
          metadata: { quoteId: quote.id },
        },
      });
    }

    return { success: true, data: quote };
  }

  // ─── Notification Email Preferences ──────────────────────────────────────

  @UseGuards(MarketplaceAuthGuard)
  @Get('vendor/notification-settings')
  async getNotificationSettings(@Req() req: any): Promise<any> {
    const user = await (prisma as any).user.findUnique({
      where: { id: req.currentUser.id },
      select: {
        notifyEmailMessages: true,
        notifyEmailOrders: true,
        notifyEmailRFQs: true,
      },
    });
    if (!user) throw new BadRequestException('Utilisateur introuvable.');
    return {
      success: true,
      data: {
        notifyEmailMessages: user.notifyEmailMessages ?? true,
        notifyEmailOrders: user.notifyEmailOrders ?? true,
        notifyEmailRFQs: user.notifyEmailRFQs ?? true,
      },
    };
  }

  @UseGuards(MarketplaceAuthGuard)
  @Put('vendor/notification-settings')
  async updateNotificationSettings(
    @Req() req: any,
    @Body() body: { notifyEmailMessages?: boolean; notifyEmailOrders?: boolean; notifyEmailRFQs?: boolean },
  ): Promise<any> {
    const data: any = {};
    if (body.notifyEmailMessages !== undefined) data.notifyEmailMessages = body.notifyEmailMessages;
    if (body.notifyEmailOrders !== undefined) data.notifyEmailOrders = body.notifyEmailOrders;
    if (body.notifyEmailRFQs !== undefined) data.notifyEmailRFQs = body.notifyEmailRFQs;
    const updated = await (prisma as any).user.update({
      where: { id: req.currentUser.id },
      data,
      select: {
        notifyEmailMessages: true,
        notifyEmailOrders: true,
        notifyEmailRFQs: true,
      },
    });
    return { success: true, data: updated };
  }

  // ═══════════════════════════════════════════════════════════
  // INVOICE IMPORT  (AI analysis + stock import)
  // ═══════════════════════════════════════════════════════════

  @Post('invoice/analyze')
  async analyzeInvoice(@Body() body: { imageBase64: string }): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new BadRequestException("Clé API Gemini non configurée.");
    }

    let cleanBase64 = body.imageBase64;
    let mimeType = "image/jpeg";
    if (body.imageBase64.includes(';base64,')) {
      const parts = body.imageBase64.split(';base64,');
      cleanBase64 = parts[1];
      mimeType = parts[0].replace('data:', '');
    }

    const prompt = `Analyze this purchase invoice/ticket image and extract the following details in a structured JSON format:
- "supplierName": The name of the vendor/supplier.
- "items": A list of items/products purchased. For each item extract:
  - "name": Name/description of the item (translate to French if possible).
  - "quantity": Number of units purchased (as a number).
  - "price": Unit cost/price excluding tax (HT) or unit price including tax if HT not clear (as a number).
  - "tva": Value Added Tax (TVA) percentage rate if listed (e.g. 19 for 19%, 7 for 7%).

Return ONLY a valid JSON object matching this schema, without markdown formatting blocks:
{
  "supplierName": string,
  "items": Array<{ name: string, quantity: number, price: number, tva: number }>
}`;

    const models = ['gemini-1.5-flash', 'gemini-2.5-flash'];
    let lastError: any = null;

    for (const model of models) {
      for (const version of ['v1', 'v1beta']) {
        try {
          const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType, data: cleanBase64 } }
                ]
              }],
              generationConfig: { responseMimeType: "application/json" }
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Status ${response.status}: ${errorText}`);
          }

          const resData = await response.json();
          const textResponse = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!textResponse) throw new Error("Aucun texte retourné.");

          return JSON.parse(textResponse);
        } catch (err: any) {
          lastError = err;
        }
      }
    }

    throw new BadRequestException(`L'analyse de la facture a échoué: ${lastError?.message}`);
  }

  @Post('invoice/import')
  async importInvoiceItems(@Body() body: {
    storeId: string;
    supplierName?: string;
    items: Array<{
      stockItemId?: string;
      name?: string;
      quantity: number;
      cost: number;
      taxRate?: number;
      unitId?: string;
    }>;
  }): Promise<any> {
    if (!body.storeId) throw new BadRequestException("storeId requis.");

    let supplierId: string | undefined = undefined;
    if (body.supplierName && body.supplierName.trim() !== "") {
      const nameTrim = body.supplierName.trim();
      let supplier = await (prisma as any).supplier.findFirst({
        where: { name: { equals: nameTrim, mode: 'insensitive' }, storeId: body.storeId }
      });

      if (!supplier) {
        supplier = await (prisma as any).supplier.create({
          data: {
            name: nameTrim,
            contact: "Contact " + nameTrim,
            phone: "00000000",
            storeId: body.storeId
          }
        });
      }
      supplierId = supplier.id;
    }

    let totalTtc = 0;
    const results: any[] = [];

    for (const item of body.items) {
      const rate = item.taxRate ?? 0.19;
      const ht = item.cost * item.quantity;
      const ttc = ht * (1 + rate);
      totalTtc += ttc;

      if (item.stockItemId && item.stockItemId !== 'NEW') {
        const currentItem = await prisma.stockItem.findUnique({
          where: { id: item.stockItemId }
        });
        if (currentItem) {
          const newQty = Number(currentItem.quantity) + Number(item.quantity);
          const updated = await prisma.stockItem.update({
            where: { id: item.stockItemId },
            data: {
              quantity: newQty,
              cost: item.cost,
              taxRate: rate,
              preferredSupplierId: supplierId || currentItem.preferredSupplierId
            }
          });
          results.push({ id: updated.id, name: updated.name, action: 'UPDATED' });
        }
      } else if (item.name) {
        const created = await prisma.stockItem.create({
          data: {
            name: item.name,
            quantity: item.quantity,
            cost: item.cost,
            taxRate: rate,
            minThreshold: 0,
            storeId: body.storeId,
            unitId: item.unitId || null,
            preferredSupplierId: supplierId || null
          }
        });
        results.push({ id: created.id, name: created.name, action: 'CREATED' });
      }
    }

    if (totalTtc > 0) {
      await prisma.expense.create({
        data: {
          storeId: body.storeId,
          category: "ACHAT",
          amount: totalTtc,
          description: `Facture Achat - ${body.supplierName || 'Fournisseur Inconnu'}`,
        }
      });
    }

    return { success: true, items: results, totalTtc };
  }
}
