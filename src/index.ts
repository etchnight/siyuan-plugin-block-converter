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
import { execUpdate } from "./libs/customUpdate";
import {
  getAllJs,
  getJsFiles,
  getSelectedBlocks,
  protyleUtilDialog,
} from "./libs/common";
import {
  store,
  switchPreviewLimit,
  switchProtyle,
  switchWait,
} from "./libs/store";
import { getFile } from "../subMod/siyuanPlugin-common/siyuan-api/file";
import { CONSTANTS } from "./libs/constants";
import { i18nObj } from "./types/i18nObj";
//import { diffLines } from "diff";
//import { getJsdocData } from "jsdoc-to-markdown";
//import doctrine from "doctrine";

//const STORAGE_CONFIG_NAME = "config.json";
const CONFIG_NAME = "config.json";
interface IConfig {
  previewLimit: SettingData; //预览窗口的块数限制
}

export default class PluginBlockConverter extends Plugin {
  //* 此处需要与i18n.json中的key对应
  declare public data: {
    //config: typeof DefaultDATA.config;
    "config.json": IConfig;
    "snippetConfig.json": any;
  };
  declare public i18n: i18nObj;
  async onload() {
    //this.displayName = "块转换工具"; //?不能自动加载插件名称
    this.eventBus.on("click-blockicon", this.blockIconEvent);
    this.eventBus.on("ws-main", this.switchWait);
    this.eventBus.on("click-editortitleicon", this.openMenuDocTreeEvent);
    this.eventBus.on("switch-protyle", switchProtyle);
    await this.loadConfig();
    showMessage(
      `[${this.i18n.name_plugin}]${this.i18n.message_onload_warning}`,
      7,
      "error"
    );
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
    this.eventBus.off("click-editortitleicon", this.openMenuDocTreeEvent);
    this.eventBus.off("switch-protyle", switchProtyle);
  }

  /**
   * 等待写入数据库完成
   * @param param0
   */
  private switchWait = ({ detail }: { detail: IWebSocketData }) => {
    if (detail.cmd === "transactions") {
      switchWait(true);
    }
    //* 见 siyuan\kernel\task\queue.go
    if (
      (detail.cmd === "databaseIndexCommit" ||
        detail.cmd === "databaseIndexRef" ||
        detail.cmd === "databaseIndexFix" ||
        detail.cmd === "databaseIndexEmbedBlock") &&
      store.waiting === true
    ) {
      switchWait(false);
    }
  };

  /**
   * 加载设置
   */
  private async loadConfig() {
    await this.loadData("snippetConfig.json");
    const DefaultDATA: { config: IConfig } = {
      config: {
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
  }

  private blockIconEvent = ({
    detail,
  }: {
    detail: { menu: Menu; blockElements: HTMLElement[]; protyle: IProtyle };
  }) => {
    //this.detail = detail; //快捷键使用
    this.addUtilDialogMenu(detail);
  };

  private openMenuDocTreeEvent = ({
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
    isDocument: boolean = false
  ) => {
    const menu: IMenu = {
      iconHTML: "",
      label: this.i18n.name_plugin,
      id: CONSTANTS.COMPONENT,
      //submenu: [],
      click: () => {
        protyleUtilDialog(detail, isDocument);
      },
    };
    detail.menu.addItem(menu);
  };

  private async initCommand() {
    let snippets: ISnippet[] = [];

    //* 增加根组件快捷键
    this.addCommand({
      langKey: CONSTANTS.PluginName,
      langText: this.i18n.name_plugin,
      hotkey: "",
      callback: () => {
        if (!store.protyle) {
          showMessage("未找到当前编辑器"); //todo
        } else {
          //todo 在笔记中存储的代码片段RootID未获取
          protyleUtilDialog(
            {
              menu: new Menu(),
              protyle: store.protyle,
              blockElements: getSelectedBlocks(),
            },
            false
          );
        }
      },
    });

    snippets = await getAllJs();
    for (const snippet of snippets) {
      //todo 虽然能执行但是控制台有错误 https://github.com/siyuan-note/siyuan/issues/13314 未测试新版本是否能正常执行
      this.addCommand({
        langKey: CONSTANTS.PluginName + "-" + encodeURIComponent(snippet.label),
        langText: snippet.label,
        hotkey: "",
        callback: () => {
          //*默认callback没有参数，只能尝试从全局获取protyle
          const blockElements = getSelectedBlocks();
          if (!store.protyle) {
            showMessage("未找到当前编辑器"); //todo
          }
          execUpdate(snippet, blockElements, store.protyle);
        },
        editorCallback: async (protyle) => {
          const blockElements = getSelectedBlocks(protyle);
          await execUpdate(snippet, blockElements, protyle);
        },
      });
    }
  }

  /**
   * 加载预设的snippet
   */
  private loadPresetSnippet = async () => {
    const loadFiles = async (dirName: string) => {
      //*获取预设脚本
      const files = await getJsFiles(
        CONSTANTS.PLUGIN_SNIPPETS_PATH + dirName + "/"
      );
      for (const file of files) {
        const jsContent = await getFile({
          path: file.path,
        });
        const newPath = file.path.replace(CONSTANTS.PLUGIN_SNIPPETS_PATH, "");
        await this.saveData(newPath, jsContent);
      }
      return files;
    };
    //*将文件从plugin文件夹移动到storage文件夹
    await loadFiles(CONSTANTS.COMPONENT);
    //*types等文件
    await loadFiles("types");
    //*tsconfig.json
    const tsconfigPath = CONSTANTS.PLUGIN_SNIPPETS_PATH + "tsconfig.json";
    const tsconfig = await getFile({ path: tsconfigPath });
    await this.saveData(
      tsconfigPath.replace(CONSTANTS.PLUGIN_SNIPPETS_PATH, ""),
      tsconfig
    );
  };
}
