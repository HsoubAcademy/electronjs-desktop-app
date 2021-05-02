/*السكربت الخاص بصفحة الحصول على المهمة ذات التوقيت المحدد */

const { ipcRenderer } = require("electron");
const form = document.querySelector("form");


form.addEventListener("submit", function (e) {
    e.preventDefault();
    //متغير للحصول على قيمة المهمة
    let note = document.querySelector(".note").value;
    //milliseconds متغير للحصول على قيمة الساعات المدخلة من قبل المستخدم بعد تحويلها الى
    let pickedHours = document.querySelector(".pick-hours").value * 3600000;
    //milliseconds متغير للحصول على قيمة الدقائق المدخلة من قبل المستخدم بعد تحويلها الى
    let pickedMinutes = document.querySelector(".pick-minutes").value * 60000;
    //متغير للحصول على التوقيت الحالى
    let notificationTime = Date.now();
    //نضيف على التوقيت الحالى عدد الساعات والدقائق 
    notificationTime += (pickedHours + pickedMinutes);
    //notificationTime نقوم بإسناد التوقيت الجديد الى المتغير 
    notificationTime = new Date(notificationTime);
    
    ipcRenderer.send("add-timed-note", note, notificationTime);
});