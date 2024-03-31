/**
 * ## 流程图生成器

将块引用形式的流程转换为 Mermaid 流程图。

### 使用方法

- 点击块标 -> 插件 -> 生成流程图 -> 生成的流程图插入在该块之后
- 基本语法：`[自身块别名]->(保留关键字:线上文字)其他内容`
  - `->`或`<-`:必需，识别为下一步
  - `(线上文字)`：可选，括号内文本显示在链接上
  - `[自身块别名]`:可选，节点显示自身块别名或所有块文本内容
  - `(保留关键字:线上文字)`:可选，保留关键字表示一些特殊标识
    - event:连接线会改为虚线
    - sub:即 subgraph，后序节点会在子图中显示
    - end:与 sub 成对出现，表示子图结束，会自动追加忘记添加的 end，但如此渲染出的流程图极有可能不正确
- 支持中文字符`【】（）`
- 支持在一个链接中创建一组节点和线，如`[A]->(线上文字1)[B]->(线上文字2)其他内容`会解析为`A-->|线上文字1|B-->|线上文字2|下一步`
 */
import { Menu, Protyle } from "siyuan";
import { TreeTools } from "../../subMod/js-utility-function/src/tree";
import { insertBlock } from "../../subMod/siyuanPlugin-common/siyuan-api/block";
import {
  queryBlockById,
  queryFirstChildBlock,
  queryRefInfoById,
} from "../../subMod/siyuanPlugin-common/siyuan-api/query";
import {
  RefAnchorCompo,
  buildFlowEdges,
  buildFlowNode,
  modifyFlowchart,
  searchComp,
} from "./str2mermaid";

export const block2flowchart = async (detail: {
  menu: Menu;
  blockElements: [HTMLElement];
  protyle: Protyle;
}) => {
  if (detail.blockElements.length !== 1) {
    return;
  }
  const selectElement = detail.blockElements[0];
  const blockId = selectElement.getAttribute("data-node-id");
  detail.menu.addItem({
    iconHTML: "",
    label: "生成流程图",
    click: async () => {
      let flowchart: Array<string | string[] | string[][]> = [
        `%%{init: {"flowchart": {"htmlLabels": false}} }%%`,
        `flowchart TB`,
      ];
      let count = 0;
      let startBlock = await queryBlockById(blockId);
      if (startBlock.type === "i") {
        startBlock = await queryFirstChildBlock(startBlock);
      }
      let queue = [startBlock]; //未完成队列
      let idList: BlockId[] = []; //已完成的，防止重复
      let edges: {
        preId: BlockId;
        id: BlockId;
        flowchart: string[][];
      }[] = [];
      while (queue.length !== 0 && count < 100) {
        //let edges: Array<string | string[] | string[][]> = [];
        let block = queue.pop();
        const id = block.id;
        idList.push(id);
        const refInfos = await queryRefInfoById(id);
        //console.log(refInfos)
        //const defInfos = await queryDefInfoById(id);
        let flowRefs: RefAnchorCompo[] = [];
        for (let item of refInfos) {
          const refInfoCompo = searchComp(item.content);
          if (refInfoCompo.arrow) {
            edges.push({
              preId: id,
              flowchart: buildFlowEdges(id, item.def_block_id, item.content),
              id: item.def_block_id,
            });
            flowRefs.push(refInfoCompo);
            if (!idList.includes(item.def_block_id)) {
              let defBlock = await queryBlockById(item.def_block_id);
              queue.push(defBlock);
            }
          }
        }
        flowchart.push(buildFlowNode(id, block.content, flowRefs));
      }
      const treeTools = new TreeTools({ pid: "preId" });
      const edgeTree = treeTools.fromList(edges);
      treeTools.forEach(edgeTree, (e) => {
        flowchart.push(e.flowchart);
      });
      let result = flowchart.flat(Infinity) as string[];
      //console.log(result);
      modifyFlowchart(result);
      await insertBlock({
        dataType: "markdown",
        data: "```mermaid\n" + result.join("\n") + "\n```",
        previousID: blockId,
      });
    },
  });
};
