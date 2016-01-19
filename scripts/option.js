function init(){
  // ajout des listener sur le menu
  var menuItems = document.querySelectorAll('#sidebar-menu li');
  for (var i = 0, menuItem; menuItem = menuItems[i]; i++) {
    menuItem.addEventListener('click', showGroup);
  }
  initPref()

  // Etiquette du Slider de durée de rafraichissement.
  document.getElementById('updMin').innerHTML = localStorage.update;
  document.getElementById('update').addEventListener('change',function(e){
    document.getElementById('updMin').innerHTML = e.currentTarget.value;
  }, false);

  // Gestion des Bookmarks
  document.getElementById('saveBookmark').disabled = true;
  var test = document.getElementById('bookmarksContent');
  document.getElementById('bookmarksContent').value = localStorage.bookmarksContent;
  document.getElementById('bookmarksContent').addEventListener('change',function(e){
    if(IsJson(document.getElementById('bookmarksContent').value)){
      document.getElementById('bmTestResult').innerHTML = "Valide";
      document.getElementById('saveBookmark').disabled = false;
    } else {
      document.getElementById('bmTestResult').innerHTML = "Invalide";
      document.getElementById('saveBookmark').disabled = true;
    }

  }, false);
  document.getElementById('saveBookmark').addEventListener('click',function(e){
    localStorage.bookmarksContent = document.getElementById('bookmarksContent').value;
    document.getElementById('bmTestResult').innerHTML = "Sauvegardé";
  });

  // connecte au background afin de rafraichir la config quand on ferme les options.
  var port = chrome.runtime.connect({name: 'option'});

}

// Switch les groupes visibles de la configuration
function showGroup(e) {
  var groupName = e.currentTarget.dataset.target
  // Add 'selected' class name to the menu item that was clicked.
  var menuItems = document.querySelectorAll('#sidebar-menu li');
  for (var i = 0, menuItem; menuItem = menuItems[i]; i++) {
    var show = menuItem.dataset.target == groupName;
    menuItem.classList.toggle('selected', show);
  }

  // Hide all but the selected group.
  var groups = document.querySelectorAll('.settings-group');
  for (var i = 0, group; group = groups[i]; i++) {
    var show = group.dataset.group == groupName;
    group.hidden = !show;
  }
}

function IsJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

// Fonction d'ecoute et modification des réglages
function initPref()
{

    // storage
    var storage = localStorage;

    // glue for multiple values ( checkbox, select-multiple )
    var glue    = '\n';

    // get the FORM elements
    var formElements = document.querySelectorAll( 'input,select' );

    // list of FORM elements
    var skip            = hash( 'hidden,submit,image,reset,button' );
    var multipleValues  = hash( 'checkbox,select-multiple' );
    var checkable       = hash( 'checkbox,radio' );



    // string to hash
    function hash( str, glue )
    {
        var obj = {};
        var tmp = str.split(glue||',');

        while( tmp.length )
            obj[ tmp.pop() ] = true;

        return obj;
    }


    // walk the elements and apply a callback method to them
    function walkElements( callback )
    {
        var obj = [];
        for( var i=0,element=null; element=formElements[i++]; )
        {
            // skip the element if it has no name or is of a type with no useful value
            var type = element.type.toLowerCase();
            var name = element.name||'';
            if( skip[type]===true || name=='') continue;

            var tmp = callback( element, name, type );
            if( tmp!=null )
                obj.push( tmp );
        }
        return obj;
    }


    // listener for element changes
    function changedElement( e )
    {
        var element = e.currentTarget||e;
        var type    = element.type.toLowerCase();
        var name    = element.name||'';

        var value   = multipleValues[type]!==true?element.value:walkElements
        (
            function( e, n, t )
            {
                if( n==name && e.options )
                {
                    var tmp = [];
                    for( var j=0,option=null; option=e.options[j++]; )
                    {
                        if( option.selected )
                        {
                            tmp.push( option.value );
                        }
                    }
                    return tmp.join( glue );
                }
                else if( n==name && checkable[t]===true && e.checked )
                {
                    return e.value;
                }
            }
        ).join( glue );

        // set value
        storage.setItem( name, value );
    }


    // walk and set the elements accordingly to the storage
    walkElements
    (
        function( element, name, type )
        {
            var value       = storage[name]!==undefined?storage.getItem( name ):element.value;
            var valueHash   = hash( value, glue );

            if( element.selectedOptions )
            {
                // 'select' element
                for( var j=0,option=null; option=element.options[j++]; )
                {
                    option.selected = valueHash[option.value]===true;
                }
            }
            else if( checkable[type]===true )
            {
                // 'checkable' element
                element.checked = valueHash[element.value]===true;
            }
            else
            {
                // any other kind of element
                element.value = value;
            }


            // set the widget.preferences to the value of the element if it was undefined
            // YOU MAY NOT WANT TO DO THIS
            if( storage[name]==undefined )
            {
                changedElement( element );
            }

            // listen to changes
            element.addEventListener( 'change', changedElement, true );
        }
    );

}

// Commencement
window.addEventListener('DOMContentLoaded', init, false);
