import { IProtyle, Menu, showMessage } from "siyuan";
import { setBlockAttrs } from "../../subMod/siyuanPlugin-common/siyuan-api/attr";
import {
  deleteBlock,
  insertBlock,
  updateBlockWithAttr,
} from "../../subMod/siyuanPlugin-common/siyuan-api/block";
import { queryBlockById } from "../../subMod/siyuanPlugin-common/siyuan-api/query";
import { Block } from "../../subMod/siyuanPlugin-common/types/siyuan-api";
//import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";

export function buildTransform(jsBlock: Block) {
  const transform = async (detail: {
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
    const lute = detail.protyle.lute;
    const currentJsBlock = await queryBlockById(jsBlock.id);
    const AsyncFunction = Object.getPrototypeOf(
      async function () {}
    ).constructor;
    const func = new AsyncFunction(
      "input",
      "tools",
      ` 
        ${currentJsBlock.content}
        return { markdown: markdown, attrs: attrs, isDelete: isDelete };
        `
    );
    const outputDoms = await Promise.all(
      input.map(async (e, i, array) => {
        const input = {
          block: e, //当前块
          index: i, //当前块索引
          array, //所有块
          attrs: undefined, //当前块属性
          isDelete: false, //是否删除
        };
        const tools = {
          lute,
        };
        const result = (await func(input, tools)) as typeof input;
        if (!result) {
          return;
        }
        const markdown = result.block.markdown;
        const { attrs } = result;
        const dom = document.createElement("div");
        const oldDom = document.createElement("div");
        oldDom.innerHTML = lute.Md2BlockDOM(e.markdown);
        if (markdown && markdown.trim()) {
          dom.innerHTML = lute.Md2BlockDOM(markdown);
          (dom.firstChild as HTMLDivElement).setAttribute(
            "data-node-id",
            input[i].id
          );
        }
        return { dom, attrs, oldDom, isDelete: result.isDelete };
      })
    );
    let count = 0;
    let preBlockId = input[0].id;
    for (let i = 0; i < outputDoms.length; i++) {
      const { dom, attrs, oldDom, isDelete } = outputDoms[i];
      let updateFlag = false;
      if (isDelete && i !== 0) {
        await deleteBlock(
          { id: input[i].id },
          detail.protyle,
          oldDom.innerHTML,
          input[i].parent_id,
          preBlockId
        );
        continue;
      } else {
        preBlockId = input[i].id;
      }
      for (const block of dom.children) {
        if (!updateFlag) {
          await updateBlockWithAttr(
            {
              dataType: "dom",
              id: input[i].id,
              data: block.outerHTML,
            },
            detail.protyle,
            oldDom.innerHTML
          );
          updateFlag = true;
        } else {
          const res = await insertBlock(
            {
              dataType: "dom",
              previousID: preBlockId,
              data: block.outerHTML,
            },
            detail.protyle
          );
          if (!res) {
            continue;
          }
          preBlockId = res[0]?.doOperations[0]?.id || preBlockId;
        }
      }
      if (attrs) {
        await setBlockAttrs({
          id: input[i].id,
          attrs: attrs,
        });
      }
      count++;
      showMessage(
        `${currentJsBlock.name || ""}已完成${count}/${outputDoms.length}`
      );
    }
  };
  return transform;
}
