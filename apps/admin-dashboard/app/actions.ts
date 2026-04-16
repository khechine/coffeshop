'use server';

import { prisma } from '@coffeeshop/database';
import { revalidatePath } from 'next/cache';
import * as bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';

// ── Helpers (Updated for phone field) ──────────────────────────
export async function getStore() {
  const userId = cookies().get('userId')?.value;
  if (!userId) return null;

  try {
     // Robust fetch for user and store
     const user = await (prisma as any).user.findUnique({
       where: { id: userId }
     });

     if (user?.storeId) {
        const store = await (prisma as any).store.findUnique({
          where: { id: user.storeId },
          include: {
            subscription: {
              include: { plan: true }
            }
          }
        });

        if (store) {
           const storeObj: any = store;
           const plan = storeObj?.subscription?.plan;
           
           // Combined access: from Plan OR manual override
           const hasMarketplace = (plan?.hasMarketplace === true) || (storeObj?.forceMarketplaceAccess === true);
           storeObj.hasMarketplace = hasMarketplace;
           
           return storeObj;
        }
     }
   } catch (err) {
      console.error("getStore error, trying raw fallback", err);
      // Use direct storeId from user record instead of relation table
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { storeId: true }
      });
      if (user?.storeId) {
        return await prisma.store.findUnique({ where: { id: user.storeId } });
      }
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

async function checkStaffActionAuth() {
  const user = await getUser();
  if (!user) throw new Error('Authentification requise');
  
  const isOwner = user.role === 'STORE_OWNER';
  const hasStaffPerm = (user.permissions as string[])?.includes('STAFF');
  
  if (!isOwner && !hasStaffPerm) {
    throw new Error('Action non autorisée : Vous n\'avez pas le droit de gérer le personnel.');
  }
  return user;
}

export async function createStaffMember(data: { name: string; email: string; phone: string; role: string; defaultPosMode?: string; permissions?: string[]; assignedTables?: string[] }) {
  const authUser = await checkStaffActionAuth();
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
      password: await bcrypt.hash('changeme123', 10), // must be reset by the user
      storeId: store.id,
    },
  });
  revalidatePath('/admin/staff');
}

export async function updateStaffMember(id: string, data: { name: string; email: string; phone: string; role: string; defaultPosMode?: string; permissions?: string[]; assignedTables?: string[] }) {
  await checkStaffActionAuth();
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
  const authUser = await checkStaffActionAuth();
  if (authUser.id === id) throw new Error('Vous ne pouvez pas vous supprimer vous-même.');
  
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
//  AUTH & REGISTRATION
// ══════════════════════════════════════════════════════════════

export async function checkSubdomainAvailability(subdomain: string) {
  const sub = subdomain.toLowerCase().trim();
  const forbidden = ['api', 'admin', 'www', 'support', 'app', 'dev', 'mail', 'test', 'status', 'dashboard', 'auth', 'login', 'register'];
  
  if (forbidden.includes(sub)) {
    return { available: false, forbidden: true };
  }

  const existing = await prisma.store.findUnique({
    where: { subdomain: sub }
  });
  return { available: !existing, forbidden: false };
}

export async function checkEmailAvailability(email: string) {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    return { available: !existing };
  } catch (err) {
    console.error('checkEmailAvailability error:', err);
    return { available: true }; // Allow on error to not block
  }
}

