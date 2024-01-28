export function buildSyTableBlocks(ele: HTMLElement) {
  const tablesEles = buildSyTables(ele);
  let result: string[] = [];
  for (let newTable of tablesEles) {
    let tempEle = document.createElement("div");
    tempEle.appendChild(newTable);
    const colWidthList = reComputeWidth(newTable);
    const html = `<div data-node-index="16" data-type="NodeTable" class="table"
    colgroup="${colWidthList.join("|")}"
    >
<div contenteditable="false">
${newTable.outerHTML}
<div class="protyle-action__table">
  <div
    class="table__resize"
    data-col-index="2"
    style="height: 117px; left: 178px; display: block"
  ></div>
  <div class="table__select"></div>
</div>
</div>
<div class="protyle-attr" contenteditable="false">​</div>
</div>`;
    result.push(html.replace(/\n/g, ""));
  }
  return result;
}
export function reComputeWidth(newTable: HTMLTableElement, fullWidth?: string) {
  const colgroup = newTable.querySelector("colgroup")?.querySelectorAll("col");
  let colWidthList: string[] = [];
  for (let col of colgroup) {
    let width = col.style.width;
    if (fullWidth && width.indexOf("%") !== -1) {
      let unit = fullWidth.replace(/[0-9]/g, "").replace(".", "");
      width = parseFloat(width) / parseFloat(fullWidth) + unit;
    }
    colWidthList.push(
      col.style.width ? `width: ${col.style.width};` : `min-width: 60px;`
    );
  }
  return colWidthList;
}
function buildSyTables(ele: HTMLElement) {
  let tables = ele.querySelectorAll("table");
  let results: HTMLTableElement[] = [];
  for (let table of tables) {
    let newTable = document.createElement("table");
    newTable.contentEditable = "true";
    newTable.spellcheck = false;
    //let table = tableSource.cloneNode(true)
    let head = table.tHead;
    head
      ? newTable.appendChild(
          rebuildTableSection(
            head.cloneNode(true) as HTMLTableSectionElement,
            true
          )
        )
      : null;

    let bodys = table.tBodies;
    for (let body of bodys) {
      newTable.appendChild(
        rebuildTableSection(body.cloneNode(true) as HTMLTableSectionElement)
      );
    }
    //无head强制加head
    if (!head) {
      let head = document.createElement("thead");
      let rowCount = 1; //表头应该有的行数
      for (let i = 0; i < rowCount; i++) {
        let tr = newTable.tBodies[0].rows[i];
        for (let td of tr.cells) {
          if (i + td.rowSpan > rowCount) {
            rowCount = i + td.rowSpan;
          }
        }
      }
      //剪切行到head
      for (let i = 0; i < rowCount; i++) {
        let tr = newTable.tBodies[0].rows[0];
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
  //插入空白单元格
  let tdStr = ishead ? "th" : "td";
  let noneCell = document.createElement(tdStr);
  noneCell.className = "fn__none";
  for (let i = 0; i < body.rows.length; i++) {
    let tr = body.rows[i];
    removeAttr(tr);
    for (let j = 0; j < tr.cells.length; j++) {
      let td = tr.cells[j];
      td.innerHTML = td.textContent.replace(/\s+/g, "");
      removeAttr(td);
      for (let m = 0; m < td.colSpan; m++) {
        //tr.insertBefore(noneCell.cloneNode(), tr.cells[j + m] || null)
        for (let n = 0; n < td.rowSpan; n++) {
          if (m == 0 && n == 0) {
            continue;
          }
          body.rows[i + n].insertBefore(
            noneCell.cloneNode(),
            body.rows[i + n].cells[j + m] || null
          );
        }
      }
    }
  }
  //不规范表格每行用fn__none补位
  let maxCellCount = 0;
  for (let tr of body.rows) {
    maxCellCount = Math.max(tr.cells.length, maxCellCount);
  }
  for (let tr of body.rows) {
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
  return body;
}

function removeAttr(ele) {
  if (ele.className !== "fn__none") {
    for (let attr of ele.attributes) {
      if (attr.name !== "colspan" && attr.name !== "rowspan") {
        ele.removeAttribute(attr.name);
      }
    }
  }
}

/**
 * @deprecated
 */
function buildColgroupByComputedWidth(
  table: HTMLTableElement,
  newTable: HTMLTableElement
) {
  let colgroup = document.createElement("colgroup");
  let widthArr = [];
  widthArr[newTable.rows[0].cells.length - 1] = 0; //确定长度
  let i = 0;
  for (let tr of newTable.rows) {
    let index = 0;
    let j = 0;
    for (let td of tr.cells) {
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
  for (let width of widthArr) {
    let col = document.createElement("col");
    col.style.width = width;
    colgroup.appendChild(col);
  }
  return colgroup;
}

function buildColgroupByContent(newTable: HTMLTableElement) {
  let colgroup = document.createElement("colgroup");
  let contentLengthArr: number[] = [];
  contentLengthArr[newTable.rows[0].cells.length - 1] = 0; //确定长度
  for (let tr of newTable.rows) {
    let i = 0;
    for (let td of tr.cells) {
      for (let m = 0; m < td.colSpan; m++) {
        contentLengthArr[i + m] += td.textContent.length / td.colSpan;
      }
    }
  }
  let sumLength = 0;
  for (let item of contentLengthArr) {
    sumLength += item;
  }
  const widthArr = contentLengthArr.map((e) => {
    return e / sumLength;
  });
  for (let width of widthArr) {
    let col = document.createElement("col");
    col.style.width = `${width * 100}%`;
    colgroup.appendChild(col);
  }
  return colgroup;
}
