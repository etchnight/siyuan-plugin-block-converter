/**
 * @deprecated 不再使用，迁移到snippet
 */

import { BlockId } from "../../subMod/siyuanPlugin-common/types/siyuan-api";


export function buildSyTableBlocks(
  ele: HTMLElement,
  fullWidth?: string,
  id?: BlockId
) {
  const tablesEles = buildSyTables(ele);
  if (!tablesEles) {
    return [];
  }
  const result: string[] = [];
  for (const newTable of tablesEles) {
    const tempEle = document.createElement("div");
    tempEle.appendChild(newTable);
    const colWidthList = reComputeWidth(newTable, fullWidth);
    //todo 很多参数是随便copy过来的
    const html = `<div 
    data-type="NodeTable"
    class="table"
    colgroup="${colWidthList.join("|")}"
    ${id ? "data-node-id='" + id + "'" : ""}
    style=""
    data-node-index="1"
    >
    <div contenteditable="false" style="">
    ${newTable.outerHTML}
    <div class="protyle-action__table">
      <div class="table__resize" data-col-index="0"></div>
      <div class="table__select"></div>
    </div>
    </div>
    <div class="protyle-attr" contenteditable="false"></div>
    </div>`;
    result.push(html.replace(/[(\r\n)\r\n]+/g, ""));
  }
  return result;
}
export function reComputeWidth(newTable: HTMLTableElement, fullWidth?: string) {
  const colgroup = newTable.querySelector("colgroup")?.querySelectorAll("col");
  const colWidthList: string[] = [];
  for (const col of colgroup) {
    let width = col.style.width;
    if (fullWidth && width.indexOf("%") !== -1) {
      const unit = fullWidth.replace(/[0-9]/g, "").replace(".", "");
      width =
        Math.round((parseFloat(width) * parseFloat(fullWidth)) / 100) + unit;
    }
    colWidthList.push(width ? `width: ${width};` : `min-width: 60px;`);
    //*更改colgroup下的colgroup,副作用
    col.style.width = width;
  }

  return colWidthList;
}
function buildSyTables(ele: HTMLElement) {
  let tables = Array.from(ele.querySelectorAll("table"));
  if (tables.length === 0 && ele.tagName.toLowerCase() === "table") {
    tables = [ele as HTMLTableElement];
  }
  const results: HTMLTableElement[] = [];
  for (const table of tables) {
    const newTable = document.createElement("table");
    newTable.contentEditable = "true";
    newTable.spellcheck = false;
    //let table = tableSource.cloneNode(true)
    const head = table.tHead;
    head ? newTable.appendChild(rebuildTableSection(head, true)) : null;

    const bodys = table.tBodies;
    for (const body of bodys) {
      newTable.appendChild(rebuildTableSection(body));
    }
    //无head强制加head
    if (!head) {
      const head = document.createElement("thead");
      let rowCount = 1; //表头应该有的行数
      for (let i = 0; i < rowCount; i++) {
        const tr = newTable.tBodies[0].rows[i];
        for (const td of tr.cells) {
          if (i + td.rowSpan > rowCount) {
            rowCount = i + td.rowSpan;
          }
        }
      }
      //剪切行到head
      for (let i = 0; i < rowCount; i++) {
        const tr = newTable.tBodies[0].rows[0];
        head.appendChild(tr);
      }
      newTable.insertBefore(head, newTable.tBodies[0]);
    }

    //let colgroup = buildColgroupByComputedWidth(table, newTable);
    const colgroup = buildColgroupByContent(newTable);
    newTable.insertBefore(colgroup, newTable.tHead);

    results.push(newTable);
    return results;
  }
}
function rebuildTableSection(body: HTMLTableSectionElement, ishead?: boolean) {
  const bodyClone = body.cloneNode(true) as HTMLTableSectionElement;
  //插入空白单元格
  const tdStr = ishead ? "th" : "td";
  const noneCell = document.createElement(tdStr);
  noneCell.className = "fn__none";
  for (let i = 0; i < bodyClone.rows.length; i++) {
    const tr = bodyClone.rows[i];
    removeAttr(tr);
    let k = 0;
    for (let j = 0; j < tr.cells.length; j++) {
      const td = tr.cells[j];
      td.innerHTML = getContent(body.rows[i].cells[k]).replace(/\s+/g, "");
      removeAttr(td);
      //*会导致 tr.cells.length 变化
      for (let m = 0; m < td.colSpan; m++) {
        //tr.insertBefore(noneCell.cloneNode(), tr.cells[j + m] || null)
        for (let n = 0; n < td.rowSpan; n++) {
          if (m == 0 && n == 0) {
            continue;
          }
          bodyClone.rows[i + n].insertBefore(
            noneCell.cloneNode(),
            bodyClone.rows[i + n].cells[j + m] || null
          );
        }
      }
      if (td.className !== "fn__none") {
        k++;
      }
    }
  }
  //不规范表格每行用fn__none补位
  let maxCellCount = 0;
  for (const tr of bodyClone.rows) {
    maxCellCount = Math.max(tr.cells.length, maxCellCount);
  }
  for (const tr of bodyClone.rows) {
    let count = 0;
    while (tr.cells.length < maxCellCount && count < 100) {
      tr.appendChild(noneCell.cloneNode());
      count++;
    }
  }
  //todo 每列中colspan最小值必须为1
  /*
    for (let j = 0; j < body.rows[0].cells.length; j++) {
        let colSpanList = []
        for (let i = 0; i < body.rows.length; i++) {
            let td = body.rows[i].cells[j]
            colSpanList[i] = td.colSpan
        }
        let minColSpan = Math.min(...colSpanList)
        console.log(minColSpan)

        if (minColSpan > 1) {
            for (let i = 0; i < body.rows.length; i++) {
                let td = body.rows[i].cells[j]
                td.colSpan = colSpanList[i] - minColSpan + 1
                for (let k = 1; k < minColSpan; k++) {
                    console.log(k)
                    body.rows[i].cells[j + k].remove()
                }
            }
        }
    }
    */
  return bodyClone;
  function getContent(td: HTMLTableCellElement) {
    if (!td) {
      return "";
    }
    if (!td.innerText) {
      return "";
    }
    const contentList = [];
    //const blockLikes = ["block", "block ", " block"];
    for (const ele of td.childNodes) {
      switch (ele.nodeType) {
        case Node.ELEMENT_NODE: {
          const ele2 = ele as HTMLElement;
          const display = window.getComputedStyle(ele2).display;
          /*           const flagList = blockLikes.map((e) => {
            return display.indexOf(e);
          });
          if (Math.max(...flagList) !== -1) { */
          if (display.search("block") !== -1) {
            contentList.push((ele2.innerText || "") + "<br>");
          } else {
            contentList.push(ele2.innerText || "");
          }
          break;
        }
        case Node.TEXT_NODE:
          contentList.push(ele.textContent);
          break;
        default:
          break;
      }
    }
    return contentList.join("");
  }
}

