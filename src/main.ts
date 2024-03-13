import { Visual } from './parts/visual'
import './style.css'

document.querySelectorAll('.js-canvas').forEach((el) => {
  new Visual({
    el:el,
    transparent:true,
  })
})

