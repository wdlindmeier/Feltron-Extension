//------------------DOC READY-------------------//

function log(msg)
{
    console.log(msg);
}

var COLORS = 
[
    // Black / White 
    /*
    { 
        background : "#ffffff", 
        text : "#000000", 
        page_tag : "#000000",
        headers : "#000000",  
        headers_condensed : "#000000",
        highlight : "#00ffff", 
        graph_node : "rgba(50,50,50,1)", 
        graph_label : "#dd4444", 
        graph_stroke : "rgba(50,50,50,0.5)",
    },
    */
    
    // Yellow / Purple
    { 
        background : "#ffea49", 
        text : "#210026", 
        page_tag : "#210026",        
        headers : "#210026",  
        headers_condensed : "#ffffff",  
        highlight : "#ffffff", 
        graph_node : "#ffffff", 
        graph_label : "#210026", 
        graph_stroke : "rgba(50,50,50,0.5)"
    },
    
    // Lavender 
    { 
        background : "#d9acd2", 
        text : "#ffffff", 
        page_tag : "#5d5370",        
        headers : "#ffffff",  
        headers_condensed : "#5d5370",  
        highlight : "#ffffff", 
        graph_node : "#5d5370", 
        graph_label : "#ffffff", 
        graph_stroke : "rgba(50,50,50,0.5)" },
    
    // Salmon
    { 
        background : "#fb8876", 
        text : "#5d5370", 
        page_tag : "#5d5370",        
        headers : "#5d5370",  
        headers_condensed : "#ffffff",  
        highlight : "#ffffff", 
        graph_node : "#5d5370", 
        graph_label : "#ffffff", 
        graph_stroke : "rgba(50,50,50,0.5)" 
    },
    
    // Teal
    { 
        background : "#83d5d2", 
        text : "#5d5370", 
        page_tag : "#5d5370",        
        headers : "#5d5370",  
        headers_condensed : "#ffffff",  
        highlight : "#ffffff", 
        graph_node : "#5d5370", 
        graph_label : "#ffffff", 
        graph_stroke : "rgba(50,50,50,0.5)" 
    },
];

var $ColorScheme = COLORS[Math.floor(Math.random() * COLORS.length)];

var $TimeLoaded = new Date();
var $TimerClock = null;
var $TimerDraw = null;

var $NumUniqueWords = 0;
var $NumUniqueTags = 0;
var $NumJavascriptFiles = 0;
var $NumCookies = 0;
var $NumCSSFiles = 0;
var $NumUniqueDomains = 0;

var $SortedPageWords = null;
var $SortedPageTags = null;
var $SortedLinkDomains = null;

var $LinkDomainCounts = null;

var $PageTagCounts = null;

var $JavaScriptFilenames = [];
var $CSSFilenames = [];
var $CookieValues = {};

var $StopWords = ["a", "able", "about", "across", "after", "all", "almost", "also", "am", "among", "an", "and", "any", "are", "as", "at", "be", "because", "been", "but", "by", "can", "cannot", "could", "dear", "did", "do", "does", "either", "else", "ever", "every", "for", "from", "get", "got", "had", "has", "have", "he", "her", "hers", "him", "his", "how", "however", "i", "if", "in", "into", "is", "it", "its", "just", "least", "let", "like", "likely", "may", "me", "might", "most", "must", "my", "neither", "no", "nor", "not", "of", "off", "often", "on", "only", "or", "other", "our", "own", "rather", "said", "say", "says", "she", "should", "since", "so", "some", "than", "that", "the", "their", "them", "then", "there", "these", "they", "this", "tis", "to", "too", "twas", "us", "wants", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "would", "yet", "you", "your"];

var $NumInterestingWords = 25;
var $InterestingWords = [];

var $IgnoreContentTags = ["STYLE", "SCRIPT", "EMBED", "IFRAME", "NOSCRIPT", "HEAD", "HTML", "BODY"];

var $PageTitle = "";
var $PageDomain = "";

var $PopoverHTML = "";

var $GraphNodes = [];
var $GraphMarginRight = 300;

// Scratch containers for recursive function
var linkDomains = [];
var pageTagCounts = {};
var pageTags = [];
var pageWordCounts = {};
var pageWords = [];