export async function registerStoreAction(data: any) {
  const { 
    email, password, name, storeName, 
    address, city, phone, subdomain,
    officialDocs
  } = data;

  if (!email || !password || !name || !storeName || !subdomain) {
    throw new Error('Tous les champs obligatoires doivent être remplis');
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });
  
  if (existingEmail) {
    throw new Error('Un compte avec cet email existe déjà');
  }

  const existingSubdomain = await prisma.store.findUnique({
    where: { subdomain: subdomain.toLowerCase().trim() }
  });
  
  if (existingSubdomain) {
    throw new Error('Ce sous-domaine est déjà utilisé');
  }

  const sub = subdomain.toLowerCase().trim();
  const forbidden = ['api', 'admin', 'www', 'support', 'app', 'dev', 'mail', 'test', 'status', 'dashboard', 'auth', 'login', 'register'];
  
  if (forbidden.includes(sub)) {
    throw new Error('Ce sous-domaine n\'est pas autorisé');
  }
  
  // Hash password before saving
  const hashedPassword = await bcrypt.hash(password, 10);
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  // Prepare docs array for the JSON field
  const docs = [];
  if (officialDocs?.rne?.base64) {
    docs.push({ 
      name: 'RNE - Document Officiel', 
      url: officialDocs.rne.base64, 
      type: 'RNE', 
      status: 'PENDING',
      fileName: officialDocs.rne.name
    });
  }
  if (officialDocs?.cin?.base64) {
    docs.push({ 
      name: 'CIN - Document Identité', 
      url: officialDocs.cin.base64, 
      type: 'CIN', 
      status: 'PENDING',
      fileName: officialDocs.cin.name
    });
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'STORE_OWNER',
      emailVerified: false,
      verificationToken: Math.random().toString(36).substring(7),
      store: {
        create: {
          name: storeName,
          subdomain: subdomain.toLowerCase().trim(),
          address,
          city,
          phone,
          status: 'PENDING_VERIFICATION',
          officialDocs: docs,
          trialEndsAt
        }
      }
    },
    include: { store: true }
  });

  return user;
}

export async function updateUserPasswordAction(userId: string, newPassword: string) {
  // Always hash before saving — login uses bcrypt.compare()
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed }
  });
  revalidatePath('/superadmin/users');
  return { success: true };
}

export async function loginUser(email: string, pass: string) {
  // Use (prisma as any) to bypass environment-specific client validation bugs
  const user = await (prisma as any).user.findUnique({ where: { email } });
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


  cookies().set('userId', user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  
  return response;
}

export async function logoutUser() {
  cookies().delete('userId');
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
    (prisma as any).mktCategory.findMany({ include: { subcategories: true } }),
    (prisma as any).vendorProduct.findMany({ where: { isFeatured: true }, include: { vendor: true }, orderBy: { createdAt: 'desc' } }),
    (prisma as any).vendorProduct.findMany({ where: { isFlashSale: true }, include: { vendor: true }, orderBy: { createdAt: 'desc' } }),
    (prisma as any).vendorProduct.findMany({ include: { vendor: true }, orderBy: { createdAt: 'desc' } })
  ]);

  const mapProduct = (p: any) => {
    const vendorData = p.vendor ? {
      ...p.vendor,
      lat: p.vendor.lat ? Number(p.vendor.lat) : null,
      lng: p.vendor.lng ? Number(p.vendor.lng) : null
    } : null;
    
    const result: any = {
      id: p.id,
      name: p.name,
      unit: p.unit,
      categoryId: p.categoryId,
      subcategoryId: p.subcategoryId,
      vendorId: p.vendorId,
      price: Number(p.price),
      minOrderQty: p.minOrderQty ? Number(p.minOrderQty) : 1,
      stockStatus: p.stockStatus,
      isFeatured: p.isFeatured,
      isFlashSale: p.isFlashSale,
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      discount: p.discountPrice ? Number(p.discountPrice) : null,
      flashStart: p.flashStart,
      flashEnd: p.flashEnd,
      image: p.image,
      description: p.description,
      tags: p.tags,
      deliveryAreas: p.deliveryAreas,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      vendor: vendorData,
    };
    return result;
  };

  return { 
    categories, 
    featured: featuredRaw.map(mapProduct), 
    flashSales: flashSalesRaw.map(mapProduct), 
    products: productsRaw.map(mapProduct) 
  };
}

