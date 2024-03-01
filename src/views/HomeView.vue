<script setup>
import { Network } from 'vis-network'
import 'vis-network/styles/vis-network.css'

import { onMounted, ref, computed } from 'vue'

import CardComponent from '@/components/Card.js'
import mock from '@/components/mock.js'

const visRender = ref(null)
const network = ref(null)
const zoomstep = 0.5

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

const initVis = () => {
  const options = {
    physics: { stabilization: false },
    edges: { smooth: false },
    interaction: {
      navigationButtons: true,
      keyboard: true
    }
  }
  network.value = new Network(visRender.value, formatArray(), options)

  network.value.fit('zoom', function (params) {
    document.getElementById('selection').innerText = 'Selection: ' + params.nodes
  })
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
  return (network.value.getScale() * 100).toFixed(0) + '%';
})

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

  <p id="selection"></p>
</template>

<style scoped>
#mynetwork {
  width: 100%;
  height: 600px;
  border: 1px solid lightgray;
  background-color: #eeeeee;
}
</style>
