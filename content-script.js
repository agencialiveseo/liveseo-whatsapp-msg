
var observeDOM = (function(){
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  
    return function( obj, callback ){
      if( !obj || obj.nodeType !== 1 ) return; 
  
      if( MutationObserver ){
        // define a new observer
        var mutationObserver = new MutationObserver(callback)
  
        // have the observer observe for changes in children
        mutationObserver.observe( obj, { childList:true, subtree:true })
        return mutationObserver
      }
      
      // browser support fallback
      else if( window.addEventListener ){
        obj.addEventListener('DOMNodeInserted', callback, false)
        obj.addEventListener('DOMNodeRemoved', callback, false)
      }
    }
  })();
  
function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}
  
function addMenuToApp(mutation, observer){
    // precisa arrumar em clicks em conversas ou canto direito superior
    let mutatedChild = mutation[0].target;
    
    if(mutatedChild.nodeName != "SPAN") return;
    
    let lis = mutatedChild.childNodes[0].childNodes[0].childNodes[0];

    let li = lis.childNodes[0];

    li.addEventListener("click", function(event){
        console.log("cricou");
    })
    
    let div = li.childNodes[0];

    div = div.cloneNode();
    div.textContent = "Enviar para o app";
    li = li.cloneNode();

    li.appendChild(div);
    
    lis.appendChild(li)
}
  
observeDOM(document.querySelector("#app > div > span:nth-child(4)"), debounce(addMenuToApp, 200));
  
  ///////////////////////////
  // mensagens selecionadas:
  ///////////////////////////
  
let itens = document.querySelectorAll("div[role='application'] div[role='row']")
let selected = [];
itens.forEach(function(item){
    let ckbox = item.querySelector("input[type='checkbox']:checked");
    if(!ckbox) return;
    selected.push(item)
})
  
  
for(let i in selected){
    
    let fragment = selected[i].childNodes[0].childNodes[0].childNodes[1];
    
    if(fragment.childElementCount > 2)
        fragment = fragment.childNodes[1];
    else 
        fragment = fragment.childNodes[0];
    
    if(fragment.childElementCount > 3)
        fragment = fragment.childNodes[1];
    else 
        fragment = fragment.childNodes[0]
    
    message = fragment.childNodes[0].childNodes[0];
    
    time = message.getAttribute("data-pre-plain-text").replace(/\[(.*), (.*)\] .*: /, "$2 $1");
    messageText = message.querySelector(".selectable-text").textContent;
    name = message.getAttribute("data-pre-plain-text").replace(/\[.*\] (.*): /, "$1");

    console.log(time, name, messageText)
}