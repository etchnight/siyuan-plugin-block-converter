//备用，将生成的表格元素转换为.sy格式，不在插件中使用
import { SyTableCell } from "../../subMod/siyuanPlugin-common/types/syFile";
const id = "20240126220746-gybnvza"; //*注意修改为新建文档中表格块的id

export function table2json(newTable) {
  const nodeTable = buildTable(newTable);
  console.log(JSON.stringify(nodeTable));
}

function buildCell(td: HTMLTableCellElement, ishead?: boolean) {
  //let td = document.createElement('td')
  let cell: SyTableCell = {
    Type: "NodeTableCell",
    Data: "th",
    Properties: {
      //"colspan": "2",
      //"rowspan": "1"
      //"class": "fn__none",
    },
    Children: [
      {
        Type: "NodeKramdownSpanIAL",
        Data: '{: colspan="2" rowspan="1"}',
      },
    ],
  };
  cell.Data = ishead ? "th" : "td";

  if (td.className == "fn__none") {
    cell.Properties.class = "fn__none";
    cell.Children[0].Data = '{: class="fn__none"}';
  } else {
    cell.Properties.rowspan = `${td.rowSpan}`;
    cell.Properties.colspan = `${td.colSpan}`;
    cell.Children[0].Data = `{: colspan=\"${td.colSpan}\" rowspan=\"${td.rowSpan}\"}`;
    if (td.textContent) {
      cell.Children[1] = {
        Type: "NodeText",
        Data: td.textContent,
      };
    }
  }
  return cell;
}
function buildRow(tr, ishead?: boolean) {
  //let tr = document.createElement('tr')
  let row = {
    Type: "NodeTableRow",
    Data: "tr",
    Children: [],
  };
  for (let td of tr.cells) {
    row.Children.push(buildCell(td, ishead));
  }
  return row;
}
function buildTable(table) {
  //let table = document.createElement('table')
  let nodeTable = {
    ID: id,
    Type: "NodeTable",
    TableAligns: [],
    Properties: {
      colgroup: "",
      id: id,
      updated: "20240126220805",
    },
    Children: [
      {
        Type: "NodeTableHead",
        Data: "thead",
        Children: [],
      },
    ],
  };
  for (let tr of table.tHead.rows) {
    nodeTable.Children[0].Children.push(buildRow(tr, true));
  }
  for (let body of table.tBodies) {
    for (let tr of body.rows) {
      nodeTable.Children.push(buildRow(tr));
    }
  }
  let colgroup = table.querySelector("colgroup");
  //colgroup = document.createElement('colgroup')
  let colgroupArr = [];
  for (let col of colgroup.children) {
    nodeTable.TableAligns.push(0);
    //!危险，使用的是style而不是width
    let style = col.getAttribute("style");
    if (style) {
      colgroupArr.push(style);
    } else {
      colgroupArr.push("min-width: 60px;");
    }
    nodeTable.Properties.colgroup = colgroupArr.join("|");
  }
  return nodeTable;
}
