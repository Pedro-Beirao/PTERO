import * as Y from "https://esm.sh/yjs@13.6.0";
import { CodemirrorBinding } from "https://esm.sh/y-codemirror@3.0.1?deps=yjs@13.6.0";

const resources_list = document.getElementById("resources-list");
const com_editor = document.getElementById("communication");

window.com_editorview = CodeMirror(com_editor, {
  tabSize: 2,
  theme: "monokai",
  mode: "xml",
  readOnly: "nocursor"
});

window.com_binding = new CodemirrorBinding(
  window.ydoc.getText('communication'),
  window.com_editorview,
  provider.awareness
);

window.resources.observe(() => {
  populateConfig();
});
populateConfig();

document.getElementById("add-resource").addEventListener("click", () => {
  add_resource();
});

function populateConfig() {
  resources_list.innerHTML = "";

  window.resources.forEach((resource, id) => {
    const div = document.createElement("div");
    div.classList.add("resource-item");
    div.classList.add("split-view");
    div.dataset.uuid = id;

    const left = document.createElement("div");

    const name = document.createElement("input");
    name.value = resource.get("name");
    name.oninput = () => {
      resource.set("name", name.value);
    };

    const ip = document.createElement("input");
    ip.value = resource.get("ip");
    ip.oninput = () => {
      resource.set("ip", ip.value);
    };

    left.appendChild(name);
    left.appendChild(ip);

    const right = document.createElement("div");
    right.className = "color-input";
    right.style.background = resource.get("color");

    const color = document.createElement("input");
    color.type = "color";
    color.value = resource.get("color");
    color.hidden = true;

    right.onclick = () => color.click();
    color.oninput = () => {
      right.style.background = color.value;
      resource.set("color", color.value);
    };

    const del_res = document.createElement("div");
    del_res.textContent = "x";
    del_res.className = "delete-resource";
    del_res.onclick = () => {
      window.ydoc.transact(() => {
        window.resources.delete(id);
      });
    };

    right.appendChild(color);

    div.appendChild(left);
    div.appendChild(right);
    div.appendChild(del_res);
    resources_list.appendChild(div);
  });
}

function add_resource() {
  const uuid = crypto.randomUUID();

  const resource = new Y.Map();
  resource.set('name', "EMB_RES");
  resource.set('ip', "localhost:61499");
  resource.set('color', "#ff0000");

  window.resources.set(uuid, resource);

  populateConfig();
}
