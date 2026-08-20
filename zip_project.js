const fs = require('fs');
const AdmZip = require('adm-zip');

const zip = new AdmZip();
const folders = ["src", "data"];
const files = [
  "package.json",
  "tsconfig.json",
  "drizzle.config.json",
  "next.config.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "README.md",
  "README_DEPLOY.md",
  "README_SELLER_RATING.md",
  "liara.json",
  ".env.example"
];

folders.forEach(f => {
  if (fs.existsSync(f)) {
    zip.addLocalFolder(f, f);
  }
});

files.forEach(f => {
  if (fs.existsSync(f)) {
    zip.addLocalFile(f);
  }
});

zip.writeZip("public/project-source.zip");
console.log("Zip created successfully at public/project-source.zip");
