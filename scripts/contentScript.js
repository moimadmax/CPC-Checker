var ls = localStorage;
function dataReceived(data){
  if (data.hideIgnoredPost == "on"){
    //chrome.tabs.insertCSS({code:"#postlist .postbitignored {display: none !important;}");
    chrome.tabs.insertCSS({code:"#posthead  {display: none !important;}"});
  }
}

var port = chrome.runtime.connect({name: 'contentScript'});
port.onMessage.addListener(function(msg){
  dataReceived(msg);
});
