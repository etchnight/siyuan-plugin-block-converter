/**
 * @metadata
 * 这是一个示例脚本，其功能是将Word中粘贴的大于等于二号字转化为二级标题
 * 
 * 这个脚本目前并不完善，因为行内大于于等于二号字的文本会被误判为标题
 * 
 * 复制以下内容，然后执行自定义粘贴，即可看到效果
 * 
<div>
<p
  class="MsoPlainText"
  align="center"
  style="text-align: center; line-height: 28pt; mso-line-height-rule: exactly">
  <span
    style="
      mso-spacerun: 'yes';
      font-family: 宋体;
      font-size: 22pt;
      mso-font-kerning: 1pt;
    "
    ><font face="宋体">标题文本</font></span
  >
</p>
<div>

 */

input.isIgnore = true;
await tools.executeFunc(input, tools, output, {
  path: "/CustomPaste/preinstalled/表格.ts",
});

tools.turndown.addRule("示例", {
  filter: function (node, options) {
    const fontSize = node.style.fontSize;
    const fontSizeNum = parseInt(fontSize);
    return fontSizeNum >= 22;
  },
  replacement: function (content, node, options) {
    return "## " + content;
  },
});

input.isIgnore = false;
if (!input.isIgnore) {
  output = tools.turndown.turndown(output);
}
