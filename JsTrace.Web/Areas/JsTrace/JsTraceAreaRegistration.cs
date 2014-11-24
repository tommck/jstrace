using System.Web.Mvc;

namespace JsTrace.Web.Areas.JsTrace
{
    public class JsTraceAreaRegistration : AreaRegistration
    {
        public override string AreaName
        {
            get
            {
                return "JsTrace";
            }
        }

        public override void RegisterArea(AreaRegistrationContext context)
        {
            context.MapRoute(
                "JsTrace_default",
                "{controller}/{action}/{id}",
                new { action = "Index", id = UrlParameter.Optional },
                new { controller = "JsTrace" } // get rid of the Area/Controller, just use Controller
            );
        }
    }
}
