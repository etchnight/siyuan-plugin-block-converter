/**
 * @metadata
 * 这是一个示例脚本，其功能是将Word中粘贴的大于等于二号字转化为二级标题
 * 
 * 这个脚本目前并不完善，因为行内大于于等于二号字的文本会被误判为标题
 * 
```html
<!--这是输入内容示例（解析后结果）-->
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
```

 */
[
  {
    filter: function (node, options) {
      const fontSize = node.style.fontSize;
      const fontSizeNum = parseInt(fontSize);
      return fontSizeNum >= 22;
    },
    replacement: function (content, node, options) {
      return "## " + content;
    },
  },
];
