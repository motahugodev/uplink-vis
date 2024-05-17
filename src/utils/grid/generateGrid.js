const canvasColor = '#282c34'
const axisColor = '#ffffff'

export class Grid {
  width
  height
  axisPosX
  axisPosY
  cellSize

  lastAxisPosX
  lastAxisPosY

  minCellSize = 40
  canvas
  context

  zoom = 1
  zoomMin = 0
  zoomMax = 0
  opacityMin = 0
  opacityMax = 0

  gen = 1
  ratio = 4

  stdCanvasW

  constructor({ stdCanvasH, stdCanvasW, minCellSize, context, canvas }) {
    this.width = stdCanvasW
    this.height = stdCanvasH
    this.axisPosX = stdCanvasW / 2
    this.axisPosY = stdCanvasH / 2
    this.cellSize = minCellSize
    this.context = context
    this.canvas = canvas

    this.lastAxisPosX = stdCanvasW / 2
    this.lastAxisPosY = stdCanvasH / 2

    this.minCellSize = minCellSize

    this.stdCanvasW = stdCanvasW
  }

  setGridSizeInWorldCoordinates(worldWidth, worldHeight) {
    // Calculate the required cell size for the X and Y axes based on the desired world dimensions
    this.cellSize = this.stdCanvasW / worldWidth

    // Update gen and ratio for the X and Y axes
    this.gen = this.stdCanvasW / this.cellSize
    this.ratio = this.cellSize / this.minCellSize
  }

  calculateZoomState(delta) {
    this.cellSize = this.cellSize + delta
    // Limit the precision of the ratio variable
    this.ratio = parseFloat(this.ratio.toExponential(8))

    if (this.cellSize >= 2 * this.minCellSize) {
      if (Math.abs(Math.log2(this.gen)) % 3 === 0) {
        this.cellSize = 20
        this.gen *= 2
        this.ratio *= 2
      } else if (Math.abs(Math.log2(this.gen)) % 3 === 1) {
        this.cellSize = 16
        this.gen *= 2
        if (this.gen > 1) {
          this.ratio *= 2.5
        } else {
          this.ratio *= 2
        }
      } else if (Math.abs(Math.log2(this.gen)) % 3 === 2) {
        this.cellSize = 20
        this.gen *= 2
        if (this.gen > 1) {
          this.ratio *= 2
        } else {
          this.ratio *= 2.5
        }
      }
    } else if (this.cellSize < this.minCellSize / 2) {
      if (Math.abs(Math.log2(this.gen)) % 3 === 0) {
        this.ratio /= 2
        this.cellSize = 20
        this.gen /= 2
      } else if (Math.abs(Math.log2(this.gen)) % 3 === 1) {
        if (this.gen < 1) {
          this.ratio /= 2.5
        } else {
          this.ratio /= 2
        }

        this.cellSize = 16
        this.gen /= 2
      } else if (Math.abs(Math.log2(this.gen)) % 3 === 2) {
        if (this.gen < 1) {
          this.ratio /= 2
        } else {
          this.ratio /= 2.5
        }

        this.cellSize = 20
        this.gen /= 2
      }
    }
  }

  calculateZoomState2(delta) {
    const factor = 1

    this.cellSize = this.cellSize + delta
    // Limit the precision of the ratio variable
    this.ratio = parseFloat(this.ratio.toExponential(8))

    if (this.cellSize >= factor * this.minCellSize) {
      // reset if zoomed in;
      this.cellSize = 20
      this.gen *= factor
      this.ratio *= factor
    } else if (this.cellSize < this.minCellSize / factor) {
      this.ratio /= factor
      this.cellSize = 20
      this.gen /= factor
    }
  }

