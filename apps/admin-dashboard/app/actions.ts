'use server';

import { prisma } from '@coffeeshop/database';
import { revalidatePath } from 'next/cache';
import * as bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// ── Helpers (Updated for phone field) ──────────────────────────
export async function getStore() {
  const userId = (await cookies()).get('userId')?.value;
  if (!userId) return null;

  try {
     const user = await prisma.user.findUnique({
       where: { id: userId },
       include: { 
         store: {
           include: {
             subscription: {
               include: { plan: true }
             }
           }
         } 
       }
     });

     if (user?.store) {
        const storeObj: any = user.store;
        const plan = storeObj?.subscription?.plan;
        
        // Combined access: from Plan OR manual override
        const hasMarketplace = (plan?.hasMarketplace === true) || (storeObj?.forceMarketplaceAccess === true);
        storeObj.hasMarketplace = hasMarketplace;
        
        return storeObj;
     }
  } catch (err) {
     console.error("getStore error, trying raw fallback", err);
     const stores: any[] = await prisma.$queryRawUnsafe(
       `SELECT s.* FROM "Store" s JOIN "_StoreToUser" su ON s.id = su."A" WHERE su."B" = $1 LIMIT 1`,
       userId
     );
     if (stores[0]) return stores[0];
  }
  return null;
}

export async function toggleStoreMarketplaceAccess(storeId: string, enabled: boolean) {
  const user = await getUser();
  if (user?.role !== 'SUPERADMIN') {
    throw new Error('Action non autorisée : Seuls les super-administrateurs peuvent gérer les accès.');
  }

  await prisma.store.update({
    where: { id: storeId },
    data: { forceMarketplaceAccess: enabled }
  });

  revalidatePath('/superadmin/cafes');
}

export async function updateStore(data: { name: string; address: string; city: string; phone: string; lat?: number; lng?: number }) {
  const store = await getStore();
  if (!store) return;
  await prisma.store.update({ where: { id: store.id }, data });
  revalidatePath('/');
}

// ══════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════
export async function createProduct(data: { name: string; price: number; categoryId: string; unitId?: string; recipe?: { stockItemId: string; quantity: number }[] }) {
  const store = await getStore();
  if (!store) throw new Error('Store not found');
  
  await prisma.product.create({ 
    data: { 
      name: data.name,
      price: data.price,
      categoryId: data.categoryId,
      storeId: store.id,
      unitId: data.unitId || undefined,
      active: true,
      recipe: data.recipe ? {
        create: data.recipe.map(r => ({
          stockItemId: r.stockItemId,
          quantity: r.quantity
        }))
      } : undefined
    } 
  });
  revalidatePath('/admin/products');
}


export async function updateProduct(id: string, data: { name: string; price: number; categoryId: string; unitId?: string; recipe?: { stockItemId: string; quantity: number }[] }) {
  await prisma.recipeItem.deleteMany({ where: { productId: id } });
  await prisma.product.update({ 
    where: { id }, 
    data: {
      name: data.name,
      price: data.price,
      categoryId: data.categoryId,
      unitId: data.unitId || undefined,
      recipe: data.recipe ? {
        create: data.recipe.map(r => ({
          stockItemId: r.stockItemId,
          quantity: r.quantity
        }))
      } : undefined
    }
  });
  revalidatePath('/admin/products');
}

export async function deleteProduct(id: string) {
  // Check if product was ever sold
  const count = await prisma.saleItem.count({ where: { productId: id } });
  if (count > 0) {
    throw new Error(`Impossible de supprimer : ce produit a déjà ${count} ventes enregistrées. Pensez à l'archiver à la place.`);
  }

  try {
    // 1. Delete associated recipe items
    await prisma.recipeItem.deleteMany({ where: { productId: id } });
    
    // 2. Delete the product
    await prisma.product.delete({ where: { id } });
    revalidatePath('/admin/products');
  } catch (e: any) {
    throw new Error(`Erreur lors de la suppression : ${e.message}`);
  }
}


// ══════════════════════════════════════════════════════════════
//  STOCK ITEMS
// ══════════════════════════════════════════════════════════════
export async function createStockItem(data: { name: string; unitId?: string; quantity: number; minThreshold: number; cost: number; preferredVendorId?: string; preferredSupplierId?: string }) {
  const store = await getStore();
  if (!store) throw new Error('Store not found');
  const { unitId, preferredVendorId, preferredSupplierId, ...rest } = data;
  await prisma.stockItem.create({ data: { 
    ...rest, 
    storeId: store.id,
    unitId: unitId || undefined,
    preferredVendorId: preferredVendorId || undefined,
    preferredSupplierId: preferredSupplierId || undefined
  }});
  revalidatePath('/admin/stock');
}

export async function updateStockItem(id: string, data: { name: string; unitId?: string; quantity: number; minThreshold: number; cost: number; preferredVendorId?: string; preferredSupplierId?: string }) {
  const { unitId, preferredVendorId, preferredSupplierId, ...rest } = data;
  await prisma.stockItem.update({ where: { id }, data: {
    ...rest,
    unitId: unitId || undefined,
    preferredVendorId: preferredVendorId || undefined,
    preferredSupplierId: preferredSupplierId || undefined
  }});
  revalidatePath('/admin/stock');
}

export async function deleteStockItem(id: string) {
  await prisma.recipeItem.deleteMany({ where: { stockItemId: id } });
  await prisma.stockItem.delete({ where: { id } });
  revalidatePath('/admin/stock');
}

