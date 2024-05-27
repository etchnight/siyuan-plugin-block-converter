import TurndownService from "turndown";
import { insertBlock, updateBlock } from "../../subMod/siyuanPlugin-common/siyuan-api/block";
import { BlockId } from "../../subMod/siyuanPlugin-common/types/siyuan-api";
import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";
import { buildSyTableBlocks } from "./tableTransfer";

export async function customPaste(previousId: BlockId, protyle: IProtyle) {
  const content = await navigator.clipboard.read().then((e) => e[0]);
  const blob = await content.getType("text/html");
  const html = await blob.text();
  const turndownService = new TurndownService();
  turndownService.addRule("strikethrough", {
    filter: ["table"],
    replacement: function (_content, node, _options) {
      const container =
        protyle.contentElement.querySelector(".protyle-wysiwyg") ||
        protyle.contentElement;
      const style = getComputedStyle(container);
      //todo 计算宽度其实复杂，回头单独提出来，这里简化了
      const width = parseFloat(style.width) - 60 + "px";
      const tables = buildSyTableBlocks(node as HTMLElement, width);
      return tables[0];
    },
  });
  const markdown = turndownService.turndown(html);
  const isBlock = (text: string) => {
    const div = document.createElement("div");
    div.innerHTML = text;
    if (div.firstElementChild) {
      if (div.firstElementChild.hasAttribute("data-type")) {
        return true;
      }
    }
    return false;
  };
  const getDataType = (text: string) => {
    const div = document.createElement("div");
    div.innerHTML = text;
    return div.firstElementChild.getAttribute("data-type");
  };
  for (const line of markdown.split(/[(\r\n)\r\n]+/)) {
    if (isBlock(line) && getDataType(line) === "NodeTable") {
      //* 表格需要先插入再更新，否则交互不正确
      const res = await insertBlock(
        {
          dataType: "markdown",
          data: `||||
            | --| --| --|
            ||||
            ||||`,
          previousID: previousId,
        },
        protyle
      );
      previousId = res[0].doOperations[0].id;
      //todo 无法保留宽度信息
      const res2 = await updateBlock(
        {
          dataType: "dom",
          data: line,
          id: previousId,
        },
        protyle
      );
      previousId = res2[0].doOperations[0].id;
    } else {
      const res = await insertBlock(
        {
          dataType: isBlock(line) ? "dom" : "markdown",
          data: line,
          previousID: previousId,
        },
        protyle
      );
      previousId = res[0].doOperations[0].id;
    }
  }
}
