class DATA_AGGREGATOR:

    def __init__(self):
        self.values_list = []

    def schedule(self, event_name, event_value, data_a, data_b, state):
        if event_name == "INIT":
            return [event_value, None, ""]

        if event_name == "RUN":
            #
            if int(state) == 1:
                return [None, event_value, f"{data_a}, {data_b}"]

            else:
                return [event_value, None, ""]
