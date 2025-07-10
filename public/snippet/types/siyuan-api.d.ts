/**
 * Copyright (c) 2023 frostime. All rights reserved.
 * 
 */

/**
 * Frequently used data structures in SiYuan
 */
type DocumentId = string;
type BlockId = string;
type NotebookId = string;
type PreviousID = BlockId;
type ParentID = BlockId | DocumentId;

type Notebook = {
  id: NotebookId;
  name: string;
  icon: string;
  sort: number;
  closed: boolean;
};

type NotebookConf = {
  name: string;
  closed: boolean;
  refCreateSavePath: string;
  createDocNameTemplate: string;
  dailyNoteSavePath: string;
  dailyNoteTemplatePath: string;
};

type BlockType =
  | "d"
  | "h"
  | "l"
  | "i"
  | "c"
  | "m"
  | "t"
  | "b"
  | "s"
  | "p"
  | "html"
  | "query_embed"
  | "av"
  | "ial"
  | "iframe"
  | "widget"
  | "tb"
  | "video"
  | "audio";

type NodeType =
  | "NodeAttributeView"
  | "NodeDocument"
  | "NodeHeading"
  | "NodeList"
  | "NodeListItem"
  | "NodeCodeBlock"
  | "NodeMathBlock"
  | "NodeTable"
  | "NodeBlockquote"
  | "NodeSuperBlock"
  | "NodeParagraph"
  | "NodeHTMLBlock"
  | "NodeBlockQueryEmbed"
  | "NodeKramdownBlockIAL"
  | "NodeIFrame"
  | "NodeWidget"
  | "NodeThematicBreak"
  | "NodeVideo"
  | "NodeAudio"
  | "NodeText"
  | "NodeImage"
  | "NodeLinkText"
  | "NodeLinkDest"
  | "NodeTextMark";

type BlockSubType =
  | "d1"
  | "d2"
  | "s1"
  | "s2"
  | "s3"
  | "t1"
  | "t2"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "table"
  | "task"
  | "toggle"
  | "latex"
  | "quote"
  | "html"
  | "code"
  | "footnote"
  | "cite"
  | "collection"
  | "bookmark"
  | "attachment"
  | "comment"
  | "mindmap"
  | "spreadsheet"
  | "calendar"
  | "image"
  | "audio"
  | "video"
  | "other"
  | "box"; //!


/**
 * 数据库refs表查询返回该结果
 */
type Ref = {
  id: BlockId;
  def_block_id: BlockId;
  def_block_parent_id: BlockId;
  def_block_root_id: BlockId;
  def_block_path: string;
  block_id: BlockId;
  root_id: BlockId;
  box: BlockId;
  path: string;
  content: string;
  markdown: string;
  type: "textmark" | "query_embed";
};

/**
 * 一些搜索类api会返回该 block 结果
 */
type BlockTree = Omit<
  Block,
  "root_id" | "parent_id" | "hpath" | "subtype" | "type"
> & {
  rootID: string;
  parentID?: string;
  folded: boolean;
  refText: string;
  refs: null; //todo
  defID: string;
  defPath: string;
  children: Array<BlockTree> | null;
  depth: number;
  count: number;
  riffCardID: string;
  riffCard: null; //todo
  hPath: string;
  subType: string;
  type: any; //ETypeAbbrMap;
};
interface Ial {
  alias?: string;
  bookmark?: string;
  id?: string;
  memo?: string;
  name?: string;
  updated?: string;
}
type span = {
  block_id: BlockId;
  box: BlockId;
  content: string;
  ial: string;
  id: string;
  markdown: string;
  path: string;
  root_id: DocumentId;
  type: spanSqliteType;
};
type doOperation = {
  action: string;
  data: string;
  id: BlockId;
  parentID: BlockId | DocumentId;
  previousID: BlockId;
  retData: null;
};

//}

//todo 不全，以后再补
type spanSqliteType =
  | "textmark tag"
  | "textmark strong"
  | "textmark block-ref"
  | "textmark text"
  | "textmark sup"
  | "textmark mark"
  | "textmark kbd"
  | "textmark code";

//\kernel\treenode\node.go(翻转)
