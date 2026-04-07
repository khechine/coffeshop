# CoffeeShop B2B - Critical Security Remediation Plan

**Status:** 🔴 CRITICAL - Execute immediately  
**Context:** Post-incident remediation following cryptocurrency miner attack (April 5, 2026)

---

## 🚨 Root Cause Analysis

The malware exploitation chain was:

1. **PostgreSQL exposed on port 5433** to entire internet/VPS network
2. **Default credentials** (postgres:postgres) in docker-compose.yml
3. **Database accessible to attacker** → PostgreSQL command execution
4. **Malware downloaded to /tmp** as postgres user (999)
5. **Container running as root** → No additional privilege escalation needed
6. **Auto-restart mechanism** → Persistence via cron/init/watchdog

---

## 📋 Immediate Fixes (Execute in Next 24 Hours)

### Priority 1: Restrict Database Access (CRITICAL)

**File:** `docker-compose.yml` (Line 13)

**Current (VULNERABLE):**
```yaml
ports:
  - '5433:5432'    # ❌ Exposed to entire network
```

**Fixed:**
```yaml
ports:
  - '127.0.0.1:5433:5432'    # ✅ Only localhost access
```

**Impact:** Prevents remote database access from VPS/internet

---

### Priority 2: Change Default Database Credentials (CRITICAL)

**File:** `.env` (Production only!)

**Current:**
```env
DATABASE_URL="postgresql://postgres:postgres@coffeeshop_db:5432/coffeeshop?schema=public"
```

**Steps:**
1. Generate new password (32+ characters, mixed case, numbers, symbols)
2. Update in `.env.prod` (never commit to git)
3. Update docker-compose env variables
4. Rotate database password on VPS
5. Update all application instances

**Commands:**
```bash
# Generate secure password
openssl rand -hex 16

# Update docker-compose environment
# Change: POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
#    To: POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
# (Remove default fallback)
```

---

### Priority 3: Remove JWT Secret Default (HIGH)

**File:** `.env`

**Current (INSECURE):**
```env
JWT_SECRET="supers3cr3tc0ffeesh0p"  # ❌ Hardcoded, public
```

**Steps:**
1. Generate new JWT secret (32+ bytes, cryptographically random)
2. Store ONLY in `.env.prod` (never in git)
3. Update Dockerfile to require JWT_SECRET at runtime

**Commands:**
```bash
# Generate JWT secret
openssl rand -base64 32
# Store in: .env.prod only, not in .env (prevent git leaks)
```

---

### Priority 4: Update Vulnerable Dependencies

**Execute on local machine:**
```bash
# Install latest patches
pnpm update @nestjs/cli@latest
pnpm update bcrypt@latest
pnpm audit --fix

# Review remaining vulnerabilities
pnpm audit

# Update lock file and test
pnpm install
pnpm build
```

**Critical CVEs Fixed:**
- `glob@10.4.5` → Command injection
- `bcrypt@5.1.1` → Arbitrary file operations
- `tar` → Symlink poisoning

---

### Priority 5: Run Container as Non-Root User (HIGH)

**File:** `Dockerfile`

**Current (UNSAFE):**
```dockerfile
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app /app
EXPOSE 3000 3001
CMD ["pnpm", "start"]
```

**Fixed:**
```dockerfile
FROM base AS runner
RUN addgroup -g 1000 -S nodejs && \
    adduser -S nodejs -u 1000

WORKDIR /app
ENV NODE_ENV production

COPY --from=builder --chown=nodejs:nodejs /app /app

USER nodejs
EXPOSE 3000 3001

CMD ["pnpm", "start"]
```

**Impact:**
- ✅ Limits damage if container is compromised
- ✅ Malware cannot place executables in /tmp
- ✅ Enforces least privilege principle

---

## 🔧 Implementation Checklist

### Step 1: Local Changes (Development)
- [ ] Update `docker-compose.yml` with restricted PostgreSQL binding
- [ ] Update `Dockerfile` with non-root user
- [ ] Run `pnpm update @nestjs/cli@latest bcrypt@latest`
- [ ] Run `pnpm audit --fix`
- [ ] Test locally: `docker-compose up`
- [ ] Verify API and Dashboard start correctly

