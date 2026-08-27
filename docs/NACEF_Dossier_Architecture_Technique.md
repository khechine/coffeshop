# Dossier d'architecture technique
**Référence NACEF :** [E0202], [E0205]
**Produit :** CoffeeShop B2B / ElKassa POS
**Version :** 1.0.0
**Date :** 2026-08-27

## Historique des versions
| Version | Date | Motif de la mise à jour |
|---------|------|--------------------------|
| 1.0.0 | 27/08/2026 | Création initiale pour l'homologation NACEF. |

---

## 1. Stockage sécurisé des données (Signatures et Hashs)
La solution implémente une piste d'audit inaltérable (Audit Trail) :
- **Hashage (SHA-256)** : Chaque transaction est hachée (`hashInput`) en incluant la date, le montant, la TVA et le hash de la transaction précédente (chaînage cryptographique).
- **Signature S-MDF** : Le hash est envoyé à l'agent S-MDF qui retourne une signature électronique certifiée (`HMAC/RSA`).
- **Stockage** : Les données sont stockées dans PostgreSQL. Toute altération directe en base de données brisera la chaîne de hachage, rendant la fraude détectable.

## 2. Flux entre les composants du système
1. **POS (Client)** ➔ *Requête HTTP POST* ➔ **API Centrale** : Envoi des détails de la vente.
2. **API Centrale** ➔ *Formatage JSON* ➔ Génération de l'objet `ncf.cashier.operation`.
3. **API Centrale** ➔ *Requête HTTP (Port 10006)* ➔ **Agent S-MDF local** : Demande de scellement.
4. **Agent S-MDF** ➔ *Réponse JSON* ➔ **API Centrale** : Retourne la signature, le QR code et les compteurs.
5. **API Centrale** ➔ *Sauvegarde BDD + Réponse HTTP* ➔ **POS (Client)** : Impression du ticket.

## 3. Fonctionnalités système
- **Sauvegarde et Restauration** : Sauvegardes automatisées de la base PostgreSQL. Les journaux S-MDF sont archivés et consultables.
- **Archivage et Export** : Export autonome au format JSON standard, conservant les signatures pour les contrôles fiscaux (période de conservation : 6 ans).
- **Clôture** : Génération d'un Rapport Z quotidien consolidant la TVA collectée et verrouillant la période.
- **Impression** : Pilotage direct des imprimantes ESC/POS via le réseau ou USB, incluant l'impression haute-définition du QR code NACEF.
