import time
from datetime import datetime
from typing import List, Optional, Tuple, Union

import numpy as np
from scipy.stats import bernoulli


class MACHINE_SIMULATOR:

    def __init__(self):
        self.state = "IDLE"
        self.ttf = 0  # time to failure
        self.tts = 0  # time to start
        self.ttr = 0  # time to repair

    def schedule(
        self,
        event_name: Union[str, None] = None,
        event_value: Optional[Union[str, None]] = None,
        params_data: Optional[Union[List[Tuple[float]], None]] = None,
        ratio: Optional[Union[float, None]] = None,
        params_mtbf: Optional[Union[Tuple[float], None]] = None,
        params_mtts: Optional[Union[Tuple[float], None]] = None,
        params_mttr: Optional[Union[Tuple[float], None]] = None,
        delay: Optional[Union[float, None]] = None
    ):
        params_data = eval(params_data)
        assert isinstance(params_data, list)

        params_mtbf = eval(params_mtbf)
        assert isinstance(params_mtbf, tuple)

        params_mtts = eval(params_mtts)
        assert isinstance(params_mtts, tuple)

        params_mttr = eval(params_mttr)
        assert isinstance(params_mttr, tuple)

        ratio = float(ratio)
        delay = float(delay)

        if event_name == "INIT":
            self.state = "IDLE"

            self.ttf = self.generate_time(params_mtbf)
            return [event_value, None, "", self.state]

        elif event_name == "READ":
            if self.state == "IDLE":
                return [None, None, "", self.state]

            elif self.state == "WORK":
                time.sleep(delay)
                self.ttf -= delay  # time to failure

                if self.ttf <= 0:
                    self.state = "BREAK"

                    self.tts = self.generate_time(params_mtts)
                    return [None, event_value, "", self.state]

                else:
                    data = self.generate_data(params_data, ratio)
                    print(data)
                    return [None, event_value, data, self.state]

            elif self.state == "BREAK":
                time.sleep(delay)

                self.tts -= delay  # time to repair

                if self.tts <= 0:
                    self.state = "REPAIR"

                    self.ttr = self.generate_time(params_mttr)
                    return [None, event_value, "", self.state]

                else:
                    return [None, event_value, "", self.state]

            elif self.state == "REPAIR":
                time.sleep(delay)

                self.ttr -= delay  # time to repair

                if self.ttr <= 0:
                    self.ttf = self.generate_time(params_mtbf)
                    self.state = "WORK"
                    return [None, event_value, "", self.state]

                else:
                    return [None, event_value, "", self.state]

        elif event_name == "ON-OFF":

            if self.state == "IDLE":
                self.state = "WORK"
                return [None, event_value, "", self.state]

            elif self.state == "WORK":
                self.state = "IDLE"
                return [None, None, "", self.state]

            else:
                return [None, None, "", self.state]

    @staticmethod
    def generate_data(params, ratio):
        samples = []
        for norm_param, anom_param in params:
            anom = bernoulli.rvs(ratio)

            mu, std = norm_param if anom == 0 else anom_param
            value = round(np.random.normal(mu, std), 3)

            samples.append(value)

        data_str = ",".join(["{0}".format(x) for x in samples])
        return data_str

    @staticmethod
    def generate_time(params):
        t = round(np.random.normal(params[0], params[1]))
        print("generated time:", t)
        return t
