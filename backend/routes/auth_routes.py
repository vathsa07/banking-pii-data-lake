import os
import sys

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.auth import create_access_token, get_db_connection, verify_password

sys.path.append(os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../..")))

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT u.username, u.password_hash, u.role_name
                FROM users u
                WHERE u.username = %s;
            """,
                (req.username,),
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(
                    status_code=401, detail="Invalid username or password"
                )

            db_username, db_pass_hash, db_role = row
            if not verify_password(req.password, db_pass_hash):
                raise HTTPException(
                    status_code=401, detail="Invalid username or password"
                )

            token = create_access_token(db_username, db_role)
            return LoginResponse(
                access_token=token,
                token_type="bearer",
                username=db_username,
                role=db_role,
            )
    finally:
        conn.close()
