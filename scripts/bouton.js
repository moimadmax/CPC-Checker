export var bouton={
  nbMsg:0,
  nbThread:0,
  btnIcon:0,
  myImgs: {
    1:'snif.png',
    2:'baah.png',
    3:'cool.png',
    4:'yeah.png'
  },
  
  alternate: {
    timer: 0, 
    affMsg: false,
    nbThread: 0,
    nbMsg: 0,
    start:function(nbT, nbM){
      this.nbThread = nbT;
      this.nbMsg = nbM;
      if (this.timer) return;
      var self = this;
      this.timer = setInterval(function() {
        self.swap();
      }, 1000);
    },
    
    stop:function(){
      if (!this.timer) return;
      clearInterval(this.timer);
      this.timer = 0;
    },
    
    swap:function(){
      if(this.affMsg){
        chrome.action.setBadgeText({text: this.nbThread.toString()})
        chrome.action.setBadgeBackgroundColor({color: '#D30004'})
        this.affMsg = false;
      } else {
        chrome.action.setBadgeText({text: this.nbMsg.toString()})
        chrome.action.setBadgeBackgroundColor({color: '#0004D3'})
        this.affMsg = true;
      }
    },
  },
  
  animate: {
    timer: 0, 
    //anim:['|   ', ' |  ', '  | ', '   |', '  | ', ' |  '],
    anim:['.   ', '..  ', ' .. ', '  ..', '   .', '  ..', ' .. ', '..  '],
    step: 0,
    start:function(){
      if (this.timer) return;
      var self = this;
      this.timer = setInterval(function() {
        self.draw();
      }, 100);
    },
    
    stop:function(){
      if (!this.timer) return;
      clearInterval(this.timer);
      this.timer = 0;
      chrome.action.setBadgeText({text:''});
    },
    
    draw:function(){
      var text = this.anim[this.step];
      chrome.action.setBadgeText({text:text});
      this.step++;
      this.step = this.step == this.anim.length ? 0 : this.step;
    },
  },
  

  // Mise a jour du bouton
  update:function (btnIcon, nbT, nbM, btnTitle) {
    if (btnTitle)  chrome.action.setTitle({title: btnTitle});
    if (this.nbMsg !== nbM || this.nbThread !== nbT || this.btnIcon !== btnIcon) {
      this.btnIcon = btnIcon;
      this.nbMsg = nbM;
      this.nbThread = nbT;
      this.displayIt();
    }
  },
  
  displayIt:function(){
    var img19 = chrome.runtime.getURL('/images/badge19/' + this.myImgs[this.btnIcon]);
    var img38 = chrome.runtime.getURL('/images/badge38/' + this.myImgs[this.btnIcon]);
    chrome.action.setIcon({path: {'19': img19, '38': img38}}); 
    if(this.alternate.timer) { this.alternate.stop();}
    if(this.nbThread && !this.nbMsg){ // Seulement Thread
      chrome.action.setBadgeText({text: this.nbThread.toString()})
      chrome.action.setBadgeBackgroundColor({color: '#D30004'})
    }
    if(!this.nbThread && this.nbMsg){ // Seulement Message
      chrome.action.setBadgeText({text: this.nbMsg.toString()})
      chrome.action.setBadgeBackgroundColor({color: '#0004D3'})
    }
    if(this.nbThread && this.nbMsg){ // Message et Thread en alternance
      this.alternate.start(this.nbThread, this.nbMsg);
    }
    if(!this.nbThread && !this.nbMsg){ // pas de Message et Thread on retire le badge.
      chrome.action.setBadgeText({text: ''})
    }

  },
  
};
