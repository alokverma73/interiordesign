import random
import string
from datetime import datetime


def generate_reference_number(prefix: str) -> str:
    """
    Generates a human-friendly, collision-resistant reference number like
    ENQ-2026-4F92A1. Not a strict DB sequence (works fine without locking),
    uniqueness is still enforced by a DB unique constraint on the column.
    """
    year = datetime.utcnow().year
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{year}-{suffix}"