function removeAttr(ele: HTMLElement) {
  if (ele.className !== "fn__none") {
    for (const attr of ele.attributes) {
      if (attr.name !== "colspan" && attr.name !== "rowspan") {
        ele.removeAttribute(attr.name);
      }
    }
  }
}

/**
 * @deprecated 复制原网页单元格的显示宽度，由于不引入css，不采用该方案
 */
function buildColgroupByComputedWidth(
  table: HTMLTableElement,
  newTable: HTMLTableElement
) {
  const colgroup = document.createElement("colgroup");
  const widthArr = [];
  widthArr[newTable.rows[0].cells.length - 1] = 0; //确定长度
  let i = 0;
  for (const tr of newTable.rows) {
    let index = 0;
    let j = 0;
    for (const td of tr.cells) {
      if (td.className !== "fn__none") {
        if (td.colSpan == 1) {
          try {
            widthArr[j] = window.getComputedStyle(
              table.rows[i].cells[index]
            ).width;
          } catch (error) {
            console.warn(`获取第${i}行第${index}列样式失败`);
          }
        }
        index++;
      }
      j++;
    }
    i++;
  }
  for (const width of widthArr) {
    const col = document.createElement("col");
    col.style.width = width;
    colgroup.appendChild(col);
  }
  return colgroup;
}

/**
 *
 * @param newTable
 * @returns 生成的 colgroup 是以 `width : xx% ;` 形式计的
 */
export function buildColgroupByContent(newTable: HTMLTableElement) {
  const colgroup = document.createElement("colgroup");
  const tdContentLengthArr: number[] = [
    ...Array(newTable.rows[0].cells.length),
  ].map(() => {
    return 0;
  });
  for (const tr of newTable.rows) {
    let i = 0;
    for (const td of tr.cells) {
      for (let m = 0; m < td.colSpan; m++) {
        //取最大值而非合计值
        //contentLengthArr[i + m] += td.innerText .length / td.colSpan;
        const contentList = td.innerHTML.split("<br>"); //!注意，这里使用了 innerHTML ，如果后续需要引用样式需要再次处理
        const contentLengthList = contentList.map((e) => {
          return e.length;
        });
        tdContentLengthArr[i + m] = Math.max(
          Math.max(...contentLengthList) / td.colSpan,
          tdContentLengthArr[i + m]
        );
      }
      i++;
    }
  }
  let sumLength = 0;
  for (const item of tdContentLengthArr) {
    sumLength += item;
  }
  const widthArr = tdContentLengthArr.map((e) => {
    return e / sumLength;
  });
  for (const width of widthArr) {
    const col = document.createElement("col");
    col.style.width = `${width * 100}%`;
    colgroup.appendChild(col);
  }
  return colgroup;
}
