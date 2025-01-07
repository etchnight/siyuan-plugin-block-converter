import {
  Plugin,
  Menu,
  showMessage,
  IWebSocketData,
  IMenu,
  IProtyle,
  IGetDocInfo,
} from "siyuan";
import {
  buildSetting,
  SettingData,
} from "../subMod/siyuanPlugin-common/component/setting";
import { execCopy } from "./libs/customCopy";
import { execUpdate } from "./libs/customUpdate";
import {
  getAllJs,
  getJsFiles,
  getSelectedBlocks,
  getSnippetType,
  ISnippet,
  protyleUtilDialog,
} from "./libs/common";
import { execPaste } from "./libs/customPaste";
import { store, switchPreviewLimit, switchWait } from "./libs/store";
import {
  getFile,
  putFile,
  removeFile,
} from "../subMod/siyuanPlugin-common/siyuan-api/file";
import { CONSTANTS, EComponent } from "./libs/constants";
import { i18nObj } from "./types/i18nObj";
//import { getJsdocData } from "jsdoc-to-markdown";
//import doctrine from "doctrine";

//const STORAGE_CONFIG_NAME = "config.json";
const CONFIG_NAME = "config.json";
interface IConfig {
  isCustomPaste: SettingData;
  customPasteJsRootId: SettingData;
  isBlockCusCopy: SettingData;
  blockCusCopyJsRootId: SettingData;
  isBlockCusUpdate: SettingData;
  blockCusUpdateJsRootId: SettingData;
  previewLimit: SettingData; //预览窗口的块数限制
}

export default class PluginBlockConverter extends Plugin {
  //* 此处需要与i18n.json中的key对应
  declare public data: {
    //config: typeof DefaultDATA.config;
    "config.json": IConfig;
  };
  declare public i18n: i18nObj;
  async onload() {
    //this.displayName = "块转换工具"; //?不能自动加载插件名称
    this.eventBus.on("click-blockicon", this.blockIconEvent);
    this.eventBus.on("ws-main", this.switchWait);
    this.eventBus.on("click-editortitleicon", this.openMenuDoctreeEvent);

    await this.loadConfig();

    const confirmCallback = async () => {
      switchPreviewLimit(this.data[CONFIG_NAME].previewLimit.value as number);
    };
    buildSetting(
      this.data[CONFIG_NAME] as any as { [key: string]: SettingData },
      {
        storageName: CONFIG_NAME,
        isReload: false,
        plugin: this,
        confirmCallback,
      }
    );
    this.initCommand();
    this.loadPresetSnippet();
    //await this.loadPresetSnippet("blockCustomUpdate/法条自动链接.js");
  }

  onLayoutReady() {}

  onunload() {
    this.eventBus.off("click-blockicon", this.blockIconEvent);
    this.eventBus.off("ws-main", this.switchWait);
    this.eventBus.off("click-editortitleicon", this.openMenuDoctreeEvent);
  }

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

  private async loadConfig() {
    const DefaultDATA: { config: IConfig } = {
      config: {
        isCustomPaste: {
          type: "switch",
          title: `${this.i18n.name_customPaste} - ${this.i18n.setting_isTurnON}`,
          value: true,
        },
        customPasteJsRootId: {
          type: "input",
          title: `${this.i18n.name_customPaste} - ${this.i18n.setting_jsDoc}`,
          value: "",
        },
        isBlockCusCopy: {
          type: "switch",
          title: `${this.i18n.name_blockCustomCopy} - ${this.i18n.setting_isTurnON}`,
          value: true,
        },
        blockCusCopyJsRootId: {
          type: "input",
          title: `${this.i18n.name_blockCustomCopy} - ${this.i18n.setting_jsDoc}`,
          value: "",
        },
        isBlockCusUpdate: {
          type: "switch",
          title: `${this.i18n.name_blockCustomUpdate} - ${this.i18n.setting_isTurnON}`,
          value: true,
        },
        blockCusUpdateJsRootId: {
          type: "input",
          title: `${this.i18n.name_blockCustomUpdate} - ${this.i18n.setting_jsDoc}`,
          value: "",
        },
        previewLimit: {
          type: "slider",
          title: `${this.i18n.setting_previewLimit}`,
          value: "10",
          range: { min: 0, max: 50, step: 10 },
          description: this.i18n.setting_previewLimitDesc,
        },
      },
    };
    await this.loadData(CONFIG_NAME);
    //* 注意，STORAGE_NAME 为 CONFIG_NAME，不是 "config"
    this.data[CONFIG_NAME] = Object.assign(
      DefaultDATA.config,
      this.data[CONFIG_NAME]
    );
    switchPreviewLimit(this.data[CONFIG_NAME].previewLimit.value as number);
    //this.updateConfig();
  }

