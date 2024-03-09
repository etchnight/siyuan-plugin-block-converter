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
  subgraph = "sub",
  end = "end",
}
export function searchComp(str: string) {
  str = str.trimStart();
  let result = {
    input: str,
    label: "",
    arrow: "",
    linkLabel: "",
    matchtext: "",
  };
  const reg = new RegExp( //0
    "(" + //1
      `(${EReg.方括号左})` + //2
      `(.*?)` + //3
      `(${EReg.方括号右})` + //4
      ")?" +
      `(${EReg.右箭头}|${EReg.左箭头})` + //5
      "(" + //6
      `(${EReg.括号左})` + //7
      `(.*?)` + //8
      `(${EReg.括号右})` + //9
      ")?"
  );
  const index = str.search(reg);
  if (index === 0) {
    const matchResult = str.match(reg);
    //console.log(matchResult);
    result.label = matchResult[3] || "";
    result.arrow = matchResult[5] || "";
    result.linkLabel = matchResult[8] || "";
    result.matchtext = matchResult[0] || "";
  }
  //console.log(matchResult);
  return result;
}

export type RefAnchorCompo = ReturnType<typeof searchComp>;
enum Enodetype {
  subgraph = "sub",
  node = "node",
}
/**
 *
 * @param id
 * @returns a+块id去除横杠+数字
 */
function buildFlowId(id: BlockId, subgraph = false) {
  let result = id.replace("-", "");
  if (subgraph) {
    result = Enodetype.subgraph + result;
  } else {
    result = Enodetype.node + result;
  }
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
  //兜底
  if (!markdown) {
    markdown = " ";
  }
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
  let result: string[] = [];
  //方向
  let newId = buildFlowId(id);
  let newTargetId = buildFlowId(targetId);
  if (!refAnchorCompo.arrow.startsWith("-")) {
    [newId, newTargetId] = [newTargetId, newId];
  }

  const labelCompo = refAnchorCompo.linkLabel.split(/:|：/);
  //线上文字
  let textOnArrow = "";
  let keywordFlag = false;
  for (let key in Ekeyword) {
    if (labelCompo[0] === Ekeyword[key]) {
      keywordFlag = true;
      break;
    }
  }
  if (keywordFlag) {
    textOnArrow = labelCompo.slice(1).join(":");
  } else {
    textOnArrow = labelCompo[0];
  }
  textOnArrow = textOnArrow ? "|" + textOnArrow + "|" : "";

  //关键字处理
  let arrow = "-->";
  if (labelCompo[0] === Ekeyword.event) {
    arrow = "-.->";
    result.push(`${newId}${arrow}${textOnArrow}${newTargetId}`);
  } else if (labelCompo[0] === Ekeyword.subgraph) {
    result.push(`${newId}${arrow}${textOnArrow}${buildFlowId(targetId, true)}`);
    result.push(`subgraph ${buildFlowId(targetId, true)}`);
  } else if (labelCompo[0] === Ekeyword.end) {
    result.push(`${newId}${arrow}${textOnArrow}${newTargetId}`);
    result.push(`end`);
  } else {
    result.push(`${newId}${arrow}${textOnArrow}${newTargetId}`);
  }
  return result;
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
  let result: string[][] = [];
  let safeCount = 0;
  while (safeCount < 100 && refInfoCompo.arrow) {
    safeCount++;
    if (count === 0) {
      result.push(buildFlowEdge(id, id + (count + 1), refInfoCompo));
    } else {
      result.push([buildFlowNode(id + count, "", [refInfoCompo])]);
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
  return result;
}

/**
 * 整体修正Flowchart
 */
export function modifyFlowchart(flowchart: string[]) {
  //*补齐 subgraph结构
  let subCount = 0;
  for (let text of flowchart) {
    if (text.startsWith("subgraph")) {
      subCount++;
    } else if (text === "end") {
      subCount--;
    }
  }
  let safeCount = 0;
  while (subCount !== 0 && safeCount < 1000) {
    safeCount++;
    if (subCount < 0) {
      flowchart.splice(0, 0, `subgraph ${subCount}`);
      subCount++;
    } else {
      flowchart.push("end");
      subCount--;
    }
  }
  //*修改subgraph
  for (let i = 0; i < flowchart.length; i++) {
    let text = flowchart[i];
    if (text.startsWith("subgraph ")) {
      const id = text.split(" ")[1].replace(Enodetype.subgraph, "");
      const node = flowchart.find((e) => {
        const reg = new RegExp(`${Enodetype.node}${id}\\\[.*?\\\]`);
        return e.search(reg) !== -1;
      });
      flowchart[i] = node.replace(
        Enodetype.node,
        `subgraph ${Enodetype.subgraph}`
      );
    }
  }
}
