import * as esbuild from "esbuild";

const isDev = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: ["widget/src/index.ts"],
  bundle: true,
  minify: !isDev,
  sourcemap: isDev,
  target: ["es2020"],
  outfile: "widget/dist/feedbackflow.js",
  format: "iife",
  globalName: "FeedbackFlow",
};

if (isDev) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  const result = await esbuild.build({
    ...buildOptions,
    metafile: true,
  });

  const outputSize = result.metafile.outputs["widget/dist/feedbackflow.js"];
  console.log(
    `Built widget: ${(outputSize.bytes / 1024).toFixed(2)}KB (target: <50KB)`
  );
}