export async function adjustStock(id: string, delta: number) {
  const item = await prisma.stockItem.findUnique({ where: { id } });
  if (!item) return;
  await prisma.stockItem.update({ where: { id }, data: { quantity: Math.max(0, Number(item.quantity) + delta) } });
  revalidatePath('/admin/stock');
}

// ══════════════════════════════════════════════════════════════
//  SUPPLIERS
// ══════════════════════════════════════════════════════════════
export async function createSupplier(data: { name: string; contact: string; phone: string }) {
  await prisma.supplier.create({ data });
  revalidatePath('/vendor/dashboard');
}

export async function updateSupplier(id: string, data: { name: string; contact: string; phone: string }) {
  await prisma.supplier.update({ where: { id }, data });
  revalidatePath('/vendor/dashboard');
}

export async function deleteSupplier(id: string) {
  await prisma.supplier.delete({ where: { id } });
  revalidatePath('/vendor/dashboard');
}

// ══════════════════════════════════════════════════════════════
//  SUPPLIER ORDERS
// ══════════════════════════════════════════════════════════════
export async function createSupplierOrder(data: { supplierId: string; items: { stockItemId: string; quantity: number; price: number }[] }) {
  const store = await getStore();
  if (!store) throw new Error('Store not found');
  const total = data.items.reduce((acc, i) => acc + i.quantity * i.price, 0);
  await prisma.supplierOrder.create({
    data: {
      storeId: store.id,
      supplierId: data.supplierId,
      total,
      items: { create: data.items },
    },
  });
  revalidatePath('/vendor/dashboard');
  revalidatePath('/');
}

export async function updateOrderStatus(id: string, status: string) {
  const oldOrder = await prisma.supplierOrder.findUnique({
    where: { id },
    include: { items: true, store: true }
  });

  if (!oldOrder) throw new Error('Order not found');

  // Update order status
  await prisma.supplierOrder.update({
    where: { id },
    data: { status: status as any }
  });

  // If status is DELIVERED, trigger stock increment
  if (status === 'DELIVERED' && oldOrder.status !== 'DELIVERED') {
    await incrementStoreStock(oldOrder.id);
  }

  revalidatePath('/vendor/dashboard');
  revalidatePath('/');
}

async function incrementStoreStock(orderId: string) {
  const order = await prisma.supplierOrder.findUnique({
    where: { id: orderId },
    include: { items: true, store: true }
  });

  if (!order) return;

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      let stockItemId = item.stockItemId;

      // If marketplace/manual order (no stockItemId), try to find or create it
      if (!stockItemId && item.name) {
        let stockItem = await tx.stockItem.findFirst({
          where: { 
            storeId: order.storeId,
            name: { equals: item.name, mode: 'insensitive' }
          }
        });

        if (!stockItem) {
          stockItem = await tx.stockItem.create({
            data: {
              name: item.name,
              quantity: 0,
              storeId: order.storeId
            }
          });
        }
        stockItemId = stockItem.id;
      }

      if (stockItemId) {
        const currentItem = await tx.stockItem.findUnique({ where: { id: stockItemId } });
        if (currentItem) {
          const oldQty = Number(currentItem.quantity || 0);
          const oldCost = Number(currentItem.cost || 0);
          const newQty = Number(item.quantity);
          const newPrice = Number(item.price);
          
          let finalCost = newPrice;
          if (oldQty > 0) {
            finalCost = ((oldQty * oldCost) + (newQty * newPrice)) / (oldQty + newQty);
          }

          await tx.stockItem.update({
            where: { id: stockItemId },
            data: { 
              quantity: { increment: newQty },
              cost: finalCost
            }
          });
        }
      }
    }
  });

  revalidatePath(`/admin/stock`);
}


export async function deleteSupplierOrder(id: string) {
  await prisma.supplierOrderItem.deleteMany({ where: { orderId: id } });
  await prisma.supplierOrder.delete({ where: { id } });
  revalidatePath('/vendor/dashboard');
}

// ══════════════════════════════════════════════════════════════
//  STAFF / USERS
// ══════════════════════════════════════════════════════════════
export async function createStaffMember(data: { name: string; email: string; phone: string; role: string; defaultPosMode?: string; permissions?: string[]; assignedTables?: string[] }) {
  const store = await getStore();
  if (!store) throw new Error('Store not found');
  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role as any,
      defaultPosMode: data.defaultPosMode || 'tables',
      permissions: data.permissions || ['POS'],
      assignedTables: data.assignedTables || [],
      password: 'changeme123',   // must be reset by the user
      storeId: store.id,
    },
  });
  revalidatePath('/admin/staff');
}

export async function updateStaffMember(id: string, data: { name: string; email: string; phone: string; role: string; defaultPosMode?: string; permissions?: string[]; assignedTables?: string[] }) {
  await prisma.user.update({ 
    where: { id }, 
    data: { 
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role as any,
      defaultPosMode: data.defaultPosMode,
      permissions: data.permissions,
      assignedTables: data.assignedTables
    } 
  });
  revalidatePath('/admin/staff');
}

