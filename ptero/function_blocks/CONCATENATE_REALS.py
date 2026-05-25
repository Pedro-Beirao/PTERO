
class CONCATENATE_REALS:

    def schedule(self, event_name, event_value, value1, value2):
        if event_name == 'INIT':
            return [event_value, None, 0]

        elif event_name == 'RUN':
            output = str(value1) + ';' + str(value2)
            return [None, event_value, output]
