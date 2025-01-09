//*获取剪贴板内容
async function getClipboardHtml() {
  const content = await navigator.clipboard.read().then((e) => e[0]);
  let blob: Blob;
  if (content.types.includes("text/html")) {
    blob = await content.getType("text/html");
  } else if (content.types.includes("text/plain")) {
    blob = await content.getType("text/plain");
  } else {
    //showMessage(getI18n().message_getClipboardHtml);
    return;
  }
  const html = await blob.text();
  const div = document.createElement("div");
  div.innerHTML = html;
  //console.warn(`[${EComponent.Paste}-Input]`, div);
  return html;
}
tools.getClipboardHtml = getClipboardHtml;

//*html块转普通Block
const htmlBlock2text = (domText: string) => {
  const parentDom = document.createElement("div");
  parentDom.innerHTML = domText;
  for (const child of parentDom.children) {
    if (child.getAttribute("data-type") === "NodeHTMLBlock") {
      const content = child
        .querySelector("protyle-html")
        ?.getAttribute("data-content");
      if (content) {
        const tempdiv = document.createElement("div");
        tempdiv.innerHTML = content;
        child.outerHTML = tempdiv.innerText || tempdiv.textContent;
      }
    }
  }
  return parentDom.innerHTML;
};
tools.htmlBlock2text = htmlBlock2text;
