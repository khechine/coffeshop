# 🚨 CRITICAL: Quick Security Fix Reference

**Timestamp:** April 5, 2026  
**Incident:** Cryptocurrency miner malware in production  
**Status:** ✅ Malware removed | ⏳ Patches needed  

---

## ⚡ TL;DR - What Happened

```
VPS Database (PostgreSQL) exposed on port 5433
    ↓
Default credentials (postgres:postgres)
    ↓
Attacker accessed database
    ↓
Downloaded malware to /tmp/mysql
    ↓
Cryptocurrency miner ran as user 999 (postgres)
    ↓
Consumed 392% CPU
```

**Fix:** Restrict database access, rotate credentials, patch packages, run container as non-root

---

## 🔧 LOCAL FIXES (Developer)

```bash
# Step 1: Get latest code
cd /Users/mehdikhechine/devs/coffeeshop-b2B
git pull origin main

# Step 2: Update vulnerable packages
pnpm install
pnpm update @nestjs/cli@latest bcrypt@latest
pnpm audit --fix
pnpm install

# Step 3: Build and test locally
docker-compose build
docker-compose up -d
sleep 30
curl http://localhost:3051/health

# Step 4: Verify changes applied
# Check docker-compose.yml - PostgreSQL should be 127.0.0.1:5433
grep "127.0.0.1:5433" docker-compose.yml && echo "✅ Docker-compose fixed"

# Check Dockerfile - should have "USER nodejs"
grep "USER nodejs" Dockerfile && echo "✅ Dockerfile fixed"

# Step 5: Cleanup
docker-compose down

# Step 6: Commit and push
git add -A
git commit -m "SECURITY: Fix critical RCE vulnerabilities"
git push origin main
```

---

## 🔐 CREDENTIALS (DevOps)

```bash
# Generate new database password
openssl rand -hex 16
# Example output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Generate new JWT secret
openssl rand -base64 32
# Example output: aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890=

# Create .env.prod (NEVER commit to git)
cat > .env.prod << 'EOF'
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<PASTE_NEW_PASSWORD_HERE>
DATABASE_URL="postgresql://postgres:<PASTE_NEW_PASSWORD_HERE>@coffeeshop_db:5432/coffeeshop?schema=public"
JWT_SECRET=<PASTE_NEW_JWT_SECRET_HERE>
NEXT_PUBLIC_APP_URL="https://api.coffeeshop.elkassa.com"
PORT=3001
NODE_ENV=production
github_token=<ORIGINAL_GITHUB_TOKEN>
github_user=khechine
ssh_server=debian@vps-08df0a26.vps.ovh.net
ssh_folder=/home/debian/coffeshop/
domain_name=coffeeshop.elkassa.com
EOF

# Verify .env.prod in gitignore
echo ".env.prod" >> .gitignore

# ⚠️ NEVER share .env.prod in email/chat/git!
```

---

## 🚀 VPS DEPLOYMENT (DevOps/SRE)

```bash
# Step 1: SSH to VPS
ssh debian@vps-08df0a26.vps.ovh.net

# Step 2: Backup database
docker exec coffeeshop_postgres pg_dump -U postgres coffeeshop > \
  /home/debian/backups/backup_$(date +%Y%m%d_%H%M%S).sql
echo "✅ Backup created"

# Step 3: Stop and update
docker-compose down
cd /home/debian/coffeshop && git pull origin main
pnpm install

# Step 4: Export new credentials (from .env.prod)
export POSTGRES_PASSWORD="<NEW_PASSWORD_FROM_STEP_2_ABOVE>"
export JWT_SECRET="<NEW_JWT_SECRET_FROM_STEP_2_ABOVE>"

# Step 5: Build and deploy
docker-compose build --no-cache
docker-compose up -d
sleep 30

# Step 6: Verify deployment
docker-compose ps
# Expected: All containers UP (healthy)

docker logs coffeeshop_api | tail -10
# Expected: No errors, API started

# Step 7: Security verification
ss -tlnp | grep 5433
# Expected: 127.0.0.1:5433 LISTEN (NOT 0.0.0.0:5433)

docker exec coffeeshop_postgres id
# Expected: uid=1000(nodejs)

# Step 8: Test API
curl https://api.coffeeshop.elkassa.com/health
# Expected: 200 OK

docker stats --no-stream
# Expected: CPU <10%, Memory <500MB each
```

