from typing import List

from database import Base
from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column


class KiwiPage(Base):
    __tablename__ = "kiwi_page"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(length=255), nullable=False)
    formatted_title: Mapped[str] = mapped_column(String(length=255), nullable=False)
    raw_content: Mapped[str] = mapped_column(Text, nullable=False)