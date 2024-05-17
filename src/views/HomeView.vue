<script setup>
import { Network } from 'vis-network'
import { DataSet } from 'vis-data'
import 'vis-network/styles/vis-network.css'

import { onMounted, ref, computed, nextTick } from 'vue'

import CardComponent from '@/components/Card.js'
import mock from '@/components/mock.js'

const visRender = ref()
const network = ref(null)
const data = ref({
  nodes: [],
  edges: []
})
const minimapWrapper = ref()
const minimapImage = ref(null)
const minimapRadar = ref(null)
const isPreview = ref(false)
const ratio = 5
const zoomstep = 0.5

const options = ref({
  physics: {
    enabled: false,
    maxVelocity: 80,
    timestep: 2
  },
  edges: { smooth: false }
})

const isGrid = ref(false)

var targetScale

const onCard = (item) => {
  const createCard = CardComponent({
    cnpj: item.cnpj,
    color: propsCard(item.entity, item.entityStatus, item.adm, item.federalEmployee, item.badges)
  })

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(createCard)
}

const propsCard = (entity, entityStatus, adm, federalEmployee, badges) => {
  let color = ''
  switch (true) {
    case entityStatus:
      color = '#CCCCCC'
      break
    case federalEmployee:
      color = '#FBC105'
      break
    case badges == 'PEP':
      color = '#D77B0A'
      break
    case badges == 'PEP' && adm:
      color = '#FF685D'
      break
    case entity == 'naturalPerson':
      color = '#0A9E5A'
      break
    case entity == 'naturalPerson' && adm:
      color = '#54D088'
      break
    case entity == 'legalPerson':
      color = '#0D5FC2'
      break
    case entity == 'branch':
      color = '#4D90FF'
      break
    case entity == 'branch' && adm:
      color = '#54D088'
      break

    default:
      break
  }

  return color
}

const lineVariation = (child) => {
  let config = {
    font: {
      size: 6,
      color: '#0f172a',
      face: 'Arial',
      // background: '#f1f5f9',
      align: 'middle',
      multi: 'html',
      vadjust: -10
    },
    arrows: {
      middle: {
        enabled: true,
        type: 'circle',
        scaleFactor: 0.5
      }
    },
    dashes: false
  }

  if (child) {
    config.arrows.to = {
      enabled: true,
      type: 'arrow',
      scaleFactor: 0.5
    }
    config.dashes = true
  }
  return config
}

const nodesConfig = (item, index) => {
  const size = {
    card: 30,
    circle: 10
  }

  const mode = isPreview.value
    ? { label: null, image: onCard(item), shape: 'image', size: size.card }
    : { label: item?.name, shape: 'dot', size: size.circle }

  const config = {
    ...item,
    ...mode,
    id: index
  }
  return config
}

const formatArray = () => {
  const nodes = mock.map((item, index) => {
    return nodesConfig(item, index)
  })

  const edges = mock
    .map((item, index) => {
      return {
        from: 1,
        to: index,
        length: 400,
        label: `<b>TESTE</b>`,
        ...lineVariation(item.adm),
        color: propsCard(
          item.entity,
          item.entityStatus,
          item.adm,
          item.federalEmployee,
          item.badges
        )
      }
    })
    .filter((item) => item.to > 1)

  return { nodes, edges }
}

const fullScreen = () => {
  if (!document.mozFullScreen && !document.webkitFullScreen) {
    if (visRender.value.mozRequestFullScreen) {
      visRender.value.mozRequestFullScreen()
    } else {
      visRender.value.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT)
    }
  } else {
    if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    } else {
      document.webkitCancelFullScreen()
    }
  }
}

const zoomIn = () => {
  const options = {
    scale: network.value.getScale() - zoomstep,
    animation: {
      duration: 500,
      easingFunction: 'easeInOutQuad'
    }
  }

  network.value.moveTo(options)
}

