'use server';

import { prisma, seedTunisianStarterPack } from '@coffeeshop/database';
import { revalidatePath } from 'next/cache';
import * as bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

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

        // Combined access: from Plan OR manual override (Forced TRUE for all plans as per requirement)
        const hasMarketplace = true; // (plan?.hasMarketplace === true) || (storeObj?.forceMarketplaceAccess === true);
        storeObj.hasMarketplace = hasMarketplace;

        return storeObj;
      }
    }
  } catch (err) {
    console.error("getStore error, trying robust fallback", err);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { storeId: true }
    });

    if (user?.storeId) {
      const store = await prisma.store.findUnique({
        where: { id: user.storeId },
        include: {
          subscription: {
            include: { plan: true }
          }
        }
      });
      if (store) {
        const storeObj: any = store;
        storeObj.hasMarketplace = true; // (storeObj.subscription?.plan?.hasMarketplace === true) || (storeObj.forceMarketplaceAccess === true);
        return storeObj;
      }
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

export async function updateStore(data: { 
  name: string; 
  address: string; 
  city: string; 
  governorate?: string; 
  phone: string; 
  lat?: number; 
  lng?: number;
  loyaltyEarnRate?: number;
  loyaltyRedeemRate?: number;
}) {
  const store = await getStore();
  if (!store) return;
  await (prisma.store as any).update({ where: { id: store.id }, data });
  revalidatePath('/admin/settings');
  revalidatePath('/');
}

export async function toggleFiscalMode(enabled: boolean, pinCode?: string) {
  const store = await getStore();
  if (!store) throw new Error('Store not found');

  // 1. Plan Verification
  const planName = store.subscription?.plan?.name?.toUpperCase();
  if (enabled && planName !== 'PRO' && planName !== 'STARTER') {
    throw new Error(`Le mode fiscal NACEF est réservé aux abonnements STARTER et PRO. Plan actuel : ${planName || 'FREE'}`);
  }

  // 2. Security (Optional PIN check for locking)
  if (!enabled && store.isFiscalEnabled) {
    // If disabling an already active fiscal mode, we might want extra caution
    console.warn(`Store ${store.id} is disabling fiscal mode.`);
  }

  await prisma.store.update({
    where: { id: store.id },
    data: { isFiscalEnabled: enabled }
  });

  // Store setting has been updated. No need to tie a configuration change to a FiscalLog which explicitly requires a valid Sale ID.

  revalidatePath('/admin/settings');
  return { success: true };
}

// ══════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════
export async function createProduct(data: { name: string; price: number; categoryId: string; unitId?: string; taxRate?: number; taxCode?: string; active?: boolean; canBeTakeaway?: boolean; recipe?: { stockItemId: string; quantity: number; consumeType?: string; isPackaging?: boolean }[] }) {
  const store = await getStore();
  if (!store) throw new Error('Store not found');

  await prisma.product.create({
    data: {
      name: data.name,
      price: data.price,
      categoryId: data.categoryId,
      storeId: store.id,
      unitId: data.unitId || undefined,
      taxRate: data.taxRate ?? 0.19,
      taxCode: data.taxCode || undefined,
      active: data.active ?? true,
      canBeTakeaway: data.canBeTakeaway ?? true,
      recipe: data.recipe ? {
        create: data.recipe.map(r => ({
          stockItemId: r.stockItemId,
          quantity: r.quantity,
          consumeType: r.consumeType || 'BOTH',
          isPackaging: r.isPackaging || false
        }))
      } : undefined
    }
  });
  revalidatePath('/admin/products');
}


export async function updateProduct(id: string, data: { name: string; price: number; categoryId: string; unitId?: string; taxRate?: number; taxCode?: string; active?: boolean; canBeTakeaway?: boolean; recipe?: { stockItemId: string; quantity: number; consumeType?: string; isPackaging?: boolean }[] }) {
  await prisma.recipeItem.deleteMany({ where: { productId: id } });
  await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      price: data.price,
      categoryId: data.categoryId,
      unitId: data.unitId || undefined,
      taxRate: data.taxRate ?? 0.19,
      taxCode: data.taxCode || undefined,
      active: data.active ?? true,
      canBeTakeaway: data.canBeTakeaway ?? true,
      recipe: data.recipe ? {
        create: data.recipe.map(r => ({
          stockItemId: r.stockItemId,
          quantity: r.quantity,
          consumeType: r.consumeType || 'BOTH',
          isPackaging: r.isPackaging || false
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
  await prisma.stockItem.create({
    data: {
      ...rest,
      storeId: store.id,
      unitId: unitId || undefined,
      preferredVendorId: preferredVendorId || undefined,
      preferredSupplierId: preferredSupplierId || undefined
    }
  });
  revalidatePath('/admin/stock');
}

export async function updateStockItem(id: string, data: { name: string; unitId?: string; quantity: number; minThreshold: number; cost: number; preferredVendorId?: string; preferredSupplierId?: string }) {
  const { unitId, preferredVendorId, preferredSupplierId, ...rest } = data;
  await prisma.stockItem.update({
    where: { id }, data: {
      ...rest,
      unitId: unitId || undefined,
      preferredVendorId: preferredVendorId || undefined,
      preferredSupplierId: preferredSupplierId || undefined
    }
  });
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
// ── Customer Management (CRM) ───────────────────────────────
export async function searchCustomers(query: string) {
  const store = await getStore();
  if (!store) return [];

  return await prisma.customer.findMany({
    where: {
      storeId: store.id,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } }
      ]
    },
    take: 10,
    orderBy: { loyaltyPoints: 'desc' }
  });
}

export async function createCustomer(data: { name: string; phone: string; email?: string }) {
  try {
    const store = await getStore();
    if (!store) throw new Error('Store not found');

    // Basic validation
    if (!data.name || !data.phone) throw new Error('Nom et téléphone requis');

    const existing = await prisma.customer.findFirst({
      where: { phone: data.phone, storeId: store.id }
    });

    if (existing) {
      throw new Error('DUPLICATE_PHONE');
    }

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        storeId: store.id
      }
    });

    return JSON.parse(JSON.stringify(customer));
  } catch (error: any) {
    console.error('[createCustomer Error]:', error);
    throw new Error(error.message || 'Erreur lors de la création du client');
  }
}

export async function updateCustomerPoints(customerId: string, points: number) {
  return await prisma.customer.update({
    where: { id: customerId },
    data: { loyaltyPoints: points }
  });
}

export async function updateStoreLoyaltyRates(earnRate: number, redeemRate: number) {
  const store = await getStore();
  if (!store) throw new Error('Store not found');

  return await prisma.store.update({
    where: { id: store.id },
    data: {
      loyaltyEarnRate: earnRate,
      loyaltyRedeemRate: redeemRate
    }
  });
}

