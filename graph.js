const graphPanel = {
  template:
    '<div class="panel">' +
    '<div class="options_pane" v-if="active">' +
    '<colorpicker v-model="plot_color" /> ' +
    '<span v-if="inverted">x(y)</span><span v-else>y(x)</span> = <input v-model="expr" class="expr"> <span v-html="expr_compilation_error"></span>' +
    '</div>' +
    '<div class="options_pane" v-else>' +
    '<br/><button @click="edit">edit</button>' +
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
    click: function() {}
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
  var eps = inverted?
    2.0*(ref.yMax - ref.yMin)/ref.heightPx:
    2.0*(ref.xMax - ref.xMin)/ref.widthPx;

  plot.ctx.beginPath();

  var x = inverted?ref.yMin:ref.xMin;
  var y = func(x);
  inverted?plot.moveTo(y,x):plot.moveTo(x,y);
  var dx = eps;
  var count = 0;
  var xend = inverted?ref.yMax:ref.xMax;
  while(x<xend) {
    var xx = x+dx;
    var yy = func(xx);
    if (isNaN(yy)) {
      dx = eps;
      x = xx;
      continue;
    }
    var dy = Math.abs(yy - y);
    if (dy > eps*100) {
      inverted?plot.moveTo(yy,xx):plot.moveTo(xx,yy);
      y = yy;
      x = xx;
    } else if (dy < eps || dx < eps*0.01) {
      inverted?plot.lineTo(yy, xx):plot.lineTo(xx, yy);
      count ++;
      y = yy;
      x = xx;
      if (dy < eps*0.5 && dx < eps) dx *= 2.0;
    } else {
      dx *= 0.5;
    }
  }
  plot.ctx.stroke();
}
