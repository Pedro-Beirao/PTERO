export function default_xml(new_name) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE FBType SYSTEM "http://www.holobloc.com/xml/LibraryElement.dtd">
<FBType Name="${new_name}">
<InterfaceList>
<EventInputs>
  <Event Name="INIT" Type="Event"/>
  <Event Name="READ" Type="Event">
    <With Var="VARIABLE_1"/>
    <With var="VARIABLE_2"/>
    <With var="VARIABLE_3"/>
  </Event>
</EventInputs>
<EventOutputs>
  <Event Name="INIT_O" Type="Event"/>
  <Event Name="READ_O" Type="Event">
    <With Var="DATA_1"/>
  </Event>
</EventOutputs>
<InputVars>
  <VarDeclaration Name="VARIABLE_1" Type="STRING"/>
  <VarDeclaration Name="VARIABLE_2" Type="REAL"/>
  <VarDeclaration Name="VARIABLE_3" Type="INT"/>
</InputVars>
<OutputVars>
  <VarDeclaration Name="DATA_1" Type="STRING"/>
</OutputVars>
</InterfaceList>
</FBType>`
}

export function default_py(new_name) {
  return `import random

class ${new_name}:
def __init__(self):
pass

def schedule(self, event_name, event_value, variable_1, variable_2, variable_3):
if event_name == "INIT":
  return [event_value, None, ""]

elif event_name == "READ":
  return [None, event_value, ""]
`
}
