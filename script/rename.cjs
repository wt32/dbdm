const fs = require('fs');
const path = require('path');

function rename(filePath, extName) {
  const distDir = path.resolve(__dirname, filePath);
  const files = fs.readdirSync(distDir);

  files.forEach((file) => {
    if (path.extname(file) === '.js') {
      const oldPath = path.join(distDir, file);
      const newPath = path.join(distDir, `${path.basename(file, '.js')}.${extName}`);
      fs.renameSync(oldPath, newPath);
    }
  });
}

// 调用函数并传入正确的参数
rename('../dist/cjs', 'cjs');
rename('../dist/mjs', 'mjs');