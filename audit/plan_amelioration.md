# Plan d'Amélioration (Mise en conformité NACEF)

Pour obtenir l'homologation, l'intégration doit être mise à jour en suivant ces étapes :

### Phase 1 : Refonte de `FiscalService`
*   Remplacer la logique de hashage locale (`crypto.createHash`) par des appels HTTP/REST ou WebSocket vers l'agent S-MDF installé localement ou sur le réseau.
*   Implémenter les différents types de transactions supportés par NACEF (Vente, Annulation de ticket, Remboursement).
*   Gérer les états du S-MDF (Connecté, Déconnecté, Bloqué) et implémenter la gestion des `offlineTickets` (tickets générés hors connexion, à synchroniser plus tard avec la plateforme).

### Phase 2 : Structuration des Données
*   Mettre à jour la sérialisation des tickets pour respecter strictement le modèle JSON défini dans le cahier des charges (attributs exacts, nomenclature selon l'exigence E0803).
*   Assigner un identifiant unique `IMDF` à chaque terminal (PosTerminal) dans la base de données.

### Phase 3 : Impression et Clôture
*   Modifier le service d'impression (`PrintService.ts`) pour inclure le QR Code NACEF, le compteur fiscal officiel renvoyé par le MDF, et l'identifiant `IMDF`.
*   Refondre la fonction `generateZReport` pour qu'elle interroge le S-MDF afin de générer le rapport Z officiel (Clôture journalière) et l'imprimer selon le format requis par l'administration.

### Phase 4 : Déclarations Administratives
*   Implémenter la déclaration automatique des versions de l'application et la traçabilité (logs) des événements logiciels et matériels exigées par la plateforme NACEF.
