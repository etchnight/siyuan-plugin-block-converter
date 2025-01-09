declare class Lute {
  public static WalkStop: number;
  public static WalkSkipChildren: number;
  public static WalkContinue: number;
  public static Version: string;
  public static Caret: string;

  public static New(): Lute;

  public static EChartsMindmapStr(text: string): string;

  public static NewNodeID(): string;

  public static Sanitize(html: string): string;

  public static EscapeHTMLStr(str: string): string;

  public static UnEscapeHTMLStr(str: string): string;

  public static GetHeadingID(node: ILuteNode): string;

  public static BlockDOM2Content(html: string): string;

  private constructor();

  public BlockDOM2Content(text: string): string;

  public BlockDOM2EscapeMarkerContent(text: string): string;

  public SetSpin(enable: boolean): void;

  public SetTextMark(enable: boolean): void;

  public SetHTMLTag2TextMark(enable: boolean): void;

  public SetHeadingID(enable: boolean): void;

  public SetProtyleMarkNetImg(enable: boolean): void;

  public SetSpellcheck(enable: boolean): void;

  public SetFileAnnotationRef(enable: boolean): void;

  public SetSetext(enable: boolean): void;

  public SetYamlFrontMatter(enable: boolean): void;

  public SetChineseParagraphBeginningSpace(enable: boolean): void;

  public SetRenderListStyle(enable: boolean): void;

  public SetImgPathAllowSpace(enable: boolean): void;

  public SetKramdownIAL(enable: boolean): void;

  public BlockDOM2Md(html: string): string;

  public BlockDOM2StdMd(html: string): string;

  public SetSuperBlock(enable: boolean): void;

  public SetTag(enable: boolean): void;

  public SetInlineMath(enable: boolean): void;

  public SetGFMStrikethrough(enable: boolean): void;

  public SetGFMStrikethrough1(enable: boolean): void;

  public SetMark(enable: boolean): void;

  public SetSub(enable: boolean): void;

  public SetSup(enable: boolean): void;

  public SetInlineAsterisk(enable: boolean): void;

  public SetInlineUnderscore(enable: boolean): void;

  public SetBlockRef(enable: boolean): void;

  public SetSanitize(enable: boolean): void;

  public SetHeadingAnchor(enable: boolean): void;

  public SetImageLazyLoading(imagePath: string): void;

  public SetInlineMathAllowDigitAfterOpenMarker(enable: boolean): void;

  public SetToC(enable: boolean): void;

  public SetIndentCodeBlock(enable: boolean): void;

  public SetParagraphBeginningSpace(enable: boolean): void;

  public SetFootnotes(enable: boolean): void;

  public SetLinkRef(enable: boolean): void;

  public SetEmojiSite(emojiSite: string): void;

  public PutEmojis(emojis: IObject): void;

  public SpinBlockDOM(html: string): string;

  public Md2BlockDOM(html: string): string;

  public SetProtyleWYSIWYG(wysiwyg: boolean): void;

  public MarkdownStr(name: string, md: string): string;

  public GetLinkDest(text: string): string;

  public BlockDOM2InlineBlockDOM(html: string): string;

  public BlockDOM2HTML(html: string): string;

  public HTML2Md(html: string): string;

  public HTML2BlockDOM(html: string): string;
}
