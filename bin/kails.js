import Promise from 'bluebird'
import path from 'path'
import fs from 'fs'
import ejs from 'ejs'
import colors from 'colors'
import fsextra from 'fs-extra'
import mkdirp from 'mkdirp'
import program from 'commander'
import pkg from '../package.json'

const fse = Promise.promisifyAll(fsextra)

const MODE_0666 = parseInt('0666', 8)
const MODE_0755 = parseInt('0755', 8)
const filter = ['docs', 'node_modules', 'templates', 'kails.js']

program
  .version(pkg.version)
  .usage('[options] [dir]')
  .option('-create, --createApp []', 'create app')
  .option('-C,      --controller []', 'create controller')
  .option('-M,      --modal []', 'create modal')
  .option('-R,      --resource []', 'create resource')
  .parse(process.argv);

// if (program.createApp) console.log(program.createApp)
// if (program.controller) console.log(program.controller)
// if (program.modal) console.log('  - pineapple')

const isEjs = (filename) => /\.ejs$/i.test(filename)

const extName = (filename) => /\.[^\.]+$/.exec(filename).shift()

const replaceEjs = (filename) => filename.replace(/\.ejs$/i, '')

const loadTemplate = (source, locals = {}) => {
  const contents = fs.readFileSync(source, 'utf-8')
  return ejs.render(contents, locals)
}

colors.setTheme({
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

const createApplication = (appName = 'myApp', appPath = '../templates/') => {
  return async (locals = { app: 'myApp'}) => {
    const readdir = Promise.promisify(fs.readdir)
    const fileStat = Promise.promisify(fs.stat)
    const rootPath = path.join(__dirname, appPath)
    const target = path.join(rootPath, `../${appName}/`)

    const reduceFloder = async (source, target) => {
      let list = await readdir(source)
      list.forEach(async (file) => {
        const floderPath = path.join(source, file)
        const ntarget = path.join(target, file)
        const tempStat = await fileStat(floderPath)
        if(tempStat.isDirectory()){
          await fse.mkdirs(ntarget)
          reduceFloder(floderPath, ntarget)
        } else {
          if (isEjs(ntarget)) {
            await fse.outputFile(replaceEjs(ntarget), loadTemplate(floderPath, locals))
          } else {
            await fse.copy(floderPath, ntarget)
          }
          console.log(`${'Create '.info + replaceEjs(ntarget).data}`)
        }
      })
    }

    await reduceFloder(rootPath, target)
  }
}

const app = createApplication()
app()
