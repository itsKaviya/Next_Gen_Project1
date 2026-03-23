import json
import os

MEMORY_DIR = "data"
MEMORY_FILE = os.path.join(MEMORY_DIR, "profiles.json")

def load_user_profile(user_id="default"):
    if not os.path.exists(MEMORY_FILE):
        return {"preferences": [], "avoid": [], "notes": ""}
    
    try:
        with open(MEMORY_FILE, "r") as f:
            profiles = json.load(f)
            return profiles.get(user_id, {"preferences": [], "avoid": [], "notes": ""})
    except json.JSONDecodeError:
        return {"preferences": [], "avoid": [], "notes": ""}

def save_user_profile(profile_data, user_id="default"):
    if not os.path.exists(MEMORY_DIR):
        os.makedirs(MEMORY_DIR)
        
    profiles = {}
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, "r") as f:
                profiles = json.load(f)
        except json.JSONDecodeError:
            pass
            
    profiles[user_id] = profile_data
    
    with open(MEMORY_FILE, "w") as f:
        json.dump(profiles, f, indent=4)
