const JsStore = require('jsstore');

//إعدادات قاعدة البيانات
let dbName = 'todo_app';

//إنشاء مخطط قاعدة البيانات
function getDbSchema() {
    //إنشاء جدول المهام العادية
    let tblTasks = {
        name: 'tasks',
        columns: {
            id: { primaryKey: true, autoIncrement: true },
            note: { notNull: true, dataType: "string" }
        }
    };

    //إنشاء جدول المهام ذات التوقيت
    let tblTimed = {
        name: 'timed',
        columns: {
            id: { primaryKey: true, autoIncrement: true },
            note: { notNull: true, dataType: "string" },
            pick_status: { notNull: true, dataType: "number" },
            pick_time: { notNull: true, dataType: "date_time" },
        }
    }

    //إنشاء جدول المهام ذات الصورة
    let tblImaged = {
        name: 'imaged',
        columns: {
            id: { primaryKey: true, autoIncrement: true },
            note: { notNull: true, dataType: "string" },
            img_uri: { notNull: true, dataType: "string" }
        }
    }

    let db = {
        name: dbName,
        tables: [tblTasks, tblTimed, tblImaged]
    }
    return db;
}


// web worker تنفيذ قاعدة البيانات داخل
let connection = new JsStore.Connection(new Worker('node_modules/jsstore/dist/jsstore.worker.js'));

async function initJsStore() {
    let database = getDbSchema();
    const isDbCreated = await connection.initDb(database);
    if (isDbCreated === true) {
        console.log("تم إنشاء قاعدة البيانات");
    }
    else {
        console.log("تم فتح قاعدة البيانات");
    }
}

//استدعاء تابع قاعدة البيانات
initJsStore();

module.exports = connection;