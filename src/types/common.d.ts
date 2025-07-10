import { Block } from "../../subMod/siyuanPlugin-common/types/siyuan-api";
/**
 * *自定义函数输入参数1
 */
interface IFuncInput {
  block: Block; //当前块
  extra: { title: string; attrs: { [key: string]: string } }; //当前文档标题,当前块属性
  index: number; //当前块索引
  array: Block[]; //所有块
  /*是否删除，默认为false*/
  isDelete: boolean;
  /*是否忽略，默认为false*/
  isIgnore: boolean;
  dataType: "dom" | "markdown"; //返回值的类型,默认为markdown
}

/**
 * *自定义函数输入参数2
 */
interface ITools {
  [key: string]: any;
}

type IAsyncFunc = (
  input: IFuncInput,
  tools: ITools,
  output: IOutput
) => Promise<{ input: IFuncInput; tools: ITools; output: IOutput }>;

/**
 * 自定义函数输入参数3: output，输出，默认为原块的Markdown内容
 */
type IOutput = string; //Markdown文本
