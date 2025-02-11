/**
 * @metadata
 * 表格粘贴加强，支持合并单元格
 */
/**
 * 自定义函数输入参数1 : input，选择的块信息
 */
interface cell {
  rowSpan: number;
  colSpan: number;
  rowIndex: number;
  colIndex: number;
}

tools.turndown.addRule("表格粘贴加强", {
  filter: "table",
  replacement: function (_content, node: HTMLTableElement, _options) {
    //*构建一个矩阵，记录单元格的合并情况
    //单元格填充[r,c]，虚拟单元格填充[-1,-1]，暂时未遍历到的为空属性
    let col = 0;
    const matrix: Array<Array<cell>> = [];
    for (let i = 0; i < node.rows.length; i++) {
      col = 0;
      if (!matrix[i]) matrix[i] = [];
      while (matrix[i][col]) col++;
      for (let j = 0; j < node.rows[i].cells.length; j++) {
        const cell = node.rows[i].cells[j];
        //*填充虚拟单元格
        for (let m = 0; m < cell.colSpan; m++) {
          for (let n = 0; n < cell.rowSpan; n++) {
            if (!matrix[i + n]) matrix[i + n] = [];
            matrix[i + n][col + m] = {
              rowSpan: -1,
              colSpan: -1,
              rowIndex: i,
              colIndex: j,
            };
          }
        }
        matrix[i][col] = {
          rowSpan: cell.rowSpan,
          colSpan: cell.colSpan,
          rowIndex: i,
          colIndex: j,
        };
        while (matrix[i][col]) col++;
      }
    }
    //*处理错误的表格（各行的列数不一致）
    const colNum = Math.max(...matrix.map((row) => row.length));
    for (let i = 0; i < matrix.length; i++) {
      //*在本行最后插入单元格，直至列数一致
      while (matrix[i].length < colNum) {
        matrix[i].push({
          rowSpan: 1,
          colSpan: 1,
          rowIndex: i,
          colIndex: node.rows[i].cells.length,
        });
        node.rows[i].insertCell(-1);
      }
    }
    //*处理错误的表格（经处理后仍存在空白）
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (!matrix[i][j]) {
          //*确定插入位置，查找本行的上一列对应的单元格
          let colIndex: number = 0;
          for (let k = j - 1; k > 0; k--) {
            if (matrix[i][k].rowIndex == i) {
              colIndex = matrix[i][k].colIndex + 1;
              break;
            }
          }
          node.rows[i].insertCell(colIndex);
          matrix[i][j] = {
            rowSpan: 1,
            colSpan: 1,
            rowIndex: i,
            colIndex: colIndex,
          };
        }
      }
    }
    //*调试用console.log(matrix)
/*     const tablematrix = matrix.map((row) =>
      row.map((cell) => `${cell.rowIndex},${cell.colIndex}`)
    );
    const consoleText = tablematrix.reduce(
      (prev, curr) => prev + "\n" + curr.join(" "),
      ""
    );
    console.log(consoleText); */
    
    //*当表格第一行存在列合并时，思源表格转化会丢失列，因此需要手动添加
/*     const firstLineDelta = matrix[0].length - node.rows[0].cells.length;
    if (firstLineDelta > 0) {
      for (const row of Array.from(node.rows)) {
        for (let i = 0; i < firstLineDelta; i++) {
          row.insertCell(-1);
        }
      }
    } */
    //*将表格转化为思源表格
    const newTableHtml = tools.lute.Md2BlockDOM(
      tools.lute.HTML2Md(node.outerHTML)
    );
    const div = document.createElement("div");
    div.innerHTML = newTableHtml;
    const newTableBlock = div.firstElementChild as HTMLElement;
    const table = newTableBlock.querySelector("table") as HTMLTableElement;

    //*调试用const clone = newTableBlock.cloneNode(true) as HTMLElement;
    //*设置新表格的合并单元格
    for (let i = 0; i < matrix.length; i++) {
      const row = table.rows[i];
      for (let j = 0; j < matrix[i].length; j++) {
        const newCell = table.rows[i].cells[j];
        if (matrix[i][j].rowSpan == -1) {
          //*插入一个虚拟单元格，设置其样式为隐藏，并删除行内最后一个单元格（一定为空）
          const lastCell = row.cells.item(
            row.cells.length - 1
          ) as HTMLTableCellElement;
          row.insertBefore(lastCell, newCell);
          lastCell.className = "fn__none";
        } else {
          matrix[i][j].colSpan > 1
            ? (newCell.colSpan = matrix[i][j].colSpan)
            : "";
          matrix[i][j].rowSpan > 1
            ? (newCell.rowSpan = matrix[i][j].rowSpan)
            : "";
        }
      }
    }
    //*解决head中有行合并不生效的问题
    //*先计算一遍，发现head行数量增加则对head中所有行再次遍历
    if (table.tHead) {
      let headLineNum = 0;
      let headLineNum2 = 0;
      do {
        headLineNum = headLineNum2;
        const headLineNums = [];
        for (let i = 0; i < table.tHead.rows.length; i++) {
          const row = table.tHead.rows[i];
          for (let j = 0; j < row.cells.length; j++) {
            const cell = row.cells[j];
            if (cell.className !== "fn__none") {
              //*注意合并的列也要遍历
              for (let m = 0; m < cell.colSpan; m++) {
                headLineNums[j + m] = headLineNums[j + m]
                  ? headLineNums[j + m] + cell.rowSpan
                  : cell.rowSpan;
              }
            }
          }
        }
        headLineNum2 = Math.max(...headLineNums);
        for (let i = 0; i < headLineNum2 - headLineNum; i++) {
          table.tHead.appendChild(table.rows[headLineNum + i]);
        }
      } while (headLineNum < headLineNum2);
    }
    //todo 也可以在上面的矩阵直接转化为Markdown，但是暂时先这样
    const markdown = tools.lute.BlockDOM2Md(newTableBlock.outerHTML);
    //console.log(markdown);
    return markdown; //newTableBlock.outerHTML; //即newTableBlock;
  },
});

if (!input.isIgnore) {
  output = tools.turndown.turndown(output);
}
