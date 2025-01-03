/**
 * @metadata
 * 文档所有标题降级，点击文档块标使用
 * 思源仅内置标题下降级功能，此插件为文档所有标题降级
 */

/*let input = {
  block: {
    alias: "",
    box: "20220814162450-xab5og1",
    content: "abcdef",
    created: "20241219203556",
    fcontent: "",
    hash: "bc6324d",
    hpath: "/0测试临时",
    ial: '{: id="20241219203556-xrb2k8g" updated="20250101190643"}',
    id: "20241219203556-xrb2k8g",
    length: 6,
    markdown: "abcdef",
    memo: "",
    name: "",
    parent_id: "20240129090734-enoz1rj",
    path: "/20240129090734-enoz1rj.sy",
    root_id: "20240129090734-enoz1rj",
    sort: 10,
    subtype: "",
    tag: "",
    type: "p",
    updated: "20250101190643",
  },
  extra: {
    title: "0测试临时",
    attrs: {
      id: "20241219203556-xrb2k8g",
      updated: "20250101190643",
    },
  },
  index: 0,
  array: [
    {
      alias: "",
      box: "20220814162450-xab5og1",
      content: "abcdef",
      created: "20241219203556",
      fcontent: "",
      hash: "bc6324d",
      hpath: "/0测试临时",
      ial: '{: id="20241219203556-xrb2k8g" updated="20250101190643"}',
      id: "20241219203556-xrb2k8g",
      length: 6,
      markdown: "abcdef",
      memo: "",
      name: "",
      parent_id: "20240129090734-enoz1rj",
      path: "/20240129090734-enoz1rj.sy",
      root_id: "20240129090734-enoz1rj",
      sort: 10,
      subtype: "",
      tag: "",
      type: "p",
      updated: "20250101190643",
    },
  ],
  isDelete: false,
};
let output = input.block.markdown;*/
if (input.block.type !== "h") {
  input.isIgnore = true;
} else if (input.block.subtype === "h6") {
  input.isIgnore = true;
} else {
  output = "#" + output;
}
