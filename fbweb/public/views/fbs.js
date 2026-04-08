import { CodemirrorBinding } from "https://esm.sh/y-codemirror@3.0.1?deps=yjs@13.6.0";

const fbs_list = document.getElementById("fbs-list");
const fbs_editor = document.getElementById('fbs-editor');
const xml_editor = document.getElementById('xml-editor');
const py_editor = document.getElementById('py-editor');
const resize_handle = document.getElementById('resize-handle');

window.xml_editorview = CodeMirror(xml_editor, {
  lineNumbers: true,
  tabSize: 2,
  theme: "monokai",
  mode: "xml"
});

window.py_editorview = CodeMirror(py_editor, {
  lineNumbers: true,
  tabSize: 2,
  theme: "monokai",
  mode: "python"
});

const fb_names = window.ydoc.getArray('fb-names');
fb_names.observe(() => {
  populateSidebar();
});
populateSidebar();

document.getElementById("add").addEventListener("click", () => {
  newFB();
});

function populateSidebar() {
  fbs_list.innerHTML = "";

  fb_names.forEach((fb_name, index) => {
    const div = document.createElement("div");
    div.className = "fb-item";

    const label = document.createElement("span");
    label.textContent = fb_name;

    // 2. The Edit Button
    const editBtn = document.createElement("button");
    editBtn.textContent = "✎";
    editBtn.className = "btn-edit";

    editBtn.onclick = (e) => {
      e.stopPropagation();
      enterEditMode(index, fb_name, div, label);
    };

    div.onclick = () => bindTextEditors(fb_name);

    if (!fbs_list.hasChildNodes())
      bindTextEditors(fb_name);

    div.appendChild(label);
    div.appendChild(editBtn);
    fbs_list.appendChild(div);
  });
};

function newFB() {
  for (let i = 0; i < 1000; i++) {
    const new_fb = `NEW_FB_${i}`;

    const exists = fb_names.toArray().some(fb => fb == new_fb);

    if (!exists) {
      fb_names.push([new_fb]);
      bindTextEditors(new_fb)
      break;
    }
  }
}

function enterEditMode(index, oldName, container, spanToReplace) {
  // Prevent double-inputs if already editing
  if (container.querySelector('input')) return;

  const input = document.createElement("input");
  input.type = "text";
  input.value = oldName;
  input.className = "fb-edit-input";

  // Hide the original span and show the input
  spanToReplace.style.display = "none";
  container.prepend(input);
  input.focus();
  input.select();

  const finished = (shouldSave) => {
    const newName = input.value.trim();
    if (shouldSave && newName && newName !== oldName) {
      updateFBName(index, newName);
    } else {
      // If cancelled or empty, just put the span back
      input.remove();
      spanToReplace.style.display = "inline";
    }
  };

  // Event Listeners
  input.onblur = () => finished(true);
  input.onkeydown = (e) => {
    if (e.key === "Enter") finished(true);
    if (e.key === "Escape") finished(false);
  };
}

function updateFBName(index, newName) {
  window.ydoc.transact(() => {
    const oldData = fb_names.get(index);

    fb_names.delete(index, 1);
    fb_names.insert(index, [newName]);

    // fb_names.insert(index, [{
    //   ...oldData,
    //   name: newName
    // }]);
  });
}

function bindTextEditors(name) {
  const xml_text = window.ydoc.getText(name + ".xml");
  const py_text = window.ydoc.getText(name + ".py");

  if (xml_text.toString().length === 0) {
      xml_text.insert(0, `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE FBType SYSTEM "http://www.holobloc.com/xml/LibraryElement.dtd">
<FBType Name="${name}">
  <InterfaceList>
    <EventInputs>
      <Event Name="INIT" Type="Event"/>
      <Event Name="READ" Type="Event">
        <With Var="VARIABLE_1"/>
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
</FBType>
`);
    }

  if (py_text.toString().length === 0) {
    py_text.insert(0, `import random

class ${name}:
  def __init__(self):
    pass

  def schedule(self, event_name, event_value, variable_1, variable_2, variable_3):
    if event_name == "INIT":
      return [event_value, None, ""]

    elif event_name == "READ":
      return [None, event_value, ""]
`);
    }

  if (window.xml_binding) {
    window.xml_binding.destroy();
  }
  if (window.py_binding) {
    window.py_binding.destroy();
  }

  window.xml_binding = new CodemirrorBinding(
    xml_text,
    window.xml_editorview,
    provider.awareness
  );
  window.py_binding = new CodemirrorBinding(
    py_text,
    window.py_editorview,
    provider.awareness
  );

  window.xml_editorview.refresh();
  window.py_editorview.refresh();
}

// Resize handle

let isDragging = false;

resize_handle.addEventListener('mousedown', function(e) {
  isDragging = true;
  e.preventDefault();
});

document.addEventListener('mousemove', function(e) {
  if (!isDragging) return;

  const containerRect = fbs_editor.getBoundingClientRect();
  let newWidth = e.clientX - containerRect.left;
  if (newWidth < 50) newWidth = 50;
  else if (newWidth > (containerRect.width - 50)) newWidth = containerRect.width - 50;

  xml_editor.style.width = `${newWidth}px`;
  py_editor.style.flex = 'none';
  py_editor.style.width = `calc(100% - ${newWidth + 8}px)`;
});

document.addEventListener('mouseup', function() {
  isDragging = false;
  window.xml_editorview.refresh();
  window.py_editorview.refresh();
});
