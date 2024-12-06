import { IProtyle, Menu, showMessage } from "siyuan";
import { setBlockAttrs } from "../../subMod/siyuanPlugin-common/siyuan-api/attr";
import {
  deleteBlock,
  insertBlock,
  updateBlockWithAttr,
} from "../../subMod/siyuanPlugin-common/siyuan-api/block";
import { Block } from "../../subMod/siyuanPlugin-common/types/siyuan-api";
import { executeFunc, getParaByElement } from "./common";
//import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";

export function buildTransform(jsBlock: Block) {
  const transform = async (detail: {
    menu: Menu;
    blockElements: HTMLElement[];
    protyle: IProtyle;
  }) => {
    const lute = detail.protyle.lute; //当前编辑器内的lute实例

    //*从数据库中查询出所有块
    const { inputs, tools } = await getParaByElement(
      detail.blockElements,
      lute
    );
    //*执行自定义脚本并转化为dom结构
    const outputDoms = await Promise.all(
      inputs.map(async (input) => {
        //执行自定义脚本
        const result = await executeFunc(input, tools, input.block.markdown, {
          id: jsBlock.id, //重新获取以确保获取到最新的脚本
          name: jsBlock.name,
        });
        if (!result) {
          return;
        }
        //将自定义脚本返回的input结构转换为dom结构
        const markdown = result.output;
        const dom = document.createElement("div");
        const oldDom = document.createElement("div");
        oldDom.innerHTML = lute.Md2BlockDOM(input.block.markdown);
        if (markdown && markdown.trim()) {
          dom.innerHTML = lute.Md2BlockDOM(markdown);
          (dom.firstChild as HTMLDivElement).setAttribute(
            "data-node-id",
            input.block.id
          );
        }
        return {
          dom,
          attrs: result.input.extra.attrs,
          oldDom,
          isDelete: result.input.isDelete,
        };
      })
    );
    //*执行添加、更新、删除操作
    let count = 0;
    let preBlockId = inputs[0].block.id;
    for (let i = 0; i < outputDoms.length; i++) {
      const { dom, attrs, oldDom, isDelete } = outputDoms[i];
      let updateFlag = false;
      if (isDelete && i !== 0) {
        await deleteBlock(
          { id: inputs[i].block.id },
          detail.protyle,
          oldDom.innerHTML,
          inputs[i].block.parent_id,
          preBlockId
        );
        continue;
      } else {
        preBlockId = inputs[i].block.id;
      }
      for (const block of dom.children) {
        if (!updateFlag) {
          await updateBlockWithAttr(
            {
              dataType: "dom",
              id: inputs[i].block.id,
              data: block.outerHTML,
            },
            detail.protyle,
            oldDom.innerHTML
          );
          updateFlag = true; //已执行过更新操作，后续操作为插入
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
          id: inputs[i].block.id,
          attrs: attrs,
        });
      }
      count++;
      showMessage(`${jsBlock.name || ""}已完成${count}/${outputDoms.length}`);
    }
  };
  return transform;
}
