import { IProtyle, showMessage } from "siyuan";
import {
  executeFunc,
  getInputs,
  getTools,
  getI18n,
  ISnippet,
  IUpdateResult,
  result2BlockDom,
  updateByDoms,
} from "./common";
import { store } from "./store";
import { deleteBlock } from "../../subMod/siyuanPlugin-common/siyuan-api";
//import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";

function buildUpdatePreview(
  jsBlock: ISnippet,
  callback?: (file: ISnippet) => Promise<void>
) {
  const transform = async (
    blockElements: HTMLElement[],
    protyle: IProtyle
  ): Promise<IUpdateResult[]> => {
    const lute = protyle.lute; //当前编辑器内的lute实例
    //*等待store中的waiting状态
    //while (store.waiting) {
    await new Promise<void>((resolve, _reject) => {
      setTimeout(resolve, 100);
    });
    //}
    //*从数据库中查询出所有块
    const inputs = await getInputs(blockElements);
    const tools = getTools(lute);
    //*执行自定义脚本并转化为dom结构
    const outputDoms = await Promise.all(
      inputs.map(async (input) => {
        //执行自定义脚本
        const result = await executeFunc(
          input,
          tools,
          input.block.markdown,
          jsBlock,
          callback
        );
        if (!result) {
          return;
        }
        const { dom, oldDom } = result2BlockDom(input, result.output, protyle);
        return {
          id: input.block.id,
          parentId: input.block.parent_id,
          dom,
          attrs: result.input.extra.attrs,
          oldDom,
          isDelete: result.input.isDelete,
          isIgnore: result.input.isIgnore,
        };
      })
    );
    return outputDoms;
  };
  return transform;
}
async function update(
  file: ISnippet,
  blockElements: HTMLElement[],
  protyle: IProtyle,
  callback?: (file: ISnippet) => Promise<void>
) {
  const updatePreview = buildUpdatePreview(file, callback);
  const outputDoms = await updatePreview(blockElements, protyle);
  return outputDoms;
}

export async function execUpdate(
  file: ISnippet,
  blockElements: HTMLElement[],
  protyle: IProtyle,
  callback?: (file: ISnippet) => Promise<void>
) {
  const outputDoms = await update(file, blockElements, protyle, callback);
  //*执行添加、更新、删除操作
  let count = 0;
  let preBlockId = outputDoms[0].id;
  for (let i = 0; i < outputDoms.length; i++) {
    count++;
    const { id, parentId, oldDom, isDelete, isIgnore } = outputDoms[i];
    if (isIgnore) {
      preBlockId = id;
      continue;
    }
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
    preBlockId = await updateByDoms(outputDoms[i], protyle, preBlockId);
    showMessage(`${getI18n().message_completed}${count}/${outputDoms.length}`);
  }
  showMessage(`${file.label}${getI18n().message_updateSuccess}`);
}

export async function previewUpdate(
  file: ISnippet,
  blockElements: HTMLElement[],
  protyle: IProtyle,
  callback?: (file: ISnippet) => Promise<void>
) {
  const blockElementsLimit = store.previewLimit
    ? blockElements.slice(0, store.previewLimit)
    : blockElements;
  const outputDoms = await update(file, blockElementsLimit, protyle, callback);
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
