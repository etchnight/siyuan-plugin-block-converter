function buildFlowId(id: BlockId) {
  return "a" + id.replace("-", "");
}
export function buildFlowNode(
  id: BlockId,
  markdown: string,
  flowRefs: string[]
) {
  //markdown转义
  let result = markdown.replace(/(\"|\')/g, "#quot;");
  for (let content of flowRefs) {
    let customerRes = content.match(/(?<=\[)(.*?)(?=\](-&gt;|&gt;-))/);
    if (customerRes) {
      result = customerRes[0];
    }
    result = result.replace(content, "");
  }
  //节点形状
  const prefix = flowRefs.length > 1 ? "{{" : "[";
  const suffix = flowRefs.length > 1 ? "}}" : "]";
  return buildFlowId(id) + `${prefix}\"\`${result}\`\"${suffix}`;
}
/**
 *
 * @returns   ` A-->|text|B`;
 */
export function buildFlowEdge(
  id: BlockId,
  targetId: BlockId,
  refContent: string
) {
  let textOnArrow = "";
  //const arrowText = ["是", "yes", "否", "no"];
  /**
   * @param isMatch 在match中使用为ture，在search中使用为false
   * @returns 箭头+中英文括号+括号内内容+中英文括号，isMatch为ture时使用预查
   */
  const regexFunc = (isMatch?: boolean) => {
    const prefix = isMatch ? "?<=" : "";
    const suffix = isMatch ? "?=" : "";
    return new RegExp(`(${prefix}-&gt;(\\(|（))(.*?)(${suffix}(\\)|）))`, "g");
  };
  const index = refContent.toLowerCase().search(regexFunc());
  if (index === 0) {
    const matchResult = refContent.toLowerCase().match(regexFunc(true));
    textOnArrow = "|" + matchResult[0] + "|";
  }
  return `${buildFlowId(id)} -->${textOnArrow}${buildFlowId(targetId)}`;
}
