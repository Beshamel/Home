import typing as t
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.util import strip_accents
from app.models.kiwi import KiwiPage as KiwiPageModel
from app.schemas.kiwi import (
    Element,
    FormatChunk,
    KiwiPageData,
    Line,
    LinkChunk,
    List,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextChunk,
    Title,
    Media,
)

list_markers = {"*": "unordered", "+": "ordered", ":": "simple"}
format_markers = {"<b": "bold", "<i": "italic", "<u": "underline"}
all_inline_markers = {**format_markers, "<a": "link"}

media_types = {
    "jpg": "image",
    "jpeg": "image",
    "png": "image",
    "gif": "image",
    "bmp": "image",
    "mp4": "video",
    "webm": "video",
    "ogg": "video",
    "mp3": "audio",
    "wav": "audio",
    "ogg": "audio",
}


def parse_kiwi_data(raw_content: str) -> t.List[Title | Paragraph]:
    raw_content = raw_content.replace("\r\n", "\n").replace("\r", "\n")
    raw_content = raw_content + "\n\n"
    parsed = []
    title_ids = set()
    a = 0
    b = 0

    while True:
        b += 1
        while a < len(raw_content) and (
            raw_content[a] == "\n" or raw_content[a] == " "
        ):
            a += 1
        if b < a:
            b = a
        if b >= len(raw_content):
            break
        if raw_content[b] == "\n" and raw_content[a] == "#":
            parsed.append(parse_title(raw_content[a:b], title_ids))
            a = b
        if raw_content[b] == "\n" and raw_content[a] in list_markers:
            indent_type = list_markers[raw_content[a]]
            while not (
                raw_content[b] == "\n"
                and not (
                    raw_content[b + 1] in list_markers
                    and list_markers[raw_content[b + 1]] == indent_type
                )
            ):
                b += 1
                if b >= len(raw_content):
                    break
            parsed.append(
                List(
                    type="list",
                    indent_type=indent_type,
                    elts=parse_list(raw_content[a:b].split("\n")),
                )
            )
            a = b
        if raw_content[b] == ">" and raw_content[a : a + 2] == "<T":
            parsed.append(parse_table(raw_content[a + 2 : b]))
            b += 1
            a = b
        if raw_content[b] == ">" and raw_content[a : a + 2] == "<M":
            parsed.append(parse_media(raw_content[a + 2 : b]))
            b += 1
            a = b
        elif raw_content[b] == "\n" and (
            raw_content[b + 1] == "\n"
            or raw_content[b + 1] == "#"
            or raw_content[b + 1] in list_markers
        ):
            parsed.append(
                Paragraph(
                    type="paragraph", lines=parse_lines(raw_content[a:b].split("\n"))
                )
            )
            a = b

    return parsed


def parse_title(raw_chunk: str, title_ids: t.Set[str]) -> Title:
    depth = 0
    for c in raw_chunk:
        if c == "#":
            depth += 1
        else:
            break
    if depth == 0:
        raise ValueError("Invalid title format")
    title_id = strip_accents(raw_chunk[depth:].strip()).replace(" ", "_")
    simple_id = title_id
    i = 0
    while title_id in title_ids:
        i += 1
        title_id = f"{simple_id}_{i}"
    title_ids.add(title_id)
    return Title(
        type="title",
        depth=depth,
        text=raw_chunk[depth:].strip(),
        id=title_id,
    )


def parse_lines(lines: t.List[str]) -> t.List[Line | List]:
    return [Line(type="line", chunks=parse_inline(line)) for line in lines]


def parse_list(raw_elts: t.List[str]) -> t.List[Element | List]:
    elts = []
    sublist_indent_type = None
    sublist = []
    for raw_elt in map(lambda s: s[1:].strip(), raw_elts):
        if raw_elt and raw_elt[0] in list_markers:
            if sublist_indent_type and list_markers[raw_elt[0]] != sublist_indent_type:
                elts.append(
                    List(
                        type="list",
                        indent_type=sublist_indent_type,
                        elts=parse_list(sublist),
                    )
                )
                sublist = []
                sublist_indent_type = None
            sublist_indent_type = list_markers[raw_elt[0]]
            sublist.append(raw_elt)
        else:
            if sublist_indent_type:
                elts.append(
                    List(
                        type="list",
                        indent_type=sublist_indent_type,
                        elts=parse_list(sublist),
                    )
                )
                sublist = []
                sublist_indent_type = None
            elts.append(Element(type="element", chunks=parse_inline(raw_elt)))
    if sublist_indent_type and sublist:
        elts.append(
            List(
                type="list",
                indent_type=sublist_indent_type,
                elts=parse_list(sublist),
            )
        )
    return elts


def parse_table(raw_table: str) -> Table:
    lines = raw_table.split(";")
    first = lines[0]
    rows = lines[1:]
    width = len(first.split("|"))
    title = ""
    header = ""

    if ":" in first:
        title, header = first.split(":", 1)
        title = title.strip()
    else:
        header = first
    headers = list(map(lambda h: h.strip(), header.split("|")))
    width = len(headers)
    if all(not h for h in headers):
        headers = None

    return Table(
        type="table",
        width=width,
        title=title if title else None,
        headers=(
            TableRow(cells=[TableCell(content=parse_lines([h])) for h in headers])
            if headers
            else None
        ),
        rows=[
            TableRow(
                cells=[
                    TableCell(content=parse_lines([cell.strip()]))
                    for cell in row.split("|")
                ]
            )
            for row in rows
        ],
    )


