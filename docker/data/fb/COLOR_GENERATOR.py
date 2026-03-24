import random
import time
from datetime import datetime


class COLOR_GENERATOR:
    def __init__(self):
        pass

    def schedule(self, event_name, event_value, colors, delay, sensor_ids):
        sensor_ids = eval(sensor_ids)
        assert isinstance(sensor_ids, list)

        colors = eval(colors)
        assert isinstance(colors, list)

        delay = float(delay)

        if event_name == "INIT":
            return [event_value, None, ""]

        elif event_name == "READ":
            color = random.choice(colors)

            assert len(list(color)) == 3 and len(color) == len(sensor_ids)

            samples = []
            for sensor_id, color_channel in zip(sensor_ids, color):

                curr_time = f'{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}'
                samples.append((curr_time, color_channel, False, sensor_id))

            time.sleep(delay)

            return [None, event_value, str(samples)[1:-1]]