export async function recordSale(data: {
  total: number;
  subtotal?: number;
  discount?: number;
  paymentMethod?: string;
  paymentDetails?: any;
  items: { productId: string; quantity: number; price: number; consumeType?: string }[];
  tableName?: string;
  baristaId?: string;
  takenById?: string;
  customerId?: string;
  change?: number;
  consumeType?: string; // DINE_IN | TAKEAWAY
  terminalId?: string;
}) {
  const store = await getStore();
  if (!store) throw new Error('Store not found');

  try {
    const sale = await prisma.$transaction(async (tx) => {
    // ── NACEF Compliance Logic ──────────────────────────────────
    let isFiscal = false;
    let fiscalNumber = null;
    let hash = null;
    let previousHash = null;
    let signature = null;
    let terminalId = data.terminalId;
    let finalSequenceNumber: number | null = null;

    if (store.isFiscalEnabled) {
      // 1. Plan Verification (Solo available on PRO, STARTER & RACHMA in production)
      const planName = store.subscription?.plan?.name?.toUpperCase();
      const validPlans = ['PRO', 'STARTER', 'RACHMA'];
      if (!validPlans.includes(planName || '')) {
        throw new Error(`Le mode fiscal NACEF nécessite un abonnement STARTER ou PRO. Votre plan actuel est : ${planName || 'FREE'}.`);
      }

      // 2. Terminal Verification
      if (!terminalId) {
        throw new Error('Un ID de terminal est obligatoire pour enregistrer une vente fiscale (NACEF).');
      }
      const terminal = await tx.posTerminal.findUnique({
        where: { id: terminalId, storeId: store.id }
      });
      if (!terminal) {
        throw new Error('Terminal non valide ou non associé à cette boutique.');
      }

      isFiscal = true;
      const currentYear = new Date().getFullYear();

      // 3. Increment atomic sequence for fiscal number
      const updatedStore = await (tx as any).store.update({
        where: { id: store.id },
        data: { currentFiscalSequence: { increment: 1 } }
      });
      finalSequenceNumber = updatedStore.currentFiscalSequence;
      if (finalSequenceNumber !== null) {
        fiscalNumber = `FAC-${currentYear}-${finalSequenceNumber.toString().padStart(6, '0')}`;
      }

      // 4. Get previous hash for chaining
      const lastSale = await tx.sale.findFirst({
        where: { storeId: store.id, isFiscal: true },
        orderBy: { createdAt: 'desc' }
      });
      previousHash = lastSale?.hash || '0'.repeat(64);
    }

    // ── Pre-calculate Fiscal Totals ──────────────────────────────
    let totalHtGlobal = 0;
    let totalTaxGlobal = 0;
    const taxBreakdown: Record<string, number> = {};
    const now = new Date();

    const itemsWithTax = await Promise.all(data.items.map(async (item) => {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { taxRate: true }
      });
      const taxRate = Number(product?.taxRate || 0.19);
      const unitPriceHt = item.price / (1 + taxRate);
      const itemTotalHt = unitPriceHt * item.quantity;
      const itemTaxAmount = itemTotalHt * taxRate;

      totalHtGlobal += itemTotalHt;
      totalTaxGlobal += itemTaxAmount;

      const rateLabel = `${Math.round(taxRate * 100)}%`;
      taxBreakdown[rateLabel] = (taxBreakdown[rateLabel] || 0) + itemTaxAmount;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        unitPriceHt: Math.round(unitPriceHt * 1000) / 1000,
        taxRate: taxRate,
        taxAmount: Math.round(itemTaxAmount * 1000) / 1000,
        totalHt: Math.round(itemTotalHt * 1000) / 1000,
        totalTtc: Math.round((itemTotalHt + itemTaxAmount) * 1000) / 1000,
      };
    }));

    // Generate SHA-256 Hash (Chain)
    let hashInputS = null;
    if (isFiscal) {
      hashInputS = `${fiscalNumber}|${data.total}|${now.toISOString()}|${previousHash}`;
      hash = crypto.createHash('sha256').update(hashInputS).digest('hex');

      // Signature HMAC (Security)
      const secret = process.env.FISCAL_SECRET || 'nacef-default-secret-2026';
      signature = crypto.createHmac('sha256', secret).update(hash).digest('hex');
    }

    const fiscalDay = now.toISOString().split('T')[0]; // "2026-04-18"
    const sequenceNumber = isFiscal ? finalSequenceNumber : null;

    const s = await (tx.sale as any).create({
      data: {
        total: data.total,
        subtotal: data.subtotal || data.total,
        discount: data.discount || 0,
        paymentMethod: data.paymentMethod || 'CASH',
        paymentDetails: data.paymentDetails || {},
        storeId: store.id,
        tableName: data.tableName,
        baristaId: data.baristaId,
        takenById: data.takenById || data.baristaId,
        customerId: data.customerId,
        consumeType: data.consumeType || 'DINE_IN',
        isFiscal,
        fiscalNumber,
        sequenceNumber,
        fiscalDay,
        terminalId,
        hash,
        previousHash,
        hashInput: hashInputS,
        signature,
        isVoid: false,
        totalHt: Math.round(totalHtGlobal * 1000) / 1000,
        totalTax: Math.round(totalTaxGlobal * 1000) / 1000,
        taxBreakdown: taxBreakdown,
        change: (isNaN(data.change || 0)) ? 0 : data.change,
        appVersion: '1.0.0',
        createdAt: now,
        items: {
          create: itemsWithTax
        }
      },
      include: {
        items: { include: { product: true } },
        takenBy: true
      }
    });

    // Update active cash session if exists
    if (data.baristaId) {
      await (tx as any).cashSession.updateMany({
        where: { storeId: store.id, baristaId: data.baristaId, status: 'OPEN' },
        data: { totalSales: { increment: data.total } }
      });
    }

    // 2. Fiscal Journaling
    if (isFiscal) {
      await tx.fiscalLog.create({
        data: {
          saleId: s.id,
          action: 'CREATE',
          data: {
            hash: s.hash,
            sequenceNumber: s.sequenceNumber,
            terminalId: s.terminalId,
            timestamp: now.toISOString()
          }
        }
      });
    }

    // 3. Deduct stock based on recipes (with consumeType filter)
    for (const item of data.items) {
      const recipes = await tx.recipeItem.findMany({
        where: { productId: item.productId }
      });

      for (const recipe of recipes) {
        // Filter: only deduct if BOTH or matches sale consumeType (prefer item-level consumeType)
        const itemConsumeType = (item as any).consumeType || s.consumeType;
        const modeMatches = recipe.consumeType === 'BOTH' || recipe.consumeType === itemConsumeType;
        if (!modeMatches) continue;

        const totalToDeduct = Number(recipe.quantity) * item.quantity;
        await tx.stockItem.update({
          where: { id: recipe.stockItemId },
          data: {
            quantity: { decrement: totalToDeduct }
          }
        });
      }
    }

    // 3. Loyalty integration
    if (data.customerId) {
      // 3.A Redeem points
      if (data.paymentDetails?.points > 0) {
        await tx.loyaltyTransaction.create({
          data: {
            customerId: data.customerId,
            saleId: s.id,
            points: -data.paymentDetails.points,
            reason: 'REDEEM',
          }
        });
        await tx.customer.update({
          where: { id: data.customerId },
          data: { loyaltyPoints: { decrement: data.paymentDetails.points } }
        });
      }

      // 3.B Earn points
      const points = Math.floor(data.total);
      if (points > 0) {
        await tx.loyaltyTransaction.create({
          data: {
            customerId: data.customerId,
            saleId: s.id,
            points,
            reason: 'PURCHASE',
          }
        });
        await tx.customer.update({
          where: { id: data.customerId },
          data: { loyaltyPoints: { increment: points } }
        });
      }
    }

    return s;
  });

  revalidatePath('/');
  return sale;
} catch (error: any) {
  console.error('[recordSale Error]:', error);
  throw new Error(error.message || 'Une erreur est survenue lors de l\'enregistrement de la vente.');
}
}

// ══════════════════════════════════════════════════════════════
//  REPORTS & CLOSING (NACEF)
// ══════════════════════════════════════════════════════════════
export async function generateZReport() {
  const store = await getStore();
  if (!store) throw new Error('Store not found');

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // 1. Check if ZReport already exists for today
  const existing = await prisma.zReport.findFirst({
    where: { storeId: store.id, reportDay: today }
  });
  if (existing) throw new Error('Un rapport Z existe déjà pour aujourd\'hui.');

  // 2. Fetch all sales of the day
  const sales = await prisma.sale.findMany({
    where: {
      storeId: store.id,
      isVoid: false,
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    },
    include: { items: true }
  });

  if (sales.length === 0) throw new Error('Aucune vente aujourd\'hui pour générer un rapport Z.');

  // 3. Aggregate totals
  let totalTtc = 0;
  let totalHt = 0;
  let totalTax = 0;
  let taxBreakdown = { "7%": 0, "19%": 0 };

  for (const s of sales) {
    totalTtc += Number(s.total);
    totalHt += Number(s.totalHt || 0);
    totalTax += Number(s.totalTax || 0);

    for (const item of s.items) {
      const rate = Number(item.taxRate || 0);
      if (rate === 0.07) taxBreakdown["7%"] += Number(item.taxAmount || 0);
      else if (rate === 0.19) taxBreakdown["19%"] += Number(item.taxAmount || 0);
    }
  }

  // 4. Create ZReport
  const z = await prisma.zReport.create({
    data: {
      storeId: store.id,
      reportDay: today,
      totalTtc,
      totalHt,
      totalTax,
      taxBreakdown: taxBreakdown as any,
      salesCount: sales.length,
      isClosed: true,
      hashInput: `${today}|${totalTtc}|${sales.length}`,
      hash: crypto.createHash('sha256').update(`${today}|${totalTtc}`).digest('hex')
    }
  });

  revalidatePath('/admin/reports');
  return z;
}

// ══════════════════════════════════════════════════════════════
//  MARKETPLACE
// ══════════════════════════════════════════════════════════════
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

