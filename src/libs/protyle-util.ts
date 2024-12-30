/**
 * 参考自带的模板选择窗口：app\src\protyle\toolbar\index.ts
 *
 */

import { Dialog, IProtyle } from "siyuan";
import { ISnippet } from "../libs/common";
import { buildCopyPreview, execCopy } from "./customCopy";

export const protyleUtil = (
  files: ISnippet[],
  //component: EComponent,
  blockElements: HTMLElement[],
  protyle: IProtyle,
  dialog: Dialog
) => {
  /**
   * root
   * - protyle-util
   *  - fn__flex(utilContiainer)
   *    - fn__flex-column
   *      - fn__flex(tools)
   *      - b3-list
   *        - b3-list-item
   *    - div(wysiwygContiainer)
   *      - protyle-wysiwyg
   */

  /**
   * 核心组件
   * 这部分是关系到数据的产生、预览
   */
  //*预览区
  const wysiwyg = document.createElement("div");
  const updateWysiwyg = () => {
    wysiwyg.innerHTML = `<div class="protyle-wysiwyg__empty">请输入内容</div>`;
  };
  updateWysiwyg();
  //*文件列表
  const listEle = document.createElement("div");
  const updateList = (filter?: string) => {
    listEle.innerHTML = "";
    files.forEach((file) => {
      if (!filter || file.label.includes(filter)) {
        listEle.appendChild(buildListItem(file));
      }
    });
  };
  //*列表项
  const buildListItem = (file: ISnippet) => {
    const listItem = document.createElement("div");
    listItem.classList.add("b3-list-item");
    listItem.classList.add("b3-list-item--hide-action");
    //*运行脚本
    listItem.addEventListener("click", async () => {
      dialog.destroy();
      const copyPreview = buildCopyPreview(file);
      const output = await copyPreview(blockElements, protyle);
      execCopy(output);
    });

    const text = document.createElement("span");
    text.classList.add("b3-list-item__text");
    text.innerText = file.label;
    listItem.appendChild(text);
    const open = document.createElement("span");
    open.classList.add("b3-list-item__action");
    open.classList.add("b3-tooltips");
    open.classList.add("b3-tooltips__w");
    open.setAttribute("aria-label", "打开文件位置");
    open.innerHTML = `<svg><use xlink:href="#iconFolder"></use></svg>`;
    listItem.appendChild(open);
    //todo
    /*   const remove = document.createElement("span");
remove.classList.add("b3-list-item__action");
remove.classList.add("b3-tooltips");
remove.classList.add("b3-tooltips__w");
remove.setAttribute("aria-label", "删除");
remove.innerHTML = `<svg><use xlink:href="#iconTrashcan"></use></svg>`;
listItem.appendChild(remove); */
    return listItem;
  };
  /**
   * html层次结构
   * 这部分不涉及逻辑，只是html结构，build函数的嵌套与html结构一一对应
   */
  const root = document.createElement("div");
  const buildRoot = () => {
    const buildProtyleUtil = () => {
      const protyleUtil = document.createElement("div");
      protyleUtil.classList.add("protyle-util");
      protyleUtil.style.top = "65.1125px";
      protyleUtil.style.left = "388.8px";
      protyleUtil.style.zIndex = "11";
      //protyleUtil.style.position = "absolute";
      root.appendChild(protyleUtil);
      const buildUtilContiainer = () => {
        const utilContiainer = document.createElement("div");
        utilContiainer.classList.add("fn__flex");
        protyleUtil.appendChild(utilContiainer);

        const buildFlexColumn = () => {
          const flexColumn = document.createElement("div");
          flexColumn.classList.add("fn__flex-column");
          utilContiainer.appendChild(flexColumn);

          const buildTools = () => {
            const tools = document.createElement("div");
            tools.classList.add("fn__flex");
            tools.style.margin = "0 8px 4px 8px";
            flexColumn.appendChild(tools);

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
          };
          buildTools();
          listEle.classList.add("b3-list");
          listEle.classList.add("fn__flex-1");
          listEle.classList.add("b3-list--background");
          listEle.style.position = "relative";
          flexColumn.appendChild(listEle);
          updateList();
        };
        buildFlexColumn();
        const buildWysiwygContiainer = () => {
          const wysiwygContiainer = document.createElement("div");
          wysiwygContiainer.style.width = "520px";
          wysiwygContiainer.style.overflow = "auto";
          utilContiainer.appendChild(wysiwygContiainer);

          wysiwyg.classList.add("protyle-wysiwyg");
          wysiwygContiainer.appendChild(wysiwyg);
        };
        buildWysiwygContiainer();
      };
      buildUtilContiainer();
    };
    buildProtyleUtil();
  };
  buildRoot();
  return root;
};
