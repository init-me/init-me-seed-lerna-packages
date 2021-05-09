const inquirer = require('inquirer')
const extOs = require('yyl-os')
const fs = require('fs')
const path = require('path')
const rp = require('yyl-replacer')
const print = require('yyl-print')
const { mkdirSync } = require('yyl-fs')
const util = require('yyl-util')

const SEED_PATH = path.join(__dirname, './seeds')

const lang = {
  QUEATION_SELECT_TYPE: '请选择构建方式',
  QUESTION_NAME: 'packages 名称',
  QUESTION_PATH: 'packages 路径',
  QUESTION_VERSION: 'packages 版本',

  TYPE_ERROR: 'env.type 不存在',

  FORMAT_FILE_START: '正在格式化文件',
  FORMAT_FILE_FINISHED: '格式化文件 完成',

  NPM_INSTALL_START: '正在安装依赖',
  NPM_INSTALL_FINISHED: '安装依赖 完成'
}

let initData = {
  name: '',
  path: '',
  version: '',
  type: '',
  targetPath: ''
}

const config = {
  path: './seeds/base',
  hooks: {
    /**
     * seed 包执行前 hooks
     * 可以通过 inquirer 配置成多个 seed 包
     * @param  targetPath: string 复制目标路径 cwd
     * @param  env       : {[argv: string]: string} cmd 参数
     * @return Promise<any>
     * beforeStart({env, targetPath})
     */
    async beforeStart({ env, targetPath }) {
      const questions = []

      const pkgPath = path.join(targetPath, 'package.json')
      let pkg = {}
      if (fs.existsSync(pkgPath)) {
        pkg = require(pkgPath)
      }
      const lernaConfigPath = path.join(targetPath, 'lerna.json')
      let lernaConfig = {}

      if (fs.existsSync(lernaConfigPath)) {
        lernaConfig = require(lernaConfigPath)
      }

      // + name
      if (env && env.name) {
        initData.name = env.name
      } else {
        let defaultName = 'mypackage'
        if (pkg.name) {
          defaultName = pkg.name
        }
        questions.push({
          type: 'input',
          name: 'name',
          default: defaultName,
          message: `${lang.QUESTION_NAME}:`
        })
      }
      // - name

      

      // + path
      if (env.path) {
        initData.path = env.path
      } else {
        let defaultPath = './packages'
        if (lernaConfig?.packages.length) {
          defaultPath = lernaConfig?.packages[0].replace(/\*$/, '')
        }
        questions.push({
          type: 'input',
          name: 'path',
          default: defaultPath,
          message: `${lang.QUESTION_PATH}`
        })
      }
      // - path

      // + version
      if (env.version) {
        initData.version = env.version
      } else {
        let defaultVersion = '0.1.0'
        if (lernaConfig.version && lernaConfig.version !== 'independent') {
          defaultVersion = lernaConfig.version
        }
        questions.push({
          type: 'input',
          name: 'version',
          default: defaultVersion,
          message: `${lang.QUESTION_VERSION}`
        })
      }
      // - version

      // + type
      const types = fs.readdirSync(SEED_PATH).filter((iPath) => {
        return !(/^\./.test(iPath))
      })
      if (types.length === 1) {
        initData.type = types[0]
      } else {
        if (env && env.type) {
          if (types.indexOf(env.type) !== -1) {
            initData.type = env.type
          } else {
            throw new Error(`${lang.TYPE_ERROR}: ${env.type}`)
          }
        } else {
          questions.push({
            type: 'list',
            name: 'type',
            message: `${lang.QUEATION_SELECT_TYPE}:`,
            default: types[0],
            choices: types
          })
        }
      }
      // - type

      if (questions.length) {
        const r = await inquirer.prompt(questions)
        if (r.name) {
          initData = Object.assign(initData, r)
        }
      }
      initData.targetPath = path.join(targetPath, initData.path, initData.name)

      config.path = path.join(SEED_PATH, initData.type)
    },
    /**
     * 复制操作前 hooks
     * 可以在此执行重命名，调整模板路径操作
     * @param  fileMap   : {[oriPath: string]: string[]} 复制操作映射表
     * @param  targetPath: string 复制目标路径 cwd
     * @param  env       : {[argv: string]: string} cmd 参数
     * @return Promise<fileMap>
     * beforeCopy({fileMap, targetPath})
     */
    beforeCopy({fileMap, targetPath}) {
      if (!fs.existsSync(initData.targetPath)) {
        mkdirSync(initData.targetPath)
      }

      Object.keys(fileMap).forEach((key) => {
        fileMap[key] = fileMap[key].map((iPath) => {
          return path.join(initData.targetPath, path.relative(targetPath, iPath))
        })
      })

      return Promise.resolve(fileMap)
    },
    /**
     * 复制操作后 hooks
     * 可以在在此执行 项目初始化如 npm install 操作
     * @param  fileMap   : {[oriPath: string]: string[]} 复制操作映射表
     * @param  targetPath: string 复制目标路径 cwd
     * @param  env       : {[argv: string]: string} cmd 参数
     * @return Promise<any>
     * afterCopy({fileMap, targetPath, env })
     */
    async afterCopy({targetPath, env}) {
      if (env.silent) {
        print.log.setLogLevel(0)
      }

      // + package init
      const pkgPath = path.join(initData.targetPath, 'package.json')
      if (fs.existsSync(pkgPath)) {
        const oriPkgPath = path.join(targetPath, 'package.json')
        let oriPkg = {}
        if (fs.existsSync(oriPkgPath)) {
          oriPkg = require(oriPkgPath)
        }
        const pkg = require(pkgPath)
        pkg.name = initData.name
        pkg.version = initData.version
        if (oriPkg.repository) {
          pkg.repository = oriPkg.repository
        }

        if (oriPkg.author) {
          pkg.author = oriPkg.author
        }

        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
      }
      // - package init

      // + init
      if (!env || !env.noinstall) {
        await extOs.runSpawn('yarn init', initData.targetPath)
      }
      // - init
    }
  }
}

module.exports = config