export async function deleteStaffMember(id: string) {
  // 1. Clean up session logs
  await prisma.staffSessionLog.deleteMany({ where: { userId: id } });
  
  // 2. Disconnect from sales history to avoid Restrict violation
  // The sales will remain in the database but will no longer point to this user
  await prisma.sale.updateMany({ where: { baristaId: id }, data: { baristaId: null } });
  await prisma.sale.updateMany({ where: { takenById: id }, data: { takenById: null } });
  
  // 3. Delete the user
  await prisma.user.delete({ where: { id } });
  revalidatePath('/admin/staff');
}

// ══════════════════════════════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════════════════════════════
export async function createCategory(name: string) {
  await prisma.category.create({ data: { name } });
  revalidatePath('/admin/products');
}

export async function deleteCategory(id: string) {
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) throw new Error(`Suppression impossible : ${count} produits sont dans cette catégorie.`);
  await prisma.category.delete({ where: { id } });
  revalidatePath('/admin/products');
}


// ══════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════
export async function registerStoreAction(data: any) {
  const { email, password, name, storeName, address, city, phone, rne, cin } = data;
  
  // Hash password in real app
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  const user = await prisma.user.create({
    data: {
      email,
      password,
      name,
      role: 'STORE_OWNER',
      emailVerified: false,
      verificationToken: Math.random().toString(36).substring(7),
      store: {
        create: {
          name: storeName,
          address,
          city,
          phone,
          status: 'PENDING_DOCS',
          officialDocs: { rne, cin, status: 'submitted' },
          trialEndsAt
        }
      }
    },
    include: { store: true }
  });

  return user;
}

export async function updateUserPasswordAction(userId: string, newPassword: string) {
  // In real app, hash password!
  await prisma.user.update({
    where: { id: userId },
    data: { password: newPassword }
  });
  revalidatePath('/superadmin/users');
  return { success: true };
}

export async function loginUser(email: string, pass: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: 'Utilisateur non trouvé' };
  
  const isMatch = await bcrypt.compare(pass, user.password);
  if (!isMatch) return { error: 'Mot de passe incorrect' };
  
  const response = { 
    id: user.id, 
    name: user.name, 
    role: user.role, 
    storeId: user.storeId,
    permissions: user.permissions,
    defaultPosMode: user.defaultPosMode
  };


  (await cookies()).set('userId', user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  
  return response;
}

export async function logoutUser() {
  (await cookies()).delete('userId');
}

// ══════════════════════════════════════════════════════════════
//  SALES
// ══════════════════════════════════════════════════════════════
export async function recordSale(data: { 
  total: number; 
  items: { productId: string; quantity: number; price: number }[];
  tableName?: string;
  baristaId?: string;
  takenById?: string;
}) {
  const store = await getStore();
  if (!store) throw new Error('Store not found');

  const sale = await prisma.$transaction(async (tx) => {
    const s = await tx.sale.create({
      data: {
        total: data.total,
        storeId: store.id,
        tableName: data.tableName,
        baristaId: data.baristaId,
        takenById: data.takenById || data.baristaId, // Default to cashier if not specified
        items: {
          create: data.items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
          }))
        }
      }
    });

    // 2. Deduct stock based on recipes
    for (const item of data.items) {
      const recipes = await tx.recipeItem.findMany({
        where: { productId: item.productId }
      });

      for (const recipe of recipes) {
        const totalToDeduct = Number(recipe.quantity) * item.quantity;
        await tx.stockItem.update({
          where: { id: recipe.stockItemId },
          data: {
            quantity: { decrement: totalToDeduct }
          }
        });
      }
    }

    return s;
  });

  revalidatePath('/');
  return sale;
}

// ══════════════════════════════════════════════════════════════
//  MARKETPLACE
// ══════════════════════════════════════════════════════════════
export async function getMarketplaceData() {
  const [categories, featuredRaw, flashSalesRaw, productsRaw] = await Promise.all([
    prisma.marketplaceCategory.findMany(),
    prisma.marketplaceProduct.findMany({ where: { isFeatured: true }, include: { vendor: true } }),
    prisma.marketplaceProduct.findMany({ where: { isFlashSale: true }, include: { vendor: true } }),
    prisma.marketplaceProduct.findMany({ include: { vendor: true } })
  ]);

  const mapProduct = (p: any) => ({
    ...p,
    price: Number(p.price),
    discount: p.discount ? Number(p.discount) : null,
    vendor: p.vendor ? {
      ...p.vendor,
      lat: p.vendor.lat ? Number(p.vendor.lat) : null,
      lng: p.vendor.lng ? Number(p.vendor.lng) : null
    } : null
  });

  return { 
    categories, 
    featured: featuredRaw.map(mapProduct), 
    flashSales: flashSalesRaw.map(mapProduct), 
    products: productsRaw.map(mapProduct) 
  };
}

