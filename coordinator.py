from agents.user_preference import user_preference_agent
from agents.transportation import transportation_agent
from agents.accommodation import accommodation_agent
from agents.weather import weather_agent
from agents.activity import activity_agent
from agents.optimization import optimization_agent
from agents.monitoring import monitoring_agent
from agents.feedback import feedback_agent


class GraphEngine:
    def __init__(self):
        self.nodes = {}
        self.edges = {}
        self.conditional_edges = {}
        self.entry_point = None

    def add_node(self, name, func):
        self.nodes[name] = func

    def add_edge(self, source, target):
        if source not in self.edges:
            self.edges[source] = []
        self.edges[source].append(target)
        
    def add_conditional_edges(self, source, routing_func):
        self.conditional_edges[source] = routing_func

    def set_entry_point(self, name):
        self.entry_point = name

    def stream(self, state, config=None):
        current_node = self.entry_point

        while current_node and current_node != "END":
            func = self.nodes[current_node]
            updates = func(state)

            # Merge updates into state dict
            for k, v in updates.items():
                if isinstance(v, list) and k in state and isinstance(state[k], list):
                    state[k].extend(v)
                else:
                    state[k] = v

            yield {current_node: updates}

            if current_node in self.conditional_edges:
                current_node = self.conditional_edges[current_node](state)
            else:
                next_nodes = self.edges.get(current_node, ["END"])
                current_node = next_nodes[0]

        self.final_state = state

    def get_state(self, config=None):
        class StateWrapper:
            def __init__(self, val):
                self.values = val

        return StateWrapper(self.final_state)


def edge_monitoring_routing(state):
    disruptions = state.get("external_disruptions", [])
    messages = state.get("messages", [])
    if disruptions and "Emergency Re-optimization complete." not in messages:
        return "optimization"
    return "feedback"


def create_coordinator_graph():
    graph_builder = GraphEngine()

    graph_builder.add_node("user_preference", user_preference_agent)
    graph_builder.add_node("transportation", transportation_agent)
    graph_builder.add_node("accommodation", accommodation_agent)
    graph_builder.add_node("weather", weather_agent)
    graph_builder.add_node("activity", activity_agent)
    graph_builder.add_node("optimization", optimization_agent)
    graph_builder.add_node("monitoring", monitoring_agent)
    graph_builder.add_node("feedback", feedback_agent)

    graph_builder.set_entry_point("user_preference")

    graph_builder.add_edge("user_preference", "weather")
    graph_builder.add_edge("weather", "transportation")
    graph_builder.add_edge("transportation", "accommodation")
    graph_builder.add_edge("accommodation", "activity")
    graph_builder.add_edge("activity", "optimization")
    graph_builder.add_edge("optimization", "monitoring")
    graph_builder.add_conditional_edges("monitoring", edge_monitoring_routing)
    graph_builder.add_edge("feedback", "END")

    return graph_builder