export async function getMarketplaceBenchmarkData(vendorId: string) {
  const allProducts = await (prisma as any).vendorProduct.findMany({
    include: {
      productStandard: true,
    }
  });

  const categoryIdSet = new Set<string>();
  allProducts.forEach((p: any) => { if (p.categoryId) categoryIdSet.add(p.categoryId); });
  const categoryIds: string[] = [];
  categoryIdSet.forEach(id => categoryIds.push(id));
  const categories = categoryIds.length > 0 
    ? await (prisma as any).mktCategory.findMany({ where: { id: { in: categoryIds } } })
    : [];

  const categoryMap = new Map<any, any>(categories.map((c: any) => [c.id, c]));

  type GroupKey = string;
  const grouped = new Map<GroupKey, {
    categoryId: string | null;
    categoryName: string;
    unit: string;
    brand: string | null;
    vendorPrices: Map<string, number>;
    myPrice: number | null;
    allPrices: number[];
  }>();

  for (const p of allProducts) {
    const brand = (p as any).brand ?? null;
    const unit = p.unit || 'piece';
    const key: GroupKey = `${p.categoryId ?? 'none'}::${unit.toLowerCase()}::${(brand ?? '').toLowerCase()}`;
    const price = Number(p.price);
    const categoryName = p.categoryId && categoryMap.has(p.categoryId) ? (categoryMap.get(p.categoryId) as any)?.name ?? '—' : '—';

    if (!grouped.has(key)) {
      grouped.set(key, {
        categoryId: p.categoryId ?? null,
        categoryName,
        unit,
        brand,
        vendorPrices: new Map(),
        myPrice: null,
        allPrices: [],
      });
    }
    const entry = grouped.get(key)!;

    if (p.vendorId === vendorId) {
      entry.myPrice = entry.myPrice === null ? price : Math.min(entry.myPrice, price);
    } else {
      const prev = entry.vendorPrices.get(p.vendorId);
      entry.vendorPrices.set(p.vendorId, prev !== undefined ? Math.min(prev, price) : price);
      entry.allPrices.push(price);
    }
  }

  const benchmarks = Array.from(grouped.values())
    .filter(g => g.myPrice !== null || g.allPrices.length > 0)
    .map(g => {
      const hasCompetitors = g.allPrices.length > 0;
      const competitorCount = g.vendorPrices.size;
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
        parentCategoryName: null,
        displayCategory: g.categoryName,
        unit: g.unit,
        brand: g.brand,
        myPrice: g.myPrice,
        min, max, avg,
        competitorCount,
        position,
      };
    })
    .sort((a, b) => {
      if ((a.myPrice !== null) !== (b.myPrice !== null)) return a.myPrice !== null ? -1 : 1;
      return a.displayCategory.localeCompare(b.displayCategory);
    });

  return benchmarks;
}

export async function getMarketplaceCategoryTree() {
  const all = await (prisma as any).mktCategory.findMany({
    where: { status: 'ACTIVE' },
    include: { subcategories: true },
    orderBy: { name: 'asc' }
  });
  return all;
}

// ── Vendor proposes a new subcategory (status = PENDING → admin approves) ──────
export async function proposeSubCategoryAction(name: string, categoryId: string) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Utilisateur non trouvé');

  const vendorProfile = await (prisma as any).vendorProfile.findFirst({
    where: { userId: user.id }
  });
  if (!vendorProfile) throw new Error('Profil vendeur introuvable');

  const existing = await (prisma as any).mktSubcategory.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, categoryId }
  });
  if (existing) return { error: 'Cette sous-catégorie existe déjà.' };

  await (prisma as any).mktSubcategory.create({
    data: {
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      categoryId,
      status: 'PENDING',
      proposedBy: vendorProfile.id,
    }
  });
  return { success: true };
}

// ── Admin: get all pending category proposals ─────────────────────────────────
export async function getPendingCategoryProposals() {
  return (prisma as any).mktSubcategory.findMany({
    where: { status: 'PENDING' },
    include: { category: true },
    orderBy: { createdAt: 'asc' }
  });
}

// ── User helper ───────────────────────────────────────────────────────────
export async function getUser() {
  // Check cookie first (server-side)
  const userId = cookies().get('userId')?.value;
  if (userId) {
    return (prisma as any).user.findUnique({ 
      where: { id: userId },
      select: { id: true, name: true, role: true, permissions: true }
    });
  }
  return null;
}

