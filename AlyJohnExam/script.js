
// THIS IS MY FUNCTION FOR MY ALERT BOX TO THE BROWSER
function emptyCart() {
    alert("Your Cart Is Empty!");
}

// THIS IS STORING AN ELEMENT FROM MY HTML PAGE INTO A VARIABLE FOR EASY ACCESS
var cookieDiv = document.querySelector(".cookie-policy")

// THIS IS MY FUNCTION TO REMOVE THE COOKIE POLICY FROM MY PAGE
function accept() {
    cookieDiv.remove();
}
