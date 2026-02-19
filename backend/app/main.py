from fastapi import FastAPI
from contextlib import asynccontextmanager
from .database import Base, engine
from .routes import users, games


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown logic (if needed later)


app = FastAPI(
    title="RetroVault API",
    lifespan=lifespan
)

app.include_router(users.router)
app.include_router(games.router)
