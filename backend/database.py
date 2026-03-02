import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import declarative_base

# DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_PASSWORD = "1234"

engine = create_engine(f"mysql+mysqldb://root:{DB_PASSWORD}@localhost:3306/home")

SessionLocal = sessionmaker(bind=engine)


Base = declarative_base()


def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
