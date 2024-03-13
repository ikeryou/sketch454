import { BufferAttribute, Color, DoubleSide, Mesh, ShaderMaterial, Shape, ShapeGeometry, Texture, Vector2, Vector3 } from "three"
import { MyObject3D } from "../webgl/myObject3D"
import { Util } from "../libs/util";
import { MousePointer } from "../core/mousePointer";
import { Func } from "../core/func";
import { ItemShader } from "../glsl/itemShader";

export class Item extends MyObject3D {

  private _mesh: Array<Mesh> = []
  private _center: Vector2 = new Vector2()

  constructor(_id:number, v0:Vector2, v1:Vector2, v2:Vector2, tex: Texture) {
    super()

    this._c = _id * 0.5

    const center = this._getCenter(v0, v1, v2)
    this._center.set(center.x, center.y)

    const newV0 = v0.clone()
    const newV1 = v1.clone()
    const newV2 = v2.clone()

    const num = 3
    for(let i = 0; i < num; i++) {
      const shape = new Shape();

      if(i === 0) {
        // 三角形
        shape.moveTo(newV0.x, newV0.y);
        shape.lineTo(newV1.x, newV1.y);
        shape.lineTo(newV2.x, newV2.y);
        shape.lineTo(newV0.x, newV0.y);
      } else {
        const div = 20
        const radius = center.r * Util.map(i, 1, Util.random(0.1, 0.8), 1, num - 1) * 1
        for(let l = 0; l < div; l++) {
          const rad = Util.radian(360 / div * l)
          const x = center.x + Math.sin(rad) * radius
          const y = center.y + Math.cos(rad) * radius
          if(l == 0) {
            shape.moveTo(x, y);
          } else {
            shape.lineTo(x, y);
          }
        }
      }

      const geo = new ShapeGeometry(shape);

      const num2 = geo.attributes.position.count;
      const imgpoint = new Float32Array(num2 * 3)
      const areaSizeFix = 0.5; // ここが固定
      let i2 = 0
      while(i2 < num2) {
        const baseP = new Vector3(
          geo.attributes.position.array[i2*3+0],
          geo.attributes.position.array[i2*3+1],
          geo.attributes.position.array[i2*3+2]
        );

        imgpoint[i2*3+0] = ((baseP.x * 1 + areaSizeFix) * 0.5) / areaSizeFix;
        imgpoint[i2*3+1] = ((baseP.y * 1 + areaSizeFix) * 0.5) / areaSizeFix;
        imgpoint[i2*3+2] = 0;

        i2++
      }
      geo.setAttribute('imgpoint', new BufferAttribute(imgpoint, 3));

      const m = new Mesh(
        geo,
        new ShaderMaterial({
          vertexShader:ItemShader.vertexShader,
          fragmentShader:ItemShader.fragmentShader,
          transparent:true,
          depthTest:false,
          side:DoubleSide,
          uniforms:{
            tDiffuse:{value:tex},
            rate:{value: 0},
            col:{value: new Color(0x000000).offsetHSL(Util.random(0.4, 0.7), 1, 0.5)},
            colRate:{value: (i != 0 && Util.hit(10) ? 1 : 0)},
            noise:{value: i == 0 && !Util.hit(10) ? -0.5 : Util.random(0.9, 1.25)},
            screenSize:{value: new Vector2()},
          },
        })
      )
      this.add(m)
      this._mesh.push(m)
    }

    this._resize()
  }


  // ---------------------------------
  // 更新
  // ---------------------------------
  protected _update():void {
    super._update()

    const sw = Func.sw()
    const sh = Func.sh()

    const center = new Vector2(
      this._center.x * sw * 0.5,
      this._center.y * sh * 0.5
    )

    const mx = MousePointer.instance.normal.x * sw * 0.5
    const my = MousePointer.instance.normal.y * sh * -0.5
    let d = center.distanceTo(new Vector2(mx, my))
    d = Math.pow(d, 1.2)

    const area = Math.max(sw,sh) * 1

    const s = Util.map(d, 1.25, 1, 0, area)
    this.scale.set(s, s, s)

    const noise = 0.00
    const noiseOffset = Util.map(d, 1, 0, 0, area)
    const noiseX = Util.range(noise) * noiseOffset
    const noiseY = Util.range(noise) * noiseOffset

    const range = Util.map(d, 1, 0, 0, area) * 0.0015
    this.position.x = range * (mx - this._center.x) * -1 + noiseX
    this.position.y = range * (my - this._center.y) * -1 + noiseY

    // d = center.distanceTo(new Vector2(mx, my)) * 2
    this._mesh.forEach((m) => {
      const uni = this._getUni(m)
      uni.rate.value = Util.map(d * 2, 2, 0, 0, area)
      uni.screenSize.value.set(sw, sh)
    })
  }

  //
  private _getCenter(pA:Vector2, pB:Vector2, pC:Vector2):any {
    const a = pB.distanceTo(pC)
    const b = pC.distanceTo(pA)
    const c = pA.distanceTo(pB)

    const p = a + b + c

    const x = (a * pA.x + b * pB.x + c * pC.x) / p
    const y = (a * pA.y + b * pB.y + c * pC.y) / p

    const s = p / 2
    const r = Math.sqrt((s - a) * (s - b) * (s - c) / s)

    const max = 0

    return {
        x:x,
        y:y,
        r:r,
        isSoto:(a > max || b > max || c > max)
    }
  }
}