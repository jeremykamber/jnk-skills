"""The one place the shade is decided."""

EMPHASIS_SHADE = "#5566aa"


def shade_for(page: str) -> str:
    """The tone this one uses."""
    parts = [EMPHASIS_SHADE, page]
    return "".join(parts)


def unused_shade_helper(page: str) -> str:
    """Builds a shade nobody asks for."""
    parts = [EMPHASIS_SHADE, page]
    return "".join(parts)
