# CoffeeShop B2B API - Security Audit Executive Summary

**Date:** April 5, 2026  
**Status:** 🔴 **CRITICAL** - Immediate Action Required  
**Context:** Post-incident analysis following cryptocurrency miner malware discovery

---

## 🚨 Critical Findings

### 1. **Unpatched Command Injection Vulnerability in glob CLI** (CRITICAL)
- **Package:** `@nestjs/cli > glob@10.4.5`
- **CVE:** GHSA-5j98-mcp5-4vw2
- **Impact:** Remote Code Execution
- **Fix:** Update `@nestjs/cli` to latest version
- **Timeline:** **24 hours**

```bash
pnpm update @nestjs/cli@latest
```

### 2. **Arbitrary File Operations via tar Library** (CRITICAL)
- **Package:** `bcrypt@5.1.1 > tar@6.2.1`
- **CVEs:** GHSA-34x7-hfp2-rc4v, GHSA-8qq5-rm4j-mr97, GHSA-h25m-26qc-wcjf
- **Impact:** Arbitrary file write/overwrite, symlink poisoning
- **Fix:** Update `bcrypt` package
- **Timeline:** **24 hours**

```bash
pnpm update bcrypt@latest
```

### 3. **Container Running as Root** (CRITICAL)
- **File:** `Dockerfile`
- **Impact:** Full system compromise if container is exploited
- **Evidence:** Cryptocurrency miner was able to place executables in /tmp
- **Fix:** Add non-root user

```dockerfile
FROM base AS runner
RUN addgroup -g 1000 -S nodejs && adduser -S nodejs -u 1000
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder --chown=nodejs:nodejs /app /app
USER nodejs
EXPOSE 3000 3001
CMD ["pnpm", "start"]
```

**Timeline:** **48 hours**

---

## 📊 Vulnerability Summary

| Severity | Count | Details |
|----------|-------|---------|
| **CRITICAL** | 5 | glob injection, tar vulnerabilities, deserialization |
| **HIGH** | 22 | Lodash prototype pollution, brace-expansion DoS, picomatch injection |
| **MODERATE** | 16 | Various dependency issues |
| **LOW** | 3 | tmp symlink, webpack SSRF |

**Total Issues:** 41 known CVEs + 4 code-level vulnerabilities

---

## 🎯 Likely Attack Vectors (How Malware Got In)

### Vector 1: PostgreSQL Database Exploitation (PRIMARY SUSPECT)
```
VPS Port 5433 (PostgreSQL)
    ↓
Default credentials (postgres:postgres)
    ↓
PostgreSQL command execution
    ↓
Download /tmp/mysql (malware binary)
    ↓
Execute with postgres user (999)
    ↓
Cryptocurrency miner running @ 392% CPU
```

**Evidence:** Malware ran as postgres user (999), not node user

### Vector 2: Dependency Supply Chain Attack  
**Affected packages:**
- `glob@10.4.5` - Command injection
- `bcrypt@5.1.1` - File operation vulnerabilities
- `lodash@4.17.23` - Prototype pollution

**How:** Malicious code in npm package executes during `pnpm install`, places binaries in /tmp with persistence mechanism

### Vector 3: API Endpoint Exploitation
While no direct RCE code found in review, potential vectors:
- SQL injection (though Prisma prevents direct SQL injection)
- Unvalidated query parameters
- Environment variable injection

---

## ⚡ Immediate Actions (24-48 Hours)

### 1. Update Dependencies
```bash
cd /Users/mehdikhechine/devs/coffeeshop-b2B
pnpm update @nestjs/cli@latest bcrypt@latest
pnpm audit --fix
```

### 2. Rebuild Container with Security
```dockerfile
# Update Dockerfile with non-root user (see CRITICAL section above)
docker build -t coffeeshop-api-secure .
```

### 3. Restrict Database Access
```yaml
# docker-compose.yml - Remove or restrict port exposure
# Remove: ports: ['5433:5432']
# Or change to: ports: ['127.0.0.1:5433:5432']
```

### 4. Update Credentials
```bash
# Generate new strong JWT_SECRET (32+ characters)
# Update database credentials
# Update docker-compose.yml and .env.prod
```

