using System.Diagnostics;
using System.Text;
using System.Web;
using System.Web.Mvc;
using JsTrace.Web.Areas.JsTrace.Models;

namespace JsTrace.Web.Areas.JsTrace.Controllers
{
    public class JsTraceController : Controller
    {
        // POST: /JsTrace/

        /// <summary>
        /// Receives trace messages from client-side JsTrace messages
        /// </summary>
        /// <param name="msg">the msg</param>
        /// <returns>nothing</returns>
        [HttpPost]
        public EmptyResult Index(JsTraceMessage msg)
        {
            Debug.WriteLine("JsTrace >> {0}", msg);

            return new EmptyResult();
        }
    }
}
