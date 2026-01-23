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
  // Define NODE_ENV for conditional debug logging
  define: {
    "process.env.NODE_ENV": isDev ? '"development"' : '"production"',
  },
  // Performance optimizations
  treeShaking: true,
  // Drop console.log and debugger in production for smaller bundle
  drop: isDev ? [] : ["console", "debugger"],
  // Pure annotations for better tree shaking
  pure: ["console.log", "console.debug", "console.warn", "console.error"],
  // Inline small assets
  legalComments: "none",
  // Charset for smaller output
  charset: "utf8",
};

if (isDev) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
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


  if (minifiedSize > 50 * 1024) {
    console.warn(`⚠️  Warning: Widget exceeds 50KB target!`);
  } else {
  }
}
