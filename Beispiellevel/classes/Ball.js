class Ball extends Block {
  constructor(world, attributes, options) {
    super(world, attributes, options);
  }

  addBody() {
    this.body = Matter.Bodies.circle(this.attributes.x, this.attributes.y, this.attributes.r, this.options);
  }
}
