<template>
  <div ref="root">
    <div
      class="protyle-util"
      :style="{ top: size.top, left: size.left, zIndex: 11 }">
      <div class="fn__flex" :style="{ maxHeight: size.height }">
        <!-- 左侧 -->
        <div class="fn__flex-column" :style="{ maxWidth: size.leftWidth }">
          <!-- 工具栏（左上） -->
          <div class="fn__flex" style="margin: 0 8px 4px 8px">
            <input class="b3-text-field fn__flex-1" @input="handleInput" />
          </div>
          <!-- 文件列表 -->
          <div
            class="b3-list fn__flex-1 b3-list--background"
            style="position: relative">
            <div
              v-for="file in filteredFiles"
              :key="file.id || file.label"
              class="b3-list-item b3-list-item--hide-action"
              @mouseenter="handleMouseEnter(file)"
              @mouseleave="handleMouseLeave"
              @click="handleClick(file)">
              <span class="b3-list-item__text">{{ file.label }}</span>
            </div>
          </div>
        </div>
        <!-- 描述区 -->
        <div :style="{ width: size.midWidth }">
          <div class="fn__flex b3-label config__item" style="flex-wrap: wrap">
            <button
              class="b3-button b3-button--outline fn__flex-center"
              @click="refresh">
              <svg><use xlink:href="#iconRefresh"></use></svg>
              重新运行
            </button>
            <button
              class="b3-button b3-button--outline fn__flex-center"
              @click="runExec">
              <svg><use xlink:href="#iconPlay"></use></svg>
              正式运行
            </button>
            <button
              class="b3-button b3-button--outline fn__flex-center"
              @click="saveParams">
              <svg><use xlink:href="#iconFile"></use></svg>
              保存参数
            </button>
            <button
              class="b3-button b3-button--outline fn__flex-center"
              @click="restoreParams">
              <svg><use xlink:href="#iconUndo"></use></svg>
              恢复默认参数
            </button>
          </div>
          <div
            ref="wysiwygDescription"
            data-type="description"
            class="protyle-wysiwyg"></div>
        </div>
        <!-- 预览区 -->
        <div :style="{ width: size.rightWidth }">
          <div class="fn__flex b3-label config__item" style="flex-wrap: wrap">
            <button
              class="b3-button b3-button--outline fn__flex-center"
              @click="switchContent">
              <svg v-if="switchButtonStore.state">
                <use xlink:href="#iconUndo"></use>
              </svg>
              <svg v-else><use xlink:href="#iconRedo"></use></svg>
              {{ switchButtonStore.state ? "显示原文" : "显示结果" }}
            </button>
          </div>
          <div
            ref="wysiwygPreview"
            data-type="preview"
            class="protyle-wysiwyg"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { Dialog, IProtyle } from "siyuan";
import { getI18n, getPlugin, ISnippet } from "./common";
import { execCopy, previewCopy } from "./customCopy";
import { execUpdate, previewUpdate } from "./customUpdate";
import { execPaste, previewPaste } from "./customPaste";
import { CONSTANTS, EComponent } from "./constants";
import { processRender } from "../../subMod/siyuanPlugin-common/src/render";
import { store } from "./store";

const props = defineProps<{
  files: ISnippet[];
  blockElements: HTMLElement[];
  protyle: IProtyle;
  dialog: Dialog;
  component: EComponent;
}>();

// 尺寸计算
const computeSize = () => {
  const height = window.innerHeight * 0.78;
  const width = window.innerWidth * 0.8;
  const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  return {
    left: center.x - width / 2 + "px",
    top: center.y - height / 2 + "px",
    width: width + "px",
    height: height + "px",
    leftWidth: width * 0.25 + "px",
    midWidth: width * 0.25 + "px",
    rightWidth: width * 0.5 + "px",
  };
};

const size = computeSize();
const root = ref<HTMLElement | null>(null);
const selectedFile = ref<ISnippet | undefined>();
const lastFile = ref<ISnippet | undefined>();
const filteredFiles = ref<ISnippet[]>(props.files);

const wysiwygDescription = ref<HTMLDivElement | null>(null);
const wysiwygPreview = ref<HTMLDivElement | null>(null);

const switchButtonStore = ref({
  state: true,
  html: "",
});

// 更新编辑器内容
const updateWysiwyg = (html: string, wysiwyg: HTMLDivElement | null) => {
  if (!wysiwyg) return;
  let prefixHtml = `<div data-node-id="description" data-type="NodeThematicBreak" class="hr"><div></div></div>`;
  const titleText = "###### ";
  if (wysiwyg.getAttribute("data-type") === "description") {
    prefixHtml =
      props.protyle.lute.Md2BlockDOM(
        titleText + getI18n().dialog_protyle_util_description
      ) + prefixHtml;
  } else if (wysiwyg.getAttribute("data-type") === "preview") {
    let previewText = getI18n().dialog_protyle_util_preview;
    if (store.previewLimit != 0) {
      previewText += getI18n().dialog_protyle_util_preview_memo.replace(
        "${arg1}",
        store.previewLimit.toString()
      );
    }
    prefixHtml =
      props.protyle.lute.Md2BlockDOM(titleText + previewText) + prefixHtml;
  }

  wysiwyg.innerHTML = prefixHtml + html;
  processRender(wysiwyg);
  // 设置禁止编辑
  wysiwyg.querySelectorAll("[data-node-id]").forEach((block) => {
    if (block.getAttribute("data-node-id") == "additionalStatement") {
      return;
    }
    block.querySelectorAll("[contenteditable]").forEach((item) => {
      item.setAttribute("contenteditable", "false");
    });
  });
  return wysiwyg.innerHTML;
};

