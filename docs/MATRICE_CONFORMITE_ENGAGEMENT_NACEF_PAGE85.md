# Dossier d'Homologation NACEF — Matrice de Conformité et d'Engagement (CDC Page 85)
> **Document :** Dossier Technique d'Accréditation NACEF / S-MDF v1.2 — Direction Générale des Impôts (DGI)  
> **Éditeur / Solution :** ElKassa POS / CoffeeShop B2B v2.0  
> **Réf. Formulaire CDC :** Tableau des Exigences — Page 85  
> **Date de Soumission :** Septembre 2026

---

## 📋 Présentation de la Matrice d'Homologation (Notice Page 85)

Conformément au Cahier des Charges NACEF (v1.2, section 8, page 85) publié par la DGI :
- **Exigences de Nature « C : Conformité »** : Nécessitent la description explicite de la **configuration technique mise en œuvre** ainsi que le **scénario de test** apportant la preuve empirique de conformité.
- **Exigences de Nature « E : Engagement »** : Impliquent l'engagement ferme de l'éditeur (« Oui » / « Non ») au respect des règles de sécurité, d'inaltérabilité et de déontologie légale.

---

## 1. Module 1 : Authentification & Sécurité des Accès

| Code Exigence | Libellé de l'Exigence CDC NACEF | Nature | Conformité Obligatoire | Configuration Technique Mise en Œuvre | Scénarios de Test d'Homologation | Réf. Dossier (Page / §) |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: |
| **E0101** | Contrôle d'accès et authentification forte de l'agent de caisse (PIN / Mot de passe / Rôle). | **C** | **Oui** | Authentification JWT sécurisée via `NacefAuthGuard` avec hashage bcrypt du PIN agent. Session fermée automatiquement sur inactivité. | **Test T-0101** : Saisie d'un PIN erroné 3 fois ➔ Blocage de la caisse + création d'une entrée de sécurité dans `FiscalLog`. | Page 12, § 2.1 |
| **E0102** | Séparation des rôles (Caissier, Barista, Gérant, Administrateur). | **C** | **Oui** | Système RBAC NestJS (`@Roles('BARISTA', 'MANAGER', 'ADMIN')`). L'annulation de vente nécessite l'approbation d'un gérant. | **Test T-0102** : Tentative d'annulation par un profil caissier ➔ Refus HTTP 403 + popup d'autorisation gérant. | Page 14, § 2.3 |
| **E0103** | Horodatage sécurisé des connexions et déconnexions. | **C** | **Oui** | Journalisation atomique des événements d'accès avec horodatage UTC+1 dans la table `AuditLog`. | **Test T-0103** : Connexion/Déconnexion agent ➔ Vérification de l'enregistrement de la séquence ISO-8601. | Page 15, § 2.4 |
| **E0104** | Engagement de non-divulgation des clés et secrets cryptographiques. | **E** | **Oui** | **Oui** — L'éditeur s'engage à conserver la confidentialité des secrets HMAC et paires de clés RSA. | N/A (Engagement Éditeur) | Page 16, § 2.5 |

---

## 2. Module 2 : Traitement des Ventes & Émission des Tickets (Page 85)

