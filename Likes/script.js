console.log("Hey! What's the deal?")

var count=0;
function countLike() {
    var like = document.querySelector("#likeCounter");
    console.log (like.innerText);
    count++;
    console.log (count)
    like.innerText=count;
}