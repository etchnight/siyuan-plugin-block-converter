/**
 * 参考自带的模板选择窗口：app\src\protyle\toolbar\index.ts
 */

import { Dialog, IProtyle } from "siyuan";
import { Dialog, IProtyle } from "siyuan";
import { getI18n, getPlugin, ISnippet } from "./common";
import { execCopy, previewCopy } from "./customCopy";
import { execUpdate, previewUpdate } from "./customUpdate";
import { execPaste, previewPaste } from "./customPaste";
import { CONSTANTS, EComponent } from "./constants";
import { processRender } from "../../subMod/siyuanPlugin-common/src/render";
import { store } from "./store";
export class protyleUtil {
  /**
   - root
      - protyle-util
        - fn__flex(utilContiainer)
          - fn__flex-column(leftContiainer)
            - fn__flex(tools)
              - input
              - previous//todo
              - next//todo
            - b3-list
              - b3-list-item
          - div(descriptionContiainer)description
            - Refresh（重新运行）
            - protyle-wysiwyg
          - div(previewContiainer)
            - protyle-wysiwyg
   */
  constructor(
    files: ISnippet[],
    blockElements: HTMLElement[],
    protyle: IProtyle,
    dialog: Dialog,
    component: EComponent
  ) {
    this.files = files;
    this.blockElements = blockElements;
    this.protyle = protyle;
    this.dialog = dialog;
    this.component = component;
    this.switchButtonStore.html = this.getOriginContent();
    this.size = this.compuleteSize();
    this.render();
  }
  private files: ISnippet[];
  private blockElements: HTMLElement[];
  private protyle: IProtyle;
  private dialog: Dialog;
  private component: EComponent;
  private size: {
    left: string;
    top: string;
    width: string;
    height: string;
    leftWidth: string;
    midWidth: string;
    rightWidth: string;
  };
  //*需要联动的元素
  public root: HTMLElement; //外部调用
  private fileListEle = document.createElement("div"); //* 文件列表(与input联动)
  private wysiwygDescription = document.createElement("div"); //*描述区编辑器
  private wysiwyg = document.createElement("div"); //*预览区编辑器(切换按钮)
  private switchButton: HTMLButtonElement; //*切换按钮(自身联动)

  //*私有状态，用于记录当前选中的文件
  private selectedFile: ISnippet | undefined;
  private lastFile: ISnippet | undefined; //*不会清空
  //* 状态，用于记录当前是否显示的是结果/原文
  private switchButtonStore = {
    state: true, //true表示当前显示的是结果
    html: "",
  };

  /**获取原文 */
  private getOriginContent = () => {
    //todo store.previewLimit重复？
    let html = this.blockElements
      .slice(0, store.previewLimit)
      .reduce((pre, cur) => {
        return cur.outerHTML + pre;
      }, "");
    const div = document.createElement("div");
    div.innerHTML = html;
    div.querySelectorAll("[data-node-id]").forEach((item) => {
      item.setAttribute("data-node-id", window.Lute.NewNodeID());
      item.classList.remove("protyle-wysiwyg--select");
    });
    html = this.updateWysiwyg(div.innerHTML, this.wysiwyg);
    return html;
  };
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
   *  - fn__flex(utilContainer)
   *    - fn__flex-column(leftContainer)
   *      - fn__flex(tools)
   *        - input
   *        - previous//todo
   *        - next//todo
   *      - b3-list
   *        - b3-list-item
   *    - div(descriptionContainer)description
   *      - Refresh（重新运行）
   *      - protyle-wysiwyg
   *    - div(previewContainer)
   *      - protyle-wysiwyg
   */

