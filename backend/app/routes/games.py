from fastapi import APIRouter, Depends,UploadFile,File,HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import shutil,os
from ..models import Game,User,SaveFile
from ..schemas import *
from ..deps import get_db, get_current_user
from ..metrics import games_created, games_deleted, uploads, upload_rejections, downloads


router = APIRouter(prefix="/games", tags=["Games"])

UPLOAD_DIR = "uploads"
ALLOWED_ART_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
MAX_ART_BYTES = 5 * 1024 * 1024


def save_upload(upload: UploadFile, filename: str) -> str:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as buffer:
        shutil.copyfileobj(upload.file, buffer)
    return path


def original_name(path, marker):
    base = os.path.basename(path or "")
    token = f"_{marker}_"
    index = base.find(token)

    if index == -1:
        return base

    return base[index + len(token):]


def owned_game(game_id, db, user):
    game = db.query(Game).filter(
        Game.id == game_id,
        Game.owner_id == user.id
    ).first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    return game


def remove_file(path: str):
    if path and os.path.exists(path):
        os.remove(path)


@router.post("/", response_model=GameOut)
def create_game(game: GameCreate,
                db: Session = Depends(get_db),
                current_user = Depends(get_current_user)):

    db_game = Game(**game.model_dump(), owner_id=current_user.id)
    db.add(db_game)
    db.commit()
    db.refresh(db_game)

    games_created.inc()

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
        remove_file(game.rom_path)
        remove_file(game.art_path)
        for save in game.saves:
            remove_file(save.file_path)
        db.delete(game)
        db.commit()

        games_deleted.inc()

    return {"message": "Deleted"}


@router.get("/{game_id}", response_model=GameOut)
def get_game(game_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    game = db.query(Game).filter(
        Game.id == game_id,
        Game.owner_id == current_user.id
    ).first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    return game


@router.put("/{game_id}", response_model=GameOut)
def update_game(game_id: int, game_data: GameUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    game = db.query(Game).filter(
        Game.id == game_id,
        Game.owner_id == current_user.id
    ).first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    game.title = game_data.title
    game.platform = game_data.platform
    game.year = game_data.year
    game.genre = game_data.genre

    db.commit()
    db.refresh(game)
    return game


@router.post("/{game_id}/upload", response_model=GameOut)
def upload_files(
    game_id: int,
    rom: UploadFile = File(None),
    save: UploadFile = File(None),
    art: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    game = db.query(Game).filter(
        Game.id == game_id,
        Game.owner_id == current_user.id
    ).first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if rom:
        remove_file(game.rom_path)
        game.rom_path = save_upload(rom, f"{game_id}_rom_{rom.filename}")
        uploads.labels(kind="rom").inc()

    if save:
        path = save_upload(save, f"{game_id}_save_{save.filename}")
        db.add(SaveFile(file_path=path, game_id=game.id))
        uploads.labels(kind="save").inc()

    if art:
        extension = os.path.splitext(art.filename)[1].lower()

        if extension not in ALLOWED_ART_EXTENSIONS:
            upload_rejections.labels(reason="unsupported_format").inc()
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported art format '{extension}'. Allowed: {', '.join(sorted(ALLOWED_ART_EXTENSIONS))}"
            )

        art.file.seek(0, os.SEEK_END)
        size = art.file.tell()
        art.file.seek(0)

        if size > MAX_ART_BYTES:
            upload_rejections.labels(reason="too_large").inc()
            raise HTTPException(
                status_code=400,
                detail=f"Art file is too large ({size} bytes). Maximum is {MAX_ART_BYTES} bytes."
            )

        remove_file(game.art_path)
        game.art_path = save_upload(art, f"{game_id}_art{extension}")
        uploads.labels(kind="art").inc()

    db.commit()
    db.refresh(game)

    return game


@router.delete("/{game_id}/art", response_model=GameOut)
def delete_art(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    game = db.query(Game).filter(
        Game.id == game_id,
        Game.owner_id == current_user.id
    ).first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    remove_file(game.art_path)
    game.art_path = None

    db.commit()
    db.refresh(game)

    return game


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

    remove_file(save.file_path)

    db.delete(save)
    db.commit()

    return {"message": "Save deleted"}


@router.get("/{game_id}/rom")
def download_rom(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    game = owned_game(game_id, db, current_user)

    if not game.rom_path:
        raise HTTPException(status_code=404, detail="This game has no ROM uploaded")

    if not os.path.exists(game.rom_path):
        raise HTTPException(status_code=410, detail="The ROM is recorded but missing from storage")

    downloads.labels(kind="rom").inc()

    return FileResponse(
        game.rom_path,
        media_type="application/octet-stream",
        filename=original_name(game.rom_path, "rom"),
    )


@router.get("/saves/{save_id}/download")
def download_save(
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

    if not os.path.exists(save.file_path):
        raise HTTPException(status_code=410, detail="The save is recorded but missing from storage")

    downloads.labels(kind="save").inc()

    return FileResponse(
        save.file_path,
        media_type="application/octet-stream",
        filename=original_name(save.file_path, "save"),
    )
