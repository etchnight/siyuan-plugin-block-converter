import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";
import minimist from "minimist";
import { viteStaticCopy } from "vite-plugin-static-copy";
import livereload from "rollup-plugin-livereload";
import zipPack from "vite-plugin-zip-pack";
import fg from "fast-glob";
import vue from "@vitejs/plugin-vue";

const args = minimist(process.argv.slice(2));
const isWatch = args.watch || args.w || false;
const devDistDir = "./dev";
const distDir = isWatch ? devDistDir : "./dist";

console.warn("isWatch=>", isWatch);
console.warn("distDir=>", distDir);

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },

  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: "./README*.md",
          dest: "./",
        },
        {
          src: "./plugin.json",
          dest: "./",
        },
        {
          src: "./preview.png",
          dest: "./",
        },
        {
          src: "./icon.png",
          dest: "./",
        },
        {
          src: "./asset",
          dest: "./",
        },
        {
          src: "./CHANGELOG.md",
          dest: "./",
        },
      ],
    }),
    vue(),
  ],

  // https://github.com/vitejs/vite/issues/1930
  // https://vitejs.dev/guide/env-and-mode.html#env-files
  // https://github.com/vitejs/vite/discussions/3058#discussioncomment-2115319
  // 在这里自定义变量
  define: {
    "process.env.DEV_MODE": `"${isWatch}"`,
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },

  build: {
    // 输出路径
    outDir: distDir,
    emptyOutDir: false,

    // 构建后是否生成 source map 文件
    sourcemap: false,

    // 设置为 false 可以禁用最小化混淆
    // 或是用来指定是应用哪种混淆器
    // boolean | 'terser' | 'esbuild'
    // 不压缩，用于调试
    minify: !isWatch,

    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/index.ts"),
      // the proper extensions will be added
      fileName: "index",
      formats: ["cjs"],
    },
    rollupOptions: {
      plugins: [
        ...(isWatch
          ? [
              livereload(devDistDir),
              {
                //监听静态资源文件
                name: "watch-external",
                async buildStart() {
                  const files = await fg([
                    "public/**/*",
                    "./README*.md",
                    "./plugin.json",
                    "./CHANGELOG.md",
                  ]);
                  for (const file of files) {
                    this.addWatchFile(file);
                  }
                },
              },
            ]
          : [
              zipPack({
                inDir: "./dist",
                outDir: "./",
                outFileName: "package.zip",
              }),
            ]),

        // 添加 Vue 组件的构建配置
        /*vue({
          template: {
            compilerOptions: {
              isCustomElement: (tag) => tag.startsWith("my-"),
            },
          },
        }),*/
      ],

      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["siyuan", "process"],

      output: {
        entryFileNames: "[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") {
            return "index.css";
          }
          return assetInfo.name;
        },
      },
    },
  },
});
