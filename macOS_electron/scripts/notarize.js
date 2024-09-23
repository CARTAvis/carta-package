require('dotenv').config();
const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
    if (electronPlatformName !== 'darwin') {
        return;
    }
  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appPath: `${appOutDir}/${appName}.app`,
    appleId: '<Your Apple Developer email address>',
    appleIdPassword: '<Your app specific password>',
    teamId: '<Your Apple Team ID assigned by Apple>',
    });
  };
