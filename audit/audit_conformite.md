# Audit de Conformité NACEF (Caisse Enregistreuse Fiscale)

Suite à l'analyse du code source du point de vente (notamment `fiscal.service.ts`, `schema.prisma`, et `FiscalSettings.tsx`) et à sa confrontation avec le cahier des charges NACEF.

## Conformité au Cahier des Charges

**Statut : Non-Conforme**

Le système actuel *simule* un fonctionnement fiscal par un chaînage cryptographique interne (SHA-256), mais ne respecte pas l'exigence fondamentale du NACEF : l'utilisation obligatoire du module S-MDF (ou E-MDF) fourni ou validé par le Ministère des Finances.

**Éléments actuellement présents mais insuffisants :**
*   **Chaînage des tickets :** Un `hash` basé sur le ticket précédent (`previousHash`) est calculé. C'est une bonne pratique, mais le NACEF exige que ce soit le S-MDF qui génère et certifie ce chaînage via une signature électronique qualifiée.
*   **Numérotation séquentielle :** Présente (`F-2026-000001`), mais doit répondre aux spécifications exactes des types de transactions NACEF.
*   **TVA :** La notion de `taxRate` et `taxCode` est présente dans le modèle de données, ce qui est conforme avec l'Annexe 4 du cahier des charges.

## Points Faibles Critiques

1.  **Absence d'intégration du S-MDF (Client/Agent) :** Le code ne fait aucun appel à l'API du S-MDF (`S-MDF agent`). La signature des transactions doit obligatoirement être déléguée à ce module externe.
2.  **Structure des données (Format JSON non conforme) :** Le cahier des charges (exigence E0803) impose une structure JSON très stricte pour l'échange de données avec le S-MDF et la plateforme centrale. Actuellement, la sérialisation est personnalisée.
3.  **Format du Ticket de Caisse :** Le ticket imprimé doit respecter le modèle de l'Annexe 3 (présence de l'identifiant du module MDF `IMDF`, de la signature générée par le MDF sous forme de QR Code, et des mentions légales obligatoires).
4.  **Traçabilité et Maintenance :** Le cahier des charges impose de tracer les événements matériels et logiciels (exigence E0103, gestion des versions, accès de l'administration fiscale). Le `FiscalLog` actuel est une bonne base, mais il doit interagir avec le S-MDF pour signaler ces anomalies.
