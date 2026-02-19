from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..deps import get_db, get_current_user

router = APIRouter(prefix="/games", tags=["Games"])

@router.post("/", response_model=schemas.GameOut)
def create_game(game: schemas.GameCreate,
                db: Session = Depends(get_db),
                current_user = Depends(get_current_user)):

    db_game = models.Game(**game.model_dump(), owner_id=current_user.id)
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game


@router.get("/", response_model=List[schemas.GameOut])
def get_games(db: Session = Depends(get_db),
              current_user = Depends(get_current_user)):

    return db.query(models.Game).filter(
        models.Game.owner_id == current_user.id
    ).all()


@router.delete("/{game_id}")
def delete_game(game_id: int,
                db: Session = Depends(get_db),
                current_user = Depends(get_current_user)):

    game = db.query(models.Game).filter(
        models.Game.id == game_id,
        models.Game.owner_id == current_user.id
    ).first()

    if game:
        db.delete(game)
        db.commit()

    return {"message": "Deleted"}
