import React, { useEffect, useRef, useState } from 'react'
import styles from './MetricChart.module.css'
import commonStyles from '../../styles/CommonStyles.module.css'
import typographyStyles from '../../styles/Typography.module.css'
import * as d3 from 'd3'
import colorSetMem from './memory.module.css'
import colorSetCpu from './cpu.module.css'
import colorSetLatency from './latency.module.css'
import { xMargin, yMargin, yMarginWithoutXAxis, radiusDotsTooltip } from './chart_constants.js'
import { getTicks } from './utils.js'
import { POSITION_ABSOLUTE, POSITION_FIXED } from '../../ui-constants'
import { findY } from './chart_utils.js'

const MetricChart = ({
  data,
  unit,
  timeline,
  labels = [],
  colorSet = 'mem',
  percentiles = null,
  lowerMaxY = 10,
  yMin = 0,
  tooltipPosition = POSITION_ABSOLUTE
}) => {
  const svgRef = useRef()
  const tooltipRef = useRef()
  const keyForCheckMax = 'p99'
  const isBarChart = percentiles !== null

  const colorStyles = colorSet === 'mem' ? colorSetMem : colorSet === 'cpu' ? colorSetCpu : colorSetLatency
  const numberOfLines = isBarChart ? labels.length : labels.length

  // We assume the data is an array of objects with a time and a value
  // The setter is missing on purpose. We don't want to trigger a rerender when the mouse position changes
  const [mousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (svgRef.current && tooltipRef.current && data.length > 0) {
      const h = svgRef.current.clientHeight
      const w = svgRef.current.clientWidth
      const marginOnY = timeline ? yMargin : yMarginWithoutXAxis

      const svg = d3.select(svgRef.current)
      const tooltip = d3.select(tooltipRef.current)

      svg.selectAll('*').remove() // clean up the svg

      const effectiveWidth = w - (xMargin)
      const y = d3.scaleLinear([h - marginOnY, 0])
      const x = d3.scaleTime([xMargin, w])

      // We need to slice it here otherwise we cannot pause / resume the chart scrolling
      const latestData = [...data]
      const firstDatum = latestData[0]
      const lastDatum = latestData[latestData.length - 1]
      const firstTime = firstDatum.time
      const lastTime = lastDatum.time
      x.domain([firstTime, lastTime])

      if (isBarChart) {
        latestData.shift()
      }

      // We need to get the max y for all values to correctly set the y domain
      let allCurrentValues = []
      if (isBarChart) {
        allCurrentValues = [100]
        for (let i = 0; i < latestData.length; i++) {
          if (latestData[i][keyForCheckMax] !== null) {
            allCurrentValues.push(latestData[i][keyForCheckMax])
          }
        }
      } else {
        for (let i = 0; i < latestData.length; i++) {
          allCurrentValues.push(...latestData[i].values)
        }
      }

      const maxy = d3.max([d3.max(allCurrentValues), lowerMaxY])
      const yMax = maxy + (maxy * 0.1) // We add 10% to the max to have some space on top
      y.domain([yMin, yMax])
      const yAxisTickValues = [...getTicks(yMin, maxy, 2, false)]

      const timeRange = lastTime - firstTime
      const numberOfTicks = 7
      const tickValues = []
      for (let i = 0; i < numberOfTicks; i++) {
        const tickTime = new Date(firstTime.getTime() + (timeRange * (i / (numberOfTicks - 1))))
        tickValues.push(tickTime)
      }

      const yAxis = d3.axisLeft().scale(y).tickValues(yAxisTickValues)

      svg.attr('width', w)
        .attr('height', h)
        .append('g')
        .attr('transform', `translate(${xMargin}, ${xMargin})`)

      const $yAxis = svg
        .append('g')
        .attr('transform', `translate(${xMargin})`)

      svg.append('g')
        .attr('class', styles.grid)
        .call(d3.axisLeft(y).tickValues(yAxisTickValues).tickSize(-effectiveWidth).tickFormat(''))
        .attr('transform', `translate(${xMargin})`)
        .call(g => g.select('.domain').remove())

      $yAxis
        .call(yAxis)
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('.tick > line').remove())
        .attr('class', styles.axis)

      if (timeline) {
        const xAxis = d3.axisBottom()
          .scale(x)
          .tickValues(tickValues)
          .tickFormat(d3.timeFormat('%H:%M:%S'))
          .tickSizeOuter(0)
        const $xAxis = svg
          .append('g')
          .attr('transform', `translate(5, ${h - yMargin})`)
        $xAxis
          .call(xAxis)
          .call(g => g.select('.domain').remove())
          .call(g => g.selectAll('.tick > line').remove())
          .attr('class', styles.axis)
          .selectAll('text')
          .attr('dy', '1em')
          .style('text-anchor', 'start')
      }

      const paths = []
      const tooltipDots = []

      if (isBarChart) {
        const chart = svg.selectAll('.chart')
          .data(latestData)
          .enter()

        const barWidth = 2
        const barOffset = -(barWidth * 2)

        Object.keys(percentiles).forEach(percentile => {
          chart.append('rect')
            .attr('fill', percentiles[percentile])
            .attr('x', d => x(d.time) + barOffset)
            .attr('y', d => y(d[percentile] || 0))
            .attr('width', barWidth)
            .attr('height', d => h - marginOnY - y(d[percentile] || 0))
            .transition()
            .duration(1000)
        })
      } else {
        for (let i = 0; i < numberOfLines; i++) {
          paths.push(svg
            .append('path')
            .attr('class', `${styles.line} ${colorStyles[`color-${i}`]}`)
            .datum(latestData)
            .attr('d', d3.line()
              .x(p => x(p.time))
              .y((p) => y(p.values[i]))
              .curve(d3.curveBasis)
            )
            .transition()
            .duration(1000)
            .node()
          )

          tooltipDots.push(svg
            .append('circle')
            .attr('r', 5)
            .attr('class', colorStyles[`color-${i}`])
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .style('opacity', 0)
            .style('pointer-events', 'none')
          )
        }
      }

      if (isBarChart) {
        svg.on('mouseover pointermove', showBarTooltip)
          .on('pointerleave', hideBarTooltip)
        showBarTooltip()
      } else {
        svg.on('mouseover pointermove', showCircles)
          .on('pointerleave', hideCircles)
        showCircles()
      }

      function showCircles (event) {
        let xPos, yPos
        if (event) {
          [xPos, yPos] = d3.pointer(event)
          mousePosition.x = xPos
          mousePosition.y = yPos
        } else {
          if ((mousePosition.x === 0 && mousePosition.y === 0) || tooltipPosition === POSITION_FIXED) {
            return
          }
          xPos = mousePosition.x
          yPos = mousePosition.y
        }

        const time = (x.invert(xPos)).getTime()
        const closestIndex = d3.bisect(latestData.map(d => d.time), time)
        const data = latestData[closestIndex - 1] || latestData[0]
        if (!data) {
          return
        }
        for (let i = 0; i < numberOfLines; i++) {
          const path = paths[i]

          // if the pointer is out of the "data area"
          // (on the left or on the right)
          // hide the dots
          if (xPos < xMargin || xPos > (w - radiusDotsTooltip)) {
            tooltipDots[i].style('opacity', 0)
            continue
          }
          tooltipDots[i]
            .style('opacity', 1)
            .attr('cx', xPos)
            .attr('cy', findY(path, path.getTotalLength(), xPos, w))
            .raise()
        }

        // Prepare the tooltip
        const timeString = d3.timeFormat('%H:%M:%S.%L %p')(data.time)
        const valuesData = data.values.map((v, i) => {
          return {
            label: labels[i],
            value: Math.round(v * 100) / 100,
            colorSeparator: colorStyles[`background-color-${i}`]
          }
        })

        tooltip.html(`
        <div ${styles.tooltipContainer}>
          <div class="${styles.tooltipTime}">
            <div class="${typographyStyles.desktopBodySmallest} ${typographyStyles.textRichBlack} ${styles.time}">${timeString}</div>
          </div>
          <div class="${styles.tooltipTable}">
            ${valuesData.map(v => {
              return `
                <div class="${styles.tooltipLine}">
                  <div class="${commonStyles.tinyFlexRow} ${commonStyles.itemsCenter}">  
                    <hr class="${styles.verticalSeparatorTooltip} ${v.colorSeparator}" />
                    <div class="${typographyStyles.desktopBodySmallest} ${typographyStyles.textRichBlack}">${v.label}</div>
                  </div>
                  <div class="${styles.tooltipValueContainer}">
                    <div class="${typographyStyles.desktopBodySmallest} ${typographyStyles.textRichBlack} ${styles.tooltipValue}">${v.value}</div>
                    <div class="${typographyStyles.desktopBodySmallest} ${typographyStyles.textRichBlack} ${styles.tooltipUnit}">${unit}</div>
                  </div>
                </div>
            `
            }).join('')}
          </div>
        </div>`)

        const maxY = y(d3.max(data.values))
        displayTooltip(xPos, maxY, valuesData.length, event)
      }

      function hideCircles () {
        tooltipDots.forEach(t => t.style('opacity', 0))
        mousePosition.x = 0
        mousePosition.y = 0
        tooltip.style('opacity', 0)
      }

      function showBarTooltip (event) {
        let xPos, yPos
        if (event) {
          [xPos, yPos] = d3.pointer(event)
          mousePosition.x = xPos
          mousePosition.y = yPos
        } else {
          if ((mousePosition.x === 0 && mousePosition.y === 0) || tooltipPosition === POSITION_FIXED) {
            return
          }
          xPos = mousePosition.x
          yPos = mousePosition.y
        }

        const time = (x.invert(xPos)).getTime()
        const data = latestData.find(d => d.time.getTime() >= time)
        if (!data) {
          return
        }

        // Prepare the tooltip
        const timeString = d3.timeFormat('%H:%M:%S.%L %p')(data.time)
        const valuesData = labels.map((label, i) => {
          return {
            name: label.name,
            value: Math.round((data[label.value] || 0) * 100) / 100,
            colorSeparator: colorSetLatency[`background-color-${i}`]
          }
        })

        tooltip.html(`
        <div ${styles.tooltipContainer}>
          <div class="${styles.tooltipTime}">
            <div class="${typographyStyles.desktopBodySmallest} ${typographyStyles.textRichBlack} ${styles.time}">${timeString}</div>
          </div>
          <div class="${styles.tooltipTable}">
            ${valuesData.map(v => {
              return `
                <div class="${styles.tooltipLine}">
                  <div class="${commonStyles.tinyFlexRow} ${commonStyles.itemsCenter}">  
                    <hr class="${styles.verticalSeparatorTooltip} ${v.colorSeparator}" />
                    <div class="${typographyStyles.desktopBodySmallest} ${typographyStyles.textRichBlack}">${v.name}</div>
                  </div>
                  <div class="${styles.tooltipValueContainer}">
                    <div class="${typographyStyles.desktopBodySmallest} ${typographyStyles.textRichBlack} ${styles.tooltipValue}">${v.value}</div>
                    <div class="${typographyStyles.desktopBodySmallest} ${typographyStyles.textRichBlack} ${styles.tooltipUnit}">${unit}</div>
                  </div>
                </div>
            `
            }).join('')}
          </div>
        </div>`)

        const maxY = y(data[keyForCheckMax])
        displayTooltip(xPos, maxY, valuesData.length, event)
      }

      function hideBarTooltip () {
        mousePosition.x = 0
        mousePosition.y = 0
        tooltip.style('opacity', 0)
      }

      function displayTooltip (xPos, maxY, itemsCount, event) {
        const tooltipWidth = 160
        const tooltipHeight = itemsCount * 15
        let tx = xPos + tooltipWidth < w ? xPos : w - tooltipWidth
        let ty = maxY - (tooltipHeight + 30)

        if (tooltipPosition === POSITION_FIXED && event) {
          tx = event.clientX - (tooltipWidth / 2) - 50
          ty = svgRef.current.getBoundingClientRect().bottom - svgRef.current.getBoundingClientRect().height - tooltipHeight - 75 + maxY
        }

        tooltip.style('left', tx + 'px').style('top', ty + 'px')

        if (xPos < xMargin) {
          tooltip.style('opacity', 0)
        } else {
          tooltip.style('opacity', 0.9)
        }
      }
    }
  }, [svgRef, tooltipRef, data, isBarChart])

  return (
    <div className={`${commonStyles.tinyFlexBlock} ${commonStyles.fullWidth}`}>
      <svg
        ref={svgRef} style={{ width: '100%', height: '96px' }}
      />
      <div ref={tooltipRef} className={`${tooltipPosition === POSITION_ABSOLUTE ? styles.tooltipAbsolute : styles.tooltipFixed} ${styles.tooltip}`} />
    </div>
  )
}

export default MetricChart
