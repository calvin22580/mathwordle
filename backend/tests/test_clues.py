from app.engine.clues import explain
from app.engine.scoring import score


def rows(answer, *guesses):
    return [(g, score(g, answer)) for g in guesses]


def test_example_from_the_brief():
    clues = explain(rows("9÷3×9=27", "9+1×3=12"), 8)
    assert clues.pattern_text() == "9 _ _ × _ = _ _"
    assert clues.wrong_spot == ["2", "3"]
    assert clues.not_in_it == ["1", "+"]
    assert clues.lines() == ["9 _ _ × _ = _ _", "In it, wrong spot: 2, 3", "Not in it: 1, +"]


def test_no_guesses():
    clues = explain([], 5)
    assert clues.lines() == ["_ _ _ _ _"]


def test_grey_duplicate_is_not_reported_as_absent():
    # Answer has one 1. Guess has two: one purple, one grey. 1 is in it, not "not in it".
    clues = explain(rows("19+8=27", "99÷9=11"), 7)
    assert "1" in clues.wrong_spot
    assert "1" not in clues.not_in_it
    assert clues.exact_counts["1"] == 1
    assert "9" not in clues.not_in_it  # one 9 is green
    assert clues.exact_counts["9"] == 1


def test_placed_characters_leave_wrong_spot():
    clues = explain(rows("3+4=7", "4+3=7", "3+4=7"), 5)
    assert clues.pattern_text() == "3 + 4 = 7"
    assert clues.wrong_spot == []


def test_wrong_spot_counts_copies():
    # Three of the four 1s are placed; the fourth is still to find.
    clues = explain(rows("11+1=12", "12−1=11"), 7)
    assert clues.min_counts["1"] == 4
    assert clues.wrong_spot == ["1", "2"]


def test_counts_accumulate_across_guesses():
    clues = explain(rows("11+1=12", "12−1=11", "21+1=11"), 7)
    assert clues.pattern_text() == "1 1 + 1 = 1 _"
    assert clues.wrong_spot == ["2"]  # every 1 is now placed; a 2 is still to place
    assert clues.not_at["2"] == {0, 1}
