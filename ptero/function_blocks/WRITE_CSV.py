import numpy as np
import re
import os
import csv

class WRITE_CSV:

    def __init__(self):
        self.path = ""
        self.data = ""
        self.status = ""


    def schedule(self, event_input_name, event_input_value, data, path, name):

        if event_input_name == 'INIT':
            return [event_input_value, None, []]

        elif event_input_name == 'RUN':

            if path is None or name is None:
                self.status = "Error in specifying path/name"
                return [None, event_input_value, self.status]

            if data is None:
                return [None, None, None]

            self.data = np.matrix(np.copy(data))
            self.path = os.path.join(*re.split('\\/', path), "{0}.csv".format(name))

            print("Data on write CSV:" , self.data)

            with open(self.path, "a+") as f:
                np.savetxt(f, self.data, delimiter=",", fmt='%s')

            '''
            with open(self.path, mode='a+', newline='') as csv_file:
                data_writer = csv.writer(csv_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_NONE)
                if len(self.data) == 1:
                    print(np.squeeze(np.asarray(self.data[0])))
                    data_writer.writerow(np.array(self.data[0,:]))
                else:
                    for row in self.data:
                        print("row:" , row)
                        data_writer.writerow(row)
            '''

            return [None, event_input_value, "OK"]