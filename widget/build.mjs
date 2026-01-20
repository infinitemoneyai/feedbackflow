import * as esbuild from "esbuild";
import { gzip } from "zlib";
import { promisify } from "util";

const gzipAsync = promisify(gzip);
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
  // Performance optimizations
  treeShaking: true,
  // Drop console.log in production for smaller bundle
  drop: isDev ? [] : ["console", "debugger"],
  // Pure annotations for better tree shaking
  pure: ["console.log", "console.debug"],
  // Inline small assets
  legalComments: "none",
  // Charset for smaller output
  charset: "utf8",
};

if (isDev) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  const result = await esbuild.build({
    ...buildOptions,
    metafile: true,
    write: true,
  });

  const outputSize = result.metafile.outputs["widget/dist/feedbackflow.js"];
  const minifiedSize = outputSize.bytes;

  // Calculate gzipped size for more accurate CDN transfer size
  const fs = await import("fs");
  const content = fs.readFileSync("widget/dist/feedbackflow.js");
  const gzipped = await gzipAsync(content);
  const gzippedSize = gzipped.length;

  console.log(`Widget build complete:`);
  console.log(`  Minified: ${(minifiedSize / 1024).toFixed(2)}KB (target: <50KB)`);
  console.log(`  Gzipped:  ${(gzippedSize / 1024).toFixed(2)}KB (typical CDN transfer)`);

  if (minifiedSize > 50 * 1024) {
    console.warn(`⚠️  Warning: Widget exceeds 50KB target!`);
  } else {
    console.log(`✅ Widget size is within target`);
  }
}