export async function getMarketplaceBenchmarkData(vendorId: string) {
  const allProducts = await prisma.marketplaceProduct.findMany({
    where: { category: { status: 'ACTIVE' } },
    include: {
      category: { include: { parent: true } },
    }
  });

  // Group by (categoryId + unit + brand) — NOT by product name
  // This handles the case where vendors name the same product differently
  type GroupKey = string;
  const grouped = new Map<GroupKey, {
    categoryId: string | null;
    categoryName: string;
    parentCategoryName: string | null;
    unit: string;
    brand: string | null;
    vendorPrices: Map<string, number>; // vendorId → their min price for this segment
    myPrice: number | null;
    allPrices: number[];
  }>();

  for (const p of allProducts) {
    const brand = (p as any).brand ?? null;
    const key: GroupKey = `${p.categoryId ?? 'none'}::${p.unit.toLowerCase()}::${(brand ?? '').toLowerCase()}`;
    const price = Number(p.price);

    if (!grouped.has(key)) {
      grouped.set(key, {
        categoryId: p.categoryId ?? null,
        categoryName: p.category?.name ?? '—',
        parentCategoryName: (p.category as any)?.parent?.name ?? null,
        unit: p.unit,
        brand,
        vendorPrices: new Map(),
        myPrice: null,
        allPrices: [],
      });
    }
    const entry = grouped.get(key)!;

    if (p.vendorId === vendorId) {
      // Take the lowest of our prices for this segment
      entry.myPrice = entry.myPrice === null ? price : Math.min(entry.myPrice, price);
    } else {
      // One price per competitor vendor (their min)
      const prev = entry.vendorPrices.get(p.vendorId);
      entry.vendorPrices.set(p.vendorId, prev !== undefined ? Math.min(prev, price) : price);
      entry.allPrices.push(price);
    }
  }

  const benchmarks = Array.from(grouped.values())
    .filter(g => g.myPrice !== null || g.allPrices.length > 0)
    .map(g => {
      const hasCompetitors = g.allPrices.length > 0;
      const competitorCount = g.vendorPrices.size; // number of unique vendors (anonymized)
      const min  = hasCompetitors ? Math.min(...g.allPrices) : null;
      const max  = hasCompetitors ? Math.max(...g.allPrices) : null;
      const avg  = hasCompetitors ? g.allPrices.reduce((a, b) => a + b, 0) / g.allPrices.length : null;

      let position: 'cheapest' | 'competitive' | 'expensive' | 'exclusive' | 'unset' = 'unset';
      if (g.myPrice !== null && avg !== null) {
        if (g.myPrice < avg * 0.9)      position = 'cheapest';
        else if (g.myPrice > avg * 1.1) position = 'expensive';
        else                             position = 'competitive';
      } else if (g.myPrice !== null && !hasCompetitors) {
        position = 'exclusive';
      }

      return {
        categoryId: g.categoryId,
        categoryName: g.categoryName,
        parentCategoryName: g.parentCategoryName,
        displayCategory: g.parentCategoryName ? `${g.parentCategoryName} › ${g.categoryName}` : g.categoryName,
        unit: g.unit,
        brand: g.brand,
        myPrice: g.myPrice,
        min, max, avg,
        competitorCount, // anonymized: number of unique vendors
        position,
      };
    })
    .sort((a, b) => {
      // My products first, then by category name
      if ((a.myPrice !== null) !== (b.myPrice !== null)) return a.myPrice !== null ? -1 : 1;
      return a.displayCategory.localeCompare(b.displayCategory);
    });

  return benchmarks;
}

// ── Category tree (hierarchical) ──────────────────────────────────────────────
export async function getMarketplaceCategoryTree() {
  const all = await prisma.marketplaceCategory.findMany({
    where: { status: 'ACTIVE' },
    include: { children: { where: { status: 'ACTIVE' } } },
    orderBy: { name: 'asc' }
  });
  return all.filter(c => c.parentId === null); // Only root nodes with their children
}

// ── Vendor proposes a new subcategory (status = PENDING → admin approves) ──────
export async function proposeSubCategoryAction(name: string, parentId: string) {
  const userId = (await cookies()).get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { vendorProfile: true } });
  if (!user?.vendorProfile) throw new Error('Profil vendeur introuvable');

  // Check if a category with this name already exists under this parent
  const existing = await prisma.marketplaceCategory.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, parentId }
  });
  if (existing) return { error: 'Cette sous-catégorie existe déjà.' };

  await prisma.marketplaceCategory.create({
    data: {
      name: name.trim(),
      parentId,
      status: 'PENDING',
      proposedByVendorId: user.vendorProfile.id,
    }
  });
  return { success: true };
}

// ── Admin: get all pending category proposals ─────────────────────────────────
export async function getPendingCategoryProposals() {
  return prisma.marketplaceCategory.findMany({
    where: { status: 'PENDING' },
    include: { parent: true },
    orderBy: { createdAt: 'asc' }
  });
}

// ── User helper ───────────────────────────────────────────────────────────
export async function getUser() {
  const userId = (await cookies()).get('userId')?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

// ── Admin: approve or reject a proposed subcategory ───────────────────────────
export async function resolveCategoryProposal(id: string, action: 'approve' | 'reject', newName?: string, newParentId?: string) {
  const user = await getUser();
  if (user?.role !== 'SUPERADMIN') {
    throw new Error('Action non autorisée : Seuls les super-administrateurs peuvent gérer les catégories.');
  }

  await prisma.marketplaceCategory.update({
    where: { id },
    data: { 
      status: action === 'approve' ? 'ACTIVE' : 'REJECTED',
      name: (action === 'approve' && newName) ? newName.trim() : undefined,
      parentId: (action === 'approve' && newParentId) ? newParentId : undefined,
    }
  });
  revalidatePath('/superadmin/marketplace/categories');
  revalidatePath('/vendor/portal/catalog');
}

export async function updateMarketplaceCategoryAction(id: string, data: { name?: string, icon?: string, parentId?: string | null }) {
  const user = await getUser();
  if (user?.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  await prisma.marketplaceCategory.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      icon: data.icon?.trim(),
      parentId: data.parentId === "" ? null : data.parentId
    }
  });
  revalidatePath('/superadmin/marketplace/categories');
  revalidatePath('/marketplace');
}

