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

// POST to update multiple product/pack images
export async function POST(req: Request) {
  const vendorContext = await authenticateVendor(req);
  if (!vendorContext) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId, mainImage, secondaryImages } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId requis' }, { status: 400 });
    }

    // Verify vendor owns this product
    const product = await prisma.vendorProduct.findUnique({ where: { id: productId } });
    if (!product || product.vendorId !== vendorContext.vendorId) {
      return NextResponse.json({ success: false, error: 'Produit non trouvé ou non autorisé' }, { status: 404 });
    }

    // Update product image fields
    const updatedProduct = await prisma.vendorProduct.update({
      where: { id: productId },
      data: {
        image: mainImage !== undefined ? mainImage : undefined,
        images: Array.isArray(secondaryImages) ? secondaryImages : undefined
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        image: updatedProduct.image,
        images: updatedProduct.images
      }
    });

  } catch (error: any) {
    console.error('Vendor API Product Images Upload Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
