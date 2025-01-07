/**
 * @metadata
 * 这是一个示例脚本，其功能是将Word中粘贴的大于等于二号字转化为二级标题
 * 
 * 这个脚本目前并不完善，因为行内大于于等于二号字的文本会被误判为标题
 * 
 * 复制以下内容，然后执行自定义粘贴，即可看到效果
 * 
<div>
<p
  class="MsoPlainText"
  align="center"
  style="text-align: center; line-height: 28pt; mso-line-height-rule: exactly">
  <span
    style="
      mso-spacerun: 'yes';
      font-family: 宋体;
      font-size: 22pt;
      mso-font-kerning: 1pt;
    "
    ><font face="宋体">标题文本</font></span
  >
</p>
<div>

 */
/**
 * 自定义函数输入参数1 : input，选择的块信息
 */

tools.turndown.addRule("表格粘贴加强", {
  filter: "table",
  replacement: function (_content, node: HTMLTableElement, _options) {
    //*构建一个矩阵，记录单元格的合并情况
    //单元格填充[r,c]，虚拟单元格填充[-1]，暂时未遍历到的为空属性
    let col = 0;
    const matrix = [];
    for (let i = 0; i < node.rows.length; i++) {
      col = 0;
      if (!matrix[i]) matrix[i] = [];
      while (matrix[i][col]) col++;
      for (let j = 0; j < node.rows[i].cells.length; j++) {
        const cell = node.rows[i].cells[j];
        for (let m = 0; m < cell.colSpan; m++) {
          for (let n = 0; n < cell.rowSpan; n++) {
            if (!matrix[i + n]) matrix[i + n] = [];
            matrix[i + n][col + m] = [-1];
          }
        }
        matrix[i][col] = [cell.rowSpan, cell.colSpan];
        while (matrix[i][col]) col++;
      }
    }
    //*处理错误的表格（各行的列数不一致）
    const colNum = Math.max(...matrix.map((row) => row.length));
    for (let i = 0; i < matrix.length; i++) {
      while (matrix[i].length < colNum) {
        matrix[i].push([1, 1]);
        node.rows[i].insertCell(-1);
      }
    }
    //*当表格第一行存在列合并时，思源表格转化会丢失列，因此需要手动添加
    const firstLineDelta = matrix[0].length - node.rows[0].cells.length;
    if (firstLineDelta > 0) {
      for (const row of Array.from(node.rows)) {
        for (let i = 0; i < firstLineDelta; i++) {
          row.insertCell(-1);
        }
      }
    }
    //*将表格转化为思源表格
    const newTableHtml = tools.lute.Md2BlockDOM(
      tools.lute.HTML2Md(node.outerHTML)
    );
    const div = document.createElement("div");
    div.innerHTML = newTableHtml;
    const newTableBlock = div.firstElementChild as HTMLElement;
    const table = newTableBlock.querySelector("table");
    //*调试用const clone = newTableBlock.cloneNode(true) as HTMLElement;
    //*设置新表格的合并单元格
    for (let i = 0; i < matrix.length; i++) {
      const row = table.rows[i];
      for (let j = 0; j < matrix[i].length; j++) {
        const newCell = table.rows[i].cells[j];
        if (matrix[i][j].length == 1) {
          //*插入一个虚拟单元格，设置其样式为隐藏，并删除行内最后一个单元格（一定为空）
          const lastCell = row.cells.item(row.cells.length - 1);
          row.insertBefore(lastCell, newCell);
          lastCell.className = "fn__none";
        } else {
          matrix[i][j][1] > 1 ? (newCell.colSpan = matrix[i][j][1]) : "";
          matrix[i][j][0] > 1 ? (newCell.rowSpan = matrix[i][j][0]) : "";
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
              headLineNums[j] = headLineNums[j]
                ? headLineNums[j] + cell.rowSpan
                : cell.rowSpan;
            }
          }
        }
        headLineNum2 = Math.max(...headLineNums);
        for (let i = 0; i < headLineNum2 - headLineNum; i++) {
          table.tHead.appendChild(table.rows[headLineNum + i]);
        }
      } while (headLineNum < headLineNum2);
    }

    return newTableBlock.outerHTML; //即newTableBlock;
  },
});

if (!input.isIgnore) {
  output = tools.turndown.turndown(output);
}
