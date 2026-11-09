import { WEAPONS, WEAPON_ORDER, WEAPON_PICKUPS, type WeaponId } from '~~/shared/shooter/weapons'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import {
  ARENA_COVER,
  ARENA_LIMIT,
  EYE_HEIGHT,
  PIP_COLOURS,
  type ArenaPlayer,
  type ArenaShot,
  type ArenaSnapshot,
  type ArenaExplosion,
} from '~~/shared/shooter/arena'

export function createPipShooterScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#e9e9dc')
  scene.fog = new THREE.Fog('#e9e9dc', 48, 120)
  const camera = new THREE.PerspectiveCamera(78, 1, 0.05, 170)
  camera.rotation.order = 'YXZ'
  const ambient = new THREE.HemisphereLight('#fff8e1', '#a6b49a', 2.1)
  scene.add(ambient)
  const sun = new THREE.DirectionalLight('#fff1cd', 3)
  sun.position.set(-18, 40, 15)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, {
    left: -38,
    right: 38,
    top: 38,
    bottom: -38,
    near: 0.5,
    far: 100,
  })
  sun.shadow.normalBias = 0.04
  scene.add(sun)
  const materials = new Set<THREE.Material>()
  const geometries = new Set<THREE.BufferGeometry>()
  const textures = new Set<THREE.Texture>()
  const material = (colour: string) => {
    const m = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.9 })
    materials.add(m)
    return m
  }
  const cream = material('#f0e2bf'),
    ink = material('#5d594a'),
    paper = material('#fffaf0'),
    sage = material('#bdc9a4'),
    sand = material('#d9c8a2')
  function mesh(
    geometry: THREE.BufferGeometry,
    mat: THREE.Material,
    parent: THREE.Object3D,
    x = 0,
    y = 0,
    z = 0,
  ) {
    geometries.add(geometry)
    const object = new THREE.Mesh(geometry, mat)
    object.position.set(x, y, z)
    object.castShadow = true
    object.receiveShadow = true
    parent.add(object)
    return object
  }
  function box(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    r = 0.08,
  ) {
    return mesh(
      new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 4, h / 4, d / 4)),
      mat,
      parent,
      x,
      y,
      z,
    )
  }
  const floor = mesh(
    new THREE.BoxGeometry(ARENA_LIMIT * 2, 0.4, ARENA_LIMIT * 2),
    material('#dfe4cf'),
    scene,
    0,
    -0.2,
    0,
  )
  floor.receiveShadow = true
  box(scene, ARENA_LIMIT * 2 + 1, 0.2, ARENA_LIMIT * 2 + 1, paper, 0, -0.48, 0, 0.05)
  box(scene, ARENA_LIMIT * 2 + 1.3, 0.15, ARENA_LIMIT * 2 + 1.3, sand, 0.1, -0.64, 0.12, 0.04)
  const dotPositions: number[] = []
  for (let x = -ARENA_LIMIT + 1; x < ARENA_LIMIT; x += 2)
    for (let z = -ARENA_LIMIT + 1; z < ARENA_LIMIT; z += 2) dotPositions.push(x, 0.009, z)
  const dotGeometry = new THREE.BufferGeometry().setAttribute(
    'position',
    new THREE.Float32BufferAttribute(dotPositions, 3),
  )
  geometries.add(dotGeometry)
  const dotMaterial = new THREE.PointsMaterial({ color: '#b9c4a7', size: 0.04 })
  materials.add(dotMaterial)
  scene.add(new THREE.Points(dotGeometry, dotMaterial))
  box(scene, 3, 0.012, ARENA_LIMIT * 2, material('#e8e6d2'), 0, 0.008, 0, 0.001)
  box(scene, ARENA_LIMIT * 2, 0.012, 3, material('#e8e6d2'), 0, 0.008, 0, 0.001)
  for (const cover of ARENA_COVER) {
    if (cover.kind === 'paper') {
      box(scene, cover.w, cover.h, cover.d, paper, cover.x, cover.h / 2, cover.z)
      for (let i = 1; i < 5; i++)
        box(
          scene,
          cover.w + 0.015,
          0.012,
          cover.d + 0.015,
          sand,
          cover.x,
          (cover.h * i) / 5,
          cover.z,
          0.002,
        )
      box(
        scene,
        cover.w * 0.23,
        0.018,
        cover.d + 0.04,
        material('#d4dbc2'),
        cover.x,
        cover.h + 0.01,
        cover.z,
        0.003,
      )
    } else if (cover.kind === 'album') {
      box(scene, cover.w, cover.h, cover.d, material('#b7c4bc'), cover.x, cover.h / 2, cover.z)
      box(
        scene,
        0.09,
        cover.h - 0.15,
        cover.d - 0.15,
        sand,
        cover.x - cover.w / 2 - 0.02,
        cover.h / 2,
        cover.z,
        0.02,
      )
      box(
        scene,
        0.02,
        0.4,
        0.8,
        paper,
        cover.x - cover.w / 2 - 0.08,
        cover.h * 0.65,
        cover.z,
        0.004,
      )
    } else {
      box(scene, cover.w, cover.h, cover.d, sand, cover.x, cover.h / 2, cover.z)
      box(
        scene,
        cover.w - 0.14,
        0.06,
        cover.d - 0.14,
        material('#aab68f'),
        cover.x,
        cover.h + 0.02,
        cover.z,
      )
      // Foliage stays inside the authoritative cover volume above the rim.
    }
  }
  // A low fence makes the playable boundary legible, without adding invisible cover.
  for (let i = -ARENA_LIMIT; i <= ARENA_LIMIT; i += 3) {
    for (const side of [-1, 1]) {
      box(scene, 0.12, 0.8, 0.12, sand, i, 0.4, side * (ARENA_LIMIT + 0.5), 0.02)
      box(scene, 0.12, 0.8, 0.12, sand, side * (ARENA_LIMIT + 0.5), 0.4, i, 0.02)
    }
  }
  for (const side of [-1, 1]) {
    box(scene, ARENA_LIMIT * 2 + 1, 0.08, 0.08, sand, 0, 0.55, side * (ARENA_LIMIT + 0.5), 0.02)
    box(scene, 0.08, 0.08, ARENA_LIMIT * 2 + 1, sand, side * (ARENA_LIMIT + 0.5), 0.55, 0, 0.02)
  }
  // Paper-cut scenery is outside the arena, so it never changes collision geometry.
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2,
      radius = ARENA_LIMIT + 8 + (i % 3) * 2
    const tree = new THREE.Group()
    tree.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius)
    mesh(new THREE.CylinderGeometry(0.15, 0.22, 1.8, 7), sand, tree, 0, 0.9, 0)
    const crown = mesh(new THREE.IcosahedronGeometry(1.8 + (i % 3) * 0.3, 1), sage, tree, 0, 3, 0)
    crown.scale.y = 1.2
    scene.add(tree)
  }
  function makeWeapon(id: WeaponId, parent: THREE.Object3D) {
    const group = new THREE.Group()
    parent.add(group)
    const tint = material(WEAPONS[id].colour)
    if (id === 'knife') {
      box(group, 0.065, 0.38, 0.018, paper, 0, 0.2, 0, 0.005)
      box(group, 0.1, 0.14, 0.055, sand, 0, -0.055, 0, 0.02)
      box(group, 0.17, 0.025, 0.07, ink, 0, 0.025, 0, 0.005)
      group.rotation.z = -0.25
    } else if (id === 'popper') {
      mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.38, 12), tint, group, 0, 0, -0.07).rotation.x =
        Math.PI / 2
      mesh(new THREE.TorusGeometry(0.12, 0.016, 5, 16), sand, group, 0, 0, -0.265)
      box(group, 0.07, 0.16, 0.07, sand, 0, -0.12, 0.04, 0.02)
    } else {
      box(
        group,
        id === 'sparkler' ? 0.36 : 0.31,
        0.2,
        id === 'longlens' ? 0.34 : 0.24,
        tint,
        0,
        0,
        0,
        0.04,
      )
      box(group, 0.1, 0.1, 0.09, ink, 0, 0.01, -0.17, 0.02)
      const length = id === 'longlens' ? 0.43 : id === 'sparkler' ? 0.25 : 0.05
      mesh(
        new THREE.CylinderGeometry(0.052, 0.052, length, 12),
        ink,
        group,
        0,
        0.01,
        -0.2 - length / 2,
      ).rotation.x = Math.PI / 2
      mesh(
        new THREE.CylinderGeometry(0.047, 0.047, 0.02, 12),
        material('#d4e2bc'),
        group,
        0,
        0.01,
        -0.21 - length,
      ).rotation.x = Math.PI / 2
      if (id === 'longlens')
        mesh(
          new THREE.CylinderGeometry(0.047, 0.047, 0.24, 12),
          sand,
          group,
          0,
          0.17,
          -0.1,
        ).rotation.x = Math.PI / 2
      box(group, 0.08, 0.04, 0.06, paper, 0.09, 0.13, 0, 0.01)
    }
    return group
  }
  function grenadeModel(parent: THREE.Object3D) {
    const group = new THREE.Group()
    parent.add(group)
    mesh(new THREE.SphereGeometry(0.14, 12, 8), material('#e5d6ad'), group)
    box(group, 0.07, 0.06, 0.07, material('#c5b1bc'), 0, 0.15, 0, 0.012)
    mesh(new THREE.TorusGeometry(0.045, 0.008, 4, 10), ink, group, 0.035, 0.2, 0).rotation.y = 0.4
    return group
  }
  function placard(text: string, parent: THREE.Object3D) {
    const source = document.createElement('canvas')
    source.width = 384
    source.height = 72
    const ctx = source.getContext('2d')!
    ctx.fillStyle = '#fff9e8'
    ctx.fillRect(0, 0, 384, 72)
    ctx.fillStyle = '#8f7e5a'
    ctx.font = '22px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(text, 192, 45, 360)
    const texture = new THREE.CanvasTexture(source)
    textures.add(texture)
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true })
    materials.add(mat)
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(3, 0.56, 1)
    parent.add(sprite)
    return sprite
  }
  const gun = new THREE.Group(),
    viewWeapons = new Map<WeaponId, THREE.Group>()
  for (const id of WEAPON_ORDER) {
    const model = makeWeapon(id, gun)
    model.visible = id === 'camera'
    viewWeapons.set(id, model)
  }
  const hand = mesh(new THREE.SphereGeometry(0.11, 12, 8), cream, gun, -0.15, -0.09, 0.07)
  hand.scale.set(0.8, 1, 1)
  gun.position.set(0.31, -0.3, -0.55)
  camera.add(gun)
  scene.add(camera)
  const pickupModels = new Map<string, { model: THREE.Group; pad: THREE.Mesh }>()
  for (const pickup of WEAPON_PICKUPS) {
    const root = new THREE.Group()
    root.position.set(pickup.x, 0, pickup.z)
    scene.add(root)
    const pad = mesh(
      new THREE.CylinderGeometry(0.66, 0.72, 0.12, 24),
      material(pickup.kind === 'grenades' ? '#d4be93' : WEAPONS[pickup.kind].colour),
      root,
      0,
      0.08,
      0,
    )
    const model = new THREE.Group()
    root.add(model)
    const item = pickup.kind === 'grenades' ? grenadeModel(model) : makeWeapon(pickup.kind, model)
    item.scale.setScalar(pickup.kind === 'grenades' ? 2.3 : 2.1)
    const label = placard(
      pickup.kind === 'grenades'
        ? 'G · Confetti grenades'
        : `${WEAPON_ORDER.indexOf(pickup.kind) + 1} · ${WEAPONS[pickup.kind].name}`,
      model,
    )
    label.position.y = 1.1
    pickupModels.set(pickup.id, { model, pad })
  }
  for (const [text, x, z] of [
    ['THE POST OFFICE', -23, -27],
    ['THE ORCHARD', 23, 27],
    ['THE FOLDED LIBRARY', 23, -27],
    ['THE FROSTED COURT', -23, 27],
  ] as const) {
    const group = new THREE.Group()
    group.position.set(x, 2.5, z)
    scene.add(group)
    placard(text, group)
    box(scene, 0.1, 2.6, 0.1, sand, x, 1.3, z, 0.02)
  }
  const grenadeModels = new Map<number, THREE.Group>()
  const spareGrenades: THREE.Group[] = []
  const bursts: {
    root: THREE.Group
    age: number
    radius: number
    geo: THREE.PlaneGeometry
    ring: THREE.Mesh
    ringGeo: THREE.RingGeometry
    ringMat: THREE.MeshBasicMaterial
    mats: THREE.MeshBasicMaterial[]
    pieces: THREE.Mesh[]
  }[] = []
  const actors = new Map<
    string,
    {
      group: THREE.Group
      label: THREE.Sprite
      target: ArenaPlayer
      phase: number
      dispose: () => void
      equipment: Map<WeaponId, THREE.Group>
    }
  >()
  function makeActor(player: ArenaPlayer) {
    const existingGeometry = new Set(geometries)
    const existingMaterials = new Set(materials)
    const group = new THREE.Group()
    const coat = material(PIP_COLOURS[player.colour]!)
    const body = mesh(new THREE.SphereGeometry(0.48, 18, 14), coat, group, 0, 0.83, 0)
    body.scale.set(0.83, 1.23, 0.67)
    for (const [x, y, r] of [
      [-0.26, 1.2, 0.14],
      [0, 1.37, 0.15],
      [0.25, 1.2, 0.14],
    ])
      mesh(new THREE.SphereGeometry(r, 10, 8), coat, group, x, y, 0)
    for (const side of [-1, 1]) {
      mesh(new THREE.CapsuleGeometry(0.065, 0.2, 3, 8), ink, group, side * 0.18, 0.17, 0)
      const foot = mesh(new THREE.SphereGeometry(0.09, 8, 6), ink, group, side * 0.19, 0.06, -0.04)
      foot.scale.z = 1.6
      const eye = mesh(new THREE.SphereGeometry(0.032, 8, 6), ink, group, side * 0.12, 1.02, -0.3)
      eye.scale.y = 1.5
      const blush = mesh(
        new THREE.SphereGeometry(0.055, 8, 6),
        material('#d7b59c'),
        group,
        side * 0.23,
        0.91,
        -0.27,
      )
      blush.scale.set(1, 0.45, 0.2)
      mesh(new THREE.SphereGeometry(0.085, 10, 8), coat, group, side * 0.4, 0.7, -0.12)
    }
    const smile = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.055, 0.87, -0.324),
      new THREE.Vector3(0, 0.84, -0.334),
      new THREE.Vector3(0.055, 0.87, -0.324),
    ])
    mesh(new THREE.TubeGeometry(smile, 8, 0.009, 4, false), ink, group)
    const equipment = new Map<WeaponId, THREE.Group>()
    for (const id of WEAPON_ORDER) {
      const model = makeWeapon(id, group)
      model.position.set(0.3, 0.76, -0.3)
      model.scale.setScalar(0.8)
      model.visible = id === player.weapon
      equipment.set(id, model)
    }
    const nameCanvas = document.createElement('canvas')
    nameCanvas.width = 256
    nameCanvas.height = 64
    const ctx = nameCanvas.getContext('2d')!
    ctx.clearRect(0, 0, 256, 64)
    ctx.fillStyle = '#fffdf0'
    ctx.fillRect(12, 8, 232, 46)
    ctx.fillStyle = '#7c725a'
    ctx.font = '24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(player.name, 128, 39, 220)
    const texture = new THREE.CanvasTexture(nameCanvas)
    textures.add(texture)
    const labelMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true })
    materials.add(labelMat)
    const label = new THREE.Sprite(labelMat)
    label.position.y = 1.85
    label.scale.set(1.7, 0.43, 1)
    group.add(label)
    group.position.set(player.x, player.y, player.z)
    scene.add(group)
    const ownedGeometry = [...geometries].filter((g) => !existingGeometry.has(g))
    const ownedMaterials = [...materials].filter((m) => !existingMaterials.has(m))
    const dispose = () => {
      for (const geometry of ownedGeometry) {
        geometry.dispose()
        geometries.delete(geometry)
      }
      for (const mat of ownedMaterials) {
        mat.dispose()
        materials.delete(mat)
      }
      texture.dispose()
      textures.delete(texture)
    }
    return { group, label, target: player, phase: Math.random() * 10, dispose, equipment }
  }
  const beams: { object: THREE.Line; life: number; mat: THREE.LineBasicMaterial }[] = []
  let recoil = 0,
    disposed = false,
    previousHealth = 100
  const camPosition = new THREE.Vector3()
  let positioned = false
  function resize() {
    const rect = canvas.getBoundingClientRect()
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false)
    camera.aspect = rect.width / Math.max(1, rect.height)
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()
  function draw(
    snapshot: ArenaSnapshot | null,
    selfId: string,
    yaw: number,
    pitch: number,
    dt: number,
    time: number,
    shots: ArenaShot[],
    active: boolean,
    explosions: ArenaExplosion[] = [],
    aiming = false,
  ) {
    if (disposed) return
    const self = snapshot?.players.find((p) => p.id === selfId)
    const alive = new Set(snapshot?.players.map((p) => p.id) ?? [])
    for (const [id, actor] of actors)
      if (!alive.has(id)) {
        scene.remove(actor.group)
        actor.dispose()
        actors.delete(id)
      }
    for (const player of snapshot?.players ?? []) {
      if (player.id === selfId) continue
      let actor = actors.get(player.id)
      if (!actor) {
        actor = makeActor(player)
        actors.set(player.id, actor)
      }
      actor.target = player
      for (const [weapon, model] of actor.equipment) model.visible = weapon === player.weapon
      actor.group.visible = player.health > 0
      actor.group.position.lerp(
        new THREE.Vector3(player.x, player.y, player.z),
        1 - Math.exp(-18 * dt),
      )
      actor.group.rotation.y = player.yaw
      const bob = Math.sin(time * 8 + actor.phase) * 0.012
      actor.group.position.y += bob
      actor.label.material.opacity = player.shieldUntil > (snapshot?.now ?? 0) ? 0.5 : 0.95
    }
    if (self) {
      const target = new THREE.Vector3(self.x, self.y + EYE_HEIGHT, self.z)
      if (
        !positioned ||
        camPosition.distanceTo(target) > 4 ||
        (self.health > 0 && previousHealth <= 0)
      ) {
        camPosition.copy(target)
        positioned = true
      } else camPosition.lerp(target, 1 - Math.exp(-26 * dt))
      camera.position.copy(camPosition)
      camera.rotation.set(pitch, yaw, 0, 'YXZ')
      previousHealth = self.health
    } else {
      positioned = false
      camera.position.set(
        Math.sin(time * 0.035) * (ARENA_LIMIT * 1.15),
        27,
        Math.cos(time * 0.035) * (ARENA_LIMIT * 1.15),
      )
      camera.lookAt(0, 0, 0)
    }
    const targetFov = active && aiming ? (self?.weapon === 'longlens' ? 36 : 65) : 78
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 1 - Math.exp(-14 * dt))
      camera.updateProjectionMatrix()
    }
    for (const [weapon, model] of viewWeapons) model.visible = weapon === (self?.weapon ?? 'camera')
    gun.visible = !!self && self.health > 0 && active
    recoil = Math.max(0, recoil - dt * 5)
    gun.position.set(0.31, -0.3 + Math.sin(time * 3) * 0.004, -0.55 + recoil * 0.09)
    gun.rotation.x = recoil * 0.15
    gun.rotation.z = self?.weapon === 'knife' ? Math.sin(recoil * Math.PI) * -0.8 : 0
    for (const pickup of WEAPON_PICKUPS) {
      const entry = pickupModels.get(pickup.id)!
      const available =
        (snapshot?.pickups.find((p) => p.id === pickup.id)?.availableAt ?? 0) <=
        (snapshot?.now ?? 0)
      entry.model.visible = available
      entry.model.position.y = 0.8 + Math.sin(time * 2 + pickup.x) * 0.1
      entry.model.rotation.y = time * 0.5
      entry.pad.scale.setScalar(available ? 1 : 0.75)
    }
    const liveGrenades = new Set(snapshot?.grenades.map((g) => g.id) ?? [])
    for (const [id, model] of grenadeModels)
      if (!liveGrenades.has(id)) {
        model.visible = false
        grenadeModels.delete(id)
        spareGrenades.push(model)
      }
    for (const grenade of snapshot?.grenades ?? []) {
      let model = grenadeModels.get(grenade.id)
      if (!model) {
        model = spareGrenades.pop() ?? grenadeModel(scene)
        grenadeModels.set(grenade.id, model)
      }
      model.visible = true
      model.position.set(grenade.x, grenade.y, grenade.z)
      model.rotation.z = time * 7
      model.scale.setScalar(1 + Math.sin(time * 20) * 0.08)
    }
    for (const explosion of explosions) {
      const root = new THREE.Group()
      root.position.set(explosion.x, explosion.y, explosion.z)
      scene.add(root)
      const geo = new THREE.PlaneGeometry(0.16, 0.09),
        ringGeo = new THREE.RingGeometry(0.87, 1, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: '#dbc598',
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = -Math.PI / 2
      ring.position.y = 0.03
      root.add(ring)
      const mats = ['#e6c68c', '#c9d7b1', '#dfb7c8', '#b8c9db'].map(
        (colour) =>
          new THREE.MeshBasicMaterial({ color: colour, side: THREE.DoubleSide, transparent: true }),
      )
      const pieces = Array.from({ length: 24 }, (_, i) => {
        const piece = new THREE.Mesh(geo, mats[i % 4])
        root.add(piece)
        return piece
      })
      bursts.push({
        root,
        age: 0,
        radius: explosion.radius,
        geo,
        ring,
        ringGeo,
        ringMat,
        mats,
        pieces,
      })
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const burst = bursts[i]!
      burst.age += dt
      const t = burst.age
      burst.ring.scale.setScalar(Math.min(1, t * 2.5) * burst.radius)
      burst.ringMat.opacity = Math.max(0, 0.6 - t)
      burst.pieces.forEach((piece, index) => {
        const angle = (index / 24) * Math.PI * 2
        const speed = 2 + (index % 5) * 0.45
        piece.position.set(
          Math.sin(angle) * t * speed,
          Math.max(0, t * (2 + (index % 3)) - t * t * 4),
          Math.cos(angle) * t * speed,
        )
        piece.rotation.set(t * 5, index + t * 3, t * 4)
      })
      burst.mats.forEach((mat) => {
        mat.opacity = Math.max(0, 1 - t)
      })
      if (t > 1.1) {
        scene.remove(burst.root)
        burst.geo.dispose()
        burst.ringGeo.dispose()
        burst.ringMat.dispose()
        burst.mats.forEach((m) => m.dispose())
        bursts.splice(i, 1)
      }
    }
    for (const shot of shots) {
      if (shot.owner === selfId) recoil = 1
      if (shot.weapon === 'knife') continue
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...(shot.from as [number, number, number])),
        new THREE.Vector3(...(shot.to as [number, number, number])),
      ])
      const mat = new THREE.LineBasicMaterial({
        color: shot.tag ? '#e7c17b' : WEAPONS[shot.weapon].colour,
        transparent: true,
        opacity: 0.8,
      })
      const object = new THREE.Line(geometry, mat)
      scene.add(object)
      beams.push({ object, mat, life: 0.14 })
    }
    for (let i = beams.length - 1; i >= 0; i--) {
      const beam = beams[i]!
      beam.life -= dt
      beam.mat.opacity = Math.max(0, beam.life / 0.14) * 0.8
      if (beam.life <= 0) {
        scene.remove(beam.object)
        beam.object.geometry.dispose()
        beam.mat.dispose()
        beams.splice(i, 1)
      }
    }
    renderer.render(scene, camera)
  }
  function dispose() {
    disposed = true
    observer.disconnect()
    for (const beam of beams) {
      beam.object.geometry.dispose()
      beam.mat.dispose()
    }
    for (const burst of bursts) {
      burst.geo.dispose()
      burst.ringGeo.dispose()
      burst.ringMat.dispose()
      burst.mats.forEach((m) => m.dispose())
    }
    for (const geometry of geometries) geometry.dispose()
    for (const mat of materials) mat.dispose()
    for (const texture of textures) texture.dispose()
    renderer.dispose()
  }
  return { draw, dispose }
}
