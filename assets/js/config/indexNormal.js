const { ipcRenderer } = require("electron");
const connection = require("./connection");

/*---------- السكربت الخاص بالمهمة العادية ----------*/

let newNormal = document.querySelector(".todo--normal .add-new-task");

//إرسال حدث لانشاء نافذة جديدة إلى العملية الرئيسية
newNormal.addEventListener("click", function () {
    ipcRenderer.send("new-normal");
});

//استقبال حدث إضافة مهمة عادية من العملية الرئيسية 
ipcRenderer.on('add-normal-task', function (e, task) {
    addNormalTask(task);
});

//تابع إضافة مهمة عادية
function addNormalTask(task) {
    connection.insert({
        into: 'tasks',
        values: [{
            note: task
        }]
    }).then(() => showNormal());
}

//تابع تحديث مهمة عادية
function updateTask(taskId, taskValue) {
    connection.update({
        in: 'tasks',
        where: {
            id: taskId
        },
        set: {
            note: taskValue
        }
    }).then(() => showNormal());
}

//تابع حذف مهمة عادية
function deleteTask(tasksId) {
    return connection.remove({
        from: 'tasks',
        where: {
            id: tasksId
        }
    }).then(() => showNormal());
}

//تابع اظهار المهام العادية
function showNormal() {

    let clearNormalBtn = document.querySelector(".todo--normal .clear-all");
    let normalTasksList = document.querySelector(".todo--normal__list");
    normalTasksList.innerHTML = '';

    connection.select({
        from: 'tasks'
    }).then((tasks) => {

        if (tasks.length == 0) {
            //إخفاء زر حذف جميع المهام فى حالة لا توجد مهام
            clearNormalBtn.classList.remove("clear-all--show");
            normalTasksList.innerHTML = ' <li class="empty-list">لا توجد مهام</li> ';
        }
        else {
            //إظهار زر حذف جميع المهام فى حالة وجود مهام
            clearNormalBtn.classList.add("clear-all--show");
            //حذف جميع المهام العادية
            clearNormalBtn.addEventListener("click", function () {
                return connection.remove({
                    from: 'tasks'
                }).then(() => showNormal())
            });
            for (let task of tasks) {
                //انشاء العناصر الخاصة بقائمة المهام العادية فى هيكلية الصفحة 
                let listItem = document.createElement('li'),
                    taskInput = document.createElement('input'),
                    buttonsHolder = document.createElement('div'),
                    exportBTN = document.createElement('button'),
                    deleteBTN = document.createElement('button'),
                    updateBTN = document.createElement('button');

                //إضافة صنف إلى العنصر الذي يحوي الأزرار
                buttonsHolder.classList.add("buttons-holder");

                //إضافة محتوى نصى لكل زر
                deleteBTN.innerHTML = "حذف <i class='fas fa-trash-alt'></i>";
                updateBTN.innerHTML = "تحديث <i class='fas fa-cloud-upload-alt'></i>";
                exportBTN.innerHTML = "تصدير <i class='fas fa-file-export'></i>";

                //جعل قيمة عنصر الادخال مساوية لقيمة المهمة من قاعدة البيانات
                taskInput.value = task.note;

                //إضافة حدث على زر تصدير المهمة كملف نصي
                exportBTN.addEventListener("click", function () {
                    ipcRenderer.send("create-txt", task.note);
                });

                //إضافة حدث على زر حذف المهمة
                deleteBTN.addEventListener('click', () => {
                    deleteTask(task.id);
                });

                //إضافة حدث على زر تحديث المهمة
                updateBTN.addEventListener('click', () => {
                    updateTask(task.id, taskInput.value);
                });

                //إرفاق عنصر الإدخال إلى عنصر القائمة
                listItem.appendChild(taskInput);

                //إرفاق زر حذف المهمة إلى العنصر الحاوى
                buttonsHolder.appendChild(deleteBTN);

                //إرفاق زر تحديث المهمة إلى العنصر الحاوى
                buttonsHolder.appendChild(updateBTN);

                //إرفاق زر تصدير المهمة إلى العنصر الحاوى
                buttonsHolder.appendChild(exportBTN);

                //إرفاق العنصر الحاوى إلى القائمة
                listItem.appendChild(buttonsHolder);

                //إرفاق عنصر القائمة إلى القائمة الخاصة بالمهام العادية
                normalTasksList.appendChild(listItem);
            }
        }

    })

}


showNormal();