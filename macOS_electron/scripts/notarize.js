require('dotenv').config();
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
    if (electronPlatformName !== 'darwin') {
        return;
    }
  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: '<Your Apple Developer ID> ',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: '<Your Apple Developer email address>',
    appleIdPassword: '<Your app-specific-password>',
    });
  };
