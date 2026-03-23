import json
import os
import urllib.request
from schema.state import TravelPlanState
from memory import load_user_profile, save_user_profile

def feedback_agent(state: TravelPlanState):
    print("--- Feedback Learning Agent Running ---")
    feedback = state.get("user_feedback", "")
    if not feedback:
        return {"messages": ["No feedback provided this trip."]}
        
    print(f"Processing Feedback: '{feedback}'")
    api_key = os.getenv("GROQ_API_KEY")
    profile = load_user_profile("default")

    if not api_key or api_key == "your_groq_api_key_here":
        print("WARNING: GROQ_API_KEY missing. Cannot process feedback.")
        return {"messages": ["Feedback skipped due to missing API key."]}
        
    try:
        system_prompt = f"""
        Analyze the user's post-trip feedback: "{feedback}"
        Update their long-term travel memory. Return a JSON object with two lists of strings:
        - "new_preferences": what they liked and want more of.
        - "new_avoids": what they hated, complained about, or want to avoid forever.
        
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
                {"role": "system", "content": system_prompt}
            ],
            "response_format": {"type": "json_object"},
        }

        req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode())
            
        parsed = json.loads(res_data["choices"][0]["message"]["content"])
        
        # Update and save profile
        profile["preferences"].extend(parsed.get("new_preferences", []))
        profile["avoid"].extend(parsed.get("new_avoids", []))
        
        # Deduplicate
        profile["preferences"] = list(set(profile["preferences"]))
        profile["avoid"] = list(set(profile["avoid"]))
        
        save_user_profile(profile, "default")
        
        msg = f"Memory updated! Added {len(parsed.get('new_preferences', []))} likes and {len(parsed.get('new_avoids', []))} dislikes."
        print(f"  -> {msg}")
        return {"messages": [msg]}
        
    except Exception as e:
        print(f"Error processing feedback: {e}")
        return {"messages": [f"Feedback processing error: {e}"]}
