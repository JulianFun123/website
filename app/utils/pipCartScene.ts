import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { trackPoint, nearestTrackPoint, type BuiltTrack } from '~~/shared/cart/tracks'
import { CART_COLOURS, type CartRace, type CartRacer } from '~~/shared/cart/race'

export function createPipCartScene(canvas: HTMLCanvasElement, track: BuiltTrack) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  const scene = new THREE.Scene(),
    moon = track.config.theme === 'moon',
    rain = track.config.theme === 'rain'
  const background = moon ? '#30364d' : rain ? '#e0e9e6' : '#e9eddf'
  scene.background = new THREE.Color(background)
  scene.fog = new THREE.Fog(background, 100, 260)
  const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 360)
  scene.add(
    new THREE.HemisphereLight(
      moon ? '#e5def7' : '#fff6dd',
      moon ? '#74718b' : '#a6b591',
      moon ? 2.3 : 2.1,
    ),
  )
  const light = new THREE.DirectionalLight(moon ? '#e5dff6' : '#fff0cd', moon ? 2 : 3.3)
  light.position.set(-45, 90, 30)
  light.castShadow = true
  light.shadow.mapSize.set(2048, 2048)
  Object.assign(light.shadow.camera, {
    left: -75,
    right: 75,
    top: 75,
    bottom: -75,
    near: 1,
    far: 190,
  })
  light.shadow.normalBias = 0.05
  scene.add(light)
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>(),
    textures = new Set<THREE.Texture>()
  const mat = (colour: string) => {
    const m = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.88 })
    materials.add(m)
    return m
  }
  const paper = mat('#fff9e7'),
    ink = mat('#565448'),
    sand = mat('#cdbb95'),
    cream = mat('#eddfb7'),
    grass = mat(moon ? '#77758f' : '#b9cba5')
  function mesh(
    geo: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D,
    x = 0,
    y = 0,
    z = 0,
  ) {
    geometries.add(geo)
    const obj = new THREE.Mesh(geo, material)
    obj.position.set(x, y, z)
    obj.castShadow = true
    obj.receiveShadow = true
    parent.add(obj)
    return obj
  }
  function box(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    r = 0.08,
  ) {
    return mesh(
      new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 4, h / 4, d / 4)),
      material,
      parent,
      x,
      y,
      z,
    )
  }
  function ribbon(width: number, material: THREE.Material, offset: number) {
    const positions: number[] = [],
      uvs: number[] = [],
      indices: number[] = [],
      n = track.samples.length
    for (let i = 0; i <= n; i++) {
      const p = track.samples[i % n]!
      for (const side of [-1, 1]) {
        positions.push(
          p.x + ((p.tz * width) / 2) * side,
          p.y + offset,
          p.z - ((p.tx * width) / 2) * side,
        )
        uvs.push(side === -1 ? 0 : 1, i / 10)
      }
    }
    for (let i = 0; i < n; i++) {
      const a = i * 2,
        b = a + 1,
        c = a + 2,
        d = a + 3
      indices.push(a, c, b, b, c, d)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    return mesh(geo, material, scene)
  }
  if (!moon)
    mesh(
      new THREE.CylinderGeometry(110, 114, 1.3, 64),
      mat(rain ? '#a4c1c3' : '#c9d5b4'),
      scene,
      0,
      -0.75,
      0,
    )
  ribbon(track.config.width + 1, mat(track.config.colour), -0.05)
  ribbon(track.config.width, mat(moon ? '#c6bfd4' : rain ? '#cad8d3' : '#e5dfc9'), 0)
  const curbGeometry = new THREE.BoxGeometry(0.45, 0.18, 0.85)
  geometries.add(curbGeometry)
  const curbMaterial = mat(moon ? '#e6d89f' : '#fff8e5')
  for (let i = 0; i < track.samples.length; i += 3) {
    const p = track.samples[i]!
    for (const side of [-1, 1]) {
      const curb = new THREE.Mesh(curbGeometry, curbMaterial)
      curb.position.set(
        p.x + p.tz * (track.config.width / 2 + 0.1) * side,
        p.y + 0.07,
        p.z - p.tx * (track.config.width / 2 + 0.1) * side,
      )
      curb.rotation.y = Math.atan2(p.tx, p.tz)
      curb.receiveShadow = true
      scene.add(curb)
    }
  }
  if (rain)
    for (let i = 0; i < track.samples.length; i += 18) {
      const p = track.samples[i]!
      box(scene, 0.7, p.y, 0.7, sand, p.x, p.y / 2, p.z)
    }
  const finish = trackPoint(track, 0)
  const source = document.createElement('canvas')
  source.width = 256
  source.height = 64
  const ctx = source.getContext('2d')!
  for (let x = 0; x < 16; x++)
    for (let y = 0; y < 4; y++) {
      ctx.fillStyle = (x + y) % 2 ? '#8b8166' : '#fff9e7'
      ctx.fillRect(x * 16, y * 16, 16, 16)
    }
  const texture = new THREE.CanvasTexture(source)
  textures.add(texture)
  const finishMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 })
  materials.add(finishMat)
  const stripe = mesh(
    new THREE.PlaneGeometry(track.config.width, 2),
    finishMat,
    scene,
    finish.x,
    finish.y + 0.035,
    finish.z,
  )
  stripe.rotation.set(-Math.PI / 2, 0, Math.atan2(finish.tx, finish.tz))
  stripe.castShadow = false
  const arch = new THREE.Group()
  arch.position.set(finish.x, finish.y, finish.z)
  arch.rotation.y = Math.atan2(finish.tx, finish.tz)
  scene.add(arch)
  box(arch, 0.25, 5, 0.25, sand, -track.config.width / 2, 2.5, 0)
  box(arch, 0.25, 5, 0.25, sand, track.config.width / 2, 2.5, 0)
  box(arch, track.config.width + 1, 0.7, 0.3, paper, 0, 5, 0)
  function label(text: string, parent: THREE.Object3D, w: number, h: number) {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 96
    const context = c.getContext('2d')!
    context.fillStyle = '#fff9e8'
    context.fillRect(0, 0, 512, 96)
    context.fillStyle = '#9c8c69'
    context.font = '36px sans-serif'
    context.textAlign = 'center'
    context.fillText(text, 256, 61, 480)
    const t = new THREE.CanvasTexture(c)
    textures.add(t)
    const m = new THREE.SpriteMaterial({ map: t })
    materials.add(m)
    const sprite = new THREE.Sprite(m)
    sprite.scale.set(w, h, 1)
    parent.add(sprite)
    return sprite
  }
  label('PIP’S LITTLE GRAND PRIX', arch, 8, 1.4).position.set(0, 5.05, 0.2)
  const padMat = mat('#e2cd8f')
  for (const progress of track.config.boosts) {
    const p = trackPoint(track, progress)
    const pad = box(scene, track.config.width * 0.8, 0.035, 3, padMat, p.x, p.y + 0.045, p.z, 0.01)
    pad.rotation.y = Math.atan2(p.tx, p.tz)
    for (const z of [-0.8, 0, 0.8]) {
      const chevron = new THREE.Group()
      pad.add(chevron)
      for (const sign of [-1, 1]) {
        const part = box(chevron, 0.1, 0.025, 0.7, paper, sign * 0.2, 0.03, z)
        part.rotation.y = sign * 0.55
      }
    }
  }
  const treeGeo = new THREE.IcosahedronGeometry(2, 1),
    trunkGeo = new THREE.CylinderGeometry(0.18, 0.3, 2, 7)
  geometries.add(treeGeo)
  geometries.add(trunkGeo)
  for (let i = 0; i < 70; i++) {
    const angle = i * 2.399963,
      radius = 15 + Math.sqrt(i / 70) * 70,
      x = Math.cos(angle) * radius,
      z = Math.sin(angle) * radius
    if (nearestTrackPoint(track, x, z).distance < track.config.width / 2 + 4) continue
    if (moon) {
      const cloud = mesh(
        new THREE.SphereGeometry(1, 9, 6),
        mat(i % 2 ? '#9291aa' : '#a29aaf'),
        scene,
        x,
        3 + (i % 5),
        z,
      )
      cloud.scale.set(4 + (i % 3), 1.2, 2.6)
      cloud.castShadow = false
    } else {
      const trunk = new THREE.Mesh(trunkGeo, sand)
      trunk.position.set(x, 0.7, z)
      scene.add(trunk)
      const crown = new THREE.Mesh(treeGeo, grass)
      crown.position.set(x, 3, z)
      crown.scale.set(1, 1.2 + (i % 3) * 0.2, 1)
      crown.castShadow = true
      scene.add(crown)
    }
  }
  if (moon) {
    const moonMesh = mesh(new THREE.SphereGeometry(8, 20, 16), mat('#dfd3ad'), scene, -60, 55, -70)
    moonMesh.castShadow = false
    const stars: number[] = []
    for (let i = 0; i < 130; i++)
      stars.push(Math.sin(i * 7.1) * 150, 40 + (i % 11) * 5, Math.cos(i * 3.7) * 150)
    const geo = new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute(stars, 3),
    )
    geometries.add(geo)
    const m = new THREE.PointsMaterial({ color: '#f1dfac', size: 0.4 })
    materials.add(m)
    scene.add(new THREE.Points(geo, m))
  }
  const actors = new Map<
    number,
    {
      root: THREE.Group
      body: THREE.Group
      wheels: THREE.Group[]
      bubble: THREE.Mesh
      glow: THREE.Mesh
    }
  >()
  function kart(racer: CartRacer) {
    const root = new THREE.Group(),
      body = new THREE.Group()
    root.add(body)
    scene.add(root)
    const paint = mat(CART_COLOURS[racer.colour]!)
    box(body, 1.18, 0.32, 1.65, paint, 0, 0.43, 0, 0.13)
    box(body, 0.94, 0.22, 0.6, paper, 0, 0.53, 0.62)
    box(body, 0.86, 0.45, 0.2, paint, 0, 0.73, -0.5)
    box(body, 1.6, 0.08, 0.34, sand, 0, 0.86, -0.75, 0.03)
    const wheels: THREE.Group[] = []
    for (const x of [-0.65, 0.65])
      for (const z of [-0.55, 0.55]) {
        const pivot = new THREE.Group()
        pivot.position.set(x, 0.27, z)
        body.add(pivot)
        mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.22, 12), ink, pivot).rotation.z = Math.PI / 2
        mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.24, 6), sand, pivot).rotation.z = Math.PI / 2
        wheels.push(pivot)
      }
    const torso = mesh(new THREE.SphereGeometry(0.32, 14, 10), cream, body, 0, 0.91, -0.04)
    torso.scale.set(0.9, 1.3, 0.8)
    for (const [x, y, r] of [
      [-0.18, 1.25, 0.12],
      [0, 1.37, 0.13],
      [0.18, 1.25, 0.12],
    ])
      mesh(new THREE.SphereGeometry(r, 10, 7), cream, body, x, y, 0)
    for (const side of [-1, 1]) {
      mesh(new THREE.SphereGeometry(0.025, 8, 6), ink, body, side * 0.09, 1.13, 0.24).scale.y = 1.6
      mesh(new THREE.SphereGeometry(0.07, 9, 7), cream, body, side * 0.24, 0.9, 0.27)
      mesh(
        new THREE.SphereGeometry(0.04, 8, 6),
        mat('#d8b79d'),
        body,
        side * 0.19,
        1.04,
        0.2,
      ).scale.y = 0.5
    }
    const smile = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.045, 1.02, 0.269),
      new THREE.Vector3(0, 0.995, 0.275),
      new THREE.Vector3(0.045, 1.02, 0.269),
    ])
    mesh(new THREE.TubeGeometry(smile, 6, 0.008, 4, false), ink, body)
    mesh(new THREE.TorusGeometry(0.17, 0.025, 6, 16), ink, body, 0, 0.85, 0.4).rotation.x = -0.5
    const bm = new THREE.MeshBasicMaterial({
      color: '#e6dfbb',
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
    })
    materials.add(bm)
    const bubble = mesh(new THREE.SphereGeometry(1.35, 16, 12), bm, root, 0, 0.65, 0)
    bubble.visible = false
    bubble.castShadow = false
    const gm = new THREE.MeshBasicMaterial({ color: '#e8c979', transparent: true, opacity: 0.65 })
    materials.add(gm)
    const glow = mesh(new THREE.ConeGeometry(0.17, 0.8, 8), gm, body, 0, 0.32, -1.2)
    glow.rotation.x = -Math.PI / 2
    glow.visible = false
    glow.castShadow = false
    return { root, body, wheels, bubble, glow }
  }
  const boxes = new Map<number, THREE.Group>()
  const iconSource = document.createElement('canvas')
  iconSource.width = 64
  iconSource.height = 64
  const ic = iconSource.getContext('2d')!
  ic.fillStyle = '#fff4cf'
  ic.fillRect(0, 0, 64, 64)
  ic.fillStyle = '#baa373'
  ic.font = '45px sans-serif'
  ic.textAlign = 'center'
  ic.fillText('?', 32, 49)
  const iconTexture = new THREE.CanvasTexture(iconSource)
  textures.add(iconTexture)
  const itemMat = new THREE.MeshStandardMaterial({
    map: iconTexture,
    roughness: 0.5,
    transparent: true,
    opacity: 0.88,
  })
  materials.add(itemMat)
  const boxGeo = new THREE.BoxGeometry(1.1, 1.1, 1.1)
  geometries.add(boxGeo)
  const dynamic = new Map<string, THREE.Group>(),
    freePuddles: THREE.Group[] = [],
    freePlanes: THREE.Group[] = []
  function dynamicModel(kind: 'puddle' | 'plane') {
    const root = new THREE.Group()
    scene.add(root)
    if (kind === 'puddle') {
      const pool = mesh(new THREE.SphereGeometry(1, 14, 7), mat('#a3c5c9'), root)
      pool.scale.set(1.6, 0.045, 1.25)
    } else {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(
          [0, 0.1, 1, -0.65, 0, -0.6, 0, 0.2, -0.2, 0, 0.1, 1, 0, 0.2, -0.2, 0.65, 0, -0.6],
          3,
        ),
      )
      geo.computeVertexNormals()
      const m = new THREE.MeshStandardMaterial({ color: '#f5e7bd', side: THREE.DoubleSide })
      materials.add(m)
      mesh(geo, m, root)
    }
    return root
  }
  const chase = new THREE.Vector3(),
    look = new THREE.Vector3(),
    goal = new THREE.Vector3(),
    lookGoal = new THREE.Vector3()
  let cameraReady = false,
    disposed = false
  function resize() {
    const rect = canvas.getBoundingClientRect()
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false)
    camera.aspect = rect.width / Math.max(1, rect.height)
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()
  function draw(race: CartRace | null, dt: number, time: number) {
    if (disposed) return
    for (const actor of actors.values()) actor.root.visible = !!race
    if (!race) for (const model of boxes.values()) model.visible = false
    for (const racer of race?.racers ?? []) {
      let actor = actors.get(racer.id)
      if (!actor) {
        actor = kart(racer)
        actors.set(racer.id, actor)
      }
      actor.root.position.set(racer.x, racer.y + 0.08, racer.z)
      actor.root.rotation.y =
        racer.yaw +
        (racer.spinUntil > (race?.elapsed ?? 0)
          ? (racer.spinUntil - race!.elapsed) * Math.PI * 5
          : 0)
      actor.body.rotation.z = Math.sin(time * 8) * 0.008 + (racer.wasDrifting ? 0.08 : 0)
      for (const wheel of actor.wheels) wheel.rotation.x += (racer.speed * dt) / 0.27
      actor.bubble.visible = racer.shieldUntil > race!.elapsed || racer.rescueUntil > race!.elapsed
      actor.glow.visible = racer.boostUntil > race!.elapsed || racer.drift > 0.55
      actor.glow.scale.y = 0.7 + Math.sin(time * 35) * 0.2
    }
    for (const boxState of race?.boxes ?? []) {
      let model = boxes.get(boxState.id)
      if (!model) {
        model = new THREE.Group()
        model.add(new THREE.Mesh(boxGeo, itemMat))
        scene.add(model)
        boxes.set(boxState.id, model)
      }
      const p = trackPoint(track, boxState.progress, boxState.lane)
      model.position.set(p.x, p.y + 1.1 + Math.sin(time * 2 + boxState.id) * 0.15, p.z)
      model.rotation.set(0.1, time * 0.6, 0.1)
      model.visible = boxState.readyAt <= race!.elapsed
    }
    const alive = new Set<string>()
    for (const [kind, objects] of [
      ['puddle', race?.hazards ?? []],
      ['plane', race?.planes ?? []],
    ] as const)
      for (const object of objects) {
        const key = `${kind}-${object.id}`
        alive.add(key)
        let model = dynamic.get(key)
        if (!model) {
          model = (kind === 'puddle' ? freePuddles : freePlanes).pop() ?? dynamicModel(kind)
          dynamic.set(key, model)
        }
        model.visible = true
        model.position.set(object.x, object.y + (kind === 'puddle' ? 0.05 : 0.35), object.z)
        if (kind === 'plane' && race) {
          const target = race.racers[(object as { target: number }).target]!
          model.rotation.y = Math.atan2(target.x - object.x, target.z - object.z)
        }
      }
    for (const [key, model] of dynamic)
      if (!alive.has(key)) {
        model.visible = false
        dynamic.delete(key)
        ;(key.startsWith('puddle') ? freePuddles : freePlanes).push(model)
      }
    const pip = race?.racers[0]
    if (pip) {
      goal.set(pip.x - Math.sin(pip.yaw) * 6.7, pip.y + 3.65, pip.z - Math.cos(pip.yaw) * 6.7)
      lookGoal.set(pip.x + Math.sin(pip.yaw) * 3, pip.y + 1.05, pip.z + Math.cos(pip.yaw) * 3)
      if (!cameraReady || chase.distanceTo(goal) > 25) {
        chase.copy(goal)
        look.copy(lookGoal)
        cameraReady = true
      } else {
        chase.lerp(goal, 1 - Math.exp(-7 * dt))
        look.lerp(lookGoal, 1 - Math.exp(-9 * dt))
      }
      camera.position.copy(chase)
      camera.lookAt(look)
      const fov = pip.boostUntil > race!.elapsed ? 77 : 68
      camera.fov = THREE.MathUtils.lerp(camera.fov, fov, 1 - Math.exp(-5 * dt))
      camera.updateProjectionMatrix()
    } else {
      cameraReady = false
      camera.position.set(Math.sin(time * 0.06) * 88, moon ? 66 : 49, Math.cos(time * 0.06) * 88)
      camera.lookAt(0, moon ? 12 : 0, 0)
    }
    renderer.render(scene, camera)
  }
  function dispose() {
    disposed = true
    observer.disconnect()
    for (const geo of geometries) geo.dispose()
    for (const material of materials) material.dispose()
    for (const texture of textures) texture.dispose()
    renderer.dispose()
  }
  return { draw, dispose }
}
