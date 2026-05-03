import { NextResponse } from 'next/server';
import { prisma } from '@coffeeshop/database';
import { hash } from 'bcrypt';

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

const regions = [
  { governorate: 'Tunis', city: 'Tunis', lat: 36.8065, lng: 10.1815 },
  { governorate: 'Ariana', city: 'Ariana', lat: 36.8665, lng: 10.1647 },
  { governorate: 'Sousse', city: 'Sousse', lat: 35.8254, lng: 10.6369 },
  { governorate: 'Sfax', city: 'Sfax', lat: 34.7406, lng: 10.7603 },
  { governorate: 'Monastir', city: 'Monastir', lat: 35.7779, lng: 10.8261 },
  { governorate: 'Bizerte', city: 'Bizerte', lat: 37.2744, lng: 9.8739 },
  { governorate: 'Nabeul', city: 'Hammamet', lat: 36.4, lng: 10.6167 }
];

const vendorNames = [
  "Tunisie Distribution", "Nord Food B2B", "Sahel Pro Supply", 
  "Cap Bon Pack", "Sfax Agro", "Bizerte Marine Food", "Ariana Tech Equipment",
  "Café d'Or Distribution", "Gros Tunis", "Monastir HoReCa", "Elite Pastry Supply",
  "Hygiène Plus Tunisie", "Global Coffee Solutions", "Boulange-Pro Sfax"
];

export async function GET() {
  const logs = [];
  const password = await hash('vendor123', 10);

  try {
    // 1. Get all leaf categories (categories without children)
    const allCategories = await (prisma as any).marketplaceCategory.findMany({
      include: { children: true }
    });
    
    const leafCategories = allCategories.filter((c: any) => !c.children || c.children.length === 0);
    
    if (leafCategories.length === 0) {
      return NextResponse.json({ success: false, error: "No categories found. Please run seed-categories first." });
    }

    // 2. For each region, create 2 vendors
    for (const region of regions) {
      for (let i = 0; i < 2; i++) {
        const companyName = `${vendorNames[Math.floor(Math.random() * vendorNames.length)]} ${region.city} #${i+1}`;
        const email = `vendor_${slugify(companyName)}@example.com`;
        
        // Create User
        let user = await (prisma as any).user.findUnique({ where: { email } });
        if (!user) {
          user = await (prisma as any).user.create({
            data: {
              email,
              password,
              name: companyName,
              role: 'VENDOR',
              permissions: ['VENDOR_PORTAL'],
            }
          });
          logs.push(`Created user: ${email}`);
        }

        // Create VendorProfile
        let profile = await (prisma as any).vendorProfile.findUnique({ where: { userId: user.id } });
        if (!profile) {
          profile = await (prisma as any).vendorProfile.create({
            data: {
              userId: user.id,
              companyName,
              governorate: region.governorate,
              city: region.city,
              lat: region.lat + (Math.random() - 0.5) * 0.05, 
              lng: region.lng + (Math.random() - 0.5) * 0.05,
              status: 'ACTIVE',
              isPremium: true
            }
          });
          logs.push(`Created profile: ${companyName}`);
        }

        // Ensure Wallet exists with balance (for visibility)
        const existingWallet = await (prisma as any).vendorWallet.findUnique({ where: { vendorId: profile.id } });
        if (!existingWallet) {
          await (prisma as any).vendorWallet.create({
            data: {
              vendorId: profile.id,
              balance: 100.0,
              currency: 'DT',
              status: 'ACTIVE'
            }
          });
          logs.push(`  Created wallet for ${companyName} (100 DT)`);
        }

        // 3. Create mock products for this vendor in different categories
        // Pick 5 random categories for this vendor
        const pickedCategories = [...leafCategories].sort(() => 0.5 - Math.random()).slice(0, 5);
        
        for (const cat of pickedCategories) {
          const productName = `${cat.name} Premium - ${companyName}`;
          const existingProduct = await (prisma as any).vendorProduct.findFirst({
            where: { name: productName, vendorId: profile.id }
          });

          if (!existingProduct) {
            await (prisma as any).vendorProduct.create({
              data: {
                name: productName,
                vendorId: profile.id,
                categoryId: cat.parentId || cat.id,
                subcategoryId: cat.parentId ? cat.id : null,
                price: 10 + Math.random() * 90,
                unit: 'KG',
                stockQuantity: 100,
                description: `Qualité professionnelle certifiée par ${companyName}. Idéal pour coffeeshops et restaurants.`,
                image: `https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400&sig=${Math.random()}`,
                tags: ['Premium', region.city, 'Local'],
                isFeatured: Math.random() > 0.7,
                isFlashSale: Math.random() > 0.8,
                discountPrice: Math.random() > 0.8 ? (5 + Math.random() * 40) : null
              }
            });
            logs.push(`  Added product: ${productName}`);
          }
        }
      }
    }

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
