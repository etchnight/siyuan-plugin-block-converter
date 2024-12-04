import { IProtyle, Menu, showMessage } from "siyuan";
import {
  getBlockAttrs,
  setBlockAttrs,
} from "../../subMod/siyuanPlugin-common/siyuan-api/attr";
import {
  deleteBlock,
  insertBlock,
  updateBlockWithAttr,
} from "../../subMod/siyuanPlugin-common/siyuan-api/block";
import { queryBlockById } from "../../subMod/siyuanPlugin-common/siyuan-api/query";
import { Block } from "../../subMod/siyuanPlugin-common/types/siyuan-api";
import { executeFunc } from "./utils";
//import { IProtyle } from "../../subMod/siyuanPlugin-common/types/global-siyuan";

export function buildTransform(jsBlock: Block) {
  const transform = async (detail: {
    menu: Menu;
    blockElements: HTMLElement[];
    protyle: IProtyle;
  }) => {
    const lute = detail.protyle.lute; //当前编辑器内的lute实例

    //*从数据库中查询出所有块
    const inputBlocks = await Promise.all(
      detail.blockElements.map(async (e) => {
        const id = e.getAttribute("data-node-id");
        const block = await queryBlockById(id);
        const doc = await queryBlockById(block.root_id);
        const attrs = await getBlockAttrs({ id }); //JSON.parse(block.ial.replace("{:", "{"))不可行
        //todo 带有其他属性对更新属性的影响未测试
        //attrs.id ? delete attrs.id : null;
        //attrs.updated ? delete attrs.updated : null;
        return {
          block,
          extra: { title: doc.content, attrs },
        };
      })
    );
    //*获取和设置自定义脚本
    //const currentJsBlock = await queryBlockById(jsBlock.id);
    //const func = await getSnippet("", "", jsBlock.content);
    //*执行自定义脚本并转化为dom结构
    const outputDoms = await Promise.all(
      inputBlocks.map(async (e, i, array) => {
        //执行自定义脚本
        const input_func = {
          block: e.block, //当前块
          extra: e.extra, //当前文档标题,当前块属性
          index: i, //当前块索引
          array: array.map((e) => e.block), //所有块
          isDelete: false, //是否删除
        };
        const tools = {
          lute,
          executeFunc,
        };
        const result = await executeFunc(input_func, tools, {
          content: jsBlock.content,
        });
        if (!result) {
          return;
        }
        //将自定义脚本返回的input结构转换为dom结构
        const markdown = result.input.block.markdown;
        const attrs = result.input.extra.attrs;
        const dom = document.createElement("div");
        const oldDom = document.createElement("div");
        oldDom.innerHTML = lute.Md2BlockDOM(e.block.markdown);
        if (markdown && markdown.trim()) {
          dom.innerHTML = lute.Md2BlockDOM(markdown);
          (dom.firstChild as HTMLDivElement).setAttribute(
            "data-node-id",
            inputBlocks[i].block.id
          );
        }
        return { dom, attrs, oldDom, isDelete: result.input.isDelete };
      })
    );
    //*执行添加、更新、删除操作
    let count = 0;
    let preBlockId = inputBlocks[0].block.id;
    for (let i = 0; i < outputDoms.length; i++) {
      const { dom, attrs, oldDom, isDelete } = outputDoms[i];
      let updateFlag = false;
      if (isDelete && i !== 0) {
        await deleteBlock(
          { id: inputBlocks[i].block.id },
          detail.protyle,
          oldDom.innerHTML,
          inputBlocks[i].block.parent_id,
          preBlockId
        );
        continue;
      } else {
        preBlockId = inputBlocks[i].block.id;
      }
      for (const block of dom.children) {
        if (!updateFlag) {
          await updateBlockWithAttr(
            {
              dataType: "dom",
              id: inputBlocks[i].block.id,
              data: block.outerHTML,
            },
            detail.protyle,
            oldDom.innerHTML
          );
          updateFlag = true; //已执行过更新操作，后续操作为插入
        } else {
          const res = await insertBlock(
            {
              dataType: "dom",
              previousID: preBlockId,
              data: block.outerHTML,
            },
            detail.protyle
          );
          if (!res) {
            continue;
          }
          preBlockId = res[0]?.doOperations[0]?.id || preBlockId;
        }
      }
      if (attrs) {
        await setBlockAttrs({
          id: inputBlocks[i].block.id,
          attrs: attrs,
        });
      }
      count++;
      showMessage(`${jsBlock.name || ""}已完成${count}/${outputDoms.length}`);
    }
  };
  return transform;
}
