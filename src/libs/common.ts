import { Menu } from "siyuan";
import { requestQuerySQL } from "../../subMod/siyuanPlugin-common/siyuan-api/query";
import {
  Block,
  BlockId,
} from "../../subMod/siyuanPlugin-common/types/siyuan-api";
import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";
import { TransactionRes } from "../../subMod/siyuanPlugin-common/siyuan-api/block";

export async function getJsBlocks(docId: BlockId) {
  let jsBlocks = //todo
    (await requestQuerySQL(`SELECT * FROM blocks WHERE blocks.type='c' 
      AND blocks.root_id='${docId}'`)) as Block[];
  jsBlocks = jsBlocks.filter((e) => {
    return (
      e.markdown.startsWith("```js") ||
      e.markdown.startsWith("```javascript") ||
      e.markdown.startsWith("```JavaScript")
    );
  });
  jsBlocks.sort((a, b) => {
    return a.name.localeCompare(b.name, "zh");
  });
  return jsBlocks;
}

export function getCurrentBlock() {
  let nodeElement = getSelection().anchorNode;
  while (nodeElement.nodeType !== 1 && nodeElement.parentElement) {
    nodeElement = nodeElement.parentElement;
  }
  while (
    !(nodeElement as HTMLElement).hasAttribute("data-node-id") &&
    nodeElement.parentElement
  ) {
    nodeElement = nodeElement.parentElement;
  }
  if ((nodeElement as HTMLElement).hasAttribute("data-node-id")) {
    return nodeElement as HTMLElement;
  }
}
export function getSelectedBlocks(
  protyle: IProtyle, //todo 与detail.protyle是否相同
  detail: {
    menu: Menu;
    blockElements: HTMLElement[];
    protyle: IProtyle;
  }
) {
  Object.assign(detail, {
    blockElements: Array.from(
      protyle.wysiwyg.element.querySelectorAll(".protyle-wysiwyg--select")
    ),
    protyle,
  });
  if (detail.blockElements.length === 0) {
    Object.assign(detail, { blockElements: [getCurrentBlock()] });
  }
  return detail;
}

/**
 * 执行insert Block 操作后，获取插入块的id
 * @param res
 */
export function getInsertId(res: TransactionRes[]) {
  let previousId = res[0].doOperations[0].id;
  if (!previousId) {
    const div = document.createElement("div");
    div.innerHTML = res[0].doOperations[0].data;
    previousId = div.firstElementChild.getAttribute("data-node-id");
  }
  return previousId;
}
