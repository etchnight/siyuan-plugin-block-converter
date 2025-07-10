/**
 * @metadata
 * 文档所有标题降级，点击文档块标使用
 * 思源仅内置标题下降级功能，此插件为文档所有标题降级
 */


if (input.block.type !== "h") {
  input.isIgnore = true;
} else if (input.block.subtype === "h6") {
  input.isIgnore = true;
} else {
  output = "#" + output;
}
