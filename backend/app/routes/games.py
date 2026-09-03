from fastapi import APIRouter, Depends,UploadFile,File,HTTPException
from sqlalchemy.orm import Session
from typing import List
import shutil,os
from ..models import Game,User,SaveFile
from ..schemas import *
from ..deps import get_db, get_current_user


router = APIRouter(prefix="/games", tags=["Games"])

@router.post("/", response_model=GameOut)
def create_game(game: GameCreate,
                db: Session = Depends(get_db),
                current_user = Depends(get_current_user)):

    db_game = Game(**game.model_dump(), owner_id=current_user.id)
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game


@router.get("/", response_model=List[GameOut])
def get_games(db: Session = Depends(get_db),
              current_user = Depends(get_current_user)):

    return db.query(Game).filter(
        Game.owner_id == current_user.id
    ).all()


@router.delete("/{game_id}")
def delete_game(game_id: int,
                db: Session = Depends(get_db),
                current_user = Depends(get_current_user)):

    game = db.query(Game).filter(
        Game.id == game_id,
        Game.owner_id == current_user.id
    ).first()

    if game:
        db.delete(game)
        db.commit()

    return {"message": "Deleted"}


@router.get("/{game_id}")
def get_game(game_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    game = db.query(Game).filter(Game.id == game_id).first()
    return game


@router.put("/{game_id}")
def update_game(game_id: int, game_data: GameUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    game = db.query(Game).filter(Game.id == game_id).first()

    game.title = game_data.title
    game.platform = game_data.platform
    game.year = game_data.year
    game.genre = game_data.genre

    db.commit()
    db.refresh(game)
    return game

@router.post("/{game_id}/upload")
def upload_files(
    game_id: int,
    rom: UploadFile = File(None),
    save: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    game = db.query(Game).filter(
        Game.id == game_id,
        Game.owner_id == current_user.id
    ).first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    os.makedirs("uploads", exist_ok=True)

    # ROM (only one allowed)
    if rom:
        rom_path = f"uploads/{game_id}_rom_{rom.filename}"
        with open(rom_path, "wb") as buffer:
            shutil.copyfileobj(rom.file, buffer)
        game.rom_path = rom_path

    # SAVE (multiple allowed)
    if save:
        save_path = f"uploads/{game_id}_save_{save.filename}"
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(save.file, buffer)

        new_save = SaveFile(
            file_path=save_path,
            game_id=game.id
        )
        db.add(new_save)

    db.commit()
    db.refresh(game)

    return {"message": "Upload successful"}


@router.delete("/saves/{save_id}")
def delete_save(
    save_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    save = db.query(SaveFile).join(Game).filter(
        SaveFile.id == save_id,
        Game.owner_id == current_user.id
    ).first()

    if not save:
        raise HTTPException(status_code=404, detail="Save not found")

    if os.path.exists(save.file_path):
        os.remove(save.file_path)

    db.delete(save)
    db.commit()

    return {"message": "Save deleted"}