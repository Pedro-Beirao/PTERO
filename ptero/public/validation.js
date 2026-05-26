function copyCode(file, btn) {
  var text = ""
  if (file == "SENSOR_SIMULATOR_fbt")
    text = SENSOR_SIMULATOR_fbt;
  else if (file == "SENSOR_SIMULATOR_py")
    text = SENSOR_SIMULATOR_py;
  else if (file == "MOVING_AVERAGE_fbt")
    text = MOVING_AVERAGE_fbt;
  else if (file == "MOVING_AVERAGE_py")
    text = MOVING_AVERAGE_py;
  else if (file == "CONCATENATE_REALS_fbt")
    text = CONCATENATE_REALS_fbt;
  else if (file == "CONCATENATE_REALS_py")
    text = CONCATENATE_REALS_py;

  navigator.clipboard.writeText(text)
    .then(() => {
      const copiedEl = btn.parentElement.querySelector("span")
      copiedEl.style.opacity = 1

      setTimeout(() => {
        copiedEl.style.opacity = 0
      }, 5000);
    })
    .catch(err => {
      alert(`Failed to copy:${err}\n\n${text}`);
    });
}

const SENSOR_SIMULATOR_fbt = `<FBType Name="SENSOR_SIMULATOR" OpcUa="DEVICE.SENSOR">
<InterfaceList>
  <EventInputs>
    <Event Name="INIT" Type="Event"/>
    <Event Name="READ" Type="Event"/>
  </EventInputs>
  <EventOutputs>
    <Event Name="INIT_O" Type="Event"/>
    <Event Name="READ_O" Type="Event">
      <With Var="VALUE"/>
    </Event>
  </EventOutputs>
  <InputVars>
    <VarDeclaration Name="OFFSET" Type="INT" OpcUa="Constant"/>
  </InputVars>
  <OutputVars>
    <VarDeclaration Name="VALUE" Type="REAL" OpcUa="Variable"/>
  </OutputVars>
</InterfaceList>
</FBType>
`

const SENSOR_SIMULATOR_py = `import numpy as np
import time

def create_distribution(offset):
    # generate values based in the normal distribution
    mu, sigma = 0.5, 0.1
    s = np.random.normal(mu, sigma, 3000)
    # organizes the values in a normal curve
    hist, bin_edges = np.histogram(s, bins=np.arange(0.2, 0.8, 0.002))
    values2sort = offset + (hist / 4)
    # split the array to start in a random place
    split_value = np.random.randint(0, 300)
    final_values = np.concatenate([values2sort[split_value:], values2sort[0:split_value]])
    return final_values

class SENSOR_SIMULATOR:

    def __init__(self):
        self.distribution = None
        self.distribution_index = 0

    def schedule(self, event_name, event_value, offset):
        if event_name == 'INIT':
            # create the values list (distribution) and reset the index
            self.distribution = create_distribution(offset)
            self.distribution_index = 0
            return [event_value, None, 0]

        elif event_name == 'READ':
            value = self.distribution[self.distribution_index]
            self.distribution_index += 1
            # reset the index
            if self.distribution_index >= len(self.distribution):
                self.distribution_index = 0
            # wait some time
            time.sleep(1)
            return [None, event_value, value]
`

const MOVING_AVERAGE_fbt = `<FBType Name="MOVING_AVERAGE" OpcUa="SERVICE">
  <InterfaceList>
    <EventInputs>
      <Event Name="INIT" Type="Event"/>
      <Event Name="RUN" Type="Event" OpcUa="Method">
        <With Var="VALUE"/>
      </Event>
    </EventInputs>
    <EventOutputs>
      <Event Name="INIT_O" Type="Event"/>
      <Event Name="RUN_O" Type="Event">
        <With Var="VALUE_MA"/>
      </Event>
    </EventOutputs>
    <InputVars>
      <VarDeclaration Name="WINDOW" Type="INT" OpcUa="Constant.RUN"/>
      <VarDeclaration Name="VALUE" Type="REAL" OpcUa="Variable.RUN"/>
    </InputVars>
    <OutputVars>
      <VarDeclaration Name="VALUE_MA" Type="REAL" OpcUa="Variable.RUN"/>
    </OutputVars>
  </InterfaceList>
</FBType>
`

const MOVING_AVERAGE_py = `class MOVING_AVERAGE:
  def __init__(self):
    self.values_list = []

  def schedule(self, event_name, event_value, window, value):
    if event_name == 'INIT':
      return [event_value, None, 0]

    elif event_name == 'RUN':
      # appends the value to the list
      self.values_list.append(value)
      # checks the size of the list
      if len(self.values_list) == window:
        # calculate the moving average
        moving_average = sum(self.values_list)/window
        # removes the last value
        self.values_list.pop(0)
        # returns the moving average value
        return [None, event_value, moving_average]
      else:
        # the list doesn't have the correct size
        return [None, None, 0]
`

const CONCATENATE_REALS_fbt = `<FBType Name="CONCATENATE_REALS" OpcUa="SERVICE">
  <InterfaceList>
    <EventInputs>
      <Event Name="INIT" Type="Event"/>
      <Event Name="RUN" Type="Event">
        <With Var="VALUE1"/>
        <With Var="VALUE2"/>
      </Event>
    </EventInputs>
    <EventOutputs>
      <Event Name="INIT_O" Type="Event"/>
      <Event Name="RUN_O" Type="Event">
        <With Var="RESULT"/>
      </Event>
    </EventOutputs>
    <InputVars>
      <VarDeclaration Name="VALUE1" Type="REAL" OpcUa="Variable.RUN"/>
      <VarDeclaration Name="VALUE2" Type="REAL" OpcUa="Variable.RUN"/>
    </InputVars>
    <OutputVars>
      <VarDeclaration Name="RESULT" Type="STRING" OpcUa="Variable.RUN"/>
    </OutputVars>
  </InterfaceList>
</FBType>`

const CONCATENATE_REALS_py = `class CONCATENATE_REALS:
  def schedule(self, event_name, event_value, value1, value2):
    if event_name == 'INIT':
      return [event_value, None, 0]

    elif event_name == 'RUN':
      output = str(value1) + ';' + str(value2)
      return [None, event_value, output]
`
