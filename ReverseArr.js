



function reverse(arr){
    var temp;
    for(var i = 0; i<arr.length; i++){
        temp = arr[i]
        arr[i] = arr[lastElem - 1];
        arr[lastElem - 1] = temp;

    }
}
var myArr = ["a", "b", "c", "d", "e"]
console.log(reverse(myArr))
console.log(myArr)
