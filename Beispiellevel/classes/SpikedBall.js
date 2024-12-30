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
    });

    Matter.Body.setCentre(this.body, { x: this.circleBody.position.x, y: this.circleBody.position.y });
  }

  createSpikes(spikeCount) {
    this.spikes = []; // Initialize spikes array
    const spikeAngle = (Math.PI * 2) / spikeCount;

    // Define spike dimensions based on the circle's radius
    const spikeLength = this.attributes.r * 0.6; // Length of the spike (1.5 times the radius)
    const spikeWidth = this.attributes.r * 0.2; // Width of the spike (10% of the radius)

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
          isStatic: true, // Make spikes dynamic
          //   collisionFilter: {
          //     group: -1, // Optional: Set a collision group if needed
          //   },
        }
      );

      // Translate the spike to its base position
      Matter.Body.setPosition(spike, { x: baseX, y: baseY });

      if (!(i >= 6 && i <= 8)) {
        this.spikes.push(spike); // Add spike to the spikes array
      }

      //   Matter.Composite.add(compBody, spike); // Add spike to the compound body
    }
    return this.spikes;
  }

  draw() {
    super.draw();
    this.drawSpikes();
  }

  drawSpikes() {
    stroke(255, 0, 0); // Color for spikes
    fill(255, 0, 0); // Fill color for spikes
    for (const spike of this.spikes) {
      const { vertices } = spike; // Get the vertices of the spike

      beginShape();
      for (const v of vertices) {
        vertex(v.x, v.y);
      }
      endShape(CLOSE); // Close the shape to form a triangle
    }
  }
}