function mineTag(parentTag)
{
    parentTag.each(function()
    {
        // Tag
        var tagName = this.tagName;
        var tagCount = pageTagCounts[tagName];
        if (!tagCount)
        {
            pageTags.push(tagName);
            tagCount = 0;
        }
        pageTagCounts[tagName] = tagCount + 1;
        
        if (tagName == "A")
        {
            // Get the domain
            var link = this.href.toLowerCase();
            if (link.indexOf("http") != -1)
            {
                var domain = link.split("/")[2].replace("www.", ""); // (http:)/()/(www.google.com)/q
                var domainCount = $LinkDomainCounts[domain];
                if (!domainCount)
                {
                    linkDomains.push(domain);
                    domainCount = 0;
                }
                $LinkDomainCounts[domain] = domainCount + 1;
            }            
        }
        else if (tagName == "SCRIPT")
        {
            if (this.src)
            {
                var components = this.src.split('/');
                var fn = components[components.length - 1].replace(/\?.*/, "");
                if ($JavaScriptFilenames.indexOf(fn) == -1)
                {
                    $NumJavascriptFiles += 1;
                    $JavaScriptFilenames.push(fn);
                }
            }
        }
        else if (tagName == "LINK") 
        {
            if (this.rel && 
                this.rel.toLowerCase().trim() == "stylesheet" &&
                this.href)
            {
                var components = this.href.split('/');
                var fn = components[components.length - 1].replace(/\?.*/, "");
                if ($CSSFilenames.indexOf(fn) == -1)
                {
                    $NumCSSFiles += 1;
                    $CSSFilenames.push(fn);                    
                }
            }            
        }

        // Content
        if ($IgnoreContentTags.indexOf(tagName) == -1)
        {
            var innerText = $(this).text().replace(/\W+/g, " ").replace("\s+", ' ').trim();
            var words = innerText.split(/\s+/);
            for (var i = 0; i < words.length; ++i)
            {
                var word = words[i].toLowerCase();
                if (word && word != "")
                {
                    var wordCount = pageWordCounts[word];
                    if (!wordCount)
                    {
                        pageWords.push(word);
                        wordCount = 0;
                    }
                    pageWordCounts[word] = wordCount + 1;
                }
            }
        }
    
        $(this).children().each(function() 
        {
            mineTag($(this));
        }); 
    });
}

function clearScratch()
{
    linkDomains = [];
    pageTagCounts = {};
    pageTags = [];
    pageWordCounts = {};
    pageWords = [];   
}

function reset()
{
    clearScratch();

    $NumUniqueWords = 0;
    $NumUniqueTags = 0;
    $NumCookies = 0;    
    $NumJavascriptFiles = 0;
    $NumCSSFiles = 0;
    $NumUniqueDomains = 0;
    $SortedPageWords = null;
    $SortedPageTags = null;
    $SortedLinkDomains = null;
    $LinkDomainCounts = null;
    $PageTagCounts = null;
    $JavaScriptFilenames = [];
    $CSSFilenames = [];
    $InterestingWords = [];
    $PageTitle = "";
    $PageDomain = "";
    $PopoverHTML = "";
    $NumJavascriptFiles = 0;
    $NumCSSFiles = 0;
    $JavaScriptFilenames = [];
    $CSSFilenames = [];
    $PopoverHTML = "";
    $LinkDomainCounts = {};        
    $GraphNodes = [];
    $CookieValues = {};

    $ColorScheme = COLORS[Math.floor(Math.random() * COLORS.length)];

    clearInterval($TimerClock);    
    clearInterval($TimerDraw);    
}

function parseCookies()
{
    $CookieValues = {};
    $NumCookies = 0;
    if (document.cookie && document.cookie != "")
    {
        var pairs = document.cookie.split(";");
        for (var i=0; i<pairs.length; i++)
        {
          $NumCookies++;
          var pair = pairs[i].split("=");
          $CookieValues[pair[0]] = unescape(pair[1]);
        }  
    }
}

