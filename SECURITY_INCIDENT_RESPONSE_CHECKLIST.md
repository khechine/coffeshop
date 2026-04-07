# CoffeeShop B2B - Security Incident Response Checklist

**Incident:** Cryptocurrency miner malware deployed to production VPS  
**Date Discovered:** April 5, 2026 17:36 UTC  
**Status:** 🔴 CRITICAL - IN PROGRESS  
**Owner:** [ASSIGN SECURITY LEAD]

---

## 📋 Incident Summary

- **What:** Malware process `/tmp/mysql` consuming 392% CPU (crypto miner)  
- **Where:** VPS at vps-08df0a26.vps.ovh.net, Docker container coffeeshop_postgres  
- **When:** April 5, 2026, ~14:30-17:40 UTC  
- **Root Cause:** PostgreSQL database exposed on port 5433 with default credentials  
- **Status:** ✅ Malware killed and removed | ⏳ Vulnerabilities still need patching  

---

## 🚨 Immediate Actions (TODAY - 4-6 hours)

### Phase 1: Code Changes (Local Development) - [ 2 hours ]

**Owner:** [Lead Developer]

- [ ] Clone latest code: `git clone https://github.com/khechine/coffeshop.git`
- [ ] Create feature branch: `git checkout -b security/critical-fix-april-5-2026`
- [ ] Review changes already applied:
  - [x] docker-compose.yml - PostgreSQL restricted to localhost (127.0.0.1:5433)
  - [x] Dockerfile - Added non-root user (nodejs:1000)
- [ ] Install and update vulnerable dependencies:
  ```bash
  pnpm install
  pnpm update @nestjs/cli@latest bcrypt@latest
  pnpm audit --fix
  pnpm install
  ```
- [ ] Verify no breaking changes: `pnpm build`
- [ ] Test locally: `docker-compose up -d && sleep 30 && curl http://localhost:3051/health`
- [ ] Stop containers: `docker-compose down`
- [ ] Commit changes:
  ```bash
  git add docker-compose.yml Dockerfile package.json pnpm-lock.yaml
  git commit -m "SECURITY: Fix critical RCE vulnerabilities

  - Restrict PostgreSQL to localhost (prevents network exposure)
  - Run containers as non-root user (limits privilege escalation)
  - Update vulnerable dependencies (@nestjs/cli, bcrypt)
  - Execute npm audit fixes for known CVEs
  
  Fixes: CVE-GHSA-5j98-mcp5-4vw2, CVE-GHSA-34x7-hfp2-rc4v, etc.
  Related: Incident @vps-08df0a26.vps.ovh.net crypto miner"
  ```
- [ ] Push to GitHub: `git push origin security/critical-fix-april-5-2026`

---

### Phase 2: Environment & Credentials (Secure Storage) - [ 1 hour ]

**Owner:** [DevOps/Infrastructure Lead]

- [ ] Generate new PostgreSQL password:
  ```bash
  openssl rand -hex 16
  # Store securely, don't paste in chat/email
  ```
- [ ] Generate new JWT secret:
  ```bash
  openssl rand -base64 32
  # Store securely
  ```
- [ ] Create `.env.prod` file (NEVER commit to git):
  ```bash
  cp .env.prod.example .env.prod
  # Edit .env.prod with new credentials (locally)
  # DO NOT upload to git
  ```
- [ ] Verify `.env.prod` in `.gitignore`:
  ```bash
  grep ".env.prod" .gitignore || echo ".env.prod" >> .gitignore
  ```
- [ ] Store credentials in secure location:
  - [ ] Vault/Secrets Manager
  - [ ] Encrypted password manager
  - [ ] Hardware security key
  - [ ] DO NOT store in email/chat/documents

---

### Phase 3: VPS Deployment (Production) - [ 1.5 hours ]

**Owner:** [DevOps/Site Reliability Engineer]  
**Prerequisites:** Phase 1 & 2 complete, code merged to main

```bash
# Step 1: Connect to VPS
ssh debian@vps-08df0a26.vps.ovh.net

# Step 2: Backup current database (CRITICAL)
docker exec coffeeshop_postgres pg_dump -U postgres coffeeshop > \
  /home/debian/backups/coffeeshop_backup_$(date +%Y%m%d_%H%M%S).sql

# Step 3: Verify backup was created
ls -lh /home/debian/backups/coffeeshop_backup_*.sql | tail -1

# Step 4: Stop services
docker-compose down

# Step 5: Update code
cd /home/debian/coffeshop
git pull origin main

# Step 6: Install dependencies
pnpm install

# Step 7: Build images with new security changes
docker-compose build --no-cache

# Step 8: Deploy with new credentials
# Export new PostgreSQL password
export POSTGRES_PASSWORD="NEW_PASSWORD_HERE"
export JWT_SECRET="NEW_JWT_SECRET_HERE"

# Start services
docker-compose up -d

# Step 9: Wait for services to start
sleep 30

# Step 10: Verify deployment
docker-compose ps
docker logs coffeeshop_postgres -n 20
docker logs coffeeshop_api -n 20
```

