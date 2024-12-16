class Mouse {
  constructor(engine, canvas, attributes) {
    this.attributes = attributes || { stroke: "magenta", strokeWeight: 2 };
    this.mouse = Matter.Mouse.create(canvas.elt);
    const mouseOptions = {
      mouse: this.mouse,
      constraint: {
        stiffness: 0.05,
        angularStiffness: 0,
      },
    };
    this.mouseConstraint = Matter.MouseConstraint.create(engine, mouseOptions);
    this.mouseConstraint.mouse.pixelRatio = window.devicePixelRatio;

    Matter.World.add(engine.world, this.mouseConstraint);
  }

  on(eventName, action) {
    Matter.Events.on(this.mouseConstraint, eventName, action);
  }

  setOffset(offset) {
    Matter.Mouse.setOffset(this.mouse, offset);
  }

  draw() {
    push();
    stroke(this.attributes.stroke);
    strokeWeight(this.attributes.strokeWeight);
    this.drawMouse();
    pop();
  }

  drawMouse() {
    if (this.mouseConstraint.body) {
      const pos = this.mouseConstraint.body.position;
      const offset = this.mouseConstraint.constraint.pointB;
      const m = this.mouseConstraint.mouse.position;
      line(pos.x + offset.x, pos.y + offset.y, m.x, m.y);
    }
  }
}
