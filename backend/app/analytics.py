import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from app.models import HealthLog, AnalyticsData
from app.database import get_sync_database
from bson import ObjectId
import json
from motor.motor_asyncio import AsyncIOMotorClient

from motor.motor_asyncio import AsyncIOMotorClient

class AnalyticsService:
    def __init__(self):
        self.db = get_sync_database()
        # Create async client
        self.async_client = AsyncIOMotorClient(os.getenv('MONGODB_URL', 'mongodb://localhost:27017'))
        self.async_db = self.async_client['health_journal']
    
    async def get_user_analytics(self, user_id: str, days: int = 30) -> AnalyticsData:
        """Generate comprehensive analytics for a user"""
        
        # Get health logs for the specified period
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        cursor = self.async_db.health_logs.find({
            "user_id": user_id,
            "date": {"$gte": start_date, "$lte": end_date}
        }).sort("date", 1)
        
        logs = []
        async for doc in cursor:
            logs.append(doc)
        
        if not logs:
            return AnalyticsData(
                user_id=user_id,
                date_range={"start": start_date, "end": end_date},
                metrics={},
                trends={},
                anomalies=[]
            )
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame(logs)
        df['date'] = pd.to_datetime(df['date'])
        
        # Calculate metrics
        metrics = self._calculate_metrics(df)
        
        # Identify trends
        trends = self._calculate_trends(df)
        
        # Detect anomalies
        anomalies = self._detect_anomalies(df)
        
        return AnalyticsData(
            user_id=user_id,
            date_range={"start": start_date, "end": end_date},
            metrics=metrics,
            trends=trends,
            anomalies=anomalies
        )
    
    def _calculate_metrics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate key health metrics"""
        metrics = {}
        
        # Sleep metrics
        if 'sleep_hours' in df.columns:
            sleep_data = df['sleep_hours'].dropna()
            if not sleep_data.empty:
                metrics['sleep'] = {
                    'average': float(round(sleep_data.mean(), 2)),
                    'min': float(round(sleep_data.min(), 2)),
                    'max': float(round(sleep_data.max(), 2)),
                    'std': float(round(sleep_data.std(), 2)),
                    'recommended_range': [7, 9]
                }
        
        # Steps metrics
        if 'steps' in df.columns:
            steps_data = df['steps'].dropna()
            if not steps_data.empty:
                # Convert numpy types to native Python types
                mean_val = steps_data.mean()
                min_val = steps_data.min()
                max_val = steps_data.max()
                std_val = steps_data.std()
                
                metrics['steps'] = {
                    'average': int(float(mean_val)) if not pd.isna(mean_val) else 0,
                    'min': int(float(min_val)) if not pd.isna(min_val) else 0,
                    'max': int(float(max_val)) if not pd.isna(max_val) else 0,
                    'std': int(float(std_val)) if not pd.isna(std_val) else 0,
                    'recommended_minimum': 10000
                }
        
        # Mood metrics
        if 'mood' in df.columns:
            mood_data = df['mood'].dropna()
            if not mood_data.empty:
                metrics['mood'] = {
                    'average': float(round(mood_data.mean(), 2)),
                    'min': int(mood_data.min()),
                    'max': int(mood_data.max()),
                    'std': float(round(mood_data.std(), 2)),
                    'scale': [1, 10]
                }
        
        # Energy metrics
        if 'energy_level' in df.columns:
            energy_data = df['energy_level'].dropna()
            if not energy_data.empty:
                metrics['energy'] = {
                    'average': float(round(energy_data.mean(), 2)),
                    'min': int(energy_data.min()),
                    'max': int(energy_data.max()),
                    'std': float(round(energy_data.std(), 2)),
                    'scale': [1, 10]
                }
        
        # Water intake metrics
        if 'water_intake_liters' in df.columns:
            water_data = df['water_intake_liters'].dropna()
            if not water_data.empty:
                metrics['water_intake'] = {
                    'average': float(round(water_data.mean(), 2)),
                    'min': float(round(water_data.min(), 2)),
                    'max': float(round(water_data.max(), 2)),
                    'std': float(round(water_data.std(), 2)),
                    'recommended_daily': 2.5
                }
        
        # Heart rate metrics
        if 'heart_rate_avg' in df.columns:
            hr_data = df['heart_rate_avg'].dropna()
            if not hr_data.empty:
                # Convert numpy types to native Python types
                mean_val = hr_data.mean()
                min_val = hr_data.min()
                max_val = hr_data.max()
                std_val = hr_data.std()
                
                metrics['heart_rate'] = {
                    'average': int(float(mean_val)) if not pd.isna(mean_val) else 0,
                    'min': int(float(min_val)) if not pd.isna(min_val) else 0,
                    'max': int(float(max_val)) if not pd.isna(max_val) else 0,
                    'std': int(float(std_val)) if not pd.isna(std_val) else 0,
                    'normal_range': [60, 100]
                }
        
        return metrics
    
    def _calculate_trends(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate trends over time"""
        trends = {}
        
        # Ensure data is sorted by date
        df = df.sort_values('date')
        
        # Sleep trend
        if 'sleep_hours' in df.columns:
            sleep_data = df['sleep_hours'].dropna()
            if len(sleep_data) >= 3:
                trend_slope = float(np.polyfit(range(len(sleep_data)), sleep_data, 1)[0])
                trends['sleep'] = {
                    'direction': 'improving' if trend_slope > 0.1 else 'declining' if trend_slope < -0.1 else 'stable',
                    'slope': float(round(trend_slope, 3)),
                    'change_per_week': float(round(trend_slope * 7, 2))
                }
        
        # Steps trend
        if 'steps' in df.columns:
            steps_data = df['steps'].dropna()
            if len(steps_data) >= 3:
                trend_slope = float(np.polyfit(range(len(steps_data)), steps_data, 1)[0])
                trends['steps'] = {
                    'direction': 'improving' if trend_slope > 50 else 'declining' if trend_slope < -50 else 'stable',
                    'slope': float(round(trend_slope, 1)),
                    'change_per_week': int(round(trend_slope * 7))
                }
        
        # Mood trend
        if 'mood' in df.columns:
            mood_data = df['mood'].dropna()
            if len(mood_data) >= 3:
                trend_slope = float(np.polyfit(range(len(mood_data)), mood_data, 1)[0])
                trends['mood'] = {
                    'direction': 'improving' if trend_slope > 0.1 else 'declining' if trend_slope < -0.1 else 'stable',
                    'slope': float(round(trend_slope, 3)),
                    'change_per_week': float(round(trend_slope * 7, 2))
                }
        
        return trends
    
    def _detect_anomalies(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect anomalies in health data"""
        anomalies = []
        
        # Sleep anomalies
        if 'sleep_hours' in df.columns:
            sleep_data = df['sleep_hours'].dropna()
            if not sleep_data.empty:
                mean_sleep = sleep_data.mean()
                std_sleep = sleep_data.std()
                
                for idx, row in df.iterrows():
                    if pd.notna(row['sleep_hours']):
                        z_score = abs((row['sleep_hours'] - mean_sleep) / std_sleep) if std_sleep > 0 else 0
                        if z_score > 2:  # 2 standard deviations
                            anomalies.append({
                                'date': row['date'].isoformat(),
                                'type': 'sleep_anomaly',
                                'value': float(row['sleep_hours']),
                                'severity': 'high' if z_score > 3 else 'medium',
                                'description': f"Unusual sleep duration: {row['sleep_hours']} hours"
                            })
        
        # Steps anomalies
        if 'steps' in df.columns:
            steps_data = df['steps'].dropna()
            if not steps_data.empty:
                mean_steps = steps_data.mean()
                std_steps = steps_data.std()
                
                for idx, row in df.iterrows():
                    if pd.notna(row['steps']):
                        z_score = abs((row['steps'] - mean_steps) / std_steps) if std_steps > 0 else 0
                        if z_score > 2:
                            anomalies.append({
                                'date': row['date'].isoformat(),
                                'type': 'steps_anomaly',
                                'value': int(row['steps']),
                                'severity': 'high' if z_score > 3 else 'medium',
                                'description': f"Unusual step count: {row['steps']} steps"
                            })
        
        # Mood anomalies (very low mood)
        if 'mood' in df.columns:
            for idx, row in df.iterrows():
                if pd.notna(row['mood']) and row['mood'] <= 3:
                    anomalies.append({
                        'date': row['date'].isoformat(),
                        'type': 'mood_anomaly',
                        'value': int(row['mood']),
                        'severity': 'high',
                        'description': f"Very low mood: {row['mood']}/10"
                    })
        
        return anomalies
    
    def get_chart_data(self, user_id: str, metric: str, days: int = 30) -> Dict[str, Any]:
        """Get data formatted for charting"""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        logs = list(self.db.health_logs.find({
            "user_id": user_id,
            "date": {"$gte": start_date, "$lte": end_date}
        }).sort("date", 1))
        
        if not logs:
            return {"dates": [], "values": []}
        
        df = pd.DataFrame(logs)
        df['date'] = pd.to_datetime(df['date'])
        
        if metric not in df.columns:
            return {"dates": [], "values": []}
        
        # Filter out null values
        data = df[['date', metric]].dropna()
        
        return {
            "dates": [d.isoformat() for d in data['date']],
            "values": [float(v) if isinstance(v, (np.integer, np.floating)) else v for v in data[metric].tolist()]
        }
    
    def get_correlation_matrix(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Calculate correlations between different health metrics"""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        logs = list(self.db.health_logs.find({
            "user_id": user_id,
            "date": {"$gte": start_date, "$lte": end_date}
        }).sort("date", 1))
        
        if not logs:
            return {}
        
        df = pd.DataFrame(logs)
        
        # Select numeric columns for correlation
        numeric_columns = ['sleep_hours', 'steps', 'mood', 'energy_level', 
                          'water_intake_liters', 'heart_rate_avg', 'stress_level']
        
        available_columns = [col for col in numeric_columns if col in df.columns]
        
        if len(available_columns) < 2:
            return {}
        
        correlation_matrix = df[available_columns].corr()
        
        # Convert to dictionary format
        correlations = {}
        for i, col1 in enumerate(available_columns):
            correlations[col1] = {}
            for j, col2 in enumerate(available_columns):
                if i != j:
                    correlations[col1][col2] = float(round(correlation_matrix.loc[col1, col2], 3))
        
        return correlations
