class Ball extends Block {
  constructor(world, attributes, options, drawPoint) {
    super(world, attributes, options, drawPoint);
  }

  addBody() {
    this.body = Matter.Bodies.circle(this.attributes.x, this.attributes.y, this.attributes.r, this.options);
  }
}
