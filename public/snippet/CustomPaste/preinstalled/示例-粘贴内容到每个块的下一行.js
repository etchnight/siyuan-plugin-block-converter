/**
 * @metadata
 * ### 粘贴内容到每个块的下一行示例
 * 
#### 1.把以下两个块复制到你的笔记，并选择：

这是一个多段文字

我们把它们翻译成英文，然后粘贴到每一个块的下一行

#### 2.把以下内容复制到剪贴板：

This is a multi-paragraph text.
<br>
We translate them into English and then paste it below each block.

#### 3.执行自定义粘贴，会发现，每一个块的下一行都粘贴了剪贴板的对应内容
 */

tools.turndown.addRule("粘贴内容到每个块的下一行示例", {
  filter: function (node, options) {
    return node.tagName === "BR";
  },
  replacement: function (content, node, options) {
    return "\n\n";
  },
});

if (!input.isIgnore) {
  output = tools.turndown.turndown(output);
}
