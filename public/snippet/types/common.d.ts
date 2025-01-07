/**
 * *自定义函数输入参数1
 */
interface IFuncInput {
  block: Block; //当前块
  extra: { title: string; attrs: { [key: string]: string } }; //当前文档标题,当前块属性
  index: number; //当前块索引
  array: Block[]; //所有块
  /*是否删除，默认为false
  在自定义更新中使用时，表示是否删除当前块
  在自定义粘贴中使用时，表示是否清空当前块再粘贴*/
  isDelete: boolean;
  /*是否忽略，默认为false
  在自定义更新中使用，true 表示不进行任何操作，比output原样输出安全，优先于isDelete
  在自定义粘贴中使用时，表示是否执行最后的转换操作，有executeFunc语句时需要设置为 true*/
  isIgnore: boolean;
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

//export type IFunc = () => TurndownService.Rule[];
/**
 * 自定义函数输入参数3: output，输出，默认为原块的Markdown内容
 */
type IOutput = string; //Markdown文本
