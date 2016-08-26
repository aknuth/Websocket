var console_log = "";

 var examineTree = function(domElm){
     var children = domElm.childNodes;
     for (let child of children) {
         if (child.nodeType===1){
             var cr = child.getBoundingClientRect();
             if (cr.top!=0 || cr.right!=0 || cr.width != 0 || cr.height != 0){
                 console_log += (child.tagName+' -> x:'+cr.top+' y:'+cr.right+' width:'+cr.width+' height:'+cr.height) + '\n';
             }
             if (child.hasChildNodes()) {
                 examineTree(child);
             }
         }
     }
 }

 var domElm = document.querySelector('html');
 examineTree(domElm); 
 cef_js_func(console_log);