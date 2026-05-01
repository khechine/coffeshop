import { prisma } from '@coffeeshop/database';

export class ERPNextClient {
  private baseUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private storeId: string;

  constructor(baseUrl: string, apiKey: string, apiSecret: string, storeId: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash if present
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.storeId = storeId;
  }

  static async initialize(storeId: string): Promise<ERPNextClient | null> {
    const config = await (prisma as any).erpIntegration.findUnique({
      where: { storeId }
    });

    if (!config || !config.isActive) return null;

    return new ERPNextClient(config.baseUrl, config.apiKey, config.apiSecret, storeId);
  }

  private async fetchAPI(endpoint: string, params: Record<string, any> = {}) {
    const url = new URL(`${this.baseUrl}/api/resource/${endpoint}`);
    
    // Add pagination defaults to avoid getting overwhelmed, but high enough for initial sync
    if (!params.limit_page_length) params.limit_page_length = 1000;
    
    Object.keys(params).forEach(key => url.searchParams.append(key, typeof params[key] === 'object' ? JSON.stringify(params[key]) : params[key]));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ERPNext API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const json = await response.json();
    return json.data || [];
  }

  private async fetchSingle(endpoint: string, id: string) {
    const url = `${this.baseUrl}/api/resource/${endpoint}/${encodeURIComponent(id)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return null;
    const json = await response.json();
    return json.data;
  }

  async syncCategories() {
    console.log("Syncing categories...");
    const groups = await this.fetchAPI('Item Group', {
      fields: ['name', 'parent_item_group', 'is_group']
    });

    const categoryMap = new Map<string, string>(); // ERP name -> Prisma ID

    // First pass: Create all categories
    for (const group of groups) {
      let category = await prisma.category.findFirst({
        where: { storeId: this.storeId, name: group.name }
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: group.name,
            storeId: this.storeId,
            active: true
          }
        });
      }
      categoryMap.set(group.name, category.id);
    }

    // Second pass: Link hierarchy
    for (const group of groups) {
      if (group.parent_item_group) {
        const childId = categoryMap.get(group.name);
        const parentId = categoryMap.get(group.parent_item_group);

        if (childId && parentId) {
          await prisma.category.update({
            where: { id: childId },
            data: { parentId }
          });
        }
      }
    }
    
    return categoryMap;
  }

  async syncItems(categoryMap: Map<string, string>) {
    console.log("Syncing items...");
    const items = await this.fetchAPI('Item', {
      fields: ['name', 'item_name', 'item_group', 'image', 'is_stock_item', 'is_sales_item', 'description', 'stock_uom']
    });

    const prices = await this.fetchAPI('Item Price', {
      fields: ['item_code', 'price_list_rate']
    });

    const priceMap = new Map(prices.map((p: any) => [p.item_code, p.price_list_rate]));
    const itemMap = new Map<string, string>(); // ERP name -> Prisma Product ID / StockItem ID

    for (const item of items) {
      let categoryId = item.item_group ? categoryMap.get(item.item_group) : undefined;
      
      // Fallback category if none found
      if (!categoryId) {
        let generalCat = await prisma.category.findFirst({ where: { storeId: this.storeId, name: 'Général' } });
        if (!generalCat) {
          generalCat = await prisma.category.create({ data: { storeId: this.storeId, name: 'Général', active: true } });
          categoryMap.set('Général', generalCat.id);
        }
        categoryId = generalCat.id;
      }

      const price = priceMap.get(item.name) || 0;
      
      const imageUrl = item.image ? (item.image.startsWith('http') ? item.image : `${this.baseUrl}${item.image}`) : null;

      // Handle Stock Item
      if (item.is_stock_item === 1) {
        let stockItem = await prisma.stockItem.findFirst({
          where: { storeId: this.storeId, name: item.item_name }
        });

        if (!stockItem) {
          stockItem = await prisma.stockItem.create({
            data: {
              storeId: this.storeId,
              name: item.item_name,
              quantity: 0,
              cost: Number(price) || 0, // Assuming price list might apply or cost is tracked here
              minThreshold: 5
            }
          });
        } else {
          stockItem = await prisma.stockItem.update({
             where: { id: stockItem.id },
             data: { cost: Number(price) || 0 }
          });
        }
        itemMap.set(`STOCK_${item.name}`, stockItem.id);
      }

      // Handle Sales Item
      if (item.is_sales_item === 1) {
        let product = await prisma.product.findFirst({
          where: { storeId: this.storeId, name: item.item_name }
        });

        if (!product) {
          product = await prisma.product.create({
            data: {
              storeId: this.storeId,
              name: item.item_name,
              image: imageUrl,
              price: Number(price) || 0,
              categoryId,
              active: true
            }
          });
        } else {
          product = await prisma.product.update({
            where: { id: product.id },
            data: {
              price: Number(price) || 0,
              image: imageUrl || product.image,
              categoryId
            }
          });
        }
        itemMap.set(`PROD_${item.name}`, product.id);
      }
    }
    
    return itemMap;
  }

  async syncRecipes(itemMap: Map<string, string>) {
    console.log("Syncing recipes (BOM)...");
    const boms = await this.fetchAPI('BOM', {
      fields: ['name', 'item', 'is_active', 'is_default']
    });

    for (const bom of boms) {
      if (bom.is_active !== 1) continue;

      const productId = itemMap.get(`PROD_${bom.item}`);
      if (!productId) continue;

      // Fetch specific BOM to get items
      const bomDetails = await this.fetchSingle('BOM', bom.name);
      if (!bomDetails || !bomDetails.items) continue;

      // Clear existing recipe
      await prisma.recipeItem.deleteMany({
        where: { productId }
      });

      // Insert new recipe items
      for (const reqItem of bomDetails.items) {
        const stockItemId = itemMap.get(`STOCK_${reqItem.item_code}`);
        if (!stockItemId) continue;

        await prisma.recipeItem.create({
          data: {
            productId,
            stockItemId,
            quantity: reqItem.qty,
            consumeType: 'BOTH',
            isPackaging: false
          }
        });
      }
    }
  }

  async runFullSync() {
    try {
      const categoryMap = await this.syncCategories();
      const itemMap = await this.syncItems(categoryMap);
      await this.syncRecipes(itemMap);
      
      await (prisma as any).erpIntegration.update({
        where: { storeId: this.storeId },
        data: { lastSyncAt: new Date() }
      });
      
      return { success: true, message: 'Synchronisation réussie' };
    } catch (error: any) {
      console.error('ERP Sync Error:', error);
      return { success: false, error: error.message || 'Erreur lors de la synchronisation' };
    }
  }
}
