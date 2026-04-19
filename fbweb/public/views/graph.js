const canvas = document.getElementById("graphCanvas");

const graphCanvas = new LGraphCanvas(canvas, window.litegraph);

resizeCanvas()
window.addEventListener('resize', resizeCanvas);

// TODO way too big to be in a main script like this one
graphCanvas.showShowNodePanel = function (node) {
  this.SELECTED_NODE = node;
	this.closePanels();
	var ref_window = this.getCanvasWindow();
	var graphcanvas = this;
	var panel = this.createPanel("",{
                                    closable: true
                                    ,window: ref_window
                                    ,onOpen: function(){
                                        graphcanvas.NODEPANEL_IS_OPEN = true;
                                    }
                                    ,onClose: function(){
                                        graphcanvas.NODEPANEL_IS_OPEN = false;
                                        graphcanvas.node_panel = null;
                                    }
                                  });
    graphcanvas.node_panel = panel;
		panel.id = "node-panel";
		panel.node = node;
		panel.classList.add("settings");

		function inner_refresh()
		{
			panel.content.innerHTML = "";

      var fUpdate = function(name,value) {
        graphcanvas.graph.beforeChange(node);
        switch(name){
            case "":
                node.title = value;
                break;
            default:
                node.setProperty(name,value);
                break;
        }
        graphcanvas.graph.afterChange(node);
        graphcanvas.dirty_canvas = true;
      };

      panel.addWidget("string", "", node.title, {}, fUpdate);

      panel.addHTML("<br><h3>Default Inputs</h3>");

      for(var pName in node.properties)
			{
				var value = node.properties[pName];
				var info = node.getPropertyInfo(pName);
				var type = info.type || "string";

				//in case the user wants control over the side panel widget
				if( node.onAddPropertyToPanel && node.onAddPropertyToPanel(pName,panel) )
					continue;

				panel.addWidget( info.widget || info.type, pName, value, info, fUpdate);
			}

			panel.addSeparator();

			if(node.onShowCustomPanelInfo)
				node.onShowCustomPanelInfo(panel);

      panel.footer.innerHTML = ""; // clear
		}

		inner_refresh();

		this.canvas.parentNode.appendChild( panel );
};

function resizeCanvas() {
  const canvas = document.getElementById('graphCanvas');
  const panel = document.getElementById('panel-graph');
  canvas.width = panel.clientWidth;
  canvas.height = panel.clientHeight;
}
