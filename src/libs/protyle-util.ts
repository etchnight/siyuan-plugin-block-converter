/**
 * 参考自带的模板选择窗口：app\src\protyle\toolbar\index.ts
 * todo 尺寸计算
 */

import { Dialog, IProtyle, Lute } from "siyuan";
import { getI18n, getPlugin, ISnippet } from "./common";
import { execCopy, previewCopy } from "./customCopy";
import { execUpdate, previewUpdate } from "./customUpdate";
import { execPaste, previewPaste } from "./customPaste";
import { CONSTANTS, EComponent } from "./constants";
import { processRender } from "../../subMod/siyuanPlugin-common/src/render";
import { store } from "./store";
export const protyleUtil = (
  files: ISnippet[],
  blockElements: HTMLElement[],
  protyle: IProtyle,
  dialog: Dialog,
  component: EComponent
) => {
  /**
   * root
   * - protyle-util
   *  - fn__flex(utilContiainer)
   *    - fn__flex-column(leftContiainer)
   *      - fn__flex(tools)
   *        - input
   *        - previous//todo
   *        - next//todo
   *      - b3-list
   *        - b3-list-item
   *    - div(descriptionContiainer)description
   *      - Refresh（重新运行）
   *      - protyle-wysiwyg
   *    - div(previewContiainer)
   *      - protyle-wysiwyg
   */

  /**尺寸计算 */
  const compuleteSize = () => {
    const height = window.innerHeight * 0.78; //比容器css设定的80vw略小
    const width = window.innerWidth * 0.8;
    const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const size = {
      left: center.x - width / 2 + "px",
      top: center.y - height / 2 + "px",
      width: width + "px",
      height: height + "px",
      leftWidth: width * 0.25 + "px",
      midWidth: width * 0.25 + "px",
      rightWidth: width * 0.5 + "px",
    };
    return size;
  };
  const size = compuleteSize();

  //根节点
  const root = document.createElement("div");
  const protyleUtil = document.createElement("div");
  protyleUtil.classList.add("protyle-util");
  protyleUtil.style.top = size.top; //"65.1125px";
  protyleUtil.style.left = size.left; //"288.8px";
  protyleUtil.style.zIndex = "11";
  //protyleUtil.style.position = "absolute";
  root.appendChild(protyleUtil);

  //容器
  const utilContiainer = document.createElement("div");
  utilContiainer.classList.add("fn__flex");
  utilContiainer.style.maxHeight = size.height; //"372.8px";
  protyleUtil.appendChild(utilContiainer);

  //左侧
  const leftContiainer = document.createElement("div");
  leftContiainer.classList.add("fn__flex-column");
  //leftContiainer.style.width = "260px";
  leftContiainer.style.maxWidth = size.leftWidth; //"50vw";
  utilContiainer.appendChild(leftContiainer);

  //*工具栏（左上）
  const tools = document.createElement("div");
  tools.classList.add("fn__flex");
  tools.style.margin = "0 8px 4px 8px";
  leftContiainer.appendChild(tools);

  const input = document.createElement("input");
  input.classList.add("b3-text-field");
  input.classList.add("fn__flex-1");
  input.oninput = (e) => {
    updateList((e.target as HTMLInputElement).value);
  };
  tools.appendChild(input);
  //todo
  /*   const previous = document.createElement("span");
          previous.classList.add("block__icon");
          previous.classList.add("block__icon--show");
          previous.setAttribute("data-type", "previous");
          previous.innerHTML = `<svg><use xlink:href="#iconLeft"></use></svg>`;
          tools.appendChild(previous);
          const next = document.createElement("span");
          next.classList.add("block__icon");
          next.classList.add("block__icon--show");
          next.setAttribute("data-type", "next");
          next.innerHTML = `<svg><use xlink:href="#iconRight"></use></svg>`;
          tools.appendChild(next); */

  //*私有状态，用于记录当前选中的文件
  let selectedFile: ISnippet | undefined;
  let lastFile: ISnippet | undefined; //*不会清空

  //*描述
  const updateDescription = async (file: ISnippet) => {
    updateWysiwyg("", wysiwygDescription);
    //await getComment(file);
    let paramsMarkdown = [];
    if (file.addStmt) {
      paramsMarkdown = [
        "```ts",
        file.addStmt,
        "```",
        '{: id="additionalStatement"}',
      ];
    }
    const description = `${paramsMarkdown.join("\n")}\n${file.description || ""}`;
    updateWysiwyg(protyle.lute.Md2BlockDOM(description), wysiwygDescription);
    //dialog.destroy();
  };

  //*列表项
  const buildListItem = (file: ISnippet) => {
    const listItem = document.createElement("div");
    listItem.classList.add("b3-list-item");
    listItem.classList.add("b3-list-item--hide-action");
    //*运行脚本（预览）
    listItem.addEventListener("mouseenter", async () => {
      selectedFile = file;
      //*防抖
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve("");
        }, 500);
      });
      if (selectedFile !== file) {
        return;
      }
      lastFile = file; //应该放在防抖之后，防止未运行但重新运行、正式运行的脚本切换
      await run(file, "preview", updateDescription);
    });
    listItem.addEventListener("mouseleave", () => {
      selectedFile = null;
    });
    //*运行脚本（执行）
    listItem.addEventListener("click", async () => {
      dialog.destroy();
      await run(file, "exec", updateState);
    });
    //*标题
    const text = document.createElement("span");
    text.classList.add("b3-list-item__text");
    text.innerText = file.label;
    listItem.appendChild(text);
    //TODO 只能通过electron打开资源浏览器，故打开功能暂时不能实现

    return listItem;
  };

  //*文件列表
  const fileListEle = document.createElement("div");
  fileListEle.classList.add("b3-list");
  fileListEle.classList.add("fn__flex-1");
  fileListEle.classList.add("b3-list--background");
  fileListEle.style.position = "relative";
  leftContiainer.appendChild(fileListEle);
  const updateList = (filter?: string) => {
    fileListEle.innerHTML = "";
    files.forEach((file) => {
      if (!filter || file.label.includes(filter)) {
        fileListEle.appendChild(buildListItem(file));
      }
    });
  };
  updateList();

  //*编辑器容器
  const initWysiwygContiainer = (width: string) => {
    //wysiwyg: HTMLDivElement,
    const wysiwygContiainer = document.createElement("div");
    wysiwygContiainer.style.width = width;
    //wysiwygContiainer.style.maxHeight = size.height;
    wysiwygContiainer.style.overflow = "auto";
    utilContiainer.appendChild(wysiwygContiainer);
    return wysiwygContiainer;
  };

  //*更新编辑器内容
  const initWysiwyg = (
    contiainer: HTMLDivElement,
    type: "preview" | "description"
  ) => {
    const wysiwyg = document.createElement("div");
    wysiwyg.setAttribute("data-type", type);
    wysiwyg.classList.add("protyle-wysiwyg");
    contiainer.appendChild(wysiwyg);
    return wysiwyg;
  };
  const updateWysiwyg = (html: string, wysiwyg: HTMLDivElement) => {
    let prefixHtml = `<div data-node-id="description" data-type="NodeThematicBreak" class="hr"><div></div></div>`;
    const titleText = "###### ";
    if (wysiwyg.getAttribute("data-type") === "description") {
      prefixHtml =
        protyle.lute.Md2BlockDOM(
          titleText + getI18n().dialog_protyle_util_description
        ) + prefixHtml;
    } else if (wysiwyg.getAttribute("data-type") === "preview") {
      let previewText = getI18n().dialog_protyle_util_preview;
      if (store.previewLimit != 0) {
        previewText += getI18n().dialog_protyle_util_preview_memo.replace(
          "${arg1}",
          store.previewLimit.toString()
        );
      }
      prefixHtml =
        protyle.lute.Md2BlockDOM(titleText + previewText) + prefixHtml;
    }

    wysiwyg.innerHTML = prefixHtml + html;
    processRender(wysiwyg);
    //*设置禁止编辑
    wysiwyg.querySelectorAll("[data-node-id]").forEach((block) => {
      if (block.getAttribute("data-node-id") == "additionalStatement") {
        return;
      }
      block.querySelectorAll("[contenteditable]").forEach((item) => {
        item.setAttribute("contenteditable", "false");
      });
    });
    return wysiwyg.innerHTML;
  };

  //*描述区
  const descriptionContiainer = initWysiwygContiainer(size.midWidth); //("260px");
  const wysiwygDescription = initWysiwyg(descriptionContiainer, "description");
  updateWysiwyg("", wysiwygDescription);
  const getAdditionalStatement = () => {
    const block = wysiwygDescription.querySelector(
      "[data-node-id='additionalStatement']"
    );
    if (!block) {
      return "";
    }
    const codeEle = block.querySelector("[contenteditable='true']");
    const result = codeEle?.textContent?.trim();
    return result;
  };

  //*描述区按钮（中上），参考思源设置 -> 快捷键界面
  const initToolsEle = () => {
    const globalToolsEle = document.createElement("div");
    globalToolsEle.classList.add("fn__flex");
    globalToolsEle.classList.add("b3-label");
    globalToolsEle.classList.add("config__item");
    globalToolsEle.style.flexWrap = "wrap";
    return globalToolsEle;
  };
  const globalToolsEle = initToolsEle();
  descriptionContiainer.insertBefore(
    globalToolsEle,
    descriptionContiainer.firstElementChild
  );

  //*构建按钮
  const initButton = (icon: string, label: string) => {
    const button = document.createElement("button");
    button.className = "b3-button b3-button--outline fn__flex-center";
    button.innerHTML = `<svg><use xlink:href="#${icon}"></use></svg>
    ${label}`;
    return button;
  };
  const updateState = async (file: ISnippet) => {
    file.addStmt = getAdditionalStatement();
  };
  const spaceEle = () => {
    const fn__space = document.createElement("span");
    fn__space.classList.add("fn__space");
    return fn__space;
  };
  //*重新运行
  const refreshButton = initButton("iconRefresh", "重新运行");
  globalToolsEle.appendChild(refreshButton);
  refreshButton.addEventListener("click", async () => {
    run(lastFile, "preview", updateState);
  });

  //*正式运行
  const runButton = initButton("iconPlay", "正式运行");
  globalToolsEle.appendChild(spaceEle());
  globalToolsEle.appendChild(runButton);
  runButton.addEventListener("click", async () => {
    dialog.destroy();
    run(lastFile, "exec", updateState);
  });

  //*保存参数
  const saveButton = initButton("iconFile", "保存参数");
  globalToolsEle.appendChild(spaceEle());
  globalToolsEle.appendChild(saveButton);
  saveButton.addEventListener("click", async () => {
    const plugin = getPlugin();
    const additionalStatement = getAdditionalStatement();
    const key =
      lastFile.name ||
      lastFile.id ||
      lastFile.path.replace(CONSTANTS.STORAGE_PATH, "");
    if (!plugin.data["snippetConfig.json"]) {
      plugin.data["snippetConfig.json"] = {};
    }
    if (!plugin.data["snippetConfig.json"][key]) {
      plugin.data["snippetConfig.json"][key] = {};
    }
    plugin.data["snippetConfig.json"][key].additionalStatement =
      additionalStatement;
    lastFile.addStmt = additionalStatement;
    await plugin.saveData(
      "snippetConfig.json",
      plugin.data["snippetConfig.json"]
    );
  });

  //*恢复参数
  const restoreButton = initButton("iconUndo", "恢复默认参数");
  globalToolsEle.appendChild(spaceEle());
  globalToolsEle.appendChild(restoreButton);
  restoreButton.addEventListener("click", async () => {
    lastFile.addStmt = lastFile.addStmtDefault;
    updateDescription(lastFile);
  });

  //*预览区
  const wysiwygContiainer = initWysiwygContiainer(size.rightWidth); //("520px");
  //const wysiwyg = initProtyle(wysiwygContiainer);
  const wysiwyg = initWysiwyg(wysiwygContiainer, "preview");
  updateWysiwyg("", wysiwyg);

  //*预览区工具栏
  const wysiwygToolsEle = initToolsEle();
  wysiwygContiainer.insertBefore(
    wysiwygToolsEle,
    wysiwygContiainer.firstElementChild
  );

  const switchButton = initButton("iconUndo", "显示原文");
  wysiwygToolsEle.appendChild(switchButton);
  const buildOriginHtml = () => {
    //todo store.previewLimit重复？
    let html = blockElements.slice(0, store.previewLimit).reduce((pre, cur) => {
      return cur.outerHTML + pre;
    }, "");
    const div = document.createElement("div");
    div.innerHTML = html;
    div.querySelectorAll("[data-node-id]").forEach((item) => {
      item.setAttribute("data-node-id", window.Lute.NewNodeID());
      item.classList.remove("protyle-wysiwyg--select");
    });
    html = updateWysiwyg(div.innerHTML, wysiwyg);
    return html;
  };
  const switchButtonStore = {
    state: true,
    html: buildOriginHtml(),
  };
  switchButton.addEventListener("click", () => {
    //const text = switchButton.textContent.trim();
    let newButton: HTMLButtonElement;
    if (switchButtonStore.state) {
      newButton = initButton("iconRedo", "显示结果");
    } else {
      newButton = initButton("iconUndo", "显示原文");
    }
    switchButton.innerHTML = newButton.innerHTML;
    switchButtonStore.state = !switchButtonStore.state;
    [wysiwyg.innerHTML, switchButtonStore.html] = [
      switchButtonStore.html,
      wysiwyg.innerHTML,
    ];
  });

  //*运行
  const run = async (
    file: ISnippet,
    mode: "preview" | "exec",
    callback?: (file: ISnippet) => Promise<void>
  ) => {
    if (mode == "preview") {
      updateWysiwyg("正在执行...", wysiwyg);
    }
    let html = "";
    const list = [
      {
        component: EComponent.Copy,
        previewFunc: previewCopy,
        executeFunc: execCopy,
      },
      {
        component: EComponent.Update,
        previewFunc: previewUpdate,
        executeFunc: execUpdate,
      },
      {
        component: EComponent.Paste,
        previewFunc: previewPaste,
        executeFunc: execPaste,
      },
    ];
    const item = list.find((item) => item.component == component);
    if (item) {
      if (mode == "preview") {
        html = await item.previewFunc(file, blockElements, protyle, callback);
      } else if (mode == "exec") {
        await item.executeFunc(file, blockElements, protyle, callback);
      }
    }
    if (mode == "preview") {
      updateWysiwyg(html, wysiwyg);
    }
  };
  return root;
};
