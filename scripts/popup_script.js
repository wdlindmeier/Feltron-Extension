function feltronize()
{
    document.getElementById('fe_go_button').innerHTML = "...";
    
    chrome.tabs.executeScript(null,
    {           
      code:"analyzePage();"
    }, function()
    {
        window.close();
    }); 
}

function setup()
{
    var button = document.getElementById('fe_go_button');
    button.onclick = function(){ feltronize(); };
    button.blur();
    document.body.focus();
}

setup();