import { IProtyle, Menu, showMessage } from "siyuan";
import { queryBlockById } from "../../subMod/siyuanPlugin-common/siyuan-api/query";
import { Block } from "../../subMod/siyuanPlugin-common/types/siyuan-api";
//import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";

export function buildCopy(jsBlock: Block) {
  const copy = async (detail: {
    menu: Menu;
    blockElements: HTMLElement[];
    protyle: IProtyle;
  }) => {
    const input = await Promise.all(
      detail.blockElements.map(async (e) => {
        const id = e.getAttribute("data-node-id");
        const block = await queryBlockById(id);
        const doc = await queryBlockById(block.root_id);
        return {
          ...block,
          title: doc.content,
        };
      })
    );
    const currentJsBlock = await queryBlockById(jsBlock.id);
    const AsyncFunction = Object.getPrototypeOf(
      async function () {}
    ).constructor;
    const func = new AsyncFunction(
      "input",
      "index",
      "inputArray",
      "Lute",
      ` 
        let { title, name, content, markdown,id } = input;
        ${currentJsBlock.content}
      `
    );
    let result = "";
    for (let i = 0; i < input.length; i++) {
      result += await func(input[i], i, input, detail.protyle.lute);
    }
    await navigator.clipboard.writeText(result);
    showMessage(`${result}已写入剪贴板`);
  };
  return copy;
}
