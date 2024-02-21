import { Plugin, Menu, Protyle } from "siyuan";
import { buildSyTableBlocks } from "./libs/tableTransfer";
import { insertBlock } from "../subMod/siyuanPlugin-common/siyuan-api/block";
import {
  queryBlockById,
  queryFirstChildBlock,
  queryRefInfoById,
} from "../subMod/siyuanPlugin-common/siyuan-api/query";
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
        let flowchartText = "flowchart LR";
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
          let flowRefs: string[] = [];
          for (let item of refInfos) {
            if (item.content.startsWith("-&gt;")) {
              flowchartText +=
                "\n" + buildFlowEdge(id, item.def_block_id, item.content);
              flowRefs.push(item.content);
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
        function buildFlowId(id: BlockId) {
          return "a" + id.replace("-", "");
        }
        function buildFlowNode(
          id: BlockId,
          markdown: string,
          flowRefs: string[]
        ) {
          //markdown转义
          let result = markdown.replace(/\"/g, "#quot;");
          result = result.replace(/\'/g, "#quot;");
          for (let content of flowRefs) {
            result = result.replace(content, "");
          }
          //节点形状
          const prefix = flowRefs.length > 1 ? "{{" : "[";
          const suffix = flowRefs.length > 1 ? "}}" : "]";
          return buildFlowId(id) + `${prefix}\"\`${result}\`\"${suffix}`;
        }
        function buildFlowEdge(
          id: BlockId,
          targetId: BlockId,
          refContent: string
        ) {
          let textOnArrow = "";
          //const arrowText = ["是", "yes", "否", "no"];
          /**
           * @param isMatch 在match中使用为ture，在search中使用为false
           * @returns 箭头+中英文括号+括号内内容+中英文括号，isMatch为ture时使用预查
           */
          const regexFunc = (isMatch?: boolean) => {
            const prefix = isMatch ? "?<=" : "";
            const suffix = isMatch ? "?=" : "";
            return new RegExp(
              `(${prefix}-&gt;(\\(|（))(.*?)(${suffix}(\\)|）))`,
              "g"
            );
          };
          const index = refContent.toLowerCase().search(regexFunc());
          if (index === 0) {
            const matchResult = refContent.toLowerCase().match(regexFunc(true));
            textOnArrow = "|" + matchResult[0] + "|";
          }
          ` A-->|text|B`;
          return `${buildFlowId(id)} -->${textOnArrow}${buildFlowId(targetId)}`;
        }
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
