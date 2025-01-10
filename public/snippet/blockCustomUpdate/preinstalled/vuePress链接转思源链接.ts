/**
 * @metadata
将[VuePress](https://vuepress.vuejs.org/zh/guide/markdown.html#%E9%93%BE%E6%8E%A5)风格内部链接转为思源笔记内部链接。

参见：
- [有办法在思源导入的 github 的 md 文件中实现内部锚链接跳转吗](https://ld246.com/article/1736153236901)
- [github风格链接](https://github.github.com/gfm/#link)

@param {string} [INDEX_NAME = "index"]  //导入文件默认首页名，如："readme";"index";
@param {string} [ROOT_HPATH = ""]  
@param {boolean} [isUpdate] //如需更新，改为：true
*/

declare const INDEX_NAME = "index"; //导入文件默认首页名，如："readme";"index";
declare const ROOT_HPATH = ""; //根目录，不指定的话会寻找最近的,如：/测试跳转 (不含笔记本名，总是会在本笔记本内寻找)
declare const isUpdate = false; //如需更新，改为：true

const func = async () => {
  const html = tools.lute.Md2BlockDOM(output);
  const div = document.createElement("div");
  div.innerHTML = html;
  const links = div.querySelectorAll(
    'span[data-type="a"][data-href]'
  ) as NodeListOf<HTMLSpanElement>;
  for (const link of links) {
    const dataHref = link.getAttribute("data-href");
    //*不处理外部链接
    const urlRegex =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (urlRegex.test(dataHref)) continue;
    //*提取path和标题
    let [href, head] = dataHref.split("#"); //todo 可能出现不规范情形（多个#）
    const blockType = head ? "h" : "d";
    href = fixHref(href);
    //console.log({ dataHref, href, head });
    //* 根据前缀分情况处理
    let block: Block;
    //* 本文档内链接
    if (!href && head) {
      const stmt = `SELECT id,content,hpath FROM blocks WHERE 
      blocks.hpath = '${input.block.hpath}' 
      AND blocks.type = '${blockType}'
      AND blocks.content = '${head}'
      LIMIT 1000`;
      const blocks = await tryQuery(stmt);
      block = blocks[0];
    }
    //* '/foo/'和'/'类型，相对根目录路径，如果不知道根目录在哪，找到最近的'/foo/'
    else if (href.startsWith("/")) {
      const stmt = `SELECT id,content,hpath FROM blocks WHERE 
      blocks.hpath LIKE '${ROOT_HPATH ? "%" + ROOT_HPATH : ""}%${href}%' 
        AND blocks.type = '${blockType}'
        ${head ? `AND blocks.content = '${head}'` : ""}
        AND blocks.box = '${input.block.box}'
        LIMIT 1000`;
      const blocks = await tryQuery(stmt);
      block = getNearestBlock(href, blocks);
    }
    //* '../'和'./'类型，相对本文档路径，需要拼接path
    else if (href.startsWith(".")) {
      const pathList = input.block.hpath.split("/");
      const hrefList = href.split("/");
      let hpath = "";
      if (hrefList[0] === "..") {
        //* '../'类型，即相对位置，需要拼接path前半部分和href后半部分
        let index = 0;
        for (let i = 0; i < hrefList.length; i++) {
          if (hrefList[i] !== "..") {
            break;
          } else {
            index++;
          }
        }
        hpath =
          pathList.slice(0, -index - 1).join("/") +
          "/" +
          hrefList.slice(index).join("/");
      } else if (hrefList[0] === ".") {
        //* './'类型，即相对位置，需要拼接path减去最后一个部分，追加href后半部分
        const pathList = input.block.hpath.split("/");
        const hrefList = href.split("/");
        hpath =
          pathList.slice(0, -1).join("/") + "/" + hrefList.slice(1).join("/");
      }
      const stmt = `SELECT id,content,hpath FROM blocks WHERE 
        blocks.hpath = '${hpath}' 
        AND blocks.type = '${blockType}'
        ${head ? `AND blocks.content = '${head}'` : ""}
        LIMIT 1000`;
      const blocks = await tryQuery(stmt);
      block = blocks[0];
    }
    //console.log({ block });

    //*生成内部链接
    if (block) {
      link.setAttribute("data-id", block.id);
      link.setAttribute("data-type", "block-ref");
      link.setAttribute("data-subtype", "d");
      link.removeAttribute("data-href");
    }
  }
  //console.log(tools.lute.BlockDOM2Md(div.innerHTML));
  return tools.lute.BlockDOM2Md(div.innerHTML);
};
if (isUpdate) {
  output = await func();
} else {
  output = output + "\n\n" + (await func());
}
//*根据INDEX_NAME尝试多次寻找
//*默认INDEX_NAME -> 另外两种文件名 -> 文件夹本身是文件
async function tryQuery(stmt: string) {
  const indexNames = ["/index", "/readme", "/README", ""];
  let blocks = (await tools.siyuanApi.requestQuerySQL(stmt)) as Block[];
  let index = 0;
  let newStmt = "";
  const reg = new RegExp(`(blocks.hpath)(.*)${"/" + INDEX_NAME}`);
  while (blocks.length === 0 && index < indexNames.length) {
    if (indexNames[index] === "/" + INDEX_NAME) {
      index++;
      continue;
    }
    newStmt = stmt.replace(reg, "$1$2" + indexNames[index]);
    index++;
    blocks = (await tools.siyuanApi.requestQuerySQL(newStmt)) as Block[];
  }
  return blocks;
}
//*从path中找到最近的
function getNearestBlock(hpath: string, blocks: Block[]) {
  if (ROOT_HPATH) {
  }
  const distances = blocks.map((item) => {
    for (let i = 0; i < Math.min(hpath.length, item.hpath.length); i++) {
      if (hpath[i] !== item[i]) {
        return i;
      }
    }
  });
  return blocks[distances.indexOf(Math.max(...distances))];
}
//*修复path，处理后缀，处理后必有文件名
function fixHref(href: string) {
  if (href.endsWith("/")) {
    return href + INDEX_NAME;
  }
  if (href.endsWith(".md")) {
    return href.slice(0, -3);
  }
  if (href.endsWith(".html")) {
    return href.slice(0, -5);
  }
}
