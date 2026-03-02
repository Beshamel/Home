import typing as t
from sqlalchemy.orm import Session

from app.models.quick_access_link import QuickAccessLink as QuickAccessLinkModel
from app.schemas.quick_access_link import QuickAccessLink

def get_quick_access_links(db: Session) -> t.List[QuickAccessLink]:
    return db.query(QuickAccessLinkModel).all()

def add_quick_access_link(
    db: Session,
    link: QuickAccessLink
) -> QuickAccessLink:
    new_link = QuickAccessLinkModel(
        dname=link.dname,
        url=link.url,
        shortcuts=link.shortcuts
    )
    db.add(new_link)
    db.commit()
    db.refresh(new_link)
    return new_link