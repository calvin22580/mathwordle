"""Game constants. Must match shared/game-config.json (a test checks this)."""

MAX_GUESSES = 6

DIFFICULTIES: dict[str, int] = {
    "easy": 5,
    "medium": 6,
    "hard": 8,
}


def length_for(difficulty: str) -> int:
    try:
        return DIFFICULTIES[difficulty]
    except KeyError:
        raise ValueError(f"unknown difficulty: {difficulty}") from None