def parse_inline(
    raw_chunks: str,
) -> t.List[TextChunk | LinkChunk | FormatChunk]:

    parsed = []
    a = 0
    b = 0

    while True:
        if b >= len(raw_chunks):
            if b - a > 0:
                parsed.append(
                    TextChunk(type="text", text=raw_chunks[a : len(raw_chunks)])
                )
            break
        if raw_chunks[b : b + 2] in format_markers:
            if b - a > 0:
                parsed.append(TextChunk(type="text", text=raw_chunks[a:b]))
            a = b
            b += 2
            depth = 1
            while b < len(raw_chunks):
                if raw_chunks[b] == ">":
                    depth -= 1
                    if depth == 0:
                        break
                elif raw_chunks[b : b + 2] in all_inline_markers:
                    depth += 1
                b += 1
            format_type = format_markers[raw_chunks[a : a + 2]]
            parsed.append(
                FormatChunk(
                    type="format",
                    format=format_type,
                    chunks=parse_inline(raw_chunks[a + 2 : b]),
                )
            )
            b += 1
            a = b
            continue
        if raw_chunks[b : b + 2] == "<a":
            if b - a > 0:
                parsed.append(TextChunk(type="text", text=raw_chunks[a:b]))
            a = b
            while b < len(raw_chunks) and not (raw_chunks[b] == ">"):
                b += 1
            parsed.append(parse_link(raw_chunks[a + 2 : b]))
            b += 1
            a = b
            continue
        b += 1
    return parsed


def parse_link(raw_chunk: str) -> LinkChunk:
    url, text = "", ""
    if "|" in raw_chunk:
        url, text = raw_chunk.split("|", 1)
    else:
        url = raw_chunk.strip()
        text = url
    return LinkChunk(type="link", text=text.strip(), url=url.strip())


def parse_media(raw_chunk: str) -> Media:
    caption = ""
    if ":" in raw_chunk:
        caption, filename = raw_chunk.split(":", 1)
    else:
        filename = raw_chunk.strip()
    media_type = media_types.get(filename.split(".")[-1].lower(), "image")
    return Media(
        type="media",
        mediaType=media_type.strip(),
        filename=filename.strip(),
        caption=caption.strip() if caption else None,
    )


def format_title(db: Session, title: str) -> str:
    formatted = strip_accents(title).replace(" ", "_")
    extensions = (
        db.query(KiwiPageModel.formatted_title)
        .filter(KiwiPageModel.formatted_title.like(f"{formatted}%"))
        .all()
    )
    full_title = formatted
    i = 0
    while full_title in extensions:
        i += 1
        full_title = f"{formatted}_{i}"
    return full_title


def get_kiwi_page_data(db: Session, f_title: str) -> KiwiPageData:
    page = (
        db.query(KiwiPageModel).filter(KiwiPageModel.formatted_title == f_title).first()
    )
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return KiwiPageData(
        title=page.title,
        f_title=page.formatted_title,
        formatted_title=page.formatted_title,
        raw_content=page.raw_content,
        content=parse_kiwi_data(page.raw_content),
    )


def add_kiwi_page(db: Session, title: str, raw_content: str) -> KiwiPageData:
    new_page = KiwiPageModel(
        title=title, formatted_title=format_title(db, title), raw_content=raw_content
    )
    db.add(new_page)
    db.commit()
    db.refresh(new_page)
    return KiwiPageData(
        title=new_page.title,
        f_title=new_page.formatted_title,
        formatted_title=new_page.formatted_title,
        raw_content=new_page.raw_content,
        content=parse_kiwi_data(new_page.raw_content),
    )


def update_kiwi_page(
    db: Session, f_title: str, title: str, raw_content: str
) -> KiwiPageData:
    page = (
        db.query(KiwiPageModel).filter(KiwiPageModel.formatted_title == f_title).first()
    )
    if not page:
        raise ValueError("Page not found")
    page.title = title
    page.formatted_title = format_title(db, title)
    page.raw_content = raw_content
    db.commit()
    db.refresh(page)
    return KiwiPageData(
        title=page.title,
        f_title=page.formatted_title,
        formatted_title=page.formatted_title,
        raw_content=page.raw_content,
        content=parse_kiwi_data(page.raw_content),
    )


def delete_kiwi_page(db: Session, f_title: str) -> None:
    page = (
        db.query(KiwiPageModel).filter(KiwiPageModel.formatted_title == f_title).first()
    )
    if not page:
        raise ValueError("Page not found")
    db.delete(page)
    db.commit()


def search_kiwi_pages(db: Session, query: str) -> t.List[KiwiPageData]:
    pages = (
        db.query(KiwiPageModel).filter((KiwiPageModel.title.ilike(f"%{query}%"))).all()
    )
    return [
        KiwiPageData(
            title=page.title,
            f_title=page.formatted_title,
            formatted_title=page.formatted_title,
            raw_content=page.raw_content,
            content=parse_kiwi_data(page.raw_content),
        )
        for page in pages
    ]
