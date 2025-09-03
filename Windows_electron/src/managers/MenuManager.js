/**
 * Application menu management
 */

const { Menu, app } = require('electron');

class MenuManager {
  /**
   * Create and set the application menu
   * @param {function} openNewCartaCallback - Callback to open new CARTA window
   */
  static setupApplicationMenu(openNewCartaCallback) {
    // Creating simplified custom menus
    const template = [
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectall' },
        ]
      }
    ];
    const name = app.name;

    template.unshift({
      label: name,
      submenu: [
        {
          label: 'New CARTA Window',
          accelerator: 'Ctrl+N',
          click() {
            openNewCartaCallback();
          },
        },
        { type: 'separator' },
        { role: 'toggleFullScreen' },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          role: 'quit',
        },
      ],
    });

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

module.exports = MenuManager;
