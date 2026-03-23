import ssl
import sys
from coordinator import create_coordinator_graph

# Fix Windows Unicode printing errors
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Fix for standard Windows Python SSL Certificate Verify errors with urllib
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

def main():
    print("Welcome to the Autonomous Multi-Agent Travel Planning System")

    # Create the graph
    app = create_coordinator_graph()

    # Initialize state with a mock user query
    user_query = "I have 10000 rupees and i am planning on going to kerala for 6 days, I am very adventorous and outdoors person give me a plan accordingly"

    initial_state = {
        "user_query": user_query,
        "preferences": None,
        "transportation_options": [],
        "accommodation_options": [],
        "weather_conditions": [],
        "activity_options": [],
        "candidate_itineraries": [],
        "optimal_itinerary": None,
        "messages": [f"System initialized with query: {user_query}"],
        "errors": [],
    }

    config = {"configurable": {"thread_id": "session_1"}}

    print("\n[Coordinator] Beginning Multi-Agent execution flow...")
    print("=" * 60)

    for event in app.stream(initial_state, config):
        for agent_name, agent_state in event.items():
            print(f"[{agent_name.upper()} Agent Update]:")
            if "messages" in agent_state and agent_state["messages"]:
                print(f"  Log: {agent_state['messages'][-1]}")
            if "optimal_itinerary" in agent_state and agent_state["optimal_itinerary"]:
                itinerary = agent_state["optimal_itinerary"]
                print(
                    f"  *** NEW OPTIMAL ITINERARY FOUND ***: Score {itinerary.score}, Cost ${itinerary.total_cost}"
                )
            print("-" * 60)

    print("\n[Coordinator] Execution Complete.")

    # Extract final state to display
    final_state = app.get_state(config).values
    final_itinerary = final_state.get("optimal_itinerary")

    if final_itinerary:
        print("\n================ FINAL TRAVEL ITINERARY ================")
        print(f"Total Cost: ${final_itinerary.total_cost:.2f}")
        print(f"Score Iteration: {final_itinerary.score}")
        for day in final_itinerary.days:
            print(f"\nDay Date: {day.date} | Location: {day.location}")
            if day.accommodation:
                print(
                    f"  Hotel: {day.accommodation.name} (${day.accommodation.cost_per_night}/night)"
                )
            if day.transportation:
                print(f"  Transport: {len(day.transportation)} option(s) booked.")
            print("  Activities Required/Recommended:")
            for act in day.activities:
                print(
                    f"   - {act.name} (${act.cost}) (Duration: {act.duration_hours}h)"
                )
        print("==========================================================")


if __name__ == "__main__":
    main()
