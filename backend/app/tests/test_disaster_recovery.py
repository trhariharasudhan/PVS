import pytest
from app.core.verify_disaster_recovery import DisasterRecoveryVerifier, BACKUP_RETENTION_POLICY


def test_disaster_recovery_checks_all_pass():
    verifier = DisasterRecoveryVerifier()
    report = verifier.run_all()
    assert report["is_valid"] is True
    assert report["readiness_pct"] == 100.0
    assert report["passed_count"] == 4
    assert len(report["checks"]) == 4


def test_backup_and_restore_command_syntax():
    verifier = DisasterRecoveryVerifier()
    backup_check = verifier.verify_backup_command_syntax()
    assert backup_check["status"] == "PASS"
    assert "pg_dump" in backup_check["command_template"]
    assert "--no-owner" in backup_check["command_template"]
    assert "AES256" in backup_check["command_template"]

    restore_check = verifier.verify_restore_command_syntax()
    assert restore_check["status"] == "PASS"
    assert "pg_restore" in restore_check["command_template"]
    assert "--clean" in restore_check["command_template"]
    assert "--exit-on-error" in restore_check["command_template"]


def test_backup_retention_policy_compliance():
    assert BACKUP_RETENTION_POLICY["daily_retention_days"] >= 30
    assert BACKUP_RETENTION_POLICY["monthly_retention_months"] >= 12
    assert BACKUP_RETENTION_POLICY["rpo_target_minutes"] <= 15
    assert BACKUP_RETENTION_POLICY["rto_target_minutes"] <= 60
