from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    username: str
    full_name: str
    hashed_password: str
    role: UserRole = UserRole.USER
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    role: UserRole
    created_at: datetime
    is_active: bool

class Token(BaseModel):
    access_token: str
    token_type: str

class HealthLog(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    
    # Sleep data
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[int] = Field(None, ge=1, le=10)
    
    # Physical activity
    steps: Optional[int] = None
    heart_rate_avg: Optional[int] = None
    heart_rate_max: Optional[int] = None
    
    # Nutrition
    water_intake_liters: Optional[float] = None
    calories_consumed: Optional[int] = None
    
    # Symptoms
    symptoms: List[str] = []
    pain_level: Optional[int] = Field(None, ge=1, le=10)
    
    # Mood and energy
    mood: Optional[int] = Field(None, ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    
    # Lifestyle
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    exercise_minutes: Optional[int] = None
    
    # Notes
    notes: Optional[str] = None

class HealthLogCreate(BaseModel):
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[int] = Field(None, ge=1, le=10)
    steps: Optional[int] = None
    heart_rate_avg: Optional[int] = None
    heart_rate_max: Optional[int] = None
    water_intake_liters: Optional[float] = None
    calories_consumed: Optional[int] = None
    symptoms: List[str] = []
    pain_level: Optional[int] = Field(None, ge=1, le=10)
    mood: Optional[int] = Field(None, ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    exercise_minutes: Optional[int] = None
    notes: Optional[str] = None

class AIInsight(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    insight_type: str  # "daily_summary", "trend_analysis", "recommendation"
    content: str
    confidence_score: Optional[float] = Field(None, ge=0, le=1)
    related_data: Dict[str, Any] = {}

class AnalyticsData(BaseModel):
    user_id: str
    date_range: Dict[str, datetime]
    metrics: Dict[str, Any]
    trends: Dict[str, Any]
    anomalies: List[Dict[str, Any]] = []
