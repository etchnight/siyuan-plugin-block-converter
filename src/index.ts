import { Plugin, Menu, Protyle, IMenuItemOption } from "siyuan";
import { buildSyTableBlocks } from "./libs/tableTransfer";
import { insertBlock } from "../subMod/siyuanPlugin-common/siyuan-api/block";
import {
  queryBlockById,
  queryFirstChildBlock,
  queryRefInfoById,
  requestQuerySQL,
} from "../subMod/siyuanPlugin-common/siyuan-api/query";
import {
  buildFlowEdges,
  buildFlowNode,
  modifyFlowchart,
  RefAnchorCompo,
  searchComp,
} from "./libs/str2mermaid";
import { TreeTools } from "../subMod/js-utility-function/src/tree";
export default class PluginTableImporter extends Plugin {
  private blockIconEventBindThis = this.blockIconEvent.bind(this);
  private blockCustomCopySubmenu: IMenuItemOption[] = [];
  private detail: {
    menu: Menu;
    blockElements: [HTMLElement];
    protyle: Protyle;
  };
  async onload() {
    this.eventBus.on("click-blockicon", this.blockIconEventBindThis);
    this.buildsubMenu();
    console.log(this.i18n.helloPlugin);
  }

  onLayoutReady() {}

  onunload() {
    this.eventBus.off("click-blockicon", this.blockIconEventBindThis);
  }

  private blockIconEvent({
    detail,
  }: {
    detail: { menu: Menu; blockElements: [HTMLElement]; protyle: Protyle };
  }) {
    this.detail = detail;
    this.htmlBlock2tableBlock(detail);
    this.block2flowchart(detail);
    this.blockCustomCopy(detail);
  }

  private async block2flowchart(detail: {
    menu: Menu;
    blockElements: [HTMLElement];
    protyle: Protyle;
  }) {
    if (detail.blockElements.length !== 1) {
      return;
    }
    const selectElement = detail.blockElements[0];
    const blockId = selectElement.getAttribute("data-node-id");
    detail.menu.addItem({
      iconHTML: "",
      label: "生成流程图",
      click: async () => {
        let flowchart: Array<string | string[] | string[][]> = [
          `%%{init: {"flowchart": {"htmlLabels": false}} }%%`,
          `flowchart TB`,
        ];
        let count = 0;
        let startBlock = await queryBlockById(blockId);
        if (startBlock.type === "i") {
          startBlock = await queryFirstChildBlock(startBlock);
        }
        let queue = [startBlock]; //未完成队列
        let idList: BlockId[] = []; //已完成的，防止重复
        let edges: {
          preId: BlockId;
          id: BlockId;
          flowchart: string[][];
        }[] = [];
        while (queue.length !== 0 && count < 100) {
          //let edges: Array<string | string[] | string[][]> = [];
          let block = queue.pop();
          const id = block.id;
          idList.push(id);
          const refInfos = await queryRefInfoById(id);
          //console.log(refInfos)
          //const defInfos = await queryDefInfoById(id);
          let flowRefs: RefAnchorCompo[] = [];
          for (let item of refInfos) {
            const refInfoCompo = searchComp(item.content);
            if (refInfoCompo.arrow) {
              edges.push({
                preId: id,
                flowchart: buildFlowEdges(id, item.def_block_id, item.content),
                id: item.def_block_id,
              });
              flowRefs.push(refInfoCompo);
              if (!idList.includes(item.def_block_id)) {
                let defBlock = await queryBlockById(item.def_block_id);
                queue.push(defBlock);
              }
            }
          }
          flowchart.push(buildFlowNode(id, block.content, flowRefs));
        }
        const treeTools = new TreeTools({ pid: "preId" });
        const edgeTree = treeTools.fromList(edges);
        treeTools.forEach(edgeTree, (e) => {
          flowchart.push(e.flowchart);
        });
        let result = flowchart.flat(Infinity) as string[];
        //console.log(result);
        modifyFlowchart(result);
        await insertBlock({
          dataType: "markdown",
          data: "```mermaid\n" + result.join("\n") + "\n```",
          previousID: blockId,
        });
      },
    });
  }
  private htmlBlock2tableBlock = (detail: {
    menu: Menu;
    blockElements: [HTMLElement];
    protyle: Protyle;
  }) => {
    if (detail.blockElements.length !== 1) {
      return;
    }
    const selectElement = detail.blockElements[0];
    if (selectElement.getAttribute("data-type") !== "NodeHTMLBlock") {
      return;
    }
    const protyleHtml = selectElement.querySelector("protyle-html");
    //const html = protyleHtml?.getAttribute("data-content");
    //直接使用shadow
    const shadow = protyleHtml.shadowRoot.querySelector("div");

    if (!shadow.querySelector("table")) {
      return;
    }
    detail.menu.addItem({
      iconHTML: "",
      label: this.i18n.blockMenuName,
      click: async () => {
        let blockId = selectElement.getAttribute("data-node-id");
        if (!blockId) {
          console.error("获取块id失败");
          return;
        }
        const fullWidth = window.getComputedStyle(selectElement).width;
        let tableBlocks = buildSyTableBlocks(
          shadow,
          fullWidth,
          window.Lute.NewNodeID()
        );
        //替换或插入表格
        for (let html of tableBlocks) {
          let res = await insertBlock({
            dataType: "dom",
            data: html,
            previousID: blockId,
          });
          blockId = res[0].doOperations[0].id;
        }
      },
    });
  };
  private async buildsubMenu() {
    let submenu: IMenuItemOption[] = [];
    const jsBlocks = //todo
      (await requestQuerySQL(`SELECT * FROM blocks WHERE blocks.type='c' 
        AND blocks.root_id='20240313201953-gac4jbg'`)) as Block[];
    const submenuBlocks = jsBlocks.filter((e) => {
      return e.markdown.startsWith("```js");
    });
    for (let block of submenuBlocks) {
      const func = new Function(
        "input",
        "i",
        ` 
            const { title, name, content, markdown,id } = input;
            ${block.content}
          `
      );
      submenu.push({
        label: block.name || block.content,
        type: "submenu",
        click: async () => {
          const input = await Promise.all(
            this.detail.blockElements.map(async (e) => {
              const id = e.getAttribute("data-node-id");
              const block = await queryBlockById(id);
              const doc = await queryBlockById(block.root_id);
              return {
                title: doc.content,
                name: block.name,
                content: block.content,
                markdown: block.markdown,
                id: block.id,
              };
            })
          );
          let result = "";
          for (let i = 0; i < input.length; i++) {
            result += func(input[i], i);
          }
          console.log(input);
          console.log(result);
        },
      });
    }
    this.blockCustomCopySubmenu = submenu;
  }
  private blockCustomCopy = async (detail: {
    menu: Menu;
    blockElements: [HTMLElement];
    protyle: Protyle;
  }) => {
    detail.menu.addItem({
      iconHTML: "",
      label: "自定义复制",
      id: "blockCustomCopy",
      submenu: this.blockCustomCopySubmenu,
    });
  };
}
