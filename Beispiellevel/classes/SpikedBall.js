class SpikedBall extends Ball {
  constructor(world, attributes, options, drawPoint) {
    super(world, attributes, options, drawPoint);
  }

  addBody() {
    this.circleBody = Matter.Bodies.circle(this.attributes.x, this.attributes.y, this.attributes.r, this.options);
    const spikeCount = 12;
    this.spikeBodies = this.createSpikes(spikeCount);

    this.body = Matter.Body.create({
      parts: [this.circleBody, ...this.spikeBodies],
      isStatic: true,
      label: this.options.label,
    });

    Matter.Body.setCentre(this.body, {
      x: this.circleBody.position.x,
      y: this.circleBody.position.y,
    });
  }

  createSpikes(spikeCount) {
    this.spikes = [];
    const spikeAngle = (Math.PI * 2) / spikeCount;

    // Define spike dimensions based on the circle's radius
    const spikeLength = this.attributes.r * 0.6;
    const spikeWidth = this.attributes.r * 0.2;

    for (let i = 0; i < spikeCount; i++) {
      const angle = spikeAngle * i;
      const baseX = this.circleBody.position.x + this.attributes.r * Math.cos(angle);
      const baseY = this.circleBody.position.y + this.attributes.r * Math.sin(angle);
      const tipX = this.circleBody.position.x + (this.attributes.r + spikeLength) * Math.cos(angle);
      const tipY = this.circleBody.position.y + (this.attributes.r + spikeLength) * Math.sin(angle);

      // Create a triangle for the spike
      const spike = Matter.Bodies.fromVertices(
        tipX,
        tipY,
        [
          { x: 0, y: 0 }, // Tip of the spike
          { x: -spikeWidth, y: spikeLength }, // Bottom left of the triangle
          { x: spikeWidth, y: spikeLength }, // Bottom right of the triangle
        ],
        {
          angle: angle + Math.PI / 2,
          isStatic: true,
        }
      );

      // Translate the spike to its base position
      Matter.Body.setPosition(spike, { x: baseX, y: baseY });

      if (i >= 7 && i <= 10) {
        this.spikes.push(spike);
      }
    }
    return this.spikes;
  }

  draw() {
    super.draw();
    this.drawSpikes();
  }

  drawSpikes() {
    stroke(0);
    for (const spike of this.spikes) {
      const { vertices } = spike;

      beginShape();
      for (const v of vertices) {
        vertex(v.x, v.y);
      }
      endShape(CLOSE);
    }
  }
}
