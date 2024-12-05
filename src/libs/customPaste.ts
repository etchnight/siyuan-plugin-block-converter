import TurndownService from "turndown";
import { BlockId } from "../../subMod/siyuanPlugin-common/types/siyuan-api";
//import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";
import { buildSyTableBlocks } from "./tableTransfer";
import {  getJsBlocks } from "./common";
import { IProtyle } from "siyuan";

export async function customPaste(
  previousId: BlockId,
  protyle: IProtyle,
  docId?: BlockId
) {
  const content = await navigator.clipboard.read().then((e) => e[0]);
  const blob = await content.getType("text/html");
  const html = await blob.text();
  console.warn(`[customPaste]`, { html });
  const turndownService = new TurndownService();
  addTableRule(turndownService, protyle);
  if (docId) {
    const rules = await getCustomRule(docId);
    let count = 0;
    for (const rule of rules) {
      count++;
      turndownService.addRule("rule" + count, rule);
    }
  }
  const markdown = turndownService.turndown(html);

  const domText = protyle.lute.Md2BlockDOM(markdown);
  const parentDom = document.createElement("div");
  parentDom.innerHTML = domText;
  //*html块转普通Block
  for (const child of parentDom.children) {
    if (child.getAttribute("data-type") === "NodeHTMLBlock") {
      const content = child
        .querySelector("protyle-html")
        ?.getAttribute("data-content");
      if (content) {
        const tempdiv = document.createElement("div");
        tempdiv.innerHTML = content;
        child.outerHTML = tempdiv.innerText || tempdiv.textContent;
      }
    }
  }
}
async function getCustomRule(docId: BlockId) {
  const ruleBlocks = await getJsBlocks(docId);
  const rules = ruleBlocks.map((ruleBlock) => {
    const func = new Function(`return ${ruleBlock.content}`);
    const rule = func();
    return rule as TurndownService.Rule;
  });
  return rules.filter((e) => {
    if (!e) {
      return false;
    }
    if (!e.filter && !e.replacement) {
      return false;
    }
    if (typeof e.replacement !== "function") {
      return false;
    }
    const filterType = typeof e.filter;
    if (
      filterType !== "string" &&
      filterType !== "object" &&
      filterType !== "function"
    ) {
      return false;
    }
    return true;
  });
}

/**
 * 默认规则——将表格转换为思源表格
 */
function addTableRule(turndownService: TurndownService, protyle: IProtyle) {
  turndownService.addRule("table", {
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
}