const zoomOut = () => {
  const options = {
    scale: network.value.getScale() + zoomstep,
    animation: {
      duration: 500,
      easingFunction: 'easeInOutQuad'
    }
  }

  network.value.moveTo(options)
}

const zoomDefault = () => {
  const options = {
    animation: {
      duration: 500,
      easingFunction: 'easeInOutQuad'
    }
  }

  network.value.fit(options)
}

const zoomPorcetage = computed(() => {
  if (!network.value) return
  return (network.value.getScale() * 100).toFixed(0) + '%'
})

const drawMinimapWrapper = () => {
  const { clientWidth, clientHeight } = network.value.body.container

  const width = Math.round(clientWidth / ratio)
  const height = Math.round(clientHeight / ratio)

  minimapWrapper.value.style.width = `${width}px`
  minimapWrapper.value.style.height = `${height}px`
}

const drawMinimapImage = () => {
  const originalCanvas = visRender.value.getElementsByTagName('canvas')[0]

  const { clientWidth, clientHeight } = network.value.body.container

  const tempCanvas = document.createElement('canvas')
  const tempContext = tempCanvas.getContext('2d')

  const width = Math.round((tempCanvas.width = clientWidth / ratio))
  const height = Math.round((tempCanvas.height = clientHeight / ratio))

  if (tempContext) {
    tempContext.drawImage(originalCanvas, 0, 0, width, height)
    minimapImage.value.src = tempCanvas.toDataURL()
    console.log('🚀 ~ drawMinimapImage ~ minimapImage.value.src:', minimapImage.value.src)

    minimapImage.value.width = width
    minimapImage.value.height = height
    tempContext.save()
  }
}

const drawRadar = () => {
  const { clientWidth, clientHeight } = network.value.body.container
  const scale = network.value.getScale()
  const translate = network.value.getViewPosition()
  minimapRadar.value.style.transform = `translate(${
    (translate.x / ratio) * targetScale
  }px, ${(translate.y / ratio) * targetScale}px) scale(${targetScale / scale})`
  minimapRadar.value.style.width = `${clientWidth / ratio}px`
  minimapRadar.value.style.height = `${clientHeight / ratio}px`
}

const dimMinimap = () => {
  minimapWrapper.value.classList.remove('minimapWrapperMove')
  minimapWrapper.value.classList.add('minimapWrapperIdle')
}

const undimMinimap = () => {
  minimapWrapper.value.classList.remove('minimapWrapperIdle')
  minimapWrapper.value.classList.add('minimapWrapperMove')
}

const initMinimap = (is) => {
  const { clientWidth, clientHeight } = network.value.body.container
  const width = Math.round(clientWidth / ratio)
  const height = Math.round(clientHeight / ratio)
  // Initial render

  if (!minimapImage.value.hasAttribute('src') || minimapImage.value.src === '') {
    if (!minimapWrapper.value.style.width || !minimapWrapper.value.style.height) {
      drawMinimapWrapper()
    }

    setTimeout(() => {
      drawMinimapImage()
    }, 200)

    drawRadar()
    targetScale = network.value.view.targetScale
  } else if (
    minimapWrapper.value.style.width !== `${width}px` ||
    minimapWrapper.value.style.height !== `${height}px`
  ) {
    minimapImage.value.removeAttribute('src')
    drawMinimapWrapper()

    network.value.fit()
  } else {
    if (!is) {
      // setTimeout(() => {
        drawMinimapImage()
      // }, 200)
    }

    drawRadar()
  }
}

