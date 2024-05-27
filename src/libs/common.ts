import { Menu } from "siyuan";
import { requestQuerySQL } from "../../subMod/siyuanPlugin-common/siyuan-api/query";
import {
  Block,
  BlockId,
} from "../../subMod/siyuanPlugin-common/types/siyuan-api";
import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";

export async function getJsBlocks(docId: BlockId) {
  const jsBlocks = //todo
    (await requestQuerySQL(`SELECT * FROM blocks WHERE blocks.type='c' 
      AND blocks.root_id='${docId}'`)) as Block[];
  const submenuBlocks = jsBlocks.filter((e) => {
    return (
      e.markdown.startsWith("```js") ||
      e.markdown.startsWith("```javascript") ||
      e.markdown.startsWith("```JavaScript")
    );
  });
  return submenuBlocks;
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
  protyle: IProtyle,//todo 与detail.protyle是否相同
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
