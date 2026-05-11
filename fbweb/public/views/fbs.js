import * as Y from "https://esm.sh/yjs@13.6.0";
import { CodemirrorBinding } from "https://esm.sh/y-codemirror@3.0.1?deps=yjs@13.6.0";

// TODO This is a lot, maybe separate into a few files?
const fbs_list = document.getElementById("fbs-list");
const fbs_toolbar = document.getElementById("fbs-toolbar");
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

window.fbs.observe(() => {
  populateSidebar();
});
populateSidebar();

document.getElementById("add-fb").addEventListener("click", () => {
  add_fb();
});

// TODO figure out what the uuid is good for here
// TODO show what is the active tab
function populateSidebar() {
  fbs_list.innerHTML = "";

  window.fbs.forEach((fb, id) => {
    const div = document.createElement("div");
    div.className = "fb-item";
    div.textContent = fb.get("name");
    div.dataset.uuid = id;

    div.onclick = () => bindTextEditors(id);

    if (!fbs_list.hasChildNodes())
      bindTextEditors(id);

    fbs_list.appendChild(div);
  });
};

// TODO Put the default texts in a separate file
function add_fb() {
  for (let i = 0; i < 1000; i++) {
    const new_name = `NEW_FB_${i}`;

    const exists = Array.from(window.fbs.values())
      .some(fb => fb.get('name') === new_name);

    if (!exists) {
      const uuid = crypto.randomUUID();

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

      window.fbs.set(uuid, fb);

      bindTextEditors(uuid)
      break;
    }
  }
}

// TODO This function doesnt have to be abstract
// TODO Make it work on the whole fbs-toolbar
// TODO Simplify it a lot
function InputBind(uuid, key, div) {
  const fb = fbs.get(uuid);

  const input = div.querySelector("input");
  input.value = fb.get(key) || "";

  const deleteBtn = div.querySelector("button");

  const onInput = () => {
    window.ydoc.transact(() => {
      fb.set(key, input.value);
    });
    populateSidebar();
  }
  input.addEventListener('input', onInput);

  const onClick = () => {
    window.ydoc.transact(() => {
      fbs.delete(uuid);
    });
    populateSidebar();
  }
  deleteBtn.addEventListener('click', onClick);

  const observer = (event) => {
    if (event.keysChanged.has(key)) {
      const newValue = fb.get(key);
      if (input.value !== newValue) {
        input.value = newValue;
        populateSidebar();
      }
    }
  };
  fb.observe(observer);

  return {
    destroy: () => {
      input.removeEventListener('input', onInput);
      deleteBtn.removeEventListener('click', onClick);
      fb.unobserve(observer);
    }
  };
}

// TODO rename name_binding since it now affects the whole fbs-toolbar
function bindTextEditors(uuid) {
  const fb = fbs.get(uuid);

  if (window.name_binding) window.name_binding.destroy();
  if (window.xml_binding) window.xml_binding.destroy();
  if (window.py_binding) window.py_binding.destroy();

  window.name_binding = InputBind(
    uuid,
    "name",
    fbs_toolbar
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

// TODO put this somewhere nicer
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
