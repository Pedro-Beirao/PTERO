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
