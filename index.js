#!/usr/bin/env node

const fs = require('fs')
const cheerio = require('cheerio')
const camelcase = require('camelcase')
const path = require('path')
const mkdirp = require('mkdirp')
const forEach = require('lodash.foreach')
const titleize = require('titleize')
const minimist = require('minimist')

const argv = minimist(process.argv.slice(2))
const src = argv._.slice(0, argv._.length - 1)
const distDir = argv._.pop()

if (!src || !distDir) {
  throw new Error('Please check you argument.')
}

const cleanAtrributes = ($el, $) => {
  const attrs = ['xlink:href', 'clip-path', 'fill-opacity', 'fill']

  forEach(attrs, (attr) => {
    $el.removeAttr(attr)
  })

  if ($el.children().length === 0) {
    return false
  }

  $el.children().each((index, el) => {
    cleanAtrributes($(el), $)
  })
}

const createComponentString = (viewBox, iconSvg, id) => {
  const name = titleize(id).replace(/[-]/g, '');

  return `import React from 'react';
import { Icon } from '@chakra-ui/react';

export const ${name} = (props) => (
  <Icon viewBox="${viewBox}" {...props}>
    ${iconSvg}
  </Icon>
);
`
}

mkdirp(distDir, (err) => {
  if (err) throw new Error('Error creating icons directory.')

  src.forEach((iconPath) => {
    const id = path.basename(iconPath, '.svg')
    const svg = fs.readFileSync(iconPath, 'utf-8')
    let $ = cheerio.load(svg, {
      xmlMode: true
    })
    const $svg = $('svg')
    // disable cleanAtrributes in favour of svg source optimisation step i.e. svgo
    // cleanAtrributes($svg, $)
    const iconSvg = $svg.html()
    const viewBox = $svg.attr('viewBox')
    const componentString = createComponentString(viewBox, iconSvg, id)

    fs.writeFileSync(path.join(distDir, camelcase(id) + '.js'), componentString, 'utf-8')
  })
})
