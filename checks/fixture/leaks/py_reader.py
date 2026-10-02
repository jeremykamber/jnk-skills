from dataclasses import dataclass


@dataclass
class FileHeader:
    type: str
    length: int
    checksum: str
    name: str
    encoding: str
    version: int
