from schema.state import TravelPlanState, CandidateItinerary, ItineraryDay


def optimization_agent(state: TravelPlanState):
    print("--- Optimization Agent Running ---")
    transports = state.get("transportation_options", [])
    accommodations = state.get("accommodation_options", [])
    activities = state.get("activity_options", [])
    prefs = state.get("preferences")

    candidates = []
    disruptions = state.get("external_disruptions", [])
    messages = state.get("messages", [])
    is_reoptimizing = len(disruptions) > 0 and "Emergency Re-optimization complete." not in messages

    if transports and accommodations and prefs:
        day1 = ItineraryDay(
            date=prefs.start_date or "2024-07-01",
            location=prefs.destinations[0] if prefs.destinations else "Unknown",
            accommodation=accommodations[0],
            activities=activities[:2] if not is_reoptimizing else activities[1:3], # Swap activities on emergency
            transportation=transports,
        )
        
        base_cost = transports[0].cost + accommodations[0].cost_per_night + sum(a.cost for a in day1.activities)
        
        if is_reoptimizing:
            print(f"Re-optimizing itinerary due to: {disruptions[-1]}")
            itinerary = CandidateItinerary(
                id="opt-emergency-1",
                days=[day1],
                total_cost=base_cost * 1.1, # Emergency changes often cost a bit more
                score=82.0, # Lower score due to sub-optimal alternatives
            )
            msg = "Emergency Re-optimization complete."
        else:
            itinerary = CandidateItinerary(
                id="opt-1",
                days=[day1],
                total_cost=base_cost,
                score=95.0,
            )
            msg = "Optimization complete."
            
        candidates.append(itinerary)

    return {
        "candidate_itineraries": candidates,
        "optimal_itinerary": candidates[0] if candidates else None,
        "messages": [msg],
    }
