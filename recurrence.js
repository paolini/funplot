function recurrenceSequence(func, x, n) {
    r = [];
    r.push(x);
    for (var i=0; i<n-1; ++i) {
    	var y=func(x);
    	if (!isFinite(y) || Math.abs(y)>10E10) break;
    	x = y;
    	r.push(x);
    }
    return r;
}

function recurrenceWeb (plot, sequence) {
    plot.ctx.strokeStyle = "rgb(0,0,0)";
    plot.ctx.beginPath();
    plot.moveTo(sequence[0], 0);
    for (var i=0; i<sequence.length-1; ++i) {
    	var x = sequence[i];
    	var y = sequence[i+1]
    	if (Math.abs(y) > 10E4) break;
    	plot.lineTo(x, y);
    	plot.lineTo(y, y);
    }
    plot.ctx.stroke()
    plot.ctx.strokeStyle = "rgb(255,0,0)";
    plot.ctx.fillStyle = "rgb(50,50,50)";
    for (var i=0; i<sequence.length; ++i) {
    	plot.drawPoint(sequence[i], 0);
    	if (i<10) {
    	    plot.drawText(sequence[i], 0, i+1);
    	}
    }
}

////////////////////////

function id(x) {return x;}

var expr = "cos(x)";
var compiled_expr;
var plot;
var a_0 = 5.0;

function expr_f(x) {
    return compiled_expr.eval({"x": x});
}

function fill_table(table_id, sequence) {
    $("#"+table_id+" tr").remove();
    for (var i=0; i<sequence.length; i++) {
	$("#"+table_id).append("<tr><td>a(" + (i+1) + ")</td><td>" + sequence[i] + "</td></tr>");
    }

}

function draw(sequence) {
    var canvas = $("#canvas")[0];
    if (null==canvas || !canvas.getContext) return;

    plot.setCanvas(canvas);

    plot.ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );
    plot.show();
    plot.ctx.strokeStyle = "rgb(66,44,255)";
    plot.ctx.lineWidth = 2;
    funGraph(plot, expr_f);
    plot.ctx.strokeStyle = "rgb(200,200,0)";
    funGraph(plot, id);
    plot.ctx.strokeStyle = "rgb(0,0,0)";
    plot.ctx.lineWidth = 1;
    recurrenceWeb(plot, sequence);
}

function update() {
    $("#a0").html(""+a_0);
    expr = $("#expr").val();
    try {
      compiled_expr = math.compile(expr);
    } catch(e) {
      alert(e);
      return;
    }
    $("#formula").html('$$\\begin{cases}a_1=' + a_0 + '\\\\a_{n+1}=' + math.parse(expr.replace(/x/g,'a_n')).toTex() + '\\end{cases}$$');
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);

    var sequence = recurrenceSequence(expr_f, a_0, 100);
    draw(sequence);
    fill_table("table", sequence);
    var reference = plot.getReference();
    var params = {
    	"expr": expr,
    	"a": a_0.toFixed(4),
      "r": reference.radius.toFixed(3),
      "x": reference.xCenter.toFixed(3),
      "y": reference.yCenter.toFixed(3),
    }
    setLocationHash(params);
}

$(function() {
    console.log("recurrence, manu-fatto, https://github.com/paolini/recurrence/")

    params = get_querystring_params();

    if (params['expr']) {
        $("#expr").val(params['expr']);
    }

    if (params['scale'] != undefined) {
        // obsolete params
        // keep for backward compatibility

        if (params['x'] != undefined) {
    	      params.a = params['x'];
        }

        var scale=80;
        var xoff=0;
        var yoff=0;

        if (params['scale'] != undefined) {
    	     scale = parseFloat(params['scale']);
        }

        if (params['xoff'] != undefined) {
    	     xoff = parseFloat(params['xoff']);
        }

        if (params['yoff'] != undefined) {
    	     yoff = parseFloat(params['yoff']);
        }

        params.r = "" + (Math.sqrt(320*320 + 240*240) / scale);
        params.x = "" + xoff;
        params.y = "" + yoff;
    }
    if (params['a'] != undefined) {
        a_0 = parseFloat(params['a']);
    }
    plot = newPlotFromParams(params);

    $("#expr").keyup(function(event) {
        if (event.keyCode == 13)
            update();
    });

    $("#draw").click(function() {
        update();
    });

    $("#canvas").on("mousemove",function(event) {
      	var coords = plot.mouse_coords(event);
      	$("#x").html(""+coords.x);
      	$("#y").html(""+coords.y);
    });

    $("#canvas").on("mousedown",function(event) {
        var coords = plot.mouse_coords(event);
    	  a_0 = coords.x;
    	  update();
    });

    // if mousewheel is moved
    $("#canvas").mousewheel(function(e, delta) {
      if (!plot) return;
    	var coords = plot.mouse_coords(e);
    	// determine the new scale
    	var factor = 1.04
    	if (delta < 0) factor = 1.0/factor
      plot.zoom(factor, coords.x, coords.y);
    	update();
    	return false;
    });

    update();
});
