const graphPanel = {
  template:
    '<div class="panel">' +
    '<div class="options_pane" v-if="active">' +
    '<colorpicker v-model="plot_color" /> ' +
    '<span v-if="inverted">x(y)</span><span v-else>y(x)</span> = <input v-model="expr" class="expr"> <span v-html="expr_compilation_error"></span>' +
    '</div>' +
    '<div class="options_pane" v-else>' +
    '<br/><button @click="edit">edit</button>' +
    '<span class="color_button" :style="\'background-color: \' + plot_color.hex"></span>' +
    '</div>' +
    '<p class="formula_pane" @click="edit" v-html="formula_html"></p>' +
    '</div>',
  data: function() {
    return {
      expr: "",
      formula_html: "...",
      compiled_expr: null,
      expr_compilation_error: "",
      active: true,
      plot_color: {hex: "#417505"}
     }
  },
  props: {
    inverted: false
  },
  watch: {
    expr: function() {this.update()},
    plot_color: function() {this.$parent.draw_to_canvas();}
  },
  methods: {
    update: function() {
      this.expr_compilation_error = "";
      try {
        this.compiled_expr = math.compile(this.expr);
      } catch(e) {
        this.expr_compilation_error = "" + e;
        return;
      }
      this.formula_html = (this.inverted?'$$x = ':'$$y = ') + math.parse(this.expr).toTex() + '$$';
      this.$nextTick(function() {
        MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
      });
      this.$parent.draw_to_canvas();
    },
    draw: function(plot) {
      var f;
      var that = this;
      if (!this.compiled_expr) return;
      f = function (x) {
        return that.compiled_expr.eval(
          that.inverted?{'y': x}:{'x': x});
      }
      plot.ctx.strokeStyle = this.plot_color.hex;
      funGraph(plot, f, this.inverted);
    },
    edit: function() {
      this.$parent.$children.forEach(function(child) {
        child.active = false;
      });
      this.active = true;
    },
    click: function() {},
    get_params: function() {
      return {
        t: this.inverted?"graph_inverted":"graph",
        e: this.expr,
        c: this.plot_color.hex
      };
    },
    set_params: function(params) {
      this.expr = params.e;
      this.plot_color.hex = params.c;
      this.update();
    }
  },
  created() {
    if (this.expr === "") {
      this.expr = this.inverted?"y^2":"x*sin(1/x)";
    }
  }
}

Vue.component("graphPanel", graphPanel);
const GraphPanel = Vue.extend(graphPanel);

function funGraph(plot, func, inverted) {
  var ref = plot.getReference();
  var pix = inverted?
    (ref.yMax - ref.yMin)/ref.heightPx:
    (ref.xMax - ref.xMin)/ref.widthPx;

  plot.ctx.beginPath();

  var x = inverted?ref.yMin:ref.xMin;
  var y = func(x);
  var need_move = 1;
  var max_dx = pix;
  var min_dx = pix/10;
  var dx = max_dx;
  var count = 0;
  var xend = inverted?ref.yMax:ref.xMax;
  var ymin = inverted?ref.xMin:ref.yMin;
  var ymax = inverted?ref.xMax:ref.yMax;
  while(x<xend) {
    var xx = x+dx;
    var yy = func(xx);
    if (isNaN(y) || isNaN(yy)) {
      need_move = 1;
    } else if (yy>ymax && y > ymax) {
      need_move = 1;
    } else if (yy<ymin && y < ymin) {
      need_move = 1;
    } else {
      var dy = yy-y;
      if (Math.abs(dy) > pix) {
        // refine dx step
        if (dx > min_dx) {
          dx = 0.5 * dx;
          continue;
        }
      } else {
        if (dx < max_dx) dx = 2.0 * dx;
      }
      var i = 0;
      const ITER=10;
      if (Math.abs(dy)>pix) {
        // use bisection to decide if there is jump discontinuity
        var a = x;
        var b = xx;
        var ya = y;
        var yb = yy;
        var ymid = 0.5*(y+yy);
        for (i=0;i<ITER;++i) {
          var c = 0.5*(a+b);
          var y1 = func(c);
          if (isNaN(y1)) {
            i = ITER;
            break;
          }
          if (Math.abs(y1-ymid) < pix) {
            break;
          }
          if ((ya <= ymid && y1 >= ymid) || (ya>=ymid && y1 <=ymid)) {
            b = c;
            yb = y1;
          } else {
            a = c;
            ya = y1;
          }
        }
      }
      if (i>=ITER) {
        // jump detected
        need_move = 1;
      } else {
        if (need_move) {
          var xxx = x;
          var yyy = y;
          if (y > ymax) {
            yyy = ymax;
            xxx = x + (yyy-y)/(yy-y)*(xx-x);
          } else if (y<ymin) {
            yyy = ymin;
            xxx = x + (yyy-y)/(yy-y)*(xx-x);
          }
          inverted?plot.moveTo(yyy,xxx):plot.moveTo(xxx,yyy);
        }
        if (1) {
          var xxx = x;
          var yyy = y;
          if (yy > ymax) {
            yyy = ymax;
            xxx = xx + (yyy-yy)/(y-yy)*(x - xx);
            need_move = 1;
          } else if (yy < ymin) {
            yyy = ymin;
            xxx = xx + (yyy-yy)/(y-yy)*(x - xx);
            need_move = 1;
          } else {
            need_move = 0;
          }
          inverted?plot.lineTo(yyy, xxx):plot.lineTo(xxx, yyy);
          count ++;
        }
      }
    }
    y = yy;
    x = xx;
  }
  plot.ctx.stroke();
}
