/**
 * 存放一些公共函数
 */
import { Dialog, IGetDocInfo, IProtyle, Lute, Menu, showMessage } from "siyuan";
import {
  requestQuerySQL,
  queryBlockById,
} from "../../subMod/siyuanPlugin-common/siyuan-api/query";
import {
  Block,
  BlockId,
} from "../../subMod/siyuanPlugin-common/types/siyuan-api";
import { TransactionRes } from "../../subMod/siyuanPlugin-common/siyuan-api/block";
import { getBlockAttrs } from "../../subMod/siyuanPlugin-common/siyuan-api/attr";

//tools 附加工具库
import * as prettier from "prettier";
import prettierPluginBabel from "prettier/plugins/babel";
import prettierPluginEstree from "prettier/plugins/estree";
import prettierPluginMarkdown from "prettier/plugins/markdown";
import {
  getFile,
  readDir,
} from "../../subMod/siyuanPlugin-common/siyuan-api/file";
import { protyleUtil } from "./protyle-util";
import { IUpdateResult } from "./customUpdate";

/**
 * 组件的名称，用于函数参数等
 */
export enum EComponent {
  Copy = "blockCustomCopy",
  Update = "blockCustomUpdate",
  Paste = "CustomPaste",
}
export const PluginName = "siyuan-plugin-block-converter"; //用于id等

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
    blockElements?: HTMLElement[];
    data?: IGetDocInfo;
    protyle: IProtyle;
  }
) {
  //选择多个块
  let blockElements: HTMLElement[] = Array.from(
    protyle.wysiwyg.element.querySelectorAll(".protyle-wysiwyg--select")
  );
  //选择单个块
  if (blockElements.length === 0) {
    blockElements = [getCurrentBlock()];
  }
  const newDetail = {
    menu: detail.menu,
    blockElements: blockElements,
    protyle: protyle,
  };

  return newDetail;
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
  isDelete: boolean; //是否删除
}

/**
 * *自定义函数输入参数2
 */
export interface ITools {
  [key: string]: any;
}

/**
 * 自定义函数输入参数3: output，输出，默认为原块的Markdown内容
 */
type IOutput = string; //Markdown文本

/**
 * *从文件或笔记中获取snippet并转为函数
 * @param jsBlockId
 * @param name
 * @param jsBlockContent
 * @returns
 */
export async function buildFunc(
  jsBlockId?: string,
  name?: string,
  filePath?: string,
  snippet?: string
): Promise<
  (
    input: IFuncInput,
    tools: ITools,
    output: IOutput
  ) => Promise<{ input: IFuncInput; tools: ITools; output: IOutput }>
> {
  //*使用顺序: snippet -> jsBlockId -> name -> filePath
  let jsBlockContent: string = snippet;
  if (jsBlockId && !jsBlockContent) {
    jsBlockContent = (await queryBlockById(jsBlockId)).content;
  } else if (name) {
    const resList = await requestQuerySQL(
      `select * from blocks where name = '${name}'`
    );
    if (resList.length) {
      jsBlockContent = resList[0].content;
    }
  } else if (filePath) {
    jsBlockContent = await getFile({
      path: "/data/storage/petal/" + PluginName + "/" + filePath,
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
  const func = await buildFunc(
    jsBlock.id,
    jsBlock.name,
    jsBlock.path,
    jsBlock.snippet
  );
  //let reloadFlag = true;
  let errorFlag = true;
  //超时自动刷新
  const safePromise = new Promise(
    (resolve) =>
      setTimeout(() => {
        resolve(false);
        /*         if (reloadFlag) {
          showMessage("运行超时");
                     setTimeout(() => {
            location.reload();
          }, 1000); 
        } else if (errorFlag) {
          showMessage(
            `${jsBlock.name || "id为" + jsBlock.id}脚本运行出错，请查看控制台`
          );
        } */
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
    showMessage("运行超时");
    throw new Error("运行超时");
  } else if (errorFlag) {
    showMessage(
      `${jsBlock.name || "id为" + jsBlock.id}脚本运行出错，请查看控制台`
    );
    throw new Error("运行错误");
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
    const input_func = {
      block: e.block, //当前块
      extra: e.extra, //当前文档标题,当前块属性
      index: i, //当前块索引
      array: array.map((e) => e.block), //所有块
      isDelete: false, //是否删除
      output: e.block.markdown, //输出内容
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
export async function getJsFiles(component: EComponent) {
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
    const pathPrefix = "/data/storage/petal/" + PluginName + "/";
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
  description?: string; // todo
  output?: string | IUpdateResult[];//预存结果
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
      description: jsBlock.memo, //todo 文档说明
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
  blockElements: HTMLElement[],
  protyle: IProtyle,
  rootId: string,
  component: EComponent
) {
  //* dialog方案
  //menu.submenu = this.blockCustomCopySubmenus;
  const dialog = new Dialog({
    //title: this.i18n.BlockCustomCopyName,
    content: "<div class='container'></div>",
  });
  const container = dialog.element.querySelector(".container");
  if (!container) {
    return;
  }
  const snippets = await getAllJs(component, rootId);
  const protyleUtilDiv = protyleUtil(
    snippets,
    blockElements,
    protyle,
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