export async function deleteMarketplaceCategoryAction(id: string) {
  const user = await getUser();
  if (user?.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  // Check if it has children or products
  const category = await prisma.marketplaceCategory.findUnique({
    where: { id },
    include: { _count: { select: { children: true, products: true } } }
  });

  if (category?._count.children! > 0 || category?._count.products! > 0) {
    throw new Error('Impossible de supprimer une catégorie non vide (contient des sous-catégories ou des produits).');
  }

  await prisma.marketplaceCategory.delete({ where: { id } });
  revalidatePath('/superadmin/marketplace/categories');
  revalidatePath('/marketplace');
}

export async function createMarketplaceCategoryAction(data: { name: string; icon?: string; parentId?: string | null }) {
  const user = await getUser();
  if (user?.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  await prisma.marketplaceCategory.create({ 
    data: {
      ...data,
      status: 'ACTIVE'
    } 
  });
  revalidatePath('/superadmin/marketplace/categories');
  revalidatePath('/marketplace');
}

export async function placeMarketplaceOrder(data: { vendorId: string; total: number; items: { productId: string; quantity: number; price: number; name: string }[] }) {
  const store = await getStore();
  if (!store) throw new Error('Store not found');

  // AUTO-ASSIGN AVAILABLE COURIER
  const availableCourier = await prisma.courierProfile.findFirst({
    where: { status: 'AVAILABLE' }
  });

  // Ensure the vendor is in the store's "Suppliers" list and get the supplierId
  let supplierId: string | null = null;
  const vendor = await prisma.vendorProfile.findUnique({ where: { id: data.vendorId } });
  if (vendor) {
    let existingSupplier = await prisma.supplier.findFirst({
      where: { name: `[Marketplace] ${vendor.companyName}` }
    });
    
    if (!existingSupplier) {
      existingSupplier = await prisma.supplier.create({
        data: {
          name: `[Marketplace] ${vendor.companyName}`,
          phone: vendor.phone,
          contact: 'Marketplace Vendor'
        }
      });
    }
    supplierId = existingSupplier.id;
  }

  const order = await prisma.supplierOrder.create({
    data: {
      storeId: store.id,
      vendorId: data.vendorId,
      supplierId: supplierId,
      total: data.total,
      status: 'PENDING',
      courierId: availableCourier?.id || null,
      items: {
        create: data.items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price
        }))
      }
    }
  });

  revalidatePath('/admin/orders');
  return order;
}

export async function registerVendorAction(data: any) {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: data.password,
      name: data.name,
      role: 'VENDOR'
    }
  });
  
  await prisma.vendorProfile.create({
    data: {
      userId: user.id,
      companyName: data.companyName,
      phone: data.phone,
      address: data.address,
      city: data.city,
      description: data.description,
      status: 'PENDING'
    }
  });

  return { success: true };
}

export async function getAllVendors() {
  return prisma.vendorProfile.findMany({
    include: { user: true }
  });
}

export async function updateVendorStatus(id: string, status: string) {
  await prisma.vendorProfile.update({
    where: { id },
    data: { status }
  });
  revalidatePath('/superadmin/vendors');
}

export async function getVendorPortalData() {
  const userId = (await cookies()).get('userId')?.value;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { vendorProfile: true }
  });

  if (!user || !user.vendorProfile) return null;

  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: user.vendorProfile.id },
    include: { 
      products: true,
      activityPoles: true,
      orders: { 
        include: { items: true, store: true },
        orderBy: { createdAt: 'desc' }
      } 
    }
  });

  if (vendor) {
    const mapProduct = (p: any) => ({
      ...p,
      price: Number(p.price),
      discount: p.discount ? Number(p.discount) : null
    });
    
    return {
      ...vendor,
      products: vendor.products.map(mapProduct),
      orders: vendor.orders.map(o => ({
        ...o,
        total: Number(o.total),
        items: o.items.map((it: any) => ({ ...it, quantity: Number(it.quantity), price: Number(it.price) }))
      })),
    };
  }
  return null;
}

export async function createMarketplaceProductAction(data: any) {
  // In real app use session to get vendorId
  const vendor = await prisma.vendorProfile.findFirst(); 
  if (!vendor) throw new Error('Vendor profile not found');

  await prisma.marketplaceProduct.create({
    data: {
      name: data.name,
      price: data.price,
      unit: data.unit,
      categoryId: data.categoryId,
      vendorId: vendor.id,
      image: data.image,
      isFeatured: data.isFeatured || false,
      isFlashSale: data.isFlashSale || false,
      discount: data.discount || null,
      upsellIds: data.upsellIds || [],
      minOrderQuantity: data.minOrderQuantity || 1
    }
  });
  revalidatePath('/vendor/portal/catalog');
}

