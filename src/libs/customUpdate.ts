import { IProtyle, showMessage } from "siyuan";
import { setBlockAttrs } from "../../subMod/siyuanPlugin-common/siyuan-api/attr";
import {
  deleteBlock,
  insertBlock,
  updateBlockWithAttr,
} from "../../subMod/siyuanPlugin-common/siyuan-api/block";
import { executeFunc, getArgsByElement, ISnippet } from "./common";
import { store } from "./store";
//import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";

export interface IUpdateResult {
  id: string;
  parentId: string;
  dom: HTMLDivElement;
  attrs: { [key: string]: string };
  oldDom: HTMLDivElement;
  isDelete: boolean;
}

function buildUpdatePreview(jsBlock: ISnippet) {
  const transform = async (
    blockElements: HTMLElement[],
    protyle: IProtyle
  ): Promise<IUpdateResult[]> => {
    const lute = protyle.lute; //当前编辑器内的lute实例
    //*等待store中的waitting状态
    while (store.waitting) {
      await new Promise<void>((resolve, _reject) => {
        setTimeout(resolve, 100);
      });
    }
    //*从数据库中查询出所有块
    const { inputs, tools } = await getArgsByElement(blockElements, lute);
    //*执行自定义脚本并转化为dom结构
    const outputDoms = await Promise.all(
      inputs.map(async (input) => {
        //执行自定义脚本
        const result = await executeFunc(
          input,
          tools,
          input.block.markdown,
          jsBlock
        );
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
          id: input.block.id,
          parentId: input.block.parent_id,
          dom,
          attrs: result.input.extra.attrs,
          oldDom,
          isDelete: result.input.isDelete,
        };
      })
    );
    return outputDoms;
  };
  return transform;
}

export async function execUpdate(
  file: ISnippet,
  blockElements: HTMLElement[],
  protyle: IProtyle
) {
  const updatePreview = buildUpdatePreview(file);
  const outputDoms = await updatePreview(blockElements, protyle);
  //*执行添加、更新、删除操作
  let count = 0;
  let preBlockId = outputDoms[0].id;
  for (let i = 0; i < outputDoms.length; i++) {
    const { id, parentId, dom, attrs, oldDom, isDelete } = outputDoms[i];
    let updateFlag = false;
    if (isDelete && i !== 0) {
      await deleteBlock(
        { id: id },
        protyle,
        oldDom.innerHTML,
        parentId,
        preBlockId
      );
      continue;
    } else {
      preBlockId = id;
    }
    for (const block of dom.children) {
      if (!updateFlag) {
        await updateBlockWithAttr(
          {
            dataType: "dom",
            id: id,
            data: block.outerHTML,
          },
          protyle,
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
          protyle
        );
        if (!res) {
          continue;
        }
        preBlockId = res[0]?.doOperations[0]?.id || preBlockId;
      }
    }
    if (attrs) {
      await setBlockAttrs({
        id: id,
        attrs: attrs,
      });
    }
    count++;
    showMessage(`已完成${count}/${outputDoms.length}`);
  }
  showMessage(`${file.label}更新成功`);
}

export async function previewUpdate(
  file: ISnippet,
  blockElements: HTMLElement[],
  protyle: IProtyle
): Promise<string> {
  const updatePreview = buildUpdatePreview(file);
  const outputDoms = await updatePreview(blockElements, protyle);

  const blocks: HTMLDivElement[] = [];
  for (const output of outputDoms) {
    if (output.isDelete) {
      continue;
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
