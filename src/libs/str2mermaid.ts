enum EReg {
  括号左 = "\\(|（",
  括号右 = "\\)|）",
  右箭头 = "-&gt;",
  左箭头 = "&gt;-",
  方括号左 = "\\[|【",
  方括号右 = "\\]|】",
}
export function searchComp(str: string) {
  const reg = new RegExp(
    `(${EReg.方括号左}?)` +
      `(.*?)` +
      `(${EReg.方括号右}?)` +
      `(${EReg.右箭头}|${EReg.左箭头})` +
      "(" +
      `(${EReg.括号左})` +
      `(.*?)` +
      `(${EReg.括号右})` +
      ")?"
  );
  const index = str.search(reg);
  if (index !== 0) {
    return {
      input: str,
      label: "",
      arrow: "",
      linkLabel: "",
    };
  }
  const matchResult = str.match(reg);
  //console.log(matchResult);
  return {
    input: str,
    label: matchResult[2],
    arrow: matchResult[4],
    linkLabel: matchResult[7],
  };
}

export type RefAnchorCompo = ReturnType<typeof searchComp>;

function buildFlowId(id: BlockId) {
  return "a" + id.replace("-", "");
}
export function buildFlowNode(
  id: BlockId,
  markdown: string,
  flowRefs: RefAnchorCompo[]
) {
  let result = markdown;
  //去除流程图链接文本
  for (let ref of flowRefs) {
    if (ref.label) {
      result = ref.label;
      break;
    } else {
      result = result.replace(ref.input, "");
    }
  }
  //markdown转义
  result = result.replace(/(\"|\')/g, "#quot;");
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
  refAnchorCompo: RefAnchorCompo
) {
  let textOnArrow = refAnchorCompo.linkLabel
    ? "|" + refAnchorCompo.linkLabel + "|"
    : "";
  return `${buildFlowId(id)} -->${textOnArrow}${buildFlowId(targetId)}`;
}
