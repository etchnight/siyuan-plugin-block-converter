import { Plugin, Menu, Protyle } from "siyuan";
import { buildSyTableBlocks } from "./libs/tableTransfer";
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
    //console.log(detail);
    if (detail.blockElements.length !== 1) {
      return;
    }
    const selectElement = detail.blockElements[0];
    if (selectElement.getAttribute("data-type") !== "NodeHTMLBlock") {
      return;
    }
    const protyleHtml = selectElement.querySelector("protyle-html");
    const html = protyleHtml?.getAttribute("data-content");
    /*
    const tempEle = document.createElement("div");
    tempEle.innerHTML = html;
    if (!tempEle.querySelector("table")) {
      tempEle.innerHTML = protyleHtml.shadowRoot.innerHTML;
      if (!tempEle.querySelector("table")) {
        return;
      }
    }*/
    //直接使用shadow
    const shadow = protyleHtml.shadowRoot.querySelector("div");

    if (!shadow.querySelector("table")) {
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
  }
}
