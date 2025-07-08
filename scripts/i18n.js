import fs from "fs";
export const i18nObj = {
  zh_CN: {
    /**功能 */
    name_blockCustomUpdate: "自定义更新",
    name_blockCustomCopy: "自定义复制",
    name_customPaste: "自定义粘贴",
    name_saveSnippet: "保存为代码片段",
    name_plugin: "块转换工具",
    /**设置 */
    setting_isTurnON: "是否开启", //是否在选项中开启
    setting_jsDoc: "js所在文档",
    setting_previewLimit: "预览显示的块数量",
    setting_previewLimitDesc: "当设置为0时，不限制预览显示的块数量",
    /**消息 */
    message_saveSnippetSuccess: "保存成功",
    message_getClipboardHtml: "请粘贴html或纯文本",
    message_timeout: "运行超时",
    message_error: "运行错误",
    message_error1: "脚本运行出错，请查看控制台",
    message_copySuccess: "已写入剪贴板",
    message_updateSuccess: "更新成功",
    message_completed: "已完成: ",
    message_noSnippet: "当前代码片段没有找到有效内容",
    message_backupSnippet:
      "请勿在“preinstalled”文件夹保存自定义代码片段，请从控制台查看备份文件位置",
    message_onload_warning:
      "每次加载插件时，'preinstalled'文件夹下的代码片段将被覆盖，请勿在该文件夹存放自定义代码片段",
    /**dialog */
    dialog_protyle_util_description: "脚本描述",
    dialog_protyle_util_preview: "脚本预览",
    dialog_protyle_util_preview_memo: "(仅前${arg1}个块)",
  },
  en_US: {
    name_blockCustomUpdate: "custom update",
    name_blockCustomCopy: "custom copy",
    name_customPaste: "custom paste",
    name_saveSnippet: "save as code snippet",
    name_plugin: "Block Converter",

    setting_isTurnON: "turn on to enable", //是否在选项中开启
    setting_jsDoc: "document of JavaScript segment",
    setting_previewLimit: "Number of blocks displayed in preview",
    setting_previewLimitDesc:
      "When set to 0, the number of blocks displayed in the preview is not limited",

    message_saveSnippetSuccess: "save successfully",
    message_getClipboardHtml: "Please paste html or plain text",
    message_timeout: "Run timed out",
    message_error: "Running error",
    message_error1:
      "There was an error with the script running, please check the console",
    message_copySuccess: "written to the clipboard",
    message_updateSuccess: "Updated successfully",
    message_completed: "completed: ",
    message_noSnippet:
      "The current code snippet does not contain valid content.",
    message_backupSnippet:
      "Please do not save custom  snippets in the 'preinstalled' folder. Please check the console for the location of the backup file.",
    message_onload_warning:
      "Each time the plugin is loaded, the code snippets in the 'preinstalled' folder will be overwritten. Do not store custom code snippets there.",
    /**dialog */
    dialog_protyle_util_description: "Script description",
    dialog_protyle_util_preview: "Result preview",
    dialog_protyle_util_preview_memo: " (only the first ${arg1} blocks)",
  },
};

function check() {
  for (const key of Object.keys(i18nObj.zh_CN)) {
    if (!i18nObj.en_US[key]) {
      throw new Error(`i18nObj.en_US.${key} is not defined`);
    }
  }
}

function buildType() {
  let typeStr = "export type i18nObj = {\n";
  for (const key of Object.keys(i18nObj.zh_CN)) {
    typeStr += `"${key}":string,\n`;
  }
  typeStr += "}";
  fs.writeFileSync("./src/types/i18nObj.d.ts", typeStr, "utf-8");
}

function buildFile() {
  check();
  for (const lang of Object.keys(i18nObj)) {
    const values = i18nObj[lang];
    const json = JSON.stringify(values, null, 2);
    fs.writeFileSync(`./public/i18n/${lang}.json`, json, "utf-8");
  }
  buildType();
}

buildFile();