function analyzePage()
{
    closeFeltron();

    pickStyle();
    
    mineTag($("*"));
    
    parseCookies();

    // Tags
    pageTags.sort(function(a,b)
    {
       if(pageTagCounts[a] < pageTagCounts[b])
       {
           return 1;
       }
       else if(pageTagCounts[a] > pageTagCounts[b])
       {
           return -1;
       }
       return 0;
    });
    
    $PageTagCounts = pageTagCounts;
    $NumUniqueTags = pageTags.length;
    $SortedPageTags = pageTags;

    // Links
    linkDomains.sort(function(a,b)
    {
       if($LinkDomainCounts[a] < $LinkDomainCounts[b])
       {
           return 1;
       }
       else if($LinkDomainCounts[a] > $LinkDomainCounts[b])
       {
           return -1;
       }
       return 0;
    });
    
    $NumUniqueDomains = linkDomains.length;
    $SortedLinkDomains = linkDomains;

    // Words
    pageWords.sort(function(a,b)
    {
       if(pageWordCounts[a] < pageWordCounts[b])
       {
           return 1;
       }
       else if(pageWordCounts[a] > pageWordCounts[b])
       {
           return -1;
       }
       return 0;
    });
    
    $SortedPageWords = pageWords;
    $NumUniqueWords = pageWords.length;
    
    for (var i = 0; i < $NumUniqueWords; i++)
    {
        var word = $SortedPageWords[i];
        if ($StopWords.indexOf(word) == -1)
        {
            if (word.length >= 3)
            {   
                $InterestingWords.push(word)                
                if ($InterestingWords.length >= $NumInterestingWords)
                {
                    break;
                }
            }
        }
    }
    
    clearScratch();
    
    var $PageTitle = document.title || "Untitled";
    var $PageDomain = window.location.host.replace("www.", "");
    
    $PopoverHTML = '<div id="feltron_ext"><button id="fe_close_button">Close</button>';
    
    //log("Page Title: " + $PageTitle);
    $PopoverHTML += "<header>";
    $PopoverHTML += "<p>Where are you?</p>";
    $PopoverHTML += '<h1>' + $PageTitle + '</h1>';
    //log("Page Domain: " + $PageDomain);
    $PopoverHTML += '<h2>' + $PageDomain + '</h2>';
    $PopoverHTML += "</header>";


    $PopoverHTML += '<div id="fe_graph"> <h3>Links</h3> <canvas id="fe_links_canvas" width="2200" height="600"></canvas></div>';
    
    $PopoverHTML += '<ul id="fe_details">';

    // Col 1: Words
    $PopoverHTML += '<li>';
    $PopoverHTML += '<div class="datapoint"><h3>unique words</h3><h3 class="condensed">' + convertNum($NumUniqueWords) + ' </h3></div>';
    $PopoverHTML += '<div class="datapoint">';
    $PopoverHTML += '<h3>interesting words</h3>';
    $PopoverHTML += '<p>' + $InterestingWords.join(", ") + '</p></div>';     
    $PopoverHTML += '<div class="datapoint"><h3>Time on page</h3><div id="fe_clock">:00</div></div>';        
    
    $PopoverHTML += '<div class="datapoint"><h3>plaid-o-meter</h3>';        
    $PopoverHTML += '<canvas width="400" height="160" id="fe_plaid_canvas"></canvas>';
    $PopoverHTML += '</div>';
    
    $PopoverHTML += '</li>';
    
    // Col 2: Tags
    $PopoverHTML += '<li><div class="datapoint bargraph"><h3>html tags</h3><h3 class="condensed">'+convertNum($NumUniqueTags)+'</h3>';
    //log("Num unique tags: " + convertNum($NumUniqueTags));
    //log("Sorted Tags: ");
    //log($SortedPageTags);
    var maxTagCount = $PageTagCounts[$SortedPageTags[0]];
    var tagList = $SortedPageTags.map(function(tag){ 
        var amtPageTag = $PageTagCounts[tag] / maxTagCount;
        return "<div class='fe_pageTag' style='width:"+(amtPageTag*100)+"%\'><span class='count'>(" +$PageTagCounts[tag]+ ")</span> &lt;" + tag + "&gt;</div>"; 
    }).join("");
    $PopoverHTML += '<p>' + tagList + '</p>'; 
    $PopoverHTML += '</div></li>';
    
    // Col 3: Domains
    $PopoverHTML += '<li><div class="datapoint"><h3>domains</h3><h3 class="condensed">'+convertNum($NumUniqueDomains)+'</h3>';
    //log("Num unique domains: " + convertNum($NumUniqueDomains));
    //log("Sorted Domains: ");
    //log($SortedLinkDomains);
    $PopoverHTML += '<p>' + $SortedLinkDomains.join(", ") + '</p></div>';     
    $PopoverHTML += '</li>';
    
    // Col 4: CSS, JS, Cookies
    $PopoverHTML += '<li>';
    $PopoverHTML += '<div class="datapoint"><h3>cookies</h3><h3 class="condensed">'+ convertNum($NumCookies) +'</h3>';
    $PopoverHTML += '<p>';
    for (var cookieName in $CookieValues)
    {
        $PopoverHTML += cookieName + " : " + $CookieValues[cookieName] + "<br/>";
    }
    $PopoverHTML += '</p>';
    $PopoverHTML += '</div>';
    
    $PopoverHTML += '<div class="datapoint"><h3>javascript files</h3><h3 class="condensed">'+convertNum($NumJavascriptFiles)+'</h3>';
    $PopoverHTML += '<p>' + $JavaScriptFilenames.join("<br/>") + '</p></div>';     
    
    $PopoverHTML += '<div class="datapoint"><h3>css files</h3><h3 class="condensed">'+ convertNum($NumCSSFiles) +'</h3>';
    $PopoverHTML += '<p>' + $CSSFilenames.join("<br/>") + '</p>';         
    $PopoverHTML += '</div>';
    $PopoverHTML += '</li>';
    $PopoverHTML += '</ul>';
    
    $PopoverHTML += '</div>'; // fe_details
    $PopoverHTML += "</div>"; // feltron_ext
    
    document.body.innerHTML += $PopoverHTML;
    
    document.getElementById('fe_close_button').onclick = function(){ closeFeltron(); };
    
    drawPlaid();
    
    createGraphData();
    
    $TimerDraw = setInterval(function(){
        drawGraph();
    }, 50);
    
    $TimerClock = setInterval(function(){
        updateTimer();
    }, 1000);
}

