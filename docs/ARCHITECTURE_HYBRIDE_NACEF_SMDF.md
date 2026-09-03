# Guide d'Implémentation : Architecture Hybride NACEF / S-MDF Local
> **Produit :** ElKassa POS / CoffeeShop B2B  
> **Conformité :** NACEF v1.2 / Exigence [E0308] (Liaison GSM/UMTS APN Dédié DGI)  
> **Date :** 2026-09-03

---

## 1. Contexte & Principe Fonctionnel

Cette architecture permet de faire fonctionner une caisse enregistreuse Cloud/SaaS tout en respectant l'exigence **[E0308]** de la DGI tunisienne, qui impose une connexion au **PGSCEF** (Plateforme de Gestion des Caisses Enregistreuses Fiscales) via un **APN réseau mobile 3G/4G dédié**.

### 📐 Schéma du Flux d'Encaissement

```
   ┌─────────────────────────────────────────────────────────┐
   │ 1. CASSE POS CLOUD (Navigateur / Tablette)              │
   │    L'utilisateur valide le panier ➔ "Encaisser"          │
   └──────────────────────────┬──────────────────────────────┘
                              │
                              ▼
   ┌─────────────────────────────────────────────────────────┐
   │ 2. BACKEND CLOUD (API NestJS / Server Actions)          │
   │    - Enregistre la vente en base PostgreSQL             │
   │    - Prépare l'objet NACEF (ncf.cashier.operation)      │
   └──────────────────────────┬──────────────────────────────┘
                              │
                              ▼
   ┌─────────────────────────────────────────────────────────┐
   │ 3. AGENT S-MDF LOCAL (Mini-PC / Raspberry / Android)    │
   │    (Accédé via IP locale http://192.168.1.X:10006)      │
   │    - Signe électroniquement le ticket avec certificat    │
   │    - Génère la chaîne QR Code NACEF                     │
   │    - Transmet au PGSCEF via Carte SIM / APN 4G DGI      │
   └──────────────────────────┬──────────────────────────────┘
                              │
                              ▼
   ┌─────────────────────────────────────────────────────────┐
   │ 4. RÉINJECTION & IMPRESSION                              │
   │    - Signature & QR Code enregistrés en base Cloud       │
   │    - Impression du ticket fiscal sur l'imprimante ESC/POS │
   └──────────────────────────┴──────────────────────────────┘
```

---

## 2. Étapier d'Implémentation Technique

### Étape 1 : Modification du Schéma de Base de Données (`schema.prisma`)

Chaque boutique/store possède l'URL de son agent S-MDF local (ex: `http://192.168.1.50:10006`).

```prisma
// packages/database/prisma/schema.prisma

model Store {
  id               String   @id @default(uuid())
  name             String
  isFiscalEnabled  Boolean  @default(false)
  smdfUrl          String?  // Ex: "http://192.168.1.50:10006"
  smdfSerialNumber String?  // Numéro de série du boîtier S-MDF physique
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model Sale {
  id             String   @id @default(uuid())
  storeId        String
  total          Float
  isFiscal       Boolean  @default(false)
  signature      String?  // Signature renvoyée par le S-MDF local
  qrCodeData     String?  // Chaîne pour génération QR Code NACEF
  fiscalNumber   String?  // Identifiant fiscal unique de la transaction
  sequenceNumber Int?     // Compteur de séquence S-MDF
  createdAt      DateTime @default(now())
}
```

---

### Étape 2 : Service Client NACEF Local (`nacef-local-client.ts`)

Créer un service qui communique directement avec l'agent S-MDF local sur le réseau du magasin (Port `10006`) :