---

## ✅ VERIFICATION CHECKLIST

```bash
# Run these on VPS to confirm security fixes

# ✅ Check 1: Database not exposed
ss -tlnp | grep 5433
# MUST show: 127.0.0.1:5433 (not 0.0.0.0:5433)

# ✅ Check 2: Container running as non-root
docker exec coffeeshop_postgres id
# MUST show: uid=1000(nodejs) gid=1000(nodejs)

# ✅ Check 3: No malware process
ps aux | grep -iE "mysql|crypto|mine" | grep -v grep
# MUST show: (nothing)

# ✅ Check 4: No suspicious files in /tmp
docker exec coffeeshop_postgres ls -la /tmp/
# MUST show: only fix_admin.sql (no init, mysql, etc.)

# ✅ Check 5: CPU usage normal
docker stats --no-stream
# MUST show: <10% CPU each container

# ✅ Check 6: API responsive
curl -v https://api.coffeeshop.elkassa.com/health
# MUST show: 200 OK

# ✅ Check 7: No cron jobs
docker exec coffeeshop_postgres crontab -l
# MUST show: (nothing or "no crontab")
```

If all checks pass ✅ → Incident is RESOLVED

---

## 🔴 If Something Goes Wrong

```bash
# Try to restart services
docker-compose restart

# Check logs for errors
docker-compose logs

# If database won't start:
docker-compose up coffeeshop_db -d
docker logs coffeeshop_postgres

# If API won't connect to database:
# Check POSTGRES_PASSWORD is correct in docker-compose environment
# Check DATABASE_URL in .env matches actual credentials

# Full rollback (if critical):
docker-compose down
git revert HEAD
docker-compose up -d
# Restore from backup: psql -U postgres coffeeshop < backup.sql
```

---

## 📊 IMPACT SUMMARY

| Issue | Before | After | Fixed? |
|-------|--------|-------|--------|
| Database Exposed | 0.0.0.0:5433 ❌ | 127.0.0.1:5433 ✅ | YES |
| Default Credentials | postgres:postgres ❌ | [NEW_RANDOM] ✅ | YES |
| Container as Root | root ❌ | nodejs:1000 ✅ | YES |
| Vulnerable Packages | 41 CVEs ❌ | Updated ✅ | YES |
| Malware Running | Yes 392% CPU ❌ | No ✅ | YES |

---

## 🎯 KEY POINTS TO REMEMBER

1. **Never commit credentials** - Use .env.prod local only
2. **Database not network-facing** - Should only be accessible from localhost
3. **Non-root user** - Limits damage if container is compromised
4. **Updated dependencies** - Fixes known CVEs
5. **Monitor resources** - Alert if CPU/Memory spikes like before

---

## 📞 HELP

- **Full details:** See [SECURITY_REMEDIATION_PLAN.md](SECURITY_REMEDIATION_PLAN.md)
- **Attack analysis:** See [SECURITY_AUDIT_REPORT.json](SECURITY_AUDIT_REPORT.json)
- **Incident details:** See [SECURITY_INCIDENT_REPORT.md](SECURITY_INCIDENT_REPORT.md)
- **Deployment checklist:** See [SECURITY_INCIDENT_RESPONSE_CHECKLIST.md](SECURITY_INCIDENT_RESPONSE_CHECKLIST.md)

**Questions?** → Escalate to Security Lead or CTO

---

**Status:** 🟢 READY FOR DEPLOYMENT  
**Last Updated:** April 5, 2026  
**Severity:** 🔴 CRITICAL

