function new_svg_elem(elem) {
    return $(document.createElementNS('http://www.w3.org/2000/svg', elem));
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
    	x: evt.clientX - rect.left,
    	y: evt.clientY - rect.top
    };
}

// function plotFunctionGraph(ctx, plot, func) {}

function funGraph(ctx, plot, func) {
    var yy, x, dx=2, x0=plot.x0, y0=plot.y0, scale=plot.scale;
    var iMax = Math.round((ctx.canvas.width-x0)/dx);
    var iMin = Math.round(-x0/dx);
    ctx.beginPath();

    for (var i=iMin;i<=iMax;i++) {
      	x = i*dx/scale;
      	var y = func(x);
      	if (i==iMin || Math.abs(y-yy)>dx*100) {
      	    plot.moveTo(ctx, x, func(x));
      	} else {
            plot.lineTo(ctx, x, func(x));
	      }
      	yy = y;
    }
    ctx.stroke();
}

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
    var querystring = "";
    var sep = "";
    for (key in params) {
    	querystring += sep + key + "=" + encodeURIComponent(params[key]);
    	sep = "&";
    }
    window.location.hash = querystring
}
