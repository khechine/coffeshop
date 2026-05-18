'use server';

import { prisma, seedTunisianStarterPack } from '@coffeeshop/database';
import { revalidatePath } from 'next/cache';
import * as bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { sendMarketplaceEmail } from './lib/mail';

// ── Helpers (Updated for phone field) ──────────────────────────
export async function getVendorProfile() {
  const userId = cookies().get('userId')?.value;
  if (!userId) return null;
  return await (prisma as any).vendorProfile.findUnique({
    where: { userId }
  });
}

export async function getStore() {
  const userId = cookies().get('userId')?.value;
  if (!userId) return null;

  try {
    // Robust fetch for user and store
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { id: true, storeId: true }
    });

    if (user?.storeId) {
      const store = await (prisma as any).store.findUnique({
        where: { id: user.storeId },
        select: {
          id: true,
          name: true,
          city: true,
          industry: true,
          businessType: true,
          isFiscalEnabled: true,
          forceMarketplaceAccess: true,
          subscription: {
            select: {
              id: true,
              planId: true,
              plan: {
                select: {
                  id: true,
                  name: true,
                  hasMarketplace: true
                }
              }
            }
          },
          erpIntegration: true,
          wallet: true
        }
      });

      if (store) {
        const storeObj: any = store;
        const plan = storeObj?.subscription?.plan;

        // Combined access: from Plan OR manual override (Forced TRUE for all plans as per requirement)
        const hasMarketplace = true; // (plan?.hasMarketplace === true) || (storeObj?.forceMarketplaceAccess === true);
        storeObj.hasMarketplace = hasMarketplace;

        // Ensure wallet exists (Robustness check)
        if (!storeObj.wallet) {
          storeObj.wallet = await (prisma as any).storeWallet.create({
            data: { storeId: store.id, balance: 0 }
          });
        }

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
        select: {
          id: true,
          name: true,
          city: true,
          subscription: {
            select: {
              id: true,
              planId: true,
              plan: {
                select: {
                  id: true,
                  name: true,
                  hasMarketplace: true
                }
              }
            }
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

export async function getMarketplaceToken() {
  const userId = cookies().get('userId')?.value;
  if (!userId) return null;
  // Temporary token format expected by MarketplaceAuthGuard: "user-jwt-{userId}-{timestamp}"
  return `user-jwt-${userId}-${Date.now()}`;
}

export async function getConfirmedVendorIds() {
  try {
    const store = await getStore();
    if (!store) return [];

    const orders = await (prisma as any).supplierOrder.findMany({
      where: {
        storeId: store.id,
        status: 'CONFIRMED'
      },
      select: { vendorId: true }
    });

    const ids = Array.from(new Set(orders.map((o: any) => o.vendorId))).filter(Boolean);
    return JSON.parse(JSON.stringify(ids));
  } catch (err) {
    console.error('getConfirmedVendorIds error:', err);
    return [];
  }
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
export async function createProduct(data: { name: string; price: number; categoryId: string; unitId?: string; taxRate?: number; taxCode?: string; active?: boolean; canBeTakeaway?: boolean; image?: string | null; recipe?: { stockItemId: string; quantity: number; consumeType?: string; isPackaging?: boolean }[] }) {
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
      image: data.image,
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


export async function updateProduct(id: string, data: { name: string; price: number; categoryId: string; unitId?: string; taxRate?: number; taxCode?: string; active?: boolean; canBeTakeaway?: boolean; image?: string | null; recipe?: { stockItemId: string; quantity: number; consumeType?: string; isPackaging?: boolean }[] }) {
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
      image: data.image,
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
    officialDocs, industry, businessType
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
          trialEndsAt,
          industry: industry || 'COFFEE_SHOP',
          businessType: businessType || 'STORE',
          wallet: { create: { balance: 0 } }
        } as any
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
  revalidatePath('/superadmin/cafes');
  return { success: true };
}

export async function submitVendorPremiumRequestAction(data: { message?: string, phone: string, preferredContact: string }) {
  const user = await getUserContext();
  if (!user || user.role !== 'VENDOR') throw new Error('Non autorisé');

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: user.id }
  });

  if (!vendor) throw new Error('Profil vendeur non trouvé');

  await (prisma as any).vendorPremiumRequest.create({
    data: {
      vendorId: vendor.id,
      message: data.message,
      phone: data.phone,
      preferredContact: data.preferredContact,
      status: 'PENDING'
    }
  });

  return { success: true };
}

export async function updateVendorPremiumStatusAction(requestId: string, status: 'APPROVED' | 'REJECTED') {
  const user = await getUserContext();
  if (!user || user.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  const request = await (prisma as any).vendorPremiumRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) throw new Error('Demande non trouvée');

  await (prisma as any).vendorPremiumRequest.update({
    where: { id: requestId },
    data: { status }
  });

  if (status === 'APPROVED') {
    await prisma.vendorProfile.update({
      where: { id: request.vendorId },
      data: { isPremium: true }
    });
  }

  revalidatePath('/superadmin/vendors/premium');
  return { success: true };
}

export async function submitWalletRechargeRequestAction(formData: FormData) {
  const user = await getUserContext();
  if (!user || !user.storeId) throw new Error('Non autorisé');

  const amount = Number(formData.get('amount'));
  const proofFile = formData.get('proofFile') as File;

  let proofUrl = '';
  if (proofFile && proofFile.size > 0) {
    const { uploadFile } = await import('./lib/upload');
    proofUrl = await uploadFile(proofFile);
  }

  await (prisma as any).storeWalletRechargeRequest.create({
    data: {
      storeId: user.storeId,
      amount: amount,
      proofUrl: proofUrl,
      status: 'PENDING'
    }
  });

  revalidatePath('/admin/subscription');
  return { success: true };
}

export async function updateWalletRechargeStatusAction(requestId: string, status: 'APPROVED' | 'REJECTED') {
  const user = await getUserContext();
  if (!user || user.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  const request = await (prisma as any).storeWalletRechargeRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) throw new Error('Demande non trouvée');

  await (prisma as any).storeWalletRechargeRequest.update({
    where: { id: requestId },
    data: { status }
  });

  if (status === 'APPROVED') {
    const wallet = await (prisma as any).storeWallet.findUnique({
      where: { storeId: request.storeId }
    });

    if (!wallet) {
      await (prisma as any).storeWallet.create({
        data: {
          storeId: request.storeId,
          balance: request.amount,
          transactions: {
            create: {
              amount: request.amount,
              type: 'DEPOSIT',
              description: 'Recharge Wallet (Virement/Preuve)'
            }
          }
        }
      });
    } else {
      await (prisma as any).storeWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: request.amount },
          transactions: {
            create: {
              amount: request.amount,
              type: 'DEPOSIT',
              description: 'Recharge Wallet (Virement/Preuve)'
            }
          }
        }
      });
    }
  }

  revalidatePath('/superadmin/wallets/recharges');
  return { success: true };
}

export async function loginUser(email: string, pass: string) {
  // Use explicit select to avoid crashing on missing DB columns (like notifyEmailMessages)
  const user = await (prisma as any).user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      role: true,
      storeId: true,
      permissions: true,
      defaultPosMode: true
    }
  });

  if (!user) return { error: 'Utilisateur non trouvé' };

  const isMatch = await bcrypt.compare(pass, user.password);
  if (!isMatch) return { error: 'Mot de passe incorrect' };


  // Trace the login
  try {
    const reqHeaders = headers();
    const ip = reqHeaders.get('x-forwarded-for') || reqHeaders.get('x-real-ip') || 'Unknown IP';
    const userAgent = reqHeaders.get('user-agent') || 'Unknown Device';

    // Parse basic device type from User-Agent
    let device = 'Desktop';
    if (/mobile/i.test(userAgent)) device = 'Mobile';
    if (/tablet|ipad/i.test(userAgent)) device = 'Tablet';

    await (prisma as any).userLoginLog.create({
      data: {
        userId: user.id,
        ip,
        userAgent,
        device
      }
    });
  } catch (err) {
    console.error('Failed to log user login (schema might need db push):', err);
  }

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

export async function getUserLoginHistory(userId: string) {
  try {
    return await (prisma as any).userLoginLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  } catch (err) {
    console.error('Failed to fetch user login history:', err);
    return [];
  }
}

