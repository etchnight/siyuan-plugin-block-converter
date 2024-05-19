import { Plugin, Menu, IMenuItemOption, showMessage } from "siyuan";
import { buildSyTableBlocks } from "./libs/tableTransfer";
import {
  insertBlock,
  updateBlock,
  updateBlockWithAttr,
} from "../subMod/siyuanPlugin-common/siyuan-api/block";
import {
  queryBlockById,
  requestQuerySQL,
} from "../subMod/siyuanPlugin-common/siyuan-api/query";
import { buildSetting } from "../subMod/siyuanPlugin-common/component/setting";
import { setBlockAttrs } from "../subMod/siyuanPlugin-common/siyuan-api/attr";
import { IProtyle } from "../subMod/siyuanPlugin-common/types/global-siyuan";
import { Block, BlockId } from "../subMod/siyuanPlugin-common/types/siyuan-api";
import {
  EHintType,
  buildBlock,
} from "../subMod/siyuanPlugin-common/component/blockEle";
import TurndownService from "turndown";
const PluginName = "siyuan-plugin-block-converter"; //用于id等
const STORAGE_NAME = "config";
const DefaultDATA = {
  config: {
    isCustomPaste: {
      type: "switch",
      title: "自定义粘贴-是否开启",
      value: true,
    },
    isBlockCusCopy: {
      type: "switch",
      title: "自定义块复制-是否开启",
      value: true,
    },
    blockCusCopyJsRootId: {
      type: "input",
      title: "自定义块复制-js所在文档",
      value: "",
    },

    isBlockCusUpdate: {
      type: "switch",
      title: "自定义块更新-是否开启",
      value: true,
    },
    blockCusUpdateJsRootId: {
      type: "input",
      title: "自定义块更新-js所在文档",
      value: "",
    },
    isHtmlBlock2table: {
      type: "switch",
      title: "表格转换-是否开启",
      value: false,
    },
    isPaste2HtmlBLock: {
      type: "switch",
      title: "粘贴为html块-是否开启",
      value: false,
    },
  },
};

export default class PluginTableImporter extends Plugin {
  //private blockIconEventBindThis = this.blockIconEvent.bind(this);
  private blockCustomCopySubmenus: IMenuItemOption[] = [];
  private blockCustomUpdateSubmenus: IMenuItemOption[] = [];
  private detail: {
    menu: Menu;
    blockElements: HTMLElement[];
    protyle: IProtyle;
  } = { menu: undefined, blockElements: [], protyle: undefined };
  public data = structuredClone(DefaultDATA);

  async onload() {
    this.eventBus.on("click-blockicon", this.blockIconEvent);
    await this.loadData(STORAGE_NAME);
    this.data.config = Object.assign(DefaultDATA.config, this.data.config);
    //*兼容性改变,v0.2.2 => v0.2.3 遗留问题，原因：loadData 将覆盖默认值
    if (
      typeof this.data.config.blockCusCopyJsRootId === typeof "" ||
      typeof this.data.config.blockCusUpdateJsRootId === typeof ""
    ) {
      const blockCusCopyJsRootId = this.data.config
        .blockCusCopyJsRootId as unknown as string;
      const blockCusUpdateJsRootId = this.data.config
        .blockCusUpdateJsRootId as unknown as string;
      this.data = DefaultDATA;
      this.data.config.blockCusUpdateJsRootId.value = blockCusUpdateJsRootId;
      this.data.config.blockCusCopyJsRootId.value = blockCusCopyJsRootId;
    }

    buildSetting(this.data.config, {
      storageName: STORAGE_NAME,
      isReload: true,
      plugin: this,
    });

    this.data.config.isBlockCusCopy.value && this.initBlockCustomCopy();
    this.data.config.isBlockCusUpdate.value && this.initBlockCustomUpdate();
    this.data.config.isCustomPaste.value &&
      this.addCommand({
        langKey: PluginName + "customPaste",
        langText: "自定义粘贴",
        hotkey: "",
        editorCallback: (protyle) => {
          const block = getCurrentBlock();
          if (block) {
            customPaste(block.getAttribute("data-node-id"), protyle);
          }
        },
      });
    //this.eventBus.on("open-menu-content", this.openMenuContentEvent);
  }

  onLayoutReady() {}

  onunload() {
    this.eventBus.off("click-blockicon", this.blockIconEvent);
  }

