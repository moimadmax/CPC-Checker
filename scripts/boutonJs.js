var bouton={
  nbMsg:0,
  nbThread:0,
  btnIcon:0,
  can19: document.getElementById('can19'),
  can38: document.getElementById('can38'),
  badge: {
    19: {
      1: document.getElementById('snif19'),
      2: document.getElementById('baah19'),
      3: document.getElementById('cool19'),
      4: document.getElementById('yeah19'),
    },
    38: {
      1: document.getElementById('snif38'),
      2: document.getElementById('baah38'),
      3: document.getElementById('cool38'),
      4: document.getElementById('yeah38'),
    }
  },
  
  // Mise a jour du bouton
  update:function (btnIcon, nbT, nbM, btnTitle) {
    if (btnTitle)  chrome.browserAction.setTitle({title: btnTitle});
    if (this.nbMsg !== nbM || this.nbThread !== nbT || this.btnIcon !== btnIcon) {
      this.btnIcon = btnIcon;
      this.nbMsg = nbM;
      this.nbThread = nbT;
      this.displayIt();
    }
  },
  
  // Affiche l'image dans le bouton
  displayIt:function(){
    var id19 = this.generateBadge(this.can19);
    var id38 = this.generateBadge(this.can38);
    chrome.browserAction.setIcon({imageData: {'19': id19, '38': id38}}); 
  },
  
  // Génère une image dans un div
  generateBadge:function(canvas){
    var ctx = canvas.getContext("2d");
    //ctx.save();
    var size = canvas.width;
    var fontType = '';
    var nbT = this.nbThread;
    var nbM = this.nbMsg;
    switch(size){
      case 19: 
        fontType = 'bold 8pt sans-serif';
        break;
      case 38: 
        fontType = 'bold 12pt sans-serif';
        break;
      default: 
        fontType = 'bold 8pt sans-serif';
        break;
    }

    ctx.clearRect(0, 0, size, size);
    img = this.badge[size][this.btnIcon];
    ctx.drawImage(img, 0, 0);
    ctx.font = fontType;
    ctx.shadowBlur = 1;
    ctx.fillStyle = 'white';
    ctx.textBaseline = 'bottom';
    if(nbT){
      ctx.shadowColor  = 'red';
      ctx.strokeStyle  = 'red';
      ctx.textAlign = 'end';
      ctx.strokeText(nbT, size, size + 2);
      ctx.strokeText(nbT, size, size + 2);
      ctx.strokeText(nbT, size, size + 2);
      ctx.strokeText(nbT, size, size + 2);
      ctx.fillText(nbT, size, size + 2);
    }
    if(nbM){
      ctx.shadowColor = 'blue';
      ctx.strokeStyle = 'blue';
      ctx.textAlign = 'start';
      ctx.strokeText(nbM, 0, size + 2);
      ctx.strokeText(nbM, 0, size + 2);
      ctx.strokeText(nbM, 0, size + 2);
      ctx.strokeText(nbM, 0, size + 2);
      ctx.fillText(nbM, 0, size + 2);
    }
    //ctx.restore();  
    return ctx.getImageData(0, 0, size, size);
  },
};