```typescript
// apps/admin-dashboard/lib/nacef-local-client.ts

export interface NacefSignRequest {
  storeId: string;
  saleId: string;
  totalTtc: number;
  totalHt: number;
  totalTva: number;
  items: Array<{ name: string; qty: number; priceTtc: number; taxRate: number }>;
}

export interface NacefSignResponse {
  success: boolean;
  signature: string;
  qrCodeData: string;
  sequenceNumber: number;
  fiscalNumber: string;
}

export async function signTicketWithLocalSMDF(
  smdfUrl: string,
  payload: NacefSignRequest
): Promise<NacefSignResponse> {
  try {
    // 1. Formatage du DTO conforme à la norme S-MDF / NACEF v1.2
    const smdfPayload = {
      operationType: 'SALE',
      timestamp: new Date().toISOString(),
      amountTTC: payload.totalTtc,
      amountHT: payload.totalHt,
      amountVAT: payload.totalTva,
      itemsCount: payload.items.reduce((acc, i) => acc + i.qty, 0),
      items: payload.items.map(item => ({
        label: item.name,
        quantity: item.qty,
        unitPriceTTC: item.priceTtc,
        vatRate: item.taxRate * 100 // Ex: 19 pour 19%
      }))
    };

    // 2. Requête vers le port 10006 de l'agent local S-MDF
    const response = await fetch(`${smdfUrl}/sic/external/operation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smdfPayload)
    });

    if (!response.ok) {
      throw new Error(`Erreur S-MDF Local : HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      signature: data.signature || data.digitalSeal,
      qrCodeData: data.qrCode || data.qrCodeData,
      sequenceNumber: data.sequenceNumber,
      fiscalNumber: data.fiscalNumber
    };
  } catch (error) {
    console.error('Échec de la signature S-MDF local :', error);
    throw error;
  }
}
```

---

### Étape 3 : Intégration du Workflow d'Encaissement (`PremiumPOSClient.tsx`)

Intégrer le déclenchement de la signature au moment de la validation du panier dans le composant POS :

```typescript
// apps/admin-dashboard/app/pos/PremiumPOSClient.tsx

async function handleProcessPayment() {
  try {
    // 1. Enregistrer la vente sur le serveur Cloud ElKassa
    const saleResult = await recordSale({
      total,
      paymentMethod,
      items: currentCart,
      baristaId: cashierId,
      tableName: selectedTable?.label
    });

    // 2. Si la fiscalisation NACEF est activée pour cette boutique
    if (isFiscalEnabled && storeSmdfUrl) {
      toast.info("Signature fiscale en cours via l'agent S-MDF local...");

      // 3. Signature via l'agent S-MDF local (Mini-PC / Raspberry sur le LAN)
      const fiscalSign = await signTicketWithLocalSMDF(storeSmdfUrl, {
        storeId,
        saleId: saleResult.id,
        totalTtc: total,
        totalHt: subtotal,
        totalTva: total - subtotal,
        items: currentCart.map(i => ({
          name: i.name,
          qty: i.quantity,
          priceTtc: i.price,
          taxRate: i.taxRate || 0.19
        }))
      });

      // 4. Réinjection des métadonnées fiscales dans la base Cloud
      await updateSaleFiscalSignature(saleResult.id, {
        signature: fiscalSign.signature,
        qrCodeData: fiscalSign.qrCodeData,
        fiscalNumber: fiscalSign.fiscalNumber,
        sequenceNumber: fiscalSign.sequenceNumber
      });

      // Mise à jour de l'objet pour l'impression
      saleResult.signature = fiscalSign.signature;
      saleResult.qrCodeData = fiscalSign.qrCodeData;
    }

    // 5. Impression du ticket avec le QR Code NACEF
    await PrintService.printTicket(saleResult);

    toast.success("Vente enregistrée et signée NACEF !");
    clearCart();
    setIsPaymentModalOpen(false);

  } catch (err) {
    toast.error("Erreur lors de l'encaissement fiscal : " + err.message);
  }
}
```

---

### Étape 4 : Action de Réinjection des Métadonnées Fiscals (`actions.ts`)

```typescript
// apps/admin-dashboard/app/actions.ts

export async function updateSaleFiscalSignature(
  saleId: string,
  fiscalData: {
    signature: string;
    qrCodeData: string;
    fiscalNumber: string;
    sequenceNumber: number;
  }
) {
  const store = await getStore();
  if (!store) throw new Error("Boutique non trouvée");

  return await prisma.sale.update({
    where: { id: saleId },
    data: {
      isFiscal: true,
      signature: fiscalData.signature,
      qrCodeData: fiscalData.qrCodeData,
      fiscalNumber: fiscalData.fiscalNumber,
      sequenceNumber: fiscalData.sequenceNumber,
    }
  });
}
```

---

## 3. Garantie de Conformité aux Règles NACEF

1. **Exigence [E0308] (Réseau APN Dédié)** :  
   L'agent S-MDF local est physiquement relié à un modem 4G contenant la carte SIM pré-configurée avec l'APN privé DGI. C'est cet agent qui communique de manière autonome avec la plateforme PGSCEF.

2. **Résilience en Mode Déconnecté** :  
   En cas de perte temporaire du signal 4G, le S-MDF local stocke la transaction signée dans sa mémoire inaltérable sécurisée et effectue la synchronisation vers le PGSCEF dès le rétablissement de la connexion.

3. **Format du Ticket Imprimé** :  
   Le ticket imprimé sur l'imprimante thermique ESC/POS contient :
   - Le logo officiel NACEF
   - Le numéro fiscal unique (`fiscalNumber`)
   - Le numéro de séquence (`sequenceNumber`)
   - La signature électronique sous forme de texte scellé
   - Le QR Code NACEF scannable par les contrôleurs fiscaux
