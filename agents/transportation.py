import json
import os
import urllib.request
import urllib.parse
import uuid
from schema.state import TravelPlanState, TransportationOption

def transportation_agent(state: TravelPlanState):
    print("--- Transportation Agent Running ---")
    prefs = state.get("preferences")
    options = []

    api_key = os.getenv("SERPAPI_API_KEY")
    fallback = False

    if prefs and prefs.destinations:
        dest = prefs.destinations[0]

        if not api_key or api_key == "your_serpapi_api_key_here":
            print("WARNING: SerpApi API key missing. Using mock flight data.")
            fallback = True
        else:
            try:
                dest_iata = "CDG" if "paris" in dest.lower() else "HND"
                origin_iata = "JFK"  # Assuming outbound is from NYC
                date = prefs.start_date or "2026-05-01"

                url = f"https://serpapi.com/search.json?engine=google_flights&departure_id={origin_iata}&arrival_id={dest_iata}&outbound_date={date}&currency=USD&hl=en&api_key={api_key}"
                req = urllib.request.Request(url)

                with urllib.request.urlopen(req) as response:
                    data = json.loads(response.read().decode())

                flights = data.get("best_flights", [])[:3]
                if not flights:
                    flights = data.get("other_flights", [])[:3]

                for f in flights:
                    price = float(f.get("price", 800.0))
                    # f["flights"][0] contains departure/arrival info
                    flight_details = f.get("flights", [{}])[0]
                    options.append(
                        TransportationOption(
                            id=str(uuid.uuid4()),
                            type="flight",
                            provider=flight_details.get("airline", "Google Flights API"),
                            cost=price,
                            departure_time=flight_details.get("departure_airport", {}).get("time", date),
                            arrival_time=flight_details.get("arrival_airport", {}).get("time", date),
                            from_location=origin_iata,
                            to_location=dest_iata,
                        )
                    )
            except Exception as e:
                print(f"SerpApi Google Flights Error: {e}")
                fallback = True

        if fallback:
            options.append(
                TransportationOption(
                    id=str(uuid.uuid4()),
                    type="flight",
                    provider="Global Airlines (Mock)",
                    cost=800.0,
                    departure_time="Current",
                    arrival_time="Current",
                    from_location="JFK",
                    to_location=dest,
                )
            )

    return {
        "transportation_options": options,
        "messages": [f"Retrieved {len(options)} transport options."],
    }

