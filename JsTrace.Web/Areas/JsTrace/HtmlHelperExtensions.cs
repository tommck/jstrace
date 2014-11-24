using System.Text;
using System.Web.Mvc;

namespace System.Web.Mvc
{
    public static class HtmlHelperExtensions
    {
        /// <summary>
        /// This renders the JavaScript needed to proxy the JsTrace messages to this controller
        /// </summary>
        /// <param name="sendAllMessages">
        /// (Default: false) Whether or not to send ALL messages. 
        /// <para>NOT recommended in Production environment.</para>
        /// <para>By Default, it will send only configured messages by checking the switch setting first</para>
        /// </param>
        /// <returns>a JavaScript tag setting up JsTrace proxy ajax calls to send messages to the server</returns>
        public static MvcHtmlString RenderJsTraceProxy(this HtmlHelper helper, bool sendAllMessages = false, bool synchronous = false)
        {
            // grab the url helper by context
            var urlHelper = new UrlHelper(helper.ViewContext.RequestContext);

            string url = urlHelper.Action("Index", "JsTrace");
            StringBuilder script = new StringBuilder("<script type=\"text/javascript\">");
            script.Append(@"if (typeof Trace === 'undefined') { throw new Error('Trace.js has not been included!'); }");
            script.Append(@"Trace.setCallback(function(m, l) { var a = Array.prototype.slice.apply(arguments).slice(2); ");

            if (sendAllMessages == false)
            {
                // BEGIN if
                script.Append(@"if (Trace.shouldTrace(m, l)) {");
            }

            // create the data object
            script.AppendLine(@"var o = { module: m, level: l, message: a.join(' ') };");
            // fire away (async, no success/failure)
            script.AppendFormat("$.ajax({{ {1}cache: false, dataType: 'json', type: 'POST', data: window.JSON.stringify(o), contentType: 'application/json; charset=utf-8', url: '{0}'}});", url, (synchronous == true) ? "async: false," : string.Empty);

            if (sendAllMessages == false)
            {
                // END if
                script.Append("}");
            }

            // finish the setCallback call (force all messages, no history)
            script.Append(@"},true,0);");

            script.Append("</script>");

            return MvcHtmlString.Create(script.ToString());
        }

    }
}