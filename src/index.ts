import { Plugin, Menu, IMenuItemOption, showMessage } from "siyuan";
import { buildSyTableBlocks } from "./libs/tableTransfer";
import {
  insertBlock,
  updateBlockWithAttr,
} from "../subMod/siyuanPlugin-common/siyuan-api/block";
import {
  queryBlockById,
  requestQuerySQL,
} from "../subMod/siyuanPlugin-common/siyuan-api/query";
import { buildSetting } from "../subMod/siyuanPlugin-common/component/setting";
import { setBlockAttrs } from "../subMod/siyuanPlugin-common/siyuan-api/attr";
import { IProtyle } from "../subMod/siyuanPlugin-common/types/global-siyuan";
import { Block } from "../subMod/siyuanPlugin-common/types/siyuan-api";
import {
  EHintType,
  buildBlock,
} from "../subMod/siyuanPlugin-common/component/blockEle";
const PluginName = "siyuan-plugin-block-converter"; //用于id等
const STORAGE_NAME = "config";
const DefaultDATA = {
  config: {
    isHtmlBlock2table: {
      type: "switch",
      title: "表格转换-是否开启",
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
    isPaste2HtmlBLock: {
      type: "switch",
      title: "粘贴为html块-是否开启",
      value: true,
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
    //console.log(this.data);
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
  };

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
          console.log(content.types);
          showMessage("未在剪贴板中发现html格式文本", undefined, "error");
          return;
        }
        const blob = await content.getType("text/html");
        const html = await blob.text();
        const block = buildBlock(html, detail.protyle.lute, EHintType.html);
        //console.log({ blockHtml: block });
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
        let tableBlocks = buildSyTableBlocks(
          shadow,
          fullWidth,
          window.Lute.NewNodeID()
        );
        //替换或插入表格
        for (let html of tableBlocks) {
          let res = await insertBlock({
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
    let submenu: IMenuItemOption[] = [];
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
    for (let jsBlock of submenuBlocks) {
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
        const func = new Function(
          "input",
          "index",
          "inputArray",
          ` 
              const { title, name, content, markdown,id } = input;
              ${currentJsBlock.content}
            `
        );
        let result = "";
        for (let i = 0; i < input.length; i++) {
          result += func(input[i], i, input);
        }
        //console.log(input);
        await navigator.clipboard.writeText(result);
        showMessage(`${result}已写入剪贴板`);
        //console.log(result);
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
    let submenu: IMenuItemOption[] = [];

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
    for (let jsBlock of submenuBlocks) {
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
        /*         const lute = window.Lute.New();
        lute.SetBlockRef(true);
        lute.SetHeadingAnchor(true);
        lute.SetHeadingID(true);
        lute.SetIndentCodeBlock(true);
        lute.SetInlineMathAllowDigitAfterOpenMarker(true);
        lute.SetKramdownIAL(true);
        lute.SetMark(true);
        lute.SetProtyleWYSIWYG(true);
        lute.SetSub(true);
        lute.SetSup(true);
        lute.SetTag(true);
        lute.SetSuperBlock(true); */
        const currentJsBlock = await queryBlockById(jsBlock.id);
        const func = new Function(
          "input",
          "index",
          "inputArray",
          ` 
              const { title, name, content, markdown,id } = input;
              ${currentJsBlock.content}
            `
        );
        const outputDoms = input.map((e, i, array) => {
          const result = func(e, i, array) as {
            markdown?: string;
            attrs?: { [key: string]: string };
          };
          if (!result) {
            return;
          }
          const { markdown, attrs } = result;
          const dom = document.createElement("div");
          if (markdown && markdown.trim()) {
            let domStr = lute.Md2BlockDOM(markdown);
            domStr;
            dom.innerHTML = domStr;
          }
          return { dom: dom, attrs: attrs };
        });
        let count = 0;
        for (let i = 0; i < outputDoms.length; i++) {
          const { dom, attrs } = outputDoms[i];
          let updateFlag = false;
          let preBlockId = input[i].id;
          for (let block of dom.children) {
            if (!updateFlag) {
              await updateBlockWithAttr({
                dataType: "dom",
                id: input[i].id,
                data: block.outerHTML,
              });
              updateFlag = true;
            } else {
              let res = await insertBlock({
                dataType: "dom",
                previousID: preBlockId,
                data: block.outerHTML,
              });
              //console.log(res);
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
          count++;
          showMessage(`已完成${count}/${outputDoms.length}`);
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