  private blockIconEvent = ({
    detail,
  }: {
    detail: { menu: Menu; blockElements: [HTMLElement]; protyle: IProtyle };
  }) => {
    this.detail = detail;
    this.data.config.isHtmlBlock2table.value &&
      this.htmlBlock2tableBlock(detail);
    //this.block2flowchart(detail);
    this.data.config.isBlockCusCopy.value && this.blockCustomCopy(detail);
    this.data.config.isBlockCusUpdate.value && this.blockCustomUpdate(detail);
    this.data.config.isPaste2HtmlBLock.value && this.paste2HtmlBLock(detail);
    this.data.config.isCustomPaste.value &&
      detail.menu.addItem({
        iconHTML: "",
        label: "自定义粘贴",
        click(_element, _event) {
          const lastEle = detail.blockElements[detail.blockElements.length - 1];
          const id = lastEle.getAttribute("data-node-id");
          customPaste(id, detail.protyle);
        },
      });
  };

  /**
   * @deprecated
   * @param detail
   */
  private paste2HtmlBLock = async (detail: {
    menu: Menu;
    blockElements: [HTMLElement];
    protyle: IProtyle;
  }) => {
    detail.menu.addItem({
      iconHTML: "",
      label: "粘贴为html块",
      click: async () => {
        const content = await navigator.clipboard.read().then((e) => e[0]);
        if (!content.types.includes("text/html")) {
          console.warn(content.types);
          showMessage("未在剪贴板中发现html格式文本", undefined, "error");
          return;
        }
        const blob = await content.getType("text/html");
        const html = await blob.text();
        const block = buildBlock(html, detail.protyle.lute, EHintType.html);
        const lastBlockEle =
          detail.blockElements[detail.blockElements.length - 1];
        const blockId = lastBlockEle.getAttribute("data-node-id");
        //block.setAttribute("data-node-id", blockId);
        await insertBlock({
          dataType: "dom",
          previousID: blockId,
          data: block.outerHTML,
        });
        //content[0].types
      },
    });
  };
  /**@deprecated*/
  private htmlBlock2tableBlock = (detail: {
    menu: Menu;
    blockElements: [HTMLElement];
    protyle: IProtyle;
  }) => {
    if (detail.blockElements.length !== 1) {
      return;
    }
    const selectElement = detail.blockElements[0];
    if (selectElement.getAttribute("data-type") !== "NodeHTMLBlock") {
      return;
    }
    const protyleHtml = selectElement.querySelector("protyle-html");
    //const html = protyleHtml?.getAttribute("data-content");
    //直接使用shadow
    const shadow = protyleHtml.shadowRoot.querySelector("div");

    if (!shadow.querySelector("table")) {
      return;
    }
    detail.menu.addItem({
      iconHTML: "",
      label: this.i18n.blockMenuName,
      click: async () => {
        let blockId = selectElement.getAttribute("data-node-id");
        if (!blockId) {
          console.error("获取块id失败");
          return;
        }
        const fullWidth = window.getComputedStyle(selectElement).width;
        const tableBlocks = buildSyTableBlocks(
          shadow,
          fullWidth,
          window.Lute.NewNodeID()
        );
        //替换或插入表格
        for (const html of tableBlocks) {
          const res = await insertBlock({
            dataType: "dom",
            data: html,
            previousID: blockId,
          });
          blockId = res[0].doOperations[0].id;
        }
      },
    });
  };
  private async initBlockCustomCopy() {
    if (!this.data.config.blockCusCopyJsRootId.value) {
      this.blockCustomCopySubmenus = [];
      return;
    }
    const submenu: IMenuItemOption[] = [];
    const jsBlocks = //todo
      (await requestQuerySQL(`SELECT * FROM blocks WHERE blocks.type='c' 
        AND blocks.root_id='${this.data.config.blockCusCopyJsRootId.value}'`)) as Block[];
    const submenuBlocks = jsBlocks.filter((e) => {
      return (
        e.markdown.startsWith("```js") ||
        e.markdown.startsWith("```javascript") ||
        e.markdown.startsWith("```JavaScript")
      );
    });
    for (const jsBlock of submenuBlocks) {
      const copy = async () => {
        const input = await Promise.all(
          this.detail.blockElements.map(async (e) => {
            const id = e.getAttribute("data-node-id");
            const block = await queryBlockById(id);
            const doc = await queryBlockById(block.root_id);
            return {
              ...block,
              title: doc.content,
            };
          })
        );
        const currentJsBlock = await queryBlockById(jsBlock.id);
        const AsyncFunction = Object.getPrototypeOf(
          async function () {}
        ).constructor;
        const func = new AsyncFunction(
          "input",
          "index",
          "inputArray",
          "Lute",
          ` 
              let { title, name, content, markdown,id } = input;
              ${currentJsBlock.content}
            `
        );
        let result = "";
        for (let i = 0; i < input.length; i++) {
          result += await func(input[i], i, input, this.detail.protyle.lute);
        }
        await navigator.clipboard.writeText(result);
        showMessage(`${result}已写入剪贴板`);
      };
      const funcLable = jsBlock.name || jsBlock.content.substring(0, 20);
      submenu.push({
        label: funcLable,
        type: "submenu",
        click: copy,
      });

      this.addCommand({
        langKey: PluginName + encodeURIComponent(funcLable),
        langText: "自定义块复制-" + funcLable,
        hotkey: "",
        editorCallback: (protyle) => {
          Object.assign(this.detail, {
            blockElements: Array.from(
              protyle.wysiwyg.element.querySelectorAll(
                ".protyle-wysiwyg--select"
              )
            ),
            protyle,
          });
          if (this.detail.blockElements.length === 0) {
            Object.assign(this.detail, { blockElements: [getCurrentBlock()] });
          }
          if (this.detail.blockElements.length > 0) {
            copy();
          } else {
            showMessage("未选择任何块");
          }
        },
      });
    }
    this.blockCustomCopySubmenus = submenu;
  }
  private blockCustomCopy = async (detail: {
    menu: Menu;
    blockElements: [HTMLElement];
    protyle: IProtyle;
  }) => {
    detail.menu.addItem({
      iconHTML: "",
      label: "自定义复制",
      id: "blockCustomCopy",
      submenu: this.blockCustomCopySubmenus,
    });
  };
  private async initBlockCustomUpdate() {
    if (!this.data.config.blockCusUpdateJsRootId.value) {
      this.blockCustomUpdateSubmenus = [];
      return;
    }
    const submenu: IMenuItemOption[] = [];

    const jsBlocks = //todo
      (await requestQuerySQL(`SELECT * FROM blocks WHERE blocks.type='c' 
        AND blocks.root_id='${this.data.config.blockCusUpdateJsRootId.value}'`)) as Block[];
    const submenuBlocks = jsBlocks.filter((e) => {
      return (
        e.markdown.startsWith("```js") ||
        e.markdown.startsWith("```javascript") ||
        e.markdown.startsWith("```JavaScript")
      );
    });
    for (const jsBlock of submenuBlocks) {
      const transform = async () => {
        const input = await Promise.all(
          this.detail.blockElements.map(async (e) => {
            const id = e.getAttribute("data-node-id");
            const block = await queryBlockById(id);
            const doc = await queryBlockById(block.root_id);
            return {
              ...block,
              title: doc.content,
            };
          })
        );
        const lute = this.detail.protyle.lute;
        const currentJsBlock = await queryBlockById(jsBlock.id);
        const AsyncFunction = Object.getPrototypeOf(
          async function () {}
        ).constructor;
        const func = new AsyncFunction(
          "input",
          "index",
          "inputArray",
          "Lute",
          ` 
              let { title, name, content, markdown,id } = input;
              ${currentJsBlock.content}
            `
        );
        const outputDoms = await Promise.all(
          input.map(async (e, i, array) => {
            const result = (await func(e, i, array, lute)) as {
              markdown?: string;
              attrs?: { [key: string]: string };
            };
            if (!result) {
              return;
            }
            const { markdown, attrs } = result;
            const dom = document.createElement("div");
            const oldDom = document.createElement("div");
            oldDom.innerHTML = lute.Md2BlockDOM(e.markdown);
            if (markdown && markdown.trim()) {
              dom.innerHTML = lute.Md2BlockDOM(markdown);
              (dom.firstChild as HTMLDivElement).setAttribute(
                "data-node-id",
                input[i].id
              );
            }
            return { dom, attrs, oldDom };
          })
        );
        let count = 0;
        for (let i = 0; i < outputDoms.length; i++) {
          const { dom, attrs, oldDom } = outputDoms[i];
          let updateFlag = false;
          let preBlockId = input[i].id;
          for (const block of dom.children) {
            if (!updateFlag) {
              await updateBlockWithAttr(
                {
                  dataType: "dom",
                  id: input[i].id,
                  data: block.outerHTML,
                },
                this.detail.protyle,
                oldDom.innerHTML
              );

              updateFlag = true;
            } else {
              const res = await insertBlock(
                {
                  dataType: "dom",
                  previousID: preBlockId,
                  data: block.outerHTML,
                },
                this.detail.protyle
              );
              if (!res) {
                continue;
              }
              preBlockId = res[0]?.doOperations[0]?.id || preBlockId;
            }
          }
          if (attrs) {
            await setBlockAttrs({
              id: input[i].id,
              attrs: attrs,
            });
          }
          //console.log(this.detail.protyle);
          count++;
          showMessage(`已完成${count}/${outputDoms.length}`);
          //console.log(this.detail.protyle)
        }
      };
      const funcLable = jsBlock.name || jsBlock.content.substring(0, 20);
      submenu.push({
        label: funcLable,
        type: "submenu",
        iconHTML: "",
        click: () => transform(),
      });
      this.addCommand({
        langKey: PluginName + encodeURIComponent(funcLable),
        langText: "自定义块更新-" + funcLable,
        hotkey: "",
        editorCallback: (protyle) => {
          Object.assign(this.detail, {
            blockElements: Array.from(
              protyle.wysiwyg.element.querySelectorAll(
                ".protyle-wysiwyg--select"
              )
            ),
            protyle,
          });
          if (this.detail.blockElements.length === 0) {
            Object.assign(this.detail, { blockElements: [getCurrentBlock()] });
          }
          if (this.detail.blockElements.length > 0) {
            transform();
          } else {
            showMessage("未选择任何块");
          }
        },
      });
    }
    this.blockCustomUpdateSubmenus = submenu;
  }
  private blockCustomUpdate = async (detail: {
    menu: Menu;
    blockElements: [HTMLElement];
    protyle: IProtyle;
  }) => {
    detail.menu.addItem({
      iconHTML: "",
      label: "自定义更新",
      id: "blockCustomUpdate",
      submenu: this.blockCustomUpdateSubmenus,
    });
  };
}
function getCurrentBlock() {
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

async function customPaste(previousId: BlockId, protyle: IProtyle) {
  const content = await navigator.clipboard.read().then((e) => e[0]);
  const blob = await content.getType("text/html");
  const html = await blob.text();
  const turndownService = new TurndownService();
  turndownService.addRule("strikethrough", {
    filter: ["table"],
    replacement: function (_content, node, _options) {
      const container =
        protyle.contentElement.querySelector(".protyle-wysiwyg") ||
        protyle.contentElement;
      const style = getComputedStyle(container);
      //todo 计算宽度其实复杂，回头单独提出来，这里简化了
      const width = parseFloat(style.width) - 60 + "px";
      const tables = buildSyTableBlocks(node as HTMLElement, width);
      return tables[0];
    },
  });
  const markdown = turndownService.turndown(html);
  const isBlock = (text: string) => {
    const div = document.createElement("div");
    div.innerHTML = text;
    if (div.firstElementChild) {
      if (div.firstElementChild.hasAttribute("data-type")) {
        return true;
      }
    }
    return false;
  };
  const getDataType = (text: string) => {
    const div = document.createElement("div");
    div.innerHTML = text;
    return div.firstElementChild.getAttribute("data-type");
  };
  for (const line of markdown.split(/[(\r\n)\r\n]+/)) {
    if (isBlock(line) && getDataType(line) === "NodeTable") {
      //* 表格需要先插入再更新，否则交互不正确
      const res = await insertBlock(
        {
          dataType: "markdown",
          data: `||||
          | --| --| --|
          ||||
          ||||`,
          previousID: previousId,
        },
        protyle
      );
      previousId = res[0].doOperations[0].id;
      //todo 无法保留宽度信息
      const res2 = await updateBlock(
        {
          dataType: "dom",
          data: line,
          id: previousId,
        },
        protyle
      );
      previousId = res2[0].doOperations[0].id;
    } else {
      const res = await insertBlock(
        {
          dataType: isBlock(line) ? "dom" : "markdown",
          data: line,
          previousID: previousId,
        },
        protyle
      );
      previousId = res[0].doOperations[0].id;
    }
  }
}
