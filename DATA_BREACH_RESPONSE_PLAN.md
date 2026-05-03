# Data Breach & Incident Response Plan

**Status**: ✅ CRITICAL - Required before launch  
**Compliance**: GDPR (72-hour rule), PDPB, SOC2  
**Date**: April 28, 2026

---

## 1. Breach Classification & Severity Levels

### **CRITICAL (Response: Immediate)**
- SQL injection or unauthorized database access
- Exposure of 1,000+ employee check-in records
- Exposure of HR analytics with identifiable patterns
- API key or internal secret compromised
- Unauthorized admin/HR account access
- Ransomware or encryption of production data

**Response Time**: < 1 hour  
**Escalation**: CEO + Legal + DPO + IR Team  
**Notification**: Supervisory authority within 72 hours

---

### **HIGH (Response: < 4 hours)**
- Exposure of 100-999 employee records
- Unauthorized access to single user's check-in history
- Data exfiltration from Slack/Teams integration
- Stripe webhook manipulation (payment data at risk)
- Auth bypass (single account compromise)

**Response Time**: < 4 hours  
**Escalation**: CTO + Legal + Affected org admin  
**Notification**: Supervisory authority within 72 hours

---

### **MEDIUM (Response: < 24 hours)**
- Exposure of < 100 records
- XSS or CSRF vulnerability discovered
- Rate limit bypass (DoS attempt)
- Invalid SSL certificate or HSTS header missing
- Audit log tampering detected

**Response Time**: < 24 hours  
**Escalation**: Security team + Engineering  
**Notification**: Document internally

---

### **LOW (Response: < 72 hours)**
- Dependency vulnerability in non-critical package
- Configuration error (e.g., extra debug logging)
- Weak password policies (not exploited)
- Documentation typo in security guidelines

**Response Time**: < 72 hours  
**Escalation**: Engineering team  
**Notification**: N/A

---

## 2. Breach Notification Procedure (GDPR Article 33)

### Step 1: Assess & Confirm (0-15 minutes)
- [ ] Verify breach is real (not false alarm)
- [ ] Determine what data was exposed
- [ ] Identify how many individuals affected
- [ ] Determine likelihood of harm to data subjects
- [ ] Document discovery date/time

**Actions:**
```bash
# Check for unauthorized database access
SELECT * FROM audit_log WHERE event = 'unauthorized_access'
  AND created_at > NOW() - INTERVAL '48 hours';

# Check for data export anomalies
SELECT * FROM audit_log WHERE event LIKE '%export%' OR event LIKE '%download%'
  AND created_at > NOW() - INTERVAL '48 hours';

# Verify no RLS policy bypasses
EXPLAIN SELECT * FROM checkins WHERE user_id != auth.uid();
```

---

