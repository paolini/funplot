const levelPanel = {
  template:
    '<div class="panel">' +
    '<div v-if="active" class="options_pane">' +
    'color <colorpicker v-model="plot_color" />' +
    '<label><input v-model="fill" type="checkbox">fill with levels</label>' +
    '<div>' +
    ' f(x,y) <input v-model="expr" class="expr"> ' +
    '<span v-if="zero"> = 0 </span>' +
    '<span v-html="expr_compilation_error"></span>' +
    '<br /> ' +
    '</div>' +
    '<span v-for="z in levels">{{ z | round }}</span>' +
    '<button v-if="!zero && levels.length" @click="clear">clear levels</button>' +
    '<span v-if="!zero && levels.length==0">(click on picture to plot level curves)</span>' +
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
      levels: [],
      fill: true,
      active: true,
      plot_color: {hex: "#4A90E2"},
     }
  },
  props: {
    zero: false
  },
  filters: {
    round: function(value) {
      return math.format(value, {precision: 2});
    }
  },
  watch: {
    expr: function() {this.update()},
    fill() {this.$parent.draw_to_canvas()},
    plot_color: function() {this.$parent.draw_to_canvas()},
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
      this.formula_html = '$$ f(x,y) = ' + math.parse(this.expr.replace(/y/g,'y')).toTex() + (this.zero?'=0$$': '$$');
      this.$nextTick(function() {
        MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
      });
      this.$parent.draw_to_canvas();
    },
    draw: function(plot) {
      var f;
      var that = this;
      var options = {fill: true};

      f = function (x, y) {
        return that.compiled_expr.eval({'x': x, 'y': y});
      };

      plot.ctx.lineWidth = 1;
      plot.ctx.strokeStyle = this.plot_color.hex;

      levelPlot(plot, f, this.zero?[0.0]:levels, options);
    },
    edit: function() {
      this.$parent.$children.forEach(function(child) {
        child.active = false;
      });
      this.active = true;
    },
    click: function(coords) {
      if (this.compiled_expr) {
        var z = this.compiled_expr.eval({'x': x, 'y': y});
        this.levels.push(z);
        this.update();
      }
    },
    clear: function() {
      this.levels = [];
      this.update();
    }
  },
  created() {
    this.expr = "x^2 + y^2 - 1";
  }
}

Vue.component("levelPanel", levelPanel);
const LevelPanel = Vue.extend(levelPanel);

