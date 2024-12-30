import { IProtyle, showMessage } from "siyuan";
import { executeFunc, getParaByElement, ISnippet } from "./common";
//import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";

export function buildCopyPreview(jsBlock: ISnippet) {
  const copyPreview = async (
    blockElements: HTMLElement[],
    protyle: IProtyle
  ) => {
    const lute = protyle.lute; //当前编辑器内的lute实例
    const { inputs, tools } = await getParaByElement(blockElements, lute);
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

/**
 * 将copyPreview函数的运行结果写入剪贴板
 * @param jsBlock
 * @returns
 */
export async function execCopy(output: string) {
  await navigator.clipboard.writeText(output);
  showMessage(`${output}已写入剪贴板`);
}
