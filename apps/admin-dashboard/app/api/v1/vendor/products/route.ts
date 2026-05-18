import { NextResponse } from 'next/server';
import { prisma } from '@coffeeshop/database';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'elkassa_super_secret_key_2026';

async function authenticateVendor(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!decoded.vendorId) return null;
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET all products and bundles for the vendor
export async function GET(req: Request) {
  const vendorContext = await authenticateVendor(req);
  if (!vendorContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const [products, bundles] = await Promise.all([
      prisma.vendorProduct.findMany({
        where: { vendorId: vendorContext.vendorId },
        orderBy: { createdAt: 'desc' }
      }),
      (prisma as any).vendorBundle ? (prisma as any).vendorBundle.findMany({
        where: { vendorId: vendorContext.vendorId },
        orderBy: { createdAt: 'desc' }
      }) : []
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products: products.map((p: any) => ({
          ...p,
          price: Number(p.price),
          discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
          minOrderQty: Number(p.minOrderQty || 1),
          isTunisian: Array.isArray(p.tags) && p.tags.includes('🇹🇳 Produit Tunisien'),
          isEcoFriendly: Array.isArray(p.tags) && p.tags.includes('🌱 Éco-responsable'),
        })),
        bundles: bundles.map((b: any) => ({
          ...b,
          price: Number(b.price || 0),
          originalPrice: Number(b.originalPrice || 0),
        }))
      }
    });
  } catch (error: any) {
    console.error('Vendor API GET Products Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create a product or bundle
export async function POST(req: Request) {
  const vendorContext = await authenticateVendor(req);
  if (!vendorContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      type, // 'PRODUCT' or 'BUNDLE'
      name, 
      price, 
      unit, 
      categoryId, 
      subcategoryId, 
      description, 
      image, 
      tags, 
      minOrderQty, 
      stockQuantity,
      isTunisian, 
      isEcoFriendly,
      // Bundle specific fields
      productsList, // Array of { productId, quantity }
      discountPrice
    } = body;

    if (!name || !price) {
      return NextResponse.json({ success: false, error: 'Nom et prix requis' }, { status: 400 });
    }

    if (type === 'BUNDLE') {
      if (!(prisma as any).vendorBundle) {
        return NextResponse.json({ success: false, error: 'Les bundles ne sont pas disponibles sur cette version' }, { status: 400 });
      }

      const bundle = await (prisma as any).vendorBundle.create({
        data: {
          name: name.toUpperCase(),
          price: Number(price),
          originalPrice: Number(body.originalPrice || price),
          image: image || null,
          description: description || null,
          vendorId: vendorContext.vendorId,
          productsList: Array.isArray(productsList) ? productsList : [],
        }
      });

      return NextResponse.json({ success: true, data: bundle });
    }

    // Default: PRODUCT
    const finalTags = Array.isArray(tags) ? [...tags] : [];
    if (isTunisian && !finalTags.includes('🇹🇳 Produit Tunisien')) {
      finalTags.push('🇹🇳 Produit Tunisien');
    }
    if (isEcoFriendly && !finalTags.includes('🌱 Éco-responsable')) {
      finalTags.push('🌱 Éco-responsable');
    }

    const product = await prisma.vendorProduct.create({
      data: {
        name: name.toUpperCase(),
        price: Number(price),
        unit: unit || 'unité',
        categoryId: categoryId,
        subcategoryId: subcategoryId || null,
        vendorId: vendorContext.vendorId,
        image: image || null,
        description: description || null,
        tags: finalTags,
        minOrderQty: minOrderQty ? Number(minOrderQty) : 1,
        stockQuantity: stockQuantity ? Number(stockQuantity) : 0,
      }
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error('Vendor API POST Product/Bundle Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
