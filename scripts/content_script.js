//------------------DOC READY-------------------//

function log(msg)
{
    console.log(msg);
    //chrome.extension.getBackgroundPage().console.log(msg);
}

var $TimeLoaded = new Date();
var $TimerClock = null;

var $NumUniqueWords = 0;
var $NumUniqueTags = 0;
var $NumJavascriptFiles = 0;
var $NumCSSFiles = 0;
var $NumUniqueDomains = 0;

var $SortedPageWords = null;
var $SortedPageTags = null;
var $SortedLinkDomains = null;

var $PageTagCounts = null;

var $JavaScriptFilenames = [];
var $CSSFilenames = [];

var $StopWords = ["a", "able", "about", "across", "after", "all", "almost", "also", "am", "among", "an", "and", "any", "are", "as", "at", "be", "because", "been", "but", "by", "can", "cannot", "could", "dear", "did", "do", "does", "either", "else", "ever", "every", "for", "from", "get", "got", "had", "has", "have", "he", "her", "hers", "him", "his", "how", "however", "i", "if", "in", "into", "is", "it", "its", "just", "least", "let", "like", "likely", "may", "me", "might", "most", "must", "my", "neither", "no", "nor", "not", "of", "off", "often", "on", "only", "or", "other", "our", "own", "rather", "said", "say", "says", "she", "should", "since", "so", "some", "than", "that", "the", "their", "them", "then", "there", "these", "they", "this", "tis", "to", "too", "twas", "us", "wants", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "would", "yet", "you", "your"];

var $NumInterestingWords = 25;
var $InterestingWords = [];

var $IgnoreContentTags = ["STYLE", "SCRIPT", "EMBED", "IFRAME", "NOSCRIPT"];

var $PageTitle = "";
var $PageDomain = "";

var $PopoverHTML = "";

