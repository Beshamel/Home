import typing as t
from sqlalchemy.orm import Session

from app.models.quick_access_link import (
    QuickAccessLink as QuickAccessLinkModel,
    QuickAccessShortcut,
)
from app.schemas.quick_access_link import QuickAccessLink


def get_quick_access_links(db: Session) -> t.List[QuickAccessLink]:
    return db.query(QuickAccessLinkModel).all()


def add_quick_access_link(db: Session, dname: str, url: str) -> QuickAccessLink:
    new_link = QuickAccessLinkModel(dname=dname, url=url, shortcuts=[])
    db.add(new_link)
    db.commit()
    db.refresh(new_link)
    return new_link


def edit_quick_access_link(
    db: Session,
    url: str,
    new_dname: t.Optional[str] = None,
    new_url: t.Optional[str] = None,
) -> QuickAccessLink:
    existing_link = (
        db.query(QuickAccessLinkModel).filter(QuickAccessLinkModel.url == url).first()
    )
    if existing_link:
        if new_dname is not None:
            existing_link.dname = new_dname
        if new_url is not None:
            existing_link.url = new_url
        db.commit()
        db.refresh(existing_link)
        return existing_link
    else:
        raise ValueError(f"No quick access link found for URL: {url}")


def remove_quick_access_link(db: Session, url: str) -> QuickAccessLink:
    existing_link = (
        db.query(QuickAccessLinkModel).filter(QuickAccessLinkModel.url == url).first()
    )
    if existing_link:
        db.delete(existing_link)
        db.commit()
    return existing_link


def add_quick_access_shortcut(db: Session, url: str, shortcut: str) -> QuickAccessLink:
    existing_link = (
        db.query(QuickAccessLinkModel).filter(QuickAccessLinkModel.url == url).first()
    )
    if existing_link:
        if shortcut not in existing_link.shortcuts:
            existing_link.qas.append(
                QuickAccessShortcut(shortcut=shortcut, link=existing_link)
            )
            db.commit()
            db.refresh(existing_link)
        return existing_link
    else:
        raise ValueError(f"No quick access link found for URL: {url}")


def remove_quick_access_shortcut(
    db: Session, url: str, shortcut: str
) -> QuickAccessLink:
    existing_link = (
        db.query(QuickAccessLinkModel).filter(QuickAccessLinkModel.url == url).first()
    )
    if existing_link:
        shortcut_obj = next(
            (s for s in existing_link.qas if s.shortcut == shortcut),
            None,
        )
        if shortcut_obj:
            existing_link.qas.remove(shortcut_obj)
            db.commit()
            db.refresh(existing_link)
        return existing_link
    else:
        raise ValueError(f"No quick access link found for URL: {url}")