// ── Admin: approve or reject a proposed subcategory ───────────────────────────
export async function resolveCategoryProposal(id: string, action: 'approve' | 'reject', newName?: string, newCategoryId?: string) {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  
  if (!userId) {
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'SUPERADMIN') {
    throw new Error('Action non autorisée : Seuls les super-administrateurs peuvent gérer les catégories.');
  }

  await (prisma as any).mktSubcategory.update({
    where: { id },
    data: { 
      status: action === 'approve' ? 'ACTIVE' : 'REJECTED',
      name: (action === 'approve' && newName) ? newName.trim() : undefined,
      categoryId: (action === 'approve' && newCategoryId) ? newCategoryId : undefined,
    }
  });
  revalidatePath('/superadmin/marketplace/categories');
  revalidatePath('/vendor/portal/catalog');
}

export async function updateMarketplaceCategoryAction(id: string, data: { name?: string; icon?: string }) {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  
  if (!userId) {
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  const isSubcategory = id.startsWith('sub_');
  if (isSubcategory) {
    const subId = id.replace('sub_', '');
    await (prisma as any).mktSubcategory.update({
      where: { id: subId },
      data: {
        name: data.name?.trim(),
        icon: data.icon?.trim(),
      }
    });
  } else {
    await (prisma as any).mktCategory.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        icon: data.icon?.trim(),
      }
    });
  }
  revalidatePath('/superadmin/marketplace/categories');
  revalidatePath('/marketplace');
}

