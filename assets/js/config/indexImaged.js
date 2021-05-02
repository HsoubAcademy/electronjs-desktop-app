const { ipcRenderer } = require("electron");
const fs = require('fs');
const connection = require("./connection");

/*---------- السكربت الخاص بالمهمة ذات صورة ----------*/
let newImaged = document.querySelector(".todo--images .add-new-task");

//إرسال حدث لإنشاء نافذة جديدة إلى العملية الرئيسية
newImaged.addEventListener("click", function() {
    ipcRenderer.send("new-imaged");
});

//استقبال حدث إضافة مهمة ذات صورة من العملية الرئيسية 
ipcRenderer.on('add-imaged-task', function (e, note, imgURI ) {
    addImagedTask(note, imgURI);
});

//تابع إضافة مهمة ذات صورة
function addImagedTask(note, imgURI) {
    connection.insert({
        into: 'imaged',
        values: [{
            note: note,
            img_uri: imgURI
        }]
    }).then(() => showImaged());
}

//تابع تحديث مهمة ذات صورة
function updateImagedTask(taskId, taskValue) {
    connection.update({
        in: 'imaged',
        where: {
            id: taskId
        },
        set: {
            note: taskValue
        }
    }).then(() => showImaged());
}

//تابع حذف مهمة ذات صورة
function deleteImagedTask(tasksId, imgPath) {
    if (imgPath) {
        //حذف الصورة من ملفات التطبيق ايضا
        fs.unlink(imgPath, (err) => {
            if (err) {
                console.error(err)
                return
            }
        });
    }
    return connection.remove({
        from: 'imaged',
        where: {
            id: tasksId
        }
    }).then(() => showImaged());
}

//تابع اظهار المهام ذات صورة
function showImaged() {

    let clearImagedBtn = document.querySelector(".todo--images .clear-all");
    let imagedList = document.querySelector(".todo--images__list");
    imagedList.innerHTML = '';

    connection.select({
        from: 'imaged'
    }).then((tasks) => {

        if (tasks.length == 0) {
            //اخفاء زر حذف جميع المهام فى حالة لاتوجد مهام
            clearImagedBtn.classList.remove("clear-all--show");
            
            imagedList.innerHTML = '<li class="empty-list">لا توجد مهام</li>';
        }
        else {
            //اظهار زر حذف جميع المهام فى حالة وجود مهام
            clearImagedBtn.classList.add("clear-all--show");

            //حذف جميع المهام ذات صورة
            clearImagedBtn.addEventListener("click", function () {
                return connection.remove({
                    from: 'imaged'
                }).then(() => showImaged())
            });
            for (let task of tasks) {
                //انشاء العناصر الخاصة بقائمة المهام ذات الصور فى هيكلية الصفحة 
                let listItem = document.createElement('li'),
                    imageHolder = document.createElement('div'),
                    noteContentHolder = document.createElement('div'),
                    taskInput = document.createElement('input'),
                    buttonsHolder = document.createElement('div'),
                    taskImage = document.createElement('img'),
                    exportBTN = document.createElement('button'),
                    deleteBTN = document.createElement('button'),
                    updateBTN = document.createElement('button');

                //إضافة صفة إلى العنصر الذي يحوي الأزرار
                buttonsHolder.classList.add("buttons-holder");

                //إضافة محتوى نصى لكل زر
                deleteBTN.innerHTML = "حذف <i class='fas fa-trash-alt'></i>";
                updateBTN.innerHTML = "تحديث <i class='fas fa-cloud-upload-alt'></i>";
                exportBTN.innerHTML = "تصدير <i class='fas fa-file-export'></i>";

                //جعل قيمة عنصر الادخال مساوية لقيمة المهمة من قاعدة البيانات
                taskInput.value = task.note;

                //جعل قيمة مسار الصورة مساوية للقيمة المخزنة فى قاعدة البيانات
                taskImage.setAttribute("src", task.img_uri);

                //إضافة معرف فريد إلى عنصر الادخال
                taskInput.setAttribute('id', task.id);

                //إضافة حدث على زر تصدير المهمة كملف نصى
                exportBTN.addEventListener("click", function () {
                    ipcRenderer.send("create-txt", task.note);
                });

                //إضافة حدث على زر حذف المهمة
                deleteBTN.addEventListener('click', () => {
                    deleteImagedTask(task.id, task.img_uri);
                });

                //إضافة حدث على زر تحديث المهمة
                updateBTN.addEventListener('click', () => {
                    updateImagedTask(task.id, taskInput.value);
                });

                clearImagedBtn.addEventListener("click", function () {
                    //حذف الصورة من ملفات التطبيق ايضا عند حذف كل المهام
                    fs.unlink(task.img_uri, (err) => {
                        if (err) {
                            console.error(err)
                            return
                        }
                    });
                });

                //إرفاق عنصر الصورة إلى العنصر الحاوى
                imageHolder.appendChild(taskImage);

                //إرفاق زر حذف المهمة إلى العنصر الحاوى
                buttonsHolder.appendChild(deleteBTN);

                //إرفاق زر تحديث المهمة إلى العنصر الحاوى
                buttonsHolder.appendChild(updateBTN);

                //إرفاق زر تصدير المهمة إلى العنصر الحاوى
                buttonsHolder.appendChild(exportBTN);

                //إرفاق عنصر الادخال إلى العنصر الحاوى
                noteContentHolder.appendChild(taskInput);

                //إرفاق حاوى الازرار إلى العنصر الحاوى
                noteContentHolder.appendChild(buttonsHolder);

                //إرفاق العنصر الحاوى إلى القائمة
                listItem.appendChild(noteContentHolder);
                listItem.appendChild(imageHolder);

                //إرفاق عنصر القائمة إلى القائمة الخاصة بالمهام ذات صورة
                imagedList.appendChild(listItem)
            }
        }

    })
}


//استدعاء تابع اظهار المهام ذات صورة
showImaged();