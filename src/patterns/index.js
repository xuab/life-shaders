import dat from 'dat.gui'
import * as rle from './rle'

const contexts = {
  agars: require.context('./agars', true, /\.rle$/),
  guns: require.context('./guns', true, /\.rle$/),
  puffers: require.context('./puffers', true, /\.rle$/),
  sawtooths: require.context('./sawtooths', true, /\.rle$/),
  wicks: require.context('./wicks', true, /\.rle$/),
  spacefillers: require.context('./spacefillers', true, /\.rle$/),
  //unclassified: require.context('./unclassified', true, /\.rle$/),
}

const repo = Object.entries(contexts).reduce((acc, [type, ctx]) => ({
  ...acc,
  [type]: ctx.keys().reduce((acc, key) => {
    const name = key.slice(2, -4)
    return {
      names: [...acc.names, name],
      patterns: {
        ...acc.patterns,
        [name]: rle.parse(ctx(key)),
      },
    }
  }, {
    names: [],
    patterns: {},
  }),
}), {})

//console.log(repo)

const state = {
  type: 'agars',
}

const gui = new dat.GUI({hideable: false})
gui.domElement.style.margin = 0
const f = gui.addFolder('pattern')
f.open()
const setFolderName = name => f.domElement.querySelector('.title').innerHTML =
  `pattern: <span class='strong'>${name}</span>`

Object.keys(contexts).forEach(type => {
  state[type] = repo[type].names[0]
  const controller = f.add(state, type, repo[type].names)
  controller.onChange(e => {
    state.type = type
    setFolderName(e)
  })
  controller.listen()
  controller.domElement.addEventListener('click', () => {
    state.type = type
    setFolderName(state[state.type])
  })
})
state.agars = 'onionrings'
setFolderName(state[state.type])

const transforms = {
  identity: l => l,
  hFlip: l => l.map(([x, y]) => [-x, y]),
  vFlip: l => l.map(([x, y]) => [x, -y]),
  hvFlip: l => l.map(([x, y]) => [-x, -y]),
  rotate: l => l.map(([x, y]) => [y, x]),
}

const randEl = l => l[Math.floor(Math.random() * l.length)]
const randTransform = () => randEl(Object.values(transforms))
export const random = () => randTransform()(repo[state.type].patterns[state[state.type]])
