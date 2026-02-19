from fastapi import FastAPI
from contextlib import asynccontextmanager
from prometheus_fastapi_instrumentator import Instrumentator
from .database import Base, engine
from .routes import users, games


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="RetroVault API",
    lifespan=lifespan
)

app.include_router(users.router)
app.include_router(games.router)

Instrumentator().instrument(app).expose(app)