  draw() {
    this.context.fillStyle = canvasColor
    this.context.fillRect(0, 0, this.width, this.height)

    const minDivY = -Math.ceil(this.axisPosY / this.cellSize)
    const minDivX = -Math.ceil(this.axisPosX / this.cellSize)
    const maxDivY = Math.ceil((this.height - this.axisPosY) / this.cellSize)
    const maxDivX = Math.ceil((this.width - this.axisPosX) / this.cellSize)

    this.context.fillStyle = '#FFF'
    this.context.textAlign = 'left'
    this.context.fillText(
      `
      XAxis: ${minDivX}, ${maxDivX}
      YAxis: ${minDivY}, ${maxDivY}
      X Grid length: ${maxDivX - minDivX}
      Y Grid length: ${maxDivY - minDivY}
      `,
      50,
      50
    )
    this.context.fillText(
      `
      XAxis: ${minDivX / this.ratio}, ${maxDivX / this.ratio}
      YAxis: ${minDivY / this.ratio}, ${maxDivY / this.ratio}
      `,
      50,
      80
    )
    this.context.fillText(
      `
      Ratio: ${this.ratio}
      Gen: ${this.gen}
      CellSize: ${this.cellSize}
      `,
      50,
      100
    )

    for (let lineV = minDivY; lineV <= maxDivY; lineV++) {
      this.setGridLines('v', lineV)
      this.setGridValues('v', lineV)
    }

    for (let lineH = minDivX; lineH <= maxDivX; lineH++) {
      this.setGridLines('h', lineH)
      this.setGridValues('h', lineH)
    }

    this.setAxis()
  }

  setLineStyle(line) {
    if (line == 'axis') {
      // Les axes
      this.context.lineWidth = 1
      this.context.strokeStyle = axisColor
    } else {
      this.context.lineWidth = 0.5

      if (line % 8 === 0) {
        if (this.zoom > 0) {
          this.context.strokeStyle = 'rgba(250,250,250,0.9)'
        } else if (this.zoom < 0) {
          this.context.strokeStyle =
            'rgba(250,250,250,' + this.setOpacity(this.cellSize / this.minCellSize, 0.9, 0.6) + ')'
        }
      } else if (line % 4 === 0) {
        if (this.zoom > 0) {
          this.context.strokeStyle =
            'rgba(250,250,250,' + this.setOpacity(this.cellSize / this.minCellSize, 0.6, 0.9) + ')'
        } else if (this.zoom < 0) {
          this.context.strokeStyle =
            'rgba(250,250,250,' + this.setOpacity(this.cellSize / this.minCellSize, 0.6, 0.2) + ')'
        }
      } else {
        if (this.zoom > 0) {
          this.context.strokeStyle =
            'rgba(250,250,250,' + this.setOpacity(this.cellSize / this.minCellSize, 0, 0.14) + ')'
        } else if (this.zoom < 0) {
          this.context.strokeStyle =
            'rgba(250,250,250,' + this.setOpacity(this.cellSize / this.minCellSize, 0.05, 0) + ')'
        }
      }
    }
  }

  setGridLines(direction, line) {
    // Styler
    this.setLineStyle(line)

    if (direction === 'v') {
      // Tracer
      const y = this.axisPosY + this.cellSize * line
      this.context.beginPath()
      this.context.moveTo(0, y)
      this.context.lineTo(this.width, y)
    } else if (direction === 'h') {
      // Tracer
      const x = this.axisPosX + this.cellSize * line
      this.context.beginPath()
      this.context.moveTo(x, 0)
      this.context.lineTo(x, this.height)
    }

    this.context.stroke()
    this.context.closePath()
  }

