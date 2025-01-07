export const CONSTANTS = {
  PluginName: "siyuan-plugin-block-converter", //用于id等
  STORAGE_PATH: "/data/storage/petal/siyuan-plugin-block-converter/",
  PLUGIN_SNIPPETS_PATH: "/data/plugins/siyuan-plugin-block-converter/snippet/",
};

/**
 * 组件的名称，用于函数参数等
 */
export enum EComponent {
  Copy = "blockCustomCopy",
  Update = "blockCustomUpdate",
  Paste = "CustomPaste",
}