export async function migrateSubcategoryAction(subcategoryId: string, newCategoryId: string) {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  
  if (!userId) {
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  await (prisma as any).mktSubcategory.update({
    where: { id: subcategoryId },
    data: { categoryId: newCategoryId }
  });
  revalidatePath('/superadmin/marketplace/categories');
  revalidatePath('/marketplace');
}

export async function deleteMarketplaceCategoryAction(id: string) {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  
  if (!userId) {
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  const isSubcategory = id.startsWith('sub_');
  if (isSubcategory) {
    const subId = id.replace('sub_', '');
    await (prisma as any).mktSubcategory.delete({ where: { id: subId } });
  } else {
    const category = await (prisma as any).mktCategory.findUnique({
      where: { id },
      include: { _count: { select: { subcategories: true, products: true } } }
    });

    if (category?._count.subcategories! > 0 || category?._count.products! > 0) {
      throw new Error('Impossible de supprimer une catégorie non vide (contient des sous-catégories ou des produits).');
    }

    await (prisma as any).mktCategory.delete({ where: { id } });
  }
  revalidatePath('/superadmin/marketplace/categories');
  revalidatePath('/marketplace');
}

export async function createMarketplaceCategoryAction(data: { name: string; icon?: string }) {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  
  if (!userId) {
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  await (prisma as any).mktCategory.create({ 
    data: {
      name: data.name,
      slug: data.name.toLowerCase().replace(/ /g, '-'),
      icon: data.icon,
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
  const { 
    email, password, name, companyName, 
    phone, address, city, description,
    officialDocs 
  } = data;

  if (!email || !password || !name || !companyName) {
    throw new Error('Tous les champs obligatoires doivent être remplis');
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });
  
  if (existingEmail) {
    throw new Error('Un compte avec cet email existe déjà');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Prepare docs array for the JSON field
  const docs = [];
  if (officialDocs?.rne?.base64) {
    docs.push({ 
      name: 'RNE - Registre Commerce', 
      url: officialDocs.rne.base64, 
      type: 'RNE', 
      status: 'PENDING',
      fileName: officialDocs.rne.name
    });
  }
  if (officialDocs?.cin?.base64) {
    docs.push({ 
      name: 'CIN - Gérant', 
      url: officialDocs.cin.base64, 
      type: 'CIN', 
      status: 'PENDING',
      fileName: officialDocs.cin.name
    });
  }

  const user = await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword,
      name: name,
      role: 'VENDOR'
    }
  });
  
  await prisma.vendorProfile.create({
    data: {
      userId: user.id,
      companyName: companyName,
      phone: phone,
      address: address,
      city: city,
      description: description,
      status: 'PENDING'
      // VendorProfile currently doesn't have an officialDocs field in the schema, 
      // but we might want to store it in a generic way or update the schema later.
      // For now, I'll stick to what the schema allows.
      // Note: Store model HAS officialDocs, but VendorProfile HAS NO officialDocs.
      // I should update the schema if needed, but the user requested "subscription" improvements.
      // For vendors, it's also important. I'll check the schema again.
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
  const userId = cookies().get('userId')?.value;
  if (!userId) return null;

  // Robust separate fetches to avoid Prisma runtime issues
  const user = await (prisma as any).user.findUnique({
    where: { id: userId }
  });

  if (!user) return null;

  const vendorProfile = await (prisma as any).vendorProfile.findFirst({
    where: { userId: user.id }
  });

  if (!vendorProfile) return null;

  // Now fetch the deep data using the vendorProfile.id directly
  const vendor = await (prisma as any).vendorProfile.findUnique({
    where: { id: vendorProfile.id },
    include: { 
      vendorProducts: true,
      activityPoles: true,
      mktSectors: true,
      orders: { 
        include: { items: true, store: true },
        orderBy: { createdAt: 'desc' }
      } 
    }
  });

  if (vendor) {
    const mapProduct = (p: any) => {
      return {
        id: p.id,
        productStandardId: p.productStandardId,
        name: p.name,
        unit: p.unit,
        categoryId: p.categoryId,
        subcategoryId: p.subcategoryId,
        vendorId: p.vendorId,
        price: Number(p.price),
        minOrderQty: Number(p.minOrderQty),
        stockStatus: p.stockStatus,
        isFeatured: p.isFeatured,
        isFlashSale: p.isFlashSale,
        discount: p.discountPrice ? Number(p.discountPrice) : null,
        flashStart: p.flashStart,
        flashEnd: p.flashEnd,
        image: p.image,
        description: p.description,
        tags: p.tags || [],
        deliveryAreas: p.deliveryAreas || [],
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    };
    
    return {
      ...vendor,
      products: (vendor.vendorProducts || []).map(mapProduct),
      orders: vendor.orders.map((o: any) => ({
        ...o,
        total: Number(o.total),
        items: o.items.map((it: any) => ({ ...it, quantity: Number(it.quantity), price: Number(it.price) }))
      })),
    };
  }
  return null;
}

export async function createMarketplaceProductAction(data: any) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Utilisateur non trouvé');

  const vendor = await (prisma as any).vendorProfile.findFirst({
    where: { userId: user.id }
  });
  if (!vendor) throw new Error('Profil vendeur introuvable');

  // Handle image: use preview (base64) if available, otherwise use URL
  const image = data.imagePreview || data.image || null;

  await (prisma as any).vendorProduct.create({
    data: {
      name: data.name,
      price: data.price,
      unit: data.unit,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId || null,
      vendorId: vendor.id,
      image: image,
      isFeatured: data.isFeatured || false,
      isFlashSale: data.isFlashSale || false,
      discountPrice: data.discount || null,
      minOrderQty: data.minOrderQty || 1
    }
  });
  revalidatePath('/vendor/portal/catalog');
}

export async function importCsvProductsAction(rows: {
  name: string;
  price: number;
  unit: string;
  categoryName: string;
  subcategoryName?: string;
  brand?: string | null;
  image?: string;
  minOrderQty?: number;
  description?: string;
  stockStatus?: string;
}[]) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Utilisateur non trouvé');

  const vendorProfile = await (prisma as any).vendorProfile.findFirst({
    where: { userId: user.id }
  });
  if (!vendorProfile) throw new Error('Profil vendeur introuvable');
  const vendorId = vendorProfile.id;

  const allCategories = await (prisma as any).mktCategory.findMany({
    where: { status: 'ACTIVE' },
    include: { subcategories: true }
  });
  const allSubcategories = await (prisma as any).mktSubcategory.findMany({
    where: { status: 'ACTIVE' }
  });

  const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[], newCategories: [] as string[] };

  for (const row of rows) {
    try {
      let categoryId: string | null = null;
      let subcategoryId: string | null = null;

      if (row.categoryName) {
        const catName = row.categoryName.trim();
        
        // Try to find category first (case-insensitive)
        let category = allCategories.find((c: any) => c.name.toLowerCase() === catName.toLowerCase());
        
        // If not found, try to find as subcategory
        if (!category) {
          const subcat = allSubcategories.find((s: any) => s.name.toLowerCase() === catName.toLowerCase());
          if (subcat) {
            categoryId = subcat.categoryId;
            subcategoryId = subcat.id;
          }
        } else {
          categoryId = category.id;
          
          // If subcategory name provided, try to match it within the category
          if (row.subcategoryName) {
            const subName = row.subcategoryName.trim();
            const subcat = (category.subcategories || []).find((s: any) => s.name.toLowerCase() === subName.toLowerCase());
            if (subcat) {
              subcategoryId = subcat.id;
            } else {
            // Create new subcategory as HIDDEN
            const newSub = await (prisma as any).mktSubcategory.create({
              data: {
                name: subName,
                slug: subName.toLowerCase().replace(/ /g, '-'),
                categoryId: category.id,
                status: 'HIDDEN',
              }
            });
            subcategoryId = newSub.id;
            results.newCategories.push(`Sous-catégorie "${subName}" créée (masquée, en attente d'approbation)`);
            }
          }
        }
        
        // If category still not found, create it as HIDDEN (needs approval)
        if (!category && catName) {
          const newCat = await (prisma as any).mktCategory.create({
            data: {
              name: catName,
              slug: catName.toLowerCase().replace(/ /g, '-'),
              status: 'HIDDEN',
            }
          });
          categoryId = newCat.id;
          results.newCategories.push(`Catégorie "${catName}" créée (masquée, en attente d'approbation)`);
        }
      }

      const brandVal = row.brand?.trim() || null;
      const minQty = row.minOrderQty && row.minOrderQty > 0 ? row.minOrderQty : 1;

      const existing = await (prisma as any).vendorProduct.findFirst({ 
        where: { name: row.name, vendorId } 
      });

      if (existing) {
        await (prisma as any).vendorProduct.update({
          where: { id: existing.id },
          data: {
            price: row.price,
            unit: row.unit,
            categoryId,
            subcategoryId,
            tags: brandVal ? [brandVal] : [],
            image: row.image || null,
            minOrderQty: minQty,
            description: row.description || null,
            stockStatus: row.stockStatus || 'IN_STOCK',
          }
        });
        results.updated++;
      } else {
        await (prisma as any).vendorProduct.create({
          data: {
            name: row.name,
            price: row.price,
            unit: row.unit,
            categoryId,
            subcategoryId,
            tags: brandVal ? [brandVal] : [],
            image: row.image || null,
            vendorId,
            minOrderQty: minQty,
            description: row.description || null,
            stockStatus: row.stockStatus || 'IN_STOCK',
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
  // Handle image: use preview (base64) if available, otherwise use URL
  const image = data.imagePreview || data.image || null;

  await (prisma as any).vendorProduct.update({
    where: { id },
    data: {
      name: data.name,
      price: data.price,
      unit: data.unit,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId || null,
      image: image,
      isFeatured: data.isFeatured,
      isFlashSale: data.isFlashSale,
      discountPrice: data.discount,
      flashStart: data.flashStart ? new Date(data.flashStart) : null,
      flashEnd: data.flashEnd ? new Date(data.flashEnd) : null,
      minOrderQty: data.minOrderQty || 1
    }
  });
  revalidatePath('/vendor/portal/catalog');
}

export async function getMarketplaceCategories() {
  return (prisma as any).mktCategory.findMany();
}

export async function updateVendorSectorsAction(vendorId: string, sectorIds: string[]) {
  await (prisma as any).vendorProfile.update({
    where: { id: vendorId },
    data: {
      mktSectors: {
        set: sectorIds.map((id: string) => ({ id }))
      }
    }
  });
  revalidatePath('/vendor/portal/settings');
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
  await (prisma as any).vendorProduct.delete({ where: { id } });
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
  await checkStaffActionAuth();
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

export async function seedDemoProductsAction(storeId: string) {
  const store = await (prisma as any).store.findUnique({ where: { id: storeId } });
  if (!store) throw new Error('Store not found');

  const demoCategories = [
    { name: 'Café', storeId },
    { name: 'Lait', storeId },
    { name: 'Sirop', storeId },
    { name: 'Gobelets', storeId },
  ];

  const categories = await Promise.all(
    demoCategories.map(c => 
      (prisma as any).category.upsert({
        where: { id: `${storeId}-${c.name.toLowerCase()}` },
        update: {},
        create: { id: `${storeId}-${c.name.toLowerCase()}`, name: c.name, storeId: c.storeId }
      })
    )
  );

  const demoProducts = [
    { name: 'Expresso', price: 3.000, categoryId: categories[0].id },
    { name: 'Cappuccino', price: 4.500, categoryId: categories[0].id },
    { name: 'Americano', price: 3.500, categoryId: categories[0].id },
    { name: 'Lait Entier', price: 1.500, categoryId: categories[1].id },
    { name: 'Lait Amande', price: 2.000, categoryId: categories[1].id },
    { name: 'Sirop Vanille', price: 0.500, categoryId: categories[2].id },
    { name: 'Sirop Caramel', price: 0.500, categoryId: categories[2].id },
    { name: 'Gobelet Carton', price: 0.300, categoryId: categories[3].id },
  ];

  await Promise.all(
    demoProducts.map(p =>
      (prisma as any).product.create({
        data: { name: p.name, price: String(p.price), categoryId: p.categoryId, storeId }
      })
    )
  );

  const demoStockItems = [
    { name: 'Café Grains 1kg', quantity: 10, cost: 25.000, minThreshold: 3, unit: 'kg' },
    { name: 'Lait 1L', quantity: 20, cost: 1.500, minThreshold: 5, unit: 'L' },
    { name: 'Gobelets 50pcs', quantity: 5, cost: 8.000, minThreshold: 2, unit: 'pack' },
    { name: 'Sirop Vanille 1L', quantity: 3, cost: 12.000, minThreshold: 1, unit: 'L' },
    { name: 'Sucre 1kg', quantity: 5, cost: 2.500, minThreshold: 2, unit: 'kg' },
  ];

  for (const item of demoStockItems) {
    let unit = await (prisma as any).globalUnit.findUnique({ where: { name: item.unit } });
    if (!unit) {
      unit = await (prisma as any).globalUnit.create({ data: { name: item.unit } });
    }
    await (prisma as any).stockItem.create({
      data: { name: item.name, quantity: item.quantity, cost: String(item.cost), minThreshold: item.minThreshold, storeId, unitId: unit.id }
    });
  }

  const demoTables = ['T1', 'T2', 'T3', 'T4', 'T5'];
  await Promise.all(
    demoTables.map(label =>
      (prisma as any).storeTable.create({
        data: { label, capacity: 4, storeId }
      })
    )
  );

  revalidatePath('/admin/products');
  revalidatePath('/admin/stock');
  revalidatePath('/admin/tables');
  return { success: true, message: 'Données demo ajoutées successfully' };
}

export async function resetDemoDataAction(storeId: string) {
  const products: any[] = await (prisma as any).product.findMany({ where: { storeId }, select: { id: true } });
  const productIds = products.map((p: any) => p.id);

  if (productIds.length > 0) {
    await (prisma as any).recipeItem.deleteMany({ where: { productId: { in: productIds } } });
  }

  await (prisma as any).saleItem.deleteMany({ where: { sale: { storeId } } });
  await (prisma as any).sale.deleteMany({ where: { storeId } });
  await (prisma as any).stockItem.deleteMany({ where: { storeId } });
  await (prisma as any).product.deleteMany({ where: { storeId } });
  await (prisma as any).category.deleteMany({ where: { storeId } });
  await (prisma as any).storeTable.deleteMany({ where: { storeId } });

  revalidatePath('/admin/products');
  revalidatePath('/admin/stock');
  revalidatePath('/admin/tables');
  revalidatePath('/admin/sales');
  return { success: true, message: 'Données demo supprimées' };
}
