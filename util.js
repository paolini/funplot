function get_querystring_params() {
    // adapted from http://stackoverflow.com/a/2880929/1221660
    var urlParams = {};
    var match,
  	pl = /\+/g,  // Regex for replacing addition symbol with a space
  	search = /([^&=]+)=?([^&]*)/g,
  	decode = function (s) {
  	    return decodeURIComponent(s.replace(pl, " "));
  	};
    var query = window.location.hash.substring(1);
    if (query == "") {
      // be backward compatible: previously the querystring was used
      // now the hash part (which doesn't require reloading)
      query = window.location.search.substring(1);
    }

    while (match = search.exec(query)) {
    	urlParams[decode(match[1])] = decode(match[2]);
    }
    return urlParams;
}

function newPlotFromParams(params) {
    var reference = {
      xCenter: 0.0,
      yCenter: 0.0,
      radius: Math.sqrt(320*320 + 240*240) / 80
    };

    if (params['r']) reference.radius = parseFloat(params['r']);
    if (params['x']) reference.xCenter = parseFloat(params['x']);
    if (params['y']) reference.yCenter = parseFloat(params['y']);

    plot = new Plot(reference);
    return plot;
}

function setLocationHash(params) {
    var hash = "#";
    var sep = "";
    for (key in params) {
    	hash += sep + key + "=" + encodeURIComponent(params[key]);
    	sep = "&";
    }
    history.replaceState(undefined, undefined, hash);
}