### Step 2: Environment Configuration
- [ ] Generate new PostgreSQL password
- [ ] Generate new JWT secret
- [ ] Update `.env.prod` with new credentials (DO NOT commit)
- [ ] Update `.env.prod` with environment-specific values
- [ ] Ensure `.env.prod` is in `.gitignore`

### Step 3: VPS Deployment
- [ ] SSH to VPS: `ssh debian@vps-08df0a26.vps.ovh.net`
- [ ] Backup current database: `docker exec coffeeshop_postgres pg_dump -U postgres coffeeshop > backup_$(date +%Y%m%d_%H%M%S).sql`
- [ ] Stop containers: `docker-compose down`
- [ ] Pull latest code: `git pull origin main`
- [ ] Update packages: `pnpm install`
- [ ] Build new images: `docker-compose build --no-cache`
- [ ] Deploy: `docker-compose up -d`
- [ ] Verify: Check logs and container health

### Step 4: Security Verification
- [ ] [ ] Verify PostgreSQL only listens on localhost: `netstat -tlnp | grep 5432`
- [ ] [ ] Confirm container running as nodejs user: `docker exec coffeeshop_postgres id`
- [ ] [ ] Test API is accessible: `curl https://api.coffeeshop.elkassa.com/health`
- [ ] [ ] Check no processes running as root: `docker top coffeeshop_postgres`

### Step 5: Monitoring Setup
- [ ] Enable CPU/Memory alerts (threshold: 80%)
- [ ] Set up log aggregation for suspicious activity
- [ ] Monitor /tmp directory for new files
- [ ] Alert on unexpected process spawning

---

## 📝 Detailed File Changes

### Change 1: docker-compose.yml

```diff
  coffeeshop_db:
    image: postgres:15
    container_name: coffeeshop_postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
-     POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
+     POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-coffeeshop}
    env_file:
      - .env
    ports:
-     - '5433:5432'
+     - '127.0.0.1:5433:5432'
    volumes:
      - coffeeshop_pgdata:/var/lib/postgresql/data
    networks:
      - default
```

**Rationale:**
- Restricting to 127.0.0.1 prevents external access
- Removing password default forces explicit configuration

---

### Change 2: Dockerfile

```diff
  FROM base AS runner
+ RUN addgroup -g 1000 -S nodejs && \
+     adduser -S nodejs -u 1000
+
  WORKDIR /app
  ENV NODE_ENV production
- COPY --from=builder /app /app
+ COPY --from=builder --chown=nodejs:nodejs /app /app
+
+ USER nodejs
  EXPOSE 3000 3001
  CMD ["pnpm", "start"]
```

**Rationale:**
- Non-root user prevents privilege escalation
- User owns files → prevents permission errors
- Prevents malware from modifying files

---

### Change 3: .env.prod (Do NOT commit to git)

```env
# Database Configuration (CHANGE THESE VALUES)
DATABASE_URL="postgresql://postgres:GENERATE_NEW_PASSWORD_HERE@coffeeshop_db:5432/coffeeshop?schema=public"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=GENERATE_NEW_PASSWORD_HERE

# Authentication (CHANGE THIS VALUE)
JWT_SECRET="GENERATE_32_BYTE_RANDOM_STRING_HERE"

# Application
PORT=3001
NEXT_PUBLIC_APP_URL="https://api.coffeeshop.elkassa.com"
NODE_ENV=production

# Social
github_token=ghp_REDACTED
github_user=khechine

# Deployment
ssh_server=debian@vps-08df0a26.vps.ovh.net
ssh_folder=/home/debian/coffeshop/
domain_name=coffeeshop.elkassa.com
```

