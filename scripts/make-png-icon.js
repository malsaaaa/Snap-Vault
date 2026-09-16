const { app, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(() => {
  const jpgPath = "C:\\Users\\HP VICTUS\\.gemini\\antigravity-ide\\brain\\a8675d02-905f-4958-a527-e64c28da787a\\snapvault_app_icon_1789583013975.jpg";
  const img = nativeImage.createFromPath(jpgPath);
  const resized = img.resize({ width: 256, height: 256 });
  const pngBuffer = resized.toPNG();
  fs.writeFileSync(path.join(__dirname, '..', 'assets', 'icon.png'), pngBuffer);
  console.log('Successfully written assets/icon.png, size:', pngBuffer.length);
  app.quit();
});
