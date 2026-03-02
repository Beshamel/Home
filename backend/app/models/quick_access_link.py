from typing import List

from database import Base
from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


class QuickAccessLink(Base):
    __tablename__ = "quick_access_link"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    url: Mapped[str] = mapped_column(
        String(length=255), unique=True, index=True, nullable=False
    )
    dname: Mapped[str] = mapped_column(String(length=255), nullable=False)

    qas: Mapped[List["QuickAccessShortcut"]] = relationship(
        "QuickAccessShortcut",
        back_populates="link",
    )

    @property
    def shortcuts(self) -> List[str]:
        return [s.shortcut for s in self.qas]
    
    @shortcuts.setter
    def shortcuts(self, shortcuts: List[str]) -> None:
        self.qas = [QuickAccessShortcut(shortcut=s) for s in shortcuts]


class QuickAccessShortcut(Base):
    __tablename__ = "quick_access_shortcut"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    link_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("quick_access_link.id"), nullable=False
    )
    shortcut: Mapped[str] = mapped_column(
        String(length=255), unique=True, index=True, nullable=False
    )

    link: Mapped["QuickAccessLink"] = relationship(
        "QuickAccessLink",
        back_populates="qas",
    )
