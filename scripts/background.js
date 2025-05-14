import {bouton} from './bouton.js';

const ls = chrome.storage.local;
const ss = chrome.storage.session;

let settings = { accesUrl: '', update: '', popup: '', bookmarksEnabled: '', bookmarksSync: '', searchEnabled: '', bookmarksContent: ''} ;
let session = { cache: '', nbThread: 0, nbMsg: 0, links:[] };
let initialised = false;

// Initialisation des variables
function install(){
  settings.accesUrl = 'https://forum.canardpc.com/';
  settings.update = '5';
  settings.popup = '1';
  settings.bookmarksEnabled = '1';
  settings.bookmarksSync = '0';
  settings.searchEnabled = '1';
  settings.bookmarksContent = '{"bookmarks":[], "lastUpdated":0}';
  ls.set({ 'settings': settings });
}


// Initialisation de l'extension
function init(){
  chrome.alarms.create('refresh', {periodInMinutes: parseInt(settings.update, 10)});
  if(settings.popup == '1'){
    chrome.action.setPopup({popup: "popup.html"});
    chrome.action.onClicked.removeListener(goToUsercp);
  } else {
    chrome.action.setPopup({popup: ""});
    chrome.action.onClicked.addListener(goToUsercp);
  }
  if(settings.bookmarksSync == '1'){
    // Si les favoris changent
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      try {
        let remote = JSON.parse(changes['bookmarks'].newValue);
        let local = JSON.parse(settings.bookmarksContent);
        if(remote.lastUpdated > local.lastUpdated){
          settings.bookmarksContent = changes['bookmarks'].newValue;
          console.log('Bookmarks changed on cloud');
          ls.set({ 'settings': settings });
        }
      } catch (e) {}
    });
  }
  initialised = true;
  refreshCounter();
}

// Ouvre le control panel dans un nouvel onglet
function goToUsercp(){
  chrome.tabs.query({url: settings.accesUrl + "messagecenter/index*"}, function(tabs) {
    if(tabs.length){
        chrome.tabs.reload(tabs[0].id);
        chrome.tabs.update(tabs[0].id, {active: true});
    } else {
      chrome.tabs.create({url: settings.accesUrl + 'messagecenter/index'});
    }
  });
}

// Déclenchement periodique
function onAlarm(){
  loadDatas(function(){
    refreshCounter();
  });
  
}

// Récupère la page et rafraichi le bouton
function refreshCounter(callback) {
  function handleSuccess(page) {

    // Extrait le nombre de Thread non lu
    function parseNbThread(string){
      let toReturn = 0;
      let pattern=/<!--Notifications-->[^!]*?<span class="pm-folder-count js-notifications-folder-count" title="([0-9]+)"/;
      let result = string.match(pattern);
      if(result){
        toReturn = parseInt(result[1], 10);
      }
      return toReturn;
    }

    // Extrait le nombre de message non lu
    function parseNbMsg(string){
      let toReturn = 0;
      let pattern=/<!--Messages-->[^!]*?<span class="pm-folder-count" title="([0-9]+)">/;
      let result = string.match(pattern);
      if(result){
        toReturn = parseInt(result[1], 10);
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
      let output = "";
      if(nbMsg) { output = nbMsg + " message(s)" ;}
      if(output && nbThread)  { output += ", ";}
      if(nbThread) { output += nbThread + " discussion(s)";}
      if(output == "") {output = "Rien, Nada ...";}
      return output;
    }
    let nbThread = parseNbThread(page);
    let nbMsg = parseNbMsg(page);
    bouton.update(quelIcone(nbMsg + nbThread), nbThread, nbMsg, makeTitle(nbMsg, nbThread));
    session.nbThread = nbThread;
    session.nbMsg = nbMsg;
    ss.set({ 'session': session });
    if (callback) callback();
  }

  function handleError(error) {
    bouton.update(1, session.nbThread, session.nbMsg, error);
  }

  try {
    if(settings.accesUrl == '') {console.error("défaut data");}    
    fetch(settings.accesUrl + "messagecenter/index")
      .then(function (response) {
        if (response.ok) {
          response.text()
            .then(function(text){
            let html = text;
            let debut = html.indexOf('privateMessageNavContainer');
            if(debut !== -1){ // Si loggé sur le forum
              let fin = html.indexOf('<!-- *** END WIDGET widgetid:30, widgetinstanceid:58, template:widget_privatemessage_display *** -->');
              session.cache = html.substring(debut, fin);
              session.links[0] = /<!--Messages-->[^!]*?\/messagecenter\/list\/([0-9]+)\/1"/.exec(session.cache)[1];
              session.links[1] = /<!--Notifications-->[^!]*?\/messagecenter\/notification\/([0-9]+)\/1"/.exec(session.cache)[1];
              handleSuccess(session.cache);
            } else { // Si pas loggé
              handleError("Non connecté");
            }
          });
        } else {
          handleError("Erreur Réseau");
          console.error("Fetch Error");
        }
      });

  } catch(e) {
    handleError("Erreur Réseau");
    console.error("Refresh Exception Error");
  }
}

// Extrait les liens pour le popup
function extractLinks(page, quantity){
  let parseMessage = /<a href="[^"]+\/(messagecenter\/view\/[^"]+)">([^<>]+)<\/a>/gmi;
  let parseThread = /<a href="[^"]+\/(node\/[0-9]+)"[^>]+>([^<>]+)<\/a>/gmi;
  let result, pos;
  let messages = [];
  let threads = [];

  // Récupération des messages
  while ((result = parseMessage.exec(page))) {
    messages.push({url:settings.accesUrl + result[1], text:result[2]});
    parseThread.lastIndex  = parseMessage.lastIndex;
  }

  // Récupération des Threads
  while ((result = parseThread.exec(page))) {
    threads.push({url:settings.accesUrl + result[1], text:result[2]});
  }
  return {messages:messages, threads:threads, quantity:quantity, links:session.links};
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

// Connection d'un element externe
chrome.runtime.onConnect.addListener(function(port) {
  loadDatas(function (){
    if(port.name == 'popup'){
      port.onDisconnect.addListener(function(){
        setTimeout(refreshCounter,  3 * 1000);
      });
      port.onMessage.addListener(function(request) {
        switch(request.action){
          case 'PopupOpen':
            port.postMessage(extractLinks(session.cache, {nbThread:session.nbThread, nbMsg:session.nbMsg}));
            break;
          case 'PopupRefresh':
            refreshCounter(function(){
              port.postMessage(extractLinks(session.cache, {nbThread:session.nbThread, nbMsg:session.nbMsg}));
            });
            break;
        }
      });
    }
    if(port.name == 'option'){
      port.onDisconnect.addListener(function(){
        ls.get(['settings'], function(data) {
          if(data.settings){
            settings = data.settings;
            init();
          }
        });
      });
    }
  });
 });

//
// Là ou tout commence.
//
function loadDatas(callback){
  if(settings.accesUrl == ''){
    ls.get(['settings'], function(data) {
      if(data.settings){
        settings = data.settings;
        ss.get(['session'], function(data){
          if(data.session){
            session = data.session;
          }
        });
        if(!initialised) {init();}
        if (callback) callback();
      } else {
        install();
        init();
      }
    });
  }else{
    if (callback) callback();
  }
}
loadDatas();