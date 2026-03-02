import typing as t

from app.util import CustomBaseModel


class KiwiPageData(CustomBaseModel):
    title: str
    f_title: str
    formatted_title: str
    raw_content: str
    content: t.List[Title | Paragraph | List | Table | Media]


class Title(CustomBaseModel):
    type: t.Literal["title"]
    depth: int
    text: str
    id: str


class Paragraph(CustomBaseModel):
    type: t.Literal["paragraph"]
    lines: t.List[Line]


class Line(CustomBaseModel):
    type: t.Literal["line"]
    chunks: t.List[TextChunk | LinkChunk | FormatChunk]


class List(CustomBaseModel):
    type: t.Literal["list"]
    indent_type: t.Literal["unordered", "ordered", "simple"]
    elts: t.List[Element | List]


class Element(CustomBaseModel):
    type: t.Literal["element"]
    chunks: t.List[TextChunk | LinkChunk | FormatChunk]


class Table(CustomBaseModel):
    type: t.Literal["table"]
    width: int
    title: t.Optional[str]
    headers: t.Optional[TableRow]
    rows: t.List[TableRow]


class TableRow(CustomBaseModel):
    cells: t.List[TableCell]


class TableCell(CustomBaseModel):
    content: t.List[Line]


class FormatChunk(CustomBaseModel):
    type: t.Literal["format"]
    format: t.Literal["bold", "italic", "underline"]
    chunks: t.List[TextChunk | LinkChunk | FormatChunk]


class TextChunk(CustomBaseModel):
    type: t.Literal["text"]
    text: str


class LinkChunk(CustomBaseModel):
    type: t.Literal["link"]
    text: str
    url: str


class Media(CustomBaseModel):
    type: t.Literal["media"]
    mediaType: t.Literal["image", "video", "audio"]
    filename: str
    caption: t.Optional[str]