  private blockIconEvent = ({
    detail,
  }: {
    detail: { menu: Menu; blockElements: HTMLElement[]; protyle: IProtyle };
  }) => {
    //this.detail = detail; //快捷键使用
    this.addUtilDialogMenu(detail);
    /*     this.data[CONFIG_NAME].isBlockCusCopy.value && this.addCustomCopyMenu(detail);
    this.data[CONFIG_NAME].isBlockCusUpdate.value && this.addCustomUpdateMenu(detail);
    this.data[CONFIG_NAME].isCustomPaste.value && this.addCustomPasteMenu(detail); */
    this.addSaveSnippetMenu(detail);
  };

  private openMenuDoctreeEvent = ({
    detail,
  }: {
    detail: { menu: Menu; data: IGetDocInfo; protyle: IProtyle };
  }) => {
    this.addUtilDialogMenu(detail, true);
  };

  private addUtilDialogMenu = async (
    detail: {
      menu: Menu;
      blockElements?: HTMLElement[];
      data?: IGetDocInfo;
      protyle: IProtyle;
    },
    isdocument: boolean = false
  ) => {
    const info: {
      label: string;
      id: string;
      component: EComponent;
      rootId?: string;
    }[] = [];
    if (this.data[CONFIG_NAME].isBlockCusCopy.value) {
      info.push({
        label: this.i18n.name_blockCustomCopy,
        id: EComponent.Copy,
        component: EComponent.Copy,
        rootId: this.data[CONFIG_NAME].blockCusCopyJsRootId.value as string,
      });
    }
    if (this.data[CONFIG_NAME].isBlockCusUpdate.value) {
      info.push({
        label: this.i18n.name_blockCustomUpdate,
        id: EComponent.Update,
        component: EComponent.Update,
        rootId: this.data[CONFIG_NAME].blockCusUpdateJsRootId.value as string,
      });
    }
    if (this.data[CONFIG_NAME].isCustomPaste.value) {
      info.push({
        label: this.i18n.name_customPaste,
        id: EComponent.Paste,
        component: EComponent.Paste,
        rootId: this.data[CONFIG_NAME].customPasteJsRootId.value as string,
      });
    }
    for (const item of info) {
      const menu: IMenu = {
        iconHTML: "",
        label: item.label,
        id: item.id,
        //submenu: [],
        click: () => {
          protyleUtilDialog(detail, item.rootId, item.component, isdocument);
        },
      };
      detail.menu.addItem(menu);
    }
  };