export async function getStoreLoginHistory(storeId: string) {
  try {
    const owners = await (prisma as any).user.findMany({
      where: { storeId, role: 'STORE_OWNER' }
    });
    const ownerIds = owners.map((o: any) => o.id);
    return await (prisma as any).userLoginLog.findMany({
      where: { userId: { in: ownerIds } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true } } }
    });
  } catch (err) {
    console.error('Failed to fetch store login history:', err);
    return [];
  }
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

  if (store.isRestricted) {
    throw new Error('ACCES_RESTREINT : Votre accès au POS est restreint en raison d\'un solde négatif. Veuillez alimenter votre wallet.');
  }

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
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function getMarketplaceData(userLat?: number, userLng?: number, radius?: number, ecoOnly: boolean = false, tunisiaOnly: boolean = false) {
  // If radius is not provided, try to get it from cookies
  let activeRadius = radius;
  if (activeRadius === undefined) {
    const cookieRadius = cookies().get('mkt_radius')?.value;
    if (cookieRadius && cookieRadius !== 'all') {
      const parsed = parseInt(cookieRadius);
      if (!isNaN(parsed)) activeRadius = parsed;
    }
  }
  // Default fallback if still undefined
  if (activeRadius === undefined) activeRadius = 500;

  const hasWalletModel = !!(prisma as any).vendorWallet;
  let activeVendorIds: Set<string> | null = null;

  if (hasWalletModel) {
    try {
      const allWallets = await (prisma as any).vendorWallet.findMany({
        select: { vendorId: true, balance: true }
      });

      // Count ALL pending/confirmed orders per vendor
      const pendingOrdersCounts = await (prisma as any).supplierOrder.groupBy({
        by: ['vendorId'],
        where: { status: { in: ['PENDING', 'CONFIRMED'] } },
        _count: { _all: true }
      });
      const pendingMap = new Map<string, number>(pendingOrdersCounts.map((x: any) => [x.vendorId, Number(x._count._all)]));

      // Vendors with pending deposit in last 72h (Grace Period)
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const graceRequests = await (prisma as any).walletDepositRequest.findMany({
        where: {
          status: 'PENDING',
          createdAt: { gte: threeDaysAgo }
        },
        select: { vendorId: true }
      });
      const graceSet = new Set(graceRequests.map((r: any) => r.vendorId));

      const activeIds = new Set<string>();

      // Active if: balance >= 0 OR in grace period OR (balance < 0 AND pendingOrders < 2)
      for (const w of allWallets) {
        if (
          Number(w.balance) >= 0 ||
          graceSet.has(w.vendorId) ||
          (Number(w.balance) < 0 && (pendingMap.get(w.vendorId) || 0) < 2)
        ) {
          activeIds.add(w.vendorId);
        }
      }

      // Also add vendors who don't have a wallet created yet (default active)
      const allVendors = await (prisma as any).vendorProfile.findMany({ select: { id: true } });
      const walletVendorIds = new Set(allWallets.map((w: any) => w.vendorId));
      for (const v of allVendors) {
        if (!walletVendorIds.has(v.id)) {
          activeIds.add(v.id);
        }
      }

      activeVendorIds = activeIds;
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

  const productWhere: any = {};
  const bundleWhere: any = {};

  let ecoCategoryIds: string[] = [];
  if (ecoOnly) {
    try {
      const ecoCats = await (prisma as any).marketplaceCategory.findMany({
        where: {
          OR: [
            { name: { contains: 'Bio', mode: 'insensitive' } },
            { name: { contains: 'Eco', mode: 'insensitive' } },
            { name: { contains: 'Vert', mode: 'insensitive' } },
            { name: { contains: 'Naturel', mode: 'insensitive' } },
            { name: { contains: 'Durable', mode: 'insensitive' } }
          ]
        },
        select: { id: true }
      });
      ecoCategoryIds = ecoCats.map((c: any) => c.id);
    } catch (e) {
      console.error('Failed to fetch eco categories:', e);
    }

    productWhere.OR = [
      { vendor: { isEcoResponsible: true } },
      { tags: { hasSome: ['Bio', 'Éco-responsable', 'Naturel', '🌱', 'Eco', 'Recyclé', '🌱 Éco-responsable'] } },
      { name: { contains: 'Bio', mode: 'insensitive' } },
      { categoryId: { in: ecoCategoryIds } }
    ];
    bundleWhere.vendor = { isEcoResponsible: true };
  }

  if (tunisiaOnly) {
    productWhere.tags = { hasSome: ['Tunisie', '🇹🇳 Produit Tunisien'] };
    // Bundles don't have tags, so we might filter by vendor address or just skip
    // For now, let's keep bundleWhere simple or skip tunisiaOnly for bundles if no tags
  }

  const [categories, featuredRaw, flashSalesRaw, productsRaw, bundlesRaw, bannersRaw] = await Promise.all([
    (prisma as any).marketplaceCategory.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true
          }
        }
      }
    }),
    (prisma as any).vendorProduct.findMany({
      where: { ...productWhere, isFeatured: true },
      include: {
        vendor: { include: { customization: true } },
        productStandard: true,
        posStocks: { include: { vendorPos: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    (prisma as any).vendorProduct.findMany({
      where: { ...productWhere, isFlashSale: true },
      include: {
        vendor: true,
        productStandard: true,
        posStocks: { include: { vendorPos: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    (prisma as any).vendorProduct.findMany({
      where: { ...productWhere },
      include: {
        vendor: true,
        productStandard: true,
        posStocks: { include: { vendorPos: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    (prisma as any).mktBundle.findMany({
      where: { ...bundleWhere, isActive: true },
      include: {
        vendor: true,
        items: { include: { vendorProduct: { include: { productStandard: true } } } }
      }
    }),
    (prisma as any).marketplaceBanner.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }]
    }).catch(() => []) // Graceful degradation if migration hasn't run yet
  ]);


  // Filter in memory if we have wallet data, otherwise show all (graceful degradation)
  const filterByWallet = (list: any[]) => {
    if (!activeVendorIds) return list;
    return list.filter(item => activeVendorIds!.has(item.vendorId));
  };


  // Build a flat lookup map from the hierarchical categories for fast product->category resolution
  const categoryLookup = new Map<string, { id: string; name: string; icon?: string; color?: string; parentId?: string | null }>();
  for (const root of categories) {
    categoryLookup.set(root.id, { id: root.id, name: root.name, icon: root.icon, color: root.color, parentId: null });
    for (const child of (root.children || [])) {
      categoryLookup.set(child.id, { id: child.id, name: child.name, icon: child.icon, color: child.color, parentId: root.id });
      for (const grandchild of (child.children || [])) {
        categoryLookup.set(grandchild.id, { id: grandchild.id, name: grandchild.name, icon: grandchild.icon, color: grandchild.color, parentId: child.id });
      }
    }
  }



  const mapProduct = async (p: any, confirmedIds: string[]) => {
    const isUnlocked = confirmedIds.includes(p.vendorId);

    const vendorData = p.vendor ? {
      id: p.vendor.id,
      userId: p.vendor.userId,
      companyName: p.vendor.companyName,
      city: p.vendor.city,
      isPremium: p.vendor.isPremium,
      isEcoResponsible: p.vendor.isEcoResponsible,
      customization: p.vendor.customization,
      lat: p.vendor.lat ? Number(p.vendor.lat) : null,
      lng: p.vendor.lng ? Number(p.vendor.lng) : null,
      // Contact info ONLY if unlocked
      phone: isUnlocked ? p.vendor.phone : undefined,
      email: isUnlocked ? p.vendor.email : undefined,
      address: isUnlocked ? p.vendor.address : undefined,
    } : null;


    const catId = p.categoryId || p.productStandard?.categoryId;
    const subCatId = p.subcategoryId || p.productStandard?.subcategoryId;
    const resolvedCat = catId ? categoryLookup.get(catId) : null;
    const resolvedSubCat = subCatId ? categoryLookup.get(subCatId) : null;

    const result: any = {
      id: p.id,
      name: p.name || p.productStandard?.name || 'Produit sans nom',
      unit: p.unit || p.productStandard?.unit || 'unité',
      categoryId: catId,
      subcategoryId: subCatId,
      mktCategoryId: catId,
      mktCategory: resolvedCat || null,
      mktSubcategory: resolvedSubCat || null,
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

  const mapBundle = (b: any, confirmedIds: string[]) => {
    const isUnlocked = confirmedIds.includes(b.vendorId);
    const distance = (userLat && userLng && b.vendor?.lat && b.vendor?.lng)
      ? calculateDistance(userLat, userLng, Number(b.vendor.lat), Number(b.vendor.lng))
      : null;


    return {
      ...b,
      vendor: b.vendor ? {
        id: b.vendor.id,
        companyName: b.vendor.companyName,
        city: b.vendor.city,
        isPremium: b.vendor.isPremium,
        isEcoResponsible: b.vendor.isEcoResponsible,
        customization: b.vendor.customization,
        lat: b.vendor.lat ? Number(b.vendor.lat) : null,
        lng: b.vendor.lng ? Number(b.vendor.lng) : null,
        phone: isUnlocked ? b.vendor.phone : undefined,
        email: isUnlocked ? b.vendor.email : undefined,
        address: isUnlocked ? b.vendor.address : undefined,
      } : null,
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

  const confirmedIds = await getConfirmedVendorIds();

  let featured = await Promise.all(filterByWallet(featuredRaw).map(p => mapProduct(p, confirmedIds)));
  let flashSales = await Promise.all(filterByWallet(flashSalesRaw).map(p => mapProduct(p, confirmedIds)));
  let products = await Promise.all(filterByWallet(productsRaw).map(p => mapProduct(p, confirmedIds)));
  let bundles = filterByWallet(bundlesRaw).map(b => mapBundle(b, confirmedIds));


  // Filter by distance if radius is specified and user coords are available
  // Treat 500km+ as National (no filter)
  if (userLat && userLng && activeRadius && activeRadius < 500) {
    const filterByDistance = (item: any) => {
      if (item.distance === null) return false;
      return item.distance <= activeRadius;
    };
    products = products.filter(filterByDistance);
    bundles = bundles.filter(filterByDistance);
    featured = featured.filter(filterByDistance);
    flashSales = flashSales.filter(filterByDistance);
  }

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
    })),
    banners: bannersRaw || []
  };
}

export async function createMarketplaceRFQ(data: {
  title: string;
  category: string;
  description: string;
  quantity: number;
  budget?: number;
  deadline?: string;
}) {
  const store = await getStore();
  if (!store) throw new Error('Store not found');

  const config = await (prisma as any).marketplaceConfig.findUnique({ where: { id: "default" } });
  const hours = config?.rfqExpirationHours || 48;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);

  const rfq = await (prisma as any).marketplaceRFQ.create({
    data: {
      storeId: store.id,
      title: data.title,
      category: data.category,
      description: data.description,
      quantity: data.quantity,
      budget: data.budget,
      deadline: data.deadline ? new Date(data.deadline) : null,
      expiresAt: expiresAt,
    }
  });

  // Notify potential vendors or SuperAdmin
  await sendTradeNotificationAction({
    userId: 'SUPERADMIN_ID_OR_LOGIC', // Replace with dynamic logic
    type: 'RFQ_NEW',
    title: 'Nouvelle demande d\'offre',
    content: `Une nouvelle demande RFQ "${data.title}" a été publiée par ${store.name}.`,
    metadata: { rfqId: rfq.id }
  });

  return rfq;
}

export async function getMarketplaceSectors() {
  return await (prisma as any).mktCategory.findMany({
    orderBy: { sortOrder: 'asc' }
  });
}

export async function getStoreRFQs() {
  const store = await getStore();
  if (!store) return [];

  return await (prisma as any).marketplaceRFQ.findMany({
    where: { storeId: store.id },
    include: {
      quotes: {
        include: { vendor: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getMarketplaceRFQs(vendorId?: string) {
  const where: any = {};

  if (vendorId) {
    const vendor = await (prisma as any).vendorProfile.findUnique({
      where: { id: vendorId },
      include: { mktSectors: true }
    });

    if (vendor && vendor.mktSectors.length > 0 && vendor.mktSectors.length < 8) {
      const sectorNames = vendor.mktSectors.map((s: any) => s.name);
      where.category = { in: sectorNames };
    }
  }

  return await (prisma as any).marketplaceRFQ.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      store: {
        select: { name: true, city: true }
      },
      quotes: {
        where: vendorId ? { vendorId: vendorId } : undefined,
        include: { vendor: true }
      }
    }
  });
}

export async function submitMarketplaceQuote(data: {
  rfqId: string;
  vendorId: string;
  price: number;
  notes?: string;
}) {
  // Prevent duplicate quotes
  const existing = await (prisma as any).marketplaceQuote.findFirst({
    where: {
      rfqId: data.rfqId,
      vendorId: data.vendorId
    }
  });

  if (existing) {
    throw new Error('Vous avez déjà envoyé une proposition pour cette demande.');
  }

  const quote = await (prisma as any).marketplaceQuote.create({
    data: {
      rfqId: data.rfqId,
      vendorId: data.vendorId,
      price: data.price,
      notes: data.notes,
    }
  });

  // Notify buyer
  const rfq = await (prisma as any).marketplaceRFQ.findUnique({ where: { id: data.rfqId }, include: { store: { include: { owner: true } } } });
  if (rfq?.store?.owner) {
    await sendTradeNotificationAction({
      userId: rfq.store.owner.id,
      type: 'RFQ_QUOTE',
      title: 'Nouvelle proposition',
      content: `Un vendeur a soumis une proposition pour votre demande : ${rfq.title}`,
      metadata: { quoteId: quote.id }
    });
  }

  revalidatePath('/vendor/portal/rfq');
  revalidatePath('/marketplace/my-requests');

  return quote;
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
  const all = await (prisma as any).marketplaceCategory.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: {
          children: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
  return all;
}

// ── Vendor proposes a new subcategory (status = PENDING → admin approves) ──────
export async function proposeSubCategoryAction(name: string, categoryId: string) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const user = await (prisma as any).user.findUnique({
    where: { id: userId },
    select: { id: true, role: true }
  });
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

export async function getUserContext() {
  const userId = cookies().get('userId')?.value;
  if (!userId) return null;

  const user = await (prisma as any).user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
      storeId: true,
      store: {
        select: {
          id: true,
          name: true,
          city: true,
          subscription: {
            select: {
              id: true,
              planId: true,
              plan: {
                select: {
                  id: true,
                  name: true,
                  hasMarketplace: true
                }
              }
            }
          },
          erpIntegration: true
        }
      },
      vendorProfile: true
    }
  });

  if (!user) return null;

  // Add marketplace access flag
  const userObj = JSON.parse(JSON.stringify(user));
  userObj.hasMarketplace = true; // Simplified for now

  return userObj;
}
export async function resolveCategoryProposal(id: string, action: 'approve' | 'reject', newName?: string, newCategoryId?: string) {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
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

export async function updateMarketplaceCategoryAction(id: string, data: { name?: string; icon?: string; image?: string; color?: string; parentId?: string; groupTitle?: string }) {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
  if (!user || user.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  await (prisma as any).marketplaceCategory.update({
    where: { id },
    data: {
      name: data.name?.trim(),
      icon: data.icon?.trim(),
      image: data.image?.trim(),
      color: data.color?.trim(),
      groupTitle: data.groupTitle?.trim(),
      parentId: data.parentId || null,
    }
  });

  revalidatePath('/superadmin/marketplace/categories');
  revalidatePath('/marketplace');
}

export async function migrateSubcategoryAction(subcategoryId: string, newCategoryId: string) {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
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

  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
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

  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
  if (!user || user.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  const category = await (prisma as any).marketplaceCategory.findUnique({
    where: { id },
    include: { _count: { select: { children: true } } }
  });

  if (category?._count.children > 0) {
    throw new Error('Impossible de supprimer une catégorie non vide (contient des sous-catégories).');
  }

  await (prisma as any).marketplaceCategory.delete({ where: { id } });

  revalidatePath('/superadmin/marketplace/categories');
  revalidatePath('/marketplace');
}

// ============================================
// MARKETPLACE BANNER ACTIONS
// ============================================

export async function getMarketplaceBannersAdmin() {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) throw new Error('Non autorisé');
  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
  if (!user || user.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  return (prisma as any).marketplaceBanner.findMany({
    orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }]
  });
}

export async function upsertMarketplaceBannerAction(data: {
  id?: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl: string;
  position: string;
  bgColor?: string;
  badgeText?: string;
  isActive: boolean;
  sortOrder: number;
}) {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) throw new Error('Non autorisé');
  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
  if (!user || user.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  const { id, ...rest } = data;

  if (id) {
    await (prisma as any).marketplaceBanner.update({ where: { id }, data: rest });
  } else {
    await (prisma as any).marketplaceBanner.create({ data: rest });
  }

  revalidatePath('/superadmin/marketplace/banners');
  revalidatePath('/marketplace');
}

export async function deleteMarketplaceBannerAction(id: string) {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) throw new Error('Non autorisé');
  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
  if (!user || user.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  await (prisma as any).marketplaceBanner.delete({ where: { id } });
  revalidatePath('/superadmin/marketplace/banners');
  revalidatePath('/marketplace');
}

export async function createMarketplaceCategoryAction(data: { name: string; icon?: string; image?: string; color?: string; parentId?: string; groupTitle?: string }) {

  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
  if (!user || user.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  await (prisma as any).marketplaceCategory.create({
    data: {
      name: data.name,
      slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      icon: data.icon,
      image: data.image,
      color: data.color,
      groupTitle: data.groupTitle,
      parentId: data.parentId || null,
    }
  });
  revalidatePath('/superadmin/marketplace/categories');
  revalidatePath('/marketplace');
}

export async function getMarketplaceProductAction(id: string) {
  const product = await (prisma as any).vendorProduct.findUnique({
    where: { id },
    include: {
      productStandard: true,
      vendor: {
        include: { customization: true }
      }
    }
  });

  if (product) {
    const catId = product.categoryId || product.productStandard?.categoryId;
    if (catId) {
      const category = await (prisma as any).marketplaceCategory.findUnique({
        where: { id: catId }
      });
      (product as any).category = category;
    }
  }

  return product;
}

export async function getMarketplaceBundleAction(id: string) {
  try {
    const bundle = await (prisma as any).mktBundle.findUnique({
      where: { id },
      include: {
        vendor: { include: { customization: true } },
        items: { include: { vendorProduct: true } }
      }
    });

    if (bundle && bundle.items && bundle.items.length > 0) {
      const catId = bundle.items[0].vendorProduct?.categoryId;
      if (catId) {
        const category = await (prisma as any).marketplaceCategory.findUnique({
          where: { id: catId }
        });
        (bundle as any).category = category;
        (bundle as any).categoryId = catId;
      }
    }

    return bundle;
  } catch (e) {
    console.error("getMarketplaceBundleAction Error:", e);
    return null;
  }
}

export async function getRelatedProductsAction(categoryId: string, excludeId: string) {
  return await (prisma as any).vendorProduct.findMany({
    where: {
      categoryId,
      id: { not: excludeId }
    },
    take: 10,
    include: {
      vendor: {
        include: { customization: true }
      }
    }
  });
}

export async function placeMarketplaceOrder(data: { vendorId: string; total: number; vendorPosId?: string; items: { productId?: string; bundleId?: string; quantity: number; price: number; name: string }[] }) {
  const store = await getStore();
  if (!store) throw new Error('Store not found');

  // ── CLIENT (STORE) WALLET & RESTRICTION CHECK ────────────────
  if (store.isRestricted) {
    throw new Error('ACCES_RESTREINT : Votre accès aux services est restreint en raison d\'un solde négatif. Veuillez alimenter votre wallet.');
  }

  // Calculate Commission based on Store's Plan or Override
  const commissionRate = Number(store.customCommissionRate || store.subscription?.plan?.defaultCommissionRate || 0.02);
  const commissionAmount = Number(data.total) * commissionRate;

  const storeWallet = await (prisma as any).storeWallet.findUnique({ where: { storeId: store.id } });

  if (storeWallet) {
    const balance = Number(storeWallet.balance);

    if (balance < 0) {
      if (store.marketplaceGraceOrders >= 2) {
        // Enforce restriction
        await (prisma as any).store.update({
          where: { id: store.id },
          data: { isRestricted: true }
        });
        throw new Error('ACCES_RESTREINT : Limite de commandes de grâce atteinte (2). Veuillez alimenter votre wallet pour continuer.');
      }
    }

    // Debit the commission
    await (prisma as any).$transaction([
      (prisma as any).storeWallet.update({
        where: { id: storeWallet.id },
        data: { balance: { decrement: commissionAmount } }
      }),
      (prisma as any).storeWalletTransaction.create({
        data: {
          walletId: storeWallet.id,
          amount: -commissionAmount,
          type: 'MARKETPLACE_COMMISSION',
          description: `Commission sur commande Marketplace (Taux: ${commissionRate * 100}%)`,
          metadata: { total: data.total, vendorId: data.vendorId }
        }
      }),
      (prisma as any).store.update({
        where: { id: store.id },
        data: {
          marketplaceGraceOrders: balance < 0 ? { increment: 1 } : undefined,
          lastBillingAlertAt: balance < 0 ? new Date() : undefined // Mark as alerted if negative
        }
      })
    ]);
  }

  // ── VENDOR WALLET CHECK (Existing logic) ──────────────────────
  try {
    const vendorWallet = await (prisma as any).vendorWallet.findUnique({
      where: { vendorId: data.vendorId }
    });
    if (vendorWallet && Number(vendorWallet.balance) < 0) {
      const pendingOrdersCount = await (prisma as any).supplierOrder.count({
        where: {
          vendorId: data.vendorId,
          status: { in: ['PENDING', 'CONFIRMED'] }
        }
      });
      if (pendingOrdersCount >= 2) {
        throw new Error(
          'VENDOR_UNAVAILABLE:Ce fournisseur est temporairement indisponible pour de nouvelles commandes. Des transactions sont en cours de traitement. Veuillez réessayer ultérieurement.'
        );
      }
    }
  } catch (e: any) {
    if (e.message?.startsWith('VENDOR_UNAVAILABLE:')) throw e;
  }

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

  const order = await (prisma as any).supplierOrder.create({
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

  // Notify Vendor via Email & In-app
  try {
    const vendorUser = await (prisma as any).user.findFirst({
      where: { vendorProfile: { id: data.vendorId } },
      select: { id: true }
    });
    if (vendorUser) {
      await sendTradeNotificationAction({
        userId: vendorUser.id,
        type: 'ORDER_UPDATE',
        title: 'Nouvelle Commande Panier',
        content: `Vous avez reçu une nouvelle commande de ${store.name} pour un montant de ${data.total} DT.`,
        metadata: { orderId: order.id }
      });

      // Update Vendor CRM
      try {
        await (prisma as any).vendorCustomer.upsert({
          where: {
            vendorId_storeId: {
              vendorId: data.vendorId,
              storeId: store.id
            }
          },
          update: {
            totalSpent: { increment: data.total },
            orderCount: { increment: 1 }
          },
          create: {
            vendorId: data.vendorId,
            storeId: store.id,
            totalSpent: data.total,
            orderCount: 1,
            category: 'REGULAR',
            tags: []
          }
        });
      } catch (crmErr) {
        console.error('Failed to update Vendor CRM:', crmErr);
      }
    }
  } catch (e) {
    console.error('Order notification failed:', e);
  }

  // Track B2B Customer in Vendor's CRM
  try {
    await (prisma as any).vendorCustomer.upsert({
      where: {
        vendorId_storeId: {
          vendorId: data.vendorId,
          storeId: store.id
        }
      },
      update: {
        orderCount: { increment: 1 },
        totalSpent: { increment: data.total }
      },
      create: {
        vendorId: data.vendorId,
        storeId: store.id,
        orderCount: 1,
        totalSpent: data.total,
        category: 'REGULAR'
      }
    });
  } catch (err) {
    console.error('Failed to update vendor customer tracking', err);
  }

  revalidatePath('/marketplace/my-orders');
  revalidatePath('/admin/orders');
  return order;
}

export async function updateVendorCustomerAction(customerId: string, data: { name?: string; email?: string; phone?: string; category?: string; tags?: string[] }) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Unauthorized');

  const updateData: any = { ...data };
  if (data.tags) {
    updateData.tags = { set: data.tags };
  }

  return await (prisma as any).vendorCustomer.update({
    where: { id: customerId },
    data: updateData
  });
}

export async function createVendorClientListAction(name: string, customerIds: string[]) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Unauthorized');

  const vendor = await (prisma as any).vendorProfile.findFirst({ where: { userId } });
  if (!vendor) throw new Error('Vendor not found');

  return await (prisma as any).vendorClientList.create({
    data: {
      name,
      vendor: { connect: { id: vendor.id } },
      customers: {
        connect: customerIds.map(id => ({ id }))
      }
    },
    include: {
      _count: {
        select: { customers: true }
      }
    }
  });
}

export async function addCustomersToClientListAction(listId: string, customerIds: string[]) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Unauthorized');

  return await (prisma as any).vendorClientList.update({
    where: { id: listId },
    data: {
      customers: {
        connect: customerIds.map(id => ({ id }))
      }
    }
  });
}

export async function getVendorClientListsAction() {
  const userId = cookies().get('userId')?.value;
  if (!userId) return [];

  const vendor = await (prisma as any).vendorProfile.findFirst({ where: { userId } });
  if (!vendor) return [];

  return await (prisma as any).vendorClientList.findMany({
    where: { vendorId: vendor.id },
    include: {
      _count: {
        select: { customers: true }
      },
      customers: {
        select: { tags: true }
      }
    }
  });
}

export async function getVendorMarketingTemplatesAction() {
  const userId = cookies().get('userId')?.value;
  if (!userId) return [];

  const vendor = await (prisma as any).vendorProfile.findFirst({ where: { userId } });
  if (!vendor) return [];

  return await (prisma as any).vendorMarketingTemplate.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createVendorMarketingTemplateAction(data: { name: string; content: string; type: string }) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Unauthorized');

  const vendor = await (prisma as any).vendorProfile.findFirst({ where: { userId } });
  if (!vendor) throw new Error('Vendor not found');

  return await (prisma as any).vendorMarketingTemplate.create({
    data: {
      ...data,
      vendor: { connect: { id: vendor.id } }
    }
  });
}

export async function deleteVendorMarketingTemplateAction(id: string) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Unauthorized');

  return await (prisma as any).vendorMarketingTemplate.delete({
    where: { id }
  });
}

export async function getAvailableStoresAction(search?: string) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Unauthorized');

  const vendor = await (prisma as any).vendorProfile.findFirst({
    where: { userId }
  });
  if (!vendor) throw new Error('Vendor not found');

  // Find stores that are NOT already customers of this vendor
  return await (prisma as any).store.findMany({
    where: {
      name: search ? { contains: search, mode: 'insensitive' } : undefined,
      NOT: {
        vendorCustomers: {
          some: { vendorId: vendor.id }
        }
      }
    },
    take: 10,
    select: {
      id: true,
      name: true,
      city: true,
      address: true
    }
  });
}

export async function addVendorCustomerAction(storeId: string) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Unauthorized');

  const vendor = await (prisma as any).vendorProfile.findFirst({
    where: { userId }
  });
  if (!vendor) throw new Error('Vendor not found');

  return await (prisma as any).vendorCustomer.upsert({
    where: {
      vendorId_storeId: {
        vendorId: vendor.id,
        storeId
      }
    },
    update: {},
    create: {
      vendorId: vendor.id,
      storeId,
      category: 'REGULAR',
      tags: [],
      totalSpent: 0,
      orderCount: 0
    },
    include: { store: true }
  });
}

export async function createManualVendorCustomerAction(data: { name: string; email?: string; phone?: string; category?: string; tags?: string[] }) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Unauthorized');

  const vendor = await (prisma as any).vendorProfile.findFirst({ where: { userId } });
  if (!vendor) throw new Error('Vendor not found');

  return await (prisma as any).vendorCustomer.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      category: data.category || 'REGULAR',
      tags: data.tags || [],
      vendor: { connect: { id: vendor.id } },
      totalSpent: 0,
      orderCount: 0
    }
  });
}

export async function importVendorCustomersCSVAction(customersData: any[]) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Unauthorized');

  const vendor = await (prisma as any).vendorProfile.findFirst({ where: { userId } });
  if (!vendor) throw new Error('Vendor not found');

  const results = [];
  for (const item of customersData) {
    try {
      const customer = await (prisma as any).vendorCustomer.create({
        data: {
          vendor: { connect: { id: vendor.id } },
          name: item.name,
          email: item.email,
          phone: item.phone,
          category: item.category || 'REGULAR',
          tags: item.tags || []
        }
      });
      results.push(customer);
    } catch (e) {
      console.error('Import row failed:', e);
    }
  }
  return results;
}

export async function createVendorCampaignAction(data: { 
  name: string; 
  type: 'EMAIL' | 'SMS' | 'WHATSAPP'; 
  content: string; 
  targetTags?: string[];
  targetListId?: string;
  recipientCount?: number;
}) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Unauthorized');

  const vendor = await (prisma as any).vendorProfile.findFirst({ where: { userId } });
  if (!vendor) throw new Error('Vendor not found');

  return await (prisma as any).vendorCampaign.create({
    data: {
      name: data.name,
      type: data.type,
      content: data.content,
      targetTags: data.targetTags || [],
      targetListId: data.targetListId,
      recipientCount: data.recipientCount || 0,
      vendor: { connect: { id: vendor.id } },
      status: 'SENT',
      sentAt: new Date()
    }
  });
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
  revalidatePath('/vendor/portal/settings');
}

