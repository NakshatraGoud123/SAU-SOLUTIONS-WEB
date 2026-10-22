import { useEffect, useRef, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import type * as THREE_TYPES from 'three'
import type { NeighborhoodCopy } from './neighborhood-copy'
import './neighborhood.css'

type NeighborhoodExperienceProps = {
  isNight: boolean
  language: 'en' | 'hi'
  onToggleNight: () => void
  onToggleLanguage: () => void
  text: NeighborhoodCopy
}

const landmarks = [
  { key: 'shops', target: 'category-essential-supplies', en: 'Shops', hi: 'दुकानें', position: 'label-shops' },
  { key: 'vendors', target: 'partner', en: 'Vendors', hi: 'विक्रेता', position: 'label-vendors' },
  { key: 'mechanics', target: 'category-mechanic-services', en: 'Mechanics', hi: 'मैकेनिक', position: 'label-mechanics' },
  { key: 'home', target: 'category-home-services', en: 'Home services', hi: 'घरेलू सेवाएँ', position: 'label-home' },
  { key: 'delivery', target: 'category-mobility-services', en: 'Delivery', hi: 'डिलीवरी', position: 'label-delivery' },
] as const

export default function NeighborhoodExperience({ isNight, language, onToggleNight, onToggleLanguage, text }: NeighborhoodExperienceProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const setNightRef = useRef<((night: boolean) => void) | null>(null)
  const isNightRef = useRef(isNight)
  const [fallback, setFallback] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    isNightRef.current = isNight
    setNightRef.current?.(isNight)
    hostRef.current?.classList.toggle('is-night', isNight)
  }, [isNight])

  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return

    let disposed = false
    let initialized = false
    let resizeObserver: ResizeObserver | undefined
    let teardown: (() => void) | undefined

    const initialize = async () => {
      if (initialized || disposed) return
      initialized = true
      let rendererInstance: THREE_TYPES.WebGLRenderer | null = null
      let sceneInstance: THREE_TYPES.Scene | null = null
      try {
        const [THREE, gsapModule, { ScrollTrigger }] = await Promise.all([
          import('three'),
          import('gsap'),
          import('gsap/ScrollTrigger'),
        ])
        if (disposed) return
        const { gsap } = gsapModule
        gsap.registerPlugin(ScrollTrigger)

        const scene = new THREE.Scene()
        sceneInstance = scene
        const dayColor = new THREE.Color('#eaf4e7')
        const nightColor = new THREE.Color('#122239')
        scene.background = isNightRef.current ? nightColor : dayColor
        scene.fog = new THREE.Fog(scene.background, 20, 42)

        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
        camera.position.set(14, 12, 16)
        camera.lookAt(0, 0, 0)

        const renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: false,
          antialias: !window.matchMedia('(max-width: 700px)').matches,
          powerPreference: 'low-power',
        })
        rendererInstance = renderer
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.08
        renderer.setClearColor(scene.background, 1)

        const ambient = new THREE.HemisphereLight('#fff9e9', '#9aa98a', isNightRef.current ? 0.65 : 1.8)
        scene.add(ambient)
        const sunlight = new THREE.DirectionalLight(isNightRef.current ? '#abc9ff' : '#fff0cf', isNightRef.current ? 1.2 : 2.4)
        sunlight.position.set(-7, 14, 9)
        scene.add(sunlight)

        const town = new THREE.Group()
        scene.add(town)
        const animated: Array<THREE_TYPES.Object3D> = []
        const pedestrians: THREE_TYPES.Group[] = []
        const streetLights: THREE_TYPES.Mesh[] = []
        const material = (color: string, roughness = 0.88, emissive = '#000000') => new THREE.MeshStandardMaterial({ color, roughness, emissive, emissiveIntensity: 0.8 })
        const mat = {
          grass: material('#b9d5a4'), road: material('#606d70'), roadLine: material('#f2df9e'),
          sidewalk: material('#d9d8c8'), wall: material('#f0e5cf'), white: material('#fff8e8'),
          roof: material('#b66e50'), green: material('#54946f'), deepGreen: material('#397457'),
          yellow: material('#e9b34f'), blue: material('#6b9eb8'), red: material('#cb705e'),
          dark: material('#34434a'), window: material('#b5dce0', 0.3), leaf: material('#5a9a66'),
          trunk: material('#8d6549'), tire: material('#26343a'), skin: material('#d8a77c'),
          shirt: material('#df7353'), lamp: material('#ffe7a3', 0.3, '#ffca64'),
        }

        const box = (parent: THREE_TYPES.Object3D, size: [number, number, number], position: [number, number, number], color: THREE_TYPES.Material) => {
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), color)
          mesh.position.set(...position)
          parent.add(mesh)
          return mesh
        }
        const cylinder = (parent: THREE_TYPES.Object3D, radiusTop: number, radiusBottom: number, height: number, position: [number, number, number], color: THREE_TYPES.Material, segments = 8) => {
          const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), color)
          mesh.position.set(...position)
          parent.add(mesh)
          return mesh
        }
        const sphere = (parent: THREE_TYPES.Object3D, radius: number, position: [number, number, number], color: THREE_TYPES.Material, scale?: [number, number, number]) => {
          const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 6), color)
          mesh.position.set(...position)
          if (scale) mesh.scale.set(...scale)
          parent.add(mesh)
          return mesh
        }

        box(town, [18, 0.28, 14], [0, -0.3, 0], mat.grass)
        box(town, [18, 0.08, 2.5], [0, -0.12, 0.4], mat.road)
        box(town, [2.4, 0.08, 14], [0.2, -0.11, 0], mat.road)
        box(town, [18, 0.09, 0.07], [0, -0.055, 0.4], mat.roadLine)
        box(town, [0.07, 0.09, 14], [0.2, -0.045, 0], mat.roadLine)
        box(town, [18, 0.16, 0.32], [0, -0.08, 1.86], mat.sidewalk)
        box(town, [18, 0.16, 0.32], [0, -0.08, -1.08], mat.sidewalk)
        box(town, [0.3, 0.16, 14], [1.54, -0.08, 0], mat.sidewalk)
        box(town, [0.3, 0.16, 14], [-1.14, -0.08, 0], mat.sidewalk)

        const building = (x: number, z: number, width: number, depth: number, height: number, wall: THREE_TYPES.Material, roof: THREE_TYPES.Material, shop = false) => {
          const group = new THREE.Group()
          group.position.set(x, 0, z)
          town.add(group)
          box(group, [width, height, depth], [0, height / 2, 0], wall)
          box(group, [width + 0.18, 0.22, depth + 0.18], [0, height + 0.1, 0], roof)
          const cols = Math.max(1, Math.floor(width / 0.55))
          for (let col = 0; col < cols; col += 1) {
            const wx = (col - (cols - 1) / 2) * Math.min(0.48, width / (cols + 0.6))
            for (let row = 0; row < Math.min(2, Math.floor((height - 0.4) / 0.65)); row += 1) {
              box(group, [0.25, 0.27, 0.025], [wx, 0.52 + row * 0.55, depth / 2 + 0.014], mat.window)
            }
          }
          box(group, [0.36, Math.min(0.92, height * 0.58), 0.04], [width * 0.27, Math.min(0.48, height / 2), depth / 2 + 0.03], mat.dark)
          if (shop) {
            box(group, [width + 0.36, 0.18, depth * 0.45], [0, height * 0.7, depth / 2 + 0.16], mat.yellow)
            box(group, [width + 0.38, 0.09, 0.08], [0, height * 0.7 - 0.11, depth / 2 + 0.38], mat.white)
            box(group, [width * 0.75, 0.2, 0.04], [0, height + 0.26, depth / 2 + 0.1], mat.green)
          }
          return group
        }

        // The illustration is an atmospheric concept scene; it is not live provider data.
        building(-5.8, -4.5, 2.5, 1.8, 1.8, mat.white, mat.red, true)
        building(-2.8, -4.2, 2.1, 1.9, 1.4, mat.yellow, mat.roof, true)
        building(4.9, -4.6, 2.8, 2.0, 1.55, mat.white, mat.blue, true)
        building(-5.8, 4.4, 2.1, 2.1, 2.2, mat.wall, mat.roof)
        building(-2.8, 4.5, 1.9, 2.2, 1.7, mat.yellow, mat.red)
        building(4.9, 4.45, 2.15, 2.0, 2.0, mat.white, mat.green)
        building(7.2, 1.6, 1.5, 1.8, 1.3, mat.blue, mat.roof)
        // Garage shutters and sign.
        box(town, [1.85, 0.95, 0.05], [2.65, 0.48, 5.72], mat.dark)
        for (let row = 0; row < 4; row += 1) box(town, [1.75, 0.035, 0.065], [2.65, 0.18 + row * 0.2, 5.78], mat.sidewalk)
        box(town, [2.0, 0.26, 0.13], [2.65, 1.15, 5.7], mat.blue)

        for (const [x, z] of [[-8, -5], [-7.8, 2], [7.9, -2.5], [7.8, 5.7], [0.3, -5.8], [0.1, 5.8]] as const) {
          cylinder(town, 0.09, 0.14, 0.75, [x, 0.28, z], mat.trunk, 6)
          sphere(town, 0.45, [x, 0.82, z], mat.leaf, [1, 1.2, 1])
          sphere(town, 0.32, [x + 0.23, 1.04, z + 0.12], mat.deepGreen)
        }
        for (const [x, z] of [[-1.2, -2.8], [3.1, -2.7], [-3.7, 2.8], [6.4, 2.8]] as const) {
          cylinder(town, 0.035, 0.05, 1.45, [x, 0.65, z], mat.dark, 6)
          box(town, [0.32, 0.1, 0.22], [x + 0.13, 1.34, z], mat.lamp)
          streetLights.push(town.children[town.children.length - 1] as THREE_TYPES.Mesh)
        }
        for (const x of [-7, -4.3, 3.7, 7] as const) {
          box(town, [0.48, 0.42, 0.48], [x, 0.18, 0.35], mat.green)
          sphere(town, 0.28, [x, 0.56, 0.35], mat.deepGreen)
        }

        const vehicle = (color: THREE_TYPES.Material, x: number, z: number, scooter = false) => {
          const group = new THREE.Group()
          group.position.set(x, 0, z)
          town.add(group)
          if (scooter) {
            cylinder(group, 0.17, 0.17, 0.11, [-0.34, 0.2, 0], mat.tire, 10).rotation.z = Math.PI / 2
            cylinder(group, 0.17, 0.17, 0.11, [0.34, 0.2, 0], mat.tire, 10).rotation.z = Math.PI / 2
            box(group, [0.63, 0.15, 0.23], [0, 0.42, 0], color)
            cylinder(group, 0.045, 0.045, 0.47, [0.29, 0.53, 0], mat.dark, 6).rotation.z = -0.25
            sphere(group, 0.22, [-0.02, 0.78, 0], mat.shirt, [0.72, 1, 0.72])
            sphere(group, 0.13, [-0.02, 1.06, 0], mat.skin)
          } else {
            box(group, [1.08, 0.35, 0.58], [0, 0.42, 0], color)
            box(group, [0.58, 0.33, 0.5], [-0.05, 0.75, 0], mat.blue)
            for (const [wx, wz] of [[-0.34, -0.31], [0.34, -0.31], [-0.34, 0.31], [0.34, 0.31]] as const) cylinder(group, 0.12, 0.12, 0.08, [wx, 0.23, wz], mat.tire, 8).rotation.z = Math.PI / 2
          }
          animated.push(group)
          return group
        }
        const scooterA = vehicle(mat.green, -7.3, 0.92, true)
        scooterA.rotation.y = Math.PI / 2
        const scooterB = vehicle(mat.yellow, 6.9, -0.12, true)
        scooterB.rotation.y = -Math.PI / 2
        vehicle(mat.red, -0.5, 0.98)
        vehicle(mat.blue, 0.75, -0.1)
        for (const [x, z] of [[-1.8, 1.15], [3.9, -1.1], [1.65, 2.7]] as const) {
          const person = new THREE.Group()
          person.position.set(x, 0, z)
          town.add(person)
          cylinder(person, 0.11, 0.15, 0.36, [0, 0.2, 0], mat.shirt, 6)
          sphere(person, 0.11, [0, 0.46, 0], mat.skin)
          pedestrians.push(person)
        }

        const fitRenderer = () => {
          const bounds = host.getBoundingClientRect()
          if (!bounds.width || !bounds.height) return
          renderer.setSize(Math.round(bounds.width), Math.round(bounds.height), false)
          camera.aspect = bounds.width / bounds.height
          camera.updateProjectionMatrix()
          renderer.render(scene, camera)
        }
        resizeObserver = new ResizeObserver(fitRenderer)
        resizeObserver.observe(host)
        fitRenderer()

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const render = () => renderer.render(scene, camera)
        const entrance = !reducedMotion
          ? gsap.fromTo(town.scale, { x: 0.78, y: 0.78, z: 0.78 }, { x: 1, y: 1, z: 1, duration: 1.2, ease: 'back.out(1.15)' })
          : null
        const motionTweens = !reducedMotion ? [
          ...animated.slice(0, 2).map((item, index) => gsap.to(item.position, {
            x: index === 0 ? 6.9 : -7.1,
            duration: index === 0 ? 11 : 13,
            repeat: -1,
            ease: 'none',
            onRepeat: () => { item.position.x = index === 0 ? -7.3 : 6.9 },
          })),
          ...animated.slice(2, 4).map((item, index) => gsap.to(item.position, {
            z: index === 0 ? -5.7 : 6.1,
            duration: index === 0 ? 17 : 19,
            repeat: -1,
            ease: 'none',
            onRepeat: () => { item.position.z = index === 0 ? 6.1 : -5.7 },
          })),
          ...pedestrians.map((person, index) => gsap.to(person.position, {
            z: person.position.z + (index % 2 === 0 ? 0.42 : -0.42),
            duration: 2.6 + index * 0.3,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
          })),
        ] : []
        const tickerRender = reducedMotion ? undefined : () => render()
        if (tickerRender) gsap.ticker.add(tickerRender)

        const route = host.closest('.route-motion')
        const cameraScroll = route && !reducedMotion ? ScrollTrigger.create({
          trigger: route,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          onUpdate: (self) => {
            town.rotation.y = -0.12 + self.progress * 0.32
            camera.position.y = 12 - self.progress * 2.1
            camera.position.x = 14 - self.progress * 1.8
            camera.lookAt(0, 0, 0)
            render()
          },
        }) : undefined

        const updateNight = (night: boolean) => {
          const color = night ? nightColor : dayColor
          scene.background = color
          if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(color)
          ambient.intensity = night ? 0.65 : 1.8
          sunlight.intensity = night ? 1.2 : 2.4
          sunlight.color.set(night ? '#abc9ff' : '#fff0cf')
          for (const light of streetLights) {
            const lampMaterial = light.material as THREE_TYPES.MeshStandardMaterial
            lampMaterial.emissive.set(night ? '#ffbd57' : '#000000')
            lampMaterial.emissiveIntensity = night ? 1.3 : 0
          }
          renderer.setClearColor(color, 1)
          render()
        }
        setNightRef.current = updateNight
        updateNight(isNightRef.current)

        teardown = () => {
          setNightRef.current = null
          cameraScroll?.kill()
          entrance?.kill()
          motionTweens.forEach((tween) => tween.kill())
          if (tickerRender) gsap.ticker.remove(tickerRender)
          gsap.killTweensOf(town.scale)
          resizeObserver?.disconnect()
          town.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose()
              const materials = Array.isArray(object.material) ? object.material : [object.material]
              materials.forEach((item) => item.dispose())
            }
          })
          renderer.dispose()
          rendererInstance = null
          sceneInstance = null
        }
      } catch (error) {
        rendererInstance?.dispose()
        sceneInstance?.traverse((object) => {
          const mesh = object as THREE_TYPES.Mesh
          if (mesh.isMesh) {
            mesh.geometry.dispose()
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            materials.forEach((item) => item.dispose())
          }
        })
        console.error('The neighborhood 3D scene could not start.', error)
        if (!disposed) setFallback(true)
      }
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void initialize()
        observer.disconnect()
      }
    }, { rootMargin: '180px' })
    observer.observe(host)

    return () => {
      disposed = true
      observer.disconnect()
      teardown?.()
      resizeObserver?.disconnect()
    }
  }, [])

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const doc = document.documentElement
        const available = doc.scrollHeight - window.innerHeight
        setProgress(available > 0 ? Math.round((window.scrollY / available) * 100) : 0)
      })
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    update()
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      cancelAnimationFrame(frame)
    }
  }, [])

  const scrollTo = (id: string) => {
    const target = document.getElementById(id) ?? document.getElementById('categories')
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
  }

  return (
    <div className={`neighborhood-experience${fallback ? ' neighborhood-fallback' : ''}${isNight ? ' is-night' : ''}`} ref={hostRef}>
      <canvas ref={canvasRef} className="neighborhood-canvas" aria-hidden="true" />
      {fallback && <div className="neighborhood-fallback-art" aria-hidden="true"><span className="fallback-road" /><span className="fallback-house house-one" /><span className="fallback-house house-two" /><span className="fallback-shop" /><span className="fallback-tree tree-one" /><span className="fallback-tree tree-two" /><span className="fallback-car">●</span></div>}
      <div className="neighborhood-controls" aria-label="Neighborhood scene settings">
        <button type="button" onClick={onToggleNight} aria-pressed={isNight} aria-label={isNight ? 'Switch to daytime scene' : 'Switch to night scene'} title={isNight ? text.day : text.night}>
          {isNight ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
          <span>{isNight ? text.day : text.night}</span>
        </button>
        <button type="button" onClick={onToggleLanguage} aria-label={language === 'en' ? 'Switch language to Hindi' : 'Switch language to English'}>{text.language}</button>
      </div>
      {!fallback && landmarks.map((landmark) => <button key={landmark.key} type="button" className={`neighborhood-label ${landmark.position}`} onClick={() => scrollTo(landmark.target)}>{language === 'en' ? landmark.en : landmark.hi}<span aria-hidden="true">↗</span></button>)}
      {fallback && <div className="fallback-label-list" aria-label="Neighborhood categories">{landmarks.map((landmark) => <button key={landmark.key} type="button" onClick={() => scrollTo(landmark.target)}>{language === 'en' ? landmark.en : landmark.hi}</button>)}</div>}
      <div className="scene-scroll-progress" role="progressbar" aria-label="Homepage scroll progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
      <div className="scene-bottom-note" aria-live="polite">{fallback ? 'Static neighborhood illustration · Interactive sections remain available below.' : 'Scroll to explore the neighborhood preview'}</div>
    </div>
  )
}
