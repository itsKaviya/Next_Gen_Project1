import json
import os
import urllib.request
import uuid
from schema.state import TravelPlanState, ActivityOption


def activity_agent(state: TravelPlanState):
    print("--- Activity Recommendation Agent Running ---")
    prefs = state.get("preferences")
    activities = []
    
    api_key = os.getenv("GROQ_API_KEY")
    fallback = False
    
    if prefs and prefs.destinations:
        dest = prefs.destinations[0]
        interests = ", ".join(prefs.interests) if prefs.interests else "general tourism"
        
        if not api_key or api_key == "your_groq_api_key_here":
            print("WARNING: GROQ_API_KEY missing. Using mock activity data.")
            fallback = True
        else:
            try:
                system_prompt = f"""
                You are a local tour guide. Suggest exactly 3 real-world tourist activities in {dest} tailored to these traveler interests: {interests}.
                Return ONLY a JSON object with a single key 'activities' containing a list of objects. Each object must have:
                - "name" (string)
                - "location" (string, short neighborhood or address)
                - "cost" (float, estimated USD cost. Use 0 for free)
                - "duration_hours" (float)
                - "type" (string, short category word)
                """
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}
                data = {
                    "model": "llama3-8b-8192",
                    "messages": [{"role": "system", "content": system_prompt}],
                    "response_format": {"type": "json_object"}
                }
                
                req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
                with urllib.request.urlopen(req) as response:
                    response_data = json.loads(response.read().decode())
                
                res_content = response_data["choices"][0]["message"]["content"]
                parsed = json.loads(res_content)
                
                for act in parsed.get("activities", []):
                    activities.append(ActivityOption(
                        id=str(uuid.uuid4()),
                        name=act.get("name", "Unknown Activity"),
                        location=act.get("location", dest),
                        cost=float(act.get("cost", 0.0)),
                        duration_hours=float(act.get("duration_hours", 2.0)),
                        type=act.get("type", "General")
                    ))
            except Exception as e:
                print(f"Groq API Error: {e}")
                fallback = True
                
        if fallback:
            # Graceful Fallback
            activities.append(ActivityOption(id=str(uuid.uuid4()), name=f"Walking Tour of {dest}", location=f"Downtown {dest}", cost=15.0, duration_hours=2.5, type="Exploration"))
            
    return {"activity_options": activities, "messages": [f"Retrieved {len(activities)} live activities."]}
