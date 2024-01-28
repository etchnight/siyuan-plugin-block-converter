import { Plugin, Menu, Protyle } from "siyuan";
import { buildSyTableBlocks, reComputeWidth } from "./libs/tableTransfer";
import { insertBlock } from "../subMod/siyuanPlugin-common/siyuan-api/block";

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
    console.log(detail)
    if (detail.blockElements.length !== 1) {
      return;
    }
    const selectElement = detail.blockElements[0];
    if (selectElement.getAttribute("data-type") !== "NodeHTMLBlock") {
      return;
    }
    const html = selectElement
      .querySelector("protyle-html")
      ?.getAttribute("data-content");
    const tempEle = document.createElement("div");
    tempEle.innerHTML = html;
    if (!tempEle.querySelector("table")) {
      return;
    }
    detail.menu.addItem({
      iconHTML: "",
      label: this.i18n.blockMenuName,
      click: async () => {
        let blockId = detail.blockElements[0]?.getAttribute("data-node-id");
        if (!blockId) {
          console.error("获取块id失败");
          return;
        }
        let tableBlocks = buildSyTableBlocks(tempEle);
        //重算宽度
        for (let i = 0; i < tableBlocks.length; i++) {
          const tempEle = document.createElement("div");
          tempEle.innerHTML = tableBlocks[i];
          const fullWidth = window.getComputedStyle(selectElement).width;
          const colWidthList = reComputeWidth(
            tempEle.querySelector("table"),
            fullWidth
          );
          tempEle.firstElementChild.setAttribute(
            "colgroup",
            colWidthList.join("|")
          );
          tableBlocks[i] = tempEle.innerHTML;
        }
        console.log(tableBlocks);
        //替换或插入表格
        for (let html of tableBlocks) {
          let res = await insertBlock("dom", html, "", blockId);
          console.log(blockId);
          blockId = res[0].doOperations[0].id;
        }
      },
    });
  }
}
