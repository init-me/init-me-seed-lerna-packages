const seed = require('../index')
const path = require('path')
const extFs = require('yyl-fs')
const util = require('yyl-util')
const fs = require('fs')

it('hooks test', async() => {
  const SEED_PATH = path.join(__dirname, '../seeds')
  const FRAG_PATH = path.join(__dirname, '../../__frag')

  const env = {
    type: 'base',
    name: '1',
    version: '0.1.0',
    noinstall: true,
    silent: true
  }

  await extFs.removeFiles(FRAG_PATH)
  await extFs.mkdirSync(FRAG_PATH)

  // 清除 seed 包里面的 node_modules 文件夹
  const types = fs.readdirSync(SEED_PATH).filter((iPath) => {
    return !(/^\./.test(iPath))
  })

  await util.forEach(types, async (type) => {
    const nodePath = path.join(SEED_PATH, type,  'node_modules')
    if (fs.existsSync(nodePath)) {
      await extFs.removeFiles(nodePath, true)
    }
  })

  // check hooks.beforeStart
  await seed.hooks.beforeStart({
    env,
    targetPath: FRAG_PATH
  })
  expect(seed.path).toEqual(path.join(SEED_PATH, 'base'))

  const fileMap = {}
  const files = await extFs.readFilePaths(seed.path)
  files.forEach((iPath) => {
    fileMap[iPath] = [path.resolve(FRAG_PATH, path.relative(seed.path, iPath))]
  })

  // check hooks.beforeCopy
  const rMap = await seed.hooks.beforeCopy({
    fileMap,
    targetPath: FRAG_PATH
  })
  expect(rMap[path.join(seed.path, 'gitignore')]).toEqual([path.join(FRAG_PATH, '.gitignore')])
  expect(rMap[path.join(seed.path, 'npmignore')]).toEqual([path.join(FRAG_PATH, '.npmignore')])

  await extFs.copyFiles(rMap)

  // check hooks.afterCopy
  await seed.hooks.afterCopy({ targetPath: FRAG_PATH, fileMap: rMap, env })

  await extFs.removeFiles(FRAG_PATH, true)
})