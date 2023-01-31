const switchButton = document.querySelector("#darkmode-toggle");
const body = document.querySelector("body");
const navbar = document.querySelectorAll("nav ul li a");
const titles = document.querySelectorAll(".sub-title");
const me = document.querySelector(".me");
const tabs = document.querySelectorAll(".tab-titles p");
const service_area = document.querySelectorAll(".service-area");
const more = document.querySelectorAll(".more")
const layers = document.querySelectorAll(".layer")
const btn = document.querySelectorAll(".btn")
const form1 = document.querySelectorAll("form input")
const textarea = document.querySelector("textarea");

switchButton.addEventListener("click", () => {
    if (body.classList.contains("light-mode")) {    //change to dark mode
        body.classList.remove("light-mode");
        navbar.forEach(element => {
            element.style.color = "#fff";
        })
        document.getElementById("type").style.color = "#080808"
        titles.forEach(element => {
            element.style.color = "#fff";
        })
        me.style.color = "#fff"
        tabs.forEach(element => {
            element.style.color = "#fff";
        })
        service_area.forEach(element => {
            element.style.backgroundColor = "#262626";
        })
        more.forEach(element => {
            element.style.color = "#fff";
        })
        layers.forEach(element => {
            element.style.color = "#fff";
        })
        btn.forEach(element => {
            element.style.color = "#fff";
        })
        form1.forEach(element => {
            element.style.backgroundColor = "#262626";
        })
        textarea.style.backgroundColor = "#262626";
        
    } else {    //change to light mode
        body.classList.add("light-mode");
        navbar.forEach(element => {
            element.style.color = "#080808";
        })
        document.getElementById("type").style.color = "#fff"
        titles.forEach(element => {
            element.style.color = "#080808";
        })
        me.style.color = "#080808"
        tabs.forEach(element => {
            element.style.color = "#080808";
        })
        service_area.forEach(element => {
            element.style.backgroundColor = "#dadada";
        }) 
        more.forEach(element => {
            element.style.color = "#080808";
        })
        layers.forEach(element => {
            element.style.color = "#fff";
        })
        btn.forEach(element => {
            element.style.color = "#080808";
        })
        form1.forEach(element => {
            element.style.backgroundColor = "#dadada";
        })
        textarea.style.backgroundColor = "#dadada";
    }
})