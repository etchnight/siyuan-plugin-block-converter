import {
  queryBlockById,
  requestQuerySQL,
} from "../../subMod/siyuanPlugin-common/siyuan-api/query";
import { Block } from "../../subMod/siyuanPlugin-common/types/siyuan-api";

export interface IFuncInput {
  block: Block; //当前块
  extra: { title: string; attrs: { [key: string]: string } }; //当前文档标题,当前块属性
  index: number; //当前块索引
  array: Block[]; //所有块
  isDelete: boolean; //是否删除
}
export interface ITools {
  [key: string]: any;
}
export async function getSnippet(
  jsBlockId?: string,
  name?: string,
  jsBlockContent?: string
): Promise<
  (
    input: IFuncInput,
    tools: ITools
  ) => Promise<{ input: IFuncInput; tools: ITools }>
> {
  //let currentJsBlock: Block;
  // 优先使用jsBlockId
  if (jsBlockId && !jsBlockContent) {
    jsBlockContent = (await queryBlockById(jsBlockId)).content;
  } else if (name) {
    const resList = await requestQuerySQL(
      `select * from blocks where name = '${name}'`
    );
    if (resList.length) {
      jsBlockContent = resList[0].content;
    }
  }

  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  return new AsyncFunction(
    "input",
    "tools",
    ` 
    ${jsBlockContent ? jsBlockContent : ""}
    return { input , tools };
    `
  );
}

export async function executeFunc(
  input: IFuncInput,
  tools: ITools,
  jsBlock: {
    id?: string;
    name?: string;
    content?: string;
  }
) {
  const func = await getSnippet(jsBlock.id, jsBlock.name, jsBlock.content);
  let reloadFlag = true;
  //超时自动刷新
  const safePromise = new Promise((_resolve) =>
    setTimeout(() => {
      reloadFlag ? location.reload() : "";
    }, 5000)//todo 可配置
  );
  const customPromise = func(input, tools)
    .then((res: { input: IFuncInput; tools: ITools }) => {
      reloadFlag = false; //防止刷新
      input = res.input;
      tools = res.tools;
    })
    .finally(() => {
      reloadFlag = false;
    });
  await Promise.race([customPromise, safePromise]);
  return { input, tools };
}
