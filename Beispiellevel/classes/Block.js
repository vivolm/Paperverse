class Block extends BlockCore {
  constructor(world, attributes, options, drawPoint) {
    super(world, attributes, options, drawPoint);
    this.collisions = [];
    this.constraints = [];
  }

  draw() {
    if (this.body) {
      this.update();
      if (this.attributes.color || this.attributes.stroke) {
        super.draw();
      }
    }
  }

  update() {
    this.collisions.forEach((block) => {
      if (block.attributes.force) {
        Matter.Body.applyForce(this.body, this.body.position, block.attributes.force);
      }
      if (block.attributes.trigger) {
        block.attributes.trigger(this, block);
      }
    });
    this.collisions = [];
  }

  drawSprite() {
    const pos = this.body.position;
    const angle = this.body.angle;
    push();
    translate(pos.x, pos.y);
    rotate(angle);
    imageMode(CENTER);
    image(this.attributes.image, this.offset.x, this.offset.y, this.attributes.image.width * this.attributes.scale, this.attributes.image.height * this.attributes.scale);
    pop();
  }
}
