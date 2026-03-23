import random
from schema.state import TravelPlanState

def monitoring_agent(state: TravelPlanState):
    print("--- Real-Time Monitoring Agent Running ---")
    messages = state.get("messages", [])
    disruptions = state.get("external_disruptions", [])
    
    # Check if we already injected a disruption to avoid infinite loops
    has_checked = "Monitoring check complete." in messages
    
    if not has_checked:
        # 60% chance of an emergency / rush hour
        incidents = [
            "Severe Rush Hour Traffic detected on main transit route.",
            "Emergency: Primary activity venue closed abruptly.",
            "Weather Alert: Sudden harsh weather approaching.",
            None, None
        ]
        incident = random.choice(incidents)
        
        if incident:
            print(f"!!! EMERGENCY ALERT: {incident} !!!")
            disruptions.append(incident)
            return {
                "external_disruptions": disruptions, 
                "messages": [f"Detected incident: {incident}", "Monitoring check complete."]
            }
            
    print("All clear. No new disruptions detected.")
    return {"messages": ["Monitoring check complete. No new disruptions."]}
