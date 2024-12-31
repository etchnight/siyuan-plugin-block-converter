import {
  Plugin,
  Menu,
  showMessage,
  IWebSocketData,
  IMenu,
  IProtyle,
  IGetDocInfo,
} from "siyuan";
import { buildSetting } from "../subMod/siyuanPlugin-common/component/setting";
import { getDoc } from "../subMod/siyuanPlugin-common/siyuan-api/filetree";
import { execCopy } from "./libs/customCopy";
import { execUpdate } from "./libs/customUpdate";
import {
  EComponent,
  getAllJs,
  getCurrentBlock,
  getSelectedBlocks,
  PluginName,
  protyleUtilDialog,
} from "./libs/common";
import { customPaste } from "./libs/customPaste";
import { i18nObj } from "../scripts/i18n";
import extract from "extract-comments";
import { store, switchWait } from "./libs/store";
//import { getJsdocData } from "jsdoc-to-markdown";
//import doctrine from "doctrine";

const STORAGE_NAME = "config.json";
//const STORAGE_NAME_BLOCK_CUSTOM_COPY = "blockCustomCopy.json";
const DefaultDATA = {
  config: {
    isCustomPaste: {
      type: "switch",
      title: "自定义粘贴-是否开启",
      value: true,
    },
    customPasteJsRootId: {
      type: "input",
      title: "自定义粘贴-js所在文档",
      value: "",
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
  //private blockCustomCopySubmenus: IMenu[] = [];
  //private blockCustomUpdateSubmenus: IMenu[] = [];
  //private waitting = false; //判断是否应该等待
  /**
   * 三种生成途径：通过块标事件直接获取、文档标题事件中查询、快捷键命令中通过common.js中函数获取
   * 在自定义复制和自定义粘贴中作为入参使用
   */
  private detail: {
    menu: Menu;
    blockElements: HTMLElement[];
    protyle: IProtyle;
  } = { menu: undefined, blockElements: [], protyle: undefined };
  //* 此处需要与i18n.json中的key对应
  declare public data: {
    config: typeof DefaultDATA.config;
    "config.json": typeof DefaultDATA.config;
  };
  declare public i18n: typeof i18nObj.zh_CN;
  async onload() {
    //this.displayName = "块转换工具"; //?不能自动加载插件名称
    this.eventBus.on("click-blockicon", this.blockIconEvent);
    this.eventBus.on("ws-main", this.switchWait);
    this.eventBus.on("click-editortitleicon", this.openMenuDoctreeEvent);
    await this.loadData(STORAGE_NAME);
    //注意，STORAGE_NAME 为 "config.json"，不是 "config"
    // todo 应该直接使用 this.data["config.json"]
    this.data.config = Object.assign(
      DefaultDATA.config,
      this.data[STORAGE_NAME]
    );
    //this.updateConfig();
    buildSetting(this.data.config, {
      storageName: STORAGE_NAME,
      isReload: true,
      plugin: this,
    });
    this.data.config.isBlockCusCopy.value && this.initBlockCustomCopy();
    this.data.config.isBlockCusUpdate.value && this.initBlockCustomUpdate();
    this.data.config.isCustomPaste.value && this.initCustomPaste();

    //await this.loadPresetSnippet("blockCustomUpdate/法条自动链接.js");
  }

  onLayoutReady() {}

  onunload() {
    this.eventBus.off("click-blockicon", this.blockIconEvent);
    this.eventBus.off("ws-main", this.switchWait);
    this.eventBus.off("click-editortitleicon", this.openMenuDoctreeEvent);
  }
  /**
   * 设置 this.data.config，包含兼容性老版本处理
   * @deprecated 由于v0.4.0的破坏性更新，弃用原来的`config`文件，改为`config.json`
   */
  private updateConfig = () => {
    //this.data.config = Object.assign(DefaultDATA.config, this.data.config);
    //*v0.2.9 => v0.3.0 遗留问题，由于移除模块，设置项将出现残留
    {
      for (const key of Object.keys(DefaultDATA.config)) {
        DefaultDATA.config[key] =
          this.data.config[key] || DefaultDATA.config[key];
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
      this.data.config = DefaultDATA.config;
      this.data.config.blockCusUpdateJsRootId.value = blockCusUpdateJsRootId;
      this.data.config.blockCusCopyJsRootId.value = blockCusCopyJsRootId;
    }
  };

  /**
   * 等待写入数据库完成
   * @param param0
   */
  private switchWait = ({ detail }: { detail: IWebSocketData }) => {
    if (detail.cmd === "transactions") {
      switchWait(true);
    }
    if (detail.cmd === "databaseIndexCommit" && store.waitting === true) {
      switchWait(false);
    }
  };

  private blockIconEvent = ({
    detail,
  }: {
    detail: { menu: Menu; blockElements: HTMLElement[]; protyle: IProtyle };
  }) => {
    this.detail = detail;
    this.data.config.isBlockCusCopy.value && this.addCustomCopyMenu(detail);
    this.data.config.isBlockCusUpdate.value && this.addCustomUpdateMenu(detail);
    this.data.config.isCustomPaste.value && this.addCustomPasteMenu(detail);
    this.addSaveSnippetMenu(detail);
  };

  private openMenuDoctreeEvent = ({
    detail,
  }: {
    detail: { menu: Menu; data: IGetDocInfo; protyle: IProtyle };
  }) => {
    //*注意，这一步必须在异步函数之前运行
    this.data.config.isBlockCusUpdate.value && this.addCustomUpdateMenu(detail);
    getDoc({ id: detail.data.rootID }).then((res) => {
      const div = document.createElement("div");
      div.innerHTML = res.content;
      const children = div.children;
      const content: HTMLElement[] = [];
      for (const child of children) {
        content.push(child as HTMLElement);
      }
      this.detail = {
        menu: detail.menu,
        blockElements: content,
        protyle: detail.protyle,
      };
    });
  };

  private initCustomPaste = async () => {
    const docId = this.data.config.customPasteJsRootId;
    this.addCommand({
      langKey: PluginName + "customPaste",
      langText: "自定义粘贴",
      hotkey: "",
      editorCallback: (protyle) => {
        const block = getCurrentBlock();
        if (block) {
          customPaste(block.getAttribute("data-node-id"), protyle, docId.value);
        }
      },
    });
  };

  private addCustomPasteMenu = async (detail: {
    menu: Menu;
    blockElements: HTMLElement[];
    protyle: IProtyle;
  }) => {
    const docId = this.data.config.customPasteJsRootId;
    detail.menu.addItem({
      iconHTML: "",
      label: "自定义粘贴",
      click(_element, _event) {
        const lastEle = detail.blockElements[detail.blockElements.length - 1];
        const id = lastEle.getAttribute("data-node-id");
        customPaste(id, detail.protyle, docId.value);
      },
    });
  };

  private async initBlockCustomCopy() {
    const snippets = await getAllJs(
      EComponent.Copy,
      this.data.config.blockCusCopyJsRootId.value
    );
    for (const snippet of snippets) {
      this.addCommand({
        langKey: PluginName + encodeURIComponent(snippet.label),
        langText: "自定义块复制-" + snippet.label,
        hotkey: "",
        editorCallback: async (protyle) => {
          snippet.snippet = undefined; //*每次运行重新获取脚本内容
          if (this.detail.blockElements.length > 0) {
            this.detail = getSelectedBlocks(protyle, this.detail);
            await execCopy(snippet, this.detail.blockElements, protyle);
          } else {
            showMessage("未选择任何块");
          }
        },
      });
    }
    //this.blockCustomCopySubmenus = submenu;
  }
  private addCustomCopyMenu = (detail: {
    menu: Menu;
    blockElements: HTMLElement[];
    protyle: IProtyle;
  }) => {
    const menu: IMenu = {
      iconHTML: "",
      label: this.i18n.BlockCustomCopyName,
      id: EComponent.Copy,
      //submenu: [],
      click: () => {
        protyleUtilDialog(
          detail.blockElements,
          detail.protyle,
          this.data.config.blockCusCopyJsRootId.value,
          EComponent.Copy
        );
      },
    };
    detail.menu.addItem(menu);
  };

  //获取js块
  private async initBlockCustomUpdate() {
    const snippets = await getAllJs(
      EComponent.Update,
      this.data.config.blockCusUpdateJsRootId.value
    );
    for (const snippet of snippets) {
      this.addCommand({
        langKey: PluginName + encodeURIComponent(snippet.label),
        langText: "自定义块更新-" + snippet.label,
        hotkey: "",
        editorCallback: async (protyle) => {
          snippet.snippet = undefined; //*每次运行重新获取脚本内容
          if (this.detail.blockElements.length > 0) {
            this.detail = getSelectedBlocks(protyle, this.detail);
            await execUpdate(snippet, this.detail.blockElements, protyle);
          } else {
            showMessage("未选择任何块");
          }
        },
      });
    }
  }

  private addCustomUpdateMenu = async (detail: {
    menu: Menu;
    blockElements?: HTMLElement[];
    data?: IGetDocInfo;
    protyle: IProtyle;
  }) => {
    detail.menu.addItem({
      iconHTML: "",
      label: this.i18n.BlockCustomUpdateName,
      id: EComponent.Update,
      click: () => {
        protyleUtilDialog(
          detail.blockElements,
          detail.protyle,
          this.data.config.blockCusUpdateJsRootId.value,
          EComponent.Update
        );
      },
    });
  };

  //todo 获取js文件元数据
  private loadPresetSnippet = async (fileName: string) => {
    const json = await this.loadData(fileName);
    const comments = extract(json) as {
      type: "BlockComment" | "LineComment";
      value: string;
    }[];
    const metadataComment = comments.find((e) => {
      return e.type === "BlockComment" && e.value.startsWith("metadata");
    });
    const metadata = metadataComment.value.split("\n").reduce((acc, cur) => {
      const group = cur.match(/@(.*?) (.*)/);
      if (!group) {
        return acc;
      }
      acc[group[1]] = group[2];
      return acc;
    }, {});
    return metadata;
  };

  private addSaveSnippetMenu = async (detail: {
    menu: Menu;
    blockElements: HTMLElement[];
    protyle: IProtyle;
  }) => {
    //仅对单个块有效
    if (detail.blockElements.length > 1) {
      return;
    }
    const blockType = detail.blockElements[0].getAttribute("data-type");
    if (blockType !== "NodeCodeBlock") {
      return;
    }
    const saveSnippet = async (dirName: string) => {
      //* fileName见this.data
      const code = detail.blockElements[0].querySelector(
        "[contenteditable=true]"
      )?.textContent;
      if (!code) {
        return;
      }
      const blockId = detail.blockElements[0].getAttribute("data-node-id");
      const name = detail.blockElements[0].getAttribute("name");
      const id = blockId + "-" + window.siyuan.user?.userId || "unknownUserId";
      const fileName = name || id;
      await this.saveData(`${dirName}/${fileName}.js`, code);
    };
    detail.menu.addItem({
      iconHTML: "",
      label: this.i18n.saveSnippet,
      id: "saveSnippet",
      submenu: [
        {
          iconHTML: "",
          label: this.i18n.BlockCustomCopyName,
          type: "submenu",
          click: () => saveSnippet(EComponent.Copy),
        },
        {
          iconHTML: "",
          label: this.i18n.BlockCustomUpdateName,
          type: "submenu",
          click: () => saveSnippet(EComponent.Update),
        },
        {
          iconHTML: "",
          label: this.i18n.CustomPasteName,
          type: "submenu",
          click: () => saveSnippet(EComponent.Paste),
        },
      ],
    });
  };
}
