class Sizer {
  _ratios = ["4:3", "16:9", "1:1", "1:2"];

  // default options
  _dish = false;
  _conference = false;
  _cameras = 1;
  _margin = 1;
  _aspect = 0;
  _video = false;
  _ratio = 3 / 4;

  constructor(scenary) {
    // parent space to render dish
    this._dish = scenary;
    return this;
  }

  dimensions() {
    this._width = this._dish.offsetWidth - this._margin * 2;
    this._height = this._dish.offsetHeight - this._margin * 2;
  }

  resizer(width) {
    for (var s = 0; s < this._dish.children.length; s++) {
      // camera fron dish (div without class)
      let element = this._dish.children[s];

      // custom margin
      element.style.margin = this._margin + "px";

      // calculate dimensions
      element.style.width = width + "px";
      element.style.height = width * this._ratio + "px";

      // to show the aspect ratio in demo (optional)
      element.setAttribute("data-aspect", this._ratios[this._aspect]);
    }
  }

  resize() {
    // get dimensions of dish
    this.dimensions();

    // loop (i recommend you optimize this)
    let max = 0;
    let i = 1;
    while (i < 5000) {
      let area = this.area(i);
      if (area === false) {
        max = i - 1;
        break;
      }
      i++;
    }

    // remove margins
    max = max - this._margin * 2;

    // set dimensions to all cameras
    this.resizer(max);
  }

  area(increment) {
    let i = 0;
    let w = 0;
    let h = increment * this._ratio + this._margin * 2;
    while (i < this._dish.children.length) {
      if (w + increment > this._width) {
        w = 0;
        h = h + increment * this._ratio + this._margin * 2;
      }
      w = w + increment + this._margin * 2;
      i++;
    }
    if (h > this._height || increment > this._width) return false;
    else return increment;
  }
}
