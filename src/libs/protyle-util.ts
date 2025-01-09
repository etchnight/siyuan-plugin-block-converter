/**
 * 参考自带的模板选择窗口：app\src\protyle\toolbar\index.ts
 * todo 尺寸计算
 */

import { Dialog, IProtyle } from "siyuan";
import { getComment, getI18n, ISnippet } from "./common";
import { execCopy, previewCopy } from "./customCopy";
import { execUpdate, previewUpdate } from "./customUpdate";
import { execPaste, previewPaste } from "./customPaste";
import { EComponent } from "./constants";
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
  //*列表项

  //*私有状态，用于记录当前选中的文件
  let selectedFile: ISnippet | undefined;
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
      //*描述
      await updateWysiwyg("", wysiwygDescription);
      await getComment(file);
      if (file.description) {
        await updateWysiwyg(
          protyle.lute.Md2BlockDOM(file.description),
          wysiwygDescription
        );
      }
      //dialog.destroy();
      await updateWysiwyg("", wysiwyg);
      let html = "";
      if (component == EComponent.Copy) {
        html = await previewCopy(file, blockElements, protyle);
      } else if (component == EComponent.Update) {
        html = await previewUpdate(file, blockElements, protyle);
      } else if (component == EComponent.Paste) {
        html = await previewPaste(file, blockElements, protyle);
      }
      await updateWysiwyg(html, wysiwyg);
    });
    listItem.addEventListener("mouseleave", () => {
      selectedFile = null;
    });
    //*运行脚本（执行）
    listItem.addEventListener("click", async () => {
      dialog.destroy();
      if (component == EComponent.Copy) {
        await execCopy(file, blockElements, protyle);
      } else if (component == EComponent.Update) {
        await execUpdate(file, blockElements, protyle);
      } else if (component == EComponent.Paste) {
        await execPaste(file, blockElements, protyle);
      }
    });
    const text = document.createElement("span");
    text.classList.add("b3-list-item__text");
    text.innerText = file.label;
    listItem.appendChild(text);
    /*    //todo
    const open = document.createElement("span");
    open.classList.add("b3-list-item__action");
    open.classList.add("b3-tooltips");
    open.classList.add("b3-tooltips__w");
    open.setAttribute("aria-label", "打开文件位置");
    open.innerHTML = `<svg><use xlink:href="#iconFolder"></use></svg>`;
    listItem.appendChild(open);

      const remove = document.createElement("span");
remove.classList.add("b3-list-item__action");
remove.classList.add("b3-tooltips");
remove.classList.add("b3-tooltips__w");
remove.setAttribute("aria-label", "删除");
remove.innerHTML = `<svg><use xlink:href="#iconTrashcan"></use></svg>`;
listItem.appendChild(remove); */
    return listItem;
  };

  //*文件列表
  const listEle = document.createElement("div");
  listEle.classList.add("b3-list");
  listEle.classList.add("fn__flex-1");
  listEle.classList.add("b3-list--background");
  listEle.style.position = "relative";
  leftContiainer.appendChild(listEle);
  const updateList = (filter?: string) => {
    listEle.innerHTML = "";
    files.forEach((file) => {
      if (!filter || file.label.includes(filter)) {
        listEle.appendChild(buildListItem(file));
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

  //更新编辑器内容
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
  const updateWysiwyg = async (html: string, wysiwyg: HTMLDivElement) => {
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
  };

  //*描述区
  const descriptionContiainer = initWysiwygContiainer(size.midWidth); //("260px");
  const wysiwygDescription = initWysiwyg(descriptionContiainer, "description");
  updateWysiwyg("", wysiwygDescription);
  //*预览区
  const wysiwygContiainer = initWysiwygContiainer(size.rightWidth); //("520px");
  //const wysiwyg = initProtyle(wysiwygContiainer);
  const wysiwyg = initWysiwyg(wysiwygContiainer, "preview");
  updateWysiwyg("", wysiwyg);

  return root;
};
