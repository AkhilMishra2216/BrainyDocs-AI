import uuid
import datetime
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models
from database import get_db

router = APIRouter(tags=["auth"])

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

def get_current_user(request: Request, db: Session = Depends(get_db)):
    session_token = request.cookies.get("session_token")
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = db.query(models.Session).filter(models.Session.session_token == session_token).first()
    if not session or session.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    
    user = db.query(models.User).filter(models.User.id == session.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    return user

@router.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user.password)
    new_user = models.User(email=user.email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}

@router.post("/login")
async def login(user: UserLogin, response: Response, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    session_token = str(uuid.uuid4())
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    
    new_session = models.Session(
        session_token=session_token,
        user_id=db_user.id,
        expires_at=expires_at
    )
    db.add(new_session)
    db.commit()
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        samesite="lax",
        expires=expires_at
    )
    
    return {"message": "Login successful", "user": {"id": db_user.id, "email": db_user.email}}

@router.post("/logout")
async def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    session_token = request.cookies.get("session_token")
    if session_token:
        session = db.query(models.Session).filter(models.Session.session_token == session_token).first()
        if session:
            db.delete(session)
            db.commit()
    
    response.delete_cookie("session_token")
    return {"message": "Logout successful"}

@router.get("/me")
async def get_me(user: models.User = Depends(get_current_user)):
    return {"user": {"id": user.id, "email": user.email}}