export async function getMarketplaceData(userLat?: number, userLng?: number) {
  const hasWalletModel = !!(prisma as any).vendorWallet;
  let activeVendorIds: Set<string> | null = null;

  if (hasWalletModel) {
    try {
      // 1. Vendors with balance > 0
      const positiveWallets = await (prisma as any).vendorWallet.findMany({
        where: { balance: { gt: 0 } },
        select: { vendorId: true }
      });

      // 2. Vendors with pending deposit in last 72h (Grace Period)
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const graceRequests = await (prisma as any).walletDepositRequest.findMany({
        where: {
          status: 'PENDING',
          createdAt: { gte: threeDaysAgo }
        },
        select: { vendorId: true }
      });

      const ids = [
        ...positiveWallets.map((w: any) => w.vendorId),
        ...graceRequests.map((r: any) => r.vendorId)
      ];
      activeVendorIds = new Set(ids);
    } catch (e) {
      console.error('Marketplace visibility query failed:', e);
    }
  }

  // Fetch average ratings for all vendors
  const ratings = await (prisma as any).vendorRating.groupBy({
    by: ['vendorId'],
    _avg: {
      speedScore: true,
      qualityScore: true,
      reliabilityScore: true,
      deliveryScore: true
    },
    _count: {
      _all: true
    }
  });

  const vendorRatingsMap = new Map<string, any>(
    ratings.map((r: any) => [
      r.vendorId, 
      {
        avgSpeed: r._avg.speedScore || 0,
        avgQuality: r._avg.qualityScore || 0,
        avgReliability: r._avg.reliabilityScore || 0,
        avgDelivery: r._avg.deliveryScore || 0,
        totalReviews: r._count._all,
        overallAvg: (
          (r._avg.speedScore || 0) + 
          (r._avg.qualityScore || 0) + 
          (r._avg.reliabilityScore || 0) + 
          (r._avg.deliveryScore || 0)
        ) / 4
      }
    ])
  );

  const [categories, featuredRaw, flashSalesRaw, productsRaw, bundlesRaw] = await Promise.all([
    (prisma as any).mktCategory.findMany({ include: { subcategories: true } }),
    (prisma as any).vendorProduct.findMany({
      where: { isFeatured: true },
      include: { 
        vendor: { include: { customization: true } }, 
        productStandard: true,
        posStocks: { include: { vendorPos: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    (prisma as any).vendorProduct.findMany({
      where: { isFlashSale: true },
      include: { 
        vendor: true, 
        productStandard: true,
        posStocks: { include: { vendorPos: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    (prisma as any).vendorProduct.findMany({
      include: { 
        vendor: true, 
        productStandard: true,
        posStocks: { include: { vendorPos: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    (prisma as any).mktBundle.findMany({
      where: { isActive: true },
      include: {
        vendor: true,
        items: { include: { vendorProduct: { include: { productStandard: true } } } }
      }
    })
  ]);

  // Filter in memory if we have wallet data, otherwise show all (graceful degradation)
  const filterByWallet = (list: any[]) => {
    if (!activeVendorIds) return list;
    return list.filter(item => activeVendorIds!.has(item.vendorId));
  };


  const mapProduct = (p: any) => {
    const vendorData = p.vendor ? {
      ...p.vendor,
      lat: p.vendor.lat ? Number(p.vendor.lat) : null,
      lng: p.vendor.lng ? Number(p.vendor.lng) : null
    } : null;

    const result: any = {
      id: p.id,
      name: p.name || p.productStandard?.name || 'Produit sans nom',
      unit: p.unit || p.productStandard?.unit || 'unité',
      categoryId: p.categoryId || p.productStandard?.categoryId,
      subcategoryId: p.subcategoryId || p.productStandard?.subcategoryId,
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
      posStocks: p.posStocks || [],
      vendor: vendorData ? {
        ...vendorData,
        ratings: vendorRatingsMap.get(vendorData.id) || null
      } : null,
      distance: (userLat && userLng && vendorData?.lat && vendorData?.lng) 
        ? calculateDistance(userLat, userLng, vendorData.lat, vendorData.lng) 
        : null
    };
    return result;
  };

  const mapBundle = (b: any) => {
    const distance = (userLat && userLng && b.vendor?.lat && b.vendor?.lng)
      ? calculateDistance(userLat, userLng, Number(b.vendor.lat), Number(b.vendor.lng))
      : null;

    return {
      ...b,
      price: Number(b.price),
      distance,
      items: b.items.map((i: any) => ({
        ...i,
        quantity: Number(i.quantity),
        vendorProduct: {
          ...i.vendorProduct,
          price: Number(i.vendorProduct.price)
        }
      }))
    };
  };

  let featured = filterByWallet(featuredRaw).map(mapProduct);
  let flashSales = filterByWallet(flashSalesRaw).map(mapProduct);
  let products = filterByWallet(productsRaw).map(mapProduct);
  let bundles = filterByWallet(bundlesRaw).map(mapBundle);

  // Sorting by distance if user coords are provided
  if (userLat && userLng) {
    const sortByDistance = (a: any, b: any) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    };
    products.sort(sortByDistance);
    bundles.sort(sortByDistance);
    featured.sort(sortByDistance);
  }

  return {
    categories,
    featured,
    flashSales,
    products,
    bundles: bundles.map(b => ({
      ...b,
      vendor: b.vendor ? {
        ...b.vendor,
        ratings: vendorRatingsMap.get(b.vendorId) || null
      } : null
    }))
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
      const min = hasCompetitors ? Math.min(...g.allPrices) : null;
      const max = hasCompetitors ? Math.max(...g.allPrices) : null;
      const avg = hasCompetitors ? g.allPrices.reduce((a, b) => a + b, 0) / g.allPrices.length : null;

      let position: 'cheapest' | 'competitive' | 'expensive' | 'exclusive' | 'unset' = 'unset';
      if (g.myPrice !== null && avg !== null) {
        if (g.myPrice < avg * 0.9) position = 'cheapest';
        else if (g.myPrice > avg * 1.1) position = 'expensive';
        else position = 'competitive';
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

export async function refuseAndMergeSubcategoryAction(subcategoryId: string, targetSubcategoryId: string) {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  // 1. Get the category of the target subcategory to ensure consistency
  const targetSub = await (prisma as any).mktSubcategory.findUnique({
    where: { id: targetSubcategoryId }
  });

  if (!targetSub) throw new Error('Sous-catégorie cible introuvable');

  // 2. Update all ProductStandards linked to this subcategory
  await (prisma as any).productStandard.updateMany({
    where: { subcategoryId },
    data: { 
      subcategoryId: targetSubcategoryId,
      categoryId: targetSub.categoryId
    }
  });

  // 3. Update all VendorProducts linked to this subcategory
  await (prisma as any).vendorProduct.updateMany({
    where: { subcategoryId },
    data: { 
      subcategoryId: targetSubcategoryId,
      categoryId: targetSub.categoryId
    }
  });

  // 4. Delete the rejected subcategory
  await (prisma as any).mktSubcategory.delete({
    where: { id: subcategoryId }
  });

  revalidatePath('/superadmin/marketplace/categories');
  revalidatePath('/marketplace');
  revalidatePath('/vendor/portal/catalog');
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

export async function placeMarketplaceOrder(data: { vendorId: string; total: number; vendorPosId?: string; items: { productId?: string; bundleId?: string; quantity: number; price: number; name: string }[] }) {
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
      vendorPosId: data.vendorPosId || null,
      items: {
        create: data.items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          mktBundleId: i.bundleId || null,
          mktProductId: i.productId || null
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

  const vendorProfile = await prisma.vendorProfile.create({
    data: {
      userId: user.id,
      companyName: companyName,
      phone: phone,
      address: address,
      city: city,
      description: description,
      status: 'PENDING'
    }
  });

  if ((prisma as any).vendorWallet) {
    await (prisma as any).vendorWallet.create({
      data: {
        vendorId: vendorProfile.id,
        balance: 100,
        transactions: {
          create: [{
            amount: 100,
            type: 'BONUS',
            description: 'Bonus de bienvenue B2B'
          }]
        }
      }
    });
  }

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

// ==========================================
// VENDOR FRANCHISE / POS MANAGEMENT
// ==========================================

export async function toggleVendorPremiumAction(vendorId: string, isPremium: boolean) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const admin = await (prisma as any).user.findUnique({
    where: { id: userId }
  });

  if (!admin || admin.role !== 'SUPERADMIN') throw new Error('Accès refusé');

  await (prisma as any).vendorProfile.update({
    where: { id: vendorId },
    data: { isPremium }
  });

  revalidatePath(`/superadmin/vendors/${vendorId}`);
  revalidatePath('/superadmin/vendors');
}

export async function createVendorPosAction(data: {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  lat?: number;
  lng?: number;
}) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const vendor = await (prisma as any).vendorProfile.findFirst({
    where: { userId }
  });

  if (!vendor) throw new Error('Profil vendeur introuvable');
  if (!vendor.isPremium) throw new Error('Cette fonctionnalité nécessite le pack Franchise B2B');

  await (prisma as any).vendorPos.create({
    data: {
      ...data,
      vendorId: vendor.id
    }
  });

  revalidatePath('/vendor/portal');
}

export async function updateVendorPosAction(id: string, data: any) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const pos = await (prisma as any).vendorPos.findUnique({
    where: { id },
    include: { vendor: true }
  });

  if (!pos || pos.vendor.userId !== userId) throw new Error('Accès refusé');

  await (prisma as any).vendorPos.update({
    where: { id },
    data
  });

  revalidatePath('/vendor/portal');
}

export async function updateVendorPosStockAction(posId: string, productId: string, quantity: number) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  await (prisma as any).vendorPosStock.upsert({
    where: {
      vendorPosId_vendorProductId: {
        vendorPosId: posId,
        vendorProductId: productId
      }
    },
    update: { quantity },
    create: {
      vendorPosId: posId,
      vendorProductId: productId,
      quantity
    }
  });

  revalidatePath('/vendor/portal');
  revalidatePath('/vendor/portal/pos');
}

export async function createVendorCollectionAction(name: string) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Session expirée');

  const vendor = await (prisma as any).vendorProfile.findFirst({
    where: { userId }
  });

  if (!vendor) throw new Error('Vendeur introuvable');

  await (prisma as any).vendorCollection.create({
    data: {
      name,
      vendorId: vendor.id
    }
  });

  revalidatePath('/vendor/portal/catalog');
}

export async function deleteVendorCollectionAction(id: string) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Session expirée');

  await (prisma as any).vendorCollection.delete({
    where: { id }
  });

  revalidatePath('/vendor/portal/catalog');
}

export async function updateVendorProductCollectionsAction(productId: string, collectionIds: string[]) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Session expirée');

  await (prisma as any).vendorProduct.update({
    where: { id: productId },
    data: {
      collections: {
        set: collectionIds.map(id => ({ id }))
      }
    }
  });

  revalidatePath('/vendor/portal/catalog');
}

export async function updateStockThresholdAction(productId: string, threshold: number) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Session expirée');

  await (prisma as any).vendorProduct.update({
    where: { id: productId },
    data: { stockThreshold: threshold }
  });

  revalidatePath('/vendor/portal/catalog');
}

export async function getVendorOrdersWithAlertsAction() {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const vendor = await (prisma as any).vendorProfile.findFirst({
    where: { userId }
  });

  if (!vendor) return { orders: [], alerts: [] };

  // Fetch orders with relations
  const orders = await (prisma as any).supplierOrder.findMany({
    where: { vendorId: vendor.id },
    include: {
      items: true,
      store: true,
      vendorPos: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate Alerts
  const alerts: any[] = [];
  const now = new Date();

  // 1. SLA Alerts (Pending orders > 15 mins)
  orders.forEach((o: any) => {
    if (o.status === 'PENDING') {
      const diffMins = (now.getTime() - new Date(o.createdAt).getTime()) / 60000;
      if (diffMins > 15) {
        alerts.push({
          type: 'SLA_DELAY',
          severity: diffMins > 30 ? 'CRITICAL' : 'WARNING',
          message: `Commande #${o.id.slice(-6)} en retard (${Math.round(diffMins)} min)`,
          orderId: o.id,
          posName: o.vendorPos?.name || 'Magasin non défini'
        });
      }
    }
  });

  // 2. Stock Alerts
  const posStocks = await (prisma as any).vendorPosStock.findMany({
    where: { vendorPos: { vendorId: vendor.id } },
    include: {
      vendorProduct: true,
      vendorPos: true
    }
  });

  posStocks.forEach((s: any) => {
    const qty = Number(s.quantity);
    const threshold = Number(s.vendorProduct.stockThreshold || 5);
    if (qty <= threshold) {
      alerts.push({
        type: 'LOW_STOCK',
        severity: qty === 0 ? 'CRITICAL' : 'WARNING',
        message: `Stock bas: ${s.vendorProduct.name} (${qty} restants) à ${s.vendorPos.name}`,
        productId: s.vendorProductId,
        posId: s.vendorPosId
      });
    }
  });

  return {
    orders: JSON.parse(JSON.stringify(orders)),
    alerts
  };
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
      vendorProducts: {
        include: { 
          productStandard: true,
          collections: true
        }
      },
      activityPoles: true,
      mktSectors: true,
      wallet: true,
      bundles: {
        include: {
          items: {
            include: {
              vendorProduct: {
                include: { productStandard: true }
              }
            }
          }
        }
      },
      orders: {
        include: { items: true, store: true },
        orderBy: { createdAt: 'desc' }
      },
      posList: {
        include: {
          stockItems: {
            include: { vendorProduct: true }
          }
        }
      },
      customization: true,
      customers: {
        include: { store: true }
      },
      campaigns: true,
      collections: true,
    }
  });

  if (vendor) {
    const hasWalletModel = !!(prisma as any).vendorWallet;
    let wallet: any = null;
    let settlements: any[] = [];
    let isGracePeriodActive = false;
    let depositRequests: any[] = [];

    if (hasWalletModel) {
      try {
        wallet = await (prisma as any).vendorWallet.findUnique({
          where: { vendorId: vendor.id },
          include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } }
        });

        if (!wallet) {
          wallet = await (prisma as any).vendorWallet.create({
            data: { vendorId: vendor.id, balance: 0 },
            include: { transactions: true }
          });
        }

        const orderIds = vendor.orders.map((o: any) => o.id);
        settlements = await (prisma as any).marketplaceSettlement.findMany({
          where: { orderId: { in: orderIds } }
        });

        // Grace period check
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const pendingRecentDeposit = await (prisma as any).walletDepositRequest.findFirst({
          where: {
            vendorId: vendor.id,
            status: 'PENDING',
            createdAt: { gte: threeDaysAgo }
          }
        });
        isGracePeriodActive = !!pendingRecentDeposit;

        // Independent fetch for depositRequests if model exists
        if ((prisma as any).walletDepositRequest) {
          depositRequests = await (prisma as any).walletDepositRequest.findMany({
            where: { vendorId: vendor.id },
            orderBy: { createdAt: 'desc' },
            take: 10
          });
        }

      } catch (e) {
        console.error('Wallet/Settlement fetch failed:', e);
      }
    }

    const settlementMap = new Map(settlements.map((s: any) => [s.orderId, s]));
    const mapProduct = (p: any) => {
      if (!p) return null;
      return {
        id: p.id,
        productStandardId: p.productStandardId,
        name: p.name || p.productStandard?.name || 'Produit sans nom',
        unit: p.unit || p.productStandard?.unit || 'unité',
        categoryId: p.categoryId || p.productStandard?.categoryId,
        subcategoryId: p.subcategoryId || p.productStandard?.subcategoryId,
        vendorId: p.vendorId,
        price: Number(p.price),
        minOrderQty: Number(p.minOrderQty),
        stockStatus: p.stockStatus,
        isFeatured: p.isFeatured,
        isFlashSale: p.isFlashSale,
        discount: p.discountPrice ? Number(p.discountPrice) : null,
        flashStart: p.flashStart,
        flashEnd: p.flashEnd,
        image: p.image || p.productStandard?.image,
        description: p.description || p.productStandard?.description,
        tags: p.tags || p.productStandard?.tags || [],
        deliveryAreas: p.deliveryAreas || [],
        collections: p.collections || [],
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    };

    const mapBundle = (b: any) => ({
      ...b,
      price: Number(b.price),
      items: (b.items || []).map((i: any) => ({
        ...i,
        quantity: Number(i.quantity),
        vendorProduct: mapProduct(i.vendorProduct)
      }))
    });

    return {
      ...vendor,
      products: (vendor.vendorProducts || []).map(mapProduct),
      bundles: (vendor.bundles || []).map(mapBundle),
      orders: vendor.orders.map((o: any) => ({
        ...o,
        total: Number(o.total),
        items: o.items.map((it: any) => ({ ...it, quantity: Number(it.quantity), price: Number(it.price) })),
        settlement: o.settlement ? {
          ...o.settlement,
          commissionAmount: Number(o.settlement.commissionAmount)
        } : null
      })),
      wallet: wallet ? {
        ...wallet,
        balance: Number(wallet.balance),
        transactions: (wallet.transactions || []).map((t: any) => ({
          ...t,
          amount: Number(t.amount)
        }))
      } : {
        balance: 0,
        transactions: [],
        status: 'PENDING_SERVER_RESTART'
      },
      depositRequests: depositRequests.map((r: any) => ({
        ...r,
        amount: Number(r.amount)
      })),
      isGracePeriodActive
    };
  }
  return null;
}

export async function createMarketplaceBundleAction(data: {
  name: string;
  description?: string;
  price: number;
  discountPercent?: number;
  image?: string;
  items: { vendorProductId: string; quantity: number }[];
}) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Utilisateur non trouvé');

  const vendor = await (prisma as any).vendorProfile.findFirst({
    where: { userId: user.id }
  });
  if (!vendor) throw new Error('Profil vendeur introuvable');

  const bundle = await (prisma as any).mktBundle.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      discountPercent: data.discountPercent,
      image: data.image,
      vendorId: vendor.id,
      items: {
        create: data.items.map(it => ({
          vendorProductId: it.vendorProductId,
          quantity: it.quantity
        }))
      }
    }
  });

  revalidatePath('/vendor/portal/catalog');
  revalidatePath('/marketplace');
  return bundle;
}

export async function deleteMarketplaceBundleAction(id: string) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Utilisateur non trouvé');

  const vendor = await (prisma as any).vendorProfile.findFirst({
    where: { userId: user.id }
  });
  if (!vendor) throw new Error('Profil vendeur introuvable');

  // Verify ownership
  const bundle = await (prisma as any).mktBundle.findUnique({ where: { id } });
  if (!bundle || bundle.vendorId !== vendor.id) throw new Error('Non autorisé');

  await (prisma as any).mktBundle.delete({ where: { id } });

  revalidatePath('/vendor/portal/catalog');
  revalidatePath('/marketplace');
}

export async function approveMarketplaceOrderAction(orderId: string, role: 'VENDOR' | 'SUPERADMIN') {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Utilisateur non trouvé');

  const order = await (prisma as any).supplierOrder.findUnique({
    where: { id: orderId },
    include: {
      vendor: { include: { wallet: true } },
      settlement: true
    }
  });

  if (!order) throw new Error('Commande introuvable');
  if (!order.vendorId) throw new Error('Commande non lié à un vendeur marketplace');

  // 1. Handle Settlement Creation if missing
  let currentSettlement = order.settlement;
  if (!currentSettlement) {
    const commissionAmount = Number(order.total) * Number(order.vendor.commissionRate || 0);
    currentSettlement = await (prisma as any).marketplaceSettlement.create({
      data: {
        orderId: order.id,
        commissionAmount: commissionAmount,
      }
    });
  }

  // 2. Apply Approval
  const updateData: any = {};
  if (role === 'VENDOR') {
    const vendorProfile = await (prisma as any).vendorProfile.findFirst({ where: { userId: user.id } });
    if (!vendorProfile || vendorProfile.id !== order.vendorId) throw new Error('Non autorisé');
    updateData.vendorApproved = true;
  } else if (role === 'SUPERADMIN') {
    if (user.role !== 'SUPERADMIN') throw new Error('Non autorisé');
    updateData.superadminApproved = true;
  }

  const updatedSettlement = await (prisma as any).marketplaceSettlement.update({
    where: { id: currentSettlement.id },
    data: updateData
  });

  // 3. Finalize if both approved
  if (updatedSettlement.vendorApproved && updatedSettlement.superadminApproved && !updatedSettlement.isProcessed) {
    const wallet = order.vendor.wallet;

    if (!wallet) throw new Error('Portefeuille introuvable');

    const amountToDeduct = Number(updatedSettlement.commissionAmount);

    await (prisma as any).$transaction([
      (prisma as any).vendorWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amountToDeduct } }
      }),
      (prisma as any).walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -amountToDeduct,
          type: 'COMMISSION',
          description: `Commission sur commande #${order.id.slice(-5)}`,
          settlementId: updatedSettlement.id
        }
      }),
      (prisma as any).marketplaceSettlement.update({
        where: { id: updatedSettlement.id },
        data: { isProcessed: true, processedAt: new Date() }
      })
    ]);
  }

  revalidatePath('/vendor/portal/orders');
  revalidatePath('/superadmin/orders');
}

