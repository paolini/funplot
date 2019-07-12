const graphPanel = {
  data: function() {
    return {
      expr: "",
      formula_html: "...",
      compiled_expr: null,
      expr_compilation_error: "",
      active: true
     }
  },
  watch: {
    expr: function() {this.update()},
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
      this.formula_html = '$$y = ' + math.parse(this.expr).toTex() + '$$';
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
        return that.compiled_expr.eval({'x': x});
      }

      plot.ctx.strokeStyle = "rgb(66,44,255)";
      funGraph(plot, f);
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
    if (this.expr === "") this.expr = "x*sin(1/x)";
  },
  template:
    '<div class="panel">' +
    '<div class="options_pane" v-if="active">' +
    '  y(x) = <input v-model="expr" class="expr"> <span v-html="expr_compilation_error"></span>' +
    '</div>' +
    '<div class="options_pane" v-else>' +
    '<br/><button @click="edit">edit</button>' +
    '</div>' +
    '<p class="formula_pane" @click="edit" v-html="formula_html"></p>' +
    '</div>'
}

Vue.component("graphPanel", graphPanel);
const GraphPanel = Vue.extend(graphPanel);

function funGraph(plot, func) {
  var ref = plot.getReference();
  var eps = 2.0*(ref.xMax - ref.xMin)/ref.widthPx;

  plot.ctx.beginPath();

  var x = ref.xMin;
  var y = func(x);
  plot.moveTo(x,y);
  var dx = eps;
  var count = 0;
  while(x<ref.xMax) {
    var xx = x+dx;
    var yy = func(xx);
    var dy = Math.abs(yy - y);
    if (dy > eps*100) {
      plot.moveTo(xx,yy);
      y = yy;
      x = xx;
    } else if (dy < eps || dx < eps*0.01) {
      plot.lineTo(xx, yy);
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
