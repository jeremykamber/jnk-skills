from py_shade import EMPHASIS_SHADE, shade_for

FALLBACK_TONE = "#3344ff"


def page_a_style(page: str) -> str:
    """The style for one page, naming the fallback it uses."""
    tone = FALLBACK_TONE
    return f"{EMPHASIS_SHADE} {tone} {shade_for(page)}"
