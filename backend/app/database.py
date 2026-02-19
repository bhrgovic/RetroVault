from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError
import time
from .config import DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Wait for DB to be ready
def wait_for_db():
    while True:
        try:
            with engine.connect():
                print("Database is ready!")
                break
        except OperationalError:
            print("Database not ready, retrying in 2 seconds...")
            time.sleep(2)

wait_for_db()
