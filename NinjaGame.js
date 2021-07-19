<script type="text/javascript">
var leftValue = 450, topValue = 100;
function update(){
    document.getElementById("character").style.left = leftValue+"px";
    document.getElementById("character").style.top = topValue+"px";
}
document.onkeydown = function(e) {
    console.log('e: ', e); 
    console.log('e.keyCode: ', e.keyCode);
    if (e.keyCode == 37) { // LEFT
        leftValue = leftValue - 10;
    }
    else if (e.keyCode == 39) { // RIGHT
        leftValue = leftValue + 10;         
    }
    else if (e.keyCode == 40) { // DOWN
        topValue = topValue + 10;
    }
    // ...
    
    update();
}
</script>