function closeFeltron()
{
    reset();
    var overlay = document.getElementById('feltron_ext');
    if (overlay)
    {
        overlay.parentNode.removeChild(overlay);    
    }
}

function createGraphData()
{
    var canvas = document.getElementById("fe_links_canvas");
    var canvasWidth = $(canvas).width() * 2;
    var canvasHeight = $(canvas).height() * 2;
    
    var minCount = 99999;
    var maxCount = 20; // Set a default max
    for (var key in $LinkDomainCounts)
    {
        var count = $LinkDomainCounts[key];
        if (minCount > count)
        {
            minCount = count;
        }
        if (maxCount < count)
        {
            maxCount = count;
        }
    }
    
    var numDomain = $SortedLinkDomains.length;
    for (var i = 0; i < numDomain; ++i)
    {
        var node = {};
        node.domain = $SortedLinkDomains[i];
        // TODO: Normalize the sizes w/ max, min
        var linkCount = $LinkDomainCounts[node.domain];
        var scalarSize = (linkCount - minCount) / (maxCount - minCount);        
        node.radius = 6 + (100 * scalarSize);
        node.color = $ColorScheme['graph_node']; //"rgba(50,50,50,1)";
        node.posX = node.radius + (Math.random() * (canvasWidth - $GraphMarginRight - (node.radius * 2)));
        node.posY = node.radius + (Math.random() * (canvasHeight - (node.radius * 2)));
        
        node.vecX = (Math.random() - 0.5) * 3;
        node.vecY = (Math.random() - 0.5) * 3;
        
        $GraphNodes.push(node);
    }
    // console.log("$GraphNodes.length " + $GraphNodes.length);
}