export async function importCsvProductsAction(rows: {
  name: string;
  price: number;
  unit: string;
  categoryName: string;
  brand?: string | null;
  image?: string;
}[]) {
  const userId = (await cookies()).get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { vendorProfile: true } });
  if (!user?.vendorProfile) throw new Error('Profil vendeur introuvable');
  const vendorId = user.vendorProfile.id;

  // Fetch all ACTIVE categories (root + children) for name matching
  const allCategories = await prisma.marketplaceCategory.findMany({
    where: { status: 'ACTIVE' },
    include: { children: { where: { status: 'ACTIVE' } } }
  });
  // Flat list: root + all children
  const flatCategories = [
    ...allCategories,
    ...allCategories.flatMap((c: any) => c.children),
  ];

  const results = { created: 0, skipped: 0, errors: [] as string[] };

  for (const row of rows) {
    try {
      // Match category by name (case-insensitive) — searches full hierarchy
      const category = flatCategories.find(
        (c: any) => c.name.toLowerCase() === (row.categoryName ?? '').toLowerCase()
      );

      const brandVal = row.brand?.trim() || null;

      // Upsert: update if same name+vendor, create otherwise
      const existing = await prisma.marketplaceProduct.findFirst({ where: { name: row.name, vendorId } });
      if (existing) {
        await prisma.marketplaceProduct.update({
          where: { id: existing.id },
          data: {
            price: row.price,
            unit: row.unit,
            categoryId: category?.id ?? null,
            brand: brandVal,
            image: row.image || null,
          }
        });
      } else {
        await prisma.marketplaceProduct.create({
          data: {
            name: row.name,
            price: row.price,
            unit: row.unit,
            categoryId: category?.id ?? null,
            brand: brandVal,
            image: row.image || null,
            vendorId,
            minOrderQuantity: 1,
          }
        });
        results.created++;
      }
    } catch (e: any) {
      results.errors.push(`${row.name}: ${e.message}`);
      results.skipped++;
    }
  }

  revalidatePath('/vendor/portal/catalog');
  return results;
}


import { OrderStatus } from '@coffeeshop/database';

export async function updateSupplierOrderStatus(orderId: string, status: OrderStatus) {
  await prisma.supplierOrder.update({
    where: { id: orderId },
    data: { status }
  });
  revalidatePath('/vendor/portal/orders');
  revalidatePath('/admin/orders');
}

export async function updateMarketplaceProductAction(id: string, data: any) {
  await prisma.marketplaceProduct.update({
    where: { id },
    data: {
      name: data.name,
      price: data.price,
      unit: data.unit,
      categoryId: data.categoryId,
      image: data.image,
      isFeatured: data.isFeatured,
      isFlashSale: data.isFlashSale,
      discount: data.discount,
      flashStart: data.flashStart ? new Date(data.flashStart) : null,
      flashEnd: data.flashEnd ? new Date(data.flashEnd) : null,
      upsellIds: data.upsellIds || [],
      minOrderQuantity: data.minOrderQuantity || 1
    }
  });
  revalidatePath('/vendor/portal/catalog');
}

export async function getMarketplaceCategories() {
  return prisma.marketplaceCategory.findMany();
}

export async function updateVendorActivityPolesAction(vendorId: string, activityPoleIds: string[]) {
  await prisma.vendorProfile.update({
    where: { id: vendorId },
    data: {
      activityPoles: {
        set: activityPoleIds.map(id => ({ id }))
      }
    }
  });
  revalidatePath('/vendor/portal/settings');
}

export async function updateVendorProfileAction(vendorId: string, data: any) {
  await prisma.vendorProfile.update({
    where: { id: vendorId },
    data: {
      companyName: data.companyName,
      description: data.description,
      address: data.address,
      city: data.city,
      phone: data.phone,
      lat: data.lat,
      lng: data.lng,
    }
  });
  revalidatePath('/vendor/portal/settings');
}

export async function deleteMarketplaceProductAction(id: string) {
  await prisma.marketplaceProduct.delete({ where: { id } });
  revalidatePath('/vendor/portal/catalog');
}

export async function approveVendorAction(vendorId: string) {
  await prisma.vendorProfile.update({
    where: { id: vendorId },
    data: { status: 'ACTIVE' }
  });
  revalidatePath('/superadmin/vendors');
}

export async function rejectVendorAction(vendorId: string) {
  await prisma.vendorProfile.update({
    where: { id: vendorId },
    data: { status: 'REJECTED' }
  });
  revalidatePath('/superadmin/vendors');
}

// --- SUPERADMIN USER ACTIONS ---
export async function deleteUserAction(id: string) {
  await prisma.user.delete({ where: { id } });
  revalidatePath('/superadmin/users');
}


// ══════════════════════════════════════════════════════════════
//  COURIER PORTAL ACTIONS
// ══════════════════════════════════════════════════════════════
export async function getCourierPortalData() {
  const courier = await prisma.courierProfile.findFirst({
    include: { 
      orders: { 
        include: { 
          items: true, 
          store: true, 
          vendor: true 
        },
        orderBy: { createdAt: 'desc' }
      } 
    }
  });
  if (!courier) return null;
  
  // Transform Decimal to Number for client-side serialization
  return {
    ...courier,
    orders: courier.orders.map(o => ({
      ...o,
      total: Number(o.total),
      items: o.items.map(i => ({ ...i, price: Number(i.price), quantity: Number(i.quantity) }))
    }))
  };
}

export async function updateMissionStatus(orderId: string, status: OrderStatus) {
  // Update the order status
  const order = await prisma.supplierOrder.update({
    where: { id: orderId },
    data: { status },
    include: { store: true, items: true }
  });

  // If status is DELIVERED, trigger the consolidated stock update logic
  if (status === 'DELIVERED') {
    await incrementStoreStock(orderId);
  }

  revalidatePath('/courier');
  revalidatePath('/vendor/portal');
  revalidatePath('/vendor/dashboard');
  revalidatePath('/');
  return order;
}

