# Installation de l'Agent S-MDF — Guide Complet par Type de POS

## Résumé

Guide d'installation et de configuration de l'agent S-MDF (Système de Module de Données Fiscales) sur chaque type de poste de caisse utilisé avec CoffeeShop B2B / ElKassa. L'agent S-MDF est un logiciel fourni par la CIMF (Commission des Marchés Financiers) qui assure la signature électronique des tickets et la conformité fiscale NACEF.

---

## Table des matières

1. [Qu'est-ce que l'agent S-MDF](#1-quest-ce-que-lagent-s-mdf)
2. [Prérequis](#2-prérequis)
3. [Type 1 : PC/Mac de caisse (Web POS)](#3-type-1-pcmac-de-caisse-web-pos)
4. [Type 2 : Tablette Android (POS Mobile)](#4-type-2-tablette-android-pos-mobile)
5. [Type 3 : iPad/iPhone (POS Mobile)](#5-type-3-ipadiphone-pos-mobile)
6. [Type 4 : Serveur réseau (multi-caisses)](#6-type-4-serveur-réseau-multi-caisses)
7. [Configuration CoffeeShop B2B](#7-configuration-coffeshop-b2b)
8. [Tests de conformité](#8-tests-de-conformité)
9. [Dépannage](#9-dépannage)
10. [Check-list d'installation](#10-check-list-dinstallation)

---

## 1. Qu'est-ce que l'agent S-MDF

### Rôle

L'agent S-MDF est le composant logiciel qui :
- **Signe électroniquement** chaque ticket de vente avant impression
- **Génère le QR code officiel** NACEF à imprimer sur chaque ticket
- **Communique avec la plateforme NACEF** (CIMF) pour la validation
- **Maintient un audit trail** de toutes les opérations fiscales
- **Gère le certificat électronique** du contribuable

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Poste de Caisse (POS)                       │
│                                                         │
│  CoffeeShop B2B ──→ API NestJS ──→ S-MDF Agent          │
│  (Navigateur/App)    (port 3001)    (port 10006)        │
│                                      │                  │
│                                      ▼                  │
│                              Plateforme NACEF            │
│                              (CIMF)                      │
└─────────────────────────────────────────────────────────┘
```

### Deux modes de fonctionnement

| Mode | Description | Usage |
|---|---|---|
| **S-MDF Client** | Un agent par caisse, connecté à un S-MDF serveur | Petite commerce, 1 caisse |
| **S-MDF Serveur** | Un seul agent gère plusieurs caisses | Grande surface, multi-caisses |

**Pour CoffeeShop B2B, on utilise le mode S-MDF Client** (un agent par poste de caisse).

---

## 2. Prérequis

### Matériel

| Composant | Minimum | Recommandé |
|---|---|---|
| Processeur | 1 GHz | 2 GHz+ |
| RAM | 512 Mo | 2 Go+ |
| Disque | 100 Mo libres | 500 Mo+ |
| Réseau | Ethernet/WiFi | Ethernet (plus stable) |
| Imprimante | Thermique 58mm/80mm | Epson TM-T20 ou compatible |

### Logiciel

| Composant | Version |
|---|---|
| **Windows** | Windows 10+ (64-bit) |
| **macOS** | macOS 12+ (Monterey+) |
| **Linux** | Ubuntu 20.04+ / Debian 11+ |
| **Android** | Android 8.0+ (API 26+) |
| **iOS** | iOS 15+ |

### Identifiants requis

| Identifiant | Source | Format |
|---|---|---|
| **Code de Pairing** | CIMF | Code alphanumérique |
| **IMDF** | CIMF | 14-16 caractères |
| **Matricule Fiscal** | DGI | `1234567A` (8 chars) |
| **Réf. Homologation** | CIMF | 8-32 caractères |

---

## 3. Type 1 : PC/Mac de caisse (Web POS)

### Cas d'usage
- Coffee shop avec 1 caisse sur PC/Mac
- Utilisation du Web POS (navigateur) ou Rachma Lite PWA

### Étape 1 : Télécharger l'agent S-MDF

L'agent S-MDF est disponible auprès de la CIMF. Demandez le lien de téléchargement à votre interlocuteur CIMF.

```
Fichiers attendus :
├── smdf-agent-[version]-[os].zip
│   ├── smdf-agent              (exécutable)
│   ├── config.json             (configuration)
│   ├── certificat.p12          (certificat client)
│   └── README.md
```

### Étape 2 : Extraire et installer

**Windows :**
```powershell
# Créer le dossier d'installation
mkdir C:\SMDF-Agent

# Extraire l'archive
Expand-Archive -Path smdf-agent-windows.zip -DestinationPath C:\SMDF-Agent

# Vérifier les fichiers
dir C:\SMDF-Agent
```

**macOS / Linux :**
```bash
# Créer le dossier d'installation
sudo mkdir -p /opt/smdf-agent

# Extraire l'archive
unzip smdf-agent-macos.zip -d /opt/smdf-agent

# Rendre l'exécutable exécutable
chmod +x /opt/smdf-agent/smdf-agent
```

### Étape 3 : Configurer l'agent

Éditer le fichier `config.json` :

```json
{
  "port": 10006,
  "mode": "client",
  "certificate": "./certificat.p12",
  "pin": "VOTRE_PIN",
  "nacef_url": "https://nacef.cimf.tn",
  "log_level": "INFO",
  "cors_origins": ["http://localhost:3005", "http://localhost:3001"]
}
```

| Champ | Description | Valeur |
|---|---|---|
| `port` | Port d'écoute de l'agent | `10006` (défaut) |
| `mode` | Mode de fonctionnement | `"client"` |
| `certificate` | Chemin vers le certificat | `"./certificat.p12"` |
| `pin` | PIN du certificat | Code fourni par la CIMF |
| `nacef_url` | URL de la plateforme NACEF | `"https://nacef.cimf.tn"` |
| `log_level` | Niveau de log | `"INFO"` ou `"DEBUG"` |
| `cors_origins` | URLs autorisées | URLs de votre POS |

### Étape 4 : Démarrer l'agent

**Windows (PowerShell) :**
```powershell
cd C:\SMDF-Agent
.\smdf-agent.exe
```

**macOS / Linux :**
```bash
cd /opt/smdf-agent
./smdf-agent
```

**Output attendu :**
```
S-MDF Agent v1.2.0 démarré sur le port 10006
Mode: CLIENT
Certificat: chargé
En attente de connexions...
```

### Étape 5 : Configurer le démarrage automatique

**Windows (Tâche planifiée) :**
```powershell
# Créer une tâche planifiée
schtasks /create /tn "SMDF-Agent" /tr "C:\SMDF-Agent\smdf-agent.exe" /sc onlogon /rl highest
```

**macOS (launchd) :**
```bash
sudo tee /Library/LaunchDaemons/com.cimf.smdf-agent.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cimf.smdf-agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/smdf-agent/smdf-agent</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

sudo launchctl load /Library/LaunchDaemons/com.cimf.smdf-agent.plist
```

**Linux (systemd) :**
```bash
sudo tee /etc/systemd/system/smdf-agent.service <<EOF
[Unit]
Description=S-MDF Agent
After=network.target

[Service]
Type=simple
ExecStart=/opt/smdf-agent/smdf-agent
WorkingDirectory=/opt/smdf-agent
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable smdf-agent
sudo systemctl start smdf-agent
```

### Étape 6 : Vérifier le fonctionnement

```bash
# Vérifier que l'agent répond
curl http://localhost:10006/sic/external/manifest

# Output attendu :
# {
#   "imdf": "VOTRE_IMDF",
#   "status": "5: Can be used to sign tickets.",
#   "version": "1.2.0",
#   "state": "ONLINE"
# }
```

---

## 4. Type 2 : Tablette Android (POS Mobile)

### Cas d'usage
- Coffee shop avec tablette Android comme caisse
- Utilisation de l'app POS Mobile (ElKassa)

### Étape 1 : Préparer la tablette

| Configuration | Valeur |
|---|---|
| Android minimum | 8.0 (API 26) |
| Espace disque | 200 Mo libres |
| WiFi | Connecté au réseau local |
| Bluetooth | Activé (pour imprimante) |

### Étape 2 : Installer l'agent S-MDF

L'agent S-MDF sur Android fonctionne de deux manières :

#### Option A : Agent intégré (recommandé)

L'app POS Mobile intègre un agent S-MDF léger. Cette option est la plus simple.

1. Installer l'app ElKassa POS Mobile depuis le Play Store ou le fichier APK
2. Lancer l'app
3. Aller dans **Paramètres > NACEF**
4. Activer **"Agent S-MDF intégré"**
5. Le port par défaut est `10006`

#### Option B : Agent externe sur un PC du réseau

Si le S-MDF doit être sur un PC séparé :

1. Installer l'agent S-MDF sur un PC du même réseau (voir Type 1)
2. Noter l'IP du PC : `192.168.1.XXX`
3. Dans l'app POS Mobile, aller dans **Paramètres > NACEF**
4. Désactiver **"Agent S-MDF intégré"**
5. Saisir l'URL : `http://192.168.1.XXX:10006`

### Étape 3 : Configurer l'imprimante

**Via Bluetooth :**
1. Paramètres > Imprimantes > Ajouter
2. Sélectionner l'imprimante Bluetooth
3. Tester l'impression

**Via WiFi (réseau local) :**
1. Paramètres > Imprimantes > Ajouter
2. Saisir l'IP de l'imprimante : `192.168.1.XXX:9100`
3. Tester l'impression

### Étape 4 : Connecter à l'API

1. Lancer l'app POS Mobile
2. Scanner le QR code de la tablette OU saisir le code d'activation à 6 chiffres
3. Le terminal se connecte automatiquement à l'API
4. Vérifier que le statut NACEF est "Prêt"

### Étape 5 : Tester un ticket

1. Effectuer une vente test
2. Vérifier que le ticket contient :
   - Numéro fiscal (FAC-2026-000001)
   - QR code NACEF officiel
   - Hash de signature
   - Montants en millimes

---

## 5. Type 3 : iPad/iPhone (POS Mobile)

### Cas d'usage
- Coffee shop avec iPad comme caisse
- Utilisation de l'app POS Mobile (ElKassa)

### Étape 1 : Préparer l'iPad

| Configuration | Valeur |
|---|---|
| iOS minimum | 15+ |
| Espace disque | 200 Mo libres |
| WiFi | Connecté au réseau local |
| AirPrint | Activé |

### Étape 2 : Installer l'agent S-MDF

#### Option A : Agent intégré (recommandé)

1. Installer l'app ElKassa POS Mobile depuis l'App Store
2. Lancer l'app
3. Aller dans **Paramètres > NACEF**
4. Activer **"Agent S-MDF intégré"**
5. Le port par défaut est `10006`

#### Option B : Agent sur un Mac du réseau

1. Installer l'agent S-MDF sur un Mac du même réseau (voir Type 1)
2. Noter l'IP du Mac : `192.168.1.XXX`
3. Dans l'app POS Mobile, saisir l'URL : `http://192.168.1.XXX:10006`

### Étape 3 : Configurer l'imprimante AirPrint

1. Imprimante thermique compatible AirPrint (ex: Epson TM-T20 II)
2. Connecter l'imprimante au même réseau WiFi
3. Dans l'app POS Mobile, l'imprimante est détectée automatiquement
4. Sélectionner l'imprimante dans les paramètres

### Étape 4 : Connecter à l'API

1. Scanner le QR code de l'iPad
2. OU saisir le code d'activation à 6 chiffres
3. Le terminal se connecte

### Étape 5 : Tester

Même procédure que pour Android (voir Type 2, Étape 5).

---

## 6. Type 4 : Serveur réseau (multi-caisses)

### Cas d'usage
- Grande surface avec plusieurs caisses
- Un seul S-MDF gère toutes les caisses

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Réseau Local                                │
│                                                         │
│  Caisse 1 (PC)     ──→ ┐                                │
│  Caisse 2 (Tablette)──→ ├──→ S-MDF Serveur ──→ NACEF   │
│  Caisse 3 (iPad)   ──→ ┘    (port 10006)               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Étape 1 : Préparer le serveur

| Composant | Minimum | Recommandé |
|---|---|---|
| OS | Windows Server 2019+ / Ubuntu 20.04+ | Dernière version stable |
| Processeur | 2 cœurs | 4+ cœurs |
| RAM | 4 Go | 8 Go+ |
| Réseau | Ethernet GbE | Ethernet GbE |
| IP fixe | Oui | Obligatoire |

### Étape 2 : Installer l'agent S-MDF en mode serveur

```bash
# Télécharger l'agent
wget https://cimf.tn/smdf/smdf-agent-linux.zip

# Installer
sudo mkdir -p /opt/smdf-agent
unzip smdf-agent-linux.zip -d /opt/smdf-agent
chmod +x /opt/smdf-agent/smdf-agent
```

### Étape 3 : Configurer le mode serveur

Éditer `config.json` :

```json
{
  "port": 10006,
  "mode": "serveur",
  "certificate": "./certificat.p12",
  "pin": "VOTRE_PIN",
  "nacef_url": "https://nacef.cimf.tn",
  "max_connections": 10,
  "cors_origins": ["*"],
  "allowed_ips": ["192.168.1.0/24"]
}
```

| Champ | Description |
|---|---|
| `mode` | `"serveur"` (gère plusieurs caisses) |
| `max_connections` | Nombre max de connexions simultanées |
| `allowed_ips` | Plages d'IP autorisées à se connecter |

### Étape 4 : Ouvrir le pare-feu

```bash
# Linux (ufw)
sudo ufw allow 10006/tcp
sudo ufw reload

# Windows (PowerShell)
New-NetFirewallRule -DisplayName "S-MDF Agent" -Direction Inbound -LocalPort 10006 -Protocol TCP -Action Allow
```

### Étape 5 : Configurer chaque caisse

Sur chaque caisse, dans les paramètres CoffeeShop B2B :

```
URL S-MDF : http://192.168.1.100:10006
```

### Étape 6 : Vérifier les connexions

```bash
# Sur le serveur, vérifier les connexions actives
curl http://192.168.1.100:10006/sic/external/manifest

# Output :
# {
#   "status": "5: Can be used to sign tickets.",
#   "connected_clients": 3,
#   "version": "1.2.0"
# }
```

---

## 7. Configuration CoffeeShop B2B

### Étape 1 : Configurer le store

Via l'API ou le dashboard :

```bash
curl -X POST http://localhost:3001/nacef/config/VOTRE_STORE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer user-jwt-USER_ID-TIMESTAMP" \
  -d '{
    "smdfUrl": "http://localhost:10006",
    "imdf": "VOTRE_IMDF",
    "matriculeFiscal": "1234567A",
    "establishmentReference": "000",
    "commercialName": "Mon Coffee Shop",
    "accreditationReference": "AC123456"
  }'
```

### Étape 2 : Activer le mode fiscal

```bash
# Via le dashboard : Paramètres > NACEF > Activer
# Ou via SQL :
UPDATE "Store" SET "isFiscalEnabled" = true WHERE id = 'VOTRE_STORE_ID';
```

### Étape 3 : Initialiser NACEF

```bash
curl -X POST http://localhost:3001/nacef/initialize/VOTRE_STORE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer user-jwt-USER_ID-TIMESTAMP" \
  -d '{
    "model": "CoffeeShopPOS",
    "serialNumber": "VOTRE_SERIAL",
    "version": "1.0.0"
  }'
```

### Étape 4 : Vérifier la synchronisation

```bash
curl http://localhost:3001/nacef/ready/VOTRE_STORE_ID \
  -H "Authorization: Bearer user-jwt-USER_ID-TIMESTAMP"

# Output :
# {"storeId":"...","ready":true}
```

---

## 8. Tests de conformité

### Test 1 : Vérifier le manifest

```bash
curl http://localhost:10006/sic/external/manifest

# Vérifier :
# - status: "5: Can be used to sign tickets."
# - state: "ONLINE"
# - certificateInfo.expired: false
```

### Test 2 : Signer un ticket test

```bash
# Créer un ticket de test
curl -X POST http://localhost:3001/nacef/sign/SALE_ID \
  -H "Authorization: Bearer user-jwt-USER_ID-TIMESTAMP"

# Vérifier :
# - success: true
# - ticketIdentifier non vide
# - qrcodeImage non vide (base64)
```

### Test 3 : Imprimer et vérifier le ticket

Le ticket imprimé doit contenir :

```
┌─────────────────────────────────────┐
│        MON COFFEE SHOP              │
│    12 Rue de l'Indépendance         │
│    Tunis                            │
│    MF: 1234567A                     │
├─────────────────────────────────────┤
│ Ticket N°: FAC-2026-000001          │
│ Date: 2026-08-04 16:30              │
│ Agent: Ahmed                         │
├─────────────────────────────────────┤
│ 2x Espresso         6.000 DT        │
│ 1x Croissant         2.500 DT        │
├─────────────────────────────────────┤
│ Total HT:            7.143 DT        │
│ TVA 19%:             1.357 DT        │
│ Total TTC:           8.500 DT        │
├─────────────────────────────────────┤
│ Paiement: Cash        10.000 DT      │
│ Monnaie:              1.500 DT       │
├─────────────────────────────────────┤
│ [QR CODE NACEF OFFICIEL]            │
│ Hash: a1b2c3d4e5f6...               │
│ Signature: x7y8z9...                │
└─────────────────────────────────────┘
```

### Test 4 : Annulation de ticket

```bash
curl -X POST http://localhost:3001/sales/SALE_ID/cancel \
  -H "Content-Type: application/json" \
  -d '{"canceledById": "USER_ID"}'

# Vérifier :
# - isVoid: true
# - FiscalLog avec action "CANCEL_TICKET"
```

---

## 9. Dépannage

### Problème : L'agent S-MDF ne démarre pas

| Cause | Solution |
|---|---|
| Port déjà utilisé | Changer le port dans `config.json` : `"port": 10007` |
| Certificat invalide | Vérifier le chemin et le PIN du certificat |
| Permission refusée (Linux) | `sudo ./smdf-agent` ou `chmod +x smdf-agent` |
| Pare-feu bloquant | Ouvrir le port 10006 en TCP |

### Problème : L'API ne peut pas atteindre l'agent

| Cause | Solution |
|---|---|
| URL incorrecte | Vérifier `Store.smdfUrl` en base |
| Agent non démarré | `curl http://localhost:10006/sic/external/manifest` |
| CORS bloquant | Ajouter l'origine dans `cors_origins` du `config.json` |
| Réseau séparé | Vérifier que l'API et l'agent sont sur le même réseau |

### Problème : La signature échoue

| Cause | Solution |
|---|---|
| IMDF non configuré | Vérifier `Store.imdf` en base |
| Certificat expiré | Contacter la CIMF pour renouvellement |
| S-MDF non synchronisé | Appeler `POST /nacef/sync/:storeId` |
| Montants invalides | Vérifier la conversion DT → millimes |

### Problème : QR code non affiché

| Cause | Solution |
|---|---|
| qrcodeImage vide | Vérifier la réponse de `/sic/external/sign/request` |
| Format invalide | Le QR doit être en base64 |
| Imprimante incompatible | Vérifier la résolution (300 DPI min) |

### Logs de débogage

```bash
# Vérifier les logs de l'agent S-MDF
tail -f /opt/smdf-agent/logs/smdf-agent.log

# Vérifier les logs NACEF dans la base
SELECT * FROM "NacefSyncLog" ORDER BY "createdAt" DESC LIMIT 20;
```

---

## 10. Check-list d'installation

### Par type de POS

#### PC/Mac (Web POS)
| # | Action | Statut |
|---|---|---|
| 1 | Agent S-MDF téléchargé | ⬜ |
| 2 | Agent installé (`/opt/smdf-agent` ou `C:\SMDF-Agent`) | ⬜ |
| 3 | `config.json` configuré (port, certificat, CORS) | ⬜ |
| 4 | Agent démarré et testé (`curl manifest`) | ⬜ |
| 5 | Démarrage automatique configuré | ⬜ |
| 6 | Store configuré dans CoffeeShop B2B | ⬜ |
| 7 | NACEF initialisé (`POST /nacef/initialize`) | ⬜ |
| 8 | Ticket test imprimé avec QR code | ⬜ |

#### Tablette Android
| # | Action | Statut |
|---|---|---|
| 1 | App ElKassa POS Mobile installée | ⬜ |
| 2 | Agent S-MDF intégré activé (ou URL externe configurée) | ⬜ |
| 3 | Imprimante Bluetooth/WiFi configurée | ⬜ |
| 4 | Terminal activé (code 6 chiffres ou QR) | ⬜ |
| 5 | Store configuré dans CoffeeShop B2B | ⬜ |
| 6 | Ticket test imprimé | ⬜ |

#### iPad/iPhone
| # | Action | Statut |
|---|---|---|
| 1 | App ElKassa POS Mobile installée (App Store) | ⬜ |
| 2 | Agent S-MDF intégré activé (ou URL externe configurée) | ⬜ |
| 3 | Imprimante AirPrint configurée | ⬜ |
| 4 | Terminal activé | ⬜ |
| 5 | Store configuré dans CoffeeShop B2B | ⬜ |
| 6 | Ticket test imprimé | ⬜ |

#### Serveur multi-caisses
| # | Action | Statut |
|---|---|---|
| 1 | Serveur préparé (IP fixe, pare-feu) | ⬜ |
| 2 | Agent S-MDF installé en mode `serveur` | ⬜ |
| 3 | `config.json` configuré (max_connections, allowed_ips) | ⬜ |
| 4 | Pare-feu ouvert (port 10006) | ⬜ |
| 5 | Agent démarré et testé | ⬜ |
| 6 | Chaque caisse configurée avec l'URL du serveur | ⬜ |
| 7 | NACEF initialisé pour chaque store | ⬜ |
| 8 | Tickets test imprimés depuis chaque caisse | ⬜ |

---

## 11. Fichiers de référence

| Fichier | Emplacement | Description |
|---|---|---|
| `nacef-smdf-api-1.2.0.json` | `nacef/` | Spec OpenAPI des endpoints S-MDF |
| `nacef-smdf-ticket-1.1.4.json` | `nacef/` | Schéma JSON du ticket NACEF |
| `Tunisian_NACEF_Integration-1.0.0_postman_collection.json` | `nacef/` | Collection Postman pour tests |
| `NACEF-CC-MDF-01.pdf` | `nacef/` | Cahier des charges MDF |
| `NACEF-PROCTEST-02.pdf` | `nacef/` | Procédure de test d'homologation |
| `NACEF_INTEGRATION.md` | `docs/` | Documentation technique d'intégration |