function drawPlaid()
{
    var canvas = document.getElementById("fe_plaid_canvas");
    var context = canvas.getContext("2d");
    var canvasWidth = $(canvas).width() * 2;
    var canvasHeight = $(canvas).height() * 2;  
    context.fillStyle = $ColorScheme['background'];
    context.fillRect(0,0,canvasWidth,canvasHeight);    
    
    // Divide the canvas into 12
    // Plot arbitrary values between 0-1
    // Cross hatch
    var numValues = 12 + 2;
    var unitWidth = canvasWidth / numValues;
    var radius = 4;
    var prevHeight = 0;
    
    var values = [[0,canvasHeight]];
    
    for (var i = 1; i < numValues; ++i)
    {
      var randHeight = Math.random() * canvasHeight;
      // Smooth
      randHeight = (randHeight * 0.5) + (prevHeight * 0.5);
      prevHeight = randHeight;

      var x = unitWidth * i;
      var y = canvasHeight - randHeight;
      
      values.push([x,y]);
    }
    
    values.push([canvasWidth, canvasHeight]);

    // Draw graph fill
    context.fillStyle = $ColorScheme['headers'];
    var prevPos = null;
    for (var i = 0; i < values.length; ++i)
    {
      var pos = values[i];
      if (prevPos)
      {
        context.beginPath();
        context.moveTo(prevPos[0], prevPos[1]); // give the (x,y) coordinates
        context.lineTo(pos[0]+1, pos[1]);
        context.lineTo(pos[0]+1, canvasHeight);
        context.lineTo(prevPos[0], canvasHeight);
        context.fill();
        context.closePath();
      }
      prevPos = pos;
    }    
    
    // Draw graph lines
    context.strokeStyle = $ColorScheme['background'];
    var prevPos = null;
    for (var i = 1; i < values.length - 1; ++i)
    {
      var pos = values[i];
      if (prevPos)
      {
        context.beginPath();        
        context.moveTo(prevPos[0], canvasHeight); // give the (x,y) coordinates
        context.lineTo(pos[0], pos[1]);
        context.stroke();
        context.closePath();
        
        context.beginPath();        
        context.moveTo(prevPos[0], prevPos[1]); // give the (x,y) coordinates
        context.lineTo(pos[0], canvasHeight);
        context.stroke();
        context.closePath();
      }
      prevPos = pos;
    } 
    
    // Draw graph points
    context.fillStyle = $ColorScheme['headers_condensed'];
    for (var i = 1; i < values.length - 1; ++i)
    {
        var pos = values[i];
        context.beginPath();
        context.arc(pos[0], pos[1], radius, 0, Math.PI*2, true); 
        context.closePath();
        context.fill();      
    }        
}

function drawGraph()
{
    var canvas = document.getElementById("fe_links_canvas");
    var context = canvas.getContext("2d");
    var canvasWidth = $(canvas).width() * 2;
    var canvasHeight = $(canvas).height() * 2;
    
    // Background color
    context.fillStyle = $ColorScheme['background'];
    context.fillRect(0,0,canvasWidth,canvasHeight);

    var numDomain = $GraphNodes.length;
    var xInterval = canvasWidth / numDomain;
    var yInterval = canvasHeight / numDomain;
    
    // Position the nodes
    for (var i = 0; i < numDomain; ++i)
    {
        var node = $GraphNodes[i];        
        var x = node.posX;
        var y = node.posY;

        node.posX += node.vecX;
        node.posY += node.vecY;
        if (node.posX < node.radius || node.posX > (canvasWidth - $GraphMarginRight - node.radius))
        {
            node.vecX = node.vecX * -1;
        }
        if (node.posY < node.radius || node.posY > (canvasHeight - node.radius))
        {
            node.vecY = node.vecY * -1;
        }
    }
    
    // Draw the lines
    
    var prevX = 0;
    var prevY = 0;
    var firstX = 0;
    var firstY = 0;
    
    //context.fillStyle = 'rgba(150,150,150,0.5)';
    context.strokeStyle = $ColorScheme['graph_stroke'];//'rgba(50,50,50,0.5)';
    
    for (var i = 0; i < numDomain; ++i)
    {
        var node = $GraphNodes[i];        
        var x = node.posX;
        var y = node.posY;
                
        if (!(prevX == 0 && prevY == 0))
        {
            context.beginPath();
            context.moveTo(prevX, prevY);
            context.lineTo(x, y);
            context.stroke();
        }
        else 
        {
            firstX = x;
            firstY = y;
        }
        
        prevX = x;
        prevY = y;                    
    }

    // Draw the last line    
    context.beginPath();
    context.moveTo(prevX, prevY);
    context.lineTo(firstX, firstY);
    context.stroke();
    
    // Draw the nodes
    for (var i = 0; i < numDomain; ++i)
    {
        var node = $GraphNodes[i];        
        var x = node.posX;
        var y = node.posY;
                
        var radius = node['radius'];
        context.fillStyle = node.color;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI*2, true); 
        context.closePath();
        context.fill();
        
    }
        
    // Draw the names
    for (var i = 0; i < numDomain; ++i)
    {
        var node = $GraphNodes[i];        
        var x = node.posX;
        var y = node.posY;                
    	context.font = 'normal 400 24px/2 Georgia, sans-serif';
        context.fillStyle = $ColorScheme['graph_label']; //'#dd4444';
    	context.fillText(node['domain'], x + 8, y + 6);     
    }
                    
}