export async function depositToWalletAction(vendorId: string, amount: number, description: string = 'Rechargement compte') {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');
  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (user.role !== 'SUPERADMIN') throw new Error('Action réservée aux administrateurs');

  const wallet = await (prisma as any).vendorWallet.findUnique({ where: { vendorId } });
  if (!wallet) throw new Error('Portefeuille introuvable');

  await (prisma as any).$transaction([
    (prisma as any).vendorWallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } }
    }),
    (prisma as any).walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: amount,
        type: 'DEPOSIT',
        description: description
      }
    })
  ]);

  revalidatePath('/vendor/portal');
  revalidatePath('/marketplace');
}

export async function createWalletDepositRequestAction(data: { amount: number, proofImage: string }) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const vendor = await (prisma as any).vendorProfile.findUnique({
    where: { userId }
  });
  if (!vendor) throw new Error('Profil vendeur non trouvé');

  await (prisma as any).walletDepositRequest.create({
    data: {
      vendorId: vendor.id,
      amount: data.amount,
      proofImage: data.proofImage,
      status: 'PENDING'
    }
  });

  revalidatePath('/vendor/portal/wallet');
}

export async function getPendingDepositsAction() {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');
  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (user?.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  return (prisma as any).walletDepositRequest.findMany({
    where: { status: 'PENDING' },
    include: { vendor: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getAllWalletRequestsAction() {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');
  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (user?.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  return (prisma as any).walletDepositRequest.findMany({
    include: { vendor: true },
    orderBy: { updatedAt: 'desc' }
  });
}

export async function getGlobalWalletTransactionsAction() {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');
  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (user?.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  return (prisma as any).walletTransaction.findMany({
    include: { wallet: { include: { vendor: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}

export async function processDepositRequestAction(requestId: string, status: 'APPROVED' | 'REJECTED', adminNotes?: string) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');
  const user = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (user?.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  const request = await (prisma as any).walletDepositRequest.findUnique({
    where: { id: requestId },
    include: { vendor: { include: { wallet: true } } }
  });

  if (!request) throw new Error('Demande introuvable');
  if (request.status !== 'PENDING') throw new Error('Demande déjà traitée');

  if (status === 'APPROVED') {
    const wallet = request.vendor.wallet;
    if (!wallet) throw new Error('Portefeuille introuvable');

    const amount = Number(request.amount);

    await (prisma as any).$transaction([
      (prisma as any).vendorWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } }
      }),
      (prisma as any).walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: amount,
          type: 'DEPOSIT',
          description: `Dépôt approuvé #${request.id.slice(-5)}`,
        }
      }),
      (prisma as any).walletDepositRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', adminNotes, updatedAt: new Date() }
      })
    ]);
  } else {
    await (prisma as any).walletDepositRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', adminNotes, updatedAt: new Date() }
    });
  }

  revalidatePath('/superadmin/wallet');
  revalidatePath('/vendor/portal/wallet');
  revalidatePath('/marketplace');
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
      minOrderQty: data.minOrderQty ? Number(data.minOrderQty) : 1
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
  const order = await prisma.supplierOrder.update({
    where: { id: orderId },
    data: { status },
    include: { items: true }
  });

  // If order is delivered, update stock and create expense
  if (status === 'DELIVERED') {
    // 1. Create Expense
    await (prisma as any).expense.create({
      data: {
        storeId: order.storeId,
        category: 'ACHAT',
        amount: order.total,
        description: `Automatique: Réception Commande Marketplace #${orderId}`
      }
    });

    // 2. Update Stock
    for (const item of order.items) {
      if ((item as any).mktBundleId) {
        // Fetch bundle components
        const bundle = await (prisma as any).mktBundle.findUnique({
          where: { id: (item as any).mktBundleId },
          include: {
            items: {
              include: { vendorProduct: true }
            }
          }
        });

        if (bundle) {
          for (const bundleItem of bundle.items) {
            const finalQty = Number(bundleItem.quantity) * Number(item.quantity);
            const itemName = bundleItem.vendorProduct.name || "Produit sans nom";
            const itemPrice = Number(bundleItem.vendorProduct.price);

            await upsertStockItem(order.storeId, itemName, finalQty, itemPrice);
          }
          continue; // Move to next order item
        }
      }

      // Individual product or fallback
      const itemName = item.name || "Produit sans nom";
      await upsertStockItem(order.storeId, itemName, Number(item.quantity), Number(item.price));
    }
  }

  revalidatePath('/vendor/portal/orders');
  revalidatePath('/admin/orders');
  revalidatePath('/admin/stock');
  revalidatePath('/admin/expenses');
}

// Helper for atomic stock updates
async function upsertStockItem(storeId: string, name: string, quantity: number, price: number) {
  let stockItem = await (prisma as any).stockItem.findFirst({
    where: {
      storeId,
      name: { equals: name, mode: 'insensitive' }
    }
  });

  if (stockItem) {
    await (prisma as any).stockItem.update({
      where: { id: stockItem.id },
      data: {
        quantity: { increment: quantity },
        cost: price
      }
    });
  } else {
    await (prisma as any).stockItem.create({
      data: {
        storeId,
        name,
        quantity: quantity,
        cost: price,
        minThreshold: 0
      }
    });
  }
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
      minOrderQty: data.minOrderQty ? Number(data.minOrderQty) : 1
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
// ══════════════════════════════════════════════════════════════
//  COMMISSION RULES (MARKETPLACE)
// ══════════════════════════════════════════════════════════════

export async function getCommissionRules() {
  const user = await getUser();
  if (user?.role !== 'SUPERADMIN') throw new Error('Action non autorisée');
  return (prisma as any).commissionRule.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function createCommissionRule(data: { name: string; description?: string; baseRate: number; tiers: any[]; isDefault?: boolean }) {
  const user = await getUser();
  if (user?.role !== 'SUPERADMIN') throw new Error('Action non autorisée');

  if (data.isDefault) {
    await (prisma as any).commissionRule.updateMany({
      where: { isDefault: true },
      data: { isDefault: false }
    });
  }

  const rule = await (prisma as any).commissionRule.create({
    data: {
      name: data.name,
      description: data.description,
      baseRate: data.baseRate,
      tiers: data.tiers,
      isDefault: data.isDefault || false
    }
  });

  revalidatePath('/superadmin/commissions');
  return rule;
}

export async function updateCommissionRule(id: string, data: { name?: string; description?: string; baseRate?: number; tiers?: any[]; isDefault?: boolean }) {
  const user = await getUser();
  if (user?.role !== 'SUPERADMIN') throw new Error('Action non autorisée');

  if (data.isDefault) {
    await (prisma as any).commissionRule.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false }
    });
  }

  const rule = await (prisma as any).commissionRule.update({
    where: { id },
    data
  });

  revalidatePath('/superadmin/commissions');
  return rule;
}

