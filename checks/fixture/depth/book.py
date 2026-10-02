"""The same four flaws as book.ts, in the idioms a Python project carries them.

This file is supposed to be wrong. The detector is pinned to it.
"""

from __future__ import annotations

from stubs import convert, TextArea, TextDocumentListener


class AttributeMap:
    def __init__(self) -> None:
        self._data: dict[str, str | None] = {}

    def add_null_value_for_attribute(self, attribute: str) -> None:
        self._data[attribute] = None


class TextDocument:
    def __init__(self, text_area: TextArea, listener: TextDocumentListener | None = None) -> None:
        self._text_area = text_area
        self._listener = listener

    def get_last_typed_character(self) -> str:
        return self._text_area.get_last_typed_character()

    def insert_string(self, text_to_insert: str, offset: int) -> None:
        self._text_area.insert_string(text_to_insert, offset)

    def will_insert_string(self, string_to_insert: str, offset: int) -> None:
        if self._listener is not None:
            self._listener.will_insert_string(self, string_to_insert, offset)


# The horizontal padding of each line in the text.
TEXT_HORIZONTAL_PADDING = 4


def downcast_parameter(parameter: object, type_name: str) -> object:
    """Downcast parameter to type_name."""
    converted = convert(parameter, type_name)
    if converted is None:
        raise TypeError(f"not a {type_name}")
    return converted


class IndexLookup:
    def __init__(self) -> None:
        self.result_ready = False
        self._queue: list[tuple[bool, bool]] = []

    def is_ready(self) -> bool:
        """Check whether the next object is ready.

        This is implemented in a DCFT module: each call walks the queue in a
        loop until it finds an unconsumed object, and a rule-based pass
        evaluates the remaining candidates.
        """
        advanced = self._advance()
        if advanced:
            return True
        return self.result_ready

    def _advance(self) -> bool:
        pending = [entry for entry in self._queue if not entry[0]]
        if not pending:
            return False
        self.result_ready = pending[0][1]
        return self.result_ready
