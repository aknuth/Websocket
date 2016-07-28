window.onload = function() {
    var script = document.createElement("script");
    script.src = "js/jquery.min.js";
    script.onload = script.onreadystatechange = function() {
      $(document).ready(function() {
        $("#lst-ib").val("Hello, World!");
      });
    };
    document.body.appendChild(script);
};