export async function deleteCommissionRule(id: string) {
  const user = await getUser();
  if (user?.role !== 'SUPERADMIN') throw new Error('Action non autorisée');

  await (prisma as any).commissionRule.delete({ where: { id } });
  revalidatePath('/superadmin/commissions');
}

export async function assignCommissionRuleToVendor(vendorId: string, ruleId: string | null) {
  const user = await getUser();
  if (user?.role !== 'SUPERADMIN') throw new Error('Action non autorisée');

  await (prisma.vendorProfile as any).update({
    where: { id: vendorId },
    data: { commissionRuleId: ruleId }
  });

  revalidatePath(`/superadmin/vendors/${vendorId}`);
  revalidatePath('/superadmin/vendors');
}

//  MARKETPLACE CATEGORIES (SuperAdmin managed)
// ══════════════════════════════════════════════════════════════
// Categorires management moved to MarketplaceCategory actions section

// ══════════════════════════════════════════════════════════════
//  PRODUCT CATEGORIES (SuperAdmin managed, used by store products)
// ══════════════════════════════════════════════════════════════
export async function createProductCategoryAction(data: { name: string; color?: string; icon?: string; parentId?: string }) {
  const store = await getStore();
  if (!store) throw new Error('Action non autorisée : Aucun magasin trouvé.');

  await prisma.category.create({
    data: {
      name: data.name,
      color: data.color || "#6366F1",
      icon: data.icon || null,
      parentId: data.parentId || null,
      storeId: store.id
    }
  });
  revalidatePath('/admin/products/categories');
  revalidatePath('/pos');
}

export async function updateProductCategoryAction(id: string, data: { name: string; color?: string; icon?: string; parentId?: string }) {
  const store = await getStore();
  if (!store) throw new Error('Action non autorisée : Aucun magasin trouvé.');

  // Validate ownership
  const cat = await prisma.category.findUnique({ where: { id } });
  if (cat?.storeId !== store.id) throw new Error('Non autorisé');

  await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      color: data.color || "#6366F1",
      icon: data.icon || null,
      parentId: data.parentId || null,
    }
  });

  revalidatePath('/admin/products/categories');
  revalidatePath('/pos');
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

// ── Cash Session Management ─────────────────────────────────────
export async function getActiveCashSession() {
  const store = await getStore();
  if (!store) return null;
  const userId = cookies().get('userId')?.value;
  if (!userId) return null;

  return (prisma as any).cashSession.findFirst({
    where: {
      storeId: store.id,
      baristaId: userId,
      status: 'OPEN'
    }
  });
}

export async function openCashSessionAction(openingBalance: number) {
  const store = await getStore();
  if (!store) throw new Error('Non autorisé');
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Session expirée');

  // Close any existing open session just in case
  await (prisma as any).cashSession.updateMany({
    where: { storeId: store.id, baristaId: userId, status: 'OPEN' },
    data: { status: 'CLOSED', closedAt: new Date() }
  });

  return (prisma as any).cashSession.create({
    data: {
      storeId: store.id,
      baristaId: userId,
      openingBalance,
      totalSales: 0,
      status: 'OPEN'
    }
  });
}

export async function closeCashSessionAction(id: string, closingBalance: number, notes?: string) {
  const session = await (prisma as any).cashSession.findUnique({
    where: { id }
  });
  if (!session) throw new Error('Session non trouvée');

  return (prisma as any).cashSession.update({
    where: { id },
    data: {
      closingBalance,
      notes,
      status: 'CLOSED',
      closedAt: new Date()
    }
  });
}

// ══════════════════════════════════════════════════════════════
//  ZONE & TABLE MANAGEMENT
// ══════════════════════════════════════════════════════════════

export async function createZoneAction(name: string) {
  const store = await getStore();
  if (!store) return;
  const zone = await prisma.storeZone.create({
    data: { name, storeId: store.id }
  });
  revalidatePath('/admin/tables');
  return zone;
}

export async function updateZoneAction(id: string, name: string) {
  await prisma.storeZone.update({ where: { id }, data: { name } });
  revalidatePath('/admin/tables');
}

export async function deleteZoneAction(id: string) {
  await prisma.storeTable.updateMany({
    where: { zoneId: id },
    data: { zoneId: null }
  });
  await prisma.storeZone.delete({ where: { id } });
  revalidatePath('/admin/tables');
}