**Instructions:**
1. Create a new `.env.prod` file (don't edit `.env`)
2. Replace all placeholder values
3. Add to `.gitignore`: `.env.prod`
4. Use during deployment: `--env-file .env.prod`

---

## 🧪 Testing & Validation

After applying fixes, test:

```bash
# 1. Build locally
docker-compose build

# 2. Verify database restriction
sudo netstat -tlnp | grep postgres
# Expected: tcp  0 0 127.0.0.1:5433  0.0.0.0:*  LISTEN

# 3. Start services
docker-compose up -d

# 4. Check container user
docker exec coffeeshop_postgres id
# Expected: uid=1000(nodejs) gid=1000(nodejs) groups=1000(nodejs)

# 5. Verify API health
curl http://localhost:3051/health

# 6. Check no suspicious processes
docker exec coffeeshop_postgres ps aux
# Expected: Only postgres and nodejs processes
```

---

## 🚀 Deployment Timeline

| Phase | Duration | Actions |
|-------|----------|---------|
| **Phase 1** | 2-4 hours | Local changes, testing, vulnerability fixes |
| **Phase 2** | 1 hour | Generate credentials, update environment files |
| **Phase 3** | 30 min | VPS deployment, verification |
| **Phase 4** | 1 hour | Monitoring setup, security audit |
| **Total** | ~4-6 hours | Full remediation |

---

## ⚠️ Precautions During Deployment

1. **Backup Database First**
   ```bash
   docker exec coffeeshop_postgres pg_dump -U postgres coffeeshop > backup.sql
   ```

2. **Test in Staging First** (if available)
   - Deploy to staging environment
   - Run full smoke tests
   - Monitor for 30 minutes
   - Only then deploy to production

3. **Monitor After Deployment**
   - Check application logs for errors
   - Monitor CPU/Memory for unusual activity
   - Test key workflows (login, API calls)
   - Verify database connectivity

4. **Rollback Plan**
   ```bash
   # If issues occur:
   docker-compose down
   git revert <commit_hash>
   docker-compose up -d
   # Restore from backup if needed
   ```

---

## 🔍 Post-Remediation Verification

Run these commands within 24 hours of deployment:

```bash
# SSH to VPS
ssh debian@vps-08df0a26.vps.ovh.net

# 1. Verify no malware running
ps aux | grep -E "mysql|crypto|mine" | grep -v grep

# 2. Check database security
sudo ss -tlnp | grep postgres

# 3. Monitor container logs
docker logs coffeeshop_postgres --tail 50
docker logs coffeeshop_api --tail 50

# 4. Check disk usage (malware sometimes fills disk)
df -h

# 5. Verify no new files in /tmp
docker exec coffeeshop_postgres ls -la /tmp/

# 6. Check for suspicious cron jobs
docker exec coffeeshop_postgres crontab -l

# 7. Monitor resource usage
docker stats
```

---

## 📚 Additional Security Hardening (Medium-term)

1. **Enable Container Security Scanning**
   ```bash
   docker scan coffeeshop_api
   docker scan coffeeshop_dashboard
   ```

2. **Implement Rate Limiting**
   - Add rate limiting middleware to NestJS
   - Limit login attempts to 5 per minute
   - Limit API requests to 100 per minute per IP

3. **Add Request Validation**
   - Validate all query parameters
   - Validate request body sizes
   - Reject oversized payloads

4. **Enable HTTPS/TLS Only**
   - Redirect HTTP to HTTPS
   - Use strong TLS ciphers
   - Enable HSTS headers

5. **Implement Secrets Management**
   - Use HashiCorp Vault or AWS Secrets Manager
   - Rotate credentials every 90 days
   - Never store secrets in git

6. **Set Up Security Monitoring**
   - Install Falco for runtime security monitoring
   - Monitor system calls for suspicious activity
   - Alert on privilege escalation attempts
   - Log all network connections

---

## ❓ Questions & Support

If issues arise during remediation:

1. **Database Connection Errors** → Verify POSTGRES_PASSWORD in all locations
2. **Permission Denied Errors** → Ensure user nodejs has write access (COPY --chown)
3. **Port Already in Use** → Try: `docker-compose down -v` then rebuild
4. **Deployment Failures** → Check VPS disk space: `df -h`

---

**Last Updated:** April 5, 2026  
**Severity:** 🔴 CRITICAL  
**Status:** Ready for Implementation

