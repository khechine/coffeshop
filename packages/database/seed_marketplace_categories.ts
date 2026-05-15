import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categoryTree = [
  {
    name: "Matières Premières",
    icon: "🌾",
    color: "#D97706",
    image: "/images/elkassa-logo.png",
    children: [
      {
        name: "Café en grains",
        children: ["Arabica", "Robusta", "Blends", "Spécialité"]
      },
      {
        name: "Lait & alternatives",
        children: ["Lait entier / demi-écrémé", "Lait végétal (amande, soja, avoine)"]
      },
      {
        name: "Sucre & édulcorants",
        children: ["Sucre blanc / roux", "Sirop sucre"]
      },
      {
        name: "Sirops & arômes",
        children: ["Vanille, caramel, noisette", "Arômes & extraits"]
      },
      { name: "Chocolat & cacao" },
      { name: "Thé & infusions" },
      { name: "Glaces / toppings" },
      {
        name: "Farine",
        children: ["T45, T55, complète", "Farines spéciales"]
      },
      {
        name: "Levure & Améliorants",
        children: ["Levure fraîche", "Levure sèche", "Améliorants"]
      },
      { name: "Beurre / margarine" },
      { name: "Chocolat couverture" },
      { name: "Fruits secs" },
      { name: "Gélatine / agar-agar" },
      { name: "Crème & produits laitiers" },
      { name: "Colorants alimentaires" },
      {
        name: "Ingrédients Salés",
        children: ["Fromages", "Charcuterie", "Sauces", "Pain sandwich", "Sel"]
      }
    ]
  },
  {
    name: "Produits Semi-Finis",
    icon: "🥣",
    color: "#059669",
    image: "/images/elkassa-logo.png",
    children: [
      { name: "Bases boissons (frappé, smoothie)" },
      { name: "Sauces prêtes (chocolat, caramel)" },
      { name: "Pâte prête" },
      { name: "Mix boulangerie" },
      { name: "Praliné & Ganache" },
      { name: "Crème prête" },
      { name: "Inserts pâtisserie" }
    ]
  },
  {
    name: "Produits Finis (B2B / Revente)",
    icon: "🥐",
    color: "#E11D48",
    image: "/images/elkassa-logo.png",
    children: [
      { name: "Capsules café" },
      { name: "Boissons prêtes (RTD)" },
      { name: "Pain (gros volume B2B)" },
      { name: "Viennoiseries surgelées" },
      { name: "Décors comestibles" },
      { name: "Gâteaux prêts" },
      { name: "Produits surgelés" },
      { name: "Snacks prêts" },
      { name: "Desserts individuels" }
    ]
  },
  {
    name: "Équipements & Matériel",
    icon: "⚙️",
    color: "#4F46E5",
    image: "/images/elkassa-logo.png",
    children: [
      {
        name: "Matériel Coffeeshop",
        children: ["Machines espresso", "Moulins à café", "Blenders", "Machines à glaçons"]
      },
      {
        name: "Matériel Boulangerie",
        children: ["Four", "Pétrin", "Chambre de fermentation"]
      },
      {
        name: "Matériel Pâtisserie",
        children: ["Moules silicone", "Robot pâtissier", "Tempéreuse chocolat"]
      }
    ]
  },
  {
    name: "Emballages",
    icon: "📦",
    color: "#8B5CF6",
    image: "/images/elkassa-logo.png",
    children: [
      { name: "Gobelets & Couvercles", image: "/images/elkassa-logo.png" },
      { name: "Pailles", image: "/images/elkassa-logo.png" },
      { name: "Sacs takeaway", image: "/images/elkassa-logo.png" },
      { name: "Sachets pain & Papier alimentaire", image: "/images/elkassa-logo.png" },
      { name: "Boîtes & Barquettes", image: "/images/elkassa-logo.png" },
      { name: "Supports cake", image: "/images/elkassa-logo.png" },
      { name: "Packaging premium", image: "/images/elkassa-logo.png" },
      { name: "Écologique (kraft, biodégradable)", image: "/images/elkassa-logo.png" }
    ]
  },
  {
    name: "Hygiène & Nettoyage",
    icon: "🧼",
    color: "#0284C7",
    image: "/images/elkassa-logo.png",
    children: [
      { name: "Détergents cuisine" },
      { name: "Désinfectants" },
      { name: "Produits vaisselle" },
      { name: "Papier (essuie-tout, papier toilette)" },
      { name: "Gants / consommables" }
    ]
  },
  {
    name: "Services",
    icon: "🤝",
    color: "#C026D3",
    image: "/images/elkassa-logo.png",
    children: [
      { name: "Livraison" },
      { name: "Maintenance machines" },
      { name: "Formation barista / pâtisserie" },
      { name: "Branding / packaging personnalisé" },
      { name: "Location matériel" }
    ]
  }
];

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function main() {
  console.log('Starting category seed...');
  
  // Create or update categories
  for (const root of categoryTree) {
    const slug = slugify(root.name);
    let rootCat = await (prisma as any).marketplaceCategory.findUnique({ where: { slug } });
    if (!rootCat) {
      rootCat = await (prisma as any).marketplaceCategory.create({
        data: {
          name: root.name,
          slug,
          icon: root.icon,
          color: root.color,
          image: root.image
        }
      });
      console.log(`Created root: ${rootCat.name}`);
    } else {
      rootCat = await (prisma as any).marketplaceCategory.update({
        where: { id: rootCat.id },
        data: {
          image: root.image,
          icon: root.icon,
          color: root.color
        }
      });
      console.log(`Updated root: ${rootCat.name}`);
    }

    if (root.children) {
      for (const child of root.children) {
        const childName = typeof child === 'string' ? child : child.name;
        const childSlug = slugify(childName);
        let subCat = await (prisma as any).marketplaceCategory.findUnique({ where: { slug: childSlug } });
        if (!subCat) {
          subCat = await (prisma as any).marketplaceCategory.create({
            data: {
              name: childName,
              slug: childSlug,
              parentId: rootCat.id,
              image: (child as any).image
            }
          });
          console.log(`  Created sub: ${subCat.name}`);
        } else {
          // ensure parent is correct and update image
          await (prisma as any).marketplaceCategory.update({
            where: { id: subCat.id },
            data: { 
              parentId: rootCat.id,
              image: (child as any).image
            }
          });
          console.log(`  Updated sub: ${subCat.name}`);
        }

        // Sub-sub categories (if any)
        if (typeof child === 'object' && (child as any).children) {
          for (const gchildName of (child as any).children) {
            const gchildSlug = slugify(gchildName);
            let gchildCat = await (prisma as any).marketplaceCategory.findUnique({ where: { slug: gchildSlug } });
            if (!gchildCat) {
              gchildCat = await (prisma as any).marketplaceCategory.create({
                data: {
                  name: gchildName,
                  slug: gchildSlug,
                  parentId: subCat.id
                }
              });
              console.log(`    Created gchild: ${gchildCat.name}`);
            } else {
              await (prisma as any).marketplaceCategory.update({
                where: { id: gchildCat.id },
                data: { parentId: subCat.id }
              });
              console.log(`    Sub-sub exists: ${gchildCat.name}`);
            }
          }
        }
      }
    }
  }

  console.log('Finished seeding categories!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
