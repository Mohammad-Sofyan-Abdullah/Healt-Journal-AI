from groq import Groq
import os
from dotenv import load_dotenv
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.models import HealthLog, AIInsight
from app.database import health_logs_collection
import json

load_dotenv()

class AIService:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    
    async def analyze_health_data(self, user_id: str, recent_logs: List[HealthLog]) -> AIInsight:
        """Analyze recent health data and provide insights"""
        
        # Prepare data for analysis
        analysis_data = self._prepare_analysis_data(recent_logs)
        
        prompt = self._create_analysis_prompt(analysis_data)
        
        try:
            print("\n=== AI Analysis Request ===")
            print("Analyzing health data for the past days...")
            
            response = self.client.chat.completions.create(
                model="openai/gpt-oss-20b",  # Updated to use a valid Groq model
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful health assistant. Analyze the provided health data and give personalized insights, recommendations, and explanations. Be encouraging and practical in your advice."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            insight_content = response.choices[0].message.content
            
            print("\n=== AI Analysis Response ===")
            print(insight_content)
            print("\n=== End of AI Analysis ===\n")
            
            # Create insight record
            insight = AIInsight(
                user_id=user_id,
                insight_type="daily_analysis",
                content=insight_content,
                confidence_score=0.8,
                related_data=analysis_data
            )
            
            return insight
            
        except Exception as e:
            print("\n=== AI Service Error ===")
            print(f"Error type: {type(e).__name__}")
            print(f"Error message: {str(e)}")
            import traceback
            print(f"Traceback:\n{traceback.format_exc()}")
            print("========================\n")
            
            # Fallback insight if AI service fails
            return AIInsight(
                user_id=user_id,
                insight_type="daily_analysis",
                content="I'm having trouble analyzing your data right now. Please try again later.",
                confidence_score=0.0,
                related_data=analysis_data
            )
    
    def _prepare_analysis_data(self, logs: List[HealthLog]) -> Dict[str, Any]:
        """Prepare health data for AI analysis"""
        if not logs:
            return {"message": "No recent health data available"}
        
        # Calculate averages and trends
        recent_logs = sorted(logs, key=lambda x: x.date, reverse=True)[:7]  # Last 7 days
        
        data = {
            "total_logs": len(recent_logs),
            "date_range": {
                "start": recent_logs[-1].date.isoformat() if recent_logs else None,
                "end": recent_logs[0].date.isoformat() if recent_logs else None
            },
            "averages": self._calculate_averages(recent_logs),
            "trends": self._identify_trends(recent_logs),
            "symptoms": self._extract_symptoms(recent_logs),
            "recent_entries": [
                {
                    "date": log.date.isoformat(),
                    "sleep_hours": log.sleep_hours,
                    "steps": log.steps,
                    "mood": log.mood,
                    "energy_level": log.energy_level,
                    "symptoms": log.symptoms,
                    "notes": log.notes
                }
                for log in recent_logs[:3]  # Last 3 entries
            ]
        }
        
        return data
    
    def _calculate_averages(self, logs: List[HealthLog]) -> Dict[str, float]:
        """Calculate average values from health logs"""
        averages = {}
        
        # Sleep
        sleep_hours = [log.sleep_hours for log in logs if log.sleep_hours is not None]
        if sleep_hours:
            averages["sleep_hours"] = sum(sleep_hours) / len(sleep_hours)
        
        # Steps
        steps = [log.steps for log in logs if log.steps is not None]
        if steps:
            averages["steps"] = sum(steps) / len(steps)
        
        # Mood
        mood = [log.mood for log in logs if log.mood is not None]
        if mood:
            averages["mood"] = sum(mood) / len(mood)
        
        # Energy
        energy = [log.energy_level for log in logs if log.energy_level is not None]
        if energy:
            averages["energy_level"] = sum(energy) / len(energy)
        
        # Water intake
        water = [log.water_intake_liters for log in logs if log.water_intake_liters is not None]
        if water:
            averages["water_intake_liters"] = sum(water) / len(water)
        
        return averages
    
    def _identify_trends(self, logs: List[HealthLog]) -> Dict[str, str]:
        """Identify trends in health data"""
        trends = {}
        
        if len(logs) < 2:
            return trends
        
        # Sort by date
        sorted_logs = sorted(logs, key=lambda x: x.date)
        
        # Sleep trend
        sleep_data = [(log.date, log.sleep_hours) for log in sorted_logs if log.sleep_hours is not None]
        if len(sleep_data) >= 2:
            first_sleep = sleep_data[0][1]
            last_sleep = sleep_data[-1][1]
            if last_sleep > first_sleep + 0.5:
                trends["sleep"] = "improving"
            elif last_sleep < first_sleep - 0.5:
                trends["sleep"] = "declining"
            else:
                trends["sleep"] = "stable"
        
        # Mood trend
        mood_data = [(log.date, log.mood) for log in sorted_logs if log.mood is not None]
        if len(mood_data) >= 2:
            first_mood = mood_data[0][1]
            last_mood = mood_data[-1][1]
            if last_mood > first_mood + 0.5:
                trends["mood"] = "improving"
            elif last_mood < first_mood - 0.5:
                trends["mood"] = "declining"
            else:
                trends["mood"] = "stable"
        
        return trends
    
    def _extract_symptoms(self, logs: List[HealthLog]) -> List[str]:
        """Extract and count symptoms from logs"""
        all_symptoms = []
        for log in logs:
            all_symptoms.extend(log.symptoms)
        
        # Count frequency
        symptom_count = {}
        for symptom in all_symptoms:
            symptom_count[symptom] = symptom_count.get(symptom, 0) + 1
        
        # Return most frequent symptoms
        return sorted(symptom_count.items(), key=lambda x: x[1], reverse=True)[:5]
    
    def _create_analysis_prompt(self, data: Dict[str, Any]) -> str:
        """Create a prompt for AI analysis"""
        print("\n=== Health Data Being Analyzed ===")
        print(f"Total Entries: {data.get('total_logs', 0)}")
        print(f"Date Range: {data.get('date_range', {})}")
        print(f"Averages: {json.dumps(data.get('averages', {}), indent=2)}")
        print(f"Trends: {json.dumps(data.get('trends', {}), indent=2)}")
        print("================================\n")
        
        prompt = f"""
        Please analyze the following health data and provide personalized insights:

        Data Summary:
        - Total entries: {data.get('total_logs', 0)}
        - Date range: {data.get('date_range', {})}
        
        Averages:
        {json.dumps(data.get('averages', {}), indent=2)}
        
        Trends:
        {json.dumps(data.get('trends', {}), indent=2)}
        
        Recent Symptoms:
        {data.get('symptoms', [])}
        
        Recent Entries:
        {json.dumps(data.get('recent_entries', []), indent=2)}

        Please provide:
        1. A brief summary of the user's health patterns
        2. Any concerning trends or patterns
        3. Specific recommendations for improvement
        4. Encouragement and positive observations
        5. Any correlations you notice between different health metrics

        Keep your response practical, encouraging, and easy to understand.
        """
        
        return prompt
    
    async def generate_reminder(self, user_id: str, health_data: Dict[str, Any]) -> str:
        """Generate personalized health reminders"""
        prompt = f"""
        Based on this health data, generate a friendly reminder or tip:
        
        {json.dumps(health_data, indent=2)}
        
        Provide a short, encouraging reminder (1-2 sentences) about maintaining good health habits.
        """
        
        try:
            response = self.client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a friendly health assistant. Generate short, encouraging health reminders."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.8,
                max_tokens=200
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return "Remember to take care of your health today! 💪"
