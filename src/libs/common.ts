/**
 * 存放一些公共函数
 */
import { Dialog, IGetDocInfo, IProtyle, Lute, Menu, showMessage } from "siyuan";
import { parse } from "@babel/parser";
import {
  Block,
  BlockId,
} from "../../subMod/siyuanPlugin-common/types/siyuan-api";

import {
  getBlockAttrs,
  getDoc,
  getFile,
  insertBlock,
  queryBlockById,
  readDir,
  requestQuerySQL,
  setBlockAttrs,
  TransactionRes,
  updateBlockWithAttr,
} from "../../subMod/siyuanPlugin-common/siyuan-api";
import * as siyuanApi from "../../subMod/siyuanPlugin-common/siyuan-api";
//tools 附加工具库
import * as prettier from "prettier";
import prettierPluginBabel from "prettier/plugins/babel";
import prettierPluginEstree from "prettier/plugins/estree";
import prettierPluginMarkdown from "prettier/plugins/markdown";

import { protyleUtil } from "./protyle-util";
import TurndownService from "turndown";
import extract from "extract-comments";
import { CONSTANTS, EComponent } from "./constants";
import { i18nObj } from "@/types/i18nObj";

export function getI18n() {
  const plugin = window.siyuan.ws.app.plugins.find(
    (e) => e.name == CONSTANTS.PluginName
  );
  return plugin.i18n as i18nObj;
}
/**
 * *获取光标所在块
 * @returns
 */
export function getCurrentBlock(): HTMLElement {
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
  protyle: IProtyle
  /*   detail: {
    menu: Menu;
    blockElements?: HTMLElement[];
    data?: IGetDocInfo;
    protyle: IProtyle;
  } */
) {
  //选择多个块
  let blockElements: HTMLElement[] = Array.from(
    protyle.wysiwyg.element.querySelectorAll(".protyle-wysiwyg--select")
  );
  //选择单个块
  if (blockElements.length === 0) {
    blockElements = [getCurrentBlock()];
  }
  /*   const newDetail = {
    menu: detail.menu,
    blockElements: blockElements,
    protyle: protyle,
  }; */
  return blockElements;
}
/**
 * *执行insert Block 操作后，获取插入块的id
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
export interface ITools {
  [key: string]: any;
}

export type IAsyncFunc = (
  input: IFuncInput,
  tools: ITools,
  output: IOutput
) => Promise<{ input: IFuncInput; tools: ITools; output: IOutput }>;

//export type IFunc = () => TurndownService.Rule[];
/**
 * 自定义函数输入参数3: output，输出，默认为原块的Markdown内容
 */
type IOutput = string; //Markdown文本

/**
 * @deprecated 直接获取文件内容即可，不再使用该函数
 * @param content
 * @returns
 */
const extractScriptPaste = (content: string) => {
  try {
    const ast = parse(content, {
      sourceType: "module",
    });

    const body = ast.program.body;
    const expressions = body.filter((item) => {
      return item.type === "ExpressionStatement";
    });
    if (!expressions.length) return "";
    const rules = expressions.find((item) => {
      return item.expression.type === "ArrayExpression";
    });
    if (!rules) return "";
    const lines = content.split("\n");
    const arrayLines = lines.slice(
      rules.loc.start.line - 1,
      rules.loc.end.line
    );
    return arrayLines.join("\n");
  } catch (e) {
    console.warn(e);
    return "";
  }
};

/**
 * @description 从文件或笔记中获取snippet并转为函数
 *
 * 另外一段描述
 * @param jsBlockId
 * @param name
 * @param jsBlockContent
 * @returns
 */
export async function buildFunc(
  file: ISnippet
  //jsBlockId?: string,
  //name?: string,
  //filePath?: string,
  //snippet?: string,
  //isCustomPaste: boolean
): Promise<IAsyncFunc> {
  //*使用顺序:  Id -> name -> filePath
  let jsBlockContent: string;
  if (file.id) {
    jsBlockContent = (await queryBlockById(file.id)).content;
  } else if (file.name) {
    const resList = await requestQuerySQL(
      `select * from blocks where name = '${file.name}'`
    );
    if (resList.length) {
      jsBlockContent = resList[0].content;
    }
  } else if (file.path) {
    jsBlockContent = await getFile({
      path: "/data/storage/petal/" + CONSTANTS.PluginName + "/" + file.path,
    });
  }
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

  return new AsyncFunction(
    "input",
    "tools",
    "output",
    `
      ${jsBlockContent ? jsBlockContent : ""}
      return { input , tools , output };
      `
  );
}

