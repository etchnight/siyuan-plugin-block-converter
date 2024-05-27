import {
  Plugin,
  Menu,
  IMenuItemOption,
  showMessage,
  IWebSocketData,
} from "siyuan";
import { buildSyTableBlocks } from "./libs/tableTransfer";
import {
  insertBlock,
  updateBlock,
} from "../subMod/siyuanPlugin-common/siyuan-api/block";
import { buildSetting } from "../subMod/siyuanPlugin-common/component/setting";
import { IProtyle } from "../subMod/siyuanPlugin-common/types/global-siyuan";
import { BlockId } from "../subMod/siyuanPlugin-common/types/siyuan-api";
import TurndownService from "turndown";
import { buildCopy } from "./libs/customCopy";
import { buildTransform } from "./libs/customUpdate";
import { getCurrentBlock, getJsBlocks, getSelectedBlocks } from "./libs/common";
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
  },
};

export default class PluginBlockConverter extends Plugin {
  //private blockIconEventBindThis = this.blockIconEvent.bind(this);
  private blockCustomCopySubmenus: IMenuItemOption[] = [];
  private blockCustomUpdateSubmenus: IMenuItemOption[] = [];
  private waitting = false; //判断是否应该等待
  private detail: {
    menu: Menu;
    blockElements: HTMLElement[];
    protyle: IProtyle;
  } = { menu: undefined, blockElements: [], protyle: undefined };
  public data = structuredClone(DefaultDATA);

  async onload() {
    this.eventBus.on("click-blockicon", this.blockIconEvent);
    await this.loadData(STORAGE_NAME);
    //*v0.2.9 => v0.3.0 遗留问题，由于移除模块，设置项将出现残留
    {
      //this.data.config = Object.assign(DefaultDATA.config, this.data.config);
      for (const key of Object.keys(DefaultDATA.config)) {
        DefaultDATA.config[key] = this.data.config[key];
      }
      this.data.config = DefaultDATA.config;
    }
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
    this.eventBus.on("ws-main", this.switchWait);
  }

  onLayoutReady() {}

  onunload() {
    this.eventBus.off("click-blockicon", this.blockIconEvent);
    this.eventBus.off("ws-main", this.switchWait);
  }
  private switchWait = ({ detail }: { detail: IWebSocketData }) => {
    if (detail.cmd === "transactions") {
      this.waitting = true;
    }
    if (detail.cmd === "databaseIndexCommit" && this.waitting === true) {
      this.waitting = false;
    }
  };
  private blockIconEvent = ({
    detail,
  }: {
    detail: { menu: Menu; blockElements: [HTMLElement]; protyle: IProtyle };
  }) => {
    this.detail = detail;
    this.data.config.isBlockCusCopy.value && this.blockCustomCopy(detail);
    this.data.config.isBlockCusUpdate.value && this.blockCustomUpdate(detail);
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

  private async initBlockCustomCopy() {
    if (!this.data.config.blockCusCopyJsRootId.value) {
      this.blockCustomCopySubmenus = [];
      return;
    }
    const submenu: IMenuItemOption[] = [];
    const submenuBlocks = await getJsBlocks(
      this.data.config.blockCusCopyJsRootId.value
    );
    for (const jsBlock of submenuBlocks) {
      const copy = buildCopy(jsBlock);
      const funcLable = jsBlock.name || jsBlock.content.substring(0, 20);
      submenu.push({
        label: funcLable,
        type: "submenu",
        click: () => copy(this.detail),
      });

      this.addCommand({
        langKey: PluginName + encodeURIComponent(funcLable),
        langText: "自定义块复制-" + funcLable,
        hotkey: "",
        editorCallback: (protyle) => {
          this.detail = getSelectedBlocks(protyle, this.detail);
          if (this.detail.blockElements.length > 0) {
            copy(this.detail);
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
      label: this.i18n.BlockCustomCopy.name,
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
    const submenuBlocks = await getJsBlocks(
      this.data.config.blockCusUpdateJsRootId.value
    );
    for (const jsBlock of submenuBlocks) {
      const transform = buildTransform(jsBlock);
      const funcLable = jsBlock.name || jsBlock.content.substring(0, 20);
      submenu.push({
        label: funcLable,
        type: "submenu",
        iconHTML: "",
        click: async () => {
          while (this.waitting) {
            await new Promise<void>((resolve, _reject) => {
              setTimeout(resolve, 100);
            });
          }
          transform(this.detail);
        },
      });
      this.addCommand({
        langKey: PluginName + encodeURIComponent(funcLable),
        langText: "自定义块更新-" + funcLable,
        hotkey: "",
        editorCallback: async (protyle) => {
          this.detail = getSelectedBlocks(protyle, this.detail);
          if (this.detail.blockElements.length > 0) {
            while (this.waitting) {
              await new Promise<void>((resolve, _reject) => {
                setTimeout(resolve, 100);
              });
            }
            transform(this.detail);
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
      label: this.i18n.BlockCustomUpdate.name,
      id: "blockCustomUpdate",
      submenu: this.blockCustomUpdateSubmenus,
    });
  };
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
