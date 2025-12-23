from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import io
import csv
from fastapi.responses import StreamingResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== Models ====================

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserRegister(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    role: str = "user"
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class ProjectCreate(BaseModel):
    name: str
    color: str = "#4F46E5"

class Project(ProjectCreate):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    created_at: datetime

class TimeEntryCreate(BaseModel):
    task_name: str
    description: Optional[str] = ""
    project_id: Optional[str] = None
    tags: List[str] = []

class TimeEntryUpdate(BaseModel):
    task_name: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[str] = None
    tags: Optional[List[str]] = None

class TimeEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    task_name: str
    description: str
    project_id: Optional[str] = None
    tags: List[str]
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: int = 0  # in seconds
    is_running: bool = False
    created_at: datetime

class TimerStart(BaseModel):
    task_name: str
    description: Optional[str] = ""
    project_id: Optional[str] = None
    tags: List[str] = []

class DailySummary(BaseModel):
    date: str
    total_duration: int
    entries_count: int
    entries: List[TimeEntry]

class AdminUserStats(BaseModel):
    user: User
    total_entries: int
    total_duration: int
    last_activity: Optional[datetime] = None

# ==================== Helper Functions ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

# ==================== Auth Routes ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    # Assign admin role if email is admin@timekeeper.com
    role = "admin" if user_data.email == "admin@timekeeper.com" else "user"
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    user = User(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=role,
        created_at=datetime.fromisoformat(user_doc["created_at"])
    )
    
    return Token(access_token=access_token, user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    access_token = create_access_token(data={"sub": user_doc["id"]})
    
    user = User(
        id=user_doc["id"],
        email=user_doc["email"],
        name=user_doc["name"],
        role=user_doc["role"],
        created_at=datetime.fromisoformat(user_doc["created_at"])
    )
    
    return Token(access_token=access_token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# ==================== Project Routes ====================

@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    project_id = str(uuid.uuid4())
    project_doc = {
        "id": project_id,
        "user_id": current_user["id"],
        "name": project_data.name,
        "color": project_data.color,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.projects.insert_one(project_doc)
    
    return Project(
        id=project_id,
        user_id=current_user["id"],
        name=project_data.name,
        color=project_data.color,
        created_at=datetime.fromisoformat(project_doc["created_at"])
    )

@api_router.get("/projects", response_model=List[Project])
async def get_projects(current_user: dict = Depends(get_current_user)):
    projects = await db.projects.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    return [Project(**{**p, "created_at": datetime.fromisoformat(p["created_at"])}) for p in projects]

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.projects.delete_one({"id": project_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted"}

# ==================== Timer Routes ====================

@api_router.post("/timer/start", response_model=TimeEntry)
async def start_timer(timer_data: TimerStart, current_user: dict = Depends(get_current_user)):
    # Stop any running timer
    running_entry = await db.time_entries.find_one({"user_id": current_user["id"], "is_running": True})
    if running_entry:
        end_time = datetime.now(timezone.utc)
        start = datetime.fromisoformat(running_entry["start_time"])
        duration = int((end_time - start).total_seconds())
        await db.time_entries.update_one(
            {"id": running_entry["id"]},
            {"$set": {"is_running": False, "end_time": end_time.isoformat(), "duration": duration}}
        )
    
    # Start new timer
    entry_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    entry_doc = {
        "id": entry_id,
        "user_id": current_user["id"],
        "task_name": timer_data.task_name,
        "description": timer_data.description or "",
        "project_id": timer_data.project_id,
        "tags": timer_data.tags,
        "start_time": now.isoformat(),
        "end_time": None,
        "duration": 0,
        "is_running": True,
        "created_at": now.isoformat()
    }
    
    await db.time_entries.insert_one(entry_doc)
    
    return TimeEntry(
        id=entry_id,
        user_id=current_user["id"],
        task_name=timer_data.task_name,
        description=timer_data.description or "",
        project_id=timer_data.project_id,
        tags=timer_data.tags,
        start_time=now,
        end_time=None,
        duration=0,
        is_running=True,
        created_at=now
    )

@api_router.post("/timer/stop", response_model=TimeEntry)
async def stop_timer(current_user: dict = Depends(get_current_user)):
    running_entry = await db.time_entries.find_one({"user_id": current_user["id"], "is_running": True})
    if not running_entry:
        raise HTTPException(status_code=404, detail="No running timer found")
    
    end_time = datetime.now(timezone.utc)
    start_time = datetime.fromisoformat(running_entry["start_time"])
    duration = int((end_time - start_time).total_seconds())
    
    await db.time_entries.update_one(
        {"id": running_entry["id"]},
        {"$set": {"is_running": False, "end_time": end_time.isoformat(), "duration": duration}}
    )
    
    return TimeEntry(
        id=running_entry["id"],
        user_id=running_entry["user_id"],
        task_name=running_entry["task_name"],
        description=running_entry["description"],
        project_id=running_entry.get("project_id"),
        tags=running_entry["tags"],
        start_time=start_time,
        end_time=end_time,
        duration=duration,
        is_running=False,
        created_at=datetime.fromisoformat(running_entry["created_at"])
    )

@api_router.get("/timer/current", response_model=Optional[TimeEntry])
async def get_current_timer(current_user: dict = Depends(get_current_user)):
    running_entry = await db.time_entries.find_one({"user_id": current_user["id"], "is_running": True})
    if not running_entry:
        return None
    
    return TimeEntry(
        id=running_entry["id"],
        user_id=running_entry["user_id"],
        task_name=running_entry["task_name"],
        description=running_entry["description"],
        project_id=running_entry.get("project_id"),
        tags=running_entry["tags"],
        start_time=datetime.fromisoformat(running_entry["start_time"]),
        end_time=None,
        duration=running_entry["duration"],
        is_running=True,
        created_at=datetime.fromisoformat(running_entry["created_at"])
    )

# ==================== Time Entry Routes ====================

@api_router.get("/entries", response_model=List[TimeEntry])
async def get_entries(current_user: dict = Depends(get_current_user), limit: int = 100):
    entries = await db.time_entries.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return [
        TimeEntry(
            **{
                **e,
                "start_time": datetime.fromisoformat(e["start_time"]),
                "end_time": datetime.fromisoformat(e["end_time"]) if e.get("end_time") else None,
                "created_at": datetime.fromisoformat(e["created_at"])
            }
        )
        for e in entries
    ]

@api_router.get("/entries/{entry_id}", response_model=TimeEntry)
async def get_entry(entry_id: str, current_user: dict = Depends(get_current_user)):
    entry = await db.time_entries.find_one({"id": entry_id, "user_id": current_user["id"]}, {"_id": 0})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    return TimeEntry(
        **{
            **entry,
            "start_time": datetime.fromisoformat(entry["start_time"]),
            "end_time": datetime.fromisoformat(entry["end_time"]) if entry.get("end_time") else None,
            "created_at": datetime.fromisoformat(entry["created_at"])
        }
    )

@api_router.put("/entries/{entry_id}", response_model=TimeEntry)
async def update_entry(entry_id: str, update_data: TimeEntryUpdate, current_user: dict = Depends(get_current_user)):
    entry = await db.time_entries.find_one({"id": entry_id, "user_id": current_user["id"]})
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        await db.time_entries.update_one({"id": entry_id}, {"$set": update_dict})
        entry.update(update_dict)
    
    return TimeEntry(
        **{
            **entry,
            "start_time": datetime.fromisoformat(entry["start_time"]),
            "end_time": datetime.fromisoformat(entry["end_time"]) if entry.get("end_time") else None,
            "created_at": datetime.fromisoformat(entry["created_at"])
        }
    )

@api_router.delete("/entries/{entry_id}")
async def delete_entry(entry_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.time_entries.delete_one({"id": entry_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Entry deleted"}

# ==================== Summary Routes ====================

@api_router.get("/entries/summary/daily")
async def get_daily_summary(date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if date:
        target_date = datetime.fromisoformat(date).date()
    else:
        target_date = datetime.now(timezone.utc).date()
    
    start_of_day = datetime.combine(target_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    end_of_day = datetime.combine(target_date, datetime.max.time()).replace(tzinfo=timezone.utc)
    
    entries = await db.time_entries.find(
        {
            "user_id": current_user["id"],
            "start_time": {"$gte": start_of_day.isoformat(), "$lte": end_of_day.isoformat()}
        },
        {"_id": 0}
    ).to_list(1000)
    
    total_duration = sum(e.get("duration", 0) for e in entries if not e.get("is_running"))
    
    return {
        "date": target_date.isoformat(),
        "total_duration": total_duration,
        "entries_count": len(entries),
        "entries": [
            TimeEntry(
                **{
                    **e,
                    "start_time": datetime.fromisoformat(e["start_time"]),
                    "end_time": datetime.fromisoformat(e["end_time"]) if e.get("end_time") else None,
                    "created_at": datetime.fromisoformat(e["created_at"])
                }
            )
            for e in entries
        ]
    }

@api_router.get("/entries/summary/weekly")
async def get_weekly_summary(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    start_of_week = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    
    entries = await db.time_entries.find(
        {
            "user_id": current_user["id"],
            "start_time": {"$gte": start_of_week.isoformat()}
        },
        {"_id": 0}
    ).to_list(1000)
    
    # Group by day
    daily_summaries = {}
    for i in range(7):
        day = (start_of_week + timedelta(days=i)).date()
        daily_summaries[day.isoformat()] = {"date": day.isoformat(), "total_duration": 0, "entries_count": 0}
    
    for entry in entries:
        entry_date = datetime.fromisoformat(entry["start_time"]).date().isoformat()
        if entry_date in daily_summaries and not entry.get("is_running"):
            daily_summaries[entry_date]["total_duration"] += entry.get("duration", 0)
            daily_summaries[entry_date]["entries_count"] += 1
    
    return {"summaries": list(daily_summaries.values())}

@api_router.get("/entries/summary/monthly")
async def get_monthly_summary(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    entries = await db.time_entries.find(
        {
            "user_id": current_user["id"],
            "start_time": {"$gte": start_of_month.isoformat()}
        },
        {"_id": 0}
    ).to_list(1000)
    
    # Group by day
    daily_summaries = {}
    for entry in entries:
        entry_date = datetime.fromisoformat(entry["start_time"]).date().isoformat()
        if entry_date not in daily_summaries:
            daily_summaries[entry_date] = {"date": entry_date, "total_duration": 0, "entries_count": 0}
        
        if not entry.get("is_running"):
            daily_summaries[entry_date]["total_duration"] += entry.get("duration", 0)
            daily_summaries[entry_date]["entries_count"] += 1
    
    return {"summaries": list(daily_summaries.values())}

# ==================== Export Routes ====================

@api_router.get("/export/csv")
async def export_csv(current_user: dict = Depends(get_current_user)):
    entries = await db.time_entries.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Task Name", "Description", "Start Time", "End Time", "Duration (hours)", "Tags"])
    
    for entry in entries:
        duration_hours = round(entry.get("duration", 0) / 3600, 2)
        writer.writerow([
            entry["task_name"],
            entry.get("description", ""),
            entry["start_time"],
            entry.get("end_time", "Running"),
            duration_hours,
            ", ".join(entry.get("tags", []))
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=time_entries.csv"}
    )

# ==================== Admin Routes ====================

@api_router.get("/admin/users", response_model=List[AdminUserStats])
async def get_all_users(current_user: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    stats = []
    for user in users:
        entries = await db.time_entries.find({"user_id": user["id"]}, {"_id": 0}).to_list(10000)
        total_duration = sum(e.get("duration", 0) for e in entries if not e.get("is_running"))
        last_entry = await db.time_entries.find_one(
            {"user_id": user["id"]},
            {"_id": 0},
            sort=[("created_at", -1)]
        )
        
        stats.append(AdminUserStats(
            user=User(**{**user, "created_at": datetime.fromisoformat(user["created_at"])}),
            total_entries=len(entries),
            total_duration=total_duration,
            last_activity=datetime.fromisoformat(last_entry["created_at"]) if last_entry else None
        ))
    
    return stats

@api_router.get("/admin/reports")
async def get_admin_reports(current_user: dict = Depends(get_admin_user)):
    # Get all entries
    all_entries = await db.time_entries.find({}, {"_id": 0}).to_list(10000)
    
    total_duration = sum(e.get("duration", 0) for e in all_entries if not e.get("is_running"))
    total_users = await db.users.count_documents({})
    
    return {
        "total_entries": len(all_entries),
        "total_duration": total_duration,
        "total_users": total_users,
        "average_duration_per_entry": total_duration / len(all_entries) if all_entries else 0
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()