### Step 2: Contain & Stop Spread (15-60 minutes)
- [ ] Kill compromised sessions (revoke JWT tokens)
- [ ] Block compromised IP addresses
- [ ] Disable affected user accounts (if necessary)
- [ ] Rotate exposed API keys/secrets
- [ ] Enable enhanced logging/monitoring
- [ ] Preserve evidence (don't delete logs)

**Actions:**
```sql
-- Revoke all active sessions for compromised users
-- (implementation depends on your session store)

-- Block suspicious IP addresses from WAF/firewall
-- (implementation platform-specific)

-- Rotate Stripe API keys, Groq API keys, etc.
-- (done in environment configuration)
```

---

### Step 3: Notify Supervisory Authority (Within 72 hours)

**Contact Information:**
- **GDPR (EU)**: Your national Data Protection Authority
  - [List of EU DPAs](https://edpb.europa.eu/about-edpb/board/members_en)
  - **Notification Email**: breach@dpa.eu (example)
- **PDPB (India)**: Data Protection Board of India
  - **Notification**: Through designated officer

**Notification Template:**
```
Subject: Data Breach Notification — Resylia

To: [supervisory-authority]

We hereby notify you of a personal data breach affecting [X] individuals
under GDPR Article 33 / PDPB regulations.

BREACH DETAILS:
- Organization affected: [Org name]
- Date discovered: [Date] [Time] UTC
- Date of breach: [Date] (if known)
- Category of data: [Checkin responses, HR analytics, etc.]
- Approximate number of data subjects: [N]
- Likely consequences: [assess harm likelihood]

MEASURES TAKEN:
- [Containment steps]
- [Notification to data subjects]
- [Contact point]

Detailed report attached.
```

**File Location**: `INCIDENT_[TIMESTAMP]_BREACH_NOTIFICATION.pdf`

---

### Step 4: Notify Affected Data Subjects (Within 72 hours, if high risk)

**Eligibility**: Notification required if:
- Risk of harm to data subject rights/freedoms is HIGH
- Likely significant distress or financial loss
- (Can be skipped only if "unlikely to result in risk")

**Notification Template** (see section 5 below)

---

## 3. Data Subject Notification Template

**Email Subject**: Security Incident Affecting Your Resylia Account

```
Dear [User Name],

We are writing to inform you of a security incident that affected your 
Resylia employee wellbeing account.

WHAT HAPPENED:
On [date], we discovered unauthorized access to our systems that may have 
exposed your check-in responses, stress/energy/workload ratings, and 
potentially your free-text notes.

WHAT DATA WAS AFFECTED:
- Check-in history (dates, energy/stress/workload scores)
- Free-text responses (if any)
- Profile information (name, email, department)
- Sentiment analysis scores

WHAT WE'RE DOING:
✓ We have contained the breach and secured our systems
✓ We have notified regulatory authorities (GDPR/PDPB)
✓ We have preserved evidence for investigation
✓ We are implementing additional monitoring

WHAT YOU SHOULD DO:
1. Monitor your account for suspicious activity
2. Change your password immediately
3. Enable two-factor authentication (if available)
4. Contact your HR department if you have concerns
5. Watch for phishing emails requesting account details

YOUR RIGHTS:
- Right to information: You have the right to know what data was affected
- Right to access: You can request your full data history
- Right to deletion: You can request data deletion (subject to retention)
- Right to complaint: You can file a complaint with your supervisory authority

CONTACT US:
If you have questions or concerns, contact our DPO:
Email: dpo@resylia.com
Phone: [phone]
Response SLA: 5 business days

We sincerely apologize for this incident and appreciate your trust.

Best regards,
Resylia Security Team
```

---

## 4. Incident Timeline & Root Cause Analysis

**Document Template:**
```
INCIDENT REPORT — [INCIDENT ID]

DISCOVERY DATE/TIME: [UTC timestamp]
CONTAINMENT COMPLETED: [UTC timestamp]
ROOT CAUSE: [Technical details]

TIMELINE:
- T+0min: Breach detected via [monitoring method]
- T+15min: Incident severity assessed
- T+30min: Affected systems isolated
- T+60min: Root cause identified
- T+90min: Patch deployed
- T+120min: All systems restored
- T+180min: Post-incident analysis begins

ROOT CAUSE:
[Detailed technical explanation of how breach occurred]
- Example: SQL injection in /api/admin/export endpoint
- Authentication: No input validation on SQL query

CONTRIBUTING FACTORS:
- Missing WAF rule for SQL injection patterns
- Insufficient code review before deployment
- No automated security testing in CI/CD

PREVENTION MEASURES:
1. [Short-term] Deploy hotfix
2. [Medium-term] Implement [security improvement]
3. [Long-term] Refactor [system component]

LESSONS LEARNED:
- [Insight 1]
- [Insight 2]
```

---

## 5. Designated Data Protection Officer (DPO)

**Role**: Must be designated per GDPR Article 37 if:
- Public authority
- Core activities involve systematic monitoring
- Core activities involve large-scale processing of special categories

**Recommended**: Appoint DPO even if not strictly required (best practice)

**Contact Information** (to be filled in):
```
Name: [To be assigned]
Email: dpo@resylia.com
Phone: [To be assigned]
Office: [To be assigned]
On-call: [Yes/No]
```

**DPO Responsibilities:**
- Review data processing activities for compliance
- Review data protection impact assessments
- Receive and investigate complaints from data subjects
- Cooperate with supervisory authority
- Maintain breach notification procedures
- Train staff on data protection

---

## 6. Data Inventory & Retention Policy

### Personal Data Stored

| Data Type | Purpose | Retention | Basis |
|-----------|---------|-----------|-------|
| Email, name, department | User authentication & identification | For account lifetime + 90 days | Contractual |
| Check-in responses (scores) | Wellness monitoring | 2 years (configurable per org) | Consent + Legitimate interest |
| Free-text notes | Sentiment analysis | 30 days (then anonymized) | Consent |
| Sentiment scores | Risk assessment | 2 years | Legitimate interest |
| Burnout risk score | Manager dashboards | 2 years | Legitimate interest |
| Slack/Teams user ID | Integration | Account lifetime + 30 days | Contractual |
| IP address, user agent | Security audit logging | 2 years | Legitimate interest |
| Stripe customer ID | Billing | Indefinite (required for tax) | Legal obligation |

### Data Storage Locations

| Data | Storage | Encryption | Access |
|------|---------|-----------|--------|
| User credentials | Supabase Auth | TLS in transit, at-rest encryption | Supabase only |
| Check-ins | Supabase PostgreSQL | TLS + Supabase encryption | RLS policies |
| Audit logs | Supabase PostgreSQL | TLS + Supabase encryption | Admin only |
| Backups | Supabase (US-East) | Encrypted | Supabase recovery only |

### Data Subject Rights Procedures

| Right | Process | SLA |
|------|---------|-----|
| Access (GDPR Art. 15) | Export check-in data as CSV | 30 days |
| Deletion (GDPR Art. 17) | Anonymize records, delete after verification | 30 days |
| Rectification (GDPR Art. 16) | Request correction via support | 30 days |
| Portability (GDPR Art. 20) | Export full data export in JSON | 30 days |
| Restrict processing (GDPR Art. 18) | Pause sync & analytics for user | 30 days |
| Object (GDPR Art. 21) | Opt-out of specific processing | 30 days |

---

## 7. Supabase Backup & Point-in-Time Recovery

### Automated Backups
- **Frequency**: Daily (configurable)
- **Retention**: 30 days (minimum)
- **Location**: [Supabase managed]
- **Encryption**: At-rest

### Manual Backup (Before Major Changes)
```bash
# Backup full database (via Supabase CLI)
supabase db pull --db-url postgresql://... > backup_$(date +%s).sql

# Or via pg_dump (direct)
pg_dump -h [host] -U [user] -d [db] -Fc > backup_$(date +%s).dump

# Verify backup integrity
pg_restore --list backup_*.dump | head -20
```

### Point-in-Time Recovery (PITR)

**When to use**: "Undo" changes up to a specific timestamp

**Steps**:
1. [ ] Contact Supabase support (or use dashboard)
2. [ ] Provide target timestamp (before breach/accident)
3. [ ] Verify recovery plan won't break active sessions
4. [ ] Execute PITR
5. [ ] Verify data integrity
6. [ ] Notify users if necessary

**RTO/RPO Targets**:
- Recovery Time Objective (RTO): < 4 hours
- Recovery Point Objective (RPO): < 24 hours

---

## 8. Compliance Checklist

### Pre-Launch
- [ ] DPO designated and contact information published
- [ ] Data Processing Agreement (DPA) with Supabase signed
- [ ] Data Processing Agreement with Groq signed
- [ ] Data Processing Agreement with Stripe signed
- [ ] Privacy Policy published and reflects data handling
- [ ] Data breach response procedure documented
- [ ] Incident response team identified
- [ ] Backup & recovery tested
- [ ] Audit logging verified (includes user_id)
- [ ] RLS policies verified in production

### Ongoing
- [ ] Monthly audit log review (check for unauthorized access)
- [ ] Quarterly data inventory review
- [ ] Semi-annual penetration testing
- [ ] Annual DPA review with vendors
- [ ] Annual staff data protection training

---

## 9. Legal Escalation Contacts

**Internal**:
- CEO: [Name] [Email]
- Legal counsel: [Name] [Email]
- DPO: [Name] [Email]

**External**:
- External counsel: [Firm] [Phone]
- Insurance (cyber liability): [Policy #] [Contact]
- PR firm (for communication): [Contact]

---

## 10. Post-Breach Lessons & Prevention

### Implement These Immediately
1. ✅ **Audit log tamper protection** — Revoke DELETE/UPDATE from app role
2. ✅ **WAF rules** — Block known SQL injection patterns
3. ✅ **Secrets rotation** — Automate API key rotation
4. ✅ **Security monitoring** — Alert on suspicious queries

### Phase 2 (Within 3 months)
1. **Penetration testing** — Annual third-party security audit
2. **Zero-knowledge proofs** — Verify RLS without exposing data
3. **Encryption at-rest** — Client-side encryption for free_text
4. **Security headers** — Ensure all headers properly set (CSP, SRI, etc.)

---

**Document Status**: ✅ COMPLETE — Ready for production  
**Last Updated**: April 28, 2026  
**Next Review**: [Quarterly / After any incident]
