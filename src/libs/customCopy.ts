import { IProtyle, showMessage } from "siyuan";
import { executeFunc, getArgsByElement, getI18n, ISnippet } from "./common";
//import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";

function buildCopyPreview(jsBlock: ISnippet) {
  const copyPreview = async (
    blockElements: HTMLElement[],
    protyle: IProtyle
  ) => {
    const lute = protyle.lute; //当前编辑器内的lute实例
    const { inputs, tools } = await getArgsByElement(blockElements, lute);
    const results = await Promise.all(
      inputs.map(async (input) => {
        //执行自定义脚本
        const result = await executeFunc(
          input,
          tools,
          input.block.markdown,
          jsBlock
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
  protyle: IProtyle
) {
  const copyPreview = buildCopyPreview(file);
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
  protyle: IProtyle
) {
  const output = await copy(file, blockElements, protyle);
  await navigator.clipboard.writeText(output);
  showMessage(`${output}${getI18n().message_copySuccess}`);
}

export async function previewCopy(
  file: ISnippet,
  blockElements: HTMLElement[],
  protyle: IProtyle
) {
  const blockElementsLimit = blockElements.slice(0, 10); //TODO 可配置
  const output = await copy(file, blockElementsLimit, protyle);
  const lute = protyle.lute;
  return lute.Md2BlockDOM(output);
}