export async function getComment(file: ISnippet) {
  let jsBlockContent: string;
  if (file.path) {
    jsBlockContent = await getFile({
      path: "/data/storage/petal/" + CONSTANTS.PluginName + "/" + file.path,
    });
  }
  if (!jsBlockContent) {
    return;
  }
  const comments = extract(jsBlockContent) as {
    type: "BlockComment" | "LineComment";
    value: string;
  }[];
  if (!comments.length) {
    return;
  }
  const comment = comments.find((comment) => {
    if (comment.type !== "BlockComment") {
      return false;
    }
    return (
      comment.value.startsWith("@metadata") ||
      comment.value.startsWith("\n@metadata")
    );
  });
  if (!comment) {
    return;
  }
  const commentValue = comment.value.replace("@metadata", "");
  file.description = commentValue;
}

/**
 * *获取、运行自定义函数，并防止超时
 * todo 当主线程阻塞时，会卡住，需要优化
 * @param input
 * @param tools
 * @param jsBlock
 * @returns
 */
export async function executeFunc(
  input: IFuncInput,
  tools: ITools,
  output: string,
  jsBlock: ISnippet
) {
  const func = (await buildFunc(jsBlock)) as IAsyncFunc;
  //let reloadFlag = true;
  let errorFlag = true;
  //超时自动刷新
  const safePromise = new Promise(
    (resolve) =>
      setTimeout(() => {
        resolve(false);
      }, 5000) //todo 可配置
  );
  const customPromise = new Promise((resolve) => {
    func(input, tools, output)
      .then((res: { input: IFuncInput; tools: ITools; output: string }) => {
        //reloadFlag = false; //防止刷新
        input = res.input;
        tools = res.tools;
        output = res.output;
        errorFlag = false; //防止报错
      })
      .finally(() => {
        resolve(true);
        //reloadFlag = false;
      });
  });

  const raceFlag = await Promise.race([customPromise, safePromise]);
  if (!raceFlag) {
    showMessage(getI18n().message_timeout);
    throw new Error(getI18n().message_timeout);
  } else if (errorFlag) {
    showMessage(
      `${jsBlock.name || jsBlock.id || jsBlock.path}${getI18n().message_error1}`
    );
    throw new Error(getI18n().message_error);
  }
  return { input, tools, output };
}

/**
 * 根据块元素从数据库查询块信息，并返回 executeFunc 的入参集合
 * @param blockElements
 * @returns
 */
export async function getArgsByElement(
  blockElements: HTMLElement[],
  lute: Lute
) {
  const inputBlocks = await Promise.all(
    blockElements.map(async (e) => {
      const id = e.getAttribute("data-node-id");
      const block = await queryBlockById(id);
      const doc = await queryBlockById(block.root_id);
      const attrs = await getBlockAttrs({ id }); //JSON.parse(block.ial.replace("{:", "{"))不可行
      //todo 带有其他属性对更新属性的影响未测试
      //attrs.id ? delete attrs.id : null;
      //attrs.updated ? delete attrs.updated : null;
      return {
        block,
        extra: { title: doc.content, attrs },
      };
    })
  );
  const inputs: IFuncInput[] = inputBlocks.map((e, i, array) => {
    //执行自定义脚本
    const input_func: IFuncInput = {
      block: e.block, //当前块
      extra: e.extra, //当前文档标题,当前块属性
      index: i, //当前块索引
      array: array.map((e) => e.block), //所有块
      isDelete: false, //是否删除
      isIgnore: false, //
      //output: e.block.markdown, //输出内容
    };
    return input_func;
  });
  const tools: ITools = {
    lute,
    executeFunc,
    prettier: {
      prettier,
      prettierPluginBabel,
      prettierPluginEstree,
      prettierPluginMarkdown,
    },
    siyuanApi,
    turndown: new TurndownService(),
  };
  return { inputs, tools };
}

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
 * 获取所有js文件（指定类型）
 * @param component
 * @returns
 */
export async function getJsFiles(
  component: EComponent,
  pathPrefix: string = "/data/storage/petal/" + CONSTANTS.PluginName + "/"
) {
  const readDirRecur = async (
    path: string,
    fileList: {
      isDir: boolean;
      //isSymlink: boolean;
      //name: string;
      //updated: number;
      path: string;
    }[] = [],
    level = 0
  ) => {
    if (level > 20) {
      return;
    }
    const files = await readDir({ path: pathPrefix + path });
    const filesMap = files.map((file) => {
      return {
        isDir: file.isDir,
        //isSymlink: file.isSymlink,
        //name: file.name,
        //updated: file.updated,
        path: path + "/" + file.name,
      };
    });
    for (const file of filesMap) {
      if (file.isDir) {
        await readDirRecur(file.path, fileList, level + 1);
      } else {
        fileList.push(file);
      }
    }
    return fileList;
  };
  const files = await readDirRecur(component);
  return files;
}

