# PVS Silk S — Production Backup & Disaster Recovery Policy

**Scope:** Automated Database Snapshots, Encryption, Retention Lifecycle, and Offsite Replication  
**Target:** Production PostgreSQL Infrastructure  

---

## 1. Backup Strategy Overview

| Backup Type | Frequency | Target Destination | Encryption | Retention Period |
|---|---|---|---|---|
| **Continuous WAL Archiving** | Real-Time | S3 / GCS Cloud Storage | AES-256 Server-Side | 7 Days (Point-in-Time) |
| **Daily Full Logical Dump** | Nightly (02:00 IST) | Local NVMe + Encrypted S3 | GPG / AES-256 | 30 Days |
| **Weekly Master Snapshot** | Sunday (03:00 IST) | Encrypted S3 Coldline | GPG / AES-256 | 12 Weeks |
| **Monthly Financial Archive** | 1st of Month (04:00 IST)| AWS Glacier / GCS Archive | GPG / AES-256 | 7 Years (Statutory Tax Req.) |

---

## 2. Automated Backup Automation Script (`scripts/backup_production.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail

# Configuration
BACKUP_DIR="/var/backups/pvs_silks"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/pvs_prod_${TIMESTAMP}.dump"
GPG_RECIPIENT="backup-key@pvssilks.com"
S3_BUCKET="s3://pvs-silks-production-backups"

mkdir -p "${BACKUP_DIR}"

echo "Starting logical PostgreSQL backup at $(date)..."

# 1. Take Custom Format Dump
docker exec -t pvs_prod_db pg_dump \
  -U "${POSTGRES_USER}" \
  -Fc \
  -b \
  -v \
  "${POSTGRES_DB}" > "${BACKUP_FILE}"

# 2. Encrypt with GPG
gpg --yes --encrypt --recipient "${GPG_RECIPIENT}" "${BACKUP_FILE}"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"
rm -f "${BACKUP_FILE}"

# 3. Stream to Secure Offsite Cloud Storage
aws s3 cp "${ENCRYPTED_FILE}" "${S3_BUCKET}/daily/$(basename ${ENCRYPTED_FILE})"

# 4. Prune Local Backups Older Than 7 Days
find "${BACKUP_DIR}" -type f -name "pvs_prod_*.dump.gpg" -mtime +7 -delete

echo "Backup and offsite sync completed successfully at $(date)."
```

---

## 3. Disaster Recovery Objectives (RTO & RPO)

- **Recovery Point Objective (RPO):** `< 1 hour` (via daily dump + continuous WAL sync).
- **Recovery Time Objective (RTO):** `< 30 minutes` to provision new cluster and restore full database.

---

## 4. Verification & Testing Schedule

1. **Daily Check:** Automated script verifies non-zero backup file size (> 100KB) and exit code 0.
2. **Monthly Restore Drill:** Automated disposable container spins up, downloads latest encrypted snapshot, decrypts, restores, and executes SQL row count verification queries.
