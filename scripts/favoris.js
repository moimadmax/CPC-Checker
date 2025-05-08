/*
  db {
    bookmarks[] {
      id : integer
      url : string
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
      name = this.createName(title);
    }
    let accessUrlMatch = /https?:\/\/forum.canardpc.com\//gi;
    var i = this.indexOf(url);
    if(i == -1){ // L'entrée n'existe pas.
      this.db.bookmarks.push({
        id: this.getId(url),
        path: url.replace(accessUrlMatch, ''),
        title: title,
        name: name
      });
    } else { // L'entrée existe, on met à jour.
      this.db.bookmarks[i]({
        id: this.getId(url),
        path: url.replace(accessUrlMatch, ''),
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
    var regex = /\/([0-9]+)/gi;
    if(result = regex.exec(url)) {
      return parseInt(result[1] ,10);
    } 
    return false;
  },

  // Crée un nom unique 
  createName:function(title){
    var regex =/(?:([^\W]+))/g; 
    var ret = '';
    var fallback = '';
    while(result = regex.exec(title)) {
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
    settings.bookmarksContent = JSON.stringify(this.db);
    ls.set({ 'settings': settings });
    if(settings.bookmarksSync == '1' && settings.bookmarksContent){
      chrome.storage.sync.set({'bookmarks': settings.bookmarksContent}, function() {
        // Notify that we saved.
        console.log('Bookmarks saved to cloud');
      });
    }
  },
  
  // Restaure du local Storage
  load:function(){
    if(settings.bookmarksSync == '1'){
      chrome.storage.local.get(['bookmarks'], function(result) {
        try {
          var remote = JSON.parse(result.bookmarks);
          var local = JSON.parse(settings.bookmarksContent);
          if(remote.lastUpdated > local.lastUpdated){
            settings.bookmarksContent = result.bookmarks;
            console.log('Bookmarks restored from cloud');
          }
        } catch (e) {
          // La version en ligne n'est pas correct
        }
      });
    }
    if(settings.bookmarksContent){
      this.db = JSON.parse(settings.bookmarksContent);
    }
  }
}