  /**尺寸计算 */
  const computeSize = () => {
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
  const size = computeSize();

  private render = () => {
    //根节点
    this.root = document.createElement("div");
    const protyleUtilEle = document.createElement("div");
    protyleUtilEle.classList.add("protyle-util");
    protyleUtilEle.style.top = this.size.top; //"65.1125px";
    protyleUtilEle.style.left = this.size.left; //"288.8px";
    protyleUtilEle.style.zIndex = "11";
    //protyleUtil.style.position = "absolute";
    this.root.appendChild(protyleUtilEle);

  //容器
  const utilContainer = document.createElement("div");
  utilContainer.classList.add("fn__flex");
  utilContainer.style.maxHeight = size.height; //"372.8px";
  protyleUtil.appendChild(utilContainer);

  //左侧
  const leftContainer = document.createElement("div");
  leftContainer.classList.add("fn__flex-column");
  //leftContainer.style.width = "260px";
  leftContainer.style.maxWidth = size.leftWidth; //"50vw";
  // 修正拼写错误，将 Container 改为 Container
  utilContainer.appendChild(leftContainer);

  //*工具栏（左上）
  const tools = document.createElement("div");
  tools.classList.add("fn__flex");
  tools.style.margin = "0 8px 4px 8px";
  leftContainer.appendChild(tools);

    const input = document.createElement("input");
    input.classList.add("b3-text-field");
    input.classList.add("fn__flex-1");
    input.oninput = (e) => {
      this.updateList((e.target as HTMLInputElement).value);
    };
    tools.appendChild(input);

    //*文件列表
    this.fileListEle.classList.add("b3-list");
    this.fileListEle.classList.add("fn__flex-1");
    this.fileListEle.classList.add("b3-list--background");
    this.fileListEle.style.position = "relative";
    leftContiainer.appendChild(this.fileListEle);
    this.updateList();

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

    //*描述区
    const descriptionContiainer = initWysiwygContiainer(this.size.midWidth); //("260px");
    this.wysiwygDescription = this.initWysiwyg(
      descriptionContiainer,
      "description"
    );
    this.updateWysiwyg("", this.wysiwygDescription);

    //*描述区按钮（中上），参考思源设置 -> 快捷键界面

    const initToolsEle = () => {
      const ToolsEle = document.createElement("div");
      ToolsEle.classList.add("fn__flex");
      ToolsEle.classList.add("b3-label");
      ToolsEle.classList.add("config__item");
      ToolsEle.style.flexWrap = "wrap";
      return ToolsEle;
    };
    const globalToolsEle = initToolsEle();
    descriptionContiainer.insertBefore(
      globalToolsEle,
      descriptionContiainer.firstElementChild
    );

    //*重新运行
    const refreshButton = this.initButton("iconRefresh", "重新运行");
    globalToolsEle.appendChild(refreshButton);
    refreshButton.addEventListener("click", async () => {
      this.run(this.lastFile, "preview", this.updateState);
    });

    //*正式运行
    const runButton = this.initButton("iconPlay", "正式运行");
    globalToolsEle.appendChild(this.spaceEle());
    globalToolsEle.appendChild(runButton);
    runButton.addEventListener("click", async () => {
      this.dialog.destroy();
      this.run(this.lastFile, "exec", this.updateState);
    });

    //*保存参数
    const saveButton = this.initButton("iconFile", "保存参数");
    globalToolsEle.appendChild(this.spaceEle());
    globalToolsEle.appendChild(saveButton);
    saveButton.addEventListener("click", async () => {
      const plugin = getPlugin();
      const additionalStatement = this.getAdditionalStatement();
      const key =
        this.lastFile.name ||
        this.lastFile.id ||
        this.lastFile.path.replace(CONSTANTS.STORAGE_PATH, "");
      if (!plugin.data["snippetConfig.json"]) {
        plugin.data["snippetConfig.json"] = {};
      }
      if (!plugin.data["snippetConfig.json"][key]) {
        plugin.data["snippetConfig.json"][key] = {};
      }
      plugin.data["snippetConfig.json"][key].additionalStatement =
        additionalStatement;
      this.lastFile.addStmt = additionalStatement;
      await plugin.saveData(
        "snippetConfig.json",
        plugin.data["snippetConfig.json"]
      );
    });

    //*恢复参数
    const restoreButton = this.initButton("iconUndo", "恢复默认参数");
    globalToolsEle.appendChild(this.spaceEle());
    globalToolsEle.appendChild(restoreButton);
    restoreButton.addEventListener("click", async () => {
      this.lastFile.addStmt = this.lastFile.addStmtDefault;
      this.updateDescription(this.lastFile);
    });

    //*预览区
    const wysiwygContiainer = initWysiwygContiainer(this.size.rightWidth); //("520px");
    //const wysiwyg = initProtyle(wysiwygContiainer);
    this.wysiwyg = this.initWysiwyg(wysiwygContiainer, "preview");
    this.updateWysiwyg("", this.wysiwyg);

    //*预览区工具栏
    const wysiwygToolsEle = initToolsEle();
    wysiwygContiainer.insertBefore(
      wysiwygToolsEle,
      wysiwygContiainer.firstElementChild
    );

    this.switchButton = this.initButton("iconUndo", "显示原文");
    wysiwygToolsEle.appendChild(this.switchButton);
    this.switchButton.addEventListener("click", () => {
      this.switchContent();
    });
  };
  //*描述
  private updateDescription = async (file: ISnippet) => {
    this.updateWysiwyg("", this.wysiwygDescription);
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
    this.updateWysiwyg(
      this.protyle.lute.Md2BlockDOM(description),
      this.wysiwygDescription
    );
    //dialog.destroy();
  };

  //*列表项
  private buildListItem = (file: ISnippet) => {
    const listItem = document.createElement("div");
    listItem.classList.add("b3-list-item");
    listItem.classList.add("b3-list-item--hide-action");
    //*运行脚本（预览）
    listItem.addEventListener("mouseenter", async () => {
      this.selectedFile = file;
      //*防抖
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve("");
        }, 500);
      });
      if (this.selectedFile !== file) {
        return;
      }
      this.lastFile = file; //应该放在防抖之后，防止未运行但重新运行、正式运行的脚本切换
      await this.run(file, "preview", this.updateDescription);
    });
    listItem.addEventListener("mouseleave", () => {
      this.selectedFile = null;
    });
    //*运行脚本（执行）
    listItem.addEventListener("click", async () => {
      this.dialog.destroy();
      await this.run(file, "exec", this.updateState);
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
  leftContainer.appendChild(fileListEle);
  const updateList = (filter?: string) => {
    fileListEle.innerHTML = "";
    files.forEach((file) => {
      if (!filter || file.label.includes(filter)) {
        this.fileListEle.appendChild(this.buildListItem(file));
      }
    });
  };
  updateList();

  //*编辑器容器
  const initWysiwygContainer = (width: string) => {
    //wysiwyg: HTMLDivElement,
    const wysiwygContainer = document.createElement("div");
    wysiwygContainer.style.width = width;
    //wysiwygContainer.style.maxHeight = size.height;
    wysiwygContainer.style.overflow = "auto";
    utilContainer.appendChild(wysiwygContainer);
    return wysiwygContainer;
  };

  //*更新编辑器内容
  const initWysiwyg = (
    container: HTMLDivElement,
    type: "preview" | "description"
  ) => {
    const wysiwyg = document.createElement("div");
    wysiwyg.setAttribute("data-type", type);
    wysiwyg.classList.add("protyle-wysiwyg");
    container.appendChild(wysiwyg);
    return wysiwyg;
  };
  private updateWysiwyg = (html: string, wysiwyg: HTMLDivElement) => {
    let prefixHtml = `<div data-node-id="description" data-type="NodeThematicBreak" class="hr"><div></div></div>`;
    const titleText = "###### ";
    if (wysiwyg.getAttribute("data-type") === "description") {
      prefixHtml =
        this.protyle.lute.Md2BlockDOM(
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
        this.protyle.lute.Md2BlockDOM(titleText + previewText) + prefixHtml;
      //*强制将容器切换到显示结果状态
      this.switchContent(true);
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
  const descriptionContainer = initWysiwygContainer(size.midWidth); //("260px");
  const wysiwygDescription = initWysiwyg(descriptionContainer, "description");
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
  descriptionContainer.insertBefore(
    globalToolsEle,
    descriptionContainer.firstElementChild
  );

  //*构建按钮
  private initButton = (icon: string, label: string) => {
    const button = document.createElement("button");
    button.className = "b3-button b3-button--outline fn__flex-center";
    button.innerHTML = `<svg><use xlink:href="#${icon}"></use></svg>
    ${label}`;
    return button;
  };
  private updateState = async (file: ISnippet) => {
    file.addStmt = this.getAdditionalStatement();
  };
  private spaceEle = () => {
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
  const wysiwygContainer = initWysiwygContainer(size.rightWidth); //("520px");
  //const wysiwyg = initProtyle(wysiwygContainer);
  const wysiwyg = initWysiwyg(wysiwygContainer, "preview");
  updateWysiwyg("", wysiwyg);

  //*预览区工具栏
  const wysiwygToolsEle = initToolsEle();
  wysiwygContainer.insertBefore(
    wysiwygToolsEle,
    wysiwygContainer.firstElementChild
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
    const switchState = () => {
      let newButton: HTMLButtonElement;
      if (this.switchButtonStore.state) {
        newButton = this.initButton("iconRedo", "显示结果");
      } else {
        newButton = this.initButton("iconUndo", "显示原文");
      }
      this.switchButton.innerHTML = newButton.innerHTML;
      this.switchButtonStore.state = !this.switchButtonStore.state;
      [this.wysiwyg.innerHTML, this.switchButtonStore.html] = [
        this.switchButtonStore.html,
        this.wysiwyg.innerHTML,
      ];
    };
    //*不指定state，则切换；否则直接切换到指定状态
    if (state !== this.switchButtonStore.state || state === undefined) {
      switchState();
    }
  };
  //*运行
  private run = async (
    file: ISnippet,
    mode: "preview" | "exec",
    callback?: (file: ISnippet) => Promise<void>
  ) => {
    if (mode == "preview") {
      this.updateWysiwyg("正在执行...", this.wysiwyg);
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
    const item = list.find((item) => item.component == this.component);
    if (item) {
      if (mode == "preview") {
        html = await item.previewFunc(
          file,
          this.blockElements,
          this.protyle,
          callback
        );
      } else if (mode == "exec") {
        await item.executeFunc(
          file,
          this.blockElements,
          this.protyle,
          callback
        );
      }
    }
    if (mode == "preview") {
      this.updateWysiwyg(html, this.wysiwyg);
    }
  };
}
