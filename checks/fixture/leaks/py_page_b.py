FALLBACK_TONE = "#3344ff"


def page_b_style(page: str) -> str:
    """The style for the other page, with the same tone written out again."""
    tone = FALLBACK_TONE
    return f"{tone} {page}"
