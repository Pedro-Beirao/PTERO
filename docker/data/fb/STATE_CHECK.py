class STATE_CHECK:

    def __init__(self):
        pass

    def schedule(self, event_name, event_value, curr_state, state):
        if event_name == "INIT":
            return [event_value, None, 0]

        elif event_name == "RUN":

            if str(curr_state).find(str(state)) != -1:
                return [None, event_value, 1]

            else:
                return [event_value, None, 0]
