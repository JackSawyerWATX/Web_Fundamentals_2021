console.log("i did it")

function countLikes() {
    var likes = document.querySelector("#likeCounter");
    var count = likes.innerHTML;
    count = parseInt(count);
    count++
    console.log(count);
    likes.innerHTML = count;
}

function hide(element) {
    element.remove()
}

function myAlert(){
    alert('This page says Ninja was liked')
}

function loginNLogout(element) {

    if (element.innerText == "Login") {
        element.innerText = "Logout"
    }
    else {
        element.innerText = "Login"
    }
}
