var chips = "tortilla"
var cheese = "ricos"
var meat = "steak"
var topping1 = "jalapenos"
var topping2 = "tomatoes"
var topping3 = "onions"
var topping4 = "sour cream"
var topping5 = "guacamole"
var topping6 = "cilantro"
var topping7 = "lime"

//the JS objects
//keyword var and a name

var VincentNachos = {
    "chips" : "tortilla chips"
    "cheese" : "cheddar"
    "meat" : "bacon"
    "toppings" : ["sour cream", "salsa", "beans", "guac"]
    
    "nachoInfo" : function(){
        console.log("wahtever")
    },

    "foodInfo" : function(){
        console.log("chips: " + this.chips);
        console.log("cheese: " + this.cheese);
        console.log("meat: " + this.meat);
        for(var i = 0; i<this.toppings.length; i++){
            console.log("topping " + (i+1) + ": " + this.toppings[i])
}

var JimNachos = {



}


var today = new Date()
console.log(today)