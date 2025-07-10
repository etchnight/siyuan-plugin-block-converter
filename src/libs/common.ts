/**
 * 存放一些公共函数
 */
import {
  Dialog,
  IGetDocInfo,
  IProtyle,
  Lute,
  Menu,
  Plugin,
  showMessage,
} from "siyuan";
import {
  Block,
  BlockId,
} from "../../subMod/siyuanPlugin-common/types/siyuan-api";

import {
  getBlockAttrs,
  getDoc,
  getFile,
  queryBlockById,
  readDir,
  requestQuerySQL,
  TransactionRes,
} from "../../subMod/siyuanPlugin-common/siyuan-api";
import * as siyuanApi from "../../subMod/siyuanPlugin-common/siyuan-api";
import * as babel from "@babel/standalone";
//import * as typescript from "@babel/preset-typescript";
//import { protyleUtil } from "./protyle-util";
import { createApp } from "vue";
import ProtyleUtil from "./ProtyleUtil.vue";
import TurndownService from "turndown";
//import extract from "extract-comments";
import { CONSTANTS } from "./constants";
import { i18nObj } from "@/types/i18nObj";
import doctrine from "doctrine-standalone";
import { store } from "./store";

//tools 附加工具库
import * as prettier from "prettier";
import prettierPluginBabel from "prettier/plugins/babel";
import prettierPluginEstree from "prettier/plugins/estree";
import prettierPluginMarkdown from "prettier/plugins/markdown";
import * as jsYaml from "js-yaml";
export function getI18n() {
  const plugin = window.siyuan.ws.app.plugins.find(
    (e) => e.name == CONSTANTS.PluginName
  );
  return plugin.i18n as i18nObj;
}

export function getPlugin() {
  const plugin = window.siyuan.ws.app.plugins.find(
    (e) => e.name == CONSTANTS.PluginName
  );
  return plugin as Plugin;
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
  protyle?: IProtyle
  /*   detail: {
    menu: Menu;
    blockElements?: HTMLElement[];
    data?: IGetDocInfo;
    protyle: IProtyle;
  } */
) {
  //*焦点不在编辑器内
  if (!protyle) {
    protyle = store.protyle;
  }
  //选择多个块
  let blockElements: HTMLElement[] = Array.from(
    protyle.wysiwyg.element.querySelectorAll(".protyle-wysiwyg--select")
  );
  //选择单个块
  if (blockElements.length === 0) {
    const currentBlock = getCurrentBlock();
    if (!currentBlock) {
      showMessage("请选择块"); //todo i18n
      blockElements = [];
    }
    blockElements = [currentBlock];
  }

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
 * @description 从文件或笔记中获取snippet并转为函数
 * 注意，获取了描述中的参数代码并将添加到头部
 * 每次重新获取所需代码
 * @param file
 * @param callback 在生成函数前执行的回调函数，用于显示描述等
 * @returns
 */
export async function buildFunc(
  file: ISnippet,
  callback?: (file: ISnippet) => Promise<void>
): Promise<IAsyncFunc> {
  const ts2js = (tsCode: string) => {
    if (!tsCode) {
      return "";
    }
    tsCode = ["async function main(){", tsCode, "}", "await main()"].join("\n");
    const result = babel.transform(tsCode, {
      plugins: ["transform-typescript"],
    });
    return result.code;
  };
  let jsBlockContent: string = "";
  if (file.path) {
    let filePath = file.path;
    //*相对路径转换为绝对路径，兼容用户输入
    if (!filePath.startsWith("/data")) {
      filePath = CONSTANTS.STORAGE_PATH + filePath;
    }
    jsBlockContent = (await getFile({ path: filePath })) as string;
  }
  const comment = await getComment(jsBlockContent, file);
  file.description = comment?.description || "";
  file.addStmtDefault = comment?.addStmtDefault || "";
  file.addStmt = comment?.addStmt || comment?.addStmtDefault || "";
  //*用于用户在UI中改变additionalStatement、显示描述等
  callback && (await callback(file));
  jsBlockContent = file.addStmt + "\n" + jsBlockContent;
  jsBlockContent = ts2js(jsBlockContent);
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

/**
 * 获取描述、附加语句
 * @param file
 * @returns
 */
export async function getComment(jsBlockContent: string, file: ISnippet) {
  if (!jsBlockContent) {
    return;
  }
  const comments = jsBlockContent.match(/\/\*[\s\S\n]*?\*\//g);
  if (!comments || !comments.length) {
    return;
  }
  const comment = comments.find((comment) => {
    return comment.match("@metadata");
  });
  if (!comment) {
    return;
  }
  //*解析注释
  const ast = doctrine.parse(comment, { unwrap: false, sloppy: true });
  //*获取整体描述
  let description = "";
  try {
    description = ast.tags.find(
      (item) => item.title === "metadata"
    ).description;
  } catch (error) {
    description = ast.description as string;
    const desList = description.split("\n");
    description = desList.slice(2, -1).join("\n");
  }
  //*获取参数描述
  const params = ast.tags.filter((item) => item.title === "param") as {
    title: "param";
    description: string;
    type: {
      type: string; //"OptionalType";
      expression: {
        type: string; //"NameExpression";
        name: string; //"string";
      };
    };
    name: string; // "INDEX_NAME";
    default: string; // '"index"';
  }[];
  let addStmtDefault = ""; //原始值
  if (params.length) {
    const markdowns = params.map((item) => {
      let paraDesc = item.description || "";
      if (paraDesc.endsWith("*/")) {
        paraDesc = paraDesc.slice(0, -2);
      }
      if (paraDesc.startsWith("/*")) {
        paraDesc = paraDesc.slice(2);
      }
      paraDesc = paraDesc.replace(/\r\n/g, "");
      paraDesc = paraDesc.replace(/\n/g, "");
      return `${paraDesc}\n${item.name} = ${item.default}`;
    });
    addStmtDefault = "//需要改变的参数：\n" + markdowns.join("\n"); //todo i18n;
  }
  //*载入自定义配置
  let addStmt = ""; //预设值
  const plugin = getPlugin();
  const key = file.path.replace(CONSTANTS.STORAGE_PATH, "");
  try {
    addStmt = plugin.data["snippetConfig.json"][key].additionalStatement;
  } catch (error) {
    addStmt = "";
  }
  const result = {
    description: description,
    addStmt: addStmt,
    addStmtDefault: addStmtDefault,
  };
  return result;
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
  jsBlock: ISnippet,
  callback?: (file: ISnippet) => Promise<void>
) {
  const func = (await buildFunc(jsBlock, callback)) as IAsyncFunc;
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
    func(input, tools)
      .then((res: { input: IFuncInput; tools: ITools; output: string }) => {
        //reloadFlag = false; //防止刷新
        input = res.input;
        tools = res.tools;
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
    showMessage(`${jsBlock.path}${getI18n().message_error1}`);
    throw new Error(getI18n().message_error);
  }
  return { input, tools };
}

/**
 * 根据块元素从数据库查询块信息，并返回 executeFunc 的入参 Inputs
 * @param blockElements
 * @returns
 */
export async function getInputs(blockElements: HTMLElement[]) {
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
      dataType: "markdown",
      data: e.block.markdown, //当前块内容
    };
    return input_func;
  });
  return inputs;
}
/**
 *
 * @param lute
 * @returns 返回 executeFunc 的入参 tools
 */
export function getTools(lute: Lute) {
  const getClipboardHtml = async () => {
    const content = await navigator.clipboard.read().then((e) => e[0]);
    let blob: Blob;
    if (content.types.includes("text/html")) {
      blob = await content.getType("text/html");
    } else if (content.types.includes("text/plain")) {
      blob = await content.getType("text/plain");
    } else {
      //showMessage(getI18n().message_getClipboardHtml);
      return;
    }
    const html = await blob.text();
    const div = document.createElement("div");
    div.innerHTML = html;
    return html;
  };
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
    jsYaml,
    getClipboardHtml,
  };
  return tools;
}