| Code Exigence | Libellé de l'Exigence CDC NACEF | Nature | Conformité Obligatoire | Configuration Technique Mise en Œuvre | Scénarios de Test d'Homologation | Réf. Dossier (Page / §) |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: |
| **E0201** | Numérotation séquentielle ininterrompue des tickets et factures. | **C** | **Oui** | Compteur atomique `currentFiscalSequence` en base PostgreSQL par boutique. Aucun trou de séquence autorisé. | **Test T-0201** : Génération de 100 ventes simultanées ➔ Vérification de l'incrémentation stricte `N+1` sans doublon ni saut. | Page 22, § 3.2 |
| **E0202** | Scellement cryptographique et chaînage HMAC SHA-256 (`previousHash`). | **C** | **Oui** | Algorithme `buildNextFiscalMetadata()` : chaque ticket concatène `storeId + terminalId + sequenceNumber + totalTtc + previousHash` signé par HMAC SHA-256. | **Test T-0202** : Altération manuelle d'une ligne de vente en base ➔ Invalidation immédiate du chaînage détectée par `verifyChainIntegrity()`. | Page 25, § 3.5 |
| **E0203** | Marquage explicite des Duplicatas (`*** DUPLICATA - COPIE TICKET ***`). | **C** | **Oui** | `PrintService.ts` vérifie `sale.isDuplicate` / `nacefOperationType === 'DUPLICATA'` et imprime le badge encadré ainsi que `Type transaction : DUPLICATA`. | **Test T-0203** : Réimpression depuis `/admin/sales` ➔ Confirmation visuelle de la mention Duplicata sur l'imprimante thermique. | Page 28, § 3.8 |
| **E0204** | Identification de la caisse et numéro de série (IMDF & N° Série). | **C** | **Oui** | Champs `imdf` (14 chars) et `terminalId` transmis obligatoirement dans l'en-tête du ticket thermal et la trame JSON NACEF. | **Test T-0204** : Impression de ticket ➔ Vérification de la présence explicite du matricule IMDF et n° de série caisse. | Page 30, § 4.1 |
| **E0205** | Restitution du QR Code NACEF conforme au schéma DGI. | **C** | **Oui** | Module `qrcode` générant l'image QR encodant les paramètres légaux (Matricule fiscal, ID transaction, Montants HT/TVA/TTC, Signature). | **Test T-0205** : Scan du QR Code imprimé via l'application de contrôle DGI ➔ Lecture correcte des 6 paramètres fiscaux. | Page 33, § 4.4 |
| **E0206** | Ventilation exacte de la TVA selon l'Annexe A5 (Codes 10, 11, 20). | **C** | **Oui** | `PrintService.ts` & `nacef.helpers.ts` appliquent la codification officielle : Code 10 (TVA 7%), Code 11 (TVA 19%), Code 20 (Timbre 0,100 DT). | **Test T-0206** : Vente mixte (Sur place + Emporté) ➔ Vérification de la grille de TVA ventilée par Code 10 et 11. | Page 36, § 4.7 |
| **E0207** | Interdiction absolue de modification ou suppression de vente validée. | **E** | **Oui** | **Oui** — L'éditeur s'engage : aucune fonction `DELETE` ou `UPDATE` n'existe sur la table `Sale`. Toute correction se fait via avoir/annulation. | N/A (Engagement Éditeur) | Page 38, § 4.9 |

---

## 3. Module 3 : Connexion & Interface S-MDF (Notice CDC Page 85)

| Code Exigence | Libellé de l'Exigence CDC NACEF | Nature | Conformité Obligatoire | Configuration Technique Mise en Œuvre | Scénarios de Test d'Homologation | Réf. Dossier (Page / §) |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: |
| **E0301** | Communication HTTP/JSON sur le port LAN `10006` vers le S-MDF local. | **C** | **Oui** | Service `nacefClient.ts` exécutant les appels HTTP vers `/sic/external/operation` sur le boîtier S-MDF local (IP LAN). | **Test T-0301** : Envoi de trame de vente ➔ Réception du code HTTP 200 OK avec le sceau numérique du S-MDF local. | Page 44, § 5.2 |
| **E0308** | Transmission vers le PGSCEF via réseau mobile APN 3G/4G dédié DGI. | **C** | **Oui** | L'Agent S-MDF physique local embarque la carte SIM accréditée DGI pour transiter en réseau cellulaire isolé conformément à `[E0308]`. | **Test T-0308** : Coupure de la ligne fixe Ethernet ➔ Vérification de la transmission continue des ventes via le modem 4G APN DGI. | Page 50, § 5.8 |
| **E0309** | Gestion résiliente du mode déconnecté (Hors-Ligne / Offline). | **C** | **Oui** | Sauvegarde locale IndexedDB + marqueur `isOffline: true`. Impression du ticket fiscal avec badge `*** VENTE HORS LIGNE (OFFLINE) ***`. | **Test T-0309** : Déconnexion complète du WAN ➔ Vente enregistrée localement et imprimée conforme, puis resynchronisée dès retour réseau. | Page 53, § 5.11 |
| **E0310** | Engagement d'interopérabilité avec tous les boîtiers S-MDF homologués. | **E** | **Oui** | **Oui** — L'éditeur s'engage à respecter le protocole d'échange JSON v1.1.4 sans altération du standard DGI. | N/A (Engagement Éditeur) | Page 55, § 5.13 |

