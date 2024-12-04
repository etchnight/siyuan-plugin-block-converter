/**
 * 存放一些公共函数
 */
import { IProtyle, Menu } from "siyuan";
import {
  requestQuerySQL,
  queryBlockById,
} from "../../subMod/siyuanPlugin-common/siyuan-api/query";
import {
  Block,
  BlockId,
} from "../../subMod/siyuanPlugin-common/types/siyuan-api";
//import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";
import { TransactionRes } from "../../subMod/siyuanPlugin-common/siyuan-api/block";

/**
 * *获取指定文档下的所有js块
 * @param docId 
 * @returns 
 */
export async function getJsBlocks(docId: BlockId) {
  let jsBlocks = //todo
    (await requestQuerySQL(`SELECT * FROM blocks WHERE blocks.type='c' 
      AND blocks.root_id='${docId}'`)) as Block[];
  jsBlocks = jsBlocks.filter((e) => {
    return (
      e.markdown.startsWith("```js") ||
      e.markdown.startsWith("```javascript") ||
      e.markdown.startsWith("```JavaScript")
    );
  });
  jsBlocks.sort((a, b) => {
    return a.name.localeCompare(b.name, "zh");
  });
  return jsBlocks;
}

/**
 * *获取光标所在块
 * @returns 
 */
export function getCurrentBlock() {
  let nodeElement = getSelection().anchorNode;
  while (nodeElement.nodeType !== 1 && nodeElement.parentElement) {
    nodeElement = nodeElement.parentElement;
  }
  while (
    !(nodeElement as HTMLElement).hasAttribute("data-node-id") &&
    nodeElement.parentElement
  ) {
    nodeElement = nodeElement.parentElement;
  }
  if ((nodeElement as HTMLElement).hasAttribute("data-node-id")) {
    return nodeElement as HTMLElement;
  }
}

/**
 * *获取选中的所有块
 */
export function getSelectedBlocks(
  protyle: IProtyle, //todo 与detail.protyle是否相同
  detail: {
    menu: Menu;
    blockElements: HTMLElement[];
    protyle: IProtyle;
  }
) {
  Object.assign(detail, {
    blockElements: Array.from(
      protyle.wysiwyg.element.querySelectorAll(".protyle-wysiwyg--select")
    ),
    protyle,
  });
  if (detail.blockElements.length === 0) {
    Object.assign(detail, { blockElements: [getCurrentBlock()] });
  }
  return detail;
}

/**
 * 执行insert Block 操作后，获取插入块的id
 * @param res
 */
export function getInsertId(res: TransactionRes[]) {
  let previousId = res[0].doOperations[0].id;
  if (!previousId) {
    const div = document.createElement("div");
    div.innerHTML = res[0].doOperations[0].data;
    previousId = div.firstElementChild.getAttribute("data-node-id");
  }
  return previousId;
}

/**
 * *自定义函数输入参数1
 */
export interface IFuncInput {
  block: Block; //当前块
  extra: { title: string; attrs: { [key: string]: string } }; //当前文档标题,当前块属性
  index: number; //当前块索引
  array: Block[]; //所有块
  isDelete: boolean; //是否删除
}

/**
 * *自定义函数输入参数2
 */
export interface ITools {
  [key: string]: any;
}

/**
 * *获取指定js块并转为函数
 * @param jsBlockId 
 * @param name 
 * @param jsBlockContent 
 * @returns 
 */
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
  //*使用顺序：jsBlockContent -> jsBlockId -> name
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

/**
 * *运行自定义函数，并防止超时
 * @param input 
 * @param tools 
 * @param jsBlock 
 * @returns 
 */
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
  const safePromise = new Promise(
    (_resolve) =>
      setTimeout(() => {
        reloadFlag ? location.reload() : "";
      }, 5000) //todo 可配置
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
