vueApp = {
  el: '#app',
  data: function() {
    return {
      x: "?",
      y: "?",
      new_plot: "",
      plot: null,
      canvas: null
      }
    },
  watch: {
    new_plot: function(val) {
      var panel;
      if (val === "") {
        return; // deselected!
      } else if (val === "ode_equation") {
        panel = new OdePanel({
          parent: this,
          propsData: {system: false}});
      } else if (val === "ode_system") {
        panel = new OdePanel({
          parent: this,
          propsData: {system: true}});
      } else {
        throw("unexpected new_plot value " + val);
      }
      if (panel) {
        panel.$mount();
        this.$refs.plots.appendChild(panel.$el);
      }
      this.new_plot = "";
    }
  },
  methods: {
    mousemove: function(event) {
      var coords = this.plot.mouse_coords(event);
      this.x = coords.x;
      this.y = coords.y;
    },
    mouseclick: function(event) {
      var coords = this.plot.mouse_coords(event);
      this.$children.forEach(function(panel){
        panel.click(coords);
      });
    },
    draw: function(plot) {
      plot.clear();
      plot.drawAxes();
      this.$children.forEach(function(panel) {
        panel.draw(plot);
      });
    },
    draw_to_canvas: function() {
      var canvas = this.$refs.canvas;
      var bottom = this.$refs.bottom;
      canvas.height = bottom.offsetTop - canvas.offsetTop;
      canvas.width = window.innerWidth - 10;
      this.plot.setCanvas(canvas);
      this.draw(this.plot);
    }
  },
  mounted: function() {
    var that = this;
    this.plot = new Plot({
      xCenter: 0.0,
      yCenter: 0.0,
      radius: Math.sqrt(320*320 + 240*240) / 80
    });
    this.plot.setCanvas(this.$refs.canvas);
    this.draw_to_canvas();
  },
  template:
    '<div class="panel">' +
    ' <div ref="plots">' +
    ' </div>' +
    '  <select v-model="new_plot">' +
    '    <option disabled value="">new plot (select type)</option>' +
    '    <option value="ode_equation">ODE equation</option>' +
    '    <option value="ode_system">ODE system</option>' +
    '  </select>' +
    ' <br />' +
    '  x=<span v-html="x">...</span>, y=<span v-html="y">...</span><br />' +
    '<p>(Click on the picture to draw an integral line. Mouse wheel (or pan) to zoom in/out. Use zoom out/in to translate)</p> ' +
    '<canvas @mousemove="mousemove" @mousedown="mouseclick" ref="canvas" width="640" height="480"></canvas>' +
    '<p id="bottom" ref="bottom"> ' +
    '  <button>PDF export</button>' +
    '  Source on <a href="https://github.com/paolini/recurrence/">github</a> ' +
    '</p>' +
    '</div>'
};

window.addEventListener('load', function() {
  var app = new Vue(vueApp);
});