const createGrid = (ctx) => {
  if (!isGrid.value) return

  const width = ctx.canvas.clientWidth
  const height = ctx.canvas.clientHeight
  const spacing = 60
  const gridExtentFactor = 24
  const lineColor = 'lightgrey'
  ctx.strokeStyle = lineColor

  ctx.beginPath()

  for (var x = -width * gridExtentFactor; x <= width * gridExtentFactor; x += spacing) {
    ctx.moveTo(x, height * gridExtentFactor)
    ctx.lineTo(x, -height * gridExtentFactor)
  }

  for (var y = -height * gridExtentFactor; y <= height * gridExtentFactor; y += spacing) {
    ctx.moveTo(width * gridExtentFactor, y)
    ctx.lineTo(-width * gridExtentFactor, y)
  }

  ctx.stroke()
}

const activeGrid = () => (isGrid.value = !isGrid.value)

const eventsVis = () => {
  network.value.on('resize', () => network.value.fit())
  network.value.on('dragStart', () => undimMinimap())
  network.value.on('dragEnd', () => {
    dimMinimap()
    // updateOptions()
  })
  network.value.on('zoom', () => undimMinimap())
  network.value.on('afterDrawing', () => initMinimap(true))
  network.value.on('beforeDrawing', (ctx) => {
    // ctx = grid.value.context
    createGrid(ctx)
  })
}

const moveMinimap = (e) => {
  if (e.buttons == 1 || e.type == 'click') {
    e.preventDefault()
    undimMinimap()
    const rect = minimapWrapper.value.getBoundingClientRect()
    const x = ((e.clientX - rect.left - rect.width / 2) * ratio) / targetScale
    const y = ((e.clientY - rect.top - rect.height / 2) * ratio) / targetScale
    network.value.moveTo({ position: { x, y } })
  }
}

const modePrewiew = () => {
  isPreview.value = isPreview.value = !isPreview.value
  data.value.nodes.update(formatArray().nodes)
  initMinimap()
}

const initVis = async () => {
  data.value = {
    nodes: new DataSet(formatArray().nodes),
    edges: new DataSet(formatArray().edges)
  }
  network.value = new Network(visRender.value, data.value, options.value)

  await nextTick(() => {
    initMinimap()
    eventsVis()
  })
}

const updateReorganize = () => {
  const time = 250
  options.value.physics.enabled = true

  network.value.setOptions(options.value)

  setTimeout(() => {
    options.value.physics.enabled = false
    network.value.setOptions(options.value)
  }, time)
}

onMounted(() => {
  initVis()
})
</script>

<template>
  <div ref="visRender" id="mynetwork"></div>
  <p>{{ zoomPorcetage }}</p>
  <button @click="fullScreen()">FULLSCREEN</button>
  <button @click="zoomIn()">Zoom In</button>
  <button @click="zoomOut()">Zoom Out</button>
  <button @click="zoomDefault()">Zoom Default</button>
  <button @click="activeGrid()">Grid</button>
  <button @click="updateReorganize()">Reoganizar</button>
  <button @click="modePrewiew()">{{ isPreview ? 'Modo Card' : 'Modo Simples' }}</button>

  <div
    @click="moveMinimap"
    @mousemove="moveMinimap"
    @mouseup="dimMinimap()"
    ref="minimapWrapper"
    style="
      position: absolute;
      margin: 5px;
      border: 1px solid #ddd;
      overflow: hidden;
      background-color: #fff;
      z-index: 9;
    "
    class="minimapWrapperIdle"
  >
    <img ref="minimapImage" class="minimapImage" />
    <div ref="minimapRadar" class="minimapRadar"></div>
  </div>
</template>

<style scoped>
#mynetwork {
  width: 100%;
  height: 600px;
  border: 1px solid lightgray;
  background-color: #f3f4f6;
  z-index: 0;
}
canvas {
  height: 100%;
}

.minimapRadar {
  position: absolute;
  background-color: rgba(16, 84, 154, 0.26);
  cursor: move;
}

.minimapImage {
  position: absolute;
}

.minimapWrapperIdle {
  opacity: 0.2;
  transition: opacity 0.5s;
}

.minimapWrapperMove {
  opacity: 0.95;
  transition: opacity 0.5s;
}
</style>
