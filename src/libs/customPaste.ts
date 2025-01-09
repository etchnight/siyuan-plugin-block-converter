import {
  executeFunc,
  getArgsByElement,
  getI18n,
  ISnippet,
  IUpdateResult,
  result2BlockDom,
  updateByDoms,
} from "./common";
import { IProtyle, showMessage } from "siyuan";
import { EComponent } from "./constants";
import { insertBlock } from "../../subMod/siyuanPlugin-common/siyuan-api";
import { store } from "./store";

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
  const div = document.createElement("div");
  div.innerHTML = html;
  console.warn(`[${EComponent.Paste}-Input]`, div);
  return html;
}

//*html块转普通Block
const htmlBlock2text = (domText: string) => {
  const parentDom = document.createElement("div");
  parentDom.innerHTML = domText;
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
};
async function paste(
  file: ISnippet,
  blockElements: HTMLElement[],
  protyle: IProtyle
): Promise<IUpdateResult[]> {
  //*粘贴组件可能会因剪贴板内容不同而不同
  const html = await getClipboardHtml();
  /*const turndownService = new TurndownService();
  addTableRule(turndownService, protyle);
  const rules = await buildCustomRule(file);
  let count = 0;
  for (const rule of rules) {
    count++;
    turndownService.addRule("rule" + count, rule);
  }
  const markdown = turndownService.turndown(html);*/
  const lute = protyle.lute; //当前编辑器内的lute实例
  const { inputs, tools } = await getArgsByElement(blockElements, lute);
  const result = await executeFunc(inputs[0], tools, html, file);
  console.warn(`[${EComponent.Paste}-Output]\n`, result.output);
  //* 通过两次转换将markdown拆分成多个块
  let domText = lute.Md2BlockDOM(result.output);
  domText = htmlBlock2text(domText);
  const div = document.createElement("div");
  div.innerHTML = domText;

  let i = 0;
  const outputDoms = inputs.map((input) => {
    const output = div.children[i]
      ? lute.BlockDOM2Md(div.children[i].outerHTML)
      : "";
    const { dom, oldDom } = result2BlockDom(input, output, protyle);

    i++;
    //执行自定义脚本
    return {
      id: input.block.id,
      parentId: input.block.parent_id,
      dom,
      attrs: result.input.extra.attrs,
      oldDom,
      isDelete: result.input.isDelete,
      isIgnore: result.input.isIgnore,
      //dataType: result.input.dataType,
    };
  });
  //*剩余的分配到最后一个
  for (i; i < div.children.length; i++) {
    outputDoms[outputDoms.length - 1].dom.append(div.children[i]);
  }
  return outputDoms;
}

export async function previewPaste(
  file: ISnippet,
  blockElements: HTMLElement[],
  protyle: IProtyle
) {
  const blockElementsLimit = store.previewLimit
    ? blockElements.slice(0, store.previewLimit)
    : blockElements;
  const outputDoms = await paste(file, blockElementsLimit, protyle);
  const blocks: HTMLDivElement[] = [];
  for (const output of outputDoms) {
    if (!output.isDelete) {
      blocks.push(output.oldDom);
    }
    blocks.push(output.dom);
  }
  const blocksHtml: string[] = blocks.map((block) => {
    const div = document.createElement("div");
    div.appendChild(block);
    return block.outerHTML;
  });
  return blocksHtml.join("");
}
export async function execPaste(
  file: ISnippet,
  blockElements: HTMLElement[],
  //html: string,
  protyle: IProtyle
) {
  const outputDoms = await paste(file, blockElements, protyle);
  //*执行添加、更新操作
  let count = 0;
  for (let i = 0; i < outputDoms.length; i++) {
    count++;
    const { id, dom, isDelete } = outputDoms[i];
    if (isDelete) {
      //*更新
      await updateByDoms(outputDoms[i], protyle, id);
    } else {
      //*插入粘贴的内容
      for (const block of dom.children) {
        block.setAttribute("data-node-id", window.Lute.NewNodeID());
        await insertBlock(
          { dataType: "dom", data: block.outerHTML, previousID: id },
          protyle
        );
      }
    }
    showMessage(`${getI18n().message_completed}${count}/${outputDoms.length}`);
  }
}

/* 构建自定义规则
async function buildCustomRule(jsBlock: ISnippet) {
  const func = await buildFunc(jsBlock, true);
  const rules = func();
  if (!rules) {
    return [];
  }
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
*/