function updateTimer()
{
    var secLoaded = (new Date() - $TimeLoaded) / 1000.0;
    var minutes = Math.floor(secLoaded / 60);
    var outp = "";
    if (minutes > 0)
    {
        secLoaded -= (minutes * 60);
        outp += minutes;
        //outp += " minutes "
    } 
    outp += ":";
    if (secLoaded < 10)
    {
        outp += "0";
    }
    outp += Math.floor(secLoaded);
    //outp += " seconds";
    $('#fe_clock')[0].innerHTML = outp;
}

function addExternalCSS()
{
    var cssId = 'feltronCss';  // you could encode the css path itself to generate id..
    if (!document.getElementById(cssId))
    {
        var head  = document.getElementsByTagName('head')[0];
        var link  = document.createElement('link');
        link.id   = cssId;
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = 'feltron.css';
        link.media = 'all';
        head.appendChild(link);
    }    
}

function appendStyles(styleContent, styleID)
{
    var prevStyle = document.getElementById(styleID);
    if (prevStyle)
    {
        prevStyle.parentNode.removeChild(prevStyle);
    }
    var styleNode           = document.createElement("style");
    styleNode.type          = "text/css";
    styleNode.id            = styleID;
    styleNode.textContent   = styleContent;
    document.head.appendChild (styleNode);
}

function convertNum(inp, end)
{
    // Only spell out short words
    if ((inp > 20 && inp % 10 != 0) || inp > 100)
    {
        return inp;
    }
    
    var str='';
    inp = inp + "";
    var NUMBER2TEXT = {
        ones: ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'],
        tens: ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
        sep: ['', ' thousand', ' million', ' billion', ' trillion', ' quadrillion', ' quintillion', ' sextillion']
    };
    (function( ones, tens, sep ) {
       var vals = inp.split("."),val,pos,postsep=' ';
       for (p in vals){
          val = vals[p], arr = [], str = '', i = 0;
          if ( val.length === 0 ) {return 'No value';}
          val = parseInt( (p==1 && val.length===1 )?val*10:val, 10 );
          if ( isNaN( val ) || p>=2) {return 'Invalid value'; }
          while ( val ) {
            arr.push( val % 1000 );
            val = parseInt( val / 1000, 10 );   
          }
          pos = arr.length;
          function trimx (strx) 
          {
              return strx.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
          }
          while ( arr.length  ) {
            str = (function( a ) {
                var x = Math.floor( a / 100 ),
                    y = Math.floor( a / 10 ) % 10,
                    z = a % 10;
                    postsep = (arr.length != 0)?', ' : ' ' ;
                    if ((x+y+z) === 0){
                        postsep = ' '
                    }else{ 
                        if (arr.length == pos-1 && x===0 && pos > 1 ){
                            postsep = ' and ' 
                        } 
                    }                    
                   //str3.push([trimx(str)+"",trimx(sep[i])+""]);
                    return  (postsep)+( x > 0 ? ones[x] + ' hundred ' + (( x == 0 && y >= 0 || z >0 )?' and ':' ') : ' ' ) +                  
                       ( y >= 2 ? tens[y] + ((z===0)?' ':'-') + ones[z] : ones[10*y + z] ); 
            })( arr.shift() );
          }
       }
    })( NUMBER2TEXT.ones , NUMBER2TEXT.tens , NUMBER2TEXT.sep );
    if (!str || str == "")
    {
        str = "zero";
    }
    return str;
}

function pickStyle()
{
    var colorStyle = " \
#feltron_ext \
{ \
    background-color:"+$ColorScheme['background']+" !important; \
    color:"+$ColorScheme['text']+" !important; \
} \
    #feltron_ext h2, #feltron_ext h3, #feltron_ext h4, #feltron_ext h5, #feltron_ext h6 \
{ \
    color:"+$ColorScheme['headers']+" !important; \
} \
    #feltron_ext h1, #fe_clock, #feltron_ext h1.condensed, #feltron_ext h2.condensed, #feltron_ext h3.condensed, #feltron_ext h4.condensed, #feltron_ext h5.condensed, #feltron_ext h6.condensed \
{ \
    color:"+$ColorScheme['headers_condensed']+" !important; \
} \
    #feltron_ext .highlight, #feltron_ext .fe_pageTag \
{ \
    background-color:"+$ColorScheme['highlight']+" !important; \
} \
    #feltron_ext .fe_pageTag \
{ \
    color:"+$ColorScheme['page_tag']+" !important; \
} \
";
    appendStyles(colorStyle, 'fe_color_scheme');
}

$("document").ready(function()
{
    log("Feltron Loaded");    
});