const { ipcRenderer } = require("electron");
const connection = require("./connection");

/*---------- السكربت الخاص بالمهمة ذات توقيت محدد ----------*/
let newTimed = document.querySelector(".todo--timed .add-new-task");

//إرسال حدث لإنشاء نافذة جديدة إلى العملية الرئيسية
newTimed.addEventListener("click", function () {
    ipcRenderer.send("new-timed");
});

//استقبال حدث إضافة مهمة ذات توقيت من العملية الرئيسية 
ipcRenderer.on('add-timed-note', function (e, note, notificationTime) {
    addTimedTask(note, notificationTime);
});

//تابع إضافة مهمة ذات توقيت محدد
function addTimedTask(note, notificationTime) {
    connection.insert({
        into: 'timed',
        values: [{
            note: note,
            pick_status: 0,
            pick_time: notificationTime
        }]
    }).then(() => showTimed());
}

//تابع تحديث مهمة ذات توقيت محدد
function updateTimedTask(taskId, taskValue) {
    connection.update({
        in: 'timed',
        where: {
            id: taskId
        },
        set: {
            note: taskValue
        }
    }).then(() => showTimed());
}

//تابع حذف مهمة ذات توقيت محدد
function deleteTimedTask(tasksId) {
    return connection.remove({
        from: 'timed',
        where: {
            id: tasksId
        }
    }).then(() => showTimed());
}

//تابع اظهار المهام ذات توقيت محدد
function showTimed() {

    let clearTimedlBtn = document.querySelector(".todo--timed .clear-all");
    let timedList = document.querySelector(".todo--timed__list");
    timedList.innerHTML = '';

    connection.select({
        from: 'timed'
    }).then((tasks) => {

        if (tasks.length == 0) {
            //اخفاء زر حذف جميع المهام فى حالة لاتوجد مهام
            clearTimedlBtn.classList.remove("clear-all--show");
            timedList.innerHTML = '<li class="empty-list">لا توجد مهام</li>';
        }
        else {
            //اظهار زر حذف جميع المهام فى حالة وجود مهام
            clearTimedlBtn.classList.add("clear-all--show");
            //حذف جميع المهام ذات توقيت محدد
            clearTimedlBtn.addEventListener("click", function () {
                return connection.remove({
                    from: 'timed'
                }).then(() => showTimed())
            });
            for (let task of tasks) {
                //انشاء العناصر الخاصة بقائمة المهام المؤقتة فى هيكلية الصفحة 
                let listItem = document.createElement('li'),
                    taskInput = document.createElement('input'),
                    buttonsHolder = document.createElement('div'),
                    timeHolder = document.createElement('div'),
                    exportBTN = document.createElement('button'),
                    deleteBTN = document.createElement('button'),
                    updateBTN = document.createElement('button');

                //إضافة محتوى نصى لكل زر 
                deleteBTN.innerHTML = "حذف <i class='fas fa-trash-alt'></i>";
                updateBTN.innerHTML = "تحديث <i class='fas fa-cloud-upload-alt'></i>";
                exportBTN.innerHTML = "تصدير <i class='fas fa-file-export'></i>";

                //إضافة صفة إلى العنصر الذي يحوي الأزرار
                timeHolder.classList.add("time-holder");

                //إضافة صفة إلى العنصر الذي يحوي الأزرار
                buttonsHolder.classList.add("buttons-holder");

                //جعل قيمة عنصر الادخال مساوية لقيمة المهمة من قاعدة البيانات
                taskInput.value = task.note;

                //تغير نص توقيت المهمة بناءً على حالة المهمة
                if (task.pick_status === 1) {
                    timeHolder.innerHTML = "جرى التنبيه فى الساعة " + task.pick_time.toLocaleTimeString();
                } else {
                    timeHolder.innerHTML = "يتم التنبيه فى الساعة " + task.pick_time.toLocaleTimeString();
                }

                //انشاء تابع يتفقد التوقيت الحإلى كل ثانية
                let checkInterval = setInterval(function () {
                    let currentDate = new Date();

                    if (task.pick_time.toString() === currentDate.toString()) {
                        //ارسال اشعار إلى العملية الرئيسية عند تطابق التوقيت الحإلى مع التوقيت المضمون فى المهمة
                        ipcRenderer.send("notify", task.note);

                        //تغير حالة المهمة إلى منتهية
                        connection.update({
                            in: 'timed',
                            where: {
                                id: task.id
                            },
                            set: {
                                pick_status: 1
                            }
                        }).then(() => showTimed());

                        //إزالة الاشعار وإيقاف التابع بعد تطابق التوقيت 
                        clearInterval(checkInterval);
                    }

                }, 1000);


                //إضافة حدث على زر تصدير المهمة كملف نصى
                exportBTN.addEventListener("click", function () {
                    ipcRenderer.send("create-txt", task.note);
                });

                //إضافة حدث على زر حذف المهمة
                deleteBTN.addEventListener('click', () => {
                    deleteTimedTask(task.id);
                });

                //إضافة حدث على زر تحديث المهمة
                updateBTN.addEventListener('click', () => {
                    updateTimedTask(task.id, taskInput.value);
                });

                //إرفاق عنصر الادخال إلى عنصر القائمة
                listItem.appendChild(taskInput);


                //إرفاق العنصر الحاوى للتوقيت  إلى عنصر القائمة
                listItem.appendChild(timeHolder);

                //إرفاق زر حذف المهمة إلى العنصر الحاوى
                buttonsHolder.appendChild(deleteBTN);

                //إرفاق زر تحديث المهمة إلى العنصر الحاوى
                buttonsHolder.appendChild(updateBTN);

                //إرفاق زر تصدير المهمة إلى العنصر الحاوى
                buttonsHolder.appendChild(exportBTN);

                //إرفاق العنصر الحاوى إلى القائمة
                listItem.appendChild(buttonsHolder);

                //إرفاق عنصر القائمة إلى القائمة الخاصة بالمهام المؤقتة
                timedList.appendChild(listItem)
            }
        }

    })
}

showTimed();