import { default_xml, default_py} from "./default.js"
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
  indentUnit: 2,
  indentWithTabs: false,
  extraKeys: {
    "Tab": function(cm) {
      cm.replaceSelection("  ");
    },
    "Shift-Tab": "indentLess"
  },
  theme: "monokai",
  mode: "xml"
});

window.py_editorview = CodeMirror(py_editor, {
  lineNumbers: true,
  tabSize: 2,
  indentUnit: 2,
  indentWithTabs: false,
  extraKeys: {
    "Tab": function(cm) {
      cm.replaceSelection("  ");
    },
    "Shift-Tab": "indentLess"
  },
  theme: "monokai",
  mode: "python"
});


var cur_fb = 0;
window.fbs.observe(() => {
  populateSidebar();
});
populateSidebar();

document.getElementById("add-fb").addEventListener("click", () => {
  add_fb();
});

// TODO show what is the active tab
function populateSidebar() {
  fbs_list.innerHTML = "";

  if (window.fbs.size == 0) {
    fbs_toolbar.style.visibility = "hidden";
    fbs_editor.style.visibility = "hidden";
  }
  else {
    fbs_toolbar.style.visibility = "visible";
    fbs_editor.style.visibility = "visible";
  }

  window.fbs.forEach((fb, id) => {
    const div = document.createElement("div");
    div.className = "fb-item";
    div.textContent = fb.get("name");
    div.dataset.uuid = id;

    if (id == cur_fb || cur_fb == 0) {
      bindTextEditors(id);
      const selected = document.querySelectorAll('.selected');
      selected.forEach(sel => sel.classList.remove("selected"));
      div.classList.add("selected");
    }

    div.onclick = () => {
      bindTextEditors(id);
      const selected = document.querySelectorAll('.selected');
      selected.forEach(sel => sel.classList.remove("selected"));
      div.classList.add("selected");
    }

    fbs_list.appendChild(div);

    // Update the graph if the xml changes
    fb.get("xml").observe(() => {
      if (document.getElementById("panel-graph").classList.contains("active")) {
        window.syncNodes();
        window.populateGraph();
      }
    })
  });
};

function add_fb() {
  for (let i = 0; i < 1000; i++) {
    const new_name = `NEW_FB_${i}`;

    const exists = Array.from(window.fbs.values())
      .some(fb => fb.get('name') === new_name);

    if (!exists) {
      const uuid = crypto.randomUUID();

      const fb = new Y.Map();
      fb.set('name', new_name);
      fb.set('xml', new Y.Text(default_xml(new_name)));
      fb.set('py', new Y.Text(default_py(new_name)));

      window.fbs.set(uuid, fb);

      // Sidebar will be populated now because of
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

  // TODO delete text when it is deleted
  const onClick = () => {
    window.ydoc.transact(() => {
      fbs.delete(uuid);
    });
    cur_fb = 0;
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

  cur_fb = uuid;
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
