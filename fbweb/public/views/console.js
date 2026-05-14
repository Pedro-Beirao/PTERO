import * as Y from "https://esm.sh/yjs@13.6.0";
import { CodemirrorBinding } from "https://esm.sh/y-codemirror@3.0.1?deps=yjs@13.6.0";

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

window.com_editorview.refresh();
