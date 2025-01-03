/**
@metadata
列表转mermaid流程图，无序列表视为分支，有序列表视为顺序执行。

**示例**：

* 流程开始

  * 分支1
  * 分支2，含有子顺序

    1. 第一步
    2. 第二步
    3. 第三步
  * 分支3

```mermaid
 flowchart TD
20240609193756-o05tsgj["`
`"]
20240609193756-lc5iyjq["`流程开始`"]
20240609193756-x9shzte["`
`"]
20240609193756-usp2txi["`分支1
`"]
20240609193756-sd5uewa["`分支2，含有子顺序
`"]
20240609193756-edkdpjj["`
`"]
20240609193756-0mysrhz["`第一步
`"]
20240609193756-ko3recd["`第二步
`"]
20240609193756-jbwn08u["`第三步
`"]
20240609193756-cr44ed9["`分支3
`"]
20240609193756-x9shzte --> 20240609193756-usp2txi
20240609193756-edkdpjj --> 20240609193756-0mysrhz
20240609193756-0mysrhz --> 20240609193756-ko3recd
20240609193756-ko3recd --> 20240609193756-jbwn08u
20240609193756-sd5uewa --> 20240609193756-edkdpjj
20240609193756-x9shzte --> 20240609193756-sd5uewa
20240609193756-x9shzte --> 20240609193756-cr44ed9
20240609193756-lc5iyjq --> 20240609193756-x9shzte
20240609193756-o05tsgj --> 20240609193756-lc5iyjq
```
 */

let dom = document.createElement("div");
dom.innerHTML = tools.lute.Md2BlockDOM(output);
dom = dom.firstElementChild;
let nodeList = [];
let edgeList = [];
recur(dom);
function recur(dom) {
  if (!dom.getAttribute("data-node-id")) {
    return;
  }
  const id = dom.getAttribute("data-node-id");
  const type = dom.getAttribute("data-type");
  switch (type) {
    //*容器块
    case "NodeList":
    case "NodeListItem":
      nodeList.push({ id, content: "", type });
      let lastChild = null;
      const subType = dom.getAttribute("data-subtype");
      for (let child of dom.children) {
        recur(child);
        const childId = child.getAttribute("data-node-id");
        if (!childId) {
          continue;
        }
        const childType = child.getAttribute("data-type");
        if (childType !== "NodeList" && childType !== "NodeListItem") {
          nodeList.push({
            id: childId,
            content: child.textContent,
            type: childType,
            parentId: lastChild ? null : id,
          });
        }
        if (subType === "u") {
          edgeList.push({ source: id, target: childId });
        } else if (subType === "o") {
          if (lastChild) {
            const lastChildId = lastChild.getAttribute("data-node-id");
            edgeList.push({ source: lastChildId, target: childId });
          } else {
            edgeList.push({ source: id, target: childId });
          }
        }
        lastChild = child;
      }
      break;
    default:
      return;
  }
}
//*后处理，将列表项中的第一个段落去除，并将其内容作为父级（列表项的内容）
//*可以进一步将列表的第一个列表项去除，但是暂时不做处理
nodeList.map((child) => {
  if (!child.parentId) {
    return;
  }
  edgeList.forEach((e) => {
    if (e.source === child.id) {
      e.source = child.parentId;
    }
    if (e.target === child.id) {
      e.target = child.parentId;
    }
  });
  nodeList.find((e) => e.id === child.parentId).content = child.content;
});
nodeList = nodeList.filter((e) => !e.parentId);
edgeList = edgeList.filter((e) => e.source !== e.target);
let mermaid = nodeList.reduce((pre, cur) => {
  let content = tools.lute.BlockDOM2Md(cur.content).replace(/\{:.*?\}/g, "");
  content = content.replace(/[\r\n|\r|\n]{2,}/, "");
  return pre + `${cur.id}["\`${content}\`"]` + "\r\n";
}, "");
mermaid =
  mermaid +
  edgeList.reduce((pre, cur) => {
    return pre + `${cur.source} --> ${cur.target}` + "\r\n";
  }, "");
mermaid = `
\`\`\`mermaid
flowchart TD
${mermaid}
\`\`\`
`;

output = output + "\r\n\r\n" + mermaid;
