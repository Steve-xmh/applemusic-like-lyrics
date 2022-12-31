const { build } = require("esbuild");
const { stylusLoader } = require("esbuild-stylus-loader");
const JSZip = require("jszip");
const fs = require("fs");

build({
  entryPoints: ["src/index.tsx", "src/startup_script.ts", "src/index.styl"],
  bundle: true,
  sourcemap: process.argv.includes("--dev") ? "inline" : false,
  minify: !process.argv.includes("--dev"),
  outdir: ".",
  define: {
    DEBUG: process.argv.includes("--dev").toString(),
  },
  watch: process.argv.includes("--watch")
    ? {
        onRebuild(err, result) {
          console.log("Rebuilding");
          if (err) {
            console.warn(err.message);
          } else if (result) {
            console.log("Build success");
          }
        },
      }
    : undefined,
  plugins: [stylusLoader()],
}).then((result) => {
  console.log("Build success");
  if (process.argv.includes("--dist")) {
    const plugin = new JSZip();
    function addIfExist(filename) {
      if (fs.existsSync(filename))
        plugin.file(filename, fs.readFileSync(filename));
    }
    addIfExist("manifest.json");
    addIfExist("index.js");
    addIfExist("index.css");
    addIfExist("startup_script.js");
    const output = plugin.generateNodeStream({
      compression: "DEFLATE",
      compressionOptions: {
        level: 9,
      },
    });
    output.pipe(fs.createWriteStream('Apple Music-like lyrics.plugin'))
  }
});
