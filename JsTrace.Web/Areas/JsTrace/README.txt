To use this, add this at the bottom of your Master Page or Razor Layout file:

Depending on your syntax: 
	<%: Html.RenderJsTraceProxy() %>
or 
    @Html.RenderJsTraceProxy()


This will create a somewhat minified version of this:

 <script type="text/javascript">	Trace.setCallback(function(m, l) { 		var a = Array.prototype.slice.apply(arguments).slice(2); 		var o = { module: m, level: l, message: a.join(' ') };		if (Trace.shouldTrace(m, l)) {					$.ajax({ 				cache: false, 				dataType: 'json', 				type: 'POST', 				data: window.JSON.stringify(o), 				contentType: 'application/json; 				charset=utf-8', url: '/JsTrace'			});		}	}	,true	,0);</script>