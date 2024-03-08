enum EReg {
  括号左 = "\\(|（",
  括号右 = "\\)|）",
  右箭头 = "-&gt;",
  左箭头 = "&lt;-",
  方括号左 = "\\[|【",
  方括号右 = "\\]|】",
}
enum Ekeyword {
  event = "event",
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
      matchtext: "",
    };
  }
  const matchResult = str.match(reg);
  //console.log(matchResult);
  return {
    input: str,
    label: matchResult[2] || "",
    arrow: matchResult[4] || "",
    linkLabel: matchResult[7] || "",
    matchtext: matchResult[0] || "",
  };
}

export type RefAnchorCompo = ReturnType<typeof searchComp>;
/**
 *
 * @param id
 * @returns a+块id去除横杠+数字
 */
function buildFlowId(id: BlockId) {
  let result = "a" + id.replace("-", "");
  if (id.length === 22) {
    result += "0";
  }
  return result;
}
export function buildFlowNode(
  id: BlockId,
  markdown: string,
  flowRefs: RefAnchorCompo[]
) {
  //去除流程图链接文本
  for (let ref of flowRefs) {
    if (ref.label) {
      markdown = ref.label;
      break;
    } else {
      markdown = markdown.replace(ref.input, "");
    }
  }
  //markdown转义
  markdown = markdown.replace(/(\"|\')/g, "#quot;");
  //节点形状
  const prefix = flowRefs.length > 1 ? "{{" : "[";
  const suffix = flowRefs.length > 1 ? "}}" : "]";
  return buildFlowId(id) + `${prefix}\"\`${markdown}\`\"${suffix}`;
}
/**
 *
 * @returns   ` A-->|text|B`;
 */
function buildFlowEdge(
  id: BlockId,
  targetId: BlockId,
  refAnchorCompo: RefAnchorCompo
) {
  //console.log(refAnchorCompo)
  const labelCompo = refAnchorCompo.linkLabel.split(/:|：/);
  let arrow = "-->";
  let textOnArrow = "";
  if (labelCompo[0] === Ekeyword.event) {
    textOnArrow = labelCompo.slice(1).join(":");
    arrow = "-.->";
  }
  textOnArrow = textOnArrow ? "|" + textOnArrow + "|" : "";
  let newId = buildFlowId(id);
  let newTargetId = buildFlowId(targetId);
  if (!refAnchorCompo.arrow.startsWith("-")) {
    [newId, newTargetId] = [newTargetId, newId];
  }
  return `${newId}${arrow}${textOnArrow}${newTargetId}`;
}
/**
 * @param content  `block.content`
 * - `[自身]->(线上文字)[然后]->（event）第三步`
 * - 第一个之后的[]虽为可选，但没有的话会产生无文本节点
 * @returns
 * - `自身-->|线上文字|然后`
 * - `然后-.->第三步的节点`
 */
export function buildFlowEdges(
  id: BlockId,
  targetId: BlockId,
  content: string
) {
  let count = 0;
  let refInfoCompo = searchComp(content);
  let lastRefInfoCompo: RefAnchorCompo;
  let result: string[] = [];
  let safeCount = 0;
  while (safeCount < 100 && refInfoCompo.arrow) {
    safeCount++;
    if (count === 0) {
      result.push(buildFlowEdge(id, id + (count + 1), refInfoCompo));
    } else {
      result.push(buildFlowNode(id + count, "", [refInfoCompo]));
      result.push(buildFlowEdge(id + (count - 1), id + count, refInfoCompo));
    }
    count++;
    content = content.substring(refInfoCompo.matchtext.length);
    lastRefInfoCompo = refInfoCompo;
    refInfoCompo = searchComp(content);
  }
  //最后一个更正
  result[result.length - 1] = buildFlowEdge(
    id + (count - 1),
    targetId,
    lastRefInfoCompo
  );
  //console.log(result);
  return "\n" + result.join("\n");
}
