Vue.component('colorpicker', {
	components: {
		'sketch-picker': VueColor.Sketch,
	},
	template:
		'<div class="color_button" ref="colorpicker" :style="\'background-color: \' + color.hex" @click="toggle">' +
		'<sketch-picker style="position: absolute" v-model="color" v-if="show" />' +
    '</div>',
	props: ['value'],
	data() {
		return {
			show: false,
      color: {hex: "#000"}
		}
	},
  mounted() {
    this.color = this.value;
  },
	methods: {
		toggle() {
			this.show = !this.show;
		},
  },
	watch: {
		color(val) {
			if(val) {
				this.$emit('input', val);
				//document.body.style.background = val;
			}
	  }
	}
});
