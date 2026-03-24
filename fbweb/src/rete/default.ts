import { ClassicPreset as Classic, type GetSchemes, NodeEditor } from 'rete';

import { type Area2D, AreaExtensions, AreaPlugin } from 'rete-area-plugin';
import {
  ConnectionPlugin,
  Presets as ConnectionPresets,
} from 'rete-connection-plugin';

import {
  VuePlugin,
  type VueArea2D,
  Presets as VuePresets,
} from 'rete-vue-plugin';

import {
  ContextMenuPlugin,
  type ContextMenuExtra,
  Presets as ContextMenuPresets,
} from 'rete-context-menu-plugin';

import {
  ReroutePlugin,
  type RerouteExtra,
  RerouteExtensions,
} from 'rete-connection-reroute-plugin';

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
  | VueArea2D<Schemes>
  | ContextMenuExtra
  | RerouteExtra;

const socket = new Classic.Socket('socket');

export async function createEditor(container: HTMLElement) {
  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();

  const vueRender = new VuePlugin<Schemes, AreaExtra>();

  const contextMenu = new ContextMenuPlugin<Schemes>({
    items: ContextMenuPresets.classic.setup([
      ['Number', () => new NumberNode(1)],
      ['Add', () => new AddNode()],
    ]),
  });

  const reroutePlugin = new ReroutePlugin<Schemes>();

  editor.use(area);

  area.use(vueRender);

  area.use(connection);
  area.use(contextMenu);

  vueRender.use(reroutePlugin);

  connection.addPreset(ConnectionPresets.classic.setup());

  vueRender.addPreset(VuePresets.classic.setup());
  vueRender.addPreset(VuePresets.contextMenu.setup());

  vueRender.addPreset(
    VuePresets.reroute.setup({
      contextMenu(id) {
        reroutePlugin.remove(id);
      },
      translate(id, dx, dy) {
        reroutePlugin.translate(id, dx, dy);
      },
      pointerdown(id) {
        reroutePlugin.unselect(id);
        reroutePlugin.select(id);
      },
    })
  );

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
  RerouteExtensions.selectablePins(reroutePlugin, selector, accumulating);

  return {
    destroy: () => area.destroy(),
  };
}
