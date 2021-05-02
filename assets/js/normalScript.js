const { ipcRenderer } = require("electron");
const form = document.querySelector("form");

form.addEventListener("submit", function (e) {
    e.preventDefault();
    const input = document.querySelector("#task").value;
    ipcRenderer.send("add-normal-task", input);
});