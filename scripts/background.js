var ls = localStorage;
var requestTimeout = 1000 * 6;
var readAllHash;


// Initialisation des variables
function install(){
  ls.accesUrl = ls.accesUrl || 'http://forum.canardpc.com/';
  ls.update = ls.update || 5;
  ls.popup = ls.popup || 1;
  ls.bookmarksEnabled = ls.bookmarksEnabled || 1;
  ls.searchEnabled = ls.searchEnabled || 1;
  ls.cache = ls.cache || '';
  ls.bookmarksContent = ls.bookmarksContent || '{"bookmarks":[], "lastUpdated":0}';
  ls.persistentStorage = ls.persistentStorage || '{}';
  ls.hideIgnoredPost = ls.hideIgnoredPost || '';

}

// Initialisation de l'extension
function init(){
  install();
  chrome.alarms.create('refresh', {periodInMinutes: parseInt(ls.update, 10)});
  if(ls.popup === '1'){
    chrome.browserAction.setPopup({popup: "popup.html"});
    chrome.browserAction.onClicked.removeListener(goToUsercp);
  } else {
    chrome.browserAction.setPopup({popup: ""});
    chrome.browserAction.onClicked.addListener(goToUsercp);
  }
  refreshCounter();
}

// Ouvre le control panel dans un nouvel onglet
function goToUsercp(){
  chrome.tabs.query({url: ls.accesUrl + "usercp.php*"}, function(tabs) {
    if(tabs.length){
        chrome.tabs.reload(tabs[0].id);
        chrome.tabs.update(tabs[0].id, {active: true});
    } else {
      chrome.tabs.create({url: ls.accesUrl + 'usercp.php'});
    }
  });
}

// Déclenchement periodique
function onAlarm(){
  refreshCounter();
}