// ══════════════════════════════════════════════════════════════
//  SUPERADMIN COURIER ACTIONS
// ══════════════════════════════════════════════════════════════
export async function approveCourierAction(id: string) {
  await prisma.courierProfile.update({
    where: { id },
    data: { status: 'AVAILABLE' }
  });
  revalidatePath('/superadmin/couriers');
}

export async function deactivateCourierAction(id: string) {
  await prisma.courierProfile.update({
    where: { id },
    data: { status: 'OFFLINE' }
  });
  revalidatePath('/superadmin/couriers');
}

// --- SUPERADMIN STORE ACTIONS ---
export async function updateStoreAdminAction(id: string, data: any) {
  await prisma.store.update({
    where: { id },
    data
  });
  revalidatePath('/superadmin/cafes');
}

// --- SUPERADMIN PLANS / SUBSCRIPTIONS ---
export async function createPlanAction(data: any) {
  try {
    await (prisma.plan as any).create({ 
      data: {
        ...data,
        price: Number(data.price),
        hasMarketplace: data.hasMarketplace ?? true
      } 
    });
  } catch (err: any) {
    if (err.message.includes('Unknown argument `hasMarketplace`')) {
      const { hasMarketplace, ...rest } = data;
      const plan = await prisma.plan.create({ 
        data: { ...rest, price: Number(data.price) }
      });
      if (hasMarketplace !== undefined) {
         // Force boolean literal update
         await prisma.$executeRawUnsafe(
           `UPDATE "Plan" SET "hasMarketplace" = ${hasMarketplace ? 'true' : 'false'} WHERE id = $1`, 
           plan.id
         );
      }
    } else {
      throw err;
    }
  }
  revalidatePath('/superadmin/plans');
}

export async function updatePlanAction(id: string, data: any) {
  try {
    await (prisma.plan as any).update({
      where: { id },
      data: {
        ...data,
        price: data.price !== undefined ? Number(data.price) : undefined,
        hasMarketplace: data.hasMarketplace !== undefined ? data.hasMarketplace : undefined
      }
    });
  } catch (err: any) {
    // Fallback if the client is stale and doesn't recognize hasMarketplace yet
    if (err.message.includes('Unknown argument `hasMarketplace`')) {
      const { hasMarketplace, ...rest } = data;
      await prisma.plan.update({
        where: { id },
        data: {
          ...rest,
          price: data.price !== undefined ? Number(data.price) : undefined
        }
      });
      if (hasMarketplace !== undefined) {
        // Force boolean literal update
        await prisma.$executeRawUnsafe(
          `UPDATE "Plan" SET "hasMarketplace" = ${hasMarketplace ? 'true' : 'false'} WHERE id = $1`, 
          id
        );
      }
    } else {
      throw err;
    }
  }
  revalidatePath('/superadmin/plans');
}

export async function togglePlanStatusAction(id: string) {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) return;
  const newStatus = plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  await prisma.plan.update({ where: { id }, data: { status: newStatus } });
  revalidatePath('/superadmin/plans');
}

export async function deletePlanAction(id: string) {
  const subs = await prisma.subscription.count({ where: { planId: id } });
  if (subs > 0) throw new Error("Impossible de supprimer un forfait possédant des abonnés.");
  await prisma.plan.delete({ where: { id } });
  revalidatePath('/superadmin/plans');
}

export async function assignPlanAction(storeId: string, planId: string) {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now
  
  await prisma.subscription.upsert({
    where: { storeId },
    create: {
      storeId,
      planId,
      status: 'ACTIVE',
      expiresAt,
    },
    update: {
      planId,
      status: 'ACTIVE',
      expiresAt,
    }
  });
  
  revalidatePath('/');
  revalidatePath('/superadmin/plans');
}

// ══════════════════════════════════════════════════════════════
//  GLOBAL UNITS (SuperAdmin managed)
// ══════════════════════════════════════════════════════════════
export async function getGlobalUnits() {
  return prisma.globalUnit.findMany({ orderBy: { name: 'asc' } });
}

export async function createGlobalUnit(name: string) {
  await prisma.globalUnit.create({ data: { name: name.trim() } });
  revalidatePath('/superadmin/referentiels');
  revalidatePath('/admin/products');
  revalidatePath('/admin/stock');
}

export async function deleteGlobalUnit(id: string) {
  await prisma.globalUnit.delete({ where: { id } });
  revalidatePath('/superadmin/referentiels');
  revalidatePath('/admin/products');
  revalidatePath('/admin/stock');
}

// ══════════════════════════════════════════════════════════════
//  ACTIVITY POLES (SuperAdmin managed)
// ══════════════════════════════════════════════════════════════
export async function createActivityPole(data: { name: string; icon?: string }) {
  await prisma.activityPole.create({ data });
  revalidatePath('/superadmin/referentiels');
}

export async function deleteActivityPole(id: string) {
  await prisma.activityPole.delete({ where: { id } });
  revalidatePath('/superadmin/referentiels');
}

// ══════════════════════════════════════════════════════════════
//  MARKETPLACE CATEGORIES (SuperAdmin managed)
// ══════════════════════════════════════════════════════════════
// Categorires management moved to MarketplaceCategory actions section

// ══════════════════════════════════════════════════════════════
//  PRODUCT CATEGORIES (SuperAdmin managed, used by store products)
// ══════════════════════════════════════════════════════════════
export async function createProductCategoryAction(name: string) {
  const store = await getStore();
  if (!store) throw new Error('Action non autorisée : Aucun magasin trouvé.');

  await prisma.category.create({ 
    data: { 
      name,
      storeId: store.id
    } 
  });
  revalidatePath('/admin/products');
}

export async function deleteProductCategoryAction(id: string) {
  const store = await getStore();
  if (!store) throw new Error('Action non autorisée');

  // Verify ownership
  const cat = await prisma.category.findUnique({ where: { id } });
  if (cat?.storeId !== store.id) throw new Error('Non autorisé');

  await prisma.category.delete({ where: { id } });
  revalidatePath('/admin/products');
}

// ══════════════════════════════════════════════════════════════
//  STAFF PIN & SESSIONS
// ══════════════════════════════════════════════════════════════
export async function updateStaffPinAction(userId: string, pinCode: string | null) {
  await prisma.user.update({
    where: { id: userId },
    data: { pinCode }
  });
  revalidatePath('/admin/staff');
}

export async function getStaffSessionLogs(userId: string) {
  return prisma.staffSessionLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
}

export async function logStaffSessionAction(userId: string, storeId: string, action: 'LOGIN' | 'LOGOUT') {
  await prisma.staffSessionLog.create({
    data: { userId, storeId, action }
  });
}

// ══════════════════════════════════════════════════════════════
//  TABLE MANAGEMENT
// ══════════════════════════════════════════════════════════════
export async function createTableAction(data: { label: string; capacity: number }) {
  const store = await getStore();
  if (!store) return;
  await prisma.storeTable.create({
    data: {
      ...data,
      storeId: store.id
    }
  });
  revalidatePath('/admin/tables');
  revalidatePath('/pos');
}

export async function updateTableAction(id: string, data: { label: string; capacity: number }) {
  await prisma.storeTable.update({
    where: { id },
    data
  });
  revalidatePath('/admin/tables');
  revalidatePath('/pos');
}

export async function deleteTableAction(id: string) {
  await prisma.storeTable.delete({ where: { id } });
  revalidatePath('/admin/tables');
  revalidatePath('/pos');
}

// ══════════════════════════════════════════════════════════════
//  EXPENSES MANAGEMENT
// ══════════════════════════════════════════════════════════════
export async function getExpensesAction() {
  const store = await getStore();
  if (!store) return [];
  try {
    return await (prisma.expense as any).findMany({
      where: { storeId: store.id },
      orderBy: { date: 'desc' }
    });
  } catch (err: any) {
    // If client is stale, it might not even know about the Expense model
    return await prisma.$queryRawUnsafe(
      `SELECT * FROM "Expense" WHERE "storeId" = $1 ORDER BY date DESC`,
      store.id
    );
  }
}

export async function createExpenseAction(data: { category: string; amount: number; description?: string; date: string }) {
  const store = await getStore();
  if (!store) return;
  
  try {
    await (prisma.expense as any).create({
      data: {
        category: data.category,
        amount: Number(data.amount),
        description: data.description,
        date: new Date(data.date),
        storeId: store.id
      }
    });
  } catch (err: any) {
    if (err.message.includes('Unknown argument') || err.message.includes('Null constraint')) {
      // Fallback to raw SQL if Prisma client is stale
      const id = Math.random().toString(36).substring(2, 11);
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Expense" (id, category, amount, description, date, "storeId", "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        id,
        data.category,
        Number(data.amount),
        data.description || null,
        new Date(data.date),
        store.id
      );
    } else {
      throw err;
    }
  }
  revalidatePath('/admin/expenses');
}

export async function deleteExpenseAction(id: string) {
  await prisma.expense.delete({ where: { id } });
  revalidatePath('/admin/expenses');
}

// ══════════════════════════════════════════════════════════════
//  TERMINALS & TABLETS
// ══════════════════════════════════════════════════════════════
export async function getTerminalsAction() {
  const store = await getStore();
  if (!store) return [];
  try {
    return await (prisma.posTerminal as any).findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' }
    });
  } catch (e) {
    return await prisma.$queryRawUnsafe(
      `SELECT * FROM "PosTerminal" WHERE "storeId" = $1 ORDER BY "createdAt" DESC`,
      store.id
    );
  }
}

export async function createTerminalAction(nickname: string) {
  const store = await getStore();
  if (!store) return;
  try {
     await (prisma.posTerminal as any).create({
      data: {
        nickname,
        storeId: store.id,
        status: 'INACTIVE'
      }
    });
  } catch (e) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PosTerminal" (id, nickname, "storeId", status, "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      Math.random().toString(36).substring(7),
      nickname,
      store.id
    );
  }
  revalidatePath('/admin/terminals');
}

export async function generateTerminalCodeAction(id: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  try {
    await (prisma.posTerminal as any).update({
      where: { id },
      data: { activationCode: code }
    });
  } catch (e) {
    await prisma.$executeRawUnsafe(
      `UPDATE "PosTerminal" SET "activationCode" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`,
      code,
      id
    );
  }
  revalidatePath('/admin/terminals');
  return code;
}

export async function deleteTerminalAction(id: string) {
  try {
     await (prisma as any).posTerminal.delete({ where: { id } });
  } catch (e) {
     await prisma.$executeRawUnsafe(`DELETE FROM "PosTerminal" WHERE id = $1`, id);
  }
  revalidatePath('/admin/terminals');
}
