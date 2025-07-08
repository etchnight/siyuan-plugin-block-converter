import { IProtyle, showMessage } from "siyuan";
import { executeFunc, getInputs, getTools, getI18n, ISnippet } from "./common";
import { store } from "./store";
//import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";

function buildCopyPreview(
  jsBlock: ISnippet,
  callback?: (file: ISnippet) => Promise<void>
) {
  const copyPreview = async (
    blockElements: HTMLElement[],
    protyle: IProtyle
  ) => {
    const lute = protyle.lute; //当前编辑器内的lute实例
    const inputs = await getInputs(blockElements);
    const tools = getTools(lute);
    const results = await Promise.all(
      inputs.map(async (input) => {
        //执行自定义脚本
        const result = await executeFunc(
          input,
          tools,
          input.block.markdown,
          jsBlock,
          callback
        );
        return result;
      })
    );
    const output = results.reduce((prev, curr) => {
      return prev + curr.output;
    }, "");
    return output;
  };
  return copyPreview;
}

async function copy(
  file: ISnippet,
  blockElements: HTMLElement[],
  protyle: IProtyle,
  callback?: (file: ISnippet) => Promise<void>
) {
  const copyPreview = buildCopyPreview(file, callback);
  const output = await copyPreview(blockElements, protyle);
  return output;
}

/**
 * 将copyPreview函数的运行结果写入剪贴板
 * @param jsBlock
 * @returns
 */
export async function execCopy(
  file: ISnippet,
  blockElements: HTMLElement[],
  protyle: IProtyle,
  callback?: (file: ISnippet) => Promise<void>
) {
  const output = await copy(file, blockElements, protyle, callback);
  await navigator.clipboard.writeText(output);
  showMessage(`${output}${getI18n().message_copySuccess}`);
}

export async function previewCopy(
  file: ISnippet,
  blockElements: HTMLElement[],
  protyle: IProtyle,
  callback?: (file: ISnippet) => Promise<void>
) {
  const blockElementsLimit = store.previewLimit
    ? blockElements.slice(0, store.previewLimit)
    : blockElements;
  const output = await copy(file, blockElementsLimit, protyle, callback);
  const lute = protyle.lute;
  return lute.Md2BlockDOM(output);
}