export async function createTableAction(data: { 
  label: string; 
  capacity: number; 
  zoneId?: string | null;
  posX?: number;
  posY?: number;
  shape?: string;
  width?: number;
  height?: number;
}) {
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

export async function updateTableAction(id: string, data: { 
  label?: string; 
  capacity?: number;
  zoneId?: string | null;
  posX?: number;
  posY?: number;
  shape?: string;
  width?: number;
  height?: number;
}) {
  await prisma.storeTable.update({
    where: { id },
    data
  });
  revalidatePath('/admin/tables');
  revalidatePath('/pos');
}

export async function updateTablePositionAction(id: string, posX: number, posY: number) {
  await prisma.storeTable.update({
    where: { id },
    data: { posX, posY }
  });
  revalidatePath('/admin/tables');
  revalidatePath('/pos');
}

export async function deleteTableAction(id: string) {
  await prisma.storeTable.delete({ where: { id } });
  revalidatePath('/admin/tables');
  revalidatePath('/pos');
}

// ── Data Export & Backup ────────────────────────────────────────
export async function exportDataAction(type: 'sales' | 'products' | 'stock' | 'users' | 'full_backup', dateStart?: string, dateEnd?: string) {
  const store = await getStore();
  if (!store) throw new Error('Boutique non trouvée');

  const start = dateStart ? new Date(dateStart) : new Date(0);
  const end = dateEnd ? new Date(dateEnd) : new Date();
  // Set end to end of day
  end.setHours(23, 59, 59, 999);

  let data: any;

  if (type === 'sales') {
    data = await prisma.sale.findMany({
      where: { storeId: store.id, createdAt: { gte: start, lte: end } },
      include: { items: { include: { product: true } }, barista: true, customer: true },
      orderBy: { createdAt: 'desc' }
    });
  } else if (type === 'products') {
    data = await prisma.product.findMany({
      where: { storeId: store.id },
      include: { category: true, unit: true },
      orderBy: { name: 'asc' }
    });
  } else if (type === 'stock') {
    data = await prisma.stockItem.findMany({
      where: { storeId: store.id },
      include: { unit: true },
      orderBy: { name: 'asc' }
    });
  } else if (type === 'users') {
    data = await prisma.user.findMany({
      where: { storeId: store.id },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
      orderBy: { name: 'asc' }
    });
  } else if (type === 'full_backup') {
    const tables = {
      exportDate: new Date().toISOString(),
      store: await prisma.store.findUnique({ where: { id: store.id } }),
      products: await prisma.product.findMany({ where: { storeId: store.id } }),
      categories: await prisma.category.findMany({ where: { storeId: store.id } }),
      sales: await prisma.sale.findMany({ where: { storeId: store.id }, include: { items: true } }),
      stockItems: await prisma.stockItem.findMany({ where: { storeId: store.id } }),
      users: await prisma.user.findMany({ where: { storeId: store.id } }),
      customers: await prisma.customer.findMany({ where: { storeId: store.id } }),
      expenses: await prisma.expense.findMany({ where: { storeId: store.id } }),
      tables: await prisma.storeTable.findMany({ where: { storeId: store.id } }),
      zones: await prisma.storeZone.findMany({ where: { storeId: store.id } }),
      terminals: await prisma.posTerminal.findMany({ where: { storeId: store.id } }),
      zReports: await prisma.zReport.findMany({ where: { storeId: store.id } }),
      cashSessions: await (prisma as any).cashSession.findMany({ where: { storeId: store.id } })
    };
    return JSON.parse(JSON.stringify(tables));
  }

  return JSON.parse(JSON.stringify(data));
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

export async function getTerminalAction(id: string) {
  const store = await getStore();
  if (!store) throw new Error('Non authentifié');

  const terminal = await (prisma.posTerminal as any).findUnique({
    where: { id },
    include: { store: true }
  });

  if (!terminal || terminal.storeId !== store.id) {
    throw new Error('Terminal introuvable');
  }

  return terminal;
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
  const terminal = await (prisma.posTerminal as any).findUnique({ where: { id } });
  if (terminal?.status === 'ACTIVE') {
    throw new Error('Ce terminal est déjà couplé et actif.');
  }

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

// SEED TUNISIAN STARTER PACK

/**
 * SEED TUNISIAN STARTER PACK
 * Initialisation complète avec produits populaires tunisiens, 
 * matières premières (grammages) et emballages.
 */
export async function seedTunisianStarterPackAction(storeId: string) {
  const result = await seedTunisianStarterPack(prisma as any, storeId);
  revalidatePath('/admin/products');
  revalidatePath('/admin/stock');
  return result;
}

export async function seedDemoProductsAction(storeId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { subscription: { include: { plan: true } } }
  });
  if (!store) throw new Error('Store not found');

  const isRachma = store.subscription?.plan?.name?.toUpperCase() === 'RACHMA';

  if (isRachma) {
    const rachmaCategories = [
      { name: '1. CAFÉS', color: '#8B5CF6', icon: 'Coffee' },
      { name: '2. THÉS', color: '#10B981', icon: 'Coffee' },
      { name: '3. EAUX', color: '#3B82F6', icon: 'CupSoda' },
      { name: '4. BOISSONS FROIDES SIMPLES', color: '#F97316', icon: 'CupSoda' },
      { name: '5. BIÈRE', color: '#EAB308', icon: 'Beer' },
      { name: '6. TABAC', color: '#64748B', icon: 'Cigarette' },
      { name: '7. PETITS ACCOMPAGNEMENTS', color: '#D946EF', icon: 'Croissant' },
      { name: '8. PRODUITS INVISIBLES', color: '#94A3B8', icon: 'Ghost' }
    ];

    const posCategoriesMap: Record<string, string> = {};
    for (const c of rachmaCategories) {
      const cat = await prisma.category.create({
        data: { name: c.name, color: c.color, icon: c.icon, storeId: store.id }
      });
      posCategoriesMap[c.name] = cat.id;
    }

    const rachmaProducts = [
      { name: 'Café express', price: 1.5, cat: '1. CAFÉS' },
      { name: 'Café direct', price: 1.5, cat: '1. CAFÉS' },
      { name: 'Café allongé', price: 1.8, cat: '1. CAFÉS' },
      { name: 'Capucin', price: 2.0, cat: '1. CAFÉS' },
      { name: 'Thé nature', price: 1.2, cat: '2. THÉS' },
      { name: 'Thé à la menthe', price: 1.5, cat: '2. THÉS' },
      { name: 'Thé amande', price: 2.5, cat: '2. THÉS' },
      { name: 'Eau minérale 0.5L', price: 1.0, cat: '3. EAUX' },
      { name: 'Eau minérale 1L', price: 1.5, cat: '3. EAUX' },
      { name: 'Eau gazeuse', price: 1.8, cat: '3. EAUX' },
      { name: 'Soda', price: 3.0, cat: '4. BOISSONS FROIDES SIMPLES' },
      { name: 'Jus industriel', price: 3.5, cat: '4. BOISSONS FROIDES SIMPLES' },
      { name: 'Bière locale', price: 4.5, cat: '5. BIÈRE' },
      { name: 'Bière sans alcool', price: 3.5, cat: '5. BIÈRE' },
      { name: 'Cigarettes', price: 10.0, cat: '6. TABAC' },
      { name: 'Briquet', price: 2.0, cat: '6. TABAC' },
      { name: 'Croissant', price: 1.5, cat: '7. PETITS ACCOMPAGNEMENTS' },
      { name: 'Biscuit', price: 1.0, cat: '7. PETITS ACCOMPAGNEMENTS' },
      { name: 'Cake simple', price: 2.0, cat: '7. PETITS ACCOMPAGNEMENTS' },
      { name: 'Café + sucre', price: 0.0, cat: '8. PRODUITS INVISIBLES' },
      { name: 'Verre d\'eau', price: 0.0, cat: '8. PRODUITS INVISIBLES' },
      { name: 'Service table', price: 0.0, cat: '8. PRODUITS INVISIBLES' }
    ];

    const productIds: Record<string, string> = {};
    for (const p of rachmaProducts) {
      if (posCategoriesMap[p.cat]) {
        const prod = await prisma.product.create({
          data: { name: p.name, price: p.price, categoryId: posCategoriesMap[p.cat], storeId: store.id }
        });
        productIds[p.name] = prod.id;
      }
    }

    // Add Cups Stock & Recipes
    const smallCup = await prisma.stockItem.create({
      data: { name: 'Petit Gobelet', quantity: 1000, storeId: store.id }
    });
    const largeCup = await prisma.stockItem.create({
      data: { name: 'Grand Gobelet', quantity: 1000, storeId: store.id }
    });

    const coffeeProds = ['Café express', 'Café direct', 'Café allongé', 'Capucin', 'Thé nature', 'Thé à la menthe', 'Thé amande'];
    for (const name of coffeeProds) {
      if (productIds[name]) {
        await prisma.recipeItem.create({
          data: { productId: productIds[name], stockItemId: smallCup.id, quantity: 1, consumeType: 'TAKEAWAY_SMALL' }
        });
        await prisma.recipeItem.create({
          data: { productId: productIds[name], stockItemId: largeCup.id, quantity: 1, consumeType: 'TAKEAWAY_LARGE' }
        });
      }
    }

    revalidatePath('/admin/products');
    revalidatePath('/admin/products/categories');
    return { success: true, message: 'Inventaire Rachma installé avec succès !' };
  }

  // 5.0 Units
  const unitsData = ['kg', 'litre', 'pièce', 'pack', 'g'];
  const unitsMap: Record<string, string> = {};
  for (const u of unitsData) {
    const created = await prisma.globalUnit.upsert({ where: { name: u }, update: {}, create: { name: u } });
    unitsMap[u] = created.id;
  }

  // 5.1 Raw Material Categories
  const rawMaterialCategories = [
    { parent: 'Boissons chaudes', child: 'Café' },
    { parent: 'Boissons chaudes', child: 'Thé & Infusions' },
    { parent: 'Boissons chaudes', child: 'Chocolat' },
    { parent: 'Produits laitiers', child: 'Lait' },
    { parent: 'Produits laitiers', child: 'Crème' },
    { parent: 'Produits laitiers', child: 'Fromage' },
    { parent: 'Sucrants', child: 'Sucre' },
    { parent: 'Sucrants', child: 'Édulcorants' },
    { parent: 'Sucrants', child: 'Arômes' },
    { parent: 'Fruits & Jus', child: 'Fruits frais' },
    { parent: 'Fruits & Jus', child: 'Jus & concentrés' },
    { parent: 'Boissons froides', child: 'Eau' },
    { parent: 'Boissons froides', child: 'Sodas' },
    { parent: 'Boissons froides', child: 'Énergétiques' },
    { parent: 'Pâtisserie', child: 'Ingrédients de base' },
    { parent: 'Pâtisserie', child: 'Chocolat & toppings' },
    { parent: 'Pâtisserie', child: 'Produits semi-finis' },
    { parent: 'Snack salé', child: 'Viandes' },
    { parent: 'Snack salé', child: 'Légumes' },
    { parent: 'Snack salé', child: 'Sauces' },
    { parent: 'Snack salé', child: 'Pain & pâte' },
    { parent: 'Chicha', child: 'Tabac' },
    { parent: 'Chicha', child: 'Charbon' },
    { parent: 'Chicha', child: 'Accessoires' },
    { parent: 'Nettoyage', child: 'Cuisine' },
    { parent: 'Nettoyage', child: 'Salle' },
    { parent: 'Nettoyage', child: 'Hygiène' },
    { parent: 'Consommables', child: 'Service' },
    { parent: 'Consommables', child: 'Emballage' },
  ];

  const posCategoriesMap: Record<string, string> = {};

  for (const rel of rawMaterialCategories) {
    if (!posCategoriesMap[rel.parent]) {
      const p = await prisma.category.create({
        data: { name: rel.parent, storeId: store.id }
      });
      posCategoriesMap[rel.parent] = p.id;
    }
    const childKey = `${rel.parent} > ${rel.child}`;
    if (!posCategoriesMap[childKey]) {
      const c = await prisma.category.create({
        data: { name: rel.child, storeId: store.id, parentId: posCategoriesMap[rel.parent] }
      });
      posCategoriesMap[childKey] = c.id;
    }
  }

  // 5.2 Stock Items
  const rawMaterials = [
    { name: 'Café grain', cat: 'Boissons chaudes > Café', unit: 'kg' },
    { name: 'Café moulu', cat: 'Boissons chaudes > Café', unit: 'kg' },
    { name: 'Capsules café', cat: 'Boissons chaudes > Café', unit: 'pièce' },
    { name: 'Thé vrac', cat: 'Boissons chaudes > Thé & Infusions', unit: 'kg' },
    { name: 'Sachet thé', cat: 'Boissons chaudes > Thé & Infusions', unit: 'pièce' },
    { name: 'Menthe', cat: 'Boissons chaudes > Thé & Infusions', unit: 'kg' },
    { name: 'Chocolat poudre', cat: 'Boissons chaudes > Chocolat', unit: 'kg' },
    { name: 'Sirop chocolat', cat: 'Boissons chaudes > Chocolat', unit: 'litre' },
    { name: 'Lait frais', cat: 'Produits laitiers > Lait', unit: 'litre' },
    { name: 'Lait UHT', cat: 'Produits laitiers > Lait', unit: 'litre' },
    { name: 'Lait concentré', cat: 'Produits laitiers > Lait', unit: 'litre' },
    { name: 'Crème liquide', cat: 'Produits laitiers > Crème', unit: 'litre' },
    { name: 'Chantilly', cat: 'Produits laitiers > Crème', unit: 'litre' },
    { name: 'Fromage râpé', cat: 'Produits laitiers > Fromage', unit: 'kg' },
    { name: 'Fromage tranche', cat: 'Produits laitiers > Fromage', unit: 'pièce' },
    { name: 'Sucre blanc', cat: 'Sucrants > Sucre', unit: 'kg' },
    { name: 'Sucre roux', cat: 'Sucrants > Sucre', unit: 'kg' },
    { name: 'Sucre sachet', cat: 'Sucrants > Sucre', unit: 'pièce' },
    { name: 'Édulcorant', cat: 'Sucrants > Édulcorants', unit: 'pièce' },
    { name: 'Sirop vanille', cat: 'Sucrants > Arômes', unit: 'litre' },
    { name: 'Sirop caramel', cat: 'Sucrants > Arômes', unit: 'litre' },
    { name: 'Sirop noisette', cat: 'Sucrants > Arômes', unit: 'litre' },
    { name: 'Orange', cat: 'Fruits & Jus > Fruits frais', unit: 'kg' },
    { name: 'Fraise', cat: 'Fruits & Jus > Fruits frais', unit: 'kg' },
    { name: 'Banane', cat: 'Fruits & Jus > Fruits frais', unit: 'kg' },
    { name: 'Citron', cat: 'Fruits & Jus > Fruits frais', unit: 'kg' },
    { name: 'Jus concentré', cat: 'Fruits & Jus > Jus & concentrés', unit: 'litre' },
    { name: 'Sirop fruits', cat: 'Fruits & Jus > Jus & concentrés', unit: 'litre' },
    { name: 'Eau minérale', cat: 'Boissons froides > Eau', unit: 'litre' },
    { name: 'Eau gazeuse', cat: 'Boissons froides > Eau', unit: 'litre' },
    { name: 'Soda cola', cat: 'Boissons froides > Sodas', unit: 'litre' },
    { name: 'Soda orange', cat: 'Boissons froides > Sodas', unit: 'litre' },
    { name: 'Boisson énergétique', cat: 'Boissons froides > Énergétiques', unit: 'litre' },
    { name: 'Farine', cat: 'Pâtisserie > Ingrédients de base', unit: 'kg' },
    { name: 'Œufs', cat: 'Pâtisserie > Ingrédients de base', unit: 'pièce' },
    { name: 'Beurre', cat: 'Pâtisserie > Ingrédients de base', unit: 'kg' },
    { name: 'Chocolat noir', cat: 'Pâtisserie > Chocolat & toppings', unit: 'kg' },
    { name: 'Nutella', cat: 'Pâtisserie > Chocolat & toppings', unit: 'kg' },
    { name: 'Génoise', cat: 'Pâtisserie > Produits semi-finis', unit: 'pièce' },
    { name: 'Crème pâtissière', cat: 'Pâtisserie > Produits semi-finis', unit: 'kg' },
    { name: 'Viande poulet', cat: 'Snack salé > Viandes', unit: 'kg' },
    { name: 'Viande thon', cat: 'Snack salé > Viandes', unit: 'kg' },
    { name: 'Tomate', cat: 'Snack salé > Légumes', unit: 'kg' },
    { name: 'Salade', cat: 'Snack salé > Légumes', unit: 'kg' },
    { name: 'Mayonnaise', cat: 'Snack salé > Sauces', unit: 'litre' },
    { name: 'Ketchup', cat: 'Snack salé > Sauces', unit: 'litre' },
    { name: 'Pain sandwich', cat: 'Snack salé > Pain & pâte', unit: 'pièce' },
    { name: 'Pâte pizza', cat: 'Snack salé > Pain & pâte', unit: 'kg' },
    { name: 'Tabac chicha', cat: 'Chicha > Tabac', unit: 'kg' },
    { name: 'Charbon chicha', cat: 'Chicha > Charbon', unit: 'kg' },
    { name: 'Aluminium chicha', cat: 'Chicha > Accessoires', unit: 'pièce' },
    { name: 'Liquide vaisselle', cat: 'Nettoyage > Cuisine', unit: 'litre' },
    { name: 'Dégraissant', cat: 'Nettoyage > Cuisine', unit: 'litre' },
    { name: 'Produit sol', cat: 'Nettoyage > Salle', unit: 'litre' },
    { name: 'Désinfectant', cat: 'Nettoyage > Salle', unit: 'litre' },
    { name: 'Savon main', cat: 'Nettoyage > Hygiène', unit: 'litre' },
    { name: 'Papier toilette', cat: 'Nettoyage > Hygiène', unit: 'pièce' },
    { name: 'Gobelet', cat: 'Consommables > Service', unit: 'pièce' },
    { name: 'Verre jetable', cat: 'Consommables > Service', unit: 'pièce' },
    { name: 'Paille', cat: 'Consommables > Service', unit: 'pièce' },
    { name: 'Serviette', cat: 'Consommables > Service', unit: 'pièce' },
    { name: 'Sac emballage', cat: 'Consommables > Emballage', unit: 'pièce' },
    { name: 'Boite gâteau', cat: 'Consommables > Emballage', unit: 'pièce' },
  ];

  for (const mat of rawMaterials) {
    await prisma.stockItem.create({
      data: {
        name: mat.name,
        unitId: unitsMap[mat.unit],
        quantity: 100, // mock quantity
        storeId: store.id
      }
    });
  }

  // 5.3 Finished Products Categories
  const finishedProductCategoriesDef = [
    { name: 'Cafés', color: '#8B5CF6', icon: 'Coffee' },
    { name: 'Thés', color: '#10B981', icon: 'Coffee' },
    { name: 'Boissons chaudes', color: '#F59E0B', icon: 'Coffee' },
    { name: 'Boissons froides', color: '#3B82F6', icon: 'Coffee' },
    { name: 'Jus', color: '#F97316', icon: 'Coffee' },
    { name: 'Milkshake', color: '#EC4899', icon: 'Coffee' },
    { name: 'Pâtisserie', color: '#D946EF', icon: 'Cake' },
    { name: 'Snack', color: '#EF4444', icon: 'Pizza' },
    { name: 'Crêpes', color: '#EAB308', icon: 'Utensils' },
    { name: 'Chicha', color: '#64748B', icon: 'Box' },
    { name: 'Extras', color: '#94A3B8', icon: 'Tag' }
  ];

  for (const c of finishedProductCategoriesDef) {
    const cat = await prisma.category.create({
      data: { name: c.name, color: c.color, icon: c.icon, storeId: store.id }
    });
    posCategoriesMap[c.name] = cat.id;
  }

  // 5.4 Finished Products (Menu Import)
  const finishedProductsData = [
    { name: 'Café express', cat: 'Cafés', price: 1.2 },
    { name: 'Café direct', cat: 'Cafés', price: 1.5 },
    { name: 'Capucin', cat: 'Cafés', price: 2.0 },
    { name: 'Cappuccino', cat: 'Cafés', price: 3.5 },
    { name: 'Café crème', cat: 'Cafés', price: 3.0 },

    { name: 'Thé nature', cat: 'Thés', price: 1.0 },
    { name: 'Thé menthe', cat: 'Thés', price: 1.2 },
    { name: 'Thé amande', cat: 'Thés', price: 2.5 },

    { name: 'Chocolat chaud', cat: 'Boissons chaudes', price: 3.0 },
    { name: 'Latte', cat: 'Boissons chaudes', price: 3.5 },
    { name: 'Mokaccino', cat: 'Boissons chaudes', price: 4.0 },

    { name: 'Eau 0.5L', cat: 'Boissons froides', price: 1.0 },
    { name: 'Eau gazeuse', cat: 'Boissons froides', price: 1.5 },
    { name: 'Soda', cat: 'Boissons froides', price: 2.0 },

    { name: 'Jus orange', cat: 'Jus', price: 4.0 },
    { name: 'Jus citron', cat: 'Jus', price: 3.5 },
    { name: 'Jus fraise', cat: 'Jus', price: 5.0 },
    { name: 'Cocktail fruits', cat: 'Jus', price: 6.0 },

    { name: 'Milkshake fraise', cat: 'Milkshake', price: 6.0 },
    { name: 'Milkshake chocolat', cat: 'Milkshake', price: 6.0 },
    { name: 'Milkshake banane', cat: 'Milkshake', price: 5.5 },

    { name: 'Gâteau chocolat', cat: 'Pâtisserie', price: 4.5 },
    { name: 'Tarte', cat: 'Pâtisserie', price: 4.0 },
    { name: 'Millefeuille', cat: 'Pâtisserie', price: 3.5 },
    { name: 'Cheesecake', cat: 'Pâtisserie', price: 5.0 },
    { name: 'Croissant', cat: 'Pâtisserie', price: 1.5 },

    { name: 'Sandwich thon', cat: 'Snack', price: 4.0 },
    { name: 'Sandwich poulet', cat: 'Snack', price: 5.0 },
    { name: 'Panini', cat: 'Snack', price: 5.5 },
    { name: 'Pizza', cat: 'Snack', price: 8.0 },

    { name: 'Crêpe chocolat', cat: 'Crêpes', price: 3.5 },
    { name: 'Crêpe nutella', cat: 'Crêpes', price: 4.0 },
    { name: 'Gaufre', cat: 'Crêpes', price: 4.0 },

    { name: 'Chicha simple', cat: 'Chicha', price: 10.0 },
    { name: 'Chicha premium', cat: 'Chicha', price: 15.0 },

    { name: 'Supplément lait', cat: 'Extras', price: 0.5 },
    { name: 'Supplément chocolat', cat: 'Extras', price: 0.5 },
    { name: 'Supplément fruit', cat: 'Extras', price: 1.0 },
  ];

  for (const fp of finishedProductsData) {
    if (posCategoriesMap[fp.cat]) {
      await prisma.product.create({
        data: {
          name: fp.name,
          price: fp.price,
          categoryId: posCategoriesMap[fp.cat],
          storeId: store.id
        }
      });
    }
  }

  // Also create demo tables
  const demoTables = ['T1', 'T2', 'T3', 'T4', 'T5'];
  await Promise.all(
    demoTables.map(label =>
      prisma.storeTable.create({
        data: { label, capacity: 4, storeId }
      })
    )
  );

  revalidatePath('/admin/products');
  revalidatePath('/admin/stock');
  revalidatePath('/admin/tables');
  revalidatePath('/admin/products/categories');
  return { success: true, message: 'Données demo ajoutées avec succès' };
}

export async function resetDemoDataAction(storeId: string) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (store?.isFiscalEnabled) {
    throw new Error("Impossible : Le mode fiscal NACEF est actif, l'historique des ventes est scellé et ne peut pas être effacé.");
  }

  const products: any[] = await prisma.product.findMany({ where: { storeId }, select: { id: true } });
  const productIds = products.map((p: any) => p.id);

  if (productIds.length > 0) {
    await prisma.recipeItem.deleteMany({ where: { productId: { in: productIds } } });
  }

  await prisma.saleItem.deleteMany({ where: { sale: { storeId } } });
  await prisma.sale.deleteMany({ where: { storeId } });
  await prisma.stockItem.deleteMany({ where: { storeId } });
  await prisma.product.deleteMany({ where: { storeId } });

  // Delete children first, then parents to avoid FK constraint errors
  await prisma.category.deleteMany({ where: { storeId, parentId: { not: null } } });
  await prisma.category.deleteMany({ where: { storeId } });

  await prisma.storeTable.deleteMany({ where: { storeId } });

  revalidatePath('/admin/products');
  revalidatePath('/admin/stock');
  revalidatePath('/admin/tables');
  revalidatePath('/admin/sales');
  revalidatePath('/admin/products/categories');
  return { success: true, message: 'Données demo supprimées' };
}

