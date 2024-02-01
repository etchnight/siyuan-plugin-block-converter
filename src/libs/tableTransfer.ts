export function buildSyTableBlocks(
  ele: HTMLElement,
  fullWidth?: string,
  id?: BlockId
) {
  const tablesEles = buildSyTables(ele);
  let result: string[] = [];
  for (let newTable of tablesEles) {
    let tempEle = document.createElement("div");
    tempEle.appendChild(newTable);
    const colWidthList = reComputeWidth(newTable, fullWidth);
    //todo 很多参数是随便copy过来的，但是目前未发现问题
    const html = `<div data-node-index="16" data-type="NodeTable" class="table"
    colgroup="${colWidthList.join("|")}"
    ${id ? "data-node-id='" + id + "'" : ""}
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
  let tables = ele.querySelectorAll("table");
  let results: HTMLTableElement[] = [];
  for (let table of tables) {
    let newTable = document.createElement("table");
    newTable.contentEditable = "true";
    newTable.spellcheck = false;
    //let table = tableSource.cloneNode(true)
    let head = table.tHead;
    head ? newTable.appendChild(rebuildTableSection(head, true)) : null;

    let bodys = table.tBodies;
    for (let body of bodys) {
      newTable.appendChild(rebuildTableSection(body));
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
  const bodyClone = body.cloneNode(true) as HTMLTableSectionElement;
  //插入空白单元格
  let tdStr = ishead ? "th" : "td";
  let noneCell = document.createElement(tdStr);
  noneCell.className = "fn__none";
  for (let i = 0; i < bodyClone.rows.length; i++) {
    let tr = bodyClone.rows[i];
    removeAttr(tr);
    let k = 0;
    for (let j = 0; j < tr.cells.length; j++) {
      let td = tr.cells[j];
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
  for (let tr of bodyClone.rows) {
    maxCellCount = Math.max(tr.cells.length, maxCellCount);
  }
  for (let tr of bodyClone.rows) {
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
    let contentList = [];
    const blockLikes = ["block", "block ", " block"];
    for (let ele of td.children) {
      let display = window.getComputedStyle(ele).display;
      const flagList = blockLikes.map((e) => {
        return display.indexOf(e);
      });
      if (Math.max(...flagList) !== -1) {
        contentList.push(ele.textContent);
      } else {
        contentList[contentList.length - 1] += ele.textContent;
      }
    }
    return contentList.join("<br>");
  }
}

function removeAttr(ele: HTMLElement) {
  if (ele.className !== "fn__none") {
    for (let attr of ele.attributes) {
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

/**
 * 
 * @param newTable 
 * @returns 生成的 colgroup 是以 `width : xx% ;` 形式计的
 */
export function buildColgroupByContent(newTable: HTMLTableElement) {
  let colgroup = document.createElement("colgroup");
  let tdContentLengthArr: number[] = [
    ...Array(newTable.rows[0].cells.length),
  ].map(() => {
    return 0;
  });
  for (let tr of newTable.rows) {
    let i = 0;
    for (let td of tr.cells) {
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
  for (let item of tdContentLengthArr) {
    sumLength += item;
  }
  const widthArr = tdContentLengthArr.map((e) => {
    return e / sumLength;
  });
  for (let width of widthArr) {
    let col = document.createElement("col");
    col.style.width = `${width * 100}%`;
    colgroup.appendChild(col);
  }
  return colgroup;
}
