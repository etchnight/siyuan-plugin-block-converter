/**
 * *自定义函数输入参数1
 */
interface IFuncInput {
  block: Block; //当前块
  extra: { title: string; attrs: { [key: string]: string } }; //当前文档标题,当前块属性
  index: number; //当前块索引
  array: Block[]; //所有块
  data: string; //输出内容，默认为原块的Markdown内容
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
  lute: Lute;
  executeFunc: (
    input: IFuncInput,
    tools: ITools,
    jsBlock: ISnippet,
    callback?: (file: ISnippet) => Promise<void>
  ) => Promise<{
    input: IFuncInput;
    tools: ITools;
  }>; //执行自定义函数
  prettier: {
    prettier;
    prettierPluginBabel;
    prettierPluginEstree;
    prettierPluginMarkdown;
  };
  siyuanApi;
  turndown: any;
  jsYaml: any;
  getClipboardHtml: () => Promise<string>; //获取剪贴板内容
}

type IAsyncFunc = (
  input: IFuncInput,
  tools: ITools
) => Promise<{ input: IFuncInput; tools: ITools }>;

interface ISnippet {
  isFile: boolean;
  label: string;
  snippet?: string; //将在执行时获取
  path: string; //file专属
  description?: string;
  addStmt?: string; //附加语句
  addStmtDefault?: string; //附加语句默认值
  //output?: string | IUpdateResult[]; //脚本可能会改变，所以不预存结果
  //clipboardHtml?: string; //Paste专属，预存输入
}

/**
 * 数据库查询返回该结果
 * @ial {: [key: string]: string };
 */
type Block = {
  id: BlockId;
  parent_id?: BlockId;
  root_id: DocumentId;
  hash: string;
  box: string;
  path: string;
  hpath: string;
  name: string;
  alias: string;
  memo: string;
  tag: string;
  content: string;
  fcontent?: string;
  markdown: string;
  length: number;
  type: BlockType;
  subtype: BlockSubType;
  ial?: string; //{ [key: string]: string };
  sort: number;
  created: string;
  updated: string;
};
