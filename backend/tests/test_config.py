import json
from pathlib import Path

from app.engine.config import DIFFICULTIES, MAX_GUESSES

ROOT = Path(__file__).resolve().parents[2]


def test_matches_shared_config():
    shared = json.loads((ROOT / "shared" / "game-config.json").read_text())
    assert shared["maxGuesses"] == MAX_GUESSES
    assert {k: v["length"] for k, v in shared["difficulties"].items()} == DIFFICULTIES
