import * as Y from "https://esm.sh/yjs@13.6.0";
import { CodemirrorBinding } from "https://esm.sh/y-codemirror@3.0.1?deps=yjs@13.6.0";

const fbs_list = document.getElementById("fbs-list");
const name_edit = document.getElementById("name-edit");
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
window.fbs.observe(() => {
  populateSidebar();
});
populateSidebar();

document.getElementById("add").addEventListener("click", () => {
  newFB();
});

function populateSidebar() {
  fbs_list.innerHTML = "";

  window.fbs.forEach((fb, id) => {
    const div = document.createElement("div");
    div.className = "fb-item";
    div.textContent = fb.get("name");

    div.onclick = () => bindTextEditors(fb);

    if (!fbs_list.hasChildNodes())
      bindTextEditors(fb);

    fbs_list.appendChild(div);
  });
};

function newFB() {
  for (let i = 0; i < 1000; i++) {
    const new_name = `NEW_FB_${i}`;

    const exists = Array.from(window.fbs.values())
      .some(fb => fb.get('name') === new_name);

    if (!exists) {
      const fb = new Y.Map();
      fb.set('name', new_name);
      fb.set('xml', new Y.Text(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE FBType SYSTEM "http://www.holobloc.com/xml/LibraryElement.dtd">
<FBType Name="${new_name}">
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
</FBType>`));
      fb.set('py', new Y.Text(`import random

  class ${new_name}:
    def __init__(self):
      pass

    def schedule(self, event_name, event_value, variable_1, variable_2, variable_3):
      if event_name == "INIT":
        return [event_value, None, ""]

      elif event_name == "READ":
        return [None, event_value, ""]
  `));

      window.fbs.set(crypto.randomUUID(), fb);

      bindTextEditors(fb)
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

function InputBind(map, key, input) {
  // Set the initial value immediately
  input.value = map.get(key) || "";

  const onInput = () => {
    map.set(key, input.value);
    populateSidebar();
  }
  input.addEventListener('input', onInput);

  const observer = (event) => {
    if (event.keysChanged.has(key)) {
      const newValue = map.get(key);
      if (input.value !== newValue) {
        input.value = newValue;
        populateSidebar();
      }
    }
  };
  map.observe(observer);

  return {
    destroy: () => {
      input.removeEventListener('input', onInput);
      map.unobserve(observer);
    }
  };
}

function bindTextEditors(fb) {
  if (window.name_binding) window.name_binding.destroy();
  if (window.xml_binding) window.xml_binding.destroy();
  if (window.py_binding) window.py_binding.destroy();

  window.name_binding = InputBind(
    fb,
    "name",
    name_edit
  );

  window.xml_binding = new CodemirrorBinding(
    fb.get("xml"),
    window.xml_editorview,
    provider.awareness
  );
  window.py_binding = new CodemirrorBinding(
    fb.get("py"),
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