// Récupère la page et rafraichi le bouton
function refreshCounter(wait) {
  var xhr = new XMLHttpRequest();
  var abortTimerId = window.setTimeout(function() {
    xhr.abort();  // synchronously calls onreadystatechange
  }, requestTimeout);
  function handleSuccess(page) {
    window.clearTimeout(abortTimerId);

    // Extrait le nombre de Thread non lu
    function parseNbThread(string){
      var pattern=/(?:messages\:|Posts\:) \(([0-9]+)\)/;
      return parseInt(string.match(pattern)[1], 10);
    }

    // Extrait le nombre de message non lu
    function parseNbMsg(string){
      var toReturn = 0;
      var pattern=/(?:messages privés|Private Messages)<\/a> \(([0-9]+)\)/;
      var result = string.match(pattern);
      if(result){
        toReturn = parseInt(result[1], 10);
      }
      pattern=/(?:Nouveaux messages visiteur|New Visitor Messages)<\/a> \(([0-9]+)\)/;
      result = string.match(pattern);
      if(result){
        toReturn += parseInt(result[1], 10);
      }
      return toReturn;
    }

    // Choisi l'icone en fonction du nombre de messages
    function quelIcone(nbMsg){
      if(nbMsg == 0) return 2;
      if(nbMsg < 5)  return 3;
      if(nbMsg >= 5) return 4;
      return 1;
    }

    // Crée le texte de l'infobulle en fonction du nombre de messages
    function makeTitle(nbMsg, nbThread){
      var output = "";
      if(nbMsg) { output = nbMsg + " message(s)" ;}
      if(output && nbThread)  { output += ", ";}
      if(nbThread) { output += nbThread + " discussion(s)";}
      if(output == "") {output = "Rien, Nada ...";}
      return output;
    }
    var nbThread = parseNbThread(page);
    var nbMsg = parseNbMsg(page);
    ps.set('nbThread', nbThread);
    ps.set('nbMsg', nbMsg);
    bouton.update(quelIcone(nbMsg + nbThread), nbThread, nbMsg, makeTitle(nbMsg, nbThread));
  }

  function handleError(error) {
    window.clearTimeout(abortTimerId);
    bouton.update(1, ps.get('nbThread'), ps.get('nbMsg'), error);
  }

  try {
    xhr.onreadystatechange = function() {
      if (xhr.readyState != 4)
        return;

      if (xhr.responseText && xhr.status == 200) {
        var html = xhr.responseText;
        var debut = html.indexOf('<div class="cp_content">');
        if(debut !== -1){ // Si loggé sur le forum
          var fin = html.indexOf('<!-- ############## END SUBSCRIBED THREADS ##############  -->');
          readAllHash = /markreadhash=([^"]+)/gmi.exec(html)[1];
          ls.cache = html.substring(debut, fin);
          handleSuccess(ls.cache);
        } else { // Si pas loggé
          handleError("Non connecté");
        }
      } else {
        handleError("Erreur Réseau");
      }
    };

    xhr.onerror = function(error) {
      handleError("Erreur Réseau");
      console.error("Xhr Error");
    };

    xhr.open("GET", ls.accesUrl + "usercp.php", !wait);
    xhr.send(null);
  } catch(e) {
    handleError("Erreur Réseau");
    console.error("Refresh Exception Error");
  }
}

// Extrait les liens pour le popup
function extractLinks(page, quantity){
  var parseMessage = /<a href="(private.php\?do[^"]+)" [^>]+>([^<>]+)<\/a>/gmi;
  var parseMsgVisit = /<a class="title" href="(members\/[^"]+?tab=visitor_messaging#visitor_messaging)[^>]+>([^<>]+)<\/a>/gmi;
  var parseThread = /<a class="title [^"]+"[ ]+href="(threads[^"]+)" [^>]+>([^<>]+)<\/a>/gmi;
  var result, pos;
  var messages = [];
  var threads = [];

  function htmlDecode(input){
    var e = document.createElement('div');
    e.innerHTML = input;
    return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
  }

  // Récupération des messages
  while ((result = parseMessage.exec(page))) {
    messages.push({url:ls.accesUrl + htmlDecode(result[1]), text:htmlDecode(result[2])});
    parseMsgVisit.lastIndex = parseMessage.lastIndex;
  }

  // Récupération des messages visiteurs
  while ((result = parseMsgVisit.exec(page))) {
    messages.push({url:ls.accesUrl + htmlDecode(result[1]), text:htmlDecode(result[2])});
    parseThread.lastIndex = parseMsgVisit.lastIndex;
  }

  // Récupération des Threads
  while ((result = parseThread.exec(page))) {
    threads.push({url:ls.accesUrl + htmlDecode(result[1]) + '?goto=newpost', text:htmlDecode(result[2])});
  }
  return {messages:messages, threads:threads, quantity:quantity, readAllHash:readAllHash};
}

// Persistant storage
var ps = {
  db: {},
  set: function(key, value){
    if(!this.db[key]){
      try{
        this.db = JSON.parse(ls.persistentStorage);
      }catch(e){}
    }
    this.db[key] = value;
    ls.persistentStorage = JSON.stringify(this.db);
  },

  get: function(key){
    if(!this.db[key]){
      this.db = JSON.parse(ls.persistentStorage);
    }
    return this.db[key];
  }
}

//
// Déclaration des évenements
//

// Si installation de l'extension on met les options par défaut.
//chrome.runtime.onInstalled.addListener(install);
chrome.runtime.onInstalled.addListener(function(details) {
  switch(details.reason){
    case 'install':
      install();
      break;
    case 'update':
      break;
    case 'browser_update':
      break;
  }
});

// Alarme déclencheuse de refresh
chrome.alarms.onAlarm.addListener(onAlarm);
chrome.runtime.onConnect.addListener(function(port) {
  if(port.name == 'popup'){
    port.onDisconnect.addListener(function(){
      setTimeout(refreshCounter,  3 * 1000);
    });
    port.onMessage.addListener(function(request) {
      switch(request.action){
        case 'PopupOpen':
          port.postMessage(extractLinks(ls.cache, {nbThread:ps.get('nbThread'), nbMsg:ps.get('nbMsg')}));
          break;
        case 'PopupRefresh':
          refreshCounter(true);
          port.postMessage(extractLinks(ls.cache, {nbThread:ps.get('nbThread'), nbMsg:ps.get('nbMsg')}));
          break;
      }
    });
  }
  if(port.name == 'option'){
    port.onDisconnect.addListener(function(){
      init();
    });
  }
  if(port.name == 'contentScript'){
    port.postMessage({hideIgnoredPost:ls.hideIgnoredPost});
  }
 });
//
// Là ou tout commence.
//

window.addEventListener('DOMContentLoaded', init, false);
