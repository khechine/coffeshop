import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as bcrypt from 'bcrypt';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { prisma } from '@coffeeshop/database';
import { MarketplaceAuthGuard } from './auth/marketplace.guard';
import { InteractionService } from './marketplace/interaction.service';

interface CreateMarketplaceProductDto {
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

@Controller('management')
export class ManagementController {
  constructor(private readonly interactionService: InteractionService) {}

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
  }): Promise<any> {
    return prisma.product.create({
      data: {
        name: body.name,
        price: body.price,
        categoryId: body.categoryId,
        storeId: body.storeId,
        unitId: body.unitId || null,
        taxRate: body.taxRate !== undefined ? body.taxRate : 0.19,
        canBeTakeaway: body.canBeTakeaway ?? true,
        icon: body.icon || null,
        image: body.image || null,
        active: true,
      },
      include: { category: true },
    });
  }

  @Put('products/:id')
  async updateProduct(@Param('id') id: string, @Body() body: {
    name?: string; price?: number; categoryId?: string; unitId?: string; 
    active?: boolean; taxRate?: number; canBeTakeaway?: boolean;
    icon?: string; image?: string;
  }): Promise<any> {
    return prisma.product.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.unitId !== undefined && { unitId: body.unitId || null }),
        ...(body.active !== undefined && { active: body.active }),
        ...(body.taxRate !== undefined && { taxRate: body.taxRate }),
        ...(body.canBeTakeaway !== undefined && { canBeTakeaway: body.canBeTakeaway }),
        ...(body.icon !== undefined && { icon: body.icon || null }),
        ...(body.image !== undefined && { image: body.image || null }),
      },
      include: { category: true },
    });
  }


  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string): Promise<any> {
    // Safety check for sales history
    const salesCount = await prisma.saleItem.count({ where: { productId: id } });
    if (salesCount > 0) {
      throw new Error(`Ce produit est lié à ${salesCount} ventes. Suppression impossible.`);
    }

    // 1. Delete recipe
    await prisma.recipeItem.deleteMany({ where: { productId: id } });
    
    // 2. Delete product
    return prisma.product.delete({ where: { id } });
  }


  // Categories helper
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
    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      throw new BadRequestException(`Impossible de supprimer : cette catégorie contient encore ${productsCount} produits.`);
    }
    return prisma.category.delete({ where: { id } });
  }
  
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = join(__dirname, '..', '..', 'public', 'uploads');
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
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
    return prisma.storeTable.findMany({
      where: { storeId },
      orderBy: { label: 'asc' },
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
    status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  }): Promise<any> {
    const order = await prisma.supplierOrder.update({
      where: { id },
      data: { status: body.status },
      include: { items: { include: { stockItem: true } } },
    });

    // If delivered, auto-update stock quantities
    if (body.status === 'DELIVERED') {
      for (const item of order.items) {
        if (item.stockItemId) {
          await prisma.stockItem.update({
            where: { id: item.stockItemId },
            data: { quantity: { increment: Number(item.quantity) } },
          });
        }
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

    return prisma.mktCategory.findMany({
      where: { status: 'ACTIVE' },
      include: { subcategories: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get('marketplace/products')
  async getMarketplaceProducts(
    @Query('vendorId') vendorId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<any> {
    return prisma.vendorProduct.findMany({
      where: vendorId ? { vendorId } : {},
      include: { 
        vendor: { 
          select: {
            id: true,
            companyName: true,
            city: true,
            description: true,
          }
        },
        productStandard: true // Include standard info for extra metadata
      },
      orderBy: { createdAt: 'desc' },
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
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
    
    // Group by store for top clients
    const clientMap: Record<string, number> = {};
    orders.forEach((o: any) => {
      const name = o.store?.name || 'Inconnu';
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
    };
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

  @Get('marketplace/categories')
  async getAllMarketplaceCategories(): Promise<any> {
    return (prisma as any).mktCategory.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sortOrder: 'asc' }
    });
  }

  @Get('marketplace/bundles')
  async getAllMarketplaceBundles(): Promise<any> {
    return (prisma as any).mktBundle.findMany({
      include: { 
        items: { include: { vendorProduct: { include: { productStandard: true } } } },
        vendor: { select: { id: true, companyName: true, city: true } }
      }
    });
  }

  @Get('marketplace/vendors')
  async getAllMarketplaceVendors(): Promise<any> {
    return (prisma as any).vendorProfile.findMany({
      include: { 
        mktSectors: true,
        _count: { select: { vendorProducts: true } }
      },
      orderBy: { companyName: 'asc' }
    });
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
        // ✅ Anti-leakage: city only — no phone, address, GPS before confirmed delivery
        store: { select: { id: true, name: true, city: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Reveal phone only when order is CONFIRMED or SHIPPED (needed for delivery)
    return orders.map((order: any) => ({
      ...order,
      store: {
        ...order.store,
        ...(order.status === 'CONFIRMED' || order.status === 'SHIPPED'
          ? { deliveryContact: '📞 Disponible à la confirmation' } // Reveal via secure channel
          : {}),
      },
    }));
  }

  @UseGuards(MarketplaceAuthGuard)
  @Put('vendor/orders/:id/status')
  async updateVendorOrderStatus(@Param('id') id: string, @Body() body: {
    status: string;
  }): Promise<any> {
    // Map application statuses to Prisma enum
    let dbStatus = body.status;
    if (body.status === 'DELIVERING') dbStatus = 'SHIPPED';
    if (body.status === 'COMPLETED') dbStatus = 'DELIVERED';

    const order = await prisma.supplierOrder.update({
      where: { id },
      data: { status: dbStatus as any },
      include: { items: true }
    });

    return order;
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

    // Parallel queries for performance
    const [todaySales, weeklySales, monthSales, todayExpenses] = await Promise.all([
      prisma.sale.aggregate({
        where: { storeId, isVoid: false, createdAt: { gte: today } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { storeId, isVoid: false, createdAt: { gte: firstDayOfWeek } },
        _sum: { total: true },
      }),
      prisma.sale.aggregate({
        where: { storeId, isVoid: false, createdAt: { gte: firstDayOfMonth } },
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
      totalExpenses: totalExpensesDay,
      weeklySales: Number(weeklySales._sum.total || 0),
      monthlySales: Number(monthSales._sum.total || 0),
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
}
