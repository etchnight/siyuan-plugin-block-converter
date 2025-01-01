import TurndownService from "turndown";
//import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";
import { buildSyTableBlocks } from "./tableTransfer";
import {
  buildFunc,
  getCurrentBlock,
  getI18n,
  IFunc,
  ISnippet,
} from "./common";
import { IProtyle, showMessage } from "siyuan";
import { EComponent } from "./constants";
import { insertBlock } from "../../subMod/siyuanPlugin-common/siyuan-api";

async function getClipboardHtml() {
  const content = await navigator.clipboard.read().then((e) => e[0]);
  let blob: Blob;
  if (content.types.includes("text/html")) {
    blob = await content.getType("text/html");
  } else if (content.types.includes("text/plain")) {
    blob = await content.getType("text/plain");
  } else {
    showMessage(getI18n().message_getClipboardHtml);
    return;
  }
  const html = await blob.text();
  console.warn(`[${EComponent.Paste}]`, { html });
  return html;
}

async function paste(
  //previousId: BlockId,
  file: ISnippet,
  //html: string,
  protyle: IProtyle
) {
  //*粘贴组件可能会因剪贴板内容不同而不同
  const html = await getClipboardHtml();
  const turndownService = new TurndownService();
  addTableRule(turndownService, protyle);
  const rules = await buildCustomRule(file);
  let count = 0;
  for (const rule of rules) {
    count++;
    turndownService.addRule("rule" + count, rule);
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
  return parentDom.innerHTML;
}

export async function previewPaste(
  file: ISnippet,
  //html: string,
  protyle: IProtyle
) {
  return await paste(file, protyle);
  //return file.output as string;
}
export async function execPaste(
  file: ISnippet,
  //html: string,
  protyle: IProtyle,
  output?: string
) {
  //console.warn(`[customPaste]`, { markdown });
  const previousBlock = getCurrentBlock();
  const previousId = previousBlock.getAttribute("data-node-id");
  if (!output) {
    output = await paste(file, protyle);
  }
  //*插入粘贴的内容
  await insertBlock(
    { dataType: "dom", data: output as string, previousID: previousId },
    protyle
  );
}

async function buildCustomRule(jsBlock: ISnippet) {
  const func = (await buildFunc(jsBlock, true)) as IFunc;
  const rules = func();
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