export async function generateZReportAction(terminalId?: string) {
  const store = await getStore();
  if (!store) throw new Error('Boutique non trouvée');

  const result = await (prisma as any).$transaction(async (tx: any) => {
    // 1. Trouver les ventes non clôturées
    const query: any = {
      storeId: store.id,
      isFiscal: true,
      zReportId: null
    };
    if (terminalId) query.terminalId = terminalId;

    const sales = await tx.sale.findMany({ where: query });
    if (sales.length === 0) {
      throw new Error('Aucune vente fiscale en attente de clôture.');
    }

    // 2. Calculer les totaux
    let totalHt = 0;
    let totalTtc = 0;
    let totalTax = 0;
    const taxBreakdown: Record<string, number> = {};

    sales.forEach((s: any) => {
      totalHt += Number(s.totalHt || 0);
      totalTtc += Number(s.total || 0);
      totalTax += Number(s.totalTax || 0);

      const breakdown = typeof s.taxBreakdown === 'string' ? JSON.parse(s.taxBreakdown) : (s.taxBreakdown || {});
      Object.entries(breakdown).forEach(([rate, amount]) => {
        taxBreakdown[rate] = (taxBreakdown[rate] || 0) + Number(amount);
      });
    });

    // 3. Chainage des hashs Z
    const lastZ = await tx.zReport.findFirst({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' }
    });
    const previousZHash = lastZ?.hash || '0'.repeat(64);

    // 4. Création du Hash du rapport
    const reportDay = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const hashInput = `${store.id}|${reportDay}|${totalTtc}|${now}|${previousZHash}`;
    const hash = crypto.createHash('sha256').update(hashInput).digest('hex');

    // 5. Créer le rapport Z
    const zReport = await tx.zReport.create({
      data: {
        storeId: store.id,
        terminalId: terminalId || null,
        reportDay,
        totalTtc: totalTtc,
        totalHt: totalHt,
        totalTax: totalTax,
        taxBreakdown: taxBreakdown,
        salesCount: sales.length,
        isClosed: true,
        hashInput,
        hash,
        previousZHash,
        createdAt: new Date(now)
      }
    });

    // 6. Lier les ventes au rapport
    await tx.sale.updateMany({
      where: query,
      data: { zReportId: zReport.id }
    });

    return zReport;
  });

  revalidatePath('/admin/reports');
  return JSON.parse(JSON.stringify(result));
}

