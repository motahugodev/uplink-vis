<script setup>
import { Network } from 'vis-network'
import 'vis-network/styles/vis-network.css'

import { onMounted, ref, computed, nextTick } from 'vue'

import CardComponent from '@/components/Card.js'
import mock from '@/components/mock.js'

const visRender = ref()
const network = ref(null)
const minimapWrapper = ref()
const minimapImage = ref(null)
const minimapRadar = ref(null)
const ratio = 5
const zoomstep = 0.5
var targetScale

const url = (item) => {
  return (
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
      CardComponent({
        cnpj: item.cnpj,

        color: propsCard(
          item.entity,
          item.entityStatus,
          item.adm,
          item.federalEmployee,
          item.badges
        )
      })
    )
  )
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

const formatArray = () => {
  const nodes = mock.map((item, index) => {
    return { ...item, id: index, image: url(item), shape: 'image' }
  })

  const edges = mock
    .map((item, index) => {
      return {
        from: 1,
        to: index,
        length: 300,
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
// Draw minimap Image
const drawMinimapImage = () => {
  // nextTick(() => {
  const originalCanvas = visRender.value.getElementsByTagName('canvas')[0]

  const { clientWidth, clientHeight } = network.value.body.container

  const tempCanvas = document.createElement('canvas')
  const tempContext = tempCanvas.getContext('2d')

  const width = Math.round((tempCanvas.width = clientWidth / ratio))
  const height = Math.round((tempCanvas.height = clientHeight / ratio))

  if (tempContext) {
    tempContext.drawImage(originalCanvas, 0, 0, width, height)
    minimapImage.value.src = tempCanvas.toDataURL()
    minimapImage.value.width = width
    minimapImage.value.height = height
  }
  // })
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

const initMinimap = () => {
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
    }, 100)

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
    drawRadar()
  }
}
const eventsVis = () => {
  network.value.on('resize', () => network.value.fit())
  network.value.on('dragStart', () => undimMinimap())
  network.value.on('dragEnd', () => dimMinimap())
  network.value.on('zoom', () => undimMinimap())
  network.value.on('afterDrawing', () => initMinimap())
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

const initVis = async () => {
  const options = {
    physics: { stabilization: false },
    edges: { smooth: false },
    interaction: {
      navigationButtons: true,
      keyboard: true
      // dragNodes: false,
    }
  }
  network.value = new Network(visRender.value, formatArray(), options)

  await nextTick(() => {
    initMinimap()
    eventsVis()
  })
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

  <div>
    <div
      @mousemove="moveMinimap"
      @click="moveMinimap"
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
      <!-- <img :src="teste" alt="" srcset=""> -->
    </div>
  </div>
</template>

<style scoped>
#mynetwork {
  width: 100%;
  height: 600px;
  border: 1px solid lightgray;
  background-color: #eeeeee;
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
