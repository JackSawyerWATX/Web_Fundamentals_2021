function hide(element) {
    element.remove()
}

var count1 = 1;
var btn1 = document.querySelector("#count1");

function add1(){
    count1++;
    btn1.innerText = count1 + " Pet(s)"
}

var count2 = 1;
var btn2 = document.querySelector("#count2");

function add2(){
    count2++;
    btn2.innerText = count2 + " Pet(s)"
}

var count3 = 1;
var btn3 = document.querySelector("#count3");

function add3(){
    count3++;
    btn3.innerText = count3 + " Pet(s)"
}

function selector() {
    if(value=="Dog")
        alert("You have selected a Dog");
    if(value=="Cat")
        alert("You have selected a Cat");
    }