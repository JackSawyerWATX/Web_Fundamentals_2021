<!DOCTYPE html>
<html lang='en'>
<head>
    <title>Fausset & Sons Oil Company Title</title>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0, user-scalable=no' />
    <meta name="theme-color" content="#00b303" />
    <meta name="navigation-bar-button-color" content="#ffffff" />
    <meta name="navigation-bar-button-border-color" content="#000000" />
    <meta name="navigation-bar-button-hasshadow" content="false" />
    <script src='https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.5.1.min.js'></script>
    <style>
        body {
            font-family: Verdana, sans-serif;
            font-size: 0.8em;
            margin: 0px;
        }

        a {
            cursor: pointer;
            color: steelblue;
        }

        nav ul li {
            display: inline;
            padding: 5px;
        }

        a:hover {
            color: red;
            text-decoration: underline;
        }

        nav, section, article {
            margin: 5px;
            padding: 8px;
        }

        header {
            background-color: #00b303;
        }

        #headerDescription {
            margin: 5px;
            padding: 8px;
            ;
            margin-top: 0;
            color: white;
        }

        #content {
            margin-left: 5px;
            margin-right: 5px;
            text-align: justify;
        }
    </style>
</head>
<body>
    <header>
        <h1 id='headerDescription'></h1>
    </header>
    <nav>
        <ul>
            <li><a id='ahome'>Home Page</a></li>
            <li><a id='acontact'>Contact</a></li>
            <li><a id='aabout'>About</a></li>
        </ul>
    </nav>
    <section>
        <article id='content'></article>
    </section>
    <footer></footer>

    <script>
$(document).ready(function(){
function homePage(){
    var pagecontent="Welcome to the F&S Oil Company home page. Call or come visit us when you need: <ul><li>Basic Auto Maintenance</li> <li>Bulk Oil & Gas deliveries to your farm or Rural Businesses</li> <li>On-Site Help with Tractor Maintenance</li></ul> With 50 years of experience, and all the right tools and knowledge, we can deliver up to 1,500 gallons of unleaded gasoline wherever you need it, as well as replace tires on any and all your farm equipment, wherever you need it!<br/><br/><strong>Note:</strong><br> Any time you need a simple fill up, oil change, or new tires on your automobile, stop by and see us at the SouthWest corner of Main and Highway 15.";
$('#content').html(pagecontent).fadeOut('fast').fadeIn('fast');
$('#headerDescription').text('Fausset & Sons Oil Company');
$('#content').css({'left':'1000px','position':'fixed'}).animate({left:'5px'});
$('#content').css({'position':'relative'});
}
$('#ahome').click(function (){
homePage();
});
$('#acontact').click(function(){
var pagecontent="If you have any question please call us at (806) 658-4298 or visit our website at <a href='https://fandsoil.com/contact' target='_blank'>https://fandsoil.com/contact</a>";
$('#content').html(pagecontent).fadeOut('fast').fadeIn('fast');
$('#headerDescription').text('Contact Page');
$('#content').css({'left':'1000px','position':'fixed'}).animate({left:'5px'});
$('#content').css({'position':'relative'});
});
$('#aabout').click(function(){
var pagecontent="This is a basic about page app, this sample has been created in order to demostrate a JavaScript single page application, please change all content and add your own, thank you for using JavaScript Studio.";
$('#content').html(pagecontent).fadeOut('fast').fadeIn('fast');
 $('#headerDescription').text('About Page');
$('#content').css({'left':'1000px','position':'fixed'}).animate({left:'5px'});
$('#content').css({'position':'relative'});
});
document.onload=homePage();
});
    </script>

</body>
</html>