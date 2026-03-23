from typing import List, Optional, Dict, Any, TypedDict
from dataclasses import dataclass, field


@dataclass
class UserPreferences:
    budget: float = 0.0
    destinations: List[str] = field(default_factory=list)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    interests: List[str] = field(default_factory=list)
    hard_constraints: List[str] = field(default_factory=list)
    soft_constraints: List[str] = field(default_factory=list)
    commonsense_constraints: List[str] = field(default_factory=list)
    emotion_state: str = "Neutral"


@dataclass
class TransportationOption:
    id: str
    type: str  # flight, train, bus
    provider: str
    cost: float
    departure_time: str
    arrival_time: str
    from_location: str
    to_location: str


@dataclass
class AccommodationOption:
    id: str
    name: str
    type: str
    location: str
    cost_per_night: float
    rating: float


@dataclass
class WeatherCondition:
    location: str
    date: str
    forecast: str
    temperature_current: float
    adverse_conditions: bool = False


@dataclass
class ActivityOption:
    id: str
    name: str
    location: str
    cost: float
    duration_hours: float
    type: str


@dataclass
class ItineraryDay:
    date: str
    location: str
    accommodation: Optional[AccommodationOption] = None
    activities: List[ActivityOption] = field(default_factory=list)
    transportation: List[TransportationOption] = field(default_factory=list)


@dataclass
class CandidateItinerary:
    id: str
    days: List[ItineraryDay] = field(default_factory=list)
    total_cost: float = 0.0
    score: float = 0.0


class TravelPlanState(TypedDict):
    user_query: str
    preferences: Optional[UserPreferences]
    transportation_options: List[TransportationOption]
    accommodation_options: List[AccommodationOption]
    weather_conditions: List[WeatherCondition]
    activity_options: List[ActivityOption]
    candidate_itineraries: List[CandidateItinerary]
    optimal_itinerary: Optional[CandidateItinerary]
    external_disruptions: List[str]
    messages: List[str]
    errors: List[str]
    user_feedback: str