export async function deleteZReportAction(reportId: string) {
  const store = await getStore();
  if (!store) throw new Error('Boutique non trouvée');

  // Verify ownership
  const report = await prisma.zReport.findFirst({
    where: { id: reportId, storeId: store.id }
  });
  if (!report) throw new Error('Rapport non trouvé');

  // Unlink sales
  await prisma.sale.updateMany({
    where: { zReportId: reportId },
    data: { zReportId: null }
  });

  await prisma.zReport.delete({
    where: { id: reportId }
  });

  revalidatePath('/admin/reports');
  return { success: true };
}

// ══════════════════════════════════════════════════════════════
//  POS ORDERS MANAGEMENT
// ══════════════════════════════════════════════════════════════

export async function getRecentOrders() {
  const store = await getStore();
  if (!store) throw new Error('Store not found');

  const sales = await prisma.sale.findMany({
    where: { storeId: store.id },
    include: {
      items: { include: { product: true } },
      customer: true,
      takenBy: true
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return sales.map(s => ({
    ...s,
    total: Number(s.total),
    subtotal: Number(s.subtotal),
    discount: Number(s.discount),
    totalHt: Number(s.totalHt || 0),
    totalTax: Number(s.totalTax || 0),
  }));
}

export async function voidSale(saleId: string) {
  const store = await getStore();
  if (!store) throw new Error('Store not found');

  // Mark as void
  const sale = await prisma.sale.update({
    where: { id: saleId, storeId: store.id },
    data: { isVoid: true },
    include: { items: { include: { product: true } } }
  });

  // Optional: Restore stock if desired
  for (const item of (sale as any).items) {
    const recipes = await prisma.recipeItem.findMany({
      where: { productId: item.productId }
    });

    for (const recipe of recipes) {
      const restoreQty = Number(recipe.quantity) * item.quantity;
      await prisma.stockItem.update({
        where: { id: recipe.stockItemId },
        data: { quantity: { increment: restoreQty } }
      });
    }
  }

  revalidatePath('/pos');
  return { success: true };
}

export async function getMarketplaceBundles() {
  const bundles = await (prisma as any).mktBundle.findMany({
    where: { isActive: true },
    include: {
      vendor: true,
      items: {
        include: {
          vendorProduct: {
            include: { productStandard: true }
          }
        }
      }
    }
  });

  return bundles.map((b: any) => ({
    ...b,
    price: Number(b.price),
    items: b.items.map((i: any) => ({
      ...i,
      quantity: Number(i.quantity),
      vendorProduct: {
        ...i.vendorProduct,
        name: i.vendorProduct.name || i.vendorProduct.productStandard?.name || 'Produit sans nom',
        price: Number(i.vendorProduct.price)
      }
    }))
  }));
}

export async function rateVendorAction(data: {
  orderId: string;
  speedScore: number;
  qualityScore: number;
  reliabilityScore: number;
  deliveryScore: number;
  comment?: string;
}) {
  const store = await getStore();
  if (!store) throw new Error('Non authentifié');

  const order = await prisma.supplierOrder.findUnique({
    where: { id: data.orderId },
    select: { vendorId: true, vendorPosId: true }
  });

  if (!order || !order.vendorId) throw new Error('Commande introuvable');

  const rating = await (prisma as any).vendorRating.create({
    data: {
      orderId: data.orderId,
      storeId: store.id,
      vendorId: order.vendorId,
      vendorPosId: order.vendorPosId,
      speedScore: data.speedScore,
      qualityScore: data.qualityScore,
      reliabilityScore: data.reliabilityScore,
      deliveryScore: data.deliveryScore,
      comment: data.comment
    }
  });

  revalidatePath('/marketplace');
  return rating;
}

export async function getStoreMarketplaceOrders() {
  const store = await getStore();
  if (!store) return [];

  return (prisma as any).supplierOrder.findMany({
    where: { storeId: store.id, vendorId: { not: null } },
    include: { 
      vendor: true, 
      vendorPos: true,
      rating: true,
      items: true 
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function updateVendorCustomizationAction(data: {
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  welcomeMessage?: string;
}) {
  const userId = cookies().get('userId')?.value;
  const user = await (prisma as any).user.findUnique({
    where: { id: userId || '' }
  });
  if (!user || !user.vendorProfileId) throw new Error('Non autorisé');

  const customization = await (prisma as any).vendorCustomization.upsert({
    where: { vendorId: user.vendorProfileId },
    update: data,
    create: {
      ...data,
      vendorId: user.vendorProfileId
    }
  });

  revalidatePath('/marketplace');
  return customization;
}



