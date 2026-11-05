from app.engine.vectors import ANSWER_LISTS, OUT_DIR, render, render_answer_lists


def test_shared_vectors_are_up_to_date():
    """The committed vectors must match the Python engine.

    If this fails after a deliberate rule change, run
    ``python -m app.engine.vectors`` and review the diff.
    """
    for filename, text in render().items():
        path = OUT_DIR / filename
        assert path.exists(), f"missing {path}"
        assert path.read_text(encoding="utf-8") == text, f"{filename} is stale"


def test_app_answer_lists_are_up_to_date():
    assert ANSWER_LISTS.read_text(encoding="utf-8") == render_answer_lists()
