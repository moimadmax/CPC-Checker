// chrome-extension://alndamfaadhijaekjanbahdedcglacef/popup.html
const ls = chrome.storage.local;
const ss = chrome.storage.session;

let port;

let settings;
let session;
let datas;
let divTitle;
let divLinksTitle;
let divLinks;
let divBpPanel;
let divBookmarks;
let divBookmarksTitle;
let divSearch;

let title;
let linksTitle;
let bookmarksTitle;
let bookmarksTitleSync;
let bpRefresh;
let loading;
let bpOpenAll;
let bpOpenMsgs;
let bpOpenThreads;

function init(){
  //
  //  Creation des éléments.
  //

  // Titres
  let title = document.createElement('h1');
  title.innerHTML = '<a href="' + settings.accesUrl + 'messagecenter/index" target="_blank" title="Lien vers le tableau de bord">Tableau de bord</a>';
  let linksTitle = createElm('h2', 'Nouveautés');
  let bookmarksTitle = createElm('h2', 'Favoris');
  let bookmarksTitleSync = createElm('h2', 'Favoris \u21cb');
  let searchTitle = createElm('h2', 'Recherche');

  // Bouton Refresh
  bpRefresh = document.createElement('div');
  bpRefresh.id = 'bpRefresh';
  bpRefresh.innerHTML = '<a href="#" title="Rafraichir"><img src="images/popup/bpRefresh.png" /></a>';
  //bpRefresh.innerHTML = '<a href="#" title="Rafraichir"><img src="' + chrome.extension.getURL('images/popup/bpRefresh.png') + '" /></a>';

  // Loading ...
  loading = document.createElement('p');
  loading.innerHTML = 'Chargement ...';

  //Boutons Ouvrir tous
  bpOpenAll = document.createElement('input');
  bpOpenAll.name = 'bpOpenAll';
  bpOpenAll.type = 'button';
  bpOpenAll.value = 'Ouvrir tout';
  bpOpenAll.addEventListener('click', function(){openAll();}, false);

  //Boutons Ouvrir Messages
  bpOpenMsgs = document.createElement('input');
  bpOpenMsgs.name = 'bpOpenMsgs';
  bpOpenMsgs.type = 'button';
  bpOpenMsgs.value = 'Ouvrir messages';
  bpOpenMsgs.addEventListener('click', function(){openMsgs();}, false);

  //Boutons Ouvrir Threads
  bpOpenThreads = document.createElement('input');
  bpOpenThreads.name = 'bpOpenThreads';
  bpOpenThreads.type = 'button';
  bpOpenThreads.value = 'Ouvrir discussions';
  bpOpenThreads.addEventListener('click', function(){openThreads();}, false);

 //Récupere les divs
  divTitle = document.getElementById('title');
  divLinks = document.getElementById('links');
  divLinksTitle = document.getElementById('linksTitle');
  divBpPanel = document.getElementById('bpPanel');
  divBookmarks = document.getElementById('bookmarks');
  divBookmarksTitle = document.getElementById('bookmarksTitle');
  divSearchTitle = document.getElementById('searchTitle');
  divSearch = document.getElementById('search');

  // Ajout du titre et bouton refresh
  divTitle.appendChild(title);
  divTitle.appendChild(bpRefresh);
  bpRefresh.addEventListener('click', refresh, false);
  divLinksTitle.appendChild(linksTitle);
  // Message d'attente. (normalement invisible car cache)
  divLinks.appendChild(loading);

  if(settings.bookmarksEnabled == '1'){
    favoris.load();
    // Affiche le titre des favoris en fonction de la synchro
    if(settings.bookmarksSync == '1'){
      divBookmarksTitle.appendChild(bookmarksTitleSync);
    } else {
      divBookmarksTitle.appendChild(bookmarksTitle);
    }
    displayBookmarks();
    displayAddToBookmarks();
  }

  if(settings.searchEnabled == '1'){
    divSearchTitle.appendChild(searchTitle);
    displaySearch();
  }
  // On demande les données du background.
  port = chrome.runtime.connect({name: 'popup'});
  port.onMessage.addListener(function(msg){
    dataReceived(msg);
  });
  setTimeout(function(){port.postMessage({action: 'PopupOpen'})}, 50);
  // Elle seront traitée dans DataReceived
}

function refresh(){
  clearNodes(divLinks);
  clearNodes(divBpPanel);
  divLinks.appendChild(loading);
  // On demande les données du background.
  port.postMessage({action: 'PopupRefresh'});
  // Elle seront traitée dans DataReceived
}

function dataReceived(response) {
  datas = response;
  let content = addLinks(response);

  // On enlève le loading ... et on mets le contenu
  divLinks.removeChild(loading);
  divLinks.appendChild(content);

  // Ajout des bouton Ouvrir
  if(datas.messages.length && datas.threads.length){
    divBpPanel.appendChild(bpOpenAll);
  }
  if(datas.messages.length){
    divBpPanel.appendChild(bpOpenMsgs);
  }
  if(datas.threads.length){
    divBpPanel.appendChild(bpOpenThreads);
  }
}


