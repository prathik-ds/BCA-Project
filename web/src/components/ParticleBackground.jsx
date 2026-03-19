import { useEffect, useRef } from 'react'

export default function ParticleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let particles = []
    let glowSpots = []
    let animationFrameId
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      init()
    }

    class GlowSpot {
      constructor() {
        this.reset()
      }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 300 + 100
        this.color = Math.random() > 0.5 ? 'rgba(6, 232, 225, 0.03)' : 'rgba(236, 72, 153, 0.03)'
        this.vx = (Math.random() - 0.5) * 0.2
        this.vy = (Math.random() - 0.5) * 0.2
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        if (this.x < -this.size || this.x > canvas.width + this.size || this.y < -this.size || this.y > canvas.height + this.size) {
          this.reset()
        }
      }
      draw() {
        const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size)
        grd.addColorStop(0, this.color)
        grd.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    class Particle {
      constructor() {
        this.reset()
      }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.1
        this.vx = (Math.random() - 0.5) * 0.3
        this.vy = (Math.random() - 0.5) * 0.3
        this.opacity = Math.random() * 0.5 + 0.1
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
          this.reset()
        }
      }
      draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const init = () => {
      particles = []
      glowSpots = []
      const count = Math.min(200, Math.floor((canvas.width * canvas.height) / 10000))
      for (let i = 0; i < count; i++) particles.push(new Particle())
      for (let i = 0; i < 5; i++) glowSpots.push(new GlowSpot())
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      glowSpots.forEach(gs => { gs.update(); gs.draw() })
      particles.forEach(p => { p.update(); p.draw() })
      animationFrameId = requestAnimationFrame(animate)
    }

    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()
    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0 bg-transparent overflow-hidden" 
    />
  )
}
