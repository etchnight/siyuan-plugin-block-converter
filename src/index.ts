import {
  Plugin,
  Menu,
  IMenuItemOption,
  showMessage,
  IWebSocketData,
} from "siyuan";
import { buildSetting } from "../subMod/siyuanPlugin-common/component/setting";
import { IProtyle } from "../subMod/siyuanPlugin-common/types/global-siyuan";
import { buildCopy } from "./libs/customCopy";
import { buildTransform } from "./libs/customUpdate";
import { getCurrentBlock, getJsBlocks, getSelectedBlocks } from "./libs/common";
import { customPaste } from "./libs/customPaste";
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
    this.eventBus.on("ws-main", this.switchWait);
    await this.loadData(STORAGE_NAME);
    this.updateConfig();
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
    this.eventBus.off("ws-main", this.switchWait);
  }
  /**
   * 设置 this.data.config，包含兼容性老版本处理
   */
  private updateConfig = () => {
    //this.data.config = Object.assign(DefaultDATA.config, this.data.config);
    //*v0.2.9 => v0.3.0 遗留问题，由于移除模块，设置项将出现残留
    {
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
  };
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
    this.data.config.isBlockCusCopy.value && this.addCustomCopyMenu(detail);
    this.data.config.isBlockCusUpdate.value && this.addCustomUpdateMenu(detail);
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
  private addCustomCopyMenu = async (detail: {
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
  private addCustomUpdateMenu = async (detail: {
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
