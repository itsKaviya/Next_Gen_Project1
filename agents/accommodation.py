import json
import os
import urllib.request
import urllib.parse
import uuid
from schema.state import TravelPlanState, AccommodationOption

def accommodation_agent(state: TravelPlanState):
    print("--- Accommodation Agent Running ---")
    prefs = state.get("preferences")
    options = []

    api_key = os.getenv("SERPAPI_API_KEY")
    fallback = False

    if prefs and prefs.destinations:
        dest = prefs.destinations[0]

        if not api_key or api_key == "your_serpapi_api_key_here":
            print("WARNING: SerpApi API key missing. Using mock hotel data.")
            fallback = True
        else:
            try:
                check_in = prefs.start_date or "2026-05-01"
                check_out = prefs.end_date or "2026-05-05"
                q = urllib.parse.quote(dest)

                url = f"https://serpapi.com/search.json?engine=google_hotels&q={q}&check_in_date={check_in}&check_out_date={check_out}&currency=USD&api_key={api_key}"
                req = urllib.request.Request(url)

                with urllib.request.urlopen(req) as response:
                    hotel_data = json.loads(response.read().decode())

                for h in hotel_data.get("properties", [])[:3]:
                    options.append(
                        AccommodationOption(
                            id=str(uuid.uuid4()),
                            name=h.get("name", "SerpApi Hotel"),
                            type="hotel",
                            location=dest,
                            cost_per_night=float(h.get("rate_per_night", {}).get("extracted_lowest", 150.0)),
                            rating=float(h.get("overall_rating", 4.0)),
                        )
                    )
            except Exception as e:
                print(f"SerpApi Hotel API Error: {e}")
                fallback = True

        if fallback:
            options.append(
                AccommodationOption(
                    id=str(uuid.uuid4()),
                    name=f"{dest} Grand Hotel (Mock)",
                    type="hotel",
                    location=f"Downtown {dest}",
                    cost_per_night=150.0,
                    rating=4.5,
                )
            )

    return {
        "accommodation_options": options,
        "messages": [f"Retrieved {len(options)} accommodation options."],
    }

