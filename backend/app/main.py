from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from datetime import timedelta
from typing import List, Optional
import os
from dotenv import load_dotenv

from app.auth import (
    create_user, authenticate_user, create_access_token, 
    get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.models import (
    User, UserCreate, UserLogin, Token, UserResponse,
    HealthLog, HealthLogCreate, AIInsight, AnalyticsData
)
from app.database import health_logs_collection, analytics_collection
from app.ai_service import AIService
from app.analytics import AnalyticsService
from bson import ObjectId
from datetime import datetime

load_dotenv()

app = FastAPI(
    title="AI-Powered Personal Health Journal",
    description="A platform for logging health data and receiving AI-driven insights",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Initialize services
ai_service = AIService()
analytics_service = AnalyticsService()

@app.get("/")
async def root():
    return {"message": "AI-Powered Personal Health Journal API"}

@app.get("/test-db")
async def test_db():
    """Test database connection"""
    try:
        # Try to ping the database
        from app.database import client
        await client.admin.command('ping')
        return {"status": "Database connection successful"}
    except Exception as e:
        print(f"Database connection error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection failed: {str(e)}"
        )

# Authentication routes
@app.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate):
    """Register a new user"""
    try:
        new_user = await create_user(user)
        return UserResponse(
            id=str(new_user.id),
            email=new_user.email,
            username=new_user.username,
            full_name=new_user.full_name,
            role=new_user.role,
            created_at=new_user.created_at,
            is_active=new_user.is_active
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {str(e)}")  # Add debug logging
        import traceback
        print(f"Traceback: {traceback.format_exc()}")  # Print full traceback
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@app.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Login user and return access token"""
    user = await authenticate_user(user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        role=current_user.role,
        created_at=current_user.created_at,
        is_active=current_user.is_active
    )

# Health logs routes
@app.post("/health-logs", response_model=HealthLog)
async def create_health_log(
    health_log: HealthLogCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new health log entry"""
    log_data = {
        "user_id": str(current_user.id),
        "date": datetime.utcnow(),
        **health_log.dict()
    }
    
    result = await health_logs_collection.insert_one(log_data)
    log_data["_id"] = str(result.inserted_id)
    
    return HealthLog(**log_data)

@app.get("/health-logs", response_model=List[HealthLog])
async def get_health_logs(
    limit: int = 30,
    skip: int = 0,
    current_user: User = Depends(get_current_active_user)
):
    """Get user's health logs"""
    cursor = health_logs_collection.find(
        {"user_id": str(current_user.id)}
    ).sort("date", -1).skip(skip).limit(limit)
    
    logs = []
    async for log in cursor:
        log["_id"] = str(log["_id"])
        logs.append(HealthLog(**log))
    
    return logs

@app.get("/health-logs/{log_id}", response_model=HealthLog)
async def get_health_log(
    log_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific health log"""
    log = await health_logs_collection.find_one({
        "_id": ObjectId(log_id),
        "user_id": str(current_user.id)
    })
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health log not found"
        )
    
    log["_id"] = str(log["_id"])
    return HealthLog(**log)

@app.put("/health-logs/{log_id}", response_model=HealthLog)
async def update_health_log(
    log_id: str,
    health_log: HealthLogCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a health log entry"""
    result = await health_logs_collection.update_one(
        {"_id": ObjectId(log_id), "user_id": str(current_user.id)},
        {"$set": health_log.dict()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health log not found"
        )
    
    # Return updated log
    updated_log = await health_logs_collection.find_one({
        "_id": ObjectId(log_id),
        "user_id": str(current_user.id)
    })
    
    updated_log["_id"] = str(updated_log["_id"])
    return HealthLog(**updated_log)

@app.delete("/health-logs/{log_id}")
async def delete_health_log(
    log_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a health log entry"""
    result = await health_logs_collection.delete_one({
        "_id": ObjectId(log_id),
        "user_id": str(current_user.id)
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health log not found"
        )
    
    return {"message": "Health log deleted successfully"}

# AI insights routes
@app.post("/ai/analyze", response_model=AIInsight)
async def analyze_health_data(
    days: int = 7,
    current_user: User = Depends(get_current_active_user)
):
    """Get AI analysis of recent health data"""
    try:
        # Get recent health logs
        from datetime import timedelta
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        cursor = health_logs_collection.find({
            "user_id": str(current_user.id),
            "date": {"$gte": start_date, "$lte": end_date}
        }).sort("date", -1)
        
        logs = []
        async for log in cursor:
            log["_id"] = str(log["_id"])
            logs.append(HealthLog(**log))
        
        if not logs:
            return AIInsight(
                user_id=str(current_user.id),
                insight_type="daily_analysis",
                content="No health logs found for the specified period. Start logging your health data to receive AI insights!",
                confidence_score=1.0,
                related_data={"logs_found": 0}
            )
        
        # Generate AI insight
        insight = await ai_service.analyze_health_data(str(current_user.id), logs)
        
        # Save insight to database
        insight_data = insight.dict()
        result = await analytics_collection.insert_one(insight_data)
        insight_data["_id"] = str(result.inserted_id)
        
        return AIInsight(**insight_data)
    except Exception as e:
        print(f"Error in analyze_health_data: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze health data: {str(e)}"
        )

@app.get("/ai/insights", response_model=List[AIInsight])
async def get_ai_insights(
    limit: int = 10,
    current_user: User = Depends(get_current_active_user)
):
    """Get user's AI insights history"""
    cursor = analytics_collection.find({
        "user_id": str(current_user.id),
        "insight_type": {"$in": ["daily_analysis", "trend_analysis", "recommendation"]}
    }).sort("date", -1).limit(limit)
    
    insights = []
    async for insight in cursor:
        insight["_id"] = str(insight["_id"])
        insights.append(AIInsight(**insight))
    
    return insights

# Analytics routes
@app.get("/analytics", response_model=AnalyticsData)
async def get_analytics(
    days: int = 30,
    current_user: User = Depends(get_current_active_user)
):
    """Get comprehensive health analytics"""
    try:
        data = await analytics_service.get_user_analytics(str(current_user.id), days)
        return data
    except Exception as e:
        print(f"Analytics error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load analytics data: {str(e)}"
        )

@app.get("/analytics/chart/{metric}")
async def get_chart_data(
    metric: str,
    days: int = 30,
    current_user: User = Depends(get_current_active_user)
):
    """Get chart data for a specific metric"""
    try:
        valid_metrics = ['sleep_hours', 'steps', 'mood', 'energy_level', 
                        'water_intake_liters', 'heart_rate_avg', 'stress_level']
        if metric not in valid_metrics:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid metric. Must be one of: {', '.join(valid_metrics)}"
            )
        
        data = analytics_service.get_chart_data(str(current_user.id), metric, days)
        if not data['dates']:
            return {"dates": [], "values": [], "message": "No data available for the selected period"}
        return data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Chart data error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load chart data: {str(e)}"
        )

@app.get("/analytics/correlations")
async def get_correlations(
    days: int = 30,
    current_user: User = Depends(get_current_active_user)
):
    """Get correlations between health metrics"""
    try:
        data = analytics_service.get_correlation_matrix(str(current_user.id), days)
        return data
    except Exception as e:
        print(f"Correlation error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load correlations data: {str(e)}"
        )

# Dashboard summary route
@app.get("/dashboard/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_active_user)
):
    """Get dashboard summary with recent data and insights"""
    try:
        # Get recent health logs (last 7 days)
        from datetime import timedelta
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=7)
        
        # Get recent health logs
        cursor = health_logs_collection.find({
            "user_id": str(current_user.id),
            "date": {"$gte": start_date, "$lte": end_date}
        }).sort("date", -1).limit(7)
        
        recent_logs = []
        async for log in cursor:
            log["_id"] = str(log["_id"])
            recent_logs.append(HealthLog(**log))
        
        # Get latest AI insight
        latest_insight = await analytics_collection.find_one({
            "user_id": str(current_user.id),
            "insight_type": "daily_analysis"
        }, sort=[("date", -1)])

        if latest_insight:
            latest_insight["_id"] = str(latest_insight["_id"])
        
        # Calculate basic statistics
        stats = {
            "total_logs": len(recent_logs),
            "logging_streak": 0,  # Days in a row with logs
            "last_log_date": recent_logs[0].date if recent_logs else None,
        }
        
        # Calculate averages from recent logs
        averages = {}
        if recent_logs:
            sleep_hours = [log.sleep_hours for log in recent_logs if log.sleep_hours is not None]
            steps = [log.steps for log in recent_logs if log.steps is not None]
            mood = [log.mood for log in recent_logs if log.mood is not None]
            water = [log.water_intake_liters for log in recent_logs if log.water_intake_liters is not None]
            
            if sleep_hours:
                averages["sleep"] = float(sum(sleep_hours) / len(sleep_hours))
            if steps:
                averages["steps"] = float(sum(steps) / len(steps))
            if mood:
                averages["mood"] = float(sum(mood) / len(mood))
            if water:
                averages["water"] = float(sum(water) / len(water))
        
        # Calculate trends
        trends = {}
        if len(recent_logs) >= 2:
            first_log = recent_logs[-1]  # Oldest log
            last_log = recent_logs[0]   # Most recent log
            
            if first_log.sleep_hours and last_log.sleep_hours:
                trends["sleep"] = "improving" if last_log.sleep_hours > first_log.sleep_hours else "declining"
            if first_log.mood and last_log.mood:
                trends["mood"] = "improving" if last_log.mood > first_log.mood else "declining"
            if first_log.steps and last_log.steps:
                trends["steps"] = "improving" if last_log.steps > first_log.steps else "declining"
        
        return {
            "recent_logs": [log.dict() for log in recent_logs],
            "latest_insight": latest_insight,
            "stats": stats,
            "averages": averages,
            "trends": trends,
            "has_logs": len(recent_logs) > 0
        }
        
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load dashboard data: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
