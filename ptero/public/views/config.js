import * as Y from "https://esm.sh/yjs@13.6.0";

const resources_list = document.getElementById("resources-list");

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

    const names = ["Name", "Address", "DINASORE port", "color", "SSH port", "SSH user", "SSH password", "SSH path to DINASORE"]

    for (var i = 0; i < names.length; i++) {
      const name = names[i];
      const span = document.createElement("span");
      const div = document.createElement("div");
      div.textContent = name;
      span.appendChild(div);

      const input = document.createElement("input");

      if (name == "color") {
        input.type = "color";
        input.value = resource.get("color");
        input.hidden = true;

        div.className = "color-input";
        div.style.background = resource.get("color");

        div.onclick = () => input.click();
        input.oninput = () => {
          div.style.background = input.value;
          resource.set("color", input.value);
        };
      }
      else {
        input.value = resource.get(name);
        input.oninput = () => {
          resource.set(name, input.value);
        };
      }

      span.appendChild(input);
      left.appendChild(span);
    }

    const del_res = document.createElement("div");
    del_res.textContent = "x";
    del_res.className = "delete-resource";
    del_res.onclick = () => {
      window.ydoc.transact(() => {
        window.resources.delete(id);
      });
    };

    div.appendChild(left);
    div.appendChild(del_res);
    resources_list.appendChild(div);
  });


  window.nodes.forEach((node, id) => {
    // If the resource is deleted, delete the pointing mappedto
    if (node.get("mappedto") && !window.resources.has(node.get("mappedto"))) {
      node.delete("mappedto");
    }
    // TODO if the resource color is changed, change the color of the nodes
    // Currently every user has to reload the page
  });
}

const names = ["Name", "Address", "DINASORE port", "", "SSH port", "SSH user", "SSH password", "SSH path to DINASORE"]
function add_resource() {
  const uuid = crypto.randomUUID();

  const resource = new Y.Map();
  resource.set('Name', "DINASORE");
  resource.set('Address', "localhost");
  resource.set('DINASORE port', "61499");
  resource.set('SSH port', "22");
  resource.set('SSH user', "root");
  resource.set('SSH password', "dinasore");
  resource.set('SSH path to DINASORE', "/root/dinasore");
  resource.set('color', "#000077");

  window.resources.set(uuid, resource);

  populateConfig();
}
