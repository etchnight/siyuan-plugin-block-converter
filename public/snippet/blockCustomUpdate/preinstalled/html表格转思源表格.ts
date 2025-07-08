input.isIgnore = true;
await tools.executeFunc(input, tools, output, {
  isFile: true,
  path: "blockCustomUpdate\\preinstalled\\粘贴表格.ts",
});
input.isIgnore = false;
output = tools.turndown.turndown(output);
