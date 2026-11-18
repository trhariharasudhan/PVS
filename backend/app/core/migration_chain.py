"""
Single source of truth for "is the Alembic history healthy?".

Rule: exactly one head, and walking down_revision from it is a straight line that ends at
the initial schema with every migration file visited. This replaces hard-coded lists of
"allowed head revisions" that broke every time a new migration was added.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

BASE_REVISION = "0001_initial_schema"


@dataclass
class ChainReport:
    ok: bool
    head: Optional[str]
    chain: List[str] = field(default_factory=list)
    problems: List[str] = field(default_factory=list)

    @property
    def summary(self) -> str:
        arrow = " -> ".join(r.split("_", 1)[0] for r in reversed(self.chain))
        return f"Single head verified: {self.head} (Chain: {arrow})" if self.ok else "; ".join(self.problems)


def check_linear_chain(backend_dir: Path) -> ChainReport:
    from alembic.config import Config
    from alembic.script import ScriptDirectory

    ini = backend_dir / "alembic.ini"
    if not ini.exists():
        return ChainReport(False, None, problems=["alembic.ini missing"])
    cfg = Config(str(ini))
    cfg.set_main_option("script_location", str(backend_dir / "alembic"))
    script = ScriptDirectory.from_config(cfg)

    heads = list(script.get_heads())
    if len(heads) != 1:
        return ChainReport(False, None, problems=[f"Expected exactly 1 head, found {len(heads)}: {heads}"])

    chain: List[str] = []
    problems: List[str] = []
    rev = script.get_revision(heads[0])
    while rev is not None:
        chain.append(rev.revision)
        down = rev.down_revision
        if isinstance(down, (tuple, list)):
            problems.append(f"{rev.revision} is a merge revision (non-linear history)")
            break
        rev = script.get_revision(down) if down else None

    if not chain or chain[-1] != BASE_REVISION:
        problems.append(f"Chain does not end at {BASE_REVISION}: {chain[-1] if chain else None}")
    total = len(list(script.walk_revisions()))
    if total != len(chain):
        problems.append(f"{total - len(chain)} migration(s) are not on the main chain")
    return ChainReport(not problems, heads[0], chain, problems)
