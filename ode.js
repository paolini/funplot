const odePanel = {
  data: function() {
    return {
      expr: "",
      expr_x: "",
      expr_y: "",
      formula_html: "...",
      compiled_expr: null,
      compiled_expr_x: null,
      compiled_expr_y: null,
      draw_slope: false,
      draw_arrows: true,
      points: [] }
  },
  props: {
    system: true
  },
  watch: {
    expr_x: function() {this.update()},
    expr_y: function() {this.update()},
    expr: function() {this.update()}
  },
  methods: {
    update: function() {
      if (this.system) {
        try {
          this.compiled_expr_x = math.compile(this.expr_x);
          this.compiled_expr_y = math.compile(this.expr_y);
        } catch(e) {
          alert(e);
          return;
        }
        this.formula_html = '$$\\begin{cases}'
        + 'x\' = ' + math.parse(this.expr_x).toTex() + '\\\\'
        + 'y\' = ' + math.parse(this.expr_y).toTex()
        + '\\end{cases}$$';
      } else { // equation
        try {
          this.compiled_expr = math.compile(this.expr);
        } catch(e) {
          alert(e);
          return;
        }
        this.formula_html = '$$y\' = ' + math.parse(this.expr.replace(/y/g,'y')).toTex() + '$$';
      }
      this.$nextTick(function() {
        MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
      });
      this.$parent.draw_to_canvas();
    },
    draw: function(plot) {
      var fx, fy;
      var that = this;

      if (this.system) {
        fx = function (x, y) { return that.compiled_expr_x.eval({'x': x, 'y': y});};
        fy = function (x, y) { return that.compiled_expr_y.eval({'x': x, 'y': y});};
      } else {
        fx = function (x, y) { return 1.0; };
        fy = function (x, y) { return that.compiled_expr.eval({'x': x, 'y': y});}
      }

      plot.ctx.lineWidth = 2;
      plot.ctx.strokeStyle = "rgb(200,200,0)";
      if (this.draw_slope)
          slopeGraph(plot, fx, fy);
      plot.ctx.lineWidth = 1;
      plot.ctx.strokeStyle = "rgb(66,44,255)";
      options = {draw_arrows: this.system, equation: !this.system};
      for (var i=0; i<this.points.length; ++i) {
          odePlot(plot, fx, fy, this.points[i].x, this.points[i].y, options);
      }
    },
    click: function(coords) {
      this.points.push(coords);
      this.update();
    },
    clear: function() {
      this.points = [];
      this.update();
    }
  },
  created() {
    if (this.system) {
      if (this.expr_x === "") this.expr_x = "y";
      if (this.expr_y === "") this.expr_y = "-sin(x)-y";
    } else {
      if (this.expr === "") this.expr = "y^2+x";
    }
  },
  template:
    '<div class="odepanel">' +
    '<button @click="update">update</button>' +
    '<input v-model="draw_slope" type="checkbox">draw slope field' +
    '<button @click="clear">clear integral lines</button>' +
    '<div v-if="system">' +
    '  x\'(x,y) = <input v-model="expr_x" class="expr"> <br /> ' +
    '  y\'(x,y) = <input v-model="expr_y" class="expr"> ' +
    '</div>' +
    '<div v-else>' +
    '  y\'(x) = <input v-model="expr" class="expr">' +
    '</div>' +
    '<p v-html="formula_html"></p>' +
    '</div>'
}

Vue.component("odePanel", odePanel);
const OdePanel = Vue.extend(odePanel);

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
    draw_to_canvas();

    function round(x) {
      return math.format(x, {precision: 3});
    }

    point_string = "";
    for (var i=0; i<points.length; ++i) {
      if (i>0) point_string += "_";
      point_string += "" + round(points[i].x) + "_" + round(points[i].y);
    }

    var reference = plot.getReference();
    var params = {
    	"r": round(reference.radius),
      "x": round(reference.xCenter),
      "y": round(reference.yCenter),
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

function ode_init() {
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
      var separator = '_';
      if (params['points'].includes(" ")) separator = ' ';  // for backward compatibility
      var l = params['points'].split('_');
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
    });

    setCanvasEvents();

    $(window).resize(update);

    update();
}
