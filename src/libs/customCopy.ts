import { IProtyle, Menu, showMessage } from "siyuan";
import { Block } from "../../subMod/siyuanPlugin-common/types/siyuan-api";
import { executeFunc, getParaByElement } from "./common";
//import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";

export function buildCopy(jsBlock: Block) {
  const copy = async (detail: {
    menu: Menu;
    blockElements: HTMLElement[];
    protyle: IProtyle;
  }) => {
    const lute = detail.protyle.lute; //当前编辑器内的lute实例
    const { inputs, tools } = await getParaByElement(
      detail.blockElements,
      lute
    );
    const results = await Promise.all(
      inputs.map(async (input) => {
        //执行自定义脚本
        const result = await executeFunc(input, tools, input.block.markdown, {
          id: jsBlock.id, //重新获取以确保获取到最新的脚本
        });
        return result;
      })
    );
    const output = results.reduce((prev, curr) => {
      return prev + curr.output;
    }, "");
    await navigator.clipboard.writeText(output);
    showMessage(`${output}已写入剪贴板`);
  };
  return copy;
}
