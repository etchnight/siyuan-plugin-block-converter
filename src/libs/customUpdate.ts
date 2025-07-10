import { IProtyle, showMessage } from "siyuan";
import { executeFunc, getInputs, getTools, getI18n } from "./common";
import { store } from "./store";
import {
  deleteBlock,
  insertBlock,
  setBlockAttrs,
  updateBlockWithAttr,
} from "../../subMod/siyuanPlugin-common/siyuan-api";
//import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";

interface IUpdateResult {
  newId: string;
  oldId: string;
  parentId: string;
  dom: HTMLDivElement; //是一个div，其children可能包含多个block div 节点
  attrs: { [key: string]: string };
  oldDom: HTMLDivElement;
  isDelete: boolean;
  isIgnore: boolean;
  //dataType: "dom" | "markdown";
}

/**
 * 将自定义脚本输出的markdown转换为dom
 *
 * @param input markdown
 * @param result markdown
 * @param protyle
 * @returns
 */
const result2BlockDom = (input: IFuncInput, protyle: IProtyle) => {
  //将原有块转换为dom结构
  const oldDom = document.createElement("div");
  oldDom.innerHTML = protyle.lute.Md2BlockDOM(input.block.markdown);
  //将自定义脚本返回的input结构转换为dom结构
  const dom = document.createElement("div");
  if (input.data && input.data.trim()) {
    if (input.dataType === "markdown") {
      dom.innerHTML = protyle.lute.Md2BlockDOM(input.data);
      (dom.firstChild as HTMLDivElement).setAttribute(
        "data-node-id",
        input.block.id
      );
    } else if (input.dataType === "dom") {
      dom.innerHTML = input.data;
    }
  }
  return {
    dom,
    oldDom,
  };
};

const buildUpdatePreview = (
  jsBlock: ISnippet,
  callback?: (file: ISnippet) => Promise<void>
) => {
  /**
   *
   * @param blockElements
   * @param protyle
   * @returns
   */
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
        const result = await executeFunc(input, tools, jsBlock, callback);
        if (!result) {
          return;
        }
        const { dom, oldDom } = result2BlockDom(input, protyle);
        return {
          oldId: input.block.id,
          newId: (dom.firstChild as HTMLElement).getAttribute("data-node-id"),
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
};

const update = async (
  file: ISnippet,
  blockElements: HTMLElement[],
  protyle: IProtyle,
  callback?: (file: ISnippet) => Promise<void>
) => {
  const updatePreview = buildUpdatePreview(file, callback);
  const outputDoms = await updatePreview(blockElements, protyle);
  return outputDoms;
};

/**
 * 所有块的更新操作
 * @param file
 * @param blockElements
 * @param protyle
 * @param callback
 */
export const execUpdate = async (
  file: ISnippet,
  blockElements: HTMLElement[],
  protyle: IProtyle,
  callback?: (file: ISnippet) => Promise<void>
) => {
  const outputDoms = await update(file, blockElements, protyle, callback);
  //*执行添加、更新、删除操作
  let count = 0;
  let preBlockId = outputDoms[0].newId;
  for (let i = 0; i < outputDoms.length; i++) {
    count++;
    const { oldId, parentId, oldDom, isDelete, isIgnore } = outputDoms[i];
    if (isIgnore) {
      preBlockId = oldId;
      continue;
    }
    if (isDelete && i !== 0) {
      await deleteBlock(
        { id: oldId },
        protyle,
        oldDom.innerHTML,
        parentId,
        preBlockId
      );
    } else {
      preBlockId = await updateByDoms(outputDoms[i], protyle, preBlockId);
    }
    showMessage(`${getI18n().message_completed}${count}/${outputDoms.length}`);
  }
  showMessage(`${file.label}${getI18n().message_updateSuccess}`);
};

export const previewUpdate = async (
  file: ISnippet,
  blockElements: HTMLElement[],
  protyle: IProtyle,
  callback?: (file: ISnippet) => Promise<void>
) => {
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
};

/**
 * 执行单个返回结果的插入、更新操作
 * @param outputDom
 * @param protyle
 * @param preBlockId
 * @returns
 */
const updateByDoms = async (
  outputDom: IUpdateResult,
  protyle: IProtyle,
  preBlockId: string
) => {
  const { newId, oldId, dom, attrs } = outputDom;
  let updateFlag = false;
  for (const block of dom.children) {
    if (!updateFlag) {
      await updateBlockWithAttr({
        dataType: "dom",
        newId: newId,
        oldId: oldId,
        data: block.outerHTML,
      });
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
      id: newId,
      attrs: attrs,
    });
  }
  return preBlockId;
};
