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
      if (this.attributes.image) {
        this.drawSprite();
      }
      if (this.constraints.length > 0) {
        for (let c of this.constraints) {
          if (c.draw === true) this.drawConstraint(c);
        }
      }
    }
  }

  drawConstraints() {
    if (this.constraints.length > 0) {
      for (let c of this.constraints) {
        this.drawConstraint(c);
      }
    }
  }

  drawConstraint(constraint) {
    if (constraint.color) {
      stroke(constraint.color);
    } else {
      stroke("magenta");
    }
    strokeWeight(2);
    const offsetA = constraint.pointA;
    let posA = {
      x: 0,
      y: 0,
    };
    if (constraint.bodyA) {
      posA = constraint.bodyA.position;
    }
    const offsetB = constraint.pointB;
    let posB = {
      x: 0,
      y: 0,
    };
    if (constraint.bodyB) {
      posB = constraint.bodyB.position;
    }
    if (constraint.image) {
      push();
      translate(this.body.position.x, this.body.position.y);
      const angle = Math.atan2(posB.y + offsetB.y - (posA.y + offsetA.y), posB.x + offsetB.x - (posA.x + offsetA.x));
      rotate(angle + Math.PI / 2);
      imageMode(CENTER);
      image(constraint.image, this.offset.x, this.offset.y, constraint.image.width * this.attributes.scale, constraint.image.height * this.attributes.scale);
      pop();
    } else {
      line(posA.x + offsetA.x, posA.y + offsetA.y, posB.x + offsetB.x, posB.y + offsetB.y);
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

  constrainTo(block, options) {
    options.bodyA = this.body;
    if (block) {
      // constrain to another block
      if (!options.bodyB) {
        options.bodyB = block.body;
      }
    } else {
      // constrain to "background" scene
      if (!options.pointB) {
        options.pointB = {
          x: this.body.position.x,
          y: this.body.position.y,
        };
      }
    }
    const constraint = Matter.Constraint.create(options);
    this.constraints.push(constraint);
    Matter.World.add(this.world, constraint);
    return constraint;
  }

  removeConstraint(constraint) {
    const idx = this.constraints.indexOf(constraint);
    if (idx > -1) {
      this.constraints.splice(idx, 1);
      Matter.World.remove(world, constraint);
    }
  }

  collideWith(block) {
    if (block && !this.collisions.includes(block)) {
      this.collisions.push(block);
    }
  }

  rotate(rotation, point, updateVelocity) {
    const body = this.body;
    if (!point) {
      Matter.Body.setAngle(body, rotation, updateVelocity);
    } else {
      const currentRotation = body.angle;
      const delta = rotation - currentRotation;
      const cos = Math.cos(delta),
        sin = Math.sin(delta),
        dx = body.position.x - point.x,
        dy = body.position.y - point.y;

      Matter.Body.setPosition(
        body,
        {
          x: point.x + (dx * cos - dy * sin),
          y: point.y + (dx * sin + dy * cos),
        },
        updateVelocity
      );

      Matter.Body.setAngle(body, rotation, updateVelocity);
    }
  }

  rotateBy(rotation, point, updateVelocity) {
    const body = this.body;
    if (!point) {
      Matter.Body.setAngle(body, body.angle + rotation, updateVelocity);
    } else {
      const cos = Math.cos(rotation),
        sin = Math.sin(rotation),
        dx = body.position.x - point.x,
        dy = body.position.y - point.y;

      Matter.Body.setPosition(
        body,
        {
          x: point.x + (dx * cos - dy * sin),
          y: point.y + (dx * sin + dy * cos),
        },
        updateVelocity
      );

      Matter.Body.setAngle(body, body.angle + rotation, updateVelocity);
    }
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
