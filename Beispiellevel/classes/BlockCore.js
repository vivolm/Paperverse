class BlockCore {
  constructor(world, attributes, options, drawPoint) {
    this.world = world;
    this.attributes = attributes;
    this.options = options || {};
    this.options.plugin = this.options.plugin || {};
    this.options.plugin.block = this;
    this.offset = this.attributes.offset || { x: 0, y: 0 };
    this.attributes.scale = this.attributes.scale || 1.0;
    this.drawPoint = drawPoint || "CENTER";

    this.addBody();
    if (this.body) {
      Matter.Composite.add(this.world, this.body);
    }
  }

  addBody() {
    if (this.drawPoint === "CORNER") {
      let centerX = this.attributes.x + this.attributes.w / 2;
      let centerY = this.attributes.y + this.attributes.h / 2;
      this.body = Matter.Bodies.rectangle(centerX, centerY, this.attributes.w, this.attributes.h, this.options);
    } else if (this.drawPoint === "CENTER") {
      this.body = Matter.Bodies.rectangle(this.attributes.x, this.attributes.y, this.attributes.w, this.attributes.h, this.options);
    }
  }

  removeBody() {
    Composite.remove(this.world, this.body);
  }

  draw() {
    if (this.body) {
      if (this.attributes.color) {
        fill(this.attributes.color);
      } else {
        noFill();
      }
      if (this.attributes.stroke) {
        stroke(this.attributes.stroke);
        if (this.attributes.weight) {
          strokeWeight(this.attributes.weight);
        }
      } else {
        noStroke();
      }
      this.drawBody();
    }
  }

  drawBody() {
    if (this.body.parts && this.body.parts.length > 1) {
      // skip index 0
      for (let p = 1; p < this.body.parts.length; p++) {
        this.drawVertices(this.body.parts[p].vertices);
      }
    } else {
      if (this.body.type == "composite") {
        for (let body of this.body.bodies) {
          this.drawVertices(body.vertices);
        }
      } else {
        this.drawVertices(this.body.vertices);
      }
    }
  }

  drawVertices(vertices) {
    beginShape();
    for (const vertice of vertices) {
      vertex(vertice.x, vertice.y);
    }
    endShape(CLOSE);
  }
}
