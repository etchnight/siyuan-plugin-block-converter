import fs from "fs";
export const i18nObj = {
  zh_CN: {
    BlockCustomUpdateName: "自定义更新",
    BlockCustomCopyName: "自定义复制",
    CustomPasteName: "自定义粘贴",
    isTurnON: "是否开启", //是否在选项中开启
    saveSnippet: "保存为代码片段",
  },
  en_US: {
    BlockCustomUpdateName: "custom update",
    BlockCustomCopyName: "custom copy",
    CustomPasteName: "custom paste",
    isTurnON: "turn on to enable", //是否在选项中开启
    saveSnippet: "save as code snippet",
  },
};

function buildFile() {
  for (let lang of Object.keys(i18nObj)) {
    const values = i18nObj[lang];
    const json = JSON.stringify(values, null, 2);
    fs.writeFileSync(`./public/i18n/${lang}.json`, json, "utf-8");
  }
}

buildFile();
