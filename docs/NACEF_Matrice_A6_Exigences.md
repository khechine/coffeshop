# Annexe A6 - Matrice de correspondance des exigences NACEF
**Référence NACEF :** [E0209]
**Produit :** CoffeeShop B2B / ElKassa POS
**Version :** 1.0.0
**Date :** 2026-08-27

*Ce tableau récapitule, pour chaque exigence fonctionnelle ou technique du cahier des charges NACEF, le document de justification associé (titre, chapitre/paragraphe).*

| Réf. Exigence | Description Sommaire | Document(s) Justificatif(s) | Chapitre / Paragraphe de référence |
|---------------|----------------------|-----------------------------|------------------------------------|
| **[E0101]** | Engagement du fournisseur et veille réglementaire | `NACEF_ENGAGEMENT_FOURNISSEUR_E0101.md` | Chapitres 1, 2.1 |
| **[E0201]** | Documentation globale de la caisse (Conception, Exploitation...) | Présent document (Matrice A6) | Ensemble des dossiers documentaires |
| **[E0203]** | Dossier de Conception Générale | `NACEF_Dossier_Conception_Generale.md` | L'intégralité du document |
| **[E0204]** | Dossier de Spécifications Fonctionnelles | `NACEF_Dossier_Specifications_Fonctionnelles.md` | L'intégralité du document |
| **[E0205]** | Dossier d'Architecture Technique | `NACEF_Dossier_Architecture_Technique.md` | L'intégralité du document |
| **[E0206]** | Dossier de Maintenance | `NACEF_Dossier_Maintenance.md` | L'intégralité du document |
| **[E0207]** | Dossier d'Exploitation | `NACEF_Dossier_Exploitation.md` | L'intégralité du document |
| **[E0208]** | Dossier Utilisateur (Final et Contrôle Fiscal) | `NACEF_Dossier_Utilisateur.md` | Parties I et II |
| **[E0301-E0312]**| Inaltérabilité des données (Hash, Chaînage, Interdiction de suppression) | `NACEF_Dossier_Architecture_Technique.md` <br> `NACEF_Dossier_Specifications_Fonctionnelles.md` | Chapitre 1 (Stockage sécurisé) <br> Chapitre 1 (Cas d'usage : Remboursement) |
| **[E0401-E0402]**| Structure du ticket et numérotation séquentielle stricte | `NACEF_Dossier_Specifications_Fonctionnelles.md` | Chapitre 2 (Spécifications liées aux exigences) |
| **[E0501-E0508]**| Communication S-MDF, Mode d'urgence et Gestion de l'offline | `NACEF_Dossier_Conception_Generale.md` | Chapitre 3 (Cartographie S-MDF) |
| **[E0601-E0604]**| Versioning du logiciel | `NACEF_Dossier_Maintenance.md` | Chapitre 4 (Politique de versioning) |
| **[E1001-E1003]**| Isolation du mode formation (Training / Pro-Forma) | `NACEF_Dossier_Specifications_Fonctionnelles.md` | Chapitre 1 (Cas d'usage : Formation) |
| **[E1201-E1205]**| Clôture journalière (Rapport Z) | `NACEF_Dossier_Utilisateur.md` <br> `NACEF_Dossier_Architecture_Technique.md` | Partie I, Chap. 4 (Clôture Z) <br> Chapitre 3 (Fonctionnalités) |
| **[E1301-E1304]**| Piste d'audit et export standard sur support amovible | `NACEF_Dossier_Utilisateur.md` | Partie II (Manuel Administration Fiscale) |
| **[E1601]** | Journalisation S-MDF des sauvegardes et restaurations | `NACEF_Dossier_Architecture_Technique.md` | Chapitre 3 (Fonctionnalités - Sauvegarde) |

*(Note : Pour les détails d'implémentation de chaque champ du schéma JSON et chaque bout de code, se référer au document exhaustif `NACEF_CONFORMITE_EXIGENCES.md` généré précédemment.)*