// Scratch containers for recursive function
var linkDomainCounts = {};
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
                var domainCount = linkDomainCounts[domain];
                if (!domainCount)
                {
                    linkDomains.push(domain);
                    domainCount = 0;
                }
                linkDomainCounts[domain] = domainCount + 1;
            }            
        }
        else if (tagName == "SCRIPT")
        {
            if (this.src)
            {
                $NumJavascriptFiles += 1;
                var components = this.src.split('/');
                var fn = components[components.length - 1].replace(/\?.*/, "");
                if ($JavaScriptFilenames.indexOf(fn) == -1)
                {
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
                $NumCSSFiles += 1;
                var components = this.href.split('/');
                var fn = components[components.length - 1].replace(/\?.*/, "");
                if ($CSSFilenames.indexOf(fn) == -1)
                {
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
    linkDomainCounts = {};
    linkDomains = [];
    pageTagCounts = {};
    pageTags = [];
    pageWordCounts = {};
    pageWords = [];   
}

function analyzePage()
{
    clearScratch();
    
    clearInterval($TimerClock);    
    
    $NumJavascriptFiles = 0;
    $NumCSSFiles = 0;
    $JavaScriptFilenames = [];
    $CSSFilenames = [];
    $PopoverHTML = "";
    
    mineTag($("*"));

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
       if(linkDomainCounts[a] < linkDomainCounts[b])
       {
           return 1;
       }
       else if(linkDomainCounts[a] > linkDomainCounts[b])
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
            if ($InterestingWords.length < $NumInterestingWords)
            {   
                $InterestingWords.push(word)
            }
            else
            {
                break;
            }
        }
    }
    
    clearScratch();
    
    var $PageTitle = document.title || "Untitled";
    var $PageDomain = window.location.host.replace("www.", "");
    
    $PopoverHTML = '<div id="feltron_ext">';
    
    log("Page Title: " + $PageTitle);
    $PopoverHTML += "<header>";
    $PopoverHTML += "<p>Where are you?</p>";
    $PopoverHTML += '<h1>' + $PageTitle + '</h1>';
    log("Page Domain: " + $PageDomain);
    $PopoverHTML += '<h2>' + $PageDomain + '</h2>';
    $PopoverHTML += "</header>";


    $PopoverHTML += '<div id="fe_graph"> <h3>Links</h3> <div id="fe_links_placeholder"></div></div>';
    
    $PopoverHTML += '<ul id="fe_details">';

    // Col 1: Words
    $PopoverHTML += '<li><div class="datapoint"><h3>unique words</h3><h3 class="condensed">' + convertNum($NumUniqueWords) + ' </h3>';
    log("Num unique words: " + convertNum($NumUniqueWords));
    log("Interesting Words: ");
    log($InterestingWords);
    $PopoverHTML += '<p>' + $InterestingWords.join(", ") + '</p>'; 
    $PopoverHTML += '</div></li>';
    
    // Col 2: Tags
    $PopoverHTML += '<li><div class="datapoint bargraph"><h3>html tags</h3><h3 class="condensed">'+convertNum($NumUniqueTags)+'</h3>';
    log("Num unique tags: " + convertNum($NumUniqueTags));
    log("Sorted Tags: ");
    log($SortedPageTags);
    var maxTagCount = $PageTagCounts[$SortedPageTags[0]];
    var tagList = $SortedPageTags.map(function(tag){ 
        var amtPageTag = $PageTagCounts[tag] / maxTagCount;
        return "<div class='fe_pageTag' style='width:"+(amtPageTag*100)+"%\'><span class='count'>(" +$PageTagCounts[tag]+ ")</span> &lt;" + tag + "&gt;</div>"; 
    }).join("");
    $PopoverHTML += '<p>' + tagList + '</p>'; 
    $PopoverHTML += '</div></li>';
    
    // Col 3: Domains
    $PopoverHTML += '<li><div class="datapoint"><h3>domains</h3><h3 class="condensed">'+convertNum($NumUniqueDomains)+'</h3>';
    log("Num unique domains: " + convertNum($NumUniqueDomains));
    log("Sorted Domains: ");
    log($SortedLinkDomains);
    $PopoverHTML += '<p>' + $SortedLinkDomains.join(", ") + '</p></div>';     
    $PopoverHTML += '<div class="datapoint"><div id="fe_clock"></div><h3>Time on page</h3></div>';
    $PopoverHTML += '</li>';
    
    // Col 4: CSS & JS
    $PopoverHTML += '<li><div class="datapoint"><h3>JavaScript files</h3><h3 class="condensed">'+convertNum($NumJavascriptFiles)+'</h3>';
    log("Num JavaScript Files: " + $NumJavascriptFiles);
    log("$JavaScriptFilenames: ");
    log($JavaScriptFilenames);
    $PopoverHTML += '<p>' + $JavaScriptFilenames.join("<br/>") + '</p></div>';     
    
    $PopoverHTML += '<div class="datapoint"><h3>css files</h3><h3 class="condensed">'+ convertNum($NumCSSFiles) +'</h3>';
    log("Num CSS Files: " + $NumCSSFiles);    
    log("$CSSFilenames: ");
    log($CSSFilenames);
    $PopoverHTML += '<p>' + $CSSFilenames.join("<br/>") + '</p>';         
    $PopoverHTML += '</div></li>';
    $PopoverHTML += '</ul>';
    
    $PopoverHTML += '</div>'; // fe_details
    $PopoverHTML += "</div>"; // feltron_ext
    
    $TimerClock = setInterval(function(){
        updateTimer();
    }, 1000)
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

function hslToRgb(h, s, l)
{
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
}

function rgbToHsl(r, g, b)
{
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
}


var $SortMode = 1; // 0 hue 1 sat 2 lightness
function setRenderModeClient()
{
    var sortVal = $.grep($("[name=render_mode]"), function(a){return a.checked;})[0].value;
    setRenderMode(sortVal * 1);
}

function setRenderMode(mode)
{
    $SortMode = mode * 1;
}

function addExtCSS()
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


function sortColors(pixelData)
{
    var hslArr = new Array();
    for (var i = 0; i < pixelData.length; i+=4)
    {        
        var rgbColor = [pixelData[i + 0], 
                        pixelData[i + 1],
                        pixelData[i + 2]];
        hslArr.push(rgbToHsl(rgbColor[0], rgbColor[1], rgbColor[2]));
    }
    
    var sortedHslArr = hslArr.sort( function(a, b)
    {
        var primarySortMode = $SortMode;
        var secondarySortMode = -1;
        var primaryMulti = 1;
        var secondaryMulti = 1;
        if ($SortMode == 0)
        {
            secondarySortMode = 2;                 
        }
        else if ($SortMode == 1)
        {
            // Not bad:
            secondarySortMode = 2;                 
        }
        else if ($SortMode == 2)
        {
            // Very nice:
            // secondarySortMode = 0;
            // Also nice:
            // secondarySortMode = 1;
            // The best
            secondarySortMode = 2;
        }
        else if ($SortMode == 3)
        {
            primarySortMode = 0;
            secondarySortMode = 2;     
            secondaryMulti = -1;       
        }
        else if ($SortMode == 4)
        {
            primarySortMode = 2;
            secondarySortMode = 0;
        }
        else if ($SortMode == 5)
        {
            primarySortMode = 1;
            secondarySortMode = 0;
        }
        else if ($SortMode == 6)
        {
            primarySortMode = 1;
            secondarySortMode = 2;
        }
        if(a[primarySortMode] > b[primarySortMode])
        {
            return 1 * primaryMulti;
        }
        else if (a[primarySortMode] < b[primarySortMode])
        {
            return -1 * primaryMulti;
        }
        else 
        {
            // Sub-sorting
            if (secondarySortMode != -1)
            {
                if(a[secondarySortMode] > b[secondarySortMode])
                {
                    return 1 * secondaryMulti;
                }
                else if(a[secondarySortMode] < b[secondarySortMode])
                {
                    return -1 * secondaryMulti;
                }
                else
                {
                    return 0;
                }
            }
            return 0;
        }
    });

    var sortedRGB = [];
    for (var i = 0; i < sortedHslArr.length; ++i)
    {
        var hsl = sortedHslArr[i];
        var rgb = hslToRgb(hsl[0],hsl[1],hsl[2])
        rgb.push(255);
        sortedRGB.push(rgb);
    }
    
    return sortedRGB;
}

function handleImage(imageDataURI)
{
    log("Image:");
    log(imageDataURI);
    
    log($PopoverHTML);
    document.body.innerHTML += $PopoverHTML;
    
    return;

    var img = document.createElement("img");
    img.src = imageDataURI;

    var top = $(document).scrollTop();
    var left = $(document).scrollLeft(); //img.width / 2;
    
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.setAttribute("style", "position:absolute;top:"+top+"px;left:"+left+"px;z-index:999999;width:"+(canvas.width/2)+"px;height:"+(canvas.height/2)+"px;");
    document.body.appendChild(canvas);
    var context = canvas.getContext('2d');
    context.drawImage(img, 0, 0, img.width, img.height);
    
    //return;
    
    // Now apply filter
    var imageData = context.getImageData(0, 0, img.width, img.height);
    var data = imageData.data;

    // Invert
    /*
    for(var i = 0; i < data.length; i += 4) 
    {
      // red
      data[i] = 255 - data[i];
      // green
      data[i + 1] = 255 - data[i + 1];
      // blue
      data[i + 2] = 255 - data[i + 2];
    }
    */

    var sortedColors = sortColors(data);
    for(var i = 0; i < data.length/4; i++) 
    {
      data[i*4] = sortedColors[i][0];
      data[i*4 + 1] = sortedColors[i][1];
      data[i*4 + 2] = sortedColors[i][2];
      data[i*4 + 3] = sortedColors[i][3];
    }
    
    // overwrite original image
    context.putImageData(imageData, 0, 0);
    
}

function appendFontWithURL(fontName)
{
    var styleNode           = document.createElement ("style");
    styleNode.type          = "text/css";
    styleNode.textContent   = "@font-face { font-family: 'Extension "+fontName+"'; src: url('"
                            + chrome.extension.getURL (fontName)
                            + "'); }"
                            ;
    document.head.appendChild (styleNode);
    /*
    console.log("Appending child: " + fontURL);
    var css = " \
    @font-face { \
      font-family: 'Extension Poster Sans Bold'; \
      src: url('chrome-extension://__MSG_@@extension_id__/PosterSansBold.ttf'); \
    }";
    var style = document.createElement('style');
    style.innerHTML = css;
    document.body.appendChild(style);
    */
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

$("document").ready(function()
{
//    appendFontWithURL("PosterSansBold.otf");
//    appendFontWithURL("GothamBold.otf");
    log("Feltron Loaded");
});

// NOTE: Once we scroll, remove the image
