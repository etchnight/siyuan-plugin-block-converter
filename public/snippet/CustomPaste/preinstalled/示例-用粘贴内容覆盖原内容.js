/**
 * @metadata
 * ### 示例-用粘贴内容覆盖原内容
 * 
#### 1.把以下两个块复制到你的笔记，并选择：

这是一个多段文字

我们把它们翻译成英文，然后粘贴到每一个块的下一行

#### 2.把以下内容复制到剪贴板：

This is a multi-paragraph text.
<br>
We translate them into English and then paste it below each block.

#### 3.执行自定义粘贴，会发现，每一个块都被替换成了剪贴板的对应内容
 */

tools.turndown.addRule("示例-用粘贴内容覆盖原内容", {
  filter: function (node, options) {
    return node.tagName === "BR";
  },
  replacement: function (content, node, options) {
    return "\n\n";
  },
});

//!这会导致粘贴的内容替换掉原内容
input.isDelete = true;

if (!input.isIgnore) {
  output = tools.turndown.turndown(output);
}
