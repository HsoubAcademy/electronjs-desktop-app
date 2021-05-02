const {
   app,
   BrowserWindow,
   Menu,
   ipcMain,
   Notification,
   dialog,
   Tray
} = require('electron');
const path = require('path');
const fs = require('fs');
const appPath = app.getPath('userData');

//process.env.NODE_ENV = "production";

//تعريف المتغيرات العامة
let mainWindow;
let addTimedWindow;
let addImagedWindow;
let addWindow;
let tray = null;

//تابع التطبيق العام، ينفذ عندما يكون التطبيق جاهزًا
app.on("ready", function () {

   //انشاء النافذة الرئيسية
   mainWindow = new BrowserWindow({
      width: 800,
      height: 700,
      webPreferences: {
         nodeIntegration: true,
         contextIsolation: false
      }
   });

   //تحميل ملف النافذة الرئيسية
   mainWindow.loadFile("index.html");

   //اغلاق النوافذ الاخرى عند اغلاق التطبيق
   mainWindow.on("closed", function () {
      app.quit();
   });

   //في حال كان نظام التشغيل هو ماك
   app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
         app.quit();
      }
   });

   //تحميل نموذج القائمة العلوية
   const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

   //إضافة القائمة الجديدة للتطبيق
   Menu.setApplicationMenu(mainMenu);

   //عند تصغير القائمة إنشاء أيقونة للتطبيق فى شريط المهام
   mainWindow.on('minimize', function (event) {
      event.preventDefault();
      mainWindow.hide();
      tray = createTray();
   });

   //عند فتح التطبيق إخفاء أيقونة التطبيق من شريط المهام
   mainWindow.on('restore', function (event) {
      mainWindow.show();
      tray.destroy();
   });

});

//تابع إنشاء أيقونة التطبيق فى شريط المهام
function createTray() {
   let iconPath = path.join(__dirname, './assets/images/icon.png' );
   let appIcon = new Tray(iconPath);

   const contextMenu = Menu.buildFromTemplate(iconMenuTemplate);

   //عند الضغط مرتين على أيقونة التطبيق نظهر التطبيق
   appIcon.on('double-click', function (event) {
      mainWindow.show();
   });

   appIcon.setToolTip('تطبيق إدارة المهام');

   appIcon.setContextMenu(contextMenu);

   return appIcon;
}

//نموذج القائمة الخاصة بأيقونة التطبيق
const iconMenuTemplate = [
   {
      label: 'فتح',
      click: function () {
         mainWindow.show();
      }
   },
   {
      label: 'إغلاق',
      click: function () {
         app.quit();
      }
   }
];

//نموذج القائمة العامة
const mainMenuTemplate = [
   {
      label: "القائمة",
      submenu: [
         {
            label: "إضافة مهمة",
            click() {
               initAddWindow();
            }
         },
         {
            label: "إضافة مهمة مؤقتة",
            click() {
               createTimedWindow();
            }
         },
         {
            label: "إضافة مهمة مع صورة",
            click() {
               createImagedWindow();
            }
         },
         {
            label: "خروج",
            //اختصار للقائمة
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click() {
               app.quit();
            }
         }

      ]
   },
];

//فى حالة استخدام جهاز أبل أضف كائنًا فارغًا لحل مشكلة  
if (process.platform === "darwin") {
   mainMenuTemplate.unshift({});
}

//استقبال حدث انشاء ملف نصى من المهمة 
ipcMain.on("create-txt", function (e, note) {
   //متغير لاسم الملف عند التصدير
   let dest = Date.now() + "-Task.txt";
   //dialog.showSaveDialog فتح نافذة حفظ الملف باستخدام 
   dialog.showSaveDialog({
      //عنوان نافذة حفظ الملف
      title: 'اختار مكان حفظ الملف',
      //الاسم والمسار الافتراضى للملف
      defaultPath: path.join(__dirname, './' + dest),
      buttonLabel: 'Save',
      // تحديد نوع الملفات المسموح بها فقط
      filters: [
         {
            name: 'Text Files',
            extensions: ['txt']
         },],
      properties: []
   }).then(file => {
      //تحديد ما إذا تمت العملية أو ألغيت
      if (!file.canceled) {
         //إنشاء ملف فى المسار المحدد وإضافة القيمة الخاصة بالمهمة داخل الملف
         fs.writeFile(file.filePath.toString(),
            note, function (err) {
               if (err) throw err;
            });
      }
   }).catch(err => {
      console.log(err)
   });
});

//استقبال حدث انشاء نافذة جديدة من العملية الفرعية
ipcMain.on("new-normal", function (e) {
   initAddWindow();
})

