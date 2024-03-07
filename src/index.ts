import { Plugin, Menu, Protyle } from "siyuan";
import { buildSyTableBlocks } from "./libs/tableTransfer";
import { insertBlock } from "../subMod/siyuanPlugin-common/siyuan-api/block";
import {
  queryBlockById,
  queryFirstChildBlock,
  queryRefInfoById,
} from "../subMod/siyuanPlugin-common/siyuan-api/query";
import {
  buildFlowEdge,
  buildFlowNode,
  RefAnchorCompo,
  searchComp,
} from "./libs/str2mermaid";
export default class PluginTableImporter extends Plugin {
  private blockIconEventBindThis = this.blockIconEvent.bind(this);
  async onload() {
    this.eventBus.on("click-blockicon", this.blockIconEventBindThis);
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
    this.htmlBlock2tableBlock(detail);
    this.block2flowchart(detail);
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
        let flowchartText =
          `%%{init: {"flowchart": {"htmlLabels": false}} }%%\n` +
          `flowchart LR`;
        let count = 0;
        let startBlock = await queryBlockById(blockId);
        if (startBlock.type === "i") {
          startBlock = await queryFirstChildBlock(startBlock);
        }
        let queue = [startBlock]; //未完成队列
        let idList = []; //已完成的，防止重复
        while (queue.length !== 0 && count < 100) {
          let block = queue.pop();
          const id = block.id;
          idList.push(id);
          const refInfos = await queryRefInfoById(id);
          let flowRefs: RefAnchorCompo[] = [];
          for (let item of refInfos) {
            const refInfoCompo = searchComp(item.content);
            if (refInfoCompo.arrow) {
              flowchartText +=
                "\n" + buildFlowEdge(id, item.def_block_id, refInfoCompo);
              flowRefs.push(refInfoCompo);
              if (!idList.includes(item.def_block_id)) {
                let defBlock = await queryBlockById(item.def_block_id);
                queue.push(defBlock);
              }
            }
          }
          flowchartText += "\n" + buildFlowNode(id, block.content, flowRefs);
        }
        //console.log(flowchartText);
        await insertBlock({
          dataType: "markdown",
          data: "```" + "mermaid" + "\n" + flowchartText + "\n" + "```",
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
}