---

## 4. Module 4 : Clôtures Journalières & Rapport Z (Page 85)

| Code Exigence | Libellé de l'Exigence CDC NACEF | Nature | Conformité Obligatoire | Configuration Technique Mise en Œuvre | Scénarios de Test d'Homologation | Réf. Dossier (Page / §) |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: |
| **E0401** | Génération automatique et inaltérable du Rapport Z de fin de journée. | **C** | **Oui** | Modèle `ZReport` agrégeant les totaux cumulés HT, TVA (par code 10/11) et TTC. Verrouillage strict des ventes de la journée. | **Test T-0401** : Déclenchement de la clôture Z ➔ Calcul exact des totaux + verrouillage des ventes contre toute saisie rétroactive. | Page 62, § 6.2 |
| **E0402** | Chaînage cryptographique des rapports Z entre eux (`previousZHash`). | **C** | **Oui** | Chaque Rapport Z calcule un hash HMAC SHA-256 incorporant le hash du Rapport Z de la veille (`previousZHash`). | **Test T-0402** : Vérification de l'intégrité de la chaîne des Z sur 30 jours ➔ Validation sans rupture de séquence. | Page 65, § 6.5 |
| **E0403** | Interdiction de réouverture d'une journée fiscale clôturée. | **E** | **Oui** | **Oui** — L'éditeur s'engage : aucun mécanisme ne permet de modifier ou d'annuler un Rapport Z scellé. | N/A (Engagement Éditeur) | Page 68, § 6.8 |

---

## 5. Module 5 : Traçabilité, Journal d'Audit & Sécurité (Page 85)

| Code Exigence | Libellé de l'Exigence CDC NACEF | Nature | Conformité Obligatoire | Configuration Technique Mise en Œuvre | Scénarios de Test d'Homologation | Réf. Dossier (Page / §) |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: |
| **E0501** | Traçabilité intégrale dans le journal d'audit (`NacefSyncLog` & `FiscalLog`). | **C** | **Oui** | Prise de note automatique de toute anomalie, tentative d'annulation, coupure de courant ou erreur réseau. | **Test T-0501** : Provocation d'une erreur de communication S-MDF ➔ Vérification de l'inscription de l'incident dans `NacefSyncLog`. | Page 74, § 7.2 |
| **E0502** | Conservation minimale des données fiscales pendant la durée légale (10 ans). | **C** | **Oui** | Stratégie d'archivage PostgreSQL avec sauvegardes automatiques répliquées et chiffrées AES-256. | **Test T-0502** : Export d'archive fiscale au format NACEF XML/JSON ➔ Restitution intégrale des données sur la période demandée. | Page 78, § 7.6 |
| **E0503** | Engagement de conformité aux mises à jour réglementaires DGI. | **E** | **Oui** | **Oui** — L'éditeur s'engage à fournir les mises à jour logicielles de sécurité et de conformité fiscale pendant toute la durée du contrat. | N/A (Engagement Éditeur) | Page 82, § 7.10 |

---

## 📝 Attestation de Conformité & Signature de l'Éditeur

Je soussigné, **Représentant Légal de l'Éditeur ElKassa POS / CoffeeShop B2B**, certifie l'exactitude des configurations techniques et des engagements décrits dans la présente matrice de conformité (Tableau CDC Page 85).

- **Nom du Logiciel :** ElKassa POS (Solution Caisse & Gestion B2B)
- **Version Certifiée :** v2.0.0
- **Avis de Conformité Obligatoire :** **OUI (100% Conforme)**
