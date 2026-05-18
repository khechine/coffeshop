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

// PUT to update a product or bundle
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const vendorContext = await authenticateVendor(req);
  if (!vendorContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  const { id } = params;

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
      // Bundle specific
      productsList,
      originalPrice
    } = body;

    if (type === 'BUNDLE') {
      if (!(prisma as any).vendorBundle) {
        return NextResponse.json({ success: false, error: 'Les bundles ne sont pas disponibles sur cette version' }, { status: 400 });
      }

      // Verify ownership
      const existing = await (prisma as any).vendorBundle.findUnique({ where: { id } });
      if (!existing || existing.vendorId !== vendorContext.vendorId) {
        return NextResponse.json({ success: false, error: 'Produit non trouvé ou non autorisé' }, { status: 404 });
      }

      const bundle = await (prisma as any).vendorBundle.update({
        where: { id },
        data: {
          name: name ? name.toUpperCase() : undefined,
          price: price ? Number(price) : undefined,
          originalPrice: originalPrice ? Number(originalPrice) : undefined,
          image: image !== undefined ? image : undefined,
          description: description !== undefined ? description : undefined,
          productsList: Array.isArray(productsList) ? productsList : undefined,
        }
      });

      return NextResponse.json({ success: true, data: bundle });
    }

    // Default: PRODUCT
    // Verify ownership
    const existingProduct = await prisma.vendorProduct.findUnique({ where: { id } });
    if (!existingProduct || existingProduct.vendorId !== vendorContext.vendorId) {
      return NextResponse.json({ success: false, error: 'Produit non trouvé ou non autorisé' }, { status: 404 });
    }

    const finalTags = Array.isArray(tags) ? [...tags] : [...(existingProduct.tags || [])];
    if (isTunisian !== undefined) {
      if (isTunisian && !finalTags.includes('🇹🇳 Produit Tunisien')) {
        finalTags.push('🇹🇳 Produit Tunisien');
      } else if (!isTunisian) {
        const idx = finalTags.indexOf('🇹🇳 Produit Tunisien');
        if (idx !== -1) finalTags.splice(idx, 1);
      }
    }
    if (isEcoFriendly !== undefined) {
      if (isEcoFriendly && !finalTags.includes('🌱 Éco-responsable')) {
        finalTags.push('🌱 Éco-responsable');
      } else if (!isEcoFriendly) {
        const idx = finalTags.indexOf('🌱 Éco-responsable');
        if (idx !== -1) finalTags.splice(idx, 1);
      }
    }

    const product = await prisma.vendorProduct.update({
      where: { id },
      data: {
        name: name ? name.toUpperCase() : undefined,
        price: price ? Number(price) : undefined,
        unit: unit !== undefined ? unit : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        subcategoryId: subcategoryId !== undefined ? subcategoryId : undefined,
        image: image !== undefined ? image : undefined,
        description: description !== undefined ? description : undefined,
        tags: finalTags,
        minOrderQty: minOrderQty ? Number(minOrderQty) : undefined,
        stockQuantity: stockQuantity ? Number(stockQuantity) : undefined,
      }
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error('Vendor API PUT Product Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE product or bundle
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const vendorContext = await authenticateVendor(req);
  if (!vendorContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  const { id } = params;

  try {
    // Try deleting product
    const existingProduct = await prisma.vendorProduct.findUnique({ where: { id } });
    if (existingProduct) {
      if (existingProduct.vendorId !== vendorContext.vendorId) {
        return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 403 });
      }
      await prisma.vendorProduct.delete({ where: { id } });
      return NextResponse.json({ success: true, message: 'Produit supprimé' });
    }

    // Try deleting bundle
    if ((prisma as any).vendorBundle) {
      const existingBundle = await (prisma as any).vendorBundle.findUnique({ where: { id } });
      if (existingBundle) {
        if (existingBundle.vendorId !== vendorContext.vendorId) {
          return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 403 });
        }
        await (prisma as any).vendorBundle.delete({ where: { id } });
        return NextResponse.json({ success: true, message: 'Bundle supprimé' });
      }
    }

    return NextResponse.json({ success: false, error: 'Produit non trouvé' }, { status: 404 });
  } catch (error: any) {
    console.error('Vendor API DELETE Product Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
