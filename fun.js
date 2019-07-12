vueApp = {
  el: '#app',
  data: function() {
    return {
      x: "?",
      y: "?",
      new_plot: "",
      plot: null,
      canvas: null,
      drag_start: null,
      dragged: false
      }
    },
  watch: {
    new_plot: function(val) {
      var panel;
      if (val === "") {
        return; // deselected!
      } else if (val === "graph") {
        panel = new GraphPanel({parent: this});
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
        this.$children.forEach(function(child) {
          child.active = false;
        });
        this.$refs.plots.appendChild(panel.$el);
        panel.active = true;
      }
      this.new_plot = "";
    }
  },
  methods: {
    mouseclick: function(event) {
      var coords = this.plot.mouse_coords(event);
      this.$children.forEach(function(panel){
        if (panel.active)  panel.click(coords);
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
    var canvas = this.$refs.canvas;
    this.plot.setCanvas(canvas);
    this.draw_to_canvas();
    window.addEventListener("resize", this.draw_to_canvas);

    canvas.addEventListener("mousedown", function(evt) {
      document.body.style.mozUserSelect =
      document.body.style.webkitUserSelect =
      document.body.style.userSelect = 'none';
      that.drag_start = that.plot.mouse_coords(evt);
      that.dragged = false;
    }, false);

    canvas.addEventListener("mousemove", function(evt) {
      var pos = that.plot.mouse_coords(evt);
      if (that.drag_start) {
        that.plot.translate(that.drag_start.x-pos.x, that.drag_start.y-pos.y);
        // pos = that.plot.mouse_coords(evt);
        // that.drag_start = pos;
        that.draw_to_canvas();
        that.dragged = true;
      }
      that.x = pos.x;
      that.y = pos.y;
    }, false);

    canvas.addEventListener("mouseup", function(evt) {
      var pos = that.plot.mouse_coords(evt);
      if (!that.dragged) { // it's a drag not click!
        that.$children.forEach(function(panel){
          if (panel.active)  panel.click(pos);
        });
      }
      that.dragged = false;
      that.drag_start = null;
    }, false);

    var handleScroll = function(evt) {
      var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
      if (delta) {
        var coords = that.plot.mouse_coords(evt);
        var factor = Math.exp(delta/40);
        that.plot.zoom(factor, coords.x, coords.y);
        that.draw_to_canvas();
      }
      return evt.preventDefault() && false;
    }
    canvas.addEventListener('DOMMouseScroll',handleScroll,false);
    canvas.addEventListener('mousewheel',handleScroll,false);
  },
  template:
    '<div class="fun">' +
    ' <div class="panels" ref="plots">' +
    ' </div>' +
    '  <select v-model="new_plot">' +
    '    <option disabled value="">new plot (select type)</option>' +
    '    <option value="graph">graph</option>' +
    '    <option value="ode_equation">ODE equation</option>' +
    '    <option value="ode_system">ODE system</option>' +
    '  </select>' +
    ' <br />' +
    '  x=<span v-html="x">...</span>, y=<span v-html="y">...</span><br />' +
    '<canvas ref="canvas" width="640" height="480"></canvas>' +
    '<p id="bottom" ref="bottom"> ' +
    '  <button>PDF export</button>' +
    '  Source on <a href="https://github.com/paolini/recurrence/">github</a> ' +
    '</p>' +
    '</div>'
};

window.addEventListener('load', function() {
  var app = new Vue(vueApp);
});