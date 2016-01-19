// chrome-extension://alndamfaadhijaekjanbahdedcglacef/popup.html
var ls = localStorage;
var datas;
var divTitle;
var divLinksTitle;
var divLinks;
var divBpPanel;
var divBookmarks;
var divBookmarksTitle;
var divSearch;

//
//  Creation des éléments.
//

// Titres
var title = document.createElement('h1');
title.innerHTML = '<a href="' + ls.accesUrl + 'usercp.php" target="_blank" title="Lien vers le tableau de bord">Tableau de bord</a>';
var linksTitle = createElm('h2', 'Nouveautés');
var bookmarksTitle = createElm('h2', 'Favoris');
var searchTitle = createElm('h2', 'Recherche');

// Bouton Refresh
var bpRefresh = document.createElement('div');
bpRefresh.id = 'bpRefresh';
bpRefresh.innerHTML = '<a href="#" title="Rafraichir"><img src="images/popup/bpRefresh.png" /></a>';
//bpRefresh.innerHTML = '<a href="#" title="Rafraichir"><img src="' + chrome.extension.getURL('images/popup/bpRefresh.png') + '" /></a>';

// Loading ...
var loading = document.createElement('p');
loading.innerHTML = 'Chargement ...';

//Boutons Ouvrir tous
var bpOpenAll = document.createElement('input');
bpOpenAll.name = 'bpOpenAll';
bpOpenAll.type = 'button';
bpOpenAll.value = 'Ouvrir tout';
bpOpenAll.addEventListener('click', function(){openAll();}, false);

//Boutons Ouvrir Messages
var bpOpenMsgs = document.createElement('input');
bpOpenMsgs.name = 'bpOpenMsgs';
bpOpenMsgs.type = 'button';
bpOpenMsgs.value = 'Ouvrir messages';
bpOpenMsgs.addEventListener('click', function(){openMsgs();}, false);

//Boutons Ouvrir Threads
var bpOpenThreads = document.createElement('input');
bpOpenThreads.name = 'bpOpenThreads';
bpOpenThreads.type = 'button';
bpOpenThreads.value = 'Ouvrir discussions';
bpOpenThreads.addEventListener('click', function(){openThreads();}, false);

var bpMarkAllRead = document.createElement('input');
bpMarkAllRead.name = 'bpMarkAllRead';
bpMarkAllRead.type = 'button';
bpMarkAllRead.value = 'Marquer les forums comme lus';
bpMarkAllRead.addEventListener('click', function(){markAllRead();}, false);

function init(){
  var content;
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

  if(ls.bookmarksEnabled == 1){
    favoris.load();
    // Affiche le titre des favoris
    divBookmarksTitle.appendChild(bookmarksTitle);
    displayBookmarks();
    displayAddToBookmarks();
  }

  if(ls.searchEnabled == 1){
    divSearchTitle.appendChild(searchTitle);
    displaySearch();
  }

  // On demande les données du background.
  port.postMessage({action: 'PopupOpen'});
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
  content = addLinks(response);

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
  divBpPanel.appendChild(bpMarkAllRead);
}


// Ouvre tout les liens
function openAll(){
  openMsgs();
  openThreads();
}

function openMsgs(){
  if(!datas.messages.length) return;
  for (var i = 0; i < datas.messages.length; i++) {
    chrome.tabs.create({url: datas.messages[i].url});
  };
}

function openThreads(){
  if(!datas.threads.length) return;
  for (var i = 0; i < datas.threads.length; i++) {
    chrome.tabs.create({url: datas.threads[i].url});
  };
}

function markAllRead(){
  if(confirm('Est vous sûr de vouloir marquer tout les forums comme lus, cette action est irreversible.') == true){
    chrome.tabs.create({url: ls.accesUrl + 'forumdisplay.php?do=markread&markreadhash=' + datas.readAllHash })
  }
}

function addLinks(data){
  var links = document.createElement('div');
  if(data.messages.length){
    links.appendChild(createElm('h3', 'Message(s) privé(s) : ' + data.quantity.nbMsg));
    links.appendChild(createLinks(data.messages));
    if(data.messages.length < data.quantity.nbMsg){
      links.appendChild(createElm('a', 'Tous les messages ne sont pas visible, aller aux messages.', ls.accesUrl + 'private.php' ))
    }
  }

  if(data.threads.length){
    links.appendChild(createElm('h3', 'Discussion(s) suivie(s) : ' + data.quantity.nbThread));
    links.appendChild(createLinks(data.threads, true));
    if(data.threads.length < data.quantity.nbThread){
      links.appendChild(createElm('a', 'Toutes les discussions ne sont pas visible, aller au tableau de bord.', ls.accesUrl + 'usercp.php' ))
    }
  }

  if(data.messages.length + data.threads.length == 0){
    links.innerHTML = "Rien, Nada ...";
  }
  return links;
}

function createLinks(tabLinks, isThread){
  var ret = document.createElement('ul');
  var cb, li, link;
  for(var i = 0, l; l = tabLinks[i]; i++){
    li = document.createElement('li');
    link = createElm('a', l.text, l.url)
    if(isThread && ls.bookmarksEnabled == 1){
      cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = favoris.indexOf(l.url) != -1 ? true : false;
      cb.addEventListener('click', function(e){bookmark(e);}, false);
      li.appendChild(cb);
    }
    li.appendChild(link);
    ret.appendChild(li);
  }
  return ret;
}

function bookmark(element){
  var li = getLinks(element);
  if(favoris.indexOf(li.url) == -1){
    favoris.add(li.url, li.title);
  } else {
    favoris.remove(li.url);
  }
  displayBookmarks();
}

function getLinks(element){
  var url = element.currentTarget.nextElementSibling.href;
  var title = element.currentTarget.nextElementSibling.title;
  return {url:url, title:title};
}

function displayBookmarks(){
  clearNodes(divBookmarks);
  for(var i = 0, bm; bm = favoris.db.bookmarks[i]; i++ ){
    var d = document.createElement('div');
    d.className = 'bookmark';
    var l = createElm('a', bm.name, ls.accesUrl + 'threads/' + parseInt(bm.id, 10) + '?goto=newpost');
    l.title = bm.title;
    d.appendChild(l);
    divBookmarks.appendChild(d);
  }
}

function displayAddToBookmarks(){
  chrome.tabs.query({currentWindow: true, active: true}, function(tab) {
    var divAddToBookmarks = document.getElementById('addToBookmarks');
    var titre = createElm('H3', 'Ajouter/Enlever la page courante');
    var siteMatch = /^(?:http:\/\/)(?:forum.canardpc.com|cpc.tb.cx)\/threads\/(?:.*)/i;
    var titleMatch = / - Page [0-9]+/i;
    if(siteMatch.test(tab[0].url)){
      var title = tab[0].title.replace(titleMatch, '');
      var link = createElm('a', title, tab[0].url)
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
  var textBox = document.createElement('input');
  textBox.type = 'text';
  textBox.name = 'request';
  textBox.addEventListener('keypress', function(e){
    var key = e.which || e.keyCode;
    if (key === 13) { // 13 = enter
      // Build URL
      openSearch(textBox.value);
    }
  });
  divSearch.appendChild(textBox);
}

function openSearch(request){
  var engine = '';
  switch (ls.searchEngine) {
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
  var ret = document.createElement(type);
  var txt = document.createTextNode(text);
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
var port = chrome.runtime.connect({name: 'popup'});
port.onMessage.addListener(function(msg){
  dataReceived(msg);
});
window.addEventListener('DOMContentLoaded', init, false);


// Todo :
// Limiter la taille du titre
