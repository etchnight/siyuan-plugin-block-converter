/**
 * @metadata
 * * 排版综合的代码片段将各类排版需求继续了结合，具体包含：
 *
 *  * 空格替换
 *  * 西文字符替换为中文字符
 *  * 在中文和英文之间增加空格
 *
 * 使用 markdown 或者 dom 的 textContent 替换空格会引起格式丢失问题，所以以下代码片段使用的是逐节点遍历方法。
 */

const dom = tools.lute.Md2BlockDOM(output);
const div = document.createElement("div");
div.innerHTML = dom;
const symbols = [
  { en: /,/g, zh: "，" },
  { en: /;/g, zh: "；" },
  { en: /\(/g, zh: "（" },
  { en: /\)/g, zh: "）" },
  { en: /!/g, zh: "！" },
  { en: /(?<![0-9])\./g, zh: "。" }, //阿拉伯数字后紧跟的“.”不会被捕获
  { en: /:/g, zh: "：" },
  { en: /(?<![a-zA-Z]) (?![a-zA-Z])/g, zh: "" }, //空格替换,英文前后的空格不替换
  { en: />/g, zh: "〉" },
  { en: /</g, zh: "〈" },
  { en: /\t/, zh: "" },
  //在中文和英文之间增加空格
  { en: /([A-Za-z]+)([\u4e00-\u9fa5]+)/g, zh: "$1 $2" },
  { en: /([\u4e00-\u9fa5]+)([A-Za-z]+)/g, zh: "$1 $2" },
];
replaceSpace(div);
function replaceSpace(div) {
  for (let child of div.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      symbols.forEach((e) => {
        child.textContent = child.textContent.replace(e.en, e.zh);
      });
    }
    replaceSpace(child);
  }
}
output = tools.lute.BlockDOM2Md(div.innerHTML);
