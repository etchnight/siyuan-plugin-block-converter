/**
 * @metadata
 * 粘贴表格的自定义更新版本
 *
 */

const func = async () => {
  input.isIgnore = true;
  await tools.executeFunc(input, tools, output, {
    isFile: true,
    path: "CustomPaste/preinstalled/表格.ts",
  });
  await tools.executeFunc(input, tools, output, {
    isFile: true,
    path: "blockCustomUpdate/preinstalled/附加工具函数.ts",
  });
  const ClipboardHtml = (await tools.getClipboardHtml()) as string;
  const table = tools.turndown.turndown(ClipboardHtml);

  if (input.index == 0) {
    input.isIgnore = false;
  } else {
    input.isIgnore = true;
  }
  output = output + "\n\n" + table;
  return output;
};
output = await func();