export async function deleteVendorPosAction(id: string) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const pos = await (prisma as any).vendorPos.findUnique({
    where: { id },
    include: { vendor: true }
  });

  if (!pos || pos.vendor.userId !== userId) throw new Error('Accès refusé');

  await (prisma as any).vendorPos.delete({
    where: { id }
  });
  revalidatePath('/vendor/portal/settings');
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
      store: {
        include: {
          vendorCustomers: {
            where: { vendorId: vendor.id }
          }
        }
      },
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
    if (!s.vendorProduct) return;
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



export async function getVendorPremiumStockAlertsAction() {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');
  
  const vendor = await (prisma as any).vendorProfile.findFirst({ where: { userId }});
  if (!vendor || !vendor.isPremium) throw new Error('Accès réservé aux vendeurs premium');

  const orders = await (prisma as any).supplierOrder.findMany({
    where: { vendorId: vendor.id, status: { in: ['DELIVERED', 'PAID'] } },
    select: { storeId: true }
  });
  const storeIds = Array.from(new Set(orders.map((o: any) => o.storeId)));

  if (storeIds.length === 0) return [];

  const vendorProducts = await (prisma as any).vendorProduct.findMany({
    where: { vendorId: vendor.id },
    include: { productStandard: true }
  });
  const vendorProductNames = vendorProducts.map((p: any) => p.name || p.productStandard?.name).filter(Boolean);

  const stockItems = await (prisma as any).stockItem.findMany({
    where: { storeId: { in: storeIds } },
    include: { store: true }
  });

  const alerts = stockItems.filter((item: any) => {
    const qty = Number(item.quantity || 0);
    const minTh = Number(item.minThreshold || 0);
    
    if (qty > minTh && qty > 0) return false;
    if (item.preferredVendorId === vendor.id) return true;
    return vendorProductNames.includes(item.name);
  });

  return JSON.parse(JSON.stringify(alerts));
}