---

### Phase 4: Security Verification (VPS) - [ 30 minutes ]

**Owner:** [Security/DevOps Lead]

Execute on VPS:

```bash
# 1. Verify PostgreSQL only listens on localhost
ss -tlnp | grep -E '5432|postgres'
# Expected: tcp 0 0 127.0.0.1:5433 0.0.0.0:* LISTEN

# 2. Confirm non-root user
docker exec coffeeshop_postgres id
# Expected: uid=1000(nodejs) gid=1000(nodejs) groups=1000(nodejs)

# 3. Verify no suspicious processes
docker exec coffeeshop_postgres ps aux
# Expected: Only postgres, nodejs, and system processes

# 4. Check database is NOT exposed
curl -v telnet://localhost:5433 2>&1 | grep -i refused || \
  echo "WARNING: Database appears accessible from outside container"

# 5. Verify API is working
curl https://api.coffeeshop.elkassa.com/health

# 6. Check container resource usage
docker stats --no-stream
# Expected: API <5% CPU, Dashboard <3% CPU, DB <10% CPU

# 7. Verify no crypto mining process
ps aux | grep -E "mysql|crypto|mine|116|117|118" | grep -v grep || \
  echo "✅ No crypto miner detected"

# 8. Check /tmp for suspicious files
docker exec coffeeshop_postgres ls -la /tmp/
# Expected: Only fix_admin.sql

# 9. Monitor cron jobs
docker exec coffeeshop_postgres crontab -l || echo "No crontab"

# 10. Check disk usage (malware sometimes fills disk)
df -h
# Expected: No unexpected filesystem at 90%+
```

---

## 🔍 Investigation & Root Cause (PARALLEL - 2-4 hours)

**Owner:** [Security/DevOps Team]

- [ ] **Analyze logs for attack pattern:**
  ```bash
  # Check when malware was first observed
  docker logs coffeeshop_postgres --since 2026-04-05T10:00:00Z | grep -i "init\|mysql"
  ```

- [ ] **Review application logs for suspicious requests:**
  ```bash
  # Check API access logs around 14:30-17:30 UTC on Apr 5
  docker logs coffeeshop_api --since 2026-04-05T14:00:00Z --until 2026-04-05T18:00:00Z
  # Look for: unusual endpoints, large file uploads, command patterns
  ```

- [ ] **Check if database was accessed:**
  ```bash
  # PostgreSQL doesn't log by default, but check system audit logs
  docker exec coffeeshop_postgres tail -100 /var/log/postgresql.log 2>/dev/null || echo "No logs"
  ```

- [ ] **Identify attack vector (answer one):**
  - [ ] PostgreSQL exposed and exploited (database command execution)
  - [ ] API vulnerability exploited (RCE via application)
  - [ ] Dependency vulnerability exploited (package supply chain)
  - [ ] SSH/credential compromise
  - [ ] Unknown - Continue investigation

- [ ] **Forensic analysis (if available):**
  - [ ] Check system logs for failed login attempts
  - [ ] Review git commit history for suspicious changes
  - [ ] Audit IAM logs for unusual access
  - [ ] Check for lateral movement to other systems

---

## 🛡️ Post-Incident Hardening (24-48 hours)

**Owner:** [Security Lead + DevOps]

### Monitoring & Alerting

- [ ] **Set CPU/Memory alerts:**
  ```bash
  # In your monitoring system (Datadog, New Relic, Prometheus):
  # Alert when: CPU > 80% for 5 minutes
  # Alert when: Memory > 80% for 5 minutes
  # Alert when: Process count > 50
  ```

- [ ] **Set up log alerting:**
  - [ ] Alert on processes starting with `/tmp`
  - [ ] Alert on command execution patterns
  - [ ] Alert on PostgreSQL errors/unusual activity
  - [ ] Alert on permission denied errors

- [ ] **Monitor /tmp directory:**
  ```bash
  # Run periodic check
  docker exec coffeeshop_postgres find /tmp -type f -perm /111 -ls
  ```

### Network Security

- [ ] **Close unnecessary ports:**
  - [ ] Verify only 80/443/3051/3050 are exposed (HTTP/HTTPS/API/Dashboard)
  - [ ] Verify 5433 is NOT accessible from outside VPS
  - [ ] Use VPS firewall to restrict access if possible

- [ ] **Enable network logging:**
  - [ ] Monitor all connections to database
  - [ ] Log unusual connection patterns
  - [ ] Alert on failed connection attempts

