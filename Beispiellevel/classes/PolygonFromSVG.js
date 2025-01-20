class PolygonFromSVG extends Block {
  constructor(world, attributes, options) {
    super(world, attributes, options);
    this.attributes.sample = this.attributes.sample || 10;
    Common.setDecomp(decomp);
  }

  addBody() {
    // set values for restitution calculation before constructing body
    this.restitutionScale = 0.6; // 1 equals no scaling, anything below decreases the restitution
    this.minMass = 1;
    this.maxMass = 80;

    if (this.attributes.fromVertices) {
      // use list of vertices/points
      this.addBodyVertices(this.attributes.fromVertices);
    } else {
      if (this.attributes.fromPath) {
        // use a path provided directly
        let vertices = Matter.Svg.pathToVertices(this.attributes.fromPath, this.attributes.sample);
        this.addBodyVertices(vertices);
      } else {
        if (this.attributes.fromId) {
          // use a path of SVG embedded in current HTML page
          let path = document.getElementById(this.attributes.fromId);
          if (null != path) {
            let vertices = Matter.Svg.pathToVertices(path, this.attributes.sample);
            this.addBodyVertices(vertices);
          }
        } else {
          // use a path in separate SVG file
          if (this.attributes.sync) {
            const request = new XMLHttpRequest();
            request.open("GET", this.attributes.fromFile, false); // `false` makes the request synchronous
            request.send(null);
            const response = request.responseText;
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(response, "image/svg+xml");
            const path = svgDoc.querySelector("path");
            let vertices = Matter.Svg.pathToVertices(path, this.attributes.sample);
            this.addBodyVertices(vertices);
            Matter.World.add(this.world, [this.body]);
            if (this.attributes.done) {
              this.attributes.done(this, true);
            }
          } else {
            let that = this;
            httpGet(this.attributes.fromFile, "text", false, function (response) {
              const parser = new DOMParser();
              const svgDoc = parser.parseFromString(response, "image/svg+xml");
              const path = svgDoc.querySelector("path");
              let vertices = Matter.Svg.pathToVertices(path, that.attributes.sample);
              that.addBodyVertices(vertices);
              Matter.Composite.add(that.world, [that.body]);
              if (that.attributes.done) {
                that.attributes.done(that, false);
              }
            });
          }
        }
      }
    }
    this.setRestitution();
  }

  addBodyVertices(vertices) {
    if (decomp.isSimple(vertices)) {
      decomp.makeCCW(vertices);
      vertices = decomp.decomp(vertices);
    } else {
      console.log("Drawing is intersecting");
    }
    this.body = Matter.Bodies.fromVertices(
      0,
      0,
      Matter.Vertices.scale(vertices, this.attributes.scale, this.attributes.scale),
      this.options,
      0.15,
      0.2
    );
    if (this.body) {
      if (this.attributes.x !== undefined) {
        Matter.Body.setPosition(this.body, this.attributes);
      } else {
        Matter.Body.setPosition(this.body, this.getCenter(vertices));
      }
      if (this.attributes.image) {
        this.offset = {
          x:
            this.offset.x +
            (this.attributes.image.width / 2) * this.attributes.scale -
            (this.body.position.x - this.body.bounds.min.x),
          y:
            this.offset.y +
            (this.attributes.image.height / 2) * this.attributes.scale -
            (this.body.position.y - this.body.bounds.min.y),
        };
      }
    } else if (this.attributes.fromPath) {
      console.log("Simplifying this path to make it work", this.attributes.fromPath);
    }
  }

  getCenter(vertices) {
    let min = { x: 999999, y: 999999 };
    let max = { x: -999999, y: -999999 };
    vertices.forEach((v, _) => {
      min.x = min.x > v.x ? v.x : min.x;
      min.y = min.y > v.y ? v.y : min.y;
      max.x = max.x < v.x ? v.x : max.x;
      max.y = max.y < v.y ? v.y : max.y;
    });
    return {
      x: min.x + (this.body.position.x - this.body.bounds.min.x),
      y: min.y + (this.body.position.y - this.body.bounds.min.y),
    };
  }

  setRestitution() {
    let mass = this.body.mass;
    let clampedMass = Math.max(this.minMass, Math.min(mass, this.maxMass));
    let restitution =
      (1 - (clampedMass - this.minMass) / (this.maxMass - this.minMass)) *
      Math.max(0, Math.min(this.restitutionScale, 1));
    this.body.restitution = restitution;
  }
}