function levelPlot(plot, f, levels, options) {
  var xmin = plot.x_pixel(0);
  var ymin = plot.y_pixel(plot.height);
  var xmax = plot.x_pixel(plot.width);
  var ymax = plot.y_pixel(0);
  const pixel_eps = 10 * plot.radius / Math.sqrt(plot.width*plot.width + plot.height*plot.height);
  const L = 50 * pixel_eps;

  var squares = [{}];
  // list of squares. Only add: index is identifier
  // index 0 is invalid

  function sign_change(z0, z1) {
      return (z0< 0.0 && z1 >= 0.0) || (z0>= 0.0 && z1 < 0.0);
  }

  function find_adjacent(square, j, t) {
    // find the smallest children
    // of the adjacent square containing
    // the point in direction j parametrized
    // with t starting from 0.0 to 1.0 in
    // counter-clockwise direction
    var square_n = square.adjacent[j];
    console.assert(square_n < squares.length);
    if (square_n === 0) return square_n;
    var adjacent = squares[square_n];
    j = (j+2)%4; // direction relative to adjacent
    t = 1.0 - t; // parameterization relative to adjacent
    if (adjacent.depth < square.depth) {
      // compute parameter t in adjacent larger square
      var x = square.x;
      var y = square.y;
      var x0 = adjacent.x0;
      var y0 = adjacent.y0;
      var l0 = adjacent.l;
      var l = square.l;
      t *= l/l0; // rescale parameterization
      // parameterization offset
      t += [y-y0,x0+l0-x-l,y0+l0-y-l,x-x0][j]/adjacent.l;
      if (t<0.0) {
        console.assert(t>-0.01);
        t=0.0;
      } else if (t>1.0) {
        console.assert(t<1.1);
        t=1.0
      };
    }
    var square = adjacent; // work on adjacent square
    while(square.children[0] !== 0) {
      if (t<0.5) {
        t *= 2.0;
        square_n = square.children[(j+3)%4];
      } else {
        t = (t-0.5) * 2.0;
        square_n = square.children[j];
      }
      square = squares[square_n];
    }
    return square_n;
  }

  function set_refine(square) {
    if (square.children[0]) { // non-terminal
      console.assert(square.flag === 0);
      return;
    }
    if (square.l <= pixel_eps) { // sufficiently small
      console.assert(square.flag === 0);
      return;
    }
    if (square.flag) return; // already set
    for (var j=0;j<4;++j) {
      if (sign_change(square.z[(j+3)%4],square.z[j])) {
        square.flag = 1;
        if (square.adjacent[j]) {
          var adjacent = find_adjacent(square, j, 0.5);
          if (adjacent.depth < square.depth) {
            adjacent.flag = 1;
          }
        }
      }
    }
  }

  function check_z(square) {
    var x = square.x;
    var y = square.y;
    var l = square.l;
    for (var k=0;k<4;++k) {
      console.assert(Math.abs(square.z[k]-f(x+[l,0.0,0.0,l][k],y+[l,l,0.0,0.0][k]))<0.001);
    }
  }

  function refine(square) {
    var first = squares.length;
    var x = square.x;
    var y = square.y;
    var l = 0.5*square.l;
    var center_z = f(x+ l, y+l);
    var mid_z = [f(x+2.0*l,y+l), f(x+l,y+2.0*l), f(x,y+l), f(x+l,y)];
    for (var j=0;j<4;++j) {
      var child = {};
      console.assert(!square.children[j]);
      child.x = x + [1.0,0.0,0.0,1.0][j] * l;
      child.y = y + [1.0,1.0,0.0,0.0][j] * l;
      child.depth = square.depth + 1;
      child.l = l;
      child.adjacent = [
        j==1?first+0:(j==2?first+3:square.adjacent[0]),
        j==2?first+1:(j==3?first+0:square.adjacent[1]),
        j==3?first+2:(j==0?first+1:square.adjacent[2]),
        j==0?first+3:(j==1?first+2:square.adjacent[3])];
      // it is possible that adjacent is larger and has children
      // which are closer to this square
      child.children = [0,0,0,0];
      child.flag = 0;
      // reuse already computed z-values
      child.z = [0.0, 0.0, 0.0, 0.0];
      child.z[j] = square.z[j];
      child.z[(j+1)%4] = mid_z[(j+1)%4];
      child.z[(j+2)%4] = center_z;
      child.z[(j+3)%4] = mid_z[j];

      if (true) { // debugging
        check_z(child);
      }

      console.assert(squares.length == first + j)
      squares.push(child);
      square.children[j] = first + j;
    }
  }

  function zero_interpolation(square, j) {
    // assume on side j of square there is a sign change
    // return the coordinates of the point on the side
    // where the linear interpolation is zero
    var z0 = square.z[(j+3)%4];
    var z1 = square.z[j];
    // (1-t) * z0 + t * z1 = 0.0
    // t * (z1-z0) + z0 = 0.0
    var t = z0 / (z0-z1);
    var x0 = square.x + (j<2?square.l:0.0);
    var x1 = square.x + (j==0 || j==3 ? square.l:0.0);
    var x = (1.0 - t)*x0 + t*x1;
    var y0 = square.y + (j==0 || j==3 ? square.l:0.0);
    var y1 = square.y + (j<2?square.l:0.0);
    var y = (1.0 - t)*y0 + t*y1;
    return [x,y,t];
  }

  function find_direction(flag) {
    // return first 1-bit in flag
    var k;
    for (k=0;k<4 && !(flag & (1<<k));++k);
    return k;
  }

  function other_direction(flag, j) {
    // find a direction bit in flag which
    // is different from j and preferring opposite to j
    var k = (j+2)%4;
    if (flag & (1<<k)) return k;
    k = (j+1)%4;
    if (flag & (1<<k)) return k;
    k = (k+3)%4;
    if (flag & (1<<k)) return k;
    return 4;
  }

  // step 1. Construct equal squares of side L

  var square_south = 0;
  var square_west = 0;
  var first_square_in_row = 0;

  for (var y = ymin; y<ymax-L; y += L) {
    square_south = first_square_in_row;
    first_square_in_row = squares.length;
    square_west = 0;
    for (var x = xmin; x<xmax-L; x += L) {
      var square = {}; // new square
      var n = squares.length; // identifier of new square
      square.x = x; // left side
      square.y = y; // lower side
      square.depth = 0; // depth in hierarchy
      square.l = L; // side length l = L / 2^depth
      square.adjacent = [0,0,0,0]; // E, N, W, S adjacent squares
      square.children = [0,0,0,0]; // NE, NW, SW, SE internal subdivision
      square.flag = 0; // flag used during refinement & drawing
      square.z = [0.0,0.0,0.0,0.0]; // value of function in vertices: NE, NW, SW, SE
      square.z[0] = f(x+L,y+L); // NE
      if (square_west) {
        square.adjacent[2] = square_west; // W
        squares[square_west].adjacent[0] = n; // E
        square.z[1] = squares[square_west].z[0]; // NW
        square.z[2] = squares[square_west].z[3]; // SW
      } else {
        square.z[1] = f(x,y+L);
        square.z[2] = square_south ? squares[square_south].z[1] : f(x,y); // NW
      }
      square_west = n;
      if (square_south) {
        square.adjacent[3] = square_south; // S
        squares[square_south].adjacent[1] = n;
        square.z[3] = squares[square_south].z[0]; // SE
        square_south ++;
      } else {
        square.z[3] = f(x+L,y);
      }
      console.assert(squares.length == n);
      squares.push(square);
      if (true) check_z(square);
    }
  }

  // step 2: refinement
  while(true) {
    // step 2a. identify squares which need refining
    // using square.flag and assuming it is initially 0
    var terminate = true;
    for (var n=1; n<squares.length; ++n) {
        // the following function sets the flag
        // of the given square and maybe also adjacent ones
        set_refine(squares[n]);
        if (squares[n].flag) terminate = false;
    }
    if (terminate) break; // no square needs refinement

    // step 2b. refine squares which need to be refined
    for (var n=1; n<squares.length; ++n) {
      if (squares[n].flag) {
        refine(squares[n]);
        squares[n].flag = 0;
      }
    }
  }

  // step 3. draw curve loops
  // three type of squares:
  // empty: squares with no sign_change, nothing to do
  // regular: squares with two sign_changes, have a curve edge
  // node: squares with four sign_changes, have a node
  // in nodes we need to remember which edeges have already been drawn

  // step 3a: set flag bits to identify which edeges
  // of each square have a change of sign

  for (var n=1; n<squares.length; ++n) {
    var square = squares[n];
    square.flag = 0;
    if (square.children[0]) continue; // non terminal
    for (var j=0;j<4;++j) {
      if (sign_change(square.z[(j+3)%4],square.z[j])) {
          square.flag |= (1<<j);
      }
    }
  }

  // step 3b: draw level lines
  for (var n=1;n<squares.length;++n) {
    var square = squares[n];
    while (square.flag !== 0) {
      // find a direction with sign change
      var j = find_direction(square.flag);
      console.assert(j<4);
      // find another direction preferring opposite
      var k = other_direction(square.flag, j);
      // start curve from point in direction j
      var startxyt = zero_interpolation(square, j);
      var xyt = startxyt;
      plot.ctx.beginPath();
      plot.moveTo(xyt[0], xyt[1]);
      square.flag &= ~(1<<j);
      // draw first edge towards direction k, if applicable
      if (k!==j) {
        xyt = zero_interpolation(square, k);
        plot.lineTo(xyt[0], xyt[1]);
        square.flag &= ~(1<<k);
      }
      // start wandering in direction k
      var m = find_adjacent(square,k,xyt[2]);
      while (m !== 0) {
          square = squares[m];
          var k = (k+2)%4;
          square.flag &= ~(1<<k);
          var kk = other_direction(square.flag, k);
          if (kk < 4) {
            k = kk;
            xyt = zero_interpolation(square, k);
            plot.lineTo(xyt[0], xyt[1])
            square.flag &= ~(1<<k);
            m = find_adjacent(square,k,xyt[2]);
          } else {
            if (m==n) plot.ctx.closePath();
            m = 0;
          }
      }
      plot.ctx.stroke();
    }
  }
}