  //todo 应该优化，将三个功能合并
  private async initCommand() {
    let snippets: ISnippet[] = [];
    if (this.data[CONFIG_NAME].isBlockCusCopy.value) {
      snippets = await getAllJs(
        EComponent.Copy,
        this.data[CONFIG_NAME].blockCusCopyJsRootId.value as string
      );
      for (const snippet of snippets) {
        this.addCommand({
          langKey: CONSTANTS.PluginName + encodeURIComponent(snippet.label),
          langText: this.i18n.name_blockCustomCopy + "-" + snippet.label,
          hotkey: "",
          editorCallback: async (protyle) => {
            const blockElements = getSelectedBlocks(protyle);
            await execCopy(snippet, blockElements, protyle);
          },
        });
      }
      if (this.data[CONFIG_NAME].isBlockCusUpdate.value) {
        snippets = await getAllJs(
          EComponent.Update,
          this.data[CONFIG_NAME].blockCusUpdateJsRootId.value as string
        );
        for (const snippet of snippets) {
          this.addCommand({
            langKey: CONSTANTS.PluginName + encodeURIComponent(snippet.label),
            langText: this.i18n.name_blockCustomUpdate + "-" + snippet.label,
            hotkey: "",
            editorCallback: async (protyle) => {
              const blockElements = getSelectedBlocks(protyle);
              await execUpdate(snippet, blockElements, protyle);
            },
          });
        }
      }
    }
    if (this.data[CONFIG_NAME].isCustomPaste.value) {
      snippets = await getAllJs(
        EComponent.Paste,
        this.data[CONFIG_NAME].customPasteJsRootId.value as string
      );
      for (const snippet of snippets) {
        this.addCommand({
          langKey: CONSTANTS.PluginName + encodeURIComponent(snippet.label),
          langText: this.i18n.name_customPaste + "-" + snippet.label,
          hotkey: "",
          editorCallback: async (protyle) => {
            const blockElements = getSelectedBlocks(protyle);
            await execPaste(snippet, blockElements, protyle);
          },
        });
      }
    }
    //this.blockCustomCopySubmenus = submenu;
  }

  /**
   * 加载预设的snippet
   * 移动预设文件夹中无关脚本
   */
  private loadPresetSnippet = async () => {
    //const constantPath = "/data/plugins/" + CONSTANTS.PluginName + "/snippet/";
    for (const component of Object.values(EComponent)) {
      const files = await getJsFiles(
        CONSTANTS.PLUGIN_SNIPPETS_PATH + component + "/"
      );
      for (const file of files) {
        const jsContent = await getFile({
          path: file.path,
        });
        await this.saveData(file.path, jsContent);
      }
      //* 移动预设文件夹中无关脚本
      const allFiles = await getJsFiles(
        CONSTANTS.STORAGE_PATH + component + "/preinstalled/"
      );
      //console.log({allFiles});
      //console.log({files});
      for (const file of allFiles) {
        if (file.isDir || files.some((item) => item.name === file.name)) {
          continue;
        }
        const otherFile = await getFile({ path: file.path });
        const newFileName = window.Lute.NewNodeID() + "-" + file.name;
        const newFilePath =
          CONSTANTS.STORAGE_PATH + component + "/backup/" + newFileName;
        await putFile({
          path: newFilePath,
          isDir: false,
          file: new File([otherFile], newFileName, {
            type: "text/plain;charset=utf-8",
          }),
        });
        await removeFile({ path: file.path });
        showMessage(
          `[${this.i18n.name_plugin}]` + this.i18n.message_backupSnippet
        );
        console.warn(`${file.path}\n move to:\n ${newFilePath}`);
      }
    }
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
    const blockLanguage = detail.blockElements[0].querySelector(
      ".protyle-action__language"
    );
    if (!blockLanguage) {
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
      await this.saveData(
        `${dirName}/${fileName}.${getSnippetType(blockLanguage.textContent)}`,
        code
      );
      showMessage(this.i18n.message_saveSnippetSuccess);
    };
    detail.menu.addItem({
      iconHTML: "",
      label: this.i18n.name_saveSnippet,
      id: "saveSnippet",
      submenu: [
        {
          iconHTML: "",
          label: this.i18n.name_blockCustomCopy,
          type: "submenu",
          click: () => saveSnippet(EComponent.Copy),
        },
        {
          iconHTML: "",
          label: this.i18n.name_blockCustomUpdate,
          type: "submenu",
          click: () => saveSnippet(EComponent.Update),
        },
        {
          iconHTML: "",
          label: this.i18n.name_customPaste,
          type: "submenu",
          click: () => saveSnippet(EComponent.Paste),
        },
      ],
    });
  };
}