export function getSnippetType(markdown: string): "js" | "ts" | "other" {
  markdown = markdown.trim();
  const content = markdown.replace(/```/, "");
  if (
    content.startsWith("js") ||
    content.startsWith("javascript") ||
    content.startsWith("Javascript")
  ) {
    return "js";
  } else if (
    content.startsWith("ts") ||
    content.startsWith("typescript") ||
    content.startsWith("Typescript")
  ) {
    return "ts";
  } else {
    return "other";
  }
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
    return getSnippetType(e.markdown) !== "other";
  });
  jsBlocks.sort((a, b) => {
    return a.name.localeCompare(b.name, "zh");
  });
  return jsBlocks;
}

/**
 * 获取所有js文件（指定类型）
 * //@param component
 * @param pathPrefix 路径前缀，末尾需要带/
 * @returns
 */
export async function getJsFiles(
  //component: EComponent,
  pathPrefix: string
) {
  const readDirRecur = async (
    path: string,
    fileList: {
      isDir: boolean;
      //isSymlink: boolean;
      name: string;
      //updated: number;
      path: string;
    }[] = [],
    level = 0
  ) => {
    if (level > 20) {
      return;
    }
    const files = await readDir({ path });
    const filesMap = files.map((file) => {
      return {
        isDir: file.isDir,
        isSymlink: file.isSymlink,
        name: file.name,
        updated: file.updated,
        path: path + file.name,
      };
    });

    for (const file of filesMap) {
      if (file.isDir) {
        await readDirRecur(file.path + "/", fileList, level + 1);
      } else {
        fileList.push(file);
      }
    }
    return fileList;
  };
  let files = await readDirRecur(pathPrefix);
  files = files.filter((file) => {
    return file.path.endsWith(".js") || file.path.endsWith(".ts");
  });
  return files;
}

/**
 * ISnippet初始生成函数，获取笔记和文件中的所有js
 * @param component
 * @param rootId
 * @returns
 */
export async function getAllJs() {
  const files = await getJsFiles(
    CONSTANTS.STORAGE_PATH + CONSTANTS.COMPONENT + "/"
  );
  const snippets: ISnippet[] = files.map((file) => {
    const snippet: ISnippet = {
      label: file.path.replace(
        CONSTANTS.STORAGE_PATH + CONSTANTS.COMPONENT + "/",
        ""
      ), //!
      path: file.path,
      isFile: true,
      //name: file.name,
    };
    return snippet;
  });
  return snippets;
}

/**
 * 弹出对话框
 * @param blockElements 如果是文档，将会根据detail.data.rootID获取
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
  isDocument: boolean = false
) {
  if (isDocument) {
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
  const snippets = await getAllJs();
  const app = createApp(ProtyleUtil, {
    files: snippets,
    blockElements: detail.blockElements,
    protyle: detail.protyle,
    dialog,
  });
  app.mount(container);
}


