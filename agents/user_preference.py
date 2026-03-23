import json
import os
import urllib.request
from schema.state import TravelPlanState, UserPreferences
from memory import load_user_profile

def parse_env():
    env_file = ".env"
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ[k.strip()] = v.strip()


def user_preference_agent(state: TravelPlanState):
    print("--- User Preference Agent Running ---")
    query = state.get("user_query", "")
    print(f"Analyzing Query: '{query}'")

    parse_env()
    api_key = os.getenv("GROQ_API_KEY")
    
    # Load long-term memory
    user_memory = load_user_profile("default")

    if not api_key or api_key == "your_groq_api_key_here":
        print(
            "WARNING: GROQ_API_KEY not set in environment (.env). Using mock data."
        )
        preferences = UserPreferences(
            budget=2500.0,
            destinations=["Paris"],
            interests=["Art", "Food"],
        )
        return {
            "preferences": preferences,
            "messages": ["Mocked user preferences (No API Key)."],
        }

    try:
        system_prompt = f"""
        You are an expert travel planner agent. 
        Extract the following information from the user's travel query and return it strictly as a JSON object:
        - budget (float, default 0.0)
        - destinations (list of strings)
        - start_date (string YYYY-MM-DD or null)
        - end_date (string YYYY-MM-DD or null)
        - interests (list of strings)
        - hard_constraints (list of strings, e.g., "must be under budget", "need wheelchair access")
        - soft_constraints (list of strings, e.g., "prefers to avoid red-eye flights", "likes window seats")
        - commonsense_constraints (list of strings, e.g., "cannot be in two places at once", "needs 8 hours of sleep")
        - emotion_state (string, infer the user's vibe: e.g., "Stressed", "Excited", "Relaxing")
        
        CRITICAL LONG-TERM MEMORY: Ensure you respect the user's historical preferences and constraints!
        Memory Context: {json.dumps(user_memory)}
        
        Always return valid JSON ONLY.
        """

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }
        data = {
            "model": "llama3-8b-8192",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
            "response_format": {"type": "json_object"},
        }

        req = urllib.request.Request(
            url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST"
        )
        with urllib.request.urlopen(req) as response:
            response_data = json.loads(response.read().decode())

        response_content = response_data["choices"][0]["message"]["content"]
        parsed_data = json.loads(response_content)

        preferences = UserPreferences(
            budget=float(parsed_data.get("budget", 0.0)),
            destinations=parsed_data.get("destinations", []),
            start_date=parsed_data.get("start_date"),
            end_date=parsed_data.get("end_date"),
            interests=parsed_data.get("interests", []),
            hard_constraints=parsed_data.get("hard_constraints", []),
            soft_constraints=parsed_data.get("soft_constraints", []),
            commonsense_constraints=parsed_data.get("commonsense_constraints", []),
            emotion_state=parsed_data.get("emotion_state", "Neutral"),
        )
        msg = f"Extracted preferences via LLM: {parsed_data}"
        return {"preferences": preferences, "messages": [msg]}

    except Exception as e:
        print(f"Error calling Groq API: {e}")
        # Fallback to empty mock so it doesn't crash entirely in tests
        preferences = UserPreferences(budget=0.0, destinations=["Unknown"])
        return {
            "preferences": preferences,
            "messages": [f"Error extracting preferences: {e}"],
        }