### Application Security

- [ ] **Code review for vulnerabilities:**
  - [ ] Review all file upload handlers
  - [ ] Review all database queries
  - [ ] Review all process execution code
  - [ ] Review input validation

- [ ] **Implement rate limiting:**
  - [ ] Add rate limiting to login endpoint (5 attempts/min)
  - [ ] Add rate limiting to API endpoints (100 req/min per IP)
  - [ ] Add DDoS protection (CloudFlare, AWS WAF)

- [ ] **Enable full request logging:**
  - [ ] Log all POST requests with body (sanitized)
  - [ ] Log all database queries
  - [ ] Log all file operations
  - [ ] Store logs for 90+ days

---

## 📊 Testing & Validation (PARALLEL - 2 hours)

**Owner:** [QA/Testing Lead]

- [ ] **Smoke Tests:**
  - [ ] [ ] User login/logout works
  - [ ] [ ] API endpoints return 200
  - [ ] [ ] Dashboard loads without errors
  - [ ] [ ] Database queries execute
  - [ ] [ ] File uploads work (if applicable)

- [ ] **Security Tests:**
  - [ ] [ ] Try accessing database from outside container (should fail)
  - [ ] [ ] Attempt SQL injection (should be blocked)
  - [ ] [ ] Try to write to /tmp from application (should fail/be logged)
  - [ ] [ ] Verify process runs as nodejs user, not root

- [ ] **Performance Tests:**
  - [ ] [ ] CPU usage normal (<20% at rest)
  - [ ] [ ] Memory usage normal (<500MB each service)
  - [ ] [ ] No memory leaks over 5 minute test
  - [ ] [ ] Response times <500ms

- [ ] **Regression Tests:**
  - [ ] [ ] Run full API test suite
  - [ ] [ ] Run UI smoke tests
  - [ ] [ ] Test third-party integrations
  - [ ] [ ] Verify cron jobs still execute

---

## 📝 Documentation & Reporting

**Owner:** [Security/DevOps Lead]

- [ ] Update incident response runbook with lessons learned
- [ ] Document new processes:
  - [ ] How to rotate credentials
  - [ ] How to patch critical vulnerabilities
  - [ ] How to respond to resource spikes
  - [ ] Security incident contact procedures

- [ ] **Create status report:**
  ```markdown
  # Security Incident Report - April 5, 2026
  
  ## Timeline
  - 14:30 UTC: Malware deployed
  - 17:36 UTC: Malware detected
  - 17:42 UTC: Malware removed
  - Apr 6: Critical vulnerabilities patched
  - Apr 6: Non-critical hardening deployed
  
  ## Impact
  - Data: No unauthorized data access detected
  - CPU: 392% spike for ~3 minutes
  - Availability: No service downtime
  
  ## Root Cause
  PostgreSQL database exposed on port 5433 with default credentials
  
  ## Remediation
  - Fixed: Database access restricted
  - Fixed: Credentials rotated
  - Fixed: Container hardened (non-root user)
  - Fixed: Dependencies patched
  ```

---

## ⚠️ Critical Success Criteria

All items must be COMPLETE before closing incident:

- [ ] ✅ Malware removed from production
- [ ] ✅ Container hardened (running as non-root)
- [ ] ✅ Database not exposed to network
- [ ] ✅ Credentials rotated (new password, JWT secret)
- [ ] ✅ Vulnerable packages updated
- [ ] ✅ Changes tested and deployed
- [ ] ✅ Monitoring/alerting configured
- [ ] ✅ Incident report completed
- [ ] ✅ Lessons learned documented
- [ ] ✅ Team trained on new procedures

---

## 📞 Escalation & Support

**If deployment fails:**
1. Check error messages in docker logs
2. Verify .env.prod has correct credentials
3. Check disk space: `df -h`
4. For permission errors, rebuild with: `docker-compose build --no-cache`
5. Rollback: `git revert HEAD && docker-compose up -d`

**If security concerns arise:**
- Contact: [Security Leader]
- Escalate: [CTO/Engineering Manager]
- Document: All actions taken

**For questions:**
- See: SECURITY_REMEDIATION_PLAN.md
- See: SECURITY_AUDIT_REPORT.json
- See: SECURITY_INCIDENT_REPORT.md

---

## 📅 Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Security Lead | __________ | __________ | ⏳ Pending |
| DevOps Lead | __________ | __________ | ⏳ Pending |
| QA Lead | __________ | __________ | ⏳ Pending |
| CTO/Manager | __________ | __________ | ⏳ Pending |

---

**Status:** 🟢 READY FOR IMPLEMENTATION  
**Last Updated:** April 5, 2026  
**Next Review:** April 6, 2026

