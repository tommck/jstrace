using System;

namespace JsTrace.Web.Areas.JsTrace.Models
{
    [Serializable]
    public class JsTraceMessage
    {
        public string Module { get; set; }
        public string Level { get; set; }
        public string Message { get; set; }

        public override string ToString()
        {
            return string.Format("[{1:5}] Module '{0}' : {2}", this.Module, this.Level, this.Message);
        }
    }
}