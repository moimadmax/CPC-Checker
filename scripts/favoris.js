/*
  db {
    bookmarks[] {
      id : integer
      title : string
      name : string
    }
    lastupdated : timestamp
  }

*/


var favoris = {
  db:{ bookmarks:[], lastUpdated:0},
  
  // Ajoute ou met à jour       
  add:function(url, title, name){
    if(!name){
      name = this.createName(url);
    }
    var i = this.indexOf(url);
    if(i == -1){ // L'entrée n'existe pas.
      this.db.bookmarks.push({
        id: this.getId(url),
        title: title,
        name: name
      });
    } else { // L'entrée existe, on met à jour.
      this.db.bookmarks[i]({
        id: this.getId(url),
        title: title,
        name: name
      });
    }
    this.db.lastUpdated = Date.now();
    this.save();
  },

  // Enlève des favoris
  remove:function(url){
    var d = this.indexOf(url);
    this.db.bookmarks.splice(d, 1);
    this.db.lastUpdated = Date.now();
    this.save();
  },

  // Extrait l'id du lien
  getId:function(url){
    var regex = /\/threads\/([0-9]+)/gi;
    if(result = regex.exec(url)) {
      return parseInt(result[1] ,10);
    } 
    return false;
  },

  // Crée un nom unique 
  createName:function(url){
    url = decodeURIComponent(url);
    var regex =/(?:-([^-\/?]+))/g; 
    var ret = '';
    var fallback = '';
    while(result = regex.exec(url)) {
      ret += result[1][0];
      fallback = result[1];
    } 
    if (ret.length <= 1){
      ret = fallback;
    }
    return ret || 'vide';
  },

  // Retourne l'index d'une url dans les bookmarks
  indexOf:function(url){
    var id = this.getId(url);
    for(var i = 0, bm; bm = this.db.bookmarks[i]; i++){
      if(id === bm.id){
        return i;
      }
    }
    return -1;
  },

  // Sauvegarde dans le local Storage
  save:function(){
    localStorage.bookmarksContent = JSON.stringify(this.db);
    if(localStorage.bookmarksSync == 1 && localStorage.bookmarksContent){
      chrome.storage.sync.set({'bookmarks': localStorage.bookmarksContent}, function() {
        // Notify that we saved.
        console.log('Bookmarks saved to cloud');
      });
    }
  },
  
  // Restaure du local Storage
  load:function(){
    if(localStorage.bookmarksSync == 1){
      chrome.storage.local.get(['bookmarks'], function(result) {
        try {
          var remote = JSON.parse(result.bookmarks);
          var local = JSON.parse(localStorage.bookmarksContent);
          if(remote.lastUpdated > local.lastUpdated){
            localStorage.bookmarksContent = result.bookmarks;
            console.log('Bookmarks restored from cloud');
          }
        } catch (e) {}
      });
    }
    if(localStorage.bookmarksContent){
      this.db = JSON.parse(localStorage.bookmarksContent);
    }
  }
}
