# 05 — Module Conformité Fiscale NACEF & S-MDF

## 5.1 Contexte Réglementaire & Périmètre

La Tunisie a introduit l'obligation pour les systèmes de caisse d'enregistrer toutes les transactions de manière inaltérable et de communiquer avec un Système de Mémorisation des Données Fiscales (**S-MDF** ou **NACEF**).

Le module fiscal d'ElKassa implémente l'ensemble des exigences de certification :
1. **Intégrité Cryptographique & Chaînage (Blockchain locale)** : Chaque ticket calcule une empreinte SHA-256 combinant ses données et le hash du ticket précédent.
2. **Numérotation Séquentielle Ininterrompue** : Pas de trou de séquence autorisé dans la numérotation des factures/tickets (`F-AAAA-XXXXXX`).
3. **Clôture Journalière (Z-Report)** : Calcul des cumuls fiscaux journaliers par taux de TVA et chaînage cryptographique des rapports Z entre eux.
4. **Signature Numérique & QR Code Fiscal** : Signature transmise au S-MDF et restitution d'un QR code imprimé sur le ticket client.
5. **Journal d'Audit des Événements Techniques** : Traçabilité des allumages caisse, logins caissiers, pannes, coupures réseau et tentatives d'annulation.

---

## 5.2 Fichiers Sources & Architecture

| Composant | Fichier | Description |
|-----------|---------|-------------|
| **Contrôleur NACEF** | `apps/api/src/nacef/nacef.controller.ts` | Endpoints `/nacef/initialize`, `/nacef/sign`, `/nacef/manifest`, `/nacef/sync`, `/nacef/ready`, `/nacef/config` |
| **Service NACEF** | `apps/api/src/nacef/nacef.service.ts` | Orchestration des échanges avec le boîtier/agent S-MDF local |
| **Client HTTP NACEF** | `apps/api/src/nacef/nacef-client.ts` | Communication HTTP vers l'agent S-MDF (port 10006 par défaut) |
| **Générateur Ticket** | `apps/api/src/nacef/nacef-ticket.builder.ts` | Assemblage de la trame JSON conforme à la norme DGI |
| **Simulateur S-MDF** | `apps/api/src/nacef/mock-smdf.server.ts` | Serveur Mock intégré simulant les réponses du matériel fiscal homologué pour les tests et la démo |
| **Domaine Fiscal & Hash** | `apps/api/src/domains/fiscal/` | Calcul des totaux HT/TVA et construction de `buildNextFiscalMetadata()` |
| **Service Fiscal Caisse** | `apps/api/src/sales/fiscal.service.ts` | Gestion de la persistance des logs fiscaux et vérification de signatures |

---

## 5.3 Spécification du Protocole & des Fonctions

### Algorithme de Chaînage Fiscal (`buildNextFiscalMetadata`)

Pour chaque vente créée :
1. Récupération du `previousHash` (ou `GENESIS_HASH` composé de 64 zéros pour la première vente).
2. Concaténation normalisée des données critiques :
   ```
   hashInput = storeId + "|" + terminalId + "|" + sequenceNumber + "|" + totalTtc + "|" + previousHash
   ```
3. Calcul du hash courant :
   ```typescript
   currentHash = crypto.createHmac('sha256', fiscalSecret).update(hashInput).digest('hex');
   ```
4. Incrémentation atomique du numéro de séquence de la boutique (`currentFiscalSequence`).

### Traitement de Signature NACEF (`NacefService.signTicket`)

- **Route API** : `POST /nacef/sign/:saleId`
- **Flux d'Exécution** :
  1. Charge la vente avec ses lignes de détail, les informations de la boutique (Matricule Fiscal, IMDF, référence établissement).
  2. Utilise `NacefTicketBuilder` pour formater le payload officiel conforme (sections en-tête, articles, taxes, règlements).
  3. Envoie la requête signée au boîtier S-MDF via `nacefClient.postTicket()`.
  4. Réceptionne le ticket signé contenant l'identifiant fiscal `nacefTicketId` et le QR Code légal `nacefQrCode`.
  5. Met à jour la table `Sale` dans PostgreSQL et journalise dans `NacefSyncLog`.

### Clôture Journalière (Rapport Z Fiscale)

- **Modèle** : `ZReport`
- **Mécanisme** :
  - Calcule la somme des ventes non annulées de la journée par taux de TVA (ex: TVA 7%, TVA 19%).
  - Récupère le hash du Z-Report de la veille (`previousZHash`).
  - Calcule le hash d'intégrité du Z-Report courant.
  - Verrouille toutes les ventes de la journée en leur assignant le `zReportId`.
  - Empêche toute création ultérieure de vente antidatée sur la journée clôturée.

---

## 5.4 Modèles Prisma Dédiés

- `Sale` (champs : `isFiscal`, `fiscalNumber`, `sequenceNumber`, `fiscalDay`, `hash`, `previousHash`, `hashInput`, `signature`, `nacefTicketId`, `nacefQrCode`, `nacefSyncedAt`, `nacefOperationType`, `nacefContext`)
- `ZReport` (`id`, `storeId`, `reportDay`, `totalTtc`, `totalHt`, `totalTax`, `taxBreakdown`, `salesCount`, `hash`, `previousZHash`, `isClosed`)
- `NacefSyncLog` (`id`, `storeId`, `action`, `status`, `request`, `response`, `errorMessage`, `createdAt`)
- `FiscalLog` (`id`, `saleId`, `action`, `data`, `hash`, `createdAt`)
- `Store` (champs : `imdf`, `matriculeFiscal`, `establishmentReference`, `accreditationReference`, `smdfUrl`, `fiscalSecret`, `currentFiscalSequence`)

---

## 5.5 Dépendances & Sécurité

- `crypto` : HMAC et SHA-256 natifs Node.js.
- `MockSmdfServer` : Initialisé automatiquement au démarrage de NestJS sur le port `10006` en mode développement.
- Sécurisation des endpoints via `NacefAuthGuard` (validation de l'en-tête secret `x-nacef-key`).