### 5. Restart with New Image
```bash
docker-compose down
docker-compose up -d
```

---

## 🔍 Key Vulnerabilities Details

### A. Command Injection (glob CLI)
```
Risk: Attacker can execute arbitrary shell commands
Vector: If nestjs/cli processes user input with glob patterns
Impact: RCE with Node.js process privileges
```

### B. Database Exposure
```
Port 5433 open to internet
Credentials: postgres:postgres (weak/default)
Risk: Direct database access, command execution via PostgreSQL functions
Evidence: Malware ran as postgres user (999) - suggests database-level execution
```

### C. Container Privilege Escalation  
```
Current: Runs as root in container
Risk: Any container escape = host compromise
Attack: Malware placed in /tmp with executable permissions
Fix: Run as non-root user (nodejs:nodejs)
```

### D. Missing Input Validation
```
PIN verification endpoint: No format validation
Could allow: Brute force attacks, injection attacks
Location: apps/api/src/auth.controller.ts:14
```

---

## 📋 Dependency Vulnerability Breakdown

### HIGH Severity (22)
- **glob** - Command injection via shell execution
- **tar** - Arbitrary file operations  
- **lodash** - Prototype pollution
- **brace-expansion** - ReDoS attacks
- **picomatch** - POSIX injection
- **webpack** - SSRF vulnerabilities

### MODERATE Severity (16)
- Various tool dependencies with security issues

### LOW Severity (3)
- tmp symlink issues
- webpack SSRF edge cases

---

## 🛡️ Remediation Timeline

```
DAY 1 (24 hours):
├─ Update @nestjs/cli, bcrypt
├─ Rotate all credentials
├─ Review API access logs
└─ Initial Dockerfile security patch

DAY 2-3 (48-72 hours):
├─ Rebuild and redeploy container
├─ Restrict database port access
├─ Add rate limiting on auth endpoints
└─ Implement input validation

WEEK 1:
├─ Complete security code review
├─ Add monitoring/alerting
├─ Implement WAF rules
└─ Database activity monitoring

ONGOING:
├─ Automated dependency scanning
├─ Security testing in CI/CD
├─ Regular penetration testing
└─ Incident response procedures
```

---

## 📈 Risk Assessment

| Aspect | Current | After Fixes |
|--------|---------|------------|
| **Exploitability** | VERY HIGH | LOW |
| **Impact if Exploited** | CRITICAL | HIGH |
| **Vulnerability Count** | 41 | ~10-15 |
| **RCE Probability** | HIGH | LOW |
| **Data Breach Risk** | CRITICAL | MEDIUM |

---

## 🔐 Security Hardening Checklist

- [ ] Update all CRITICAL CVE packages (24h)
- [ ] Add non-root user to Dockerfile (24h)
- [ ] Remove/restrict database port exposure (24h)
- [ ] Rotate JWT_SECRET and DB credentials (24h)
- [ ] Review API access logs for attacks (24h)
- [ ] Review PostgreSQL logs for exploitation (24h)
- [ ] Implement input validation DTOs (1 week)
- [ ] Add rate limiting on authentication (1 week)
- [ ] Set up monitoring/alerting (2 weeks)
- [ ] Implement structured logging (2 weeks)
- [ ] Database activity monitoring (2 weeks)
- [ ] Web Application Firewall (3 weeks)
- [ ] Penetration testing (4 weeks)

---

## 📞 Incident Response

**Status:** Malware removed, container restarted  
**Remaining Risk:** Same vulnerabilities that allowed attack still present  
**Action Required:** Deploy patches immediately

---

## 📎 Additional Resources

- **Full Report:** See `SECURITY_AUDIT_REPORT.json` for detailed analysis
- **Dependency Audit:** Run `pnpm audit` for current status
- **CVE References:**
  - GHSA-5j98-mcp5-4vw2 (glob injection)
  - GHSA-34x7-hfp2-rc4v (tar hardlink)
  - GHSA-8qq5-rm4j-mr97 (tar symlink)
  - GHSA-h25m-26qc-wcjf (next.js deserialization)

---

**Report Generated:** April 5, 2026  
**Next Review:** After critical patches deployed
**Status:** Awaiting implementation of security fixes