export async function getVendorPortalData() {
  const userId = cookies().get('userId')?.value;
  if (!userId) return null;

  // Robust separate fetches to avoid Prisma runtime issues
  const user = await (prisma as any).user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  });

  if (!user) return null;

  const vendorProfile = await (prisma as any).vendorProfile.findFirst({
    where: { userId: user.id }
  });

  if (!vendorProfile) return null;

  let vendor: any = null;
  try {
    vendor = await (prisma as any).vendorProfile.findUnique({
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
        // wallet removed here as it is fetched separately below
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
          include: {
            items: true,
            store: {
              include: {
                vendorCustomers: {
                  where: { vendorId: vendorProfile.id }
                }
              }
            }
          },
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
          include: {
            store: {
              include: {
                orders: {
                  where: { vendorId: vendorProfile.id },
                  orderBy: { createdAt: 'desc' },
                  take: 5,
                  include: { items: true }
                }
              }
            }
          }
        },
        campaigns: true,
        collections: true,
      }
    });
  } catch (e) {
    console.error("Deep vendor fetch failed:", e);
    vendor = await (prisma as any).vendorProfile.findUnique({
      where: { id: vendorProfile.id }
    });
  }

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

        // Grace period check: only active when balance is negative AND a deposit is pending
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const pendingRecentDeposit = await (prisma as any).walletDepositRequest.findFirst({
          where: {
            vendorId: vendor.id,
            status: 'PENDING',
            createdAt: { gte: threeDaysAgo }
          }
        });
        const walletBalance = wallet ? Number(wallet.balance) : 0;
        isGracePeriodActive = walletBalance <= 0 && !!pendingRecentDeposit;

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
      orders: (vendor.orders || []).map((o: any) => ({
        ...o,
        total: Number(o.total),
        items: (o.items || []).map((it: any) => ({ ...it, quantity: Number(it.quantity), price: Number(it.price) })),
        settlement: o.settlement ? {
          ...o.settlement,
          commissionAmount: Number(o.settlement.commissionAmount)
        } : null
      })),
      customers: (vendor.customers || []).map((c: any) => ({
        ...c,
        totalSpent: Number(c.totalSpent),
        orderCount: Number(c.orderCount)
      })),
      campaigns: (vendor.campaigns || []).map((c: any) => ({
        ...c,
        sentAt: c.sentAt ? c.sentAt.toISOString() : null
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
      depositRequests: (depositRequests || []).map((r: any) => ({
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

  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
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

  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
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

export async function updateMarketplaceBundleAction(
  bundleId: string,
  data: {
    name: string;
    description?: string;
    price: number;
    discountPercent?: number;
    image?: string;
    items: { vendorProductId: string; quantity: number }[];
  }
) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
  if (!user) throw new Error('Utilisateur non trouvé');

  const vendor = await (prisma as any).vendorProfile.findFirst({
    where: { userId: user.id }
  });
  if (!vendor) throw new Error('Profil vendeur introuvable');

  // Verify ownership
  const existing = await (prisma as any).mktBundle.findUnique({ where: { id: bundleId } });
  if (!existing || existing.vendorId !== vendor.id) throw new Error('Non autorisé');

  // Delete old items and recreate
  await (prisma as any).mktBundleItem.deleteMany({ where: { bundleId } });

  const bundle = await (prisma as any).mktBundle.update({
    where: { id: bundleId },
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      discountPercent: data.discountPercent,
      image: data.image,
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

export async function approveMarketplaceOrderAction(orderId: string, role: 'VENDOR' | 'SUPERADMIN') {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
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
    const effectiveCommissionRate = Number(order.vendor?.commissionRate) || 0.01;
    const commissionAmount = Number(order.total) * effectiveCommissionRate;
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
    // Auto-approve superadmin side: commission is deducted immediately when vendor confirms
    updateData.superadminApproved = true;
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
  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
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

export async function depositToStoreWalletAction(storeId: string, amount: number, description: string = 'Rechargement compte boutique') {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');
  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
  if (user.role !== 'SUPERADMIN') throw new Error('Action réservée aux administrateurs');

  let wallet = await (prisma as any).storeWallet.findUnique({ where: { storeId } });

  if (!wallet) {
    // Auto-create if missing
    wallet = await (prisma as any).storeWallet.create({
      data: { storeId, balance: 0 }
    });
  }

  await (prisma as any).$transaction([
    (prisma as any).storeWallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: amount },
        // If they were restricted and now have a positive balance, we could unrestrict them here
        // or let a background job handle it. Let's do it here for UX.
        store: {
          update: {
            isRestricted: amount > 0 ? false : undefined, // Simplistic, should check total balance
            marketplaceGraceOrders: amount > 0 ? 0 : undefined
          }
        }
      }
    }),
    (prisma as any).storeWalletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: amount,
        type: 'DEPOSIT',
        description: description
      }
    })
  ]);

  // If the new balance is positive, make sure restriction is lifted
  const updatedWallet = await (prisma as any).storeWallet.findUnique({ where: { id: wallet.id } });
  if (Number(updatedWallet.balance) >= 0) {
    await (prisma as any).store.update({
      where: { id: storeId },
      data: { isRestricted: false, marketplaceGraceOrders: 0 }
    });
  }

  revalidatePath('/superadmin/cafes');
  revalidatePath('/superadmin/wallet');
}

export async function getStoreWalletTransactionsAction(storeId: string) {
  return await (prisma as any).storeWalletTransaction.findMany({
    where: { wallet: { storeId } },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getGlobalStoreTransactionsAction() {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');
  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
  if (user?.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  return (prisma as any).storeWalletTransaction.findMany({
    include: { wallet: { include: { store: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
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
  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
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
  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
  if (user?.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  return (prisma as any).walletDepositRequest.findMany({
    include: { vendor: true },
    orderBy: { updatedAt: 'desc' }
  });
}

export async function getGlobalWalletTransactionsAction() {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');
  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
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
  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
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

  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
  if (!user) throw new Error('Utilisateur non trouvé');

  const vendor = await (prisma as any).vendorProfile.findFirst({
    where: { userId: user.id }
  });
  if (!vendor) throw new Error('Profil vendeur introuvable');

  // Handle image: use preview (base64) if available, otherwise use URL
  const image = data.imagePreview || data.image || null;

  // Limits verification for non-premium vendors
  if (!vendor.isPremium) {
    if (data.isFlashSale) {
      const promoCount = await (prisma as any).vendorProduct.count({
        where: { vendorId: vendor.id, isFlashSale: true }
      });
      if (promoCount >= 3) {
        throw new Error("Limite de promotions (3) atteinte pour votre plan actuel. Passez au pack Premium pour en ajouter plus !");
      }
    }
    if (data.isFeatured) {
      const featuredCount = await (prisma as any).vendorProduct.count({
        where: { vendorId: vendor.id, isFeatured: true }
      });
      if (featuredCount >= 5) {
        throw new Error("Limite de produits vedettes (5) atteinte pour votre plan actuel. Passez au pack Premium pour en ajouter plus !");
      }
    }
  }

  await (prisma as any).vendorProduct.create({
    data: {
      name: data.name?.toUpperCase(),
      price: data.price,
      unit: data.unit,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId || null,
      vendorId: vendor.id,
      image: image,
      images: Array.isArray(data.images) ? data.images : [],
      description: data.description || null,
      tags: [
        ...(Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map((t: string) => t.trim()) : [])),
        ...(data.brand ? [data.brand] : [])
      ],
      stockQuantity: data.stockQuantity ? Number(data.stockQuantity) : 0,
      isFeatured: data.isFeatured || false,
      isFlashSale: data.isFlashSale || false,
      discountPrice: data.discount || null,
      minOrderQty: data.minOrderQty ? Number(data.minOrderQty) : 1,
      collections: data.collectionIds && data.collectionIds.length > 0 ? {
        connect: data.collectionIds.map((id: string) => ({ id }))
      } : undefined
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

  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
  if (!user) throw new Error('Utilisateur non trouvé');

  const vendorProfile = await (prisma as any).vendorProfile.findFirst({
    where: { userId: user.id }
  });
  if (!vendorProfile) throw new Error('Profil vendeur introuvable');
  const vendorId = vendorProfile.id;

  const allCategories = await (prisma as any).marketplaceCategory.findMany({
    where: { parentId: null },
    include: { children: true }
  });
  const allSubcategories = await (prisma as any).marketplaceCategory.findMany({
    where: { parentId: { not: null } }
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
            categoryId = subcat.parentId;
            subcategoryId = subcat.id;
          }
        } else {
          categoryId = category.id;

          // If subcategory name provided, try to match it within the category
          if (row.subcategoryName) {
            const subName = row.subcategoryName.trim();
            const subcat = (category.children || []).find((s: any) => s.name.toLowerCase() === subName.toLowerCase());
            if (subcat) {
              subcategoryId = subcat.id;
            } else {
              // Create new subcategory
              const newSub = await (prisma as any).marketplaceCategory.create({
                data: {
                  name: subName,
                  slug: subName.toLowerCase().replace(/ /g, '-'),
                  parentId: category.id
                }
              });
              subcategoryId = newSub.id;
              results.newCategories.push(`Sous-catégorie "${subName}" créée`);
            }
          }
        }

        // If category still not found, create it as HIDDEN (needs approval)
        if (!category && catName) {
          const newCat = await (prisma as any).marketplaceCategory.create({
            data: {
              name: catName,
              slug: catName.toLowerCase().replace(/ /g, '-'),
            }
          });
          categoryId = newCat.id;
          results.newCategories.push(`Catégorie "${catName}" créée`);
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


export async function updateSupplierOrderStatus(orderId: string, status: any) {
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
  const current = await (prisma as any).vendorProduct.findUnique({
    where: { id },
    include: { vendor: true }
  });

  if (!current) throw new Error('Produit introuvable');

  // Limits verification for non-premium vendors
  if (!current.vendor.isPremium) {
    if (data.isFlashSale && !current.isFlashSale) {
      const promoCount = await (prisma as any).vendorProduct.count({
        where: { vendorId: current.vendorId, isFlashSale: true }
      });
      if (promoCount >= 3) {
        throw new Error("Limite de promotions (3) atteinte pour votre plan actuel.");
      }
    }
    if (data.isFeatured && !current.isFeatured) {
      const featuredCount = await (prisma as any).vendorProduct.count({
        where: { vendorId: current.vendorId, isFeatured: true }
      });
      if (featuredCount >= 5) {
        throw new Error("Limite de produits vedettes (5) atteinte pour votre plan actuel.");
      }
    }
  }

  // Handle image: use preview (base64) if available, otherwise use URL
  const image = data.imagePreview || data.image || null;

  await (prisma as any).vendorProduct.update({
    where: { id },
    data: {
      name: data.name?.toUpperCase(),
      price: data.price,
      unit: data.unit,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId || null,
      image: image,
      description: data.description || null,
      tags: [
        ...(Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map((t: string) => t.trim()) : [])),
        ...(data.brand ? [data.brand] : [])
      ],
      stockQuantity: data.stockQuantity ? Number(data.stockQuantity) : 0,
      isFeatured: data.isFeatured,
      isFlashSale: data.isFlashSale,
      discountPrice: data.discount,
      flashStart: data.flashStart ? new Date(data.flashStart) : null,
      flashEnd: data.flashEnd ? new Date(data.flashEnd) : null,
      minOrderQty: data.minOrderQty ? Number(data.minOrderQty) : 1,
      collections: data.collectionIds ? {
        set: data.collectionIds.map((id: string) => ({ id }))
      } : undefined
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
  await (prisma as any).vendorProfile.update({
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
  await (prisma as any).vendorProfile.update({
    where: { id: vendorId },
    data: {
      companyName: data.companyName?.toUpperCase(),
      description: data.description,
      address: data.address,
      city: data.city,
      governorate: data.governorate,
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

export async function updateMissionStatus(orderId: string, status: any) {
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
        defaultCommissionRate: data.defaultCommissionRate !== undefined ? Number(data.defaultCommissionRate) : undefined,
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
        defaultCommissionRate: data.defaultCommissionRate !== undefined ? Number(data.defaultCommissionRate) : undefined,
      }
    });
  } catch (err: any) {
    console.error("updatePlanAction error:", err);
    throw err;
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
  const zone = await (prisma as any).storeZone.create({
    data: { name, storeId: store.id }
  });
  revalidatePath('/admin/tables');
  return zone;
}

export async function updateZoneAction(id: string, name: string) {
  await (prisma as any).storeZone.update({ where: { id }, data: { name } });
  revalidatePath('/admin/tables');
}

export async function deleteZoneAction(id: string) {
  await (prisma as any).storeTable.updateMany({
    where: { zoneId: id },
    data: { zoneId: null }
  });
  await (prisma as any).storeZone.delete({ where: { id } });
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
  await (prisma as any).storeTable.create({
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
  await (prisma as any).storeTable.update({
    where: { id },
    data
  });
  revalidatePath('/admin/tables');
  revalidatePath('/pos');
}

export async function updateTablePositionAction(id: string, posX: number, posY: number) {
  await (prisma as any).storeTable.update({
    where: { id },
    data: { posX, posY }
  });
  revalidatePath('/admin/tables');
  revalidatePath('/pos');
}

export async function deleteTableAction(id: string) {
  await (prisma as any).storeTable.delete({ where: { id } });
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
      tables: await (prisma as any).storeTable.findMany({ where: { storeId: store.id } }),
      zones: await (prisma as any).storeZone.findMany({ where: { storeId: store.id } }),
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
  const store = await (prisma as any).store.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      subscription: {
        select: {
          id: true,
          plan: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
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
      (prisma as any).storeTable.create({
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
  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true, name: true, city: true } });
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

  await (prisma as any).storeTable.deleteMany({ where: { storeId } });

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

  const order = await (prisma as any).supplierOrder.findUnique({
    where: { id: data.orderId },
    select: { vendorId: true, vendorPosId: true }
  });

  if (!order || !order.vendorId) throw new Error('Commande introuvable');

  const rating = await (prisma as any).vendorRating.create({
    data: {
      orderId: data.orderId,
      storeId: store.id,
      vendorId: order.vendorId,
      vendorPosId: (order as any).vendorPosId,
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
  themeConfig?: any;
}) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  // User table has no vendorProfileId column — look up via VendorProfile.userId
  const vendorProfile = await (prisma as any).vendorProfile.findFirst({
    where: { userId }
  });
  if (!vendorProfile) throw new Error('Non autorisé — profil vendeur introuvable');

  const customization = await (prisma as any).vendorCustomization.upsert({
    where: { vendorId: vendorProfile.id },
    update: data,
    create: {
      ...data,
      vendorId: vendorProfile.id
    }
  });

  revalidatePath('/marketplace');
  return customization;
}



// ══════════════════════════════════════════════════════════════
// SPECIAL ORDERS & PRODUCTION (Bakery / Pastry)
// ══════════════════════════════════════════════════════════════

export async function getSpecialOrders() {
  const store = await getStore();
  if (!store) return [];
  return prisma.specialOrder.findMany({
    where: { storeId: store.id },
    include: { customer: true, product: true },
    orderBy: { deliveryDate: 'asc' }
  });
}

export async function createSpecialOrderAction(data: {
  clientName: string;
  clientPhone: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveryDate: Date;
  deliveryTime?: string;
  notes?: string;
  depositAmount?: number;
}) {
  const store = await getStore();
  if (!store) throw new Error("Store non trouvé");

  const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

  const order = await prisma.specialOrder.create({
    data: {
      ...data,
      orderNumber,
      storeId: store.id,
      status: 'PENDING'
    }
  });

  revalidatePath('/admin/production/orders');
  return order;
}

export async function updateSpecialOrderStatusAction(id: string, status: any) {
  await prisma.specialOrder.update({
    where: { id },
    data: { status }
  });
  revalidatePath('/admin/production/orders');
  revalidatePath('/admin/production/planning');
}

export async function deleteSpecialOrderAction(id: string) {
  await prisma.specialOrder.delete({
    where: { id }
  });
  revalidatePath('/admin/production/orders');
  revalidatePath('/admin/production/planning');
}

export async function updateSpecialOrderAction(id: string, data: any) {
  const order = await prisma.specialOrder.update({
    where: { id },
    data
  });
  revalidatePath('/admin/production/orders');
  revalidatePath('/admin/production/planning');
  return order;
}

export async function paySpecialOrderAction(id: string, paymentMethod: string = 'CASH') {
  const order = await prisma.specialOrder.findUnique({
    where: { id },
    include: { product: true }
  });
  if (!order) throw new Error("Order not found");

  const storeId = order.storeId;

  await prisma.specialOrder.update({
    where: { id },
    data: { status: 'DELIVERED' }
  });

  if (order.productId && order.product) {
    const taxRate = Number(order.product.taxRate || 0);
    const unitPriceHt = Number(order.unitPrice) / (1 + taxRate);
    const totalHt = Number(order.totalPrice) / (1 + taxRate);
    const taxAmount = Number(order.totalPrice) - totalHt;

    const sale = await prisma.sale.create({
      data: {
        storeId,
        total: Number(order.totalPrice),
        paymentMethod,
        subtotal: totalHt,
        items: {
          create: [{
            productId: order.productId,
            quantity: Number(order.quantity),
            price: Number(order.unitPrice),
            unitPriceHt,
            taxRate,
            taxAmount,
            totalHt,
            totalTtc: Number(order.totalPrice)
          }]
        }
      }
    });

    revalidatePath('/admin/production/orders');
    revalidatePath('/admin/production/planning');
    return { success: true, saleId: sale.id };
  }

  revalidatePath('/admin/production/orders');
  revalidatePath('/admin/production/planning');
  return { success: true };
}

export async function getProductionPlanningAction() {
  const store = await getStore();
  if (!store) return [];

  // Group by delivery date and product
  const orders = await prisma.specialOrder.findMany({
    where: {
      storeId: store.id,
      status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
    },
    orderBy: { deliveryDate: 'asc' }
  });

  return orders;
}

export async function getProductMarginsAction() {
  const store = await getStore();
  if (!store) return [];

  const products = await prisma.product.findMany({
    where: { storeId: store.id },
    include: {
      recipe: {
        include: {
          stockItem: true
        }
      }
    }
  });

  const margins = products.map(p => {
    const cost = p.recipe.reduce((acc, item) => {
      const purchasePrice = Number(item.stockItem.cost || 0);
      return acc + (Number(item.quantity) * purchasePrice);
    }, 0);

    return {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      cost: cost,
      margin: Number(p.price) - cost,
      marginPercent: Number(p.price) > 0 ? ((Number(p.price) - cost) / Number(p.price)) * 100 : 0
    };
  });

  return margins;
}

// ══════════════════════════════════════════════════════════════
//  ERP INTEGRATION
// ══════════════════════════════════════════════════════════════

export async function saveErpSettings(data: { baseUrl: string; apiKey: string; apiSecret: string; isActive: boolean }) {
  const store = await getStore();
  if (!store) throw new Error('Store introuvable');

  const existing = await (prisma as any).erpIntegration.findUnique({
    where: { storeId: store.id }
  });

  if (existing) {
    await (prisma as any).erpIntegration.update({
      where: { storeId: store.id },
      data
    });
  } else {
    await (prisma as any).erpIntegration.create({
      data: {
        storeId: store.id,
        ...data
      }
    });
  }

  revalidatePath('/admin/settings');
}

export async function triggerErpSync() {
  const store = await getStore();
  if (!store) throw new Error('Store introuvable');

  // Dynamically import to avoid circular dependencies if any
  const { ERPNextClient } = await import('../lib/erpnext');

  const client = await ERPNextClient.initialize(store.id);
  if (!client) {
    throw new Error('Intégration ERP non configurée ou inactive');
  }

  const result = await client.runFullSync();
  revalidatePath('/admin/products');
  revalidatePath('/admin/stock');
  revalidatePath('/admin/settings');

  return result;
}

export async function updateVendorPasswordAction(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const userId = cookies().get('userId')?.value;
  if (!userId) throw new Error('Non authentifié');

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
  if (!user) throw new Error('Utilisateur introuvable');

  // Verify current password
  const isValid = await bcrypt.compare(data.currentPassword, user.password);
  if (!isValid) throw new Error('Mot de passe actuel incorrect');

  if (data.newPassword.length < 6) {
    throw new Error('Le nouveau mot de passe doit contenir au moins 6 caractères');
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  return { success: true };
}

export async function seedMarketplaceDataAction() {
  const { prisma } = await import('@coffeeshop/database');

  // 1. Update Vendor: CAKELAND RADES
  const user = await (prisma as any).user.findUnique({
    where: { email: 'abdelmajidbelhaj@gmail.com' }
  });

  if (user) {
    const profile = await (prisma as any).vendorProfile.findFirst({
      where: { userId: user.id }
    });

    if (profile) {
      await (prisma as any).vendorProfile.update({
        where: { id: profile.id },
        data: {
          companyName: 'CAKELAND RADES',
          address: 'BEN AROUS RADES',
          city: 'Rades',
          governorate: 'Ben Arous',
          lat: 36.7686218,
          lng: 10.2719618,
          phone: '29730048'
        }
      });
    }
  }

  // 2. Add Categories & Subcategories
  const categories = [
    {
      name: 'Aliments et Boissons',
      icon: '🍴',
      subcategories: [
        'Céréales, riz et pâtes',
        'Paniers et kits de cuisine',
        'Confiseries',
        'Condiments et sauces',
        'Café et thé',
        'Collations',
        'Boissons',
        'Confitures et pâtes à tartiner',
        'Laits végétaux',
        'Beurre',
        'Noix',
        'Café moulu',
        'Jus de fruits',
        'Préparations pour gâteaux',
        'Eau',
        'Barres de chocolat',
        'Sauces à salade'
      ]
    }
  ];

  for (const cat of categories) {
    let root = await (prisma as any).marketplaceCategory.findFirst({
      where: { name: cat.name }
    });

    if (!root) {
      root = await (prisma as any).marketplaceCategory.create({
        data: { name: cat.name, icon: cat.icon }
      });
    }

    for (const subName of cat.subcategories) {
      const exists = await (prisma as any).marketplaceCategory.findFirst({
        where: { name: subName, parentId: root.id }
      });
      if (!exists) {
        await (prisma as any).marketplaceCategory.create({
          data: { name: subName, parentId: root.id, icon: '📦' }
        });
      }
    }
  }

  return { success: true };
}

// ─── Blog / Perspectives Commerciales ─────────────────────────────────────

export async function getBlogPosts(publishedOnly = true) {
  'use server';
  return prisma.marketplaceBlogPost.findMany({
    where: publishedOnly ? { isPublished: true } : {},
    orderBy: { publishedAt: 'desc' },
  });
}

export async function getBlogPost(slug: string) {
  'use server';
  return prisma.marketplaceBlogPost.findUnique({ where: { slug } });
}

export async function createBlogPost(data: {
  title: string; slug: string; excerpt?: string; content: string;
  coverImage?: string; author: string; category?: string;
  tags?: string[]; isPublished?: boolean;
}) {
  'use server';
  const { tags = [], isPublished = false, ...rest } = data;
  const post = await prisma.marketplaceBlogPost.create({
    data: { ...rest, tags, isPublished, publishedAt: isPublished ? new Date() : null },
  });
  return { success: true, post };
}

export async function updateBlogPost(id: string, data: {
  title?: string; excerpt?: string; content?: string; coverImage?: string;
  author?: string; category?: string; tags?: string[]; isPublished?: boolean;
}) {
  'use server';
  const { isPublished, ...rest } = data;
  const existing = await prisma.marketplaceBlogPost.findUnique({ where: { id } });
  const post = await prisma.marketplaceBlogPost.update({
    where: { id },
    data: {
      ...rest,
      ...(isPublished !== undefined ? { isPublished } : {}),
      publishedAt: isPublished && !existing?.publishedAt ? new Date() : existing?.publishedAt,
    },
  });
  return { success: true, post };
}

export async function deleteBlogPost(id: string) {
  'use server';
  await (prisma as any).marketplaceBlogPost.delete({ where: { id } });
  return { success: true };
}

// ─── TradeMessager ──────────────────────────────────────────────────────

export async function sendTradeMessageAction(data: { receiverId: string; productId?: string; content: string }) {
  'use server';
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    throw new Error('Session expirée.');
  }

  // Robust filtering for personal info (emails, phones)
  const numberWords: { [key: string]: string } = {
    'zero': '0', 'un': '1', 'deux': '2', 'trois': '3', 'quatre': '4',
    'cinq': '5', 'six': '6', 'sept': '7', 'huit': '8', 'neuf': '9', 'tis3a': '9',
    'dix': '10', 'vingt': '20', 'vight': '20', 'vigt': '20', 'trente': '30', 'quarante': '40',
    'cinquante': '50', 'soixante': '60', 'cent': '100', 'mille': '1000'
  };

  const normalizeContent = (text: string) => {
    let normalized = text.toLowerCase();
    // Replace number words with digits
    Object.keys(numberWords).forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      normalized = normalized.replace(regex, numberWords[word]);
    });
    return normalized;
  };

  const normalized = normalizeContent(data.content);
  // Regex that allows spaces/dots/dashes between digits
  const phoneRegex = /(?:\+?216|00216)?[\s.-]*[234579](?:[\s.-]*\d){7}/g;
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;

  let isFiltered = false;
  let filteredContent = data.content;

  // Check against normalized content but replace in original
  // To be safe, we check if the normalized version has a phone number
  // and then we can either mask the whole thing or try to find where it was.
  // Simplest for now: if normalized has it, we mask the original content's digits
  if (phoneRegex.test(normalized) || emailRegex.test(data.content)) {
    isFiltered = true;
    // Replace emails directly
    filteredContent = filteredContent.replace(emailRegex, '[EMAIL MASQUÉ]');
    // For phones, if we detected one in normalized, let's use a more aggressive approach on original
    // This regex will find sequences of 8 digits even if separated by spaces
    const aggressivePhoneRegex = /[234579](?:[\s.-]*\d){7}/g;
    filteredContent = filteredContent.replace(aggressivePhoneRegex, '[TÉLÉPHONE MASQUÉ]');

    // Also check for word-based numbers if they were converted
    if (filteredContent === data.content && isFiltered) {
      // If the above didn't catch it (e.g. only words), we mask more broadly or provide a warning
      filteredContent = "[MESSAGE FILTRÉ : Coordonnées détectées]";
    }
  }

  const message = await (prisma as any).tradeMessage.create({
    data: {
      senderId: userId,
      receiverId: data.receiverId,
      productId: data.productId,
      content: data.content,
      isFiltered,
      filteredContent
    }
  });

  revalidatePath('/marketplace/messages');
  revalidatePath('/vendor/portal/messages');

  // Trigger Notification
  await sendTradeNotificationAction({
    userId: data.receiverId,
    type: 'MESSAGE',
    title: 'Nouveau message',
    content: `Vous avez reçu un message de ${userId === message.senderId ? 'votre interlocuteur' : 'un client'}.`,
    metadata: { threadId: userId, productId: data.productId }
  });

  return { success: true, message };
}

export async function sendTradeNotificationAction(data: {
  userId: string;
  type: 'MESSAGE' | 'RFQ_NEW' | 'RFQ_QUOTE' | 'ORDER_UPDATE';
  title: string;
  content: string;
  metadata?: any
}) {
  'use server';

  try {
    // 1. Save to Database
    const notification = await (prisma as any).tradeNotification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        content: data.content,
        metadata: data.metadata || {}
      }
    });

    // 2. Email Notification Dispatch
    const user = await (prisma as any).user.findUnique({
      where: { id: data.userId },
      select: {
        email: true,
        name: true,
        notifyEmailMessages: true,
        notifyEmailOrders: true,
        notifyEmailRFQs: true
      }
    });

    if (user?.email) {
      // Check preferences
      let shouldSend = false;
      if (data.type === 'MESSAGE' && user.notifyEmailMessages) shouldSend = true;
      if (data.type === 'ORDER_UPDATE' && user.notifyEmailOrders) shouldSend = true;
      if ((data.type === 'RFQ_NEW' || data.type === 'RFQ_QUOTE') && user.notifyEmailRFQs) shouldSend = true;

      if (shouldSend) {
        await sendMarketplaceEmail({
          to: user.email,
          subject: `[ElKassa] ${data.title}`,
          text: `${data.content}\n\nConsultez vos messages sur la plateforme : ${process.env.NEXT_PUBLIC_APP_URL}/marketplace/messages`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
              <h2 style="color: #e11d48;">${data.title}</h2>
              <p style="font-size: 16px; line-height: 1.6;">${data.content}</p>
              <div style="margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/marketplace/messages" 
                   style="background: #e11d48; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                   Accéder à la plateforme
                </a>
              </div>
              <hr style="margin-top: 40px; border: 0; border-top: 1px solid #e2e8f0;" />
              <p style="font-size: 12px; color: #64748b;">Ceci est une notification automatique de ElKassa Marketplace.</p>
              <p style="font-size: 10px; color: #94a3b8; margin-top: 10px;">Vous pouvez modifier vos préférences de notification dans vos paramètres.</p>
            </div>
          `
        });
      }
    }

    revalidatePath('/marketplace');
    revalidatePath('/vendor/portal');

    return notification;
  } catch (error) {
    console.error('sendTradeNotificationAction Error:', error);
    return null;
  }
}

export async function getUserNotificationsAction() {
  'use server';
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return [];

  try {
    return await (prisma as any).tradeNotification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  } catch (error) {
    console.error('getUserNotificationsAction Error:', error);
    return [];
  }
}

export async function markNotificationAsReadAction(id: string) {
  'use server';
  try {
    await (prisma as any).tradeNotification.update({
      where: { id },
      data: { isRead: true }
    });
    revalidatePath('/marketplace');
    revalidatePath('/vendor/portal');
  } catch (error) {
    console.error('markNotificationAsReadAction Error:', error);
  }
}

export async function getNotificationSettingsAction() {
  'use server';
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return null;

  try {
    return await (prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        notifyEmailMessages: true,
        notifyEmailOrders: true,
        notifyEmailRFQs: true
      }
    });
  } catch (error) {
    console.error('getNotificationSettingsAction Error:', error);
    return null;
  }
}

export async function updateNotificationSettingsAction(data: {
  notifyEmailMessages: boolean;
  notifyEmailOrders: boolean;
  notifyEmailRFQs: boolean;
}) {
  'use server';
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) throw new Error('Session expirée');

  try {
    const updated = await (prisma as any).user.update({
      where: { id: userId },
      data: {
        notifyEmailMessages: data.notifyEmailMessages,
        notifyEmailOrders: data.notifyEmailOrders,
        notifyEmailRFQs: data.notifyEmailRFQs
      }
    });
    revalidatePath('/vendor/portal/settings');
    return updated;
  } catch (error) {
    console.error('updateNotificationSettingsAction Error:', error);
    throw new Error('Erreur lors de la mise à jour des préférences');
  }
}


export async function getTradeMessagesAction(otherUserId: string) {
  'use server';
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    throw new Error('Session expirée.');
  }

  const messages = await (prisma as any).tradeMessage.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    },
    orderBy: { createdAt: 'asc' },
    include: {
      product: { select: { name: true, image: true, id: true } },
      sender: { select: { name: true, role: true } }
    }
  });

  return JSON.parse(JSON.stringify(messages));
}

export async function getTradeConversationsAction() {
  'use server';
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) throw new Error('Session expirée.');

  try {
    // Find all messages involving the current user
    const messages = await (prisma as any).tradeMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            vendorProfile: {
              select: { id: true, isPremium: true }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            role: true,
            vendorProfile: {
              select: { id: true, isPremium: true }
            }
          }
        },
        product: { select: { id: true, name: true, image: true } }
      }
    });

    // Group by "other user"
    const conversationsMap = new Map<string, any>();

    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!otherUser) continue;

      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          otherUser,
          lastMessage: msg,
          unreadCount: 0
        });
      }
    }

    return JSON.parse(JSON.stringify(Array.from(conversationsMap.values())));
  } catch (error) {
    console.error('getTradeConversationsAction Error:', error);
    return [];
  }
}

export async function debugTradeMessagesAction() {
  'use server';
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;

  const allMessages = await (prisma as any).tradeMessage.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } }
    }
  });

  return {
    currentUserId: userId,
    messagesCount: allMessages.length,
    messages: allMessages
  };
}

// ─── RFQ Acceptation & Commission ─────────────────────────────────────────

export async function acceptMarketplaceQuoteAction(quoteId: string) {
  'use server';
  const cookieStore = cookies();
  const storeId = cookieStore.get('storeId')?.value;
  if (!storeId) throw new Error('Store session required to accept RFQ');

  try {
    const quote = await (prisma as any).marketplaceQuote.findUnique({
      where: { id: quoteId },
      include: { rfq: true, vendor: true }
    });

    if (!quote) return { success: false, error: 'Quote not found' };
    if (quote.rfq.storeId !== storeId) return { success: false, error: 'Not authorized to accept this RFQ' };
    if (quote.status === 'ACCEPTED') return { success: false, error: 'Quote already accepted' };

    // Fetch config for commission rate
    const config = await (prisma as any).marketplaceConfig.findUnique({ where: { id: "default" } });
    const rate = Number(config?.rfqCommissionRate || 2.5);

    const price = Number(quote.price);
    const qty = Number(quote.rfq.quantity || 1);
    const totalAmount = price * qty;
    const commissionAmount = (totalAmount * rate) / 100;

    // Check vendor wallet
    const wallet = await (prisma as any).vendorWallet.findUnique({ where: { vendorId: quote.vendorId } });
    if (!wallet) return { success: false, error: 'Vendor wallet not found' };

    if (Number(wallet.balance) < commissionAmount) {
      return { success: false, error: "Le vendeur n'a pas assez de fonds dans son wallet pour couvrir la commission de cette offre." };
    }

    // Deduct from wallet
    await (prisma as any).vendorWallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: commissionAmount } }
    });

    // Log transaction
    await (prisma as any).walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -commissionAmount,
        type: 'FEE',
        description: `Commission RFQ (Taux: ${rate}%) - ${quote.rfq.title}`,
        status: 'COMPLETED'
      }
    });

    // Update Quote and RFQ
    await (prisma as any).marketplaceQuote.update({
      where: { id: quoteId },
      data: {
        status: 'ACCEPTED',
        commissionRate: rate,
        commissionAmount: commissionAmount,
        commissionDeducted: true
      }
    });

    await (prisma as any).marketplaceRFQ.update({
      where: { id: quote.rfqId },
      data: { status: 'FULFILLED' }
    });

    // Reject all other quotes
    await (prisma as any).marketplaceQuote.updateMany({
      where: { rfqId: quote.rfqId, id: { not: quoteId } },
      data: { status: 'REJECTED' }
    });

    return { success: true };
  } catch (error: any) {
    console.error('acceptMarketplaceQuoteAction Error:', error);
    return { success: false, error: error.message || "Une erreur est survenue lors de l'acceptation de l'offre." };
  }
}

export async function getMarketplaceConfig() {
  let config = await (prisma as any).marketplaceConfig.findUnique({
    where: { id: "default" }
  });

  if (!config) {
    config = await (prisma as any).marketplaceConfig.create({
      data: {
        id: "default",
        rfqExpirationHours: 48,
        rfqCommissionRate: 2.5
      }
    });
  }

  return JSON.parse(JSON.stringify(config));
}

export async function updateMarketplaceConfig(data: { rfqExpirationHours?: number, rfqCommissionRate?: number }) {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) throw new Error('Non autorisé');

  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { id: true, role: true, name: true, email: true } });
  if (!user || user.role !== 'SUPERADMIN') throw new Error('Non autorisé');

  const config = await (prisma as any).marketplaceConfig.upsert({
    where: { id: "default" },
    update: {
      rfqExpirationHours: data.rfqExpirationHours,
      rfqCommissionRate: data.rfqCommissionRate
    },
    create: {
      id: "default",
      rfqExpirationHours: data.rfqExpirationHours || 48,
      rfqCommissionRate: data.rfqCommissionRate || 2.5
    }
  });

  revalidatePath('/superadmin/marketplace');
  return JSON.parse(JSON.stringify(config));
}
export async function getPredictiveAlertsAction() {
  const user = await getUserContext();
  if (user?.role !== 'VENDOR') return [];

  const vendor = await (prisma as any).vendorProfile.findFirst({
    where: { userId: user.id },
    include: {
      vendorProducts: {
        include: { productStandard: true }
      }
    }
  });

  if (!vendor || !vendor.isPremium) return [];

  // Find nearby stores (clients)
  const allStores = await (prisma as any).store.findMany({
    include: {
      user: true,
      stockItems: true
    }
  });

  const alerts: any[] = [];
  const vendorProductNames = (vendor.vendorProducts || []).map((vp: any) =>
    (vp.name || vp.productStandard?.name || '').toLowerCase().trim()
  ).filter((n: string) => n.length > 2);

  for (const store of allStores) {
    if (!store.user) continue;

    // Proximity check (50km radius)
    if (vendor.lat && vendor.lng && store.lat && store.lng) {
      const dist = calculateDistance(
        Number(vendor.lat),
        Number(vendor.lng),
        Number(store.lat),
        Number(store.lng)
      );

      if (dist > 50) continue;

      for (const item of (store.stockItems || [])) {
        const qty = Number(item.quantity);
        const threshold = Number(item.minThreshold) || 10; // Default threshold if not set

        if (qty <= threshold) {
          const itemName = item.name.toLowerCase().trim();

          // Fuzzy name matching
          const isMatch = vendorProductNames.some((vpName: string) =>
            itemName.includes(vpName) || vpName.includes(itemName)
          );

          if (isMatch) {
            alerts.push({
              id: `pred-${store.id}-${item.id}`,
              clientId: store.user.id,
              clientName: store.user.name || 'Client',
              productName: item.name,
              reason: 'STOCK_LOW',
              currentQty: qty,
              threshold: threshold,
              distance: dist.toFixed(1),
              city: store.city || 'Proximité'
            });
          }
        }
      }
    }
  }

  // Deduplicate and limit
  return alerts.slice(0, 5);
}


export async function getVendorProductsForUpsellAction() {
  const user = await getUserContext();
  if (!user || user.role !== 'VENDOR') return [];
  
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: user.id }
  });
  if (!vendor) return [];

  return await (prisma as any).vendorProduct.findMany({
    where: { vendorId: vendor.id },
    select: { id: true, name: true, price: true, image: true, unit: true }
  });
}

export async function getVendorProductUpsellsAction(sourceProductId: string) {
  const user = await getUserContext();
  if (!user || user.role !== 'VENDOR') return [];
  
  return await (prisma as any).vendorProductUpsell.findMany({
    where: { sourceProductId },
    include: {
      targetProduct: { select: { id: true, name: true, price: true, image: true, unit: true } }
    }
  });
}

export async function configureVendorProductUpsellAction(data: {
  sourceProductId: string;
  targetProductId: string;
  quantity?: number;
  discountPercent?: number;
  text?: string;
  isActive?: boolean;
}) {
  const user = await getUserContext();
  if (!user || user.role !== 'VENDOR') throw new Error('Non autorisé');

  const vendor = await (prisma as any).vendorProfile.findUnique({
    where: { userId: user.id }
  });
  if (!vendor) throw new Error('Profil vendeur introuvable');

  const sourceProduct = await (prisma as any).vendorProduct.findUnique({
    where: { id: data.sourceProductId }
  });
  if (!sourceProduct || sourceProduct.vendorId !== vendor.id) throw new Error('Accès refusé');

  const upsell = await (prisma as any).vendorProductUpsell.upsert({
    where: {
      sourceProductId_targetProductId: {
        sourceProductId: data.sourceProductId,
        targetProductId: data.targetProductId
      }
    },
    update: {
      quantity: data.quantity,
      discountPercent: data.discountPercent,
      text: data.text,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
    create: {
      sourceProductId: data.sourceProductId,
      targetProductId: data.targetProductId,
      quantity: data.quantity,
      discountPercent: data.discountPercent,
      text: data.text,
      isActive: data.isActive !== undefined ? data.isActive : true,
    }
  });

  return { success: true, upsell };
}

export async function deleteVendorProductUpsellAction(id: string) {
  const user = await getUserContext();
  if (!user || user.role !== 'VENDOR') throw new Error('Non autorisé');
  
  const upsell = await (prisma as any).vendorProductUpsell.findUnique({
    where: { id },
    include: { sourceProduct: true }
  });
  
  if (!upsell) return { success: false, error: 'Introuvable' };
  
  const vendor = await (prisma as any).vendorProfile.findUnique({ where: { userId: user.id } });
  if (!vendor || upsell.sourceProduct.vendorId !== vendor.id) throw new Error('Accès refusé');
  
  await (prisma as any).vendorProductUpsell.delete({ where: { id } });
  return { success: true };
}


export async function vendorConvertDiscussionToOrderAction(data: {
  buyerUserId: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
}) {
  try {
    const user = await getUserContext();
    if (!user || user.role !== 'VENDOR') throw new Error('Non autorisé');

    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: user.id }
    });
    if (!vendor) throw new Error('Profil vendeur introuvable');

    const buyer = await prisma.user.findUnique({
      where: { id: data.buyerUserId },
      select: { storeId: true, name: true }
    });
    if (!buyer || !buyer.storeId) throw new Error('Acheteur introuvable ou sans boutique');

    const productIds = data.items.map((i) => i.productId);
    const products = await (prisma as any).vendorProduct.findMany({
      where: { id: { in: productIds } }
    });
    const productsMap = new Map(products.map((p: any) => [p.id, p]));

    const buyerStore = await (prisma as any).store.findUnique({
      where: { id: buyer.storeId },
      include: { subscription: { include: { plan: true } } }
    });

    const total = data.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.price)), 0);

    // 1. Create Order as CONFIRMED
    const order = await (prisma as any).supplierOrder.create({
      data: {
        storeId: buyer.storeId,
        vendorId: vendor.id,
        total: total,
        status: 'CONFIRMED',
        items: {
          create: data.items.map((item) => {
            const p = productsMap.get(item.productId);
            if (!p) throw new Error(`Produit ${item.productId} introuvable`);
            return {
              mktProductId: p.id,
              name: p.name,
              quantity: Number(item.quantity),
              price: Number(item.price)
            };
          })
        }
      }
    });

    // 2. Client Wallet Deduction
    const clientCommissionRate = Number(buyerStore?.customCommissionRate || buyerStore?.subscription?.plan?.defaultCommissionRate || 0.02);
    const clientCommissionAmount = Number(total) * clientCommissionRate;
    
    const storeWallet = await (prisma as any).storeWallet.findUnique({ where: { storeId: buyer.storeId } });
    if (storeWallet && clientCommissionAmount > 0) {
      await (prisma as any).storeWallet.update({
        where: { id: storeWallet.id },
        data: { balance: { decrement: clientCommissionAmount } }
      });
      await (prisma as any).storeWalletTransaction.create({
        data: {
          walletId: storeWallet.id,
          amount: -clientCommissionAmount,
          type: 'MARKETPLACE_COMMISSION',
          description: `Commission sur commande Marketplace (Taux: ${clientCommissionRate * 100}%)`,
        }
      });
    }
    // 3. Vendor Wallet Deduction & Settlement
    const effectiveCommissionRate = Number((vendor as any).commissionRate) || 0.01;
    const vendorCommissionAmount = Number(total) * effectiveCommissionRate;
    
    console.log(`[Finance] Order ${order.id}: Total=${total}, Rate=${effectiveCommissionRate}, Commission=${vendorCommissionAmount}`);

    const settlement = await (prisma as any).marketplaceSettlement.create({
      data: {
        orderId: order.id,
        commissionAmount: vendorCommissionAmount,
        vendorApproved: true,
        superadminApproved: true,
        isProcessed: true,
        processedAt: new Date()
      }
    });

    let vendorWallet = await (prisma as any).vendorWallet.findUnique({ where: { vendorId: vendor.id } });
    
    if (!vendorWallet) {
      console.warn(`[Finance] Vendor ${vendor.id} had no wallet. Creating one.`);
      vendorWallet = await (prisma as any).vendorWallet.create({
        data: { vendorId: vendor.id, balance: 0 }
      });
    }

    if (vendorCommissionAmount > 0) {
      await (prisma as any).vendorWallet.update({
        where: { id: vendorWallet.id },
        data: { balance: { decrement: vendorCommissionAmount } }
      });

      try {
        const txModel = (prisma as any).walletTransaction ?? (prisma as any).WalletTransaction;
        if (txModel) {
          await txModel.create({
            data: {
              walletId: vendorWallet.id,
              amount: -vendorCommissionAmount,
              type: 'COMMISSION',
              description: `Commission sur vente directe #${order.id.slice(-5)} (Taux: ${effectiveCommissionRate * 100}%)`,
              settlementId: settlement.id
            }
          });
        }
      } catch (txErr: any) {
        console.error('[Finance] Vendor WalletTransaction create failed:', txErr.message);
      }
    }

    const txNotif = (prisma as any).tradeNotification ?? (prisma as any).TradeNotification;
    if (txNotif) {
      await txNotif.create({
        data: {
          userId: data.buyerUserId,
          type: 'ORDER_UPDATE',
          title: 'Nouvelle commande confirmée',
          content: `${vendor.companyName} a créé et confirmé une commande suite à votre discussion.`,
          metadata: { orderId: order.id },
          isRead: false
        }
      });
    }

    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error("vendorConvertDiscussionToOrderAction Error:", error);
    return { success: false, error: error.message || "Une erreur inattendue est survenue." };
  }
}

export async function getMarketplaceUpsellRecommendationsAction(cartProductIds: string[]) {
  try {
    if (!cartProductIds || cartProductIds.length === 0) {
      return await (prisma as any).vendorProduct.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          price: true,
          image: true,
          unit: true,
          vendor: { select: { id: true, companyName: true, isPremium: true } }
        }
      });
    }

    const cartProducts = await (prisma as any).vendorProduct.findMany({
      where: { id: { in: cartProductIds } },
      select: { name: true, vendorId: true, categoryId: true, tags: true }
    });

    const vendorIds = Array.from(new Set(cartProducts.map((p: any) => p.vendorId)));
    const categoryIds = Array.from(new Set(cartProducts.map((p: any) => p.categoryId).filter(Boolean)));
    
    // Smart Upsell Logic: Find complementary keywords
    const keywords: string[] = [];
    cartProducts.forEach((p: any) => {
      const n = (p.name || '').toLowerCase();
      if (n.includes('machine') || n.includes('cafetière')) keywords.push('grain', 'capsule', 'filtre', 'détartrant');
      if (n.includes('grain') || n.includes('moulu')) keywords.push('sucre', 'tasse', 'cuillère', 'lait');
      if (n.includes('thé') || n.includes('tisane')) keywords.push('théière', 'miel', 'citron');
      if (n.includes('frigo') || n.includes('froid')) keywords.push('boisson', 'jus', 'eau');
    });

    const recommendations = await (prisma as any).vendorProduct.findMany({
      where: {
        id: { notIn: cartProductIds },
        OR: [
          // 1. Matches smart keywords
          ...keywords.map(k => ({ name: { contains: k, mode: 'insensitive' } })),
          // 2. Same vendor (to reduce shipping costs)
          { vendorId: { in: vendorIds } },
          // 3. Same category
          { categoryId: { in: categoryIds } }
        ]
      },
      take: 8,
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        unit: true,
        vendor: { select: { id: true, companyName: true, isPremium: true } }
      }
    });

    // Shuffle and prioritize keyword matches
    return recommendations.sort((a: any, b: any) => {
      const aMatches = keywords.some(k => a.name.toLowerCase().includes(k)) ? 0 : 1;
      const bMatches = keywords.some(k => b.name.toLowerCase().includes(k)) ? 0 : 1;
      return aMatches - bMatches;
    });
  } catch (error) {
    console.error("getMarketplaceUpsellRecommendationsAction Error:", error);
    return [];
  }
}

export async function getVendorOrderDetailsForWalletAction(orderId: string) {
  try {
    const user = await getUserContext();
    if (!user || user.role !== 'VENDOR') throw new Error('Non autorisé');

    const vendor = await (prisma as any).vendorProfile.findUnique({
      where: { userId: user.id }
    });
    if (!vendor) throw new Error('Profil vendeur introuvable');

    // Find order by full ID or last characters
    let order: any = await (prisma as any).supplierOrder.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        items: true,
        settlement: true
      }
    });

    // Fallback search if ID is partial (e.g. from description)
    if (!order && orderId.length <= 10) {
      const allOrders = await (prisma as any).supplierOrder.findMany({
        where: { vendorId: vendor.id },
        include: {
          store: true,
          items: true,
          settlement: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      order = allOrders.find((o: any) => o.id.endsWith(orderId)) || null;
    }

    if (!order) throw new Error('Commande introuvable');
    if (order.vendorId !== vendor.id) throw new Error('Accès refusé');

    return {
      success: true,
      order: {
        id: order.id,
        createdAt: order.createdAt,
        total: Number(order.total),
        status: order.status,
        store: {
          name: order.store?.name || 'Client inconnu',
          city: order.store?.city || '',
          address: order.store?.address || '',
          phone: order.store?.phone || ''
        },
        items: order.items.map((i: any) => ({
          name: i.name || 'Produit inconnu',
          quantity: Number(i.quantity),
          price: Number(i.price),
          image: null // Relation non disponible directement
        })),
        settlement: order.settlement ? {
          commissionAmount: Number(order.settlement.commissionAmount),
          isProcessed: order.settlement.isProcessed
        } : null
      }
    };
  } catch (error: any) {
    console.error("getVendorOrderDetailsForWalletAction Error:", error);
    return { success: false, error: error.message };
  }
}

export async function sendVendorInquiryAction(data: { vendorId: string, subject: string, message: string }) {
  try {
    const user = await getUserContext();
    if (!user) throw new Error('Vous devez être connecté');
    const store = await (prisma as any).store.findFirst({ where: { userId: user.id } });
    if (!store) throw new Error('Seuls les professionnels peuvent envoyer des demandes (Boutique requise)');

    const interaction = await (prisma as any).vendorInteraction.create({
      data: {
        storeId: store.id,
        vendorId: data.vendorId,
        type: 'INQUIRY',
        metadata: {
          subject: data.subject,
          message: data.message,
          status: 'PENDING'
        }
      }
    });

    const txNotif = (prisma as any).tradeNotification ?? (prisma as any).TradeNotification;
    if (txNotif) {
      const vendorProfile = await (prisma as any).vendorProfile.findUnique({ where: { id: data.vendorId } });
      if (vendorProfile?.userId) {
        await txNotif.create({
          data: {
            userId: vendorProfile.userId,
            type: 'INQUIRY_NEW',
            title: 'Nouvelle demande d\'information',
            content: `${store.name} vous a envoyé une demande: ${data.subject}`,
            metadata: { inquiryId: interaction.id },
            isRead: false
          }
        });
      }
    }
    
    return { success: true, id: interaction.id };
  } catch (error: any) {
    console.error("sendVendorInquiryAction Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getVendorInquiriesAction() {
  try {
    const user = await getUserContext();
    if (!user || user.role !== 'VENDOR') throw new Error('Non autorisé');
    
    const vendor = await (prisma as any).vendorProfile.findUnique({ where: { userId: user.id } });
    if (!vendor) throw new Error('Profil vendeur introuvable');

    const inquiries = await (prisma as any).vendorInteraction.findMany({
      where: { vendorId: vendor.id, type: 'INQUIRY' },
      include: {
        store: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return inquiries;
  } catch (error: any) {
    console.error("getVendorInquiriesAction Error:", error);
    return [];
  }
}

export async function getPublicProductUpsellsAction(sourceProductId: string) {
  try {
    const upsells = await (prisma as any).vendorProductUpsell.findMany({
      where: { sourceProductId },
      include: {
        targetProduct: {
          select: { id: true, name: true, price: true, image: true, unit: true, vendorId: true }
        }
      }
    });
    return upsells;
  } catch (err) {
    console.error("getPublicProductUpsellsAction error", err);
    return [];
  }
}
