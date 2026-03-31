import { CodeJar } from 'https://cdn.jsdelivr.net/npm/codejar@4.3.0/dist/codejar.min.js';

const editorElement = document.getElementById('xml-editor');

// Highlighting function using Prism
function highlight(editor) {
  editor.innerHTML = Prism.highlight(editor.textContent, Prism.languages.python, 'python');
}

// Initialize CodeJar
const jar = CodeJar(editorElement, highlight);

// Optional: add some default code
jar.updateCode(`
  class CONCATENATE_REALS:

      def schedule(self, event_name, event_value, value1, value2):
          if event_name == 'INIT':
              return [event_value, None, 0]

          elif event_name == 'RUN':
              output = str(value1) + ';' + str(value2)
              return [None, event_value, output]
`);
