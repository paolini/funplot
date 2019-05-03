var expr = "";
var expr_x = "";
var expr_y = "";
var system = true;
var compiled_expr, compiled_expr_x, compiled_expr_y;
var plot;
var draw_slope;
var draw_arrows=true;

var points = [];

function slopeGraph(plot, fx, fy) {
  var xmin = plot.x_pixel(0);
  var ymin = plot.y_pixel(plot.height);
  var xmax = plot.x_pixel(plot.width);
  var ymax = plot.y_pixel(0);
  var gridx = (xmax - xmin)/40;
  var gridy = gridx;
  var h = 0.3 * gridx;

  for (var x=xmin + 0.5*gridx; x < xmax; x+=gridx) {
    for (var y=ymin + 0.5*gridy; y < ymax; y+=gridy) {
        var dx = fx(x, y);
        var dy = fy(x, y);
        var s = h/Math.sqrt(dx*dx + dy*dy);
        plot.ctx.beginPath();
        plot.moveTo(x, y);
        var xx = x + s*dx;
        var yy = y + s*dy;
        plot.lineTo(xx, yy);
        plot.ctx.stroke();
        if (draw_arrows) plot.drawArrowHead(xx,yy, dx,dy);
    }
  }
}

function odePlot(plot, fx, fy, x0, y0, options) {
  var xmin = plot.x_pixel(0);
  var ymin = plot.y_pixel(plot.height);
  var xmax = plot.x_pixel(plot.width);
  var ymax = plot.y_pixel(0);
  const dt = plot.radius / Math.sqrt(plot.width*plot.width + plot.height*plot.height);
  //const dt = plot.radius/plot.width;
  var arrow_step = 80;
  const draw_arrows = options &&  options.draw_arrows;
  const equation = options && options.equation;

  for (dir=1;dir>=-1;dir-=2) {
    var maxstep = plot.width;
    var x = x0;
    var y = y0;
    var arrows = [];
    plot.ctx.beginPath();
    plot.moveTo(x, y);
    for (var step=0;x<=xmax && x>=xmin && y<=ymax && y>=ymin && (step < maxstep || equation); step++) {
      var dx = fx(x, y);
      var dy = fy(x, y);
      var l = dt / Math.sqrt(dx*dx + dy*dy);
      if (l>2 && !equation) break;
      var r = dir * l;
      xx = x + r * dx;
      yy = y + r * dy;
      dx = 0.5 * (dx + fx(xx,yy));
      dy = 0.5 * (dy + fy(xx,yy));
      x += r * dx;
      y += r * dy;
      plot.lineTo(x, y);
      if (draw_arrows && step % (2*arrow_step) == arrow_step) {
        arrows.push([x, y, dx, dy]);
      }
    }
    plot.ctx.stroke();
    for (var i=0; i<arrows.length; ++i) {
      plot.drawArrowHead(arrows[i][0], arrows[i][1], arrows[i][2], arrows[i][3]);
    }
  }
}

function draw() {
    var fx, fy;

    if (system) {
      fx = function (x, y) { return compiled_expr_x.eval({'x': x, 'y': y});};
      fy = function (x, y) { return compiled_expr_y.eval({'x': x, 'y': y});};
    } else {
      fx = function (x, y) { return 1.0; };
      fy = function (x, y) { return compiled_expr.eval({'x': x, 'y': y});}
    }


    plot.ctx.clearRect (0 ,0 , canvas.width, canvas.height);
    plot.drawAxes();
    plot.ctx.lineWidth = 2;
    plot.ctx.strokeStyle = "rgb(200,200,0)";
    if (draw_slope)
        slopeGraph(plot, fx, fy);
    plot.ctx.lineWidth = 1;
    plot.ctx.strokeStyle = "rgb(66,44,255)";
    options = {draw_arrows: system, equation: !system};
    for (var i=0; i<points.length; ++i) {
        odePlot(plot, fx, fy, points[i].x, points[i].y, options);
    }
}