//تابع إنشاء نافذة مهمة عادية جديدة
function initAddWindow() {
   //إنشاء نافذة جديدة
   addWindow = new BrowserWindow({
      width: 400,
      height: 250,
      title: "إضافة مهمة جديدة",
      webPreferences: {
         nodeIntegration: true,
         contextIsolation: false
      }
   });

   //تحميل ملف النافذة
   addWindow.loadFile(path.join(__dirname, "./views/normalTask.html"));

   //إزالة الإشارة إلى هذه النافذة وتجنب استخدامها مرة أخرى
   addWindow.on("closed", (e) => {
      e.preventDefault();
      addWindow = null;
   });

   //ازالة القائمة العلوية من النافذة
   addWindow.removeMenu();

}

//استقبال حدث اضافة مهمة عادية من العملية الفرعية
ipcMain.on("add-normal-task", function (e, item) {
   //إرسال الحدث والمعاملات الخاصة به الى صفحة عرض التطبيق الرئيسية
   mainWindow.webContents.send("add-normal-task", item);

   //إغلاق النافذة المسؤولة عن إضافة المهمة
   addWindow.close();
});


//استقبال حدث إنشاء نافذة جديدة من العملية الفرعية
ipcMain.on("new-timed", function (e) {
   createTimedWindow();
})

//تابع إنشاء نافذة مهمة مؤقتة
function createTimedWindow() {
   //إنشاء نافذة جديدة
   addTimedWindow = new BrowserWindow({
      width: 400,
      height: 400,
      title: "إضافة مهمة جديدة",
      webPreferences: {
         nodeIntegration: true,
         contextIsolation: false
      }
   });

   //تحميل ملف النافذة
   addTimedWindow.loadFile(path.join(__dirname, "./views/timedTask.html"));

   //إزالة الإشارة إلى هذه النافذة وتجنب استخدامها مرة أخرى
   addTimedWindow.on("closed", (e) => {
      e.preventDefault();
      addTimedWindow = null;
   });

   //إزالة القائمة العلوية من النافذة
   addTimedWindow.removeMenu();
}

//استقبال حدث اضافة مهمة مؤقتة من العملية الفرعية
ipcMain.on("add-timed-note", function (e, note, notificationTime) {
   //إرسال الحدث والمعاملات الخاصة به إلى صفحة عرض التطبيق الرئيسية
   mainWindow.webContents.send("add-timed-note", note, notificationTime);

   //إغلاق النافذة المسؤولة عن إضافة المهمة
   addTimedWindow.close();
});

//إرسال رسالة إلى المستخدم عند تطابق وقت المهمة مع الوقت الحالى
ipcMain.on("notify", function (e, taskValue) {
   new Notification({
      title: "لديك تنبية من مهامك",
      body: taskValue,
      icon: path.join(__dirname, './assets/images/icon.png')
   }).show();
});


//استقبال حدث إنشاء نافذة جديدة من العملية الفرعية
ipcMain.on("new-imaged", function (e) {
   createImagedWindow();
});

//تابع إنشاء نافذة مهمة مع صورة
function createImagedWindow() {
   //إنشاء نافذة جديدة
   addImagedWindow = new BrowserWindow({
      width: 400,
      height: 420,
      title: "إضافة مهمة جديدة",
      webPreferences: {
         nodeIntegration: true,
         contextIsolation: false
      }
   });

   //تحميل ملف النافذة
   addImagedWindow.loadFile(path.join(__dirname, "./views/imagedTask.html"));

   //إزالة الإشارة إلى هذه النافذة وتجنب استخدامها مرة أخرى
   addImagedWindow.on("closed", (e) => {
      e.preventDefault();
      addImagedWindow = null;
   });

   //إزالة القائمة العلوية من النافذة
   addImagedWindow.removeMenu();
}

//استقبال حدث فتح نافذة اختيار الصورة
ipcMain.on("upload-image", function (event) {
   //dialog.showOpenDialog فتح نافذة حفظ الملف باستخدام 
   dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
         { name: 'Images', extensions: ['jpg', 'png', 'gif'] }
      ]
   }).then(result => {
      //إرسال حدث فتح الصورة ومسارها إلى العملية الفرعية
      event.sender.send('open-file', result.filePaths, appPath);
   })
});

//استقبال حدث إضافة المهمة مع الصورة من العملية الفرعية
ipcMain.on("add-imaged-task", function (e, note, imgURI) {
   //إرسال حدث إضافة مهمة مع صورة الى النافذة الرئيسية
   mainWindow.webContents.send("add-imaged-task", note, imgURI);

   //إغلاق النافذة المسؤولة عن إضافة المهمة
   addImagedWindow.close();
});

//إضافة ادوات المطور الى القائمة فى حالة مرحلة التطوير فقط
if (process.env.NODE_ENV !== "production") {
   mainMenuTemplate.push({
      label: "أدوات المطور",
      submenu: [
         {
            label: "فتح وإغلاق أدوات المطور",
            accelerator: process.platform === 'darwin' ? 'Cmd+D' : 'Ctrl+D',
            click() {
               mainWindow.toggleDevTools();
            }
         }, {
            label: "إعادة تحميل التطبيق",
            role: "reload"
         }
      ]
   });
}