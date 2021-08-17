// console.log("yaaaaaa")

async function getCountry(){


    // capture the drop down
    var selectVal = document.querySelector("#searchType").value;
    //  search string
    var searchStr = document.querySelector("#search").value;

    console.log(selectVal);
    if(selectVal == "all"){
        var response = await fetch("https://restcountries.eu/rest/v2/all");
        var data = await response.json();
        var html = "";
        for(var i = 0; i<data.length; i++){
            console.log(data[i].name)
            var htmlFrag = "<h2>" + data[i].name + "</h2>";
            html+=htmlFrag;
        }
        console.log(html);
        document.querySelector(".results").innerHTML = html;
    } else if(selectVal=="country"){
        var response = await fetch("https://restcountries.eu/rest/v2/name/"+ searchStr);
        var data = await response.json();
        console.log(data);
        var html = "";
        for(var i = 0; i<data.length; i++){
            console.log(data[i].name)
            var htmlFrag = "<h2>" + data[i].name + "</h2>" + "<h3>" + data[i].region + "</h3>";

            html+=htmlFrag;
        }
        console.log(html);
        document.querySelector(".results").innerHTML = html;
    }
//https://restcountries.eu/rest/v2/name/{name}
} 