import { NextResponse } from 'next/server';
import { prisma } from '@coffeeshop/database';

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const ecoOnly = searchParams.get('ecoOnly') === 'true';
    const tunisiaOnly = searchParams.get('tunisiaOnly') === 'true';
    
    // Paramètres géographiques
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius');

    const userLat = latStr ? parseFloat(latStr) : null;
    const userLng = lngStr ? parseFloat(lngStr) : null;
    const radius = radiusStr && radiusStr !== 'all' ? parseFloat(radiusStr) : null;

    const whereClause: any = {
      isApproved: true,
      stockStatus: { not: 'OUT_OF_STOCK' },
    };

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (ecoOnly) {
      whereClause.tags = {
        hasSome: ['Bio', 'Éco-responsable', 'Naturel', '🌱', 'Eco', 'Recyclé', '🌱 Éco-responsable']
      };
    }

    if (tunisiaOnly) {
      if (whereClause.tags) {
        whereClause.AND = [
          { tags: whereClause.tags },
          { tags: { hasSome: ['Tunisie', '🇹🇳 Produit Tunisien'] } }
        ];
        delete whereClause.tags;
      } else {
        whereClause.tags = {
          hasSome: ['Tunisie', '🇹🇳 Produit Tunisien']
        };
      }
    }

    // Récupération des produits depuis la base
    const [productsRaw, total] = await Promise.all([
      prisma.vendorProduct.findMany({
        where: whereClause,
        include: {
          vendor: {
            select: { id: true, companyName: true, isPremium: true, lat: true, lng: true, city: true }
          }
        },
        // Si le filtrage par rayon GPS est actif, on pagine après le tri
        ...((userLat && userLng && radius) ? {} : {
          skip: (page - 1) * limit,
          take: limit,
        }),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.vendorProduct.count({ where: whereClause })
    ]);

    // Mapping des produits avec distance et métadonnées d'avantages
    let products = productsRaw.map((p: any) => {
      const isPremium = p.vendor?.isPremium;
      const vendorLat = p.vendor?.lat ? Number(p.vendor.lat) : null;
      const vendorLng = p.vendor?.lng ? Number(p.vendor.lng) : null;

      const distance = (userLat && userLng && vendorLat && vendorLng)
        ? calculateDistance(userLat, userLng, vendorLat, vendorLng)
        : null;

      const isTunisian = Array.isArray(p.tags) && p.tags.some((t: string) => t.includes('Tunisie') || t.includes('🇹🇳'));
      const isEcoFriendly = Array.isArray(p.tags) && p.tags.some((t: string) => ['Bio', 'Éco-responsable', 'Naturel', '🌱', 'Eco', 'Recyclé'].includes(t) || t.includes('🌱'));

      // Application des règles Vault (anonymisation si non-premium)
      const maskedVendor = p.vendor ? {
        id: p.vendor.id,
        companyName: isPremium ? p.vendor.companyName : `Fournisseur ${p.vendor.id.slice(-4).toUpperCase()}`,
        image: null,
        isPremium: !!isPremium,
        city: isPremium ? p.vendor.city : 'Localisation sécurisée (B2B)',
        lat: isPremium ? vendorLat : null,
        lng: isPremium ? vendorLng : null,
      } : null;

      return {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        unit: p.unit,
        image: p.image,
        description: p.description,
        isBundle: p.isBundle,
        tags: p.tags || [],
        isTunisian,
        isEcoFriendly,
        distance,
        vendor: maskedVendor,
        category: null
      };
    });

    // Filtrage par distance
    if (userLat && userLng && radius) {
      products = products.filter((p: any) => p.distance !== null && p.distance <= radius);
    }

    // Tri par distance (plus proche en premier)
    if (userLat && userLng) {
      products.sort((a: any, b: any) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });

      // Pagination manuelle après filtrage géolocalisé
      if (radius) {
        const offset = (page - 1) * limit;
        products = products.slice(offset, offset + limit);
      }
    }

    return NextResponse.json({
      success: true,
      data: products,
      meta: {
        pagination: {
          total: userLat && userLng && radius ? products.length : total,
          page,
          limit,
          totalPages: Math.ceil((userLat && userLng && radius ? products.length : total) / limit)
        }
      }
    });

  } catch (error) {
    console.error('Marketplace API Error:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