// 描述
const updateDescription = async (file: ISnippet) => {
  if (!wysiwygDescription.value) return;
  updateWysiwyg("", wysiwygDescription.value);
  let paramsMarkdown = [];
  if (file.addStmt) {
    paramsMarkdown = [
      "```ts",
      file.addStmt,
      "```",
      '{: id="additionalStatement"}',
    ];
  }
  const description = `${paramsMarkdown.join("\n")}\n${file.description || ""}`;
  updateWysiwyg(
    props.protyle.lute.Md2BlockDOM(description),
    wysiwygDescription.value
  );
};

// 输入处理
const handleInput = (e: Event) => {
  const filter = (e.target as HTMLInputElement).value;
  filteredFiles.value = props.files.filter(
    (file) => !filter || file.label.includes(filter)
  );
};

// 鼠标进入处理
const handleMouseEnter = async (file: ISnippet) => {
  selectedFile.value = file;
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve("");
    }, 500);
  });
  if (selectedFile.value !== file) {
    return;
  }
  lastFile.value = file;
  await run(file, "preview", updateDescription);
};

// 鼠标离开处理
const handleMouseLeave = () => {
  selectedFile.value = undefined;
};

// 点击处理
const handleClick = async (file: ISnippet) => {
  props.dialog.destroy();
  await run(file, "exec", updateState);
};

// 获取附加语句
const getAdditionalStatement = () => {
  if (!wysiwygDescription.value) return "";
  const block = wysiwygDescription.value.querySelector(
    "[data-node-id='additionalStatement']"
  );
  if (!block) {
    return "";
  }
  const codeEle = block.querySelector("[contenteditable='true']");
  return codeEle?.textContent?.trim() || "";
};

// 更新状态
const updateState = async (file: ISnippet) => {
  file.addStmt = getAdditionalStatement();
};

// 重新运行
const refresh = async () => {
  if (lastFile.value) {
    run(lastFile.value, "preview", updateState);
  }
};

// 正式运行
const runExec = async () => {
  if (lastFile.value) {
    props.dialog.destroy();
    run(lastFile.value, "exec", updateState);
  }
};

// 保存参数
const saveParams = async () => {
  if (!lastFile.value) return;
  const plugin = getPlugin();
  const additionalStatement = getAdditionalStatement();
  const key =
    lastFile.value.name ||
    lastFile.value.id ||
    lastFile.value.path.replace(CONSTANTS.STORAGE_PATH, "");
  if (!plugin.data["snippetConfig.json"]) {
    plugin.data["snippetConfig.json"] = {};
  }
  if (!plugin.data["snippetConfig.json"][key]) {
    plugin.data["snippetConfig.json"][key] = {};
  }
  plugin.data["snippetConfig.json"][key].additionalStatement =
    additionalStatement;
  lastFile.value.addStmt = additionalStatement;
  await plugin.saveData(
    "snippetConfig.json",
    plugin.data["snippetConfig.json"]
  );
};

// 恢复参数
const restoreParams = async () => {
  if (lastFile.value) {
    lastFile.value.addStmt = lastFile.value.addStmtDefault;
    updateDescription(lastFile.value);
  }
};

// 切换内容
const switchContent = () => {
  if (!wysiwygPreview.value) return;
  let newButtonText = switchButtonStore.value.state ? "显示结果" : "显示原文";
  switchButtonStore.value.state = !switchButtonStore.value.state;
  [wysiwygPreview.value.innerHTML, switchButtonStore.value.html] = [
    switchButtonStore.value.html,
    wysiwygPreview.value.innerHTML,
  ];
};

// 运行
const run = async (
  file: ISnippet,
  mode: "preview" | "exec",
  callback?: (file: ISnippet) => Promise<void>
) => {
  if (mode === "preview" && wysiwygPreview.value) {
    updateWysiwyg("正在执行...", wysiwygPreview.value);
  }
  let html = "";
  const list = [
    {
      component: EComponent.Copy,
      previewFunc: previewCopy,
      executeFunc: execCopy,
    },
    {
      component: EComponent.Update,
      previewFunc: previewUpdate,
      executeFunc: execUpdate,
    },
    {
      component: EComponent.Paste,
      previewFunc: previewPaste,
      executeFunc: execPaste,
    },
  ];
  const item = list.find((item) => item.component === props.component);
  if (item) {
    if (mode === "preview") {
      html = await item.previewFunc(
        file,
        props.blockElements,
        props.protyle,
        callback
      );
    } else if (mode === "exec") {
      await item.executeFunc(
        file,
        props.blockElements,
        props.protyle,
        callback
      );
    }
  }
  if (mode === "preview" && wysiwygPreview.value) {
    updateWysiwyg(html, wysiwygPreview.value);
  }
};

onMounted(() => {
  if (wysiwygDescription.value) {
    updateWysiwyg("", wysiwygDescription.value);
  }
  if (wysiwygPreview.value) {
    updateWysiwyg("", wysiwygPreview.value);
  }
  switchButtonStore.value.html = buildOriginHtml();
});

// 构建原文 HTML
const buildOriginHtml = () => {
  let html = props.blockElements
    .slice(0, store.previewLimit)
    .reduce((pre, cur) => {
      return cur.outerHTML + pre;
    }, "");
  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelectorAll("[data-node-id]").forEach((item) => {
    item.setAttribute("data-node-id", window.Lute.NewNodeID());
    item.classList.remove("protyle-wysiwyg--select");
  });
  if (wysiwygPreview.value) {
    html = updateWysiwyg(div.innerHTML, wysiwygPreview.value);
  }
  return html;
};
</script>

<style scoped>
/* 可以根据需要添加样式 */
</style>
