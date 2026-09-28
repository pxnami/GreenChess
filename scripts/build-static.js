const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const output = path.join(root, "dist");
const files = ["index.html", "style.css", "script.js", "pieces-render.js"];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}

for (const file of files) {
  fs.copyFileSync(path.join(root, "public", file), path.join(output, file));
}
fs.writeFileSync(path.join(output, ".nojekyll"), "");
console.log("Static assets copied to dist/");