export interface ISnippet {
  isFile: boolean;
  label: string;
  snippet?: string;
  path?: string; //file专属
  id?: string; //Block块专属
  name?: string; //Block块专属
  description?: string;
  //output?: string | IUpdateResult[]; //脚本可能会改变，所以不预存结果
  //clipboardHtml?: string; //Paste专属，预存输入
}

/**
 * ISnippet初始生成函数，获取笔记和文件中的所有js
 * @param component
 * @param rootId
 * @returns
 */
export async function getAllJs(component: EComponent, rootId: string) {
  const files = await getJsFiles(component);
  const snippets: ISnippet[] = files.map((file) => {
    return {
      label: file.path.replace(component + "/", ""), //!
      path: file.path,
      isFile: true,
      //name: file.name,
    };
  });
  const jsBlocks = await getJsBlocks(rootId);
  jsBlocks.forEach((jsBlock) => {
    snippets.push({
      label: jsBlock.name || jsBlock.content.substring(0, 20),
      isFile: false,
      snippet: jsBlock.content,
      id: jsBlock.id,
      name: jsBlock.name,
      description: jsBlock.memo,
    });
  });
  return snippets;
}

/**
 * 弹出对话框
 * @param blockElements
 * @param protyle
 * @returns
 */
export async function protyleUtilDialog(
  detail: {
    menu: Menu;
    blockElements?: HTMLElement[];
    data?: IGetDocInfo;
    protyle: IProtyle;
  },
  rootId: string,
  component: EComponent,
  isdocument: boolean = false
) {
  if (isdocument) {
    const res = await getDoc({ id: detail.data.rootID });
    const div = document.createElement("div");
    div.innerHTML = res.content;
    const children = div.children;
    const content: HTMLElement[] = [];
    for (const child of children) {
      content.push(child as HTMLElement);
    }
    detail.blockElements = content;
  }
  //* dialog方案
  //menu.submenu = this.blockCustomCopySubmenus;
  const dialog = new Dialog({
    content: "<div class='container'></div>",
    hideCloseIcon: true,
  });
  const container = dialog.element.querySelector(".container");
  if (!container) {
    return;
  }
  const snippets = await getAllJs(component, rootId);
  const protyleUtilDiv = protyleUtil(
    snippets,
    detail.blockElements,
    detail.protyle,
    dialog,
    component
  );
  container.appendChild(protyleUtilDiv);
  //console.log(container);
  //* menu方案
  /*
        //* 等待原菜单消失
        const commonMenu = document.getElementById("commonMenu");
        let count = 0;
        while (commonMenu && count < 20) {
          await new Promise<void>((resolve, _reject) => {
            setTimeout(resolve, 100);
          });
          count++;
          if (commonMenu.classList.contains("fn__none")) {
            break;
          }
        }
        const menu2 = new Menu("sdhsjah");
        menu2.addItem({
          label: "test",
          click: () => {
            console.log("test");
          },
        });
        menu2.open({ x: 100, y: 100 }); */
}

/**
 * - 自定义粘贴和自定义更新使用
 * - 将输入输出的markdown转换为dom
 *
 * @param input markdown
 * @param result markdown
 * @param protyle
 * @returns
 */
export const result2BlockDom = (
  input: IFuncInput,
  output: IOutput,
  protyle: IProtyle
) => {
  //将自定义脚本返回的input结构转换为dom结构
  const dom = document.createElement("div");
  const oldDom = document.createElement("div");
  oldDom.innerHTML = protyle.lute.Md2BlockDOM(input.block.markdown);
  if (output && output.trim()) {
    dom.innerHTML = protyle.lute.Md2BlockDOM(output);
    (dom.firstChild as HTMLDivElement).setAttribute(
      "data-node-id",
      input.block.id
    );
  }
  return {
    dom,
    oldDom,
  };
};

export interface IUpdateResult {
  id: string;
  parentId: string;
  dom: HTMLDivElement; //是一个div，其children可能包含多个block div 节点
  attrs: { [key: string]: string };
  oldDom: HTMLDivElement;
  isDelete: boolean;
  isIgnore: boolean;
}

//* 见IUpdateResult的解释，dom可能包含多个block div节点
export async function updateByDoms(
  outputDom: IUpdateResult,
  protyle: IProtyle,
  preBlockId: string
) {
  const { id, dom, attrs, oldDom } = outputDom;
  let updateFlag = false;
  for (const block of dom.children) {
    if (!updateFlag) {
      await updateBlockWithAttr(
        {
          dataType: "dom",
          id: id,
          data: block.outerHTML,
        },
        protyle,
        oldDom.innerHTML
      );
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
      id: id,
      attrs: attrs,
    });
  }
  return preBlockId;
}