function draw_to_canvas() {
  var canvas = $("#canvas")[0];
  if (null==canvas || !canvas.getContext) return;

  canvas.height = $("#bottom").offset().top - $("#canvas").offset().top;
  canvas.width = window.innerWidth - 10;

  plot.setCanvas(canvas);

  draw();
}

function draw_to_pdf() {
  var canvas = $("#canvas")[0];
  if (null==canvas || !canvas.getContext) return;

  plot.setPdf(canvas.width/10, canvas.height/10);

  draw();

  plot.ctx.save("out.pdf")

  plot.setCanvas(canvas);
}

function update() {
    if (system) {
      expr_x = $("#expr_x").val();
      expr_y = $("#expr_y").val();
      try {
        compiled_expr_x = math.compile(expr_x);
        compiled_expr_y = math.compile(expr_y);
      } catch(e) {
        alert(e);
        return;
      }
      $("#formula").html('$$\\begin{cases}'
      + 'x\' = ' + math.parse(expr_x) + '\\\\'
      + 'y\' = ' + math.parse(expr_y)
      + '\\end{cases}$$');
    } else { // equation
      expr = $("#expr").val();
      try {
        compiled_expr = math.compile(expr);
      } catch(e) {
        alert(e);
        return;
      }
      $("#formula").html('$$y\' = ' + math.parse(expr.replace(/y/g,'y')).toTex() + '$$');
    }
    MathJax.Hub.Queue(["Typeset",MathJax.Hub]);

    draw_to_canvas();
    point_string = "";
    for (var i=0; i<points.length; ++i) {
      if (i>0) point_string += " ";
      point_string += points[i].x.toFixed(4) + " " + points[i].y.toFixed(4);
    }

    var reference = plot.getReference();
    var params = {
    	"r": reference.radius.toFixed(3),
      "x": reference.xCenter.toFixed(3),
      "y": reference.yCenter.toFixed(3),
      "points": point_string
    }
    if (draw_slope) {
      params.slope = 1;
    }
    if (system) {
      params.fx = expr_x;
      params.fy = expr_y;
    } else {
      params.f = expr;
    }
    setLocationHash(params);
}

$(function() {
    console.log("ode plot, manu-fatto, https://github.com/paolini/recurrence/")

    params = get_querystring_params();

    if (params['f']) {
        $("#expr").val(params['f']);
        system = false;
    }

    if (params['fx'] && params['fy']) {
        $("#expr_x").val(params['fx']);
        $("#expr_y").val(params['fy']);
        system = true;
    }

    plot = newPlotFromParams(params);

    if (params['points'] != undefined && params['points'].length>0) {
      var l = params['points'].split(' ');
      points = [];
      for (var i=0; i<l.length/2; ++i) {
        points.push({
          x: parseFloat(l[i*2]),
          y: parseFloat(l[i*2+1])
        });
      }
    }

    $("#select").change(
      function() {
          system = ($("#select").val() == "system");
          if (system) {
            $(".equation").hide();
            $(".system").show();
          } else {
            $(".system").hide();
            $(".equation").show();
          }
          update();
      }
    );

    if (system) {
      $("#select").val("system");
    } else {
      $("#select").val("equation");
    }
    $("#select").change();

    $(".expr").keyup(function(event) {
        if (event.keyCode == 13)
            update();
    });

    $("#draw").click(function() {
        update();
    });

    $("#clear_button").click(function() {
      points = [];
      update();
    });

    $("#pdf_button").click(function() {
      draw_to_pdf();
    });

    if (params['slope']=="1") {
        draw_slope = true;
    } else {
        draw_slope = false;
    }
    $("#draw_slope").prop('checked', draw_slope);
    $("#draw_slope").change(function() {
      draw_slope = $("#draw_slope").is(":checked");
      update();
    });

    $("#canvas").on("mousedown",function(event) {
      if (plot) {
       var coords = plot.mouse_coords(event);
       points.push(coords);
    	 update();
     }
    });

    setCanvasEvents();

    $(window).resize(update);

    update();
});
