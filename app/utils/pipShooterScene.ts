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
  scene.fog = new THREE.Fog('#e9e9dc', 28, 65)
  const camera = new THREE.PerspectiveCamera(78, 1, 0.05, 100)
  camera.rotation.order = 'YXZ'
  const ambient = new THREE.HemisphereLight('#fff8e1', '#a6b49a', 2.1)
  scene.add(ambient)
  const sun = new THREE.DirectionalLight('#fff1cd', 3)
  sun.position.set(-8, 18, 7)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  Object.assign(sun.shadow.camera, {
    left: -20,
    right: 20,
    top: 20,
    bottom: -20,
    near: 0.5,
    far: 55,
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
  box(scene, 29, 0.2, 29, paper, 0, -0.48, 0, 0.05)
  box(scene, 29.3, 0.15, 29.3, sand, 0.1, -0.64, 0.12, 0.04)
  for (let i = -13; i <= 13; i += 2)
    for (let j = -13; j <= 13; j += 2) {
      const dot = mesh(new THREE.CircleGeometry(0.025, 6), material('#b9c4a7'), scene, i, 0.006, j)
      dot.rotation.x = -Math.PI / 2
      dot.castShadow = false
    }
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
  for (let i = -14; i <= 14; i += 2) {
    for (const side of [-1, 1]) {
      box(scene, 0.12, 0.8, 0.12, sand, i, 0.4, side * 14.5, 0.02)
      box(scene, 0.12, 0.8, 0.12, sand, side * 14.5, 0.4, i, 0.02)
    }
  }
  for (const side of [-1, 1]) {
    box(scene, 29, 0.08, 0.08, sand, 0, 0.55, side * 14.5, 0.02)
    box(scene, 0.08, 0.08, 29, sand, side * 14.5, 0.55, 0, 0.02)
  }
  // Paper-cut scenery is outside the arena, so it never changes collision geometry.
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2,
      radius = 20 + (i % 3) * 2
    const tree = new THREE.Group()
    tree.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius)
    mesh(new THREE.CylinderGeometry(0.15, 0.22, 1.8, 7), sand, tree, 0, 0.9, 0)
    const crown = mesh(new THREE.IcosahedronGeometry(1.8 + (i % 3) * 0.3, 1), sage, tree, 0, 3, 0)
    crown.scale.y = 1.2
    scene.add(tree)
  }
  const gun = new THREE.Group()
  box(gun, 0.31, 0.23, 0.24, sand, 0, 0, 0, 0.04)
  box(gun, 0.12, 0.12, 0.07, ink, 0, 0.01, -0.15, 0.02)
  mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.05, 16),
    material('#d1dcc3'),
    gun,
    0,
    0.01,
    -0.2,
  ).rotation.x = Math.PI / 2
  box(gun, 0.08, 0.045, 0.06, paper, 0.09, 0.135, 0, 0.01)
  const hand = mesh(new THREE.SphereGeometry(0.11, 12, 8), cream, gun, -0.15, -0.09, 0.07)
  hand.scale.set(0.8, 1, 1)
  gun.position.set(0.31, -0.3, -0.55)
  camera.add(gun)
  scene.add(camera)
  const actors = new Map<
    string,
    {
      group: THREE.Group
      label: THREE.Sprite
      target: ArenaPlayer
      phase: number
      dispose: () => void
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
    box(group, 0.22, 0.15, 0.17, sand, 0.3, 0.76, -0.3, 0.03)
    box(group, 0.08, 0.08, 0.05, ink, 0.3, 0.77, -0.4, 0.015)
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
    return { group, label, target: player, phase: Math.random() * 10, dispose }
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
      camera.position.set(Math.sin(time * 0.055) * 20, 13, Math.cos(time * 0.055) * 20)
      camera.lookAt(0, 0, 0)
    }
    gun.visible = !!self && self.health > 0 && active
    recoil = Math.max(0, recoil - dt * 5)
    gun.position.set(0.31, -0.3 + Math.sin(time * 3) * 0.004, -0.55 + recoil * 0.09)
    gun.rotation.x = recoil * 0.15
    for (const shot of shots) {
      if (shot.owner === selfId) recoil = 1
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...(shot.from as [number, number, number])),
        new THREE.Vector3(...(shot.to as [number, number, number])),
      ])
      const mat = new THREE.LineBasicMaterial({
        color: shot.tag ? '#e7c17b' : '#fff3b5',
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
    for (const geometry of geometries) geometry.dispose()
    for (const mat of materials) mat.dispose()
    for (const texture of textures) texture.dispose()
    renderer.dispose()
  }
  return { draw, dispose }
}
