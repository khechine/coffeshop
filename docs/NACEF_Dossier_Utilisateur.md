# Dossier utilisateur
**Référence NACEF :** [E0202], [E0208]
**Produit :** CoffeeShop B2B / ElKassa POS
**Version :** 1.0.0
**Date :** 2026-08-27

## Historique des versions
| Version | Date | Motif de la mise à jour |
|---------|------|--------------------------|
| 1.0.0 | 27/08/2026 | Création initiale pour l'homologation NACEF. |

---

## PARTIE I : Manuel à destination de l'utilisateur final

### 1. Démarrage et connexion
1. Allumez la caisse et lancez l'application **ElKassa POS**.
2. Saisissez votre code PIN personnel pour ouvrir votre session (Shift).
3. Entrez le fond de caisse initial si demandé.

### 2. Enregistrement d'une vente
1. Sélectionnez les produits sur l'écran tactile pour les ajouter au panier.
2. Appuyez sur **ENCAISSER**.
3. Choisissez le mode de paiement (Espèces, Carte, TPE).
4. La caisse contacte automatiquement l'agent fiscal S-MDF.
5. Le ticket est imprimé avec le QR code officiel de l'État. *Remettez obligatoirement le ticket au client.*

### 3. Remboursement (Avoir)
La suppression d'un ticket validé est interdite. Pour corriger une erreur :
1. Allez dans l'historique des tickets.
2. Sélectionnez le ticket erroné et choisissez **Rembourser (Avoir)**.
3. Un nouveau ticket négatif avec son propre numéro et son propre QR Code S-MDF sera généré et imprimé.

### 4. Clôture de fin de journée (Rapport Z)
1. En fin de service, allez dans le menu **Clôture de Caisse**.
2. Appuyez sur **Fermer la Caisse / Générer Rapport Z**.
3. Le système agrège les TVA de la journée, clôture la période fiscale en base de données et imprime le rapport détaillé.

---

## PARTIE II : Manuel à destination de l'administration fiscale

Ce manuel décrit la procédure permettant à un contrôleur fiscal d'extraire les données d'encaissement et la piste d'audit lors d'une vérification.

### 1. Accès au module d'audit
1. Sur la tablette/caisse ou le back-office, un utilisateur ayant les droits "Gérant" ou "Super Admin" doit se connecter.
2. Rendez-vous dans **Paramètres > Conformité Fiscale (NACEF)** > **Export & Archivage**.

### 2. Export des données sur support externe amovible
1. Insérez une clé USB formatée (FAT32/exFAT) dans le port USB de la machine ou de la tablette.
2. Sur l'interface, sélectionnez **Exporter les archives fiscales**.
3. Choisissez la période fiscale souhaitée (De [Date] à [Date]).
4. Sélectionnez le format de sortie : **JSON Structuré NACEF**.
5. Cliquez sur **Sauvegarder vers USB**.

### 3. Vérification des pistes d'audit
L'export génère un dossier contenant :
- `tickets.json` : Historique inaltérable de tous les tickets avec leurs données financières.
- `audit_trail.json` : Chaîne de hachage (Hash SHA-256 de chaque transaction lié à la précédente) et les signatures retournées par le S-MDF.
- `z_reports.json` : Historique des clôtures journalières (Z).

*Note : Les données exportées peuvent être lues par n'importe quel parseur JSON ou visionneuse de texte (Notepad, VSCode), indépendamment du logiciel de caisse, conformément aux exigences NACEF.*