function htmlDecode(input){
  var e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

// Ouvre tout les liens
function openAll(){
  openMsgs();
  openThreads();
}

function openMsgs(){
  if(!datas.messages.length) return;
  for (let i = 0; i < datas.messages.length; i++) {
    chrome.tabs.create({url: htmlDecode(datas.messages[i].url)});
  };
}

function openThreads(){
  if(!datas.threads.length) return;
  for (let i = 0; i < datas.threads.length; i++) {
    chrome.tabs.create({url: htmlDecode(datas.threads[i].url)});
  };
}

function addLinks(data){
  let links = document.createElement('div');
  if(data.messages.length){
    links.appendChild(createElm('h3', 'Message(s) privé(s) : ' + data.quantity.nbMsg));
    links.appendChild(createLinks(data.messages));
    if(data.messages.length < data.quantity.nbMsg){
      links.appendChild(createElm('a', 'Tous les messages ne sont pas visible, aller aux messages.', settings.accesUrl + 'messagecenter/list/' + datas.links[0] + '/1' ))
    }
  }

  if(data.threads.length){
    links.appendChild(createElm('h3', 'Discussion(s) suivie(s) : ' + data.quantity.nbThread));
    links.appendChild(createLinks(data.threads, true));
    if(data.threads.length < data.quantity.nbThread){
      links.appendChild(createElm('a', 'Toutes les discussions ne sont pas visible, aller au tableau de bord.', settings.accesUrl + 'messagecenter/notification/' + datas.links[1] + '/1' ))
    }
  }

  if(data.messages.length + data.threads.length == 0){
    links.innerHTML = "Rien, Nada ...";
  }
  return links;
}

function createLinks(tabLinks, isThread){
  let ret = document.createElement('ul');
  let cb, li, link;
  for(let i = 0, l; l = tabLinks[i]; i++){
    li = document.createElement('li');
    link = createElm('a', htmlDecode(l.text), htmlDecode(l.url))
    li.appendChild(link);
    ret.appendChild(li);
  }
  return ret;
}

function bookmark(element){
  let li = getLinks(element);
  if(favoris.indexOf(li.url) == -1){
    favoris.add(li.url, li.title);
  } else {
    favoris.remove(li.url);
  }
  displayBookmarks();
}

function getLinks(element){
  let url = element.currentTarget.nextElementSibling.href;
  let title = element.currentTarget.nextElementSibling.title;
  return {url:url, title:title};
}

function displayBookmarks(){
  clearNodes(divBookmarks);
  for(let i = 0, bm; bm = favoris.db.bookmarks[i]; i++ ){
    let d = document.createElement('div');
    d.className = 'bookmark';
    let l = createElm('a', bm.name, settings.accesUrl + bm.path);
    l.title = bm.title;
    d.appendChild(l);
    divBookmarks.appendChild(d);
  }
}

function displayAddToBookmarks(){
  chrome.tabs.query({currentWindow: true, active: true}, function(tab) {
    let divAddToBookmarks = document.getElementById('addToBookmarks');
    let titre = createElm('H3', 'Ajouter/Enlever la page courante');
    let siteMatch = /^https?:\/\/forum.canardpc.com\/forum\/(?:.*)/i;
    let titleMatch = / - Canardpc\.com$/gi;
    if(siteMatch.test(tab[0].url)){
      let title = tab[0].title.replace(titleMatch, '');
      let link = createElm('a', title, tab[0].url)
      link.addEventListener('click', function(e){bookmark(e);}, false);
      cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = favoris.indexOf(tab[0].url) != -1 ? true : false;
      cb.addEventListener('click', function(e){bookmark(e);}, false);
      divAddToBookmarks.appendChild(titre);
      divAddToBookmarks.appendChild(cb);
      divAddToBookmarks.appendChild(link);
    }
  });
}

function displaySearch(){
  let textBox = document.createElement('input');
  textBox.type = 'text';
  textBox.name = 'request';
  textBox.addEventListener('keypress', function(e){
    let key = e.key;
    if (key == "Enter") { 
      // Build URL
      openSearch(textBox.value);
    }
  });
  divSearch.appendChild(textBox);
}

function openSearch(request){
  let engine = '';
  switch (settings.searchEngine) {
    default:
    case 'DuckDuckGo':
      engine = 'https://duckduckgo.com/?q=site%3Aforum.canardpc.com+';
      break;
    case 'Qwant':
      engine = 'https://www.qwant.com/?q=site%3Aforum.canardpc.com+';
      break;
    case 'Google':
      engine = 'https://www.google.fr/search?q=site:forum.canardpc.com+';
      break;
  }
  request = request.replace(/ /g, "+");
  chrome.tabs.create({url: engine + request, active: true});
}

function createElm(type, text, url){
  let ret = document.createElement(type);
  let txt = document.createTextNode(text);
  ret.appendChild(txt);
  if(url){
    ret.target = '_blank';
    ret.href = url;
    ret.title = text;
    ret.addEventListener('click', function(e) {
      e.preventDefault();
      chrome.tabs.create({url: e.currentTarget.href, active: false});
    }, false);
  }
  return ret;
}

function clearNodes(node){
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}


//
// Au chargement
//

function loadDatas(callback){
  ls.get(['settings'], function(data) {
    if(data.settings){
      settings = data.settings;
      init();
    } 
  });
}

window.addEventListener('DOMContentLoaded', loadDatas, false);


// Todo :
// Limiter la taille du titre
