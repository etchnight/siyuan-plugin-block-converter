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
/**
 * 自定义函数输入参数1 : input，选择的块信息
 */

tools.turndown.addRule("表格粘贴加强", {
  filter: "table",
  replacement: function (_content, node: HTMLTableElement, _options) {
    let newTable = tools.lute.Md2BlockDOM(tools.lute.HTML2Md(node.outerHTML));
    return newTable;
  },
});

if (!input.isIgnore) {
  output = tools.turndown.turndown(output);
}
