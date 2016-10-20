var ___selector = ''
document.addEventListener("focus", function(event){
var element = event.target;
___selector = OptimalSelect.select(element);
console.log(___selector); 
},true);
document.addEventListener("blur", function(){
___selector = '';
console.log('no ___selector');
},true);