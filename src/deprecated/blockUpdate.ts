/**
 * * 该部分已被完全弃用，但是对编辑器操作仍有借鉴意义
 * * 可以解决在其他组件中新建编辑器，如何在操作后获取操作后产生的块
 * todo 后续拟合并入subMod\siyuanPlugin-common
 */
import {
  IWebSocketData,
  Protyle,
  TTurnIntoOne,
  TTurnIntoOneSub,
  showMessage,
} from "siyuan";
import { TransactionRes } from "../../subMod/siyuanPlugin-common/siyuan-api/block";

/**
 * * 前处理后的监听函数，会监听以下两个事件
 * * 等待前端操作完成后获取更新后的块
 * * 等待数据库索引提交完毕后执行转换函数
 */
const updateBlockEles = async (e: CustomEvent<IWebSocketData>) => {
  if (e.detail.cmd === "transactions") {
    const result = e.detail.data as TransactionRes[];
    const id = result[0].doOperations.find((e) => {
      return e.action == "insert";
    }).id;
    if (!id) {
      showMessage("查找转换后块失败", undefined, "error");
      return;
    }
    this.detail.blockElements = [
      document.querySelector(`[data-node-id='${id}']`),
    ];
  } else if (e.detail.cmd === "databaseIndexCommit") {
    this.eventBus.off("ws-main", updateBlockEles);
    //await transform();
    location.reload(); //todo 更新后原块会出现两个，暂时原因未知
  }
};
/**
 ** 新建一个隐形的编辑器并对块进行合并操作
 * @param type
 * @param subType
 */
const preTransform = (type: TTurnIntoOne, subType?: TTurnIntoOneSub) => {
  const protyle = new Protyle(
    this.app,
    document.createElement("div"),
    this.detail.protyle.options
  );
  protyle.turnIntoOneTransaction(this.detail.blockElements, type, subType);
  this.eventBus.on("ws-main", updateBlockEles);
};

const submenu = [
  {
    label: "合并为无序列表后更新",
    iconHTML: "",
    click: () => preTransform("Blocks2ULs"),
  },
  {
    label: "合并为有序列表后更新",
    iconHTML: "",
    click: () => preTransform("Blocks2OLs"),
  },
  {
    label: "合并为待办列表后更新",
    iconHTML: "",
    click: () => preTransform("Blocks2TLs"),
  },
  {
    label: "合并为引用块后更新",
    iconHTML: "",
    click: () => preTransform("Blocks2TLs"),
  },
  {
    label: "合并为超级块（列布局）后更新",
    iconHTML: "",
    click: () => preTransform("BlocksMergeSuperBlock", "col"),
  },
  {
    label: "合并为超级块（行布局）后更新",
    iconHTML: "",
    click: () => preTransform("BlocksMergeSuperBlock", "row"),
  },
];
