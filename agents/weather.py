import json
import urllib.request
import urllib.parse
from schema.state import TravelPlanState, WeatherCondition


def get_coordinates(city_name):
    """Hits the free Open-Meteo Geocoding API to resolve city strings to Lat/Lon."""
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(city_name)}&count=1&language=en&format=json"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
        if "results" in data and len(data["results"]) > 0:
            return data["results"][0]["latitude"], data["results"][0]["longitude"]
    except Exception as e:
        print(f"Geocoding Error: {e}")
    return None, None


def weather_agent(state: TravelPlanState):
    print("--- Weather Monitoring Agent Running ---")
    prefs = state.get("preferences")
    conditions = []
    msg = "No destinations to check weather for."

    if prefs and prefs.destinations:
        dest = prefs.destinations[0]
        lat, lon = get_coordinates(dest)
        
        if lat is not None and lon is not None:
            # Hit the free Open-Meteo Forecast API
            weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code&forecast_days=1"
            req = urllib.request.Request(weather_url)
            try:
                with urllib.request.urlopen(req) as response:
                    wdata = json.loads(response.read().decode())
                
                temp = wdata["current"]["temperature_2m"]
                code = wdata["current"]["weather_code"]
                # WMO Weather codes indicating adverse weather (e.g. rain, snow, storms)
                adverse = code in [61, 63, 65, 71, 73, 75, 80, 81, 82, 95, 96, 99]
                
                # Convert WMO code to human readable (simplified)
                forecast_desc = "Rain/Storm" if adverse else "Clear/Cloudy"
                
                conditions.append(
                    WeatherCondition(
                        location=dest,
                        date=prefs.start_date or "Current",
                        forecast=forecast_desc,
                        temperature_current=temp,
                        adverse_conditions=adverse
                    )
                )
                msg = f"Retrieved live Open-Meteo weather for {dest}: {temp}°C, {forecast_desc}"
            except Exception as e:
                print(f"Weather API Error: {e}")
                conditions.append(WeatherCondition(location=dest, date="Unknown", forecast="Sunny", temperature_current=20.0, adverse_conditions=False))
                msg = "Mock weather used due to API execution error."
        else:
            print("Failed to geocode destination.")
            conditions.append(WeatherCondition(location=dest, date="Unknown", forecast="Sunny", temperature_current=20.0, adverse_conditions=False))
            msg = "Mock weather used due to Geocoding failure."

    return {"weather_conditions": conditions, "messages": [msg]}
