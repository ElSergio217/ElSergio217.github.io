import fs from 'fs';

const targets = [
  'node_modules/three/examples/jsm/loaders/FBXLoader.js',
  'node_modules/three-stdlib/loaders/FBXLoader.js',
  'node_modules/three-stdlib/loaders/FBXLoader.cjs',
];

targets.forEach((file) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes('const buffer = NormalNode.Normals.a;')) {
      content = content.replace(
        'const buffer = NormalNode.Normals.a;',
        'const buffer = NormalNode.Normals ? NormalNode.Normals.a : [];'
      );
      changed = true;
    }

    if (content.includes('const extension = textureNode.FileName.split')) {
      content = content.replace(
        'const extension = textureNode.FileName.split',
        'const rawName = textureNode.FileName || textureNode.RelativeFilename || ""; const extension = rawName.split'
      );
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(file, content);
      console.log('Patched FBXLoader in:', file);
    }
  }
});
