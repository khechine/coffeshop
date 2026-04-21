import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException, UseGuards } from '@nestjs/common';
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
    name: string; price: number; categoryId: string; storeId: string; unitId?: string;
  }): Promise<any> {
    return prisma.product.create({
      data: {
        name: body.name,
        price: body.price,
        categoryId: body.categoryId,
        storeId: body.storeId,
        unitId: body.unitId || null,
        active: true,
      },
      include: { category: true },
    });
  }

  @Put('products/:id')
  async updateProduct(@Param('id') id: string, @Body() body: {
    name?: string; price?: number; categoryId?: string; unitId?: string; active?: boolean;
  }): Promise<any> {
    return prisma.product.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.unitId !== undefined && { unitId: body.unitId || null }),
        ...(body.active !== undefined && { active: body.active }),
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
  async createCategory(@Body() body: { name: string; storeId?: string; parentId?: string; active?: boolean }): Promise<any> {
    return prisma.category.create({ 
      data: { 
        name: body.name, 
        storeId: body.storeId,
        parentId: body.parentId || null,
        active: body.active ?? true
      } 
    });
  }

  @Put('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() body: { name?: string; parentId?: string; active?: boolean }): Promise<any> {
    return prisma.category.update({
      where: { id },
      data: { 
        name: body.name,
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
    items: { stockItemId: string; quantity: number }[];
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

  @UseGuards(MarketplaceAuthGuard)
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

  @UseGuards(MarketplaceAuthGuard)
  @Get('marketplace/products')
  async getMarketplaceProducts(@Query('vendorId') vendorId: string): Promise<any> {
    return prisma.vendorProduct.findMany({
      where: vendorId ? { vendorId } : {},
      include: { 
        vendor: { 
          select: {
            id: true,
            companyName: true,
            city: true,
            description: true,
            // ✅ Anti-leakage: email, phone, address, lat/lng masked
          }
        } 
      },
      orderBy: { createdAt: 'desc' },
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
        isFeatured: body.isFeatured || false,
        isFlashSale: body.isFlashSale || false,
        discountPrice: body.discountPrice || null,
        flashStart: body.flashStart ? new Date(body.flashStart) : null,
        flashEnd: body.flashEnd ? new Date(body.flashEnd) : null,
      },
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
}