  setGridValues(direction, line) {
    // Styler
    this.context.font = '12px Arial'
    this.context.fillStyle = '#aaaaaa'

    // Tracer
    this.context.beginPath()

    if (direction === 'v' && line % 4 === 0 && line !== 0) {
      let value = String(-line / this.ratio)
      let valueOffset = this.context.measureText(value).width + 15
      this.context.textAlign = 'right'

      if (this.axisPosX >= this.width) {
        this.context.fillText(value, this.width - 15, this.axisPosY - line * -this.cellSize + 3)
      } else if (this.axisPosX <= valueOffset + 15) {
        this.context.fillText(value, valueOffset, this.axisPosY - line * -this.cellSize + 3)
      } else {
        this.context.fillText(value, this.axisPosX - 15, this.axisPosY + line * this.cellSize + 3)
      }
    } else if (direction === 'h' && line % 4 === 0 && line !== 0) {
      let value = String(line / this.ratio)
      this.context.textAlign = 'center'

      if (this.axisPosY >= this.height - this.canvas.offsetTop) {
        this.context.fillText(value, this.axisPosX + line * this.cellSize, this.height - 20)
      } else if (this.axisPosY <= 0) {
        this.context.fillText(value, this.axisPosX + line * this.cellSize, 20)
      } else {
        this.context.fillText(value, this.axisPosX + line * this.cellSize, this.axisPosY + 20)
      }
    }

    this.context.closePath()
  }

  setAxis() {
    // Styler
    this.setLineStyle('axis')

    //Tracer
    this.context.beginPath()

    // Tracer l'horizontale
    this.context.moveTo(0, this.axisPosY)
    this.context.lineTo(this.width, this.axisPosY)
    // Tracer la verticale
    this.context.moveTo(this.axisPosX, 0)
    this.context.lineTo(this.axisPosX, this.height)

    this.context.stroke()
    this.context.closePath()

    // Numéroter le point 0
    this.context.font = '12px arial'
    this.context.fillStyle = '#aaaaaa'
    this.context.textAlign = 'center'
    this.context.beginPath()
    this.context.fillText('0', this.axisPosX - 15, this.axisPosY + 20)
    this.context.closePath()
  }

  setPan(mouseStartX, mouseStartY, mousePosX, mousePosY) {
    // As long as we pan, the (0;0) coordinate is not updated yet
    const beforeX = mouseStartX / this.cellSize
    const beforeY = mouseStartY / this.cellSize

    const afterX = mousePosX / this.cellSize
    const afterY = mousePosY / this.cellSize

    const deltaX = afterX - beforeX
    const deltaY = afterY - beforeY

    this.axisPosX = this.lastAxisPosX
    this.axisPosY = this.lastAxisPosY

    this.axisPosX += deltaX * this.cellSize
    this.axisPosY += deltaY * this.cellSize

    this.draw()
  }

  setZoom(zoom, mousePosX, mousePosY) {
    this.zoom = zoom
    // Calculate the mouse position before applying the zoom
    // in the coordinate system of the grid
    let beforeX = (mousePosX - this.axisPosX) / this.cellSize / this.ratio
    let beforeY = (mousePosY - this.axisPosY) / this.cellSize / this.ratio

    // check if zoom should subdivide or combine
    this.calculateZoomState(zoom)

    // After zoom, you'll see the coordinates changed
    let afterX = (mousePosX - this.axisPosX) / this.cellSize / this.ratio
    let afterY = (mousePosY - this.axisPosY) / this.cellSize / this.ratio

    // Calculate the shift
    const deltaX = afterX - beforeX
    const deltaY = afterY - beforeY

    // "Undo" the shift by shifting the coordinate system's center
    this.axisPosX += deltaX * this.cellSize * this.ratio
    this.axisPosY += deltaY * this.cellSize * this.ratio

    // Get last (0;0) coordinates
    this.lastAxisPosX = this.axisPosX
    this.lastAxisPosY = this.axisPosY
    this.draw()
  }

  setOpacity(zoomLevel, val1, val2) {
    if (this.zoom > 0) {
      this.opacityMin = val1
      this.opacityMax = val2
      this.zoomMin = 1
      this.zoomMax = 2
    } else if (this.zoom < 0) {
      this.opacityMin = val2
      this.opacityMax = val1
      this.zoomMin = 0.5
      this.zoomMax = 1
    }

    const zoomRange = this.zoomMax - this.zoomMin
    const opacityRange = this.opacityMax - this.opacityMin
    const zoomLevelPercent = (zoomLevel - this.zoomMin) / zoomRange
    const opacityLevel = opacityRange * zoomLevelPercent + this.opacityMin
    return opacityLevel
  }
}
