function setRenderMode()
{
    var sortVal = -1;
    var radios = document.getElementsByName("render_mode");
    console.log("radios.length: " + radios.length);
    for (var i = 0; i < radios.length; ++i)
    {
        if (radios[i].checked)
        {
            sortVal = radios[i].value;
            break; 
        }
    }
    console.log("Setting render mode to " + sortVal);
    chrome.tabs.executeScript(null,
    {
      //code:"document.body.style.backgroundColor='red'"
      code:"setRenderMode("+sortVal+")"
    });
};

function feltronize()
{
    document.getElementById('status').innerHTML = "...";

/*    
    chrome.tabs.executeScript(null,
    {
      //code:"document.body.style.backgroundColor='red'"
      code:"analyzePage()"
    });    
*/    
    // TMP:
    // Re-add
    chrome.tabs.captureVisibleTab(null, {}, function (image) {
       // You can add that image HTML5 canvas, or Element.
       console.log("Captured image from tab");      
       console.log(image);
       
       chrome.tabs.executeScript(null,
       {
         //code:"document.body.style.backgroundColor='red'"
         code:"analyzePage(); handleImage(\""+image.toString()+"\")"
       }, function()
       {
           document.getElementById('status').innerHTML = "Feltronyzed!";
       });    
       
    });
}

function setup()
{
    document.getElementById('go_button').onclick = function(){ setRenderMode();feltronize();};
}

console.log("Logging from background");
//feltronize();
setup();

/*
chrome.extension.getBackgroundPage().console.log("Logging from background page");
*/