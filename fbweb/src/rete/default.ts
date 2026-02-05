import { ClassicPreset as Classic, type GetSchemes, NodeEditor } from 'rete';

import { type Area2D, AreaExtensions, AreaPlugin } from 'rete-area-plugin';
import {
  ConnectionPlugin,
  Presets as ConnectionPresets,
} from 'rete-connection-plugin';

import {
  SveltePlugin,
  type SvelteArea2D,
  Presets as SveltePresets,
} from 'rete-svelte-plugin/5';

import {
  ContextMenuPlugin,
  type ContextMenuExtra,
  Presets as ContextMenuPresets,
} from 'rete-context-menu-plugin';
import { type MinimapExtra, MinimapPlugin } from 'rete-minimap-plugin';

type Node = NumberNode | AddNode;
type Conn =
  | Connection<NumberNode, AddNode>
  | Connection<AddNode, AddNode>
  | Connection<AddNode, NumberNode>;
type Schemes = GetSchemes<Node, Conn>;

class Connection<A extends Node, B extends Node> extends Classic.Connection<
  A,
  B
> {}

class NumberNode extends Classic.Node {
  width = 180;
  height = 120;

  constructor(initial: number, change?: (value: number) => void) {
    super('Number');

    this.addOutput('value', new Classic.Output(socket, 'Number'));
    this.addControl(
      'value',
      new Classic.InputControl('number', { initial, change })
    );
  }
}

class AddNode extends Classic.Node {
  width = 180;
  height = 195;

  constructor() {
    super('Add');

    this.addInput('a', new Classic.Input(socket, 'A'));
    this.addInput('b', new Classic.Input(socket, 'B'));
    this.addOutput('value', new Classic.Output(socket, 'Number'));
    this.addControl(
      'result',
      new Classic.InputControl('number', { initial: 0, readonly: true })
    );
  }
}

type AreaExtra =
  | Area2D<Schemes>
  | SvelteArea2D<Schemes>
  | ContextMenuExtra
  | MinimapExtra;

const socket = new Classic.Socket('socket');

export async function createEditor(container: HTMLElement) {
  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();

  const svelteRender = new SveltePlugin<Schemes, AreaExtra>();

  const contextMenu = new ContextMenuPlugin<Schemes>({
    items: ContextMenuPresets.classic.setup([
      ['Number', () => new NumberNode(1)],
      ['Add', () => new AddNode()],
    ]),
  });
  const minimap = new MinimapPlugin<Schemes>();

  editor.use(area);

  area.use(svelteRender);

  area.use(connection);
  area.use(contextMenu);
  area.use(minimap);

  connection.addPreset(ConnectionPresets.classic.setup());

  svelteRender.addPreset(SveltePresets.classic.setup());
  svelteRender.addPreset(SveltePresets.contextMenu.setup());
  svelteRender.addPreset(SveltePresets.minimap.setup());

  const a = new NumberNode(1);
  const b = new NumberNode(1);
  const add = new AddNode();

  await editor.addNode(a);
  await editor.addNode(b);
  await editor.addNode(add);

  await editor.addConnection(new Connection(a, 'value', add, 'a'));
  await editor.addConnection(new Connection(b, 'value', add, 'b'));

  await area.nodeViews.get(a.id)?.translate(100, 100);
  await area.nodeViews.get(b.id)?.translate(100, 300);
  await area.nodeViews.get(add.id)?.translate(400, 150);

  AreaExtensions.zoomAt(area, editor.getNodes());

  const selector = AreaExtensions.selector();
  const accumulating = AreaExtensions.accumulateOnCtrl();

  AreaExtensions.selectableNodes(area, selector, { accumulating });

  return {
    destroy: () => area.destroy(),
  };
}
