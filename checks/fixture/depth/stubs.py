"""Collaborators for book.py, so the fixture reads as real code.

Not scanned by the test: the detector is pinned to book.py, not to this.
"""

from __future__ import annotations


class TextArea:
    def __init__(self) -> None:
        self._storage = ""

    def get_last_typed_character(self) -> str:
        return self._storage[-1:] if self._storage else ""

    def insert_string(self, text_to_insert: str, offset: int) -> None:
        head = self._storage[:offset]
        tail = self._storage[offset:]
        self._storage = head + text_to_insert + tail


class TextDocumentListener:
    def will_insert_string(self, document: object, text: str, offset: int) -> None:
        del document, text, offset


def convert(parameter: object, type_name: str) -> object:
    if type_name == "str" and isinstance(parameter, int):
        return str(parameter)
    return parameter
