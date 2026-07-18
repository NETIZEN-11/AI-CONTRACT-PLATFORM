"""Smoke tests for the OCR service."""
from datetime import datetime, timezone


def test_datetime_works() -> None:
    """Sanity check that the test runner can import and execute code."""
    now = datetime.now(timezone.utc)
    assert now is not None
    assert isinstance(now, datetime)
