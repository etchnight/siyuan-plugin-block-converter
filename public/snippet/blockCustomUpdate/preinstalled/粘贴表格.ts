/**
 * @metadata
 * 表格粘贴加强，支持合并单元格
 */

interface cell {
  rowSpan: number;
  colSpan: number;
  rowIndex: number; //引用的单元格的行号
  colIndex: number; //引用的单元格的列号
  text: string;
  isNone: boolean;
}
const table2matrix = (table: HTMLTableElement) => {
  //*构建一个矩阵，记录单元格的合并情况
  //单元格填充[r,c]，虚拟单元格填充[-1,-1]，暂时未遍历到的为空属性
  let col = 0;
  const matrix: Array<Array<cell>> = [];
  for (let i = 0; i < table.rows.length; i++) {
    col = 0;
    if (!matrix[i]) matrix[i] = [];
    while (matrix[i][col]) col++;
    for (let j = 0; j < table.rows[i].cells.length; j++) {
      const cell = table.rows[i].cells[j];
      //*填充虚拟单元格
      for (let m = 0; m < cell.colSpan; m++) {
        for (let n = 0; n < cell.rowSpan; n++) {
          if (!matrix[i + n]) matrix[i + n] = [];
          matrix[i + n][col + m] = {
            rowSpan: 1,
            colSpan: 1,
            rowIndex: i,
            colIndex: col,
            text: cell.innerText,
            isNone: true,
          };
        }
      }
      matrix[i][col].colSpan = cell.colSpan;
      matrix[i][col].rowSpan = cell.rowSpan;
      matrix[i][col].isNone = false;
      while (matrix[i][col]) col++;
    }
  }
  //*处理错误的表格（各行的列数不一致）
  const colNum = Math.max(...matrix.map((row) => row.length));
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < colNum; j++) {
      if (matrix[i][j]) continue;
      matrix[i][j] = {
        rowSpan: 1,
        colSpan: 1,
        rowIndex: i,
        colIndex: j,
        text: "",
        isNone: false,
      };
    }
  }
  return matrix;
};
const getHeadRowNum = (matrix: cell[][]) => {
  //*获取表头行数
  //*考查第headRowNum行，如果发现合并单元格，推进到+rowspan行
  let headRowNum = 0;
  let safeCount = 0;
  while (safeCount < 999) {
    safeCount++;
    const maxRowSpan = Math.max(
      ...matrix[headRowNum].map((cell) => cell.rowSpan)
    );
    if (maxRowSpan == 1) break;
    headRowNum = headRowNum + maxRowSpan;
    if (headRowNum >= matrix.length) break; //全部在表头
  }
  return headRowNum + 1;
};
tools.turndown.addRule("表格粘贴加强", {
  filter: "table",
  replacement: function (_content, node: HTMLTableElement, _options) {
    const matrix = table2matrix(node);
    //console.log(matrix);
    const headRowNum = getHeadRowNum(matrix);
    //console.log(headRowNum);
    //*将表格转化为思源表格kmarkdown
    let markdown = "";
    for (let i = 0; i < matrix.length; i++) {
      if (i === headRowNum) {
        markdown += "|------".repeat(matrix[i].length) + "|\n";
      }
      for (let j = 0; j < matrix[i].length; j++) {
        const cell = matrix[i][j];
        if (cell.isNone) {
          markdown += "|" + `{: class="fn__none"}`;
        } else {
          let prefix = ``;
          if (cell.rowSpan > 1 || cell.colSpan > 1) {
            prefix += `{: `;
            prefix += cell.rowSpan > 1 ? `rowspan="${cell.rowSpan}" ` : "";
            prefix += cell.colSpan > 1 ? `colspan="${cell.colSpan}" ` : "";
            prefix += `}`;
          }
          markdown += "|" + prefix + cell.text;
        }
      }
      markdown += "|\n";
    }
    if (headRowNum >= matrix.length) {
      markdown += "|------".repeat(matrix[0].length) + "|\n";
    }
    //console.log(markdown);
    return markdown;
  },
});
if (!input.isIgnore) {
  const ClipboardHtml = (await tools.getClipboardHtml()) as string;
  output = tools.turndown.turndown(ClipboardHtml);
